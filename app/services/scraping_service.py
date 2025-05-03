from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException
from app.core.database import db
from app.schemas.scraping import ScrapingResultCreate, ScrapingResultOut
import uuid
import logging
from bson import ObjectId

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


xml_queue = {}

def store_xml_temp(user_id: str, website_url: List[str], content: bytes) -> str:
    logger.info(f"Queuing XML for user {user_id}")
    request_id = str(uuid.uuid4())
    xml_queue[request_id] = {
        "user_id": user_id,
        "website_url": website_url,
        "content": content
    }
    return request_id

def get_xml_temp(user_id: str, request_id: str) -> Optional[bytes]:
    logger.info(f"Retrieving XML for user {user_id} with request_id {request_id}")
    if request_id in xml_queue and xml_queue[request_id]["user_id"] == user_id:
        content = xml_queue[request_id]["content"]
        del xml_queue[request_id]
        logger.info(f"XML retrieved for request_id {request_id}")
        return content
    logger.warning(f"No XML found for user {user_id} with request_id {request_id}")
    return None

async def store_scraping_result(user_id: str, result: ScrapingResultCreate) -> ScrapingResultOut:
    logger.info(f"Storing scraping result for user {user_id}")
    result_doc = {
        "user_id": user_id,
        "website_url": result.website_url if isinstance(result.website_url, list) else [result.website_url],
        "keywords": result.keywords,
        "results": result.results,
        "scraped_at": datetime.utcnow()
    }
    inserted = await db["scraping_results"].insert_one(result_doc)
    result_doc["id"] = str(inserted.inserted_id)
    result_doc.pop("_id", None)
    logger.info(f"Scraping result stored with ID {result_doc['id']}")
    return ScrapingResultOut(**result_doc)

async def get_user_scraping_results(user_id: str) -> List[ScrapingResultOut]:
    logger.info(f"Retrieving scraping results for user {user_id}")
    results = []
    cursor = db["scraping_requests"].find({"user_id": user_id})
    async for result in cursor:
        result["id"] = str(result["_id"])
        result.pop("_id", None)
        results.append(ScrapingResultOut(**result))
    logger.info(f"Retrieved {len(results)} scraping results for user {user_id}")
    return results

async def approve_scraping_request(request_id: str, admin_id: str):
    logger.info(f"Approving scraping request {request_id} by admin {admin_id}")
    request = await db["scraping_requests"].find_one({"_id": ObjectId(request_id)})
    if not request:
        logger.error(f"Scraping request {request_id} not found")
        raise HTTPException(status_code=404, detail="Scraping request not found")
    user_id = request["user_id"]
    website_url = request["website_url"]
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"allowed_websites": website_url}}
    )
    await db["scraping_requests"].delete_one({"_id": ObjectId(request_id)})
    logger.info(f"Scraping request {request_id} approved, website {website_url} added to user {user_id}")


async def reject_scraping_request(request_id: str, admin_id: str):
    logger.info(f"Rejecting scraping request {request_id} by admin {admin_id}")
    request = await db["scraping_requests"].find_one({"_id": ObjectId(request_id)})
    if not request:
        logger.error(f"Scraping request {request_id} not found")
        raise HTTPException(status_code=404, detail="Scraping request not found")
    await db["scraping_requests"].delete_one({"_id": ObjectId(request_id)})
    logger.info(f"Scraping request {request_id} rejected")