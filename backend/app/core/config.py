from pydantic_settings import BaseSettings
from typing import Optional
import secrets
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://iamaas:iamaas@postgres:5432/iamaas"
    
    # JWT - Sécurité renforcée
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24h par défaut
    
    # Google OAuth (for future use)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    
    # SendGrid
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@iamaas.com"
    FROM_NAME: str = "IAMAAS Platform"
    
    # App
    APP_NAME: str = "IAMAAS"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Sécurité
    ALLOWED_HOSTS: list = ["localhost", "127.0.0.1", "0.0.0.0"]
    CORS_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    RATE_LIMIT_PER_HOUR: int = int(os.getenv("RATE_LIMIT_PER_HOUR", "1000"))
    
    # Password Policy
    MIN_PASSWORD_LENGTH: int = int(os.getenv("MIN_PASSWORD_LENGTH", "8"))
    REQUIRE_SPECIAL_CHAR: bool = os.getenv("REQUIRE_SPECIAL_CHAR", "true").lower() == "true"
    REQUIRE_UPPERCASE: bool = os.getenv("REQUIRE_UPPERCASE", "true").lower() == "true"
    REQUIRE_LOWERCASE: bool = os.getenv("REQUIRE_LOWERCASE", "true").lower() == "true"
    REQUIRE_DIGIT: bool = os.getenv("REQUIRE_DIGIT", "true").lower() == "true"
    
    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings() 