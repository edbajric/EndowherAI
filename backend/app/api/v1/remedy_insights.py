"""
GET /api/v1/remedies/insights

Per-remedy statistical analytics: effectiveness trend, pain correlation,
usage consistency, and timeline. Uses linear regression (numpy polyfit)
for trend detection and mean comparison for pain correlation against the
user's symptom diary.

Query params:
  name     — remedy_name (exact match, case-sensitive)
  category — remedy_category

Auth:   Supabase JWT (Bearer token) — pseudonym_id resolved server-side.
Tables: public.remedy_logs, public.symptom_logs
"""

from __future__ import annotations

import statistics
from datetime import date, datetime, timedelta
from typing import Optional

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.config import get_settings, Settings
from app.core.security import (
    get_pseudonym_id,
    get_http_client,
    supabase_headers,
    supabase_url,
)

router = APIRouter(prefix="/api/v1/remedies", tags=["Remedy Insights"])


# ─── Response schemas ─────────────────────────────────────────────────────────

class TimelinePoint(BaseModel):
    date:          str
    effectiveness: float
    quantity:      Optional[float] = None


class PainInsights(BaseModel):
    remedy_days_avg_pain: Optional[float]
    baseline_avg_pain:    Optional[float]
    pain_reduction_pct:   Optional[float]
    sufficient_data:      bool


class RemedyInsightResponse(BaseModel):
    remedy_name:         str
    remedy_category:     str
    days_in_regimen:     int
    total_logs:          int
    avg_effectiveness:   float
    effectiveness_trend: str            # "improving" | "stable" | "declining"
    trend_summary:       str
    consistency_score:   float          # 0–100 %
    best_dose:           Optional[float]
    timeline:            list[TimelinePoint]
    pain_insights:       PainInsights


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _mean(values: list[float]) -> Optional[float]:
    return round(statistics.mean(values), 1) if values else None


def _compute_trend(effectiveness_values: list[float]) -> tuple[str, str]:
    """Linear regression slope → trend label + human summary."""
    n = len(effectiveness_values)
    if n < 3:
        return "stable", f"Log at least 3 uses to see a trend (you have {n} so far)."

    x = np.arange(n, dtype=float)
    y = np.array(effectiveness_values, dtype=float)
    slope = float(np.polyfit(x, y, 1)[0])

    if slope > 0.08:
        label   = "improving"
        summary = f"Effectiveness has been improving across your {n} logs — keep it up."
    elif slope < -0.08:
        label   = "declining"
        summary = f"Effectiveness has been declining slightly across your {n} logs. Consider adjusting dose or timing."
    else:
        label   = "stable"
        summary = f"Effectiveness is stable across your {n} logs."

    return label, summary


def _consistency(log_dates: list[str], days_in_regimen: int) -> float:
    """Percentage of the last 30 regimen days that have at least one log."""
    window = min(30, days_in_regimen) if days_in_regimen > 0 else 30
    if window == 0:
        return 0.0
    today     = date.today()
    cutoff    = today - timedelta(days=window - 1)
    logged_in_window = {d for d in log_dates if d >= str(cutoff)}
    return round(len(logged_in_window) / window * 100, 1)


def _best_dose(logs: list[dict]) -> Optional[float]:
    """Median quantity (duration_minutes) on high-effectiveness logs (≥7)."""
    high_eff = [
        r["duration_minutes"]
        for r in logs
        if (r.get("effectiveness") or 0) >= 7 and r.get("duration_minutes") is not None
    ]
    if len(high_eff) < 2:
        return None
    return round(statistics.median(high_eff), 0)


