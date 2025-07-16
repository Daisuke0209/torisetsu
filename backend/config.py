from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database settings
    database_url: str = "postgresql://guidify:guidify_password@localhost:5432/guidify_db"
    
    # Authentication settings
    secret_key: str = "your-secret-key-here-please-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Gemini API settings
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.0-flash"
    gemini_temperature: float = 0.7
    gemini_max_tokens: int = 8192
    
    # File upload settings
    upload_folder: str = "./uploads"
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    allowed_video_types: list = ["video/mp4", "video/avi", "video/mov", "video/wmv"]
    
    # Application settings
    app_name: str = "TORISETSU"
    app_version: str = "1.0.0"
    debug: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Override with environment variables if they exist
        if os.getenv('GEMINI_API_KEY'):
            self.gemini_api_key = os.getenv('GEMINI_API_KEY')

settings = Settings()