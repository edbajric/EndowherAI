from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import get_settings, Settings
from app.core.security import (
    get_current_user_id,
    get_http_client,
    supabase_headers,
    supabase_url,
)
from app.models.schemas import UserProfileResponse

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.get("/me", response_model=UserProfileResponse)
def get_me(
    user_id: str = Depends(get_current_user_id),
    settings: Settings = Depends(get_settings),
):
    """Return the current user's profile (pseudonym_id, consent status)."""
    client = get_http_client()
    resp = client.get(
        supabase_url(settings, "user_profiles"),
        headers=supabase_headers(settings),
        params={
            "auth_id": f"eq.{user_id}",
            "select": "pseudonym_id,consent_flag,consent_timestamp",
        },
    )
    data = resp.json()
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return data[0]
