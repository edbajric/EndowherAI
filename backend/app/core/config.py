from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str
    # Optional — required only for the /api/v1/chat endpoint
    ANTHROPIC_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra   = "ignore"   # silently ignore unrecognised keys in .env


@lru_cache()
def get_settings() -> Settings:
    return Settings()
