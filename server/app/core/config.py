from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "A.B.E.L"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ─── LLM Provider ────────────────────────────────────────────────────────
    # Priority: auto → Ollama → Groq → OpenAI → mock
    LLM_PROVIDER: Literal["auto", "ollama", "groq", "openai", "mock"] = "auto"

    # Ollama (local, 100% free, no rate limits)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"         # or mistral, phi3, gemma2, deepseek-r1, etc.
    OLLAMA_TIMEOUT: int = 120              # seconds

    # Groq (cloud, free tier: 14 400 req/day on llama3.3-70b)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"  # or mixtral-8x7b-32768, gemma2-9b-it

    # OpenAI (paid, kept as fallback)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_TTS_MODEL: str = "tts-1"
    OPENAI_TTS_VOICE: str = "onyx"

    # ─── Database ─────────────────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ─── Security ─────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    # ─── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:4173"

    # ─── Agent Tools ──────────────────────────────────────────────────────────
    ENABLE_WEB_SEARCH: bool = True         # DuckDuckGo (free, no key)
    ENABLE_WEATHER: bool = True            # wttr.in (free, no key)
    ENABLE_CALCULATOR: bool = True         # Safe Python eval
    MAX_TOOL_ITERATIONS: int = 3           # Max tool calls per message

    # ─── Deezer OAuth (optionnel) ─────────────────────────────────────────────
    DEEZER_APP_ID: str = ""
    DEEZER_APP_SECRET: str = ""
    DEEZER_REDIRECT_URI: str = "http://localhost:5173/callback/deezer"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def has_openai(self) -> bool:
        return bool(self.OPENAI_API_KEY)

    @property
    def has_groq(self) -> bool:
        return bool(self.GROQ_API_KEY)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
