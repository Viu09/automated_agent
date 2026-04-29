from __future__ import annotations

import os
from functools import lru_cache
from dataclasses import dataclass, field

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None


@dataclass
class Settings:
    project_name: str = "Life OS"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    backend_cors_origins: list[str] = field(default_factory=list)
    backend_cors_origin_regex: str | None = None

    postgres_server: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "life_os"
    postgres_user: str = "life_os"
    postgres_password: str = "life_os"

    redis_url: str = "redis://localhost:6379/0"

    weather_agent_default_latitude: float = 48.8566
    weather_agent_default_longitude: float = 2.3522
    weather_agent_default_label: str = "Paris, France"
    news_agent_default_topic: str = "technology"
    github_default_owner: str = ""
    github_default_repo: str = ""
    github_token: str | None = None

    @classmethod
    def from_env(cls) -> Settings:
        if load_dotenv is not None:
            load_dotenv()
        cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "")
        return cls(
            project_name=os.getenv("PROJECT_NAME", "Life OS"),
            environment=os.getenv("ENVIRONMENT", "development"),
            api_v1_prefix=os.getenv("API_V1_PREFIX", "/api/v1"),
            secret_key=os.getenv("SECRET_KEY", "change-me"),
            access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")),
            backend_cors_origins=[item.strip() for item in cors_origins.split(",") if item.strip()],
            backend_cors_origin_regex=os.getenv("BACKEND_CORS_ORIGIN_REGEX") or None,
            postgres_server=os.getenv("POSTGRES_SERVER", "localhost"),
            postgres_port=int(os.getenv("POSTGRES_PORT", "5432")),
            postgres_db=os.getenv("POSTGRES_DB", "life_os"),
            postgres_user=os.getenv("POSTGRES_USER", "life_os"),
            postgres_password=os.getenv("POSTGRES_PASSWORD", "life_os"),
            redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
            weather_agent_default_latitude=float(os.getenv("WEATHER_AGENT_DEFAULT_LATITUDE", "48.8566")),
            weather_agent_default_longitude=float(os.getenv("WEATHER_AGENT_DEFAULT_LONGITUDE", "2.3522")),
            weather_agent_default_label=os.getenv("WEATHER_AGENT_DEFAULT_LABEL", "Paris, France"),
            news_agent_default_topic=os.getenv("NEWS_AGENT_DEFAULT_TOPIC", "technology"),
            github_default_owner=os.getenv("GITHUB_DEFAULT_OWNER", ""),
            github_default_repo=os.getenv("GITHUB_DEFAULT_REPO", ""),
            github_token=os.getenv("GITHUB_TOKEN") or None,
        )

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings.from_env()


settings = get_settings()