def _pain_insights(
    remedy_log_dates: set[str],
    symptom_logs: list[dict],
) -> PainInsights:
    """
    Compare mean pain_level on remedy-use days vs. all other days
    that have a symptom diary entry.
    """
    remedy_pain = []
    other_pain  = []

    for s in symptom_logs:
        pain = s.get("pain_level")
        if pain is None:
            continue
        if str(s["log_date"]) in remedy_log_dates:
            remedy_pain.append(float(pain))
        else:
            other_pain.append(float(pain))

    sufficient = len(remedy_pain) >= 3 and len(other_pain) >= 3

    if not sufficient:
        return PainInsights(
            remedy_days_avg_pain=_mean(remedy_pain) if remedy_pain else None,
            baseline_avg_pain=_mean(other_pain) if other_pain else None,
            pain_reduction_pct=None,
            sufficient_data=False,
        )

    r_avg = statistics.mean(remedy_pain)
    b_avg = statistics.mean(other_pain)
    pct   = round((b_avg - r_avg) / b_avg * 100, 1) if b_avg > 0 else 0.0

    return PainInsights(
        remedy_days_avg_pain=round(r_avg, 1),
        baseline_avg_pain=round(b_avg, 1),
        pain_reduction_pct=pct,
        sufficient_data=True,
    )


# ─── Route ────────────────────────────────────────────────────────────────────

@router.get("/insights", response_model=RemedyInsightResponse,
            summary="Per-remedy statistical insights")
def get_remedy_insights(
    name:         str = Query(..., description="Exact remedy_name"),
    category:     str = Query(..., description="remedy_category"),
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings:     Settings = Depends(get_settings),
):
    """
    Returns effectiveness trend, pain correlation, usage consistency,
    and a 60-day timeline for a single remedy.

    Trend detection uses linear regression (numpy polyfit).
    Pain correlation compares mean pain_level on remedy days vs. non-remedy
    days by joining with the user's symptom_logs.
    """
    client  = get_http_client()
    headers = supabase_headers(settings)

    # ── 1. Fetch all remedy_logs for this user + remedy ──────────────────────
    resp = client.get(
        supabase_url(settings, "remedy_logs"),
        headers=headers,
        params={
            "pseudonym_id":    f"eq.{pseudonym_id}",
            "remedy_name":     f"eq.{name}",
            "remedy_category": f"eq.{category}",
            "select":          "log_date,effectiveness,duration_minutes",
            "order":           "log_date.asc",
        },
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    logs: list[dict] = resp.json()

    if not logs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No logs found for this remedy.",
        )

    # ── 2. Fetch all symptom_logs for this user ───────────────────────────────
    sresp = client.get(
        supabase_url(settings, "symptom_logs"),
        headers=headers,
        params={
            "pseudonym_id": f"eq.{pseudonym_id}",
            "select":       "log_date,pain_level",
            "order":        "log_date.asc",
        },
    )
    if sresp.status_code != 200:
        raise HTTPException(status_code=sresp.status_code, detail=sresp.text)

    symptom_logs: list[dict] = sresp.json()

    # ── 3. Compute analytics ──────────────────────────────────────────────────

    log_dates      = [str(r["log_date"]) for r in logs]
    effectiveness  = [float(r["effectiveness"]) for r in logs if r.get("effectiveness") is not None]
    first_date     = log_dates[0]
    days_in_regimen = (date.today() - date.fromisoformat(first_date)).days

    avg_eff          = round(statistics.mean(effectiveness), 1) if effectiveness else 0.0
    trend, summary   = _compute_trend(effectiveness)
    consistency      = _consistency(log_dates, days_in_regimen)
    best_dose_val    = _best_dose(logs)
    pain_ins         = _pain_insights(set(log_dates), symptom_logs)

    # Last 60 days for timeline
    cutoff = str(date.today() - timedelta(days=59))
    timeline = [
        TimelinePoint(
            date=str(r["log_date"]),
            effectiveness=float(r["effectiveness"]) if r.get("effectiveness") is not None else 0.0,
            quantity=float(r["duration_minutes"]) if r.get("duration_minutes") is not None else None,
        )
        for r in logs
        if str(r["log_date"]) >= cutoff
    ]

    return RemedyInsightResponse(
        remedy_name=name,
        remedy_category=category,
        days_in_regimen=days_in_regimen,
        total_logs=len(logs),
        avg_effectiveness=avg_eff,
        effectiveness_trend=trend,
        trend_summary=summary,
        consistency_score=consistency,
        best_dose=best_dose_val,
        timeline=timeline,
        pain_insights=pain_ins,
    )
