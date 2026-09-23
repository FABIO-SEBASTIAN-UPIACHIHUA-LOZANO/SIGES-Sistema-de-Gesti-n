from typing import List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "SisTec API"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "super_secret_jwt_key_sistec_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    DATABASE_URL: str = "postgresql://sistec_user:sistec_password@postgres:5432/sistec_db"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()