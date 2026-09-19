import os
from pydantic import BaseModel
from typing import List, Optional

class Settings(BaseModel):
    PROJECT_NAME: str = "OBSERVA - Multimodal Accessibility OS"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./observa.db")
    
    # Vision & AI Configuration
    YOLO_MODEL: str = os.getenv("YOLO_MODEL", "yolo11n.pt")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    
    # Escalation
    DEFAULT_ESCALATION_TIMEOUT_SECONDS: int = int(os.getenv("DEFAULT_ESCALATION_TIMEOUT", "60"))
    
    # Environment
    ENV: str = os.getenv("ENV", "development")
    DEMO_MODE_DEFAULT: bool = os.getenv("DEMO_MODE_DEFAULT", "true").lower() == "true"

settings = Settings()
