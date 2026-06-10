"""
POST /api/v1/chat/

Conversational AI endpoint grounded in:
  1. Global SHAP research findings (what patterns predict PCOS/Endo in our cohort)
  2. User's local LIME factors from their last predict call (personalises the reply)

Security:
  - Requires a valid Supabase JWT (Bearer token)
  - Only pseudonym_id is used for auth — no PII enters this module
  - All responses include a hardcoded non-diagnostic disclaimer

Model: claude-haiku-4-5-20251001  (fast, cost-effective for chat)
"""

from __future__ import annotations

import logging
from typing import Optional

import anthropic
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import get_settings, Settings
from app.core.security import get_pseudonym_id

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])

# ─────────────────────────────────────────────────────────────────────────────
# Global SHAP research context
# Derived from the EndoWherAI stacking ensemble trained on N=175 participants.
# ─────────────────────────────────────────────────────────────────────────────
_SHAP_CONTEXT = """
ENDOWHERAI RESEARCH COHORT — GLOBAL FINDINGS (N=175 participants)

Top predictive features by mean |SHAP| value:
1. Age — older patients more likely to have a confirmed diagnosis (reflects 7–10 year diagnostic delay)
2. Duration between first symptoms and PCOS diagnosis — longer delay = higher burden
3. Duration between first symptoms and Endometriosis diagnosis — same pattern
4. Pelvic ultrasound findings — key diagnostic indicator
5. Omega-3 supplementation — positively correlated with symptom relief (avg 6.5/10)
6. Anti-inflammatory diet — strong correlation with improvement (avg 7.2/10)
7. Composite pain score (mean across all pain locations) — cumulative burden matters
8. Pelvic pain outside the period — core clinical marker
9. Magnesium supplementation — consistently correlated with improvement (avg 6.8/10)
10. High-pain-count — number of pain locations scoring 7+ is highly significant

Most effective remedies reported by cohort (patient-rated effectiveness 0–10):
- Heat therapy (heating pad / warm bath): 8.1/10
- Anti-inflammatory diet (whole foods, reduced sugar/processed food): 7.2/10
- Gentle stretching / Yoga / Pilates: 7.0/10
- Magnesium supplementation: 6.8/10
- Reduced processed food: 6.8/10
- Omega-3 (fish oil / similar): 6.5/10
- Pelvic floor physiotherapy: 6.3/10
- Chamomile tea: 6.0/10

Key research patterns observed:
- Composite pain (multiple locations) is more predictive than any single pain site
- Treatment-seeking behaviour correlates with a confirmed diagnosis
- Anti-inflammatory dietary changes show the most consistent patient-reported benefit
- The 7–10 year diagnostic gap is clearly reflected in the age feature's dominance
"""

_SYSTEM_PROMPT_TEMPLATE = """You are EndoWherAI, a compassionate and scientifically-grounded AI research assistant specialising in PCOS and Endometriosis.

You have access to anonymised findings from a research cohort study of 175 participants.

{shap_context}

{lime_context}

GUIDELINES:
- Be warm, empathetic, and evidence-based
- When discussing remedies, always cite cohort effectiveness data (e.g. "In our cohort, heat therapy rated 8.1/10")
- Use phrases like "Based on our research cohort..." or "Pattern analysis shows..."
- Acknowledge the 7-10 year diagnostic delay when relevant — it is a real systemic problem
- Never diagnose, prescribe medications, or recommend stopping medical treatment
- Encourage users to work with their healthcare team for any medical decisions
- Keep responses to 2-3 concise paragraphs — users are often in pain and need clear answers
- If LIME factors are available, personalise your answer around those specific factors

EXAMPLE RESPONSE STYLE:
User: "What helps with my pain?"
Assistant: "Based on our research cohort, heat therapy (8.1/10 effectiveness) and anti-inflammatory diet (7.2/10) show the strongest correlations with pain reduction. [Personalise further if LIME factors available.] Magnesium supplementation is also frequently cited as helpful. I'd encourage discussing these with your healthcare provider to find what works best for your specific situation."
"""


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────

class LIMEFactor(BaseModel):
    symptom:      str
    rule:         str
    contribution: float
    direction:    str


class ChatRequest(BaseModel):
    message:      str              = Field(..., min_length=1, max_length=2000)
    lime_factors: list[LIMEFactor] = Field(
        default_factory=list,
        description="Top LIME factors from user's last predict call — used to personalise the response",
    )


class ChatResponse(BaseModel):
    reply:      str
    disclaimer: str = (
        "This response is for educational purposes only and does not constitute "
        "medical advice, diagnosis, or treatment. Always consult a qualified "
        "healthcare professional for any health concerns."
    )


# ─────────────────────────────────────────────────────────────────────────────
# Route
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=ChatResponse,
    summary="AI research assistant chat grounded in SHAP/LIME findings",
    responses={
        401: {"description": "Missing or invalid JWT"},
        503: {"description": "ANTHROPIC_API_KEY not configured in backend/.env"},
    },
)
def chat(
    body: ChatRequest,
    pseudonym_id: str = Depends(get_pseudonym_id),
    settings: Settings = Depends(get_settings),
) -> ChatResponse:
    """
    Sends a user message to the EndoWherAI research assistant.

    Grounded intelligence:
    - Global SHAP findings (what features drive the stacking ensemble)
    - User's personal LIME factors, if provided from a recent /predict call

    Authentication: Supabase JWT required.
    Privacy: Only pseudonym_id is resolved — no PII enters this handler or the AI prompt.
    Disclaimer: Hardcoded in every response — the UI also displays it persistently.
    """
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI chat is not configured. Add ANTHROPIC_API_KEY to backend/.env",
        )

    # Build personalised LIME context block when available
    lime_section = ""
    if body.lime_factors:
        lines = "\n".join(
            f"  - {f.rule}: "
            f"{'increases' if f.direction == 'increases_risk' else 'decreases'} risk "
            f"(contribution {f.contribution:+.3f})"
            for f in body.lime_factors[:3]
        )
        lime_section = (
            "THIS USER'S PERSONAL RISK FACTORS (LIME analysis of their last assessment):\n"
            f"{lines}\n\n"
            "Reference these specific factors when answering questions about what might help them personally."
        )

    system_prompt = _SYSTEM_PROMPT_TEMPLATE.format(
        shap_context=_SHAP_CONTEXT,
        lime_context=lime_section,
    )

    try:
        client  = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            system=system_prompt,
            messages=[{"role": "user", "content": body.message}],
        )
        reply = message.content[0].text
    except anthropic.APIError as exc:
        log.error("Anthropic API error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service temporarily unavailable. Please try again.",
        ) from exc

    return ChatResponse(reply=reply)
