from pydantic import BaseModel, EmailStr,Field
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    interests: Optional[List[str]] = []
    allowed_websites: Optional[List[str]] = []
    is_active: bool = True

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
    allowed_websites: Optional[List[str]] = Field(default_factory=lambda: [
        "https://www.cerist.dz/",
        "https://dgrsdt.dz/",
        "https://www.crasc.dz/",
        "https://www.cread.dz/",
        "https://allconferencealert.net",
        "https://ruralm.hypotheses.org/",
        "https://www.univ-boumerdes.dz/universit%C3%A9/cruc.html",
        "https://www.univ-tlemcen.dz/fr/actualites/3525/scientific-conference-at-the-university-of-tlemcen",
        "https://www.mesrs.dz"
    ])
    created_at: Optional[datetime] = None
    is_active: bool = True
class ScrapingRequestCreate(BaseModel):
    website_url: str

class ScrapingRequestOut(BaseModel):
    id: str
    user_id: str
    website_url: str
    status: str
    requested_at: datetime