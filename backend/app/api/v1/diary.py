from fastapi import APIRouter, Depends, Query
from collections import Counter

from app.core.config import get_settings, Settings
from app.core.security import (
    get_pseudonym_id,
    get_http_client,
    supabase_headers,
    supabase_url,
)
from app.models.schemas import SymptomLogCreate, SymptomLogResponse, DashboardStats

router = APIRouter(prefix="/api/v1/diary", tags=["Diary"])


@router.post("/", response_model=SymptomLogResponse)
def create_symptom_log(
    body: SymptomLogCreate,
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings: Settings = Depends(get_settings),
):
    """Create a new symptom log entry."""
    client = get_http_client()
    row = {
        "pseudonym_id": pseudonym_id,
        "log_date": str(body.log_date),
        "pain_level": body.pain_level,
        "cycle_day": body.cycle_day,
        "bleeding_intensity": body.bleeding_intensity,
        "mood": body.mood,
        "fatigue_level": body.fatigue_level,
        "notes": body.notes,
    }
    resp = client.post(
        supabase_url(settings, "symptom_logs"),
        headers=supabase_headers(settings),
        json=row,
    )
    return resp.json()[0]


@router.get("/", response_model=list[SymptomLogResponse])
def list_symptom_logs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings: Settings = Depends(get_settings),
):
    """List the authenticated user's symptom logs (newest first)."""
    client = get_http_client()
    headers = supabase_headers(settings)
    headers["Range"] = f"{offset}-{offset + limit - 1}"
    resp = client.get(
        supabase_url(settings, "symptom_logs"),
        headers=headers,
        params={
            "pseudonym_id": f"eq.{pseudonym_id}",
            "order": "log_date.desc",
            "select": "*",
        },
    )
    return resp.json()


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings: Settings = Depends(get_settings),
):
    """Compute dashboard statistics for the authenticated user."""
    client = get_http_client()
    headers = supabase_headers(settings)

    # Symptom logs
    logs_resp = client.get(
        supabase_url(settings, "symptom_logs"),
        headers=headers,
        params={
            "pseudonym_id": f"eq.{pseudonym_id}",
            "select": "pain_level,fatigue_level,mood",
        },
    )
    logs = logs_resp.json()

    # Remedy count
    remedy_headers = {**headers, "Prefer": "count=exact, return=representation"}
    remedy_resp = client.get(
        supabase_url(settings, "remedy_logs"),
        headers=remedy_headers,
        params={"pseudonym_id": f"eq.{pseudonym_id}", "select": "id"},
    )
    total_remedies = int(remedy_resp.headers.get("content-range", "0/0").split("/")[-1] or 0)

    # Weekly count
    weekly_resp = client.get(
        supabase_url(settings, "weekly_logs"),
        headers=remedy_headers,
        params={"pseudonym_id": f"eq.{pseudonym_id}", "select": "id"},
    )
    total_weekly = int(weekly_resp.headers.get("content-range", "0/0").split("/")[-1] or 0)

    if not logs:
        return DashboardStats(total_remedies=total_remedies, total_weekly=total_weekly)

    total = len(logs)
    avg_pain = round(sum(l.get("pain_level") or 0 for l in logs) / total, 1)
    avg_fatigue = round(sum(l.get("fatigue_level") or 0 for l in logs) / total, 1)
    moods = [l["mood"] for l in logs if l.get("mood")]
    most_common_mood = Counter(moods).most_common(1)[0][0] if moods else "—"

    return DashboardStats(
        total_logs=total,
        avg_pain=avg_pain,
        avg_fatigue=avg_fatigue,
        most_common_mood=most_common_mood,
        total_remedies=total_remedies,
        total_weekly=total_weekly,
    )
