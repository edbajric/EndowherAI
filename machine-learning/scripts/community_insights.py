#!/usr/bin/env python3
"""
Compute community-level symptom and remedy insights from survey data.
Outputs: machine-learning/outputs/community_insights.json

Run from repo root:
    python machine-learning/scripts/community_insights.py
"""

import csv
import json
import math
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "machine-learning" / "data" / "optimized_dataset.csv"
OUT  = ROOT / "machine-learning" / "outputs" / "community_insights.json"

# ── Condition detection ────────────────────────────────────────────────────────
ENDO_COL = "Have you been diagnosed with endometriosis?"
PCOS_COL = "Have you been diagnosed you with polycystic ovary syndrome (PCOS)?"
POSITIVE  = {"Yes, officially diagnosed", "No, but doctor suspects"}

# ── Symptom columns → short label ─────────────────────────────────────────────
SYMPTOM_COLS = {
    "Period pain / cramps during your period (dysmenorrhea)":                                          "Period pain",
    "Pelvic pain outside your period (chronic pelvic pain)\n":                                        "Chronic pelvic pain",
    "Abdominal pain or pressure (not only during period)\n":                                          "Abdominal pain",
    "Lower back pain related to your cycle":                                                          "Lower back pain",
    "Hip or leg pain related to your cycle\n":                                                        "Hip / leg pain",
    "Sharp or stabbing pelvic/abdominal pain":                                                        "Sharp pelvic pain",
    "Painful ovulation (mid‑cycle pain)\n":                                                      "Painful ovulation",
    "Do you experience pain or burning during sexual intercourse (dyspareunia)?":                     "Dyspareunia",
    "Do you experience pain after sexual intercourse?":                                               "Pain after sex",
    "Do you have painful bowel movements, especially around your period?":                            "Painful bowel movements",
    "Do you have pain or burning when urinating, especially around your period?":                     "Urinary pain",
    "Overall chronic pain level in the last 3 months (all pains combined)\n":                        "Overall chronic pain",
    "How often do you have noticeable bloating or \"endo belly\"?":                                  "Bloating / endo belly",
    "Around your period (from 3 days before bleeding until the last day of bleeding), how often do you usually have diarrhea?":                    "Diarrhea around period",
    "Around your period (from 3 days before bleeding until the last day of bleeding), how often do you usually have constipation or very hard stools?": "Constipation around period",
    "Do your bowel habits (diarrhea/constipation) change frequently throughout the month (IBS‑like symptoms)? ": "IBS-like bowel changes",
    "How often do you feel very tired or exhausted, not improved by sleep? ":                         "Fatigue",
    "Do you experience dizziness or fainting around your period? ":                                   "Dizziness / fainting",
    "Do you have frequent headaches or migraines related to your cycle? ":                            "Headaches / migraines",
    "In the last 6 months, how often have you had mood swings, anxiety or depression clearly related to your cycle? ": "Mood / anxiety",
    "Overall, how much do your symptoms affect your quality of life? (0 = Not at all, 10 = Extremely)": "QoL impact",
}

# ── Remedy columns → (short label, category) ──────────────────────────────────
REMEDY_COLS = {
    "Heat (heating pad, hot water bottle, warm baths)":  ("Heat therapy",             "heat"),
    "Chamomile (Kamilica) tea":                          ("Chamomile tea",            "tea"),
    "Ginger (Đumbir) tea\n":                       ("Ginger tea",               "tea"),
    "Cinnamon (Cimet) tea\n":                            ("Cinnamon tea",             "tea"),
    "Spearmint (Zelena metvica) tea\n":                  ("Spearmint tea",            "tea"),
    "Peppermint (Nana/Menta) tea\n":                     ("Peppermint tea",           "tea"),
    "Raspberry leaf (List maline) tea\n":                ("Raspberry leaf tea",       "tea"),
    "Fennel (Komorač) tea\n":                      ("Fennel tea",               "tea"),
    "Turmeric (Kurkuma) tea\n":                          ("Turmeric tea",             "tea"),
    "Myo‑inositol":                                 ("Myo-inositol",             "supplement"),
    "Magnesium":                                         ("Magnesium",                "supplement"),
    "Zinc":                                              ("Zinc",                     "supplement"),
    "Vitamin D":                                         ("Vitamin D",                "supplement"),
    "Omega‑3":                                      ("Omega-3",                  "supplement"),
    "Gentle stretching / mobility":                      ("Gentle stretching",        "exercise"),
    "Yoga or Pilates":                                   ("Yoga / Pilates",           "exercise"),
    "Walking":                                           ("Walking",                  "exercise"),
    "Anti‑inflammatory diet":                       ("Anti-inflammatory diet",   "diet"),
    "Reduced sugar / sweets":                            ("Reduced sugar",            "diet"),
    "Reduced processed / fast food":                     ("Reduced processed food",   "diet"),
}


