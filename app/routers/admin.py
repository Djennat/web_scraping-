from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.user import UserCreate, UserOut
from app.schemas.scraping import ScrapingRequestOut
from app.services.user_service import create_user, get_users
from app.services.scraping_service import approve_scraping_request, reject_scraping_request
from app.services.auth_service import get_current_admin
import logging
from app.core.database import db
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(tags=["admin"])

@router.post("/users", response_model=UserOut)
async def create_new_user(user: UserCreate, current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin['username']} attempting to create user {user.username} with role {user.role}")
    if user.role not in ["user", "admin"]:
        logger.error("Invalid role specified")
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    new_user = await create_user(user)
    logger.info(f"User {user.username} created successfully with role {user.role}")
    return new_user

@router.get("/users", response_model=List[UserOut])
async def list_users(current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin['username']} retrieving all users")
    users = await get_users()
    return users

@router.get("/requests", response_model=List[ScrapingRequestOut])
async def list_scraping_requests(current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin['username']} retrieving scraping requests")
    requests = await db["scraping_requests"].find().to_list(None)
    return [ScrapingRequestOut(**{**req, "id": str(req["_id"]), "_id": None}) for req in requests]

@router.post("/requests/{request_id}/approve")
async def approve_request(request_id: str, current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin['username']} approving scraping request {request_id}")
    await approve_scraping_request(request_id, current_admin["_id"])
    return {"message": "Scraping request approved"}

@router.post("/requests/{request_id}/reject")
async def reject_request(request_id: str, current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin['username']} rejecting scraping request {request_id}")
    await reject_scraping_request(request_id, current_admin["_id"])
    return {"message": "Scraping request rejected"}