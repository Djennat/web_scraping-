from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class User(BaseModel):
    username: str
    password: str  # Hashed password
    role: str  # "user" or "admin"
    interests: Optional[List[str]] = None
    allowed_websites: List[str] = []
    created_at: datetime = datetime.utcnow()

class ScrapingRequest(BaseModel):
    user_id: str
    website_url: str
    status: str  # "pending", "approved", "rejected"
    requested_at: datetime = datetime.utcnow()

class ScrapingResult(BaseModel):
    user_id: str
    website_url: str
    keywords: List[str]
    results: dict
    scraped_at: datetime = datetime.utcnow()