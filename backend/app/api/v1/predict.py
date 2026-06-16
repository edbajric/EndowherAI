"""
POST /api/v1/insights/predict

Accepts 24 core clinical symptom scores, runs the stacking ensemble,
returns probability + risk category + top-3 LIME explanations.

Security:
  - Requires a valid Supabase JWT (Bearer token).
  - Only the pseudonym_id is used for any DB interaction — no PII touches
    this route or the ML engine (EDPB 01/2025 pseudonymisation domain).

Performance note:
  - Pure inference: ~20-50 ms
  - With LIME explanation: ~350-800 ms (500 perturbation samples)
"""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.core.security import get_pseudonym_id
from app.ml.engine import _MLEngine, get_engine

router = APIRouter(prefix="/api/v1/insights", tags=["Insights"])


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────────────────────────────────────

class InsightRequest(BaseModel):
    """
    24 core clinical symptom inputs for the EndoWherAI risk model.

    Pain scales (0-10): 0 = no pain, 10 = worst imaginable.

    Categorical codes use the same ordinal scale the model was trained on:
      heavy_bleeding / pain_during_sex / pain_after_sex:
          0=Never  1=Sometimes  2=Often  3=Very often/Yes heavily
      painful_bowel_movements / urinary_pain:
          0=Never  1=Sometimes  2=Often
      dizziness / headaches_migraines:
          0=Never  1=Sometimes  2=Often
      fatigue / bloating_frequency:
          0=Never  1=Rarely  2=1-3 days/month  3=4-10 days/month
          4=More than 10 days/month  5=Other
      mood_anxiety_depression:
          0=Never  1=Rarely  2=Some cycles  3=Most cycles  4=Every cycle
      cycle_regularity:
          0=Regular  1=Mostly regular  2=Somewhat irregular  3=Irregular

    Treatment effectiveness (0-10): 0 = not tried or no effect,
      10 = extremely effective.
    """

    # ── Pain scales ──────────────────────────────────────────────────────────
    period_pain: int = Field(
        ..., ge=0, le=10,
        description="Pain / cramps during your period (0=none, 10=worst possible)",
    )
    pelvic_pain: int = Field(
        ..., ge=0, le=10,
        description="Pelvic pain outside your period",
    )
    abdominal_pain: int = Field(
        0, ge=0, le=10,
        description="Abdominal pain or pressure not related to period",
    )
    lower_back_pain: int = Field(
        0, ge=0, le=10,
        description="Lower back pain related to your cycle",
    )
    hip_leg_pain: int = Field(
        0, ge=0, le=10,
        description="Hip or leg pain related to your cycle",
    )
    sharp_pelvic_pain: int = Field(
        0, ge=0, le=10,
        description="Sharp or stabbing pelvic/abdominal pain",
    )
    painful_ovulation: int = Field(
        0, ge=0, le=10,
        description="Mid-cycle pain / painful ovulation",
    )
    overall_chronic_pain: int = Field(
        0, ge=0, le=10,
        description="Overall chronic pain level in the last 3 months (all pains combined)",
    )
    quality_of_life: int = Field(
        0, ge=0, le=10,
        description="How much do symptoms affect quality of life? (0=not at all, 10=extremely)",
    )

    # ── Symptom patterns ─────────────────────────────────────────────────────
    heavy_bleeding: int = Field(
        0, ge=0, le=3,
        description="Heavy/extreme menstrual bleeding (0=Never, 1=Sometimes, 2=Often, 3=Yes heavily)",
    )
    pain_during_sex: int = Field(
        0, ge=0, le=3,
        description="Pain/burning during sexual intercourse (0=Never, 1=Sometimes, 2=Often, 3=Very often)",
    )
    pain_after_sex: int = Field(
        0, ge=0, le=3,
        description="Pain after sexual intercourse (0=Never, 1=Sometimes, 2=Often, 3=Very often)",
    )
    painful_bowel_movements: int = Field(
        0, ge=0, le=2,
        description="Painful bowel movements around period (0=Never, 1=Sometimes, 2=Often)",
    )
    urinary_pain: int = Field(
        0, ge=0, le=2,
        description="Pain/burning when urinating around period (0=Never, 1=Sometimes, 2=Often)",
    )
    bloating_frequency: int = Field(
        0, ge=0, le=5,
        description="Noticeable bloating / endo belly (0=Never, 1=Rarely, 2=1-3 days/month, 3=4-10 days/month, 4=>10 days/month, 5=Other)",
    )
    dizziness: int = Field(
        0, ge=0, le=2,
        description="Dizziness/fainting around period (0=Never, 1=Sometimes, 2=Often)",
    )
    headaches_migraines: int = Field(
        0, ge=0, le=2,
        description="Headaches/migraines related to cycle (0=Never, 1=Sometimes, 2=Often)",
    )
    mood_anxiety_depression: int = Field(
        0, ge=0, le=4,
        description="Mood swings/anxiety/depression related to cycle (0=Never, 1=Rarely, 2=Some cycles, 3=Most cycles, 4=Every cycle)",
    )
    fatigue: int = Field(
        0, ge=0, le=5,
        description="Tiredness/exhaustion not improved by sleep (0=Never, 1=Rarely, 2=1-3 days/month, 3=4-10 days/month, 4=>10 days/month, 5=Other)",
    )
    cycle_regularity: int = Field(
        0, ge=0, le=3,
        description="Menstrual cycle pattern (0=Regular, 1=Mostly regular, 2=Somewhat irregular, 3=Irregular)",
    )

    # ── Treatment behaviours (optional) ──────────────────────────────────────
    anti_inflammatory_diet: float = Field(
        0.0, ge=0.0, le=10.0,
        description="Anti-inflammatory diet effectiveness (0=not tried, 10=extremely effective)",
    )
    pelvic_floor_physio: float = Field(
        0.0, ge=0.0, le=10.0,
        description="Pelvic floor / physiotherapy exercises effectiveness",
    )

    # ── Options ──────────────────────────────────────────────────────────────
    include_explanation: bool = Field(
        True,
        description="Whether to run LIME and return top-3 contributing factors. "
                    "Set False to halve response latency.",
    )


