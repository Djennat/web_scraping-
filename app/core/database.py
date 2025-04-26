from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

if not MONGODB_URL or not DATABASE_NAME:
    logger.error("MONGODB_URL or DATABASE_NAME not set in .env")
    raise ValueError("MONGODB_URL and DATABASE_NAME must be set in .env")

try:
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    logger.info("MongoDB connection established")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    raise