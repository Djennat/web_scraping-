from typing import List
from datetime import datetime
from fastapi import HTTPException
from app.core.database import db
from app.schemas.user import UserCreate, UserOut, ScrapingRequestCreate, ScrapingRequestOut
from passlib.context import CryptContext
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_user(user: UserCreate) -> UserOut:
    logger.info(f"Creating user {user.username} with role {user.role}")
    hashed_password = pwd_context.hash(user.password)
    user_doc = {
        "username": user.username,
        "password": hashed_password,
        "role": user.role,
        "interests": [],
        "allowed_websites": [],
        "created_at": datetime.utcnow()
    }
    existing_user = await db["users"].find_one({"username": user.username})
    if existing_user:
        logger.error(f"Username {user.username} already exists")
        raise HTTPException(status_code=400, detail="Username already exists")
    result = await db["users"].insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)  # Rename _id to id for UserOut
    user_doc.pop("_id", None)  # Remove _id to avoid conflicts
    logger.info(f"User {user.username} created with ID {user_doc['id']}")
    logger.debug(f"UserOut input: {user_doc}")
    try:
        user_out = UserOut(**user_doc)
        return user_out
    except Exception as e:
        logger.error(f"Failed to create UserOut: {str(e)}")
        raise

async def get_users() -> List[UserOut]:
    logger.info("Retrieving all users")
    users = []
    cursor = db["users"].find()
    async for user in cursor:
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        try:
            users.append(UserOut(**user))
        except Exception as e:
            logger.error(f"Failed to parse user {user.get('username')}: {str(e)}")
            continue
    logger.info(f"Retrieved {len(users)} users")
    return users

async def create_scraping_request(user_id: str, request: ScrapingRequestCreate) -> ScrapingRequestOut:
    logger.info(f"Creating scraping request for user {user_id}")
    request_doc = {
        "user_id": user_id,
        "website_url": request.website_url,
        "status": "pending",
        "requested_at": datetime.utcnow()
    }
    
    result = await db["scraping_requests"].insert_one(request_doc)
    request_doc["id"] = str(result.inserted_id)
    request_doc.pop("_id", None)
    
    try:
        return ScrapingRequestOut(**request_doc)
    except Exception as e:
        logger.error(f"Failed to create ScrapingRequestOut: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create scraping request")