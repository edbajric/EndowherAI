"""
ML engine – singleton that holds the stacking model + scaler + LIME background.

Lifecycle:
  load_model()  called once in main.py lifespan (startup).
  get_engine()  called by route handlers; raises if not yet loaded.

Column names are loaded directly from the .joblib artifact so they always
match exactly what the scaler / model were trained on (Unicode quotes,
stripped newlines, etc.) — no hardcoded strings here.

Pseudonymisation domain:
  No user-identifiable data touches this module.  The feature vector is
  built from symptom scores only; the calling route passes only the
  pseudonym_id to Supabase for logging, never to this engine.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd

log = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# API field → partial column-name keyword mapping
#
# Values are short, unique substrings of the actual model column names.
# The engine resolves the full name at load time via _resolve_col(),
# so Unicode quote variants, trailing newlines, etc. are never a problem.
# ─────────────────────────────────────────────────────────────────────────────
_API_FIELD_KEYWORDS: dict[str, str] = {
    # Pain scales (0-10)
    "period_pain":          "Period pain / cramps",
    "pelvic_pain":          "Pelvic pain outside your period",
    "abdominal_pain":       "Abdominal pain or pressure",
    "lower_back_pain":      "Lower back pain related",
    "hip_leg_pain":         "Hip or leg pain related",
    "sharp_pelvic_pain":    "Sharp or stabbing pelvic",
    "painful_ovulation":    "Painful ovulation",
    "overall_chronic_pain": "Overall chronic pain level",
    "quality_of_life":      "how much do your symptoms affect your quality of life",
    # Symptom patterns
    "heavy_bleeding":           "heavy or extreme menstrual bleeding",
    "pain_during_sex":          "pain or burning during sexual intercourse",
    "pain_after_sex":           "pain after sexual intercourse",
    "painful_bowel_movements":  "painful bowel movements",
    "urinary_pain":             "pain or burning when urinating",
    "bloating_frequency":       "endo belly",
    "dizziness":                "dizziness or fainting",
    "headaches_migraines":      "headaches or migraines",
    "mood_anxiety_depression":  "mood swings, anxiety or depression",
    "fatigue":                  "very tired or exhausted",
    "cycle_regularity":         "menstrual cycle pattern",
    # Age and BMI are excluded: age creates a large spurious jump at age 25
    # (model split point), pushing even zero-symptom users to 76%+ risk.
    # BMI is excluded because it wasn't in the original user survey context.
    # Treatment behaviours (0-10 effectiveness ratings)
    "anti_inflammatory_diet":  "Anti",
    "pelvic_floor_physio":     "Pelvic floor",
}

# Risk thresholds — calibrated against the model's actual output range.
# Without age/bmi in the vector, blank inputs ≈ 44-45% (model prior on
# balanced data). Mild symptoms stay below 48%; moderate symptoms 48-68%;
# severe multi-symptom profiles exceed 68%.
_RISK_THRESHOLDS = [
    (0.68, "High"),
    (0.48, "Moderate"),
    (0.00, "Low"),
]

# Pain column keywords used to recompute composite features
_PAIN_KEYWORDS = [
    "Period pain / cramps",
    "Pelvic pain outside your period",
    "Abdominal pain or pressure",
    "Lower back pain related",
    "Hip or leg pain related",
    "Sharp or stabbing pelvic",
    "Painful ovulation",
    "Overall chronic pain level",
]


# ─────────────────────────────────────────────────────────────────────────────
# Engine singleton
# ─────────────────────────────────────────────────────────────────────────────
class _MLEngine:
    def __init__(self) -> None:
        self._model        = None
        self._scaler       = None
        self._feature_cols : list[str] = []
        self._col_idx      : dict[str, int] = {}
        self._defaults     : dict[str, float] = {}
        self._background   : Optional[np.ndarray] = None
        self._api_field_map: dict[str, str] = {}
        self._loaded       = False

    # ── Startup ──────────────────────────────────────────────────────────────

    def load(self) -> None:
        path = self._resolve_path()
        art  = joblib.load(path)

        self._model        = art["model"]
        self._scaler       = art["scaler"]
        self._feature_cols = art["feature_cols"]          # exact Unicode names from artifact
        self._col_idx      = {col: i for i, col in enumerate(self._feature_cols)}
        self._defaults     = art.get("feature_defaults_raw", {})
        self._background   = art.get("background_scaled")

        # Build API field → exact column name map using substring matching
        self._api_field_map = self._build_field_map()

        self._loaded = True
        log.info(
            "EndoWherAI model loaded  path=%s  features=%d  mapped_api_fields=%d",
            path, len(self._feature_cols), len(self._api_field_map),
        )

    @staticmethod
    def _resolve_path() -> Path:
        env = os.getenv("ENDOWHER_MODEL_PATH")
        if env:
            return Path(env)
        # backend/app/ml/engine.py → parents[3] = EndowherAI project root
        root = Path(__file__).resolve().parents[3]
        return root / "machine-learning" / "outputs" / "endowher_stacking_model.joblib"

    def _resolve_col(self, keyword: str) -> Optional[str]:
        """
        Find the column name that matches `keyword` (case-insensitive).
        Exact match wins over substring match so that short keywords like
        "Age" or "BMI" don't accidentally bind to longer column names that
        merely contain the word (e.g. "At what age did you have your first
        period?" should never be resolved by the keyword "Age").
        """
        kw_lower = keyword.lower()
        # 1. Exact match (stripped to be safe)
        for col in self._feature_cols:
            if col.strip().lower() == kw_lower:
                return col
        # 2. Substring match as fallback
        for col in self._feature_cols:
            if kw_lower in col.lower():
                return col
        return None

    def _build_field_map(self) -> dict[str, str]:
        """Resolve every API field to its exact artifact column name."""
        mapping: dict[str, str] = {}
        for api_key, keyword in _API_FIELD_KEYWORDS.items():
            col = self._resolve_col(keyword)
            if col:
                mapping[api_key] = col
            else:
                log.warning("API field '%s' — keyword '%s' not found in feature_cols", api_key, keyword)
        return mapping

    # ── Public API property (for use in the route) ───────────────────────────

    @property
    def API_FIELD_MAP(self) -> dict[str, str]:
        return self._api_field_map

    def _assert_loaded(self) -> None:
        if not self._loaded:
            raise RuntimeError("ML engine not loaded – call load_model() at startup.")

    # ── Feature vector construction ──────────────────────────────────────────

    def _build_raw_vector(self, api_inputs: dict[str, float]) -> np.ndarray:
        """
        Build a full N-feature raw-space vector.

        Strategy
        --------
        1. Start with **zeros** — the correct "no symptom / not tried / not
           applicable" baseline for the vast majority of the 93 features.
           Using training-distribution medians for all unmapped features would be
           wrong: the ~45 remedy-effectiveness columns have non-zero medians
           (training cohort actively tried remedies), so seeding them at median
           falsely tells the model "this person is treating a condition" → 97 %.

        2. For the small set of features where raw = 0 is **physically impossible
           or out-of-distribution** (diagnosis-delay columns, age at first period),
           override with the training median.  These features scaled from raw = 0
           produce values far outside the scaler's fitted range, causing LIME to
           flag them as the top contributors even though the user never provided
           them.  The training median is the appropriate "neutral / not applicable"
           value for these columns.

        3. Override all API-mapped features with user-provided values (or keep
           them at 0 if the user left them at the default of 0).

        4. Recompute derived composite features (pain_composite_*, symptom_burden).
        """
        # Step 1: baseline = zeros
        vec = np.zeros(len(self._feature_cols), dtype=float)

        # Step 2: plug training-median only for age-at-menarche, where 0 is
        # physically impossible.  Diagnosis-delay columns stay at 0 ("not yet
        # diagnosed / not applicable") — their scaler min is 0 so this is
        # in-distribution.  Setting them to their training median (3.4 years)
        # would imply the user has been managing symptoms for 3+ years and
        # would suppress ALL predictions, even for severe symptom profiles.
        _NEEDS_MEDIAN_KEYWORDS = [
            "at what age did you have your first period",  # menarche: 0 impossible
        ]
        if self._defaults:
            for col in self._feature_cols:
                col_lower = col.lower()
                if any(kw in col_lower for kw in _NEEDS_MEDIAN_KEYWORDS):
                    vec[self._col_idx[col]] = float(self._defaults.get(col, 0.0))

        # Step 3: override with user-provided values
        for api_key, raw_val in api_inputs.items():
            col = self._api_field_map.get(api_key)
            if col and col in self._col_idx:
                vec[self._col_idx[col]] = float(raw_val)

        # Recompute derived composites so they stay consistent with pain overrides
        pain_vals = np.array([
            vec[self._col_idx[c]]
            for kw in _PAIN_KEYWORDS
            if (c := self._resolve_col(kw)) and c in self._col_idx
        ])
        if len(pain_vals):
            cm = self._resolve_col("pain_composite_mean")
            cx = self._resolve_col("pain_composite_max")
            ch = self._resolve_col("high_pain_count")
            if cm: vec[self._col_idx[cm]] = float(pain_vals.mean())
            if cx: vec[self._col_idx[cx]] = float(pain_vals.max())
            if ch: vec[self._col_idx[ch]] = float((pain_vals >= 7).sum())

        qol_col   = self._resolve_col("how much do your symptoms affect your quality of life")
        cpain_col = self._resolve_col("Overall chronic pain level")
        sb_col    = self._resolve_col("symptom_burden")
        if qol_col and cpain_col and sb_col:
            vec[self._col_idx[sb_col]] = (
                vec[self._col_idx[qol_col]] + vec[self._col_idx[cpain_col]]
            ) / 2.0

        return vec

    def build_scaled_vector(self, api_inputs: dict[str, float]) -> np.ndarray:
        """Return a (1, N) scaled numpy array ready for model.predict_proba()."""
        self._assert_loaded()
        raw = self._build_raw_vector(api_inputs)
        # Use DataFrame with exact feature names to satisfy sklearn validation
        df_raw = pd.DataFrame(raw.reshape(1, -1), columns=self._feature_cols)
        return self._scaler.transform(df_raw)

    # ── Inference ────────────────────────────────────────────────────────────

    def predict(self, scaled_vec: np.ndarray) -> tuple[float, str]:
        """Returns (probability, risk_category)."""
        self._assert_loaded()
        prob = float(self._model.predict_proba(scaled_vec)[0, 1])
        risk = next(cat for thr, cat in _RISK_THRESHOLDS if prob >= thr)
        return round(prob, 4), risk

    # ── LIME explainability ──────────────────────────────────────────────────

    def explain(self, scaled_vec: np.ndarray, top_n: int = 3) -> list[dict]:
        """
        Run LIME on the given scaled feature vector.

        Returns a list of up to `top_n` dicts:
            {
              "symptom":      short feature label (str),
              "rule":         full LIME decision rule (str),
              "contribution": signed float (+ increases risk),
              "direction":    "increases_risk" | "decreases_risk",
            }

        LIME is instantiated fresh per call — stateless, thread-safe.
        Runtime ≈ 0.3–0.8 s with num_samples=500.
        """
        self._assert_loaded()

        import lime.lime_tabular  # lazy import — only when route is hit

        background = (
            self._background
            if self._background is not None
            else scaled_vec  # fallback for cold-start without background
        )

        explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data=background,
            feature_names=self._feature_cols,
            class_names=["No Condition", "Has Condition"],
            mode="classification",
            discretize_continuous=True,
            random_state=42,
        )

        exp = explainer.explain_instance(
            data_row=scaled_vec[0],
            predict_fn=self._model.predict_proba,
            num_features=10,
            num_samples=500,
            top_labels=1,
        )

        # LIME only stores the top_labels it actually computed. For low-risk
        # inputs the predicted class may be 0, so label=1 won't exist.
        # Fall back to label=0 and flip contribution signs so they still
        # describe the "increases / decreases risk of having a condition"
        # direction from the user's perspective.
        available = list(exp.local_exp.keys())
        if 1 in available:
            raw_list = exp.as_list(label=1)
            sign = 1
        elif available:
            raw_list = exp.as_list(label=available[0])
            sign = -1  # label-0 contributions are inverted relative to class-1
        else:
            return []

        top = sorted(raw_list, key=lambda x: abs(x[1]), reverse=True)[:top_n]

        return [
            {
                "symptom":      rule.split(" <= ")[0].split(" > ")[0].strip(),
                "rule":         rule,
                "contribution": round(float(contrib) * sign, 4),
                "direction":    "increases_risk" if contrib * sign > 0 else "decreases_risk",
            }
            for rule, contrib in top
        ]


# ─────────────────────────────────────────────────────────────────────────────
# Module-level singleton + public helpers
# ─────────────────────────────────────────────────────────────────────────────
_engine = _MLEngine()


def load_model() -> None:
    """Call once at application startup (main.py lifespan)."""
    _engine.load()


def get_engine() -> _MLEngine:
    """FastAPI dependency: returns the loaded engine instance."""
    return _engine
