from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.services.user_service import create_scraping_request
from app.services.auth_service import get_current_user,get_current_admin
from app.schemas.user import UserOut, UserUpdate, ScrapingRequestCreate, ScrapingRequestOut
from app.core.database import db
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="", tags=["users"])

@router.get("/me", response_model=UserOut)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):

    user_data = current_user.copy()
    user_data["id"] = str(user_data.pop("_id"))
    
    user_data.setdefault("interests", [])
    user_data.setdefault("allowed_websites", [])
    if "created_at" not in user_data:
        user_data["created_at"] = datetime.utcnow()
    
    return UserOut(**user_data)

@router.post("/profile", response_model=UserOut)
async def update_profile(update: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = update.dict(exclude_unset=True)
    
    if current_user["role"] == "user":
        if "allowed_websites" in update_data:
            del update_data["allowed_websites"]

        if not update_data:  #
            raise HTTPException(status_code=400, detail="Regular users can only update their interests")
    
    if update_data:
        result = await db["users"].update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": update_data}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db["users"].find_one({"_id": ObjectId(current_user["_id"])})
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    

    user_data = updated_user.copy()
    user_data["id"] = str(user_data.pop("_id"))
    

    user_data.setdefault("interests", [])
    # user_data.setdefault("allowed_websites", [])
    if "created_at" not in user_data:
        user_data["created_at"] = datetime.utcnow()
    
    return UserOut(**user_data)

@router.post("/requests", response_model=ScrapingRequestOut)
async def submit_scraping_request(
    request: ScrapingRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    scraping_request = await create_scraping_request(str(current_user["_id"]), request)
    return scraping_request