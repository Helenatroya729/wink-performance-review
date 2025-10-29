from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os
from pathlib import Path


class Settings(BaseSettings):
    """Настройки приложения"""
    
    # OpenAI API настройки
    openai_api_key: str
    openai_base_url: str = "https://bothub.chat/api/v2/openai/v1"
    openai_model: str = "llama-4-scout"
    openai_temperature: float = 0.0
    
    # Настройки сервера
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Путь к промптам
    prompts_dir: Path = Path(__file__).parent / "prompts"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Игнорировать дополнительные поля
    )


@lru_cache()
def get_settings() -> Settings:
    """Получить настройки приложения (синглтон)"""
    return Settings()
