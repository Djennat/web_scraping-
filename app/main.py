from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, admin, users, scraping
from app.core.database import db
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(admin.router, prefix="/admin")
app.include_router(users.router, prefix="/users")
app.include_router(scraping.router, prefix="/scraping")

@app.on_event("startup")
async def startup_event():
    if db is None:
        logger.error("Database connection not initialized")
        raise ValueError("Database connection not initialized")
    logger.info("Application started")

@app.get("/")
async def root():
    return {"message": "Web Scraping Backend API"}