"""
Active Remedies regimen  —  /api/v1/remedies/active

The user's current remedy regimen: remedies they are taking regularly.
Each row persists until the user explicitly removes it.

Endpoints:
  GET    /          list the authenticated user's active remedies
  POST   /          add a remedy to the regimen
  DELETE /{id}      remove a remedy from the regimen

Auth:   Supabase JWT (Bearer token) — pseudonym_id resolved server-side.
Table:  public.active_remedies
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import get_settings, Settings
from app.core.security import (
    get_pseudonym_id,
    get_http_client,
    supabase_headers,
    supabase_url,
)

router = APIRouter(prefix="/api/v1/remedies/active", tags=["Active Remedies"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ActiveRemedyCreate(BaseModel):
    remedy_name:     str = Field(..., min_length=1, max_length=200)
    remedy_category: str = Field(default="other")
    emoji:           str = Field(default="✏️")
    unit:            str = Field(default="")


class ActiveRemedyResponse(BaseModel):
    id:              str
    pseudonym_id:    str
    remedy_name:     str
    remedy_category: str
    emoji:           str
    unit:            str
    started_at:      str


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[ActiveRemedyResponse], summary="List active regimen")
def list_active_remedies(
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings:     Settings = Depends(get_settings),
):
    """Return all active remedies for the authenticated user, oldest first."""
    client = get_http_client()
    resp = client.get(
        supabase_url(settings, "active_remedies"),
        headers=supabase_headers(settings),
        params={
            "pseudonym_id": f"eq.{pseudonym_id}",
            "order":        "started_at.asc",
            "select":       "*",
        },
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@router.post("/", response_model=ActiveRemedyResponse, status_code=201,
             summary="Add remedy to regimen")
def add_active_remedy(
    body:         ActiveRemedyCreate,
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings:     Settings = Depends(get_settings),
):
    """Add a remedy to the user's current regimen."""
    client = get_http_client()

    # Check for duplicate (same name + category)
    check = client.get(
        supabase_url(settings, "active_remedies"),
        headers=supabase_headers(settings),
        params={
            "pseudonym_id":    f"eq.{pseudonym_id}",
            "remedy_name":     f"eq.{body.remedy_name}",
            "remedy_category": f"eq.{body.remedy_category}",
            "select":          "id",
        },
    )
    if check.json():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This remedy is already in your regimen.",
        )

    resp = client.post(
        supabase_url(settings, "active_remedies"),
        headers=supabase_headers(settings),
        json={
            "pseudonym_id":    pseudonym_id,
            "remedy_name":     body.remedy_name,
            "remedy_category": body.remedy_category,
            "emoji":           body.emoji,
            "unit":            body.unit,
        },
    )
    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    data = resp.json()
    return data[0] if isinstance(data, list) else data


@router.delete("/{remedy_id}", status_code=204, summary="Remove remedy from regimen")
def remove_active_remedy(
    remedy_id:    str,
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings:     Settings = Depends(get_settings),
):
    """Remove a remedy from the user's regimen. Only the owner can delete their own rows."""
    client = get_http_client()
    resp = client.delete(
        supabase_url(settings, "active_remedies"),
        headers=supabase_headers(settings),
        params={
            "id":           f"eq.{remedy_id}",
            "pseudonym_id": f"eq.{pseudonym_id}",   # security: can only delete own rows
        },
    )
    if resp.status_code not in (200, 204):
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
