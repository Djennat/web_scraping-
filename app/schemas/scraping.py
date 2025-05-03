from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime

class ScrapingXML(BaseModel):
    url: List[str]
    keywords: List[str]

class ScrapingResultCreate(BaseModel):
    website_url:List[str]
    keywords: List[str]
    results: Dict

class ScrapingResultOut(BaseModel):
    id: str
    website_url:List[str]
    keywords: List[str]
    results: Dict
    scraped_at: datetime

class ScrapingRequestOut(BaseModel):
    id: str
    user_id: str
    website_url: str
    requested_at: datetime

class UploadXMLResponse(BaseModel):
    request_id: str
    message: str