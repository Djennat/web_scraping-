from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import List, Optional

load_dotenv()

class Settings(BaseSettings):
    SECRET_KEY: str
    MONGODB_URL: str
    DATABASE_NAME: str
    CORS_ORIGINS: str
    EMAIL_SENDER: Optional[str] = None
    EMAIL_PASSWORD: Optional[str] = None
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()