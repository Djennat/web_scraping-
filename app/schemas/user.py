from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    interests: Optional[List[str]] = []
    allowed_websites: Optional[List[str]] = []

class UserCreate(BaseModel):
    username: str
    password: str
    role: str  # "user" or "admin"

class UserUpdate(BaseModel):
    interests: Optional[List[str]] = None
    # allowed_websites: Optional[List[str]] = None

class UserOut(BaseModel):
    id: str
    username: str
    role: str
    interests: Optional[List[str]] = None
    allowed_websites: Optional[List[str]] = None
    created_at: Optional[datetime] = None

class ScrapingRequestCreate(BaseModel):
    website_url: str

class ScrapingRequestOut(BaseModel):
    id: str
    user_id: str
    website_url: str
    status: str
    requested_at: datetime