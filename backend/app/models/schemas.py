from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


# ── Symptom Logs ──

class SymptomLogCreate(BaseModel):
    log_date: date = Field(default_factory=date.today)
    pain_level: int = Field(ge=0, le=10)
    cycle_day: Optional[int] = Field(None, ge=1, le=60)
    bleeding_intensity: Optional[str] = None
    mood: Optional[str] = None
    fatigue_level: Optional[int] = Field(None, ge=0, le=10)
    notes: Optional[str] = None


class SymptomLogResponse(BaseModel):
    id: str
    pseudonym_id: str
    log_date: str
    pain_level: int
    cycle_day: Optional[int] = None
    bleeding_intensity: Optional[str] = None
    mood: Optional[str] = None
    fatigue_level: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None


# ── Weekly Logs ──

class WeeklyLogCreate(BaseModel):
    avg_pain: int = Field(ge=0, le=10)
    bloating: int = Field(ge=0, le=10)
    sleep_quality: Optional[int] = Field(None, ge=0, le=4)
    anxiety: Optional[int] = Field(None, ge=0, le=4)
    bowel_symptoms: Optional[int] = Field(None, ge=0, le=10)
    urinary_symptoms: Optional[int] = Field(None, ge=0, le=10)
    notes: Optional[str] = None


class WeeklyLogResponse(BaseModel):
    id: str
    pseudonym_id: str
    week_start: str
    avg_pain: int
    bloating: int
    sleep_quality: Optional[int] = None
    anxiety: Optional[int] = None
    bowel_symptoms: Optional[int] = None
    urinary_symptoms: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None


# ── Remedy Logs ──

class RemedyLogCreate(BaseModel):
    remedy_name: str = Field(min_length=1, max_length=200)
    remedy_category: str = "other"
    effectiveness: Optional[int] = Field(None, ge=0, le=10)
    duration_minutes: Optional[int] = None
    log_date: date = Field(default_factory=date.today)
    notes: Optional[str] = None


class RemedyLogResponse(BaseModel):
    id: str
    pseudonym_id: str
    log_date: str
    remedy_name: str
    remedy_category: str
    effectiveness: Optional[int] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None


# ── User Profile ──

class UserProfileResponse(BaseModel):
    pseudonym_id: str
    consent_flag: Optional[bool] = None
    consent_timestamp: Optional[str] = None


# ── Dashboard Stats ──

class DashboardStats(BaseModel):
    total_logs: int = 0
    avg_pain: float = 0.0
    avg_fatigue: float = 0.0
    most_common_mood: str = "—"
    total_remedies: int = 0
    total_weekly: int = 0
