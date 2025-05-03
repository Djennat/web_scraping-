from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    interests: Optional[List[str]] = []
    allowed_websites: Optional[List[str]] = []

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str  # "user" or "admin"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    interests: Optional[List[str]] = None
    # allowed_websites: Optional[List[str]] = None

class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr
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