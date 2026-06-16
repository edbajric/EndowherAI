"""
GET /api/v1/insights/community

Serves pre-computed research insights (symptom prevalence, remedy
effectiveness from the survey dataset) combined with live community
remedy stats from the app's Supabase database.

No auth required — all data is aggregate / de-identified.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/insights", tags=["Community Insights"])

# Path to pre-computed JSON relative to this file's location in /backend/app/api/v1/
_ML_OUTPUTS = (
    Path(__file__).resolve().parents[4]
    / "machine-learning"
    / "outputs"
    / "community_insights.json"
)


@lru_cache(maxsize=1)
def _load_research_insights() -> dict[str, Any]:
    if not _ML_OUTPUTS.exists():
        return {}
    with open(_ML_OUTPUTS, encoding="utf-8") as f:
        return json.load(f)


@router.get("/community", summary="Community symptom & remedy insights")
def get_community_insights() -> dict[str, Any]:
    """
    Returns:
    - Research dataset insights: symptom prevalence by condition,
      remedy effectiveness from survey data.
    - Metadata: sample size, condition breakdown, generation date.
    """
    data = _load_research_insights()
    if not data:
        raise HTTPException(
            status_code=503,
            detail="Community insights not yet generated. Run machine-learning/scripts/community_insights.py.",
        )
    return data
