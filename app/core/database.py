# database.py
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGODB_URL = settings.MONGODB_URL
DATABASE_NAME = settings.DATABASE_NAME

if not MONGODB_URL or not DATABASE_NAME:
    logger.error("MONGODB_URL or DATABASE_NAME not set")
    raise ValueError("MONGODB_URL and DATABASE_NAME must be set")

try:
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    logger.info("MongoDB connection established")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    raise
