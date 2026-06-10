from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

from app.core.config import get_settings, Settings

bearer_scheme = HTTPBearer()

# Shared httpx client for Supabase REST API calls
_http_client: httpx.Client | None = None


def get_http_client() -> httpx.Client:
    global _http_client
    if _http_client is None:
        _http_client = httpx.Client(timeout=10.0)
    return _http_client


def supabase_headers(settings: Settings) -> dict:
    """Headers for Supabase REST API calls using service_role_key."""
    return {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def supabase_url(settings: Settings, table: str) -> str:
    """Build the Supabase REST URL for a table."""
    return f"{settings.SUPABASE_URL}/rest/v1/{table}"


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    settings:    Settings = Depends(get_settings),
) -> str:
    """
    Verify the Supabase user JWT by calling GoTrue /auth/v1/user.

    This approach works independently of the local SUPABASE_JWT_SECRET value
    and additionally validates that the session has not been revoked.
    Returns the Supabase auth user ID (UUID).
    """
    token  = credentials.credentials
    client = get_http_client()

    resp = client.get(
        f"{settings.SUPABASE_URL}/auth/v1/user",
        headers={
            "apikey":        settings.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {token}",
        },
    )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id: str = resp.json().get("id", "")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID",
        )
    return user_id


def get_pseudonym_id(
    user_id:  str = Depends(get_current_user_id),
    settings: Settings = Depends(get_settings),
) -> str:
    """Look up the pseudonym_id for the authenticated user."""
    client = get_http_client()
    url    = supabase_url(settings, "user_profiles")
    resp   = client.get(
        url,
        headers=supabase_headers(settings),
        params={"auth_id": f"eq.{user_id}", "select": "pseudonym_id"},
    )
    data = resp.json()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Complete onboarding first.",
        )
    return data[0]["pseudonym_id"]
