from typing import List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "SIGES API"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "super_secret_jwt_key_siges_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    DATABASE_URL: str = "postgresql://siges_user:siges_password@postgres:5432/siges_db"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "SIGES"
    SMTP_USE_TLS: bool = True
    PASSWORD_RESET_CODE_MINUTES: int = 10

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
