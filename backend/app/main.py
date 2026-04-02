from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.diary import router as diary_router
from app.api.v1.weekly import router as weekly_router
from app.api.v1.remedies import router as remedies_router

app = FastAPI(
    title="EndowherAI API",
    description="Backend API for symptom tracking, weekly check-ins, and remedy logging.",
    version="0.1.0",
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


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "EndowherAI API"}
