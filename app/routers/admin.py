from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Optional
from app.schemas.user import UserCreate, UserOut
from app.schemas.scraping import ScrapingRequestOut
from app.services.user_service import create_user, get_users
from app.services.scraping_service import approve_scraping_request, reject_scraping_request
from app.services.auth_service import get_current_admin
import logging
from app.core.database import db
from bson.objectid import ObjectId

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
async def approve_request(
    request_id: str,
    admin_message: Optional[str] = Body(None, description="Optional message to include in the approval email"),
    current_admin: dict = Depends(get_current_admin)
):
    logger.info(f"Admin {current_admin['username']} approving scraping request {request_id}")
    await approve_scraping_request(request_id, current_admin["_id"], admin_message)
    return {"message": "Scraping request approved"}

@router.post("/requests/{request_id}/reject")
async def reject_request(
    request_id: str,
    admin_message: Optional[str] = Body(None, description="Optional message to include in the rejection email"),
    current_admin: dict = Depends(get_current_admin)
):
    logger.info(f"Admin {current_admin['username']} rejecting scraping request {request_id}")
    await reject_scraping_request(request_id, current_admin["_id"], admin_message)
    return {"message": "Scraping request rejected"}

@router.post("/users/{user_id}/deactivate", response_model=UserOut)
async def deactivate_user(user_id: str, current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin['username']} attempting to deactivate user {user_id}")
    
    result = await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = updated_user.copy()
    user_data["id"] = str(user_data.pop("_id"))
    return UserOut(**user_data)