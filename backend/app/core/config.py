"""
Configuración global de la aplicación.
Lee las variables del .env usando Pydantic Settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Configuración tipada del backend."""

    # Aplicación
    app_name: str = "DANI-ETH Backend"
    app_env: str = "development"
    app_debug: bool = True
    app_port: int = 8000

    # CORS
    cors_origins: str = "http://localhost:5173"

    # Firebase
    firebase_credentials_path: str = "./credentials/firebase-admin-key.json"
    firebase_project_id: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Gemini (lo configura el compañero del orquestador)
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-1.5-flash"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Convierte el string de orígenes en lista."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Singleton de configuración (cacheado)."""
    return Settings()


# Instancia exportada para uso directo
settings = get_settings()
