from fastapi import APIRouter, Depends, Query

from app.core.config import get_settings, Settings
from app.core.security import (
    get_pseudonym_id,
    get_http_client,
    supabase_headers,
    supabase_url,
)
from app.models.schemas import RemedyLogCreate, RemedyLogResponse

router = APIRouter(prefix="/api/v1/remedies", tags=["Remedies"])


@router.post("/", response_model=RemedyLogResponse)
def create_remedy_log(
    body: RemedyLogCreate,
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings: Settings = Depends(get_settings),
):
    """Log a new remedy entry."""
    client = get_http_client()
    row = {
        "pseudonym_id": pseudonym_id,
        "log_date": str(body.log_date),
        "remedy_name": body.remedy_name,
        "remedy_category": body.remedy_category,
        "effectiveness": body.effectiveness,
        "duration_minutes": body.duration_minutes,
        "notes": body.notes,
    }
    resp = client.post(
        supabase_url(settings, "remedy_logs"),
        headers=supabase_headers(settings),
        json=row,
    )
    return resp.json()[0]


@router.get("/", response_model=list[RemedyLogResponse])
def list_remedy_logs(
    limit: int = Query(20, ge=1, le=100),
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings: Settings = Depends(get_settings),
):
    """List the authenticated user's remedy logs (newest first)."""
    client = get_http_client()
    headers = supabase_headers(settings)
    headers["Range"] = f"0-{limit - 1}"
    resp = client.get(
        supabase_url(settings, "remedy_logs"),
        headers=headers,
        params={
            "pseudonym_id": f"eq.{pseudonym_id}",
            "order": "log_date.desc",
            "select": "*",
        },
    )
    return resp.json()
