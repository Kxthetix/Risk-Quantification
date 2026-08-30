from functools import lru_cache
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Application settings
    APP_NAME: str = "Cybersecurity Risk & Financial Impact Platform"
    APP_ENV: str = "development"  # development, testing, staging, production
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database configuration & Connection Pooling
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cyber_risk_db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # JWT & Authentication configuration (Hardened Phase 10)
    JWT_SECRET_KEY: str = "super-secret-key-change-this-in-production-min-32-chars-length"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Rate Limiting configuration
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_ANONYMOUS_RPM: int = 60
    RATE_LIMIT_AUTHENTICATED_RPM: int = 300
    RATE_LIMIT_EXPENSIVE_RPM: int = 30
    RATE_LIMIT_BURST_MULTIPLIER: float = 1.5

    # Security Headers configuration
    SECURITY_HEADERS_ENABLED: bool = True
    HSTS_MAX_AGE_SECONDS: int = 31536000
    CSP_POLICY: str = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "font-src 'self' data:; "
        "connect-src 'self';"
    )

    # Observability & Monitoring configuration
    PROMETHEUS_METRICS_ENABLED: bool = True
    LOG_LEVEL: str = "INFO"
    STRUCTURED_LOGGING: bool = True
    SENTRY_DSN: Optional[str] = None
    OTEL_ENDPOINT: Optional[str] = None

    # Storage & File Upload limits
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = ["json", "csv", "pdf", "txt", "log"]

    # Background Workers & Idempotency
    IDEMPOTENCY_CACHE_TTL_SECONDS: int = 86400
    WORKER_MAX_RETRIES: int = 3
    WORKER_TIMEOUT_SECONDS: int = 300

    # NVD API configuration (Phase 3)
    NVD_API_KEY: Optional[str] = None
    NVD_BASE_URL: str = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    NVD_REQUEST_TIMEOUT: int = 30
    NVD_RATE_LIMIT_DELAY: float = 0.6

    # Redis configuration
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"

    @property
    def is_testing(self) -> bool:
        return self.APP_ENV.lower() == "testing"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
