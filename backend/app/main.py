from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.diary import router as diary_router
from app.api.v1.weekly import router as weekly_router
from app.api.v1.remedies import router as remedies_router
from app.api.v1.active_remedies import router as active_remedies_router
from app.api.v1.remedy_insights import router as remedy_insights_router
from app.api.v1.predict import router as predict_router
from app.api.v1.chat import router as chat_router
from app.ml.engine import load_model

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ML model artifact once at startup; release resources on shutdown."""
    try:
        load_model()
        log.info("ML engine ready.")
    except FileNotFoundError as exc:
        log.warning("ML model artifact not found – /predict endpoint will return 503. (%s)", exc)
    yield
    # Nothing to tear down for a joblib model


app = FastAPI(
    title="EndowherAI API",
    description="Backend API for symptom tracking, weekly check-ins, remedy logging, and ML-powered insights.",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(diary_router)
app.include_router(weekly_router)
app.include_router(remedies_router)
app.include_router(active_remedies_router)
app.include_router(remedy_insights_router)
app.include_router(predict_router)
app.include_router(chat_router)


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "EndowherAI API", "version": "0.2.0"}