class ExplanationFactor(BaseModel):
    """One LIME contributing factor returned in the prediction response."""
    symptom:      str   = Field(description="Short feature name")
    rule:         str   = Field(description="LIME decision rule (e.g. 'pelvic_pain > 0.53')")
    contribution: float = Field(description="Signed contribution to P(Has Condition)")
    direction:    str   = Field(description="'increases_risk' or 'decreases_risk'")


class InsightResponse(BaseModel):
    """
    Real-time model response for a single user submission.
    Follows the pseudonymisation domain: no PII, only the pseudonym_id
    is included for the client to correlate with its own state.
    """
    pseudonym_id:   str   = Field(description="Caller's pseudonym ID (from JWT)")
    probability:    float = Field(description="P(has PCOS or endometriosis) ∈ [0, 1]")
    risk_category:  str   = Field(description="'Low' | 'Moderate' | 'High'")
    explanation:    list[ExplanationFactor] = Field(
        default_factory=list,
        description="Top-3 LIME factors (empty when include_explanation=False)",
    )
    model_version:  str   = Field(default="stacking-v1", description="Model identifier")


# ─────────────────────────────────────────────────────────────────────────────
# Route
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/predict",
    response_model=InsightResponse,
    summary="Real-time PCOS/endo risk prediction",
    responses={
        401: {"description": "Missing or invalid JWT"},
        422: {"description": "Validation error in request body"},
        503: {"description": "ML model not loaded"},
    },
)
def predict_risk(
    body: InsightRequest,
    pseudonym_id: str = Depends(get_pseudonym_id),
    engine: _MLEngine = Depends(get_engine),
) -> InsightResponse:
    """
    Accepts 24 core clinical symptom scores, returns a risk probability
    and (optionally) the top-3 LIME explanations.

    Authentication
    --------------
    Requires a Supabase JWT in the `Authorization: Bearer <token>` header.
    The route resolves the caller's `pseudonym_id` via the JWT and uses it
    only for response labelling — no raw symptom data is persisted here.

    Pseudonymisation domain
    -----------------------
    The ML engine receives an anonymous numpy feature vector only.
    The `pseudonym_id` is never passed to the engine or stored with
    symptom inputs inside this process boundary.
    """
    if not engine._loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model is not loaded. Please try again shortly.",
        )

    # Build scaled feature vector from user inputs.
    # model_dump() returns all 25 fields; build_scaled_vector ignores any key
    # not in API_FIELD_MAP and fills the remaining ~69 features with
    # training-distribution defaults automatically.
    raw_dump   = body.model_dump(exclude={"include_explanation"})
    api_inputs = {k: v for k, v in raw_dump.items() if k in engine.API_FIELD_MAP}
    scaled_vec = engine.build_scaled_vector(api_inputs)

    # Inference
    probability, risk_category = engine.predict(scaled_vec)

    # LIME explanation (optional, ~400ms)
    factors: list[dict] = []
    if body.include_explanation:
        factors = engine.explain(scaled_vec, top_n=3)

    return InsightResponse(
        pseudonym_id=pseudonym_id,
        probability=probability,
        risk_category=risk_category,
        explanation=[ExplanationFactor(**f) for f in factors],
    )
