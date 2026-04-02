from fastapi import APIRouter, Depends, Query

from app.core.config import get_settings, Settings
from app.core.security import (
    get_pseudonym_id,
    get_http_client,
    supabase_headers,
    supabase_url,
)
from app.models.schemas import WeeklyLogCreate, WeeklyLogResponse

router = APIRouter(prefix="/api/v1/weekly", tags=["Weekly"])


@router.post("/", response_model=WeeklyLogResponse)
def create_weekly_log(
    body: WeeklyLogCreate,
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings: Settings = Depends(get_settings),
):
    """Create a new weekly check-in entry."""
    client = get_http_client()
    row = {
        "pseudonym_id": pseudonym_id,
        "avg_pain": body.avg_pain,
        "bloating": body.bloating,
        "sleep_quality": body.sleep_quality,
        "anxiety": body.anxiety,
        "bowel_symptoms": body.bowel_symptoms,
        "urinary_symptoms": body.urinary_symptoms,
        "notes": body.notes,
    }
    resp = client.post(
        supabase_url(settings, "weekly_logs"),
        headers=supabase_headers(settings),
        json=row,
    )
    return resp.json()[0]


@router.get("/", response_model=list[WeeklyLogResponse])
def list_weekly_logs(
    limit: int = Query(10, ge=1, le=50),
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings: Settings = Depends(get_settings),
):
    """List the authenticated user's weekly logs (newest first)."""
    client = get_http_client()
    headers = supabase_headers(settings)
    headers["Range"] = f"0-{limit - 1}"
    resp = client.get(
        supabase_url(settings, "weekly_logs"),
        headers=headers,
        params={
            "pseudonym_id": f"eq.{pseudonym_id}",
            "order": "week_start.desc",
            "select": "*",
        },
    )
    return resp.json()