def _safe_float(v: str) -> float | None:
    try:
        return float(v.strip())
    except (ValueError, AttributeError):
        return None


def _pct(numerator: int, denominator: int) -> float:
    return round(numerator / denominator * 100, 1) if denominator else 0.0


def main():
    with open(DATA, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    total = len(rows)
    print(f"Loaded {total} survey responses")

    # ── Condition groups ───────────────────────────────────────────────────────
    groups: dict[str, list[dict]] = {"endo_only": [], "pcos_only": [], "both": [], "neither": []}
    for row in rows:
        has_endo = row.get(ENDO_COL, "").strip() in POSITIVE
        has_pcos = row.get(PCOS_COL, "").strip() in POSITIVE
        if has_endo and has_pcos:
            groups["both"].append(row)
        elif has_endo:
            groups["endo_only"].append(row)
        elif has_pcos:
            groups["pcos_only"].append(row)
        else:
            groups["neither"].append(row)

    print({k: len(v) for k, v in groups.items()})

    # ── Symptom prevalence ─────────────────────────────────────────────────────
    # "prevalent" = average score ≥ 5 AND % of group with score ≥ 5
    def symptom_stats(group_rows: list[dict]) -> list[dict]:
        result = []
        n = len(group_rows)
        if n == 0:
            return result
        for col, label in SYMPTOM_COLS.items():
            values = [_safe_float(r.get(col, "")) for r in group_rows]
            values = [v for v in values if v is not None]
            if not values:
                continue
            avg = round(sum(values) / len(values), 1)
            pct_moderate = _pct(sum(1 for v in values if v >= 5), n)
            result.append({"label": label, "avg_score": avg, "pct_moderate": pct_moderate})
        result.sort(key=lambda x: x["avg_score"], reverse=True)
        return result

    symptom_prevalence = {
        "endo":    symptom_stats(groups["endo_only"]),
        "pcos":    symptom_stats(groups["pcos_only"]),
        "both":    symptom_stats(groups["both"]),
        "overall": symptom_stats(rows),
    }

    # ── Remedy effectiveness ───────────────────────────────────────────────────
    # Score > 0 = used. Compute usage rate and avg effectiveness among users.
    def remedy_stats(all_rows: list[dict]) -> list[dict]:
        result = []
        n = len(all_rows)
        if n == 0:
            return result
        for col, (label, category) in REMEDY_COLS.items():
            values = [_safe_float(r.get(col, "")) for r in all_rows]
            values = [v for v in values if v is not None]
            used_values = [v for v in values if v > 0]
            if not values:
                continue
            usage_count = len(used_values)
            usage_pct   = _pct(usage_count, n)
            avg_eff     = round(sum(used_values) / len(used_values), 1) if used_values else 0.0
            result.append({
                "label":       label,
                "category":    category,
                "usage_count": usage_count,
                "usage_pct":   usage_pct,
                "avg_effectiveness": avg_eff,
            })
        result.sort(key=lambda x: x["avg_effectiveness"], reverse=True)
        return result

    # Per condition group remedy stats
    def remedy_stats_by_group(group_rows: list[dict]) -> list[dict]:
        return remedy_stats(group_rows)

    remedy_effectiveness = remedy_stats(rows)
    remedy_by_condition = {
        "endo":    remedy_stats_by_group(groups["endo_only"]),
        "pcos":    remedy_stats_by_group(groups["pcos_only"]),
        "both":    remedy_stats_by_group(groups["both"]),
    }

    # ── Assemble output ───────────────────────────────────────────────────────
    out = {
        "generated_at":  str(date.today()),
        "sample_size":   total,
        "condition_breakdown": {
            "endo_only": len(groups["endo_only"]),
            "pcos_only": len(groups["pcos_only"]),
            "both":      len(groups["both"]),
            "neither":   len(groups["neither"]),
        },
        "symptom_prevalence":  symptom_prevalence,
        "remedy_effectiveness": remedy_effectiveness,
        "remedy_by_condition":  remedy_by_condition,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"Written to {OUT}")
    print(f"Top 5 remedies by effectiveness:")
    for r in remedy_effectiveness[:5]:
        print(f"  {r['label']:30s} {r['avg_effectiveness']:.1f}/10  ({r['usage_pct']:.0f}% used)")


if __name__ == "__main__":
    main()
