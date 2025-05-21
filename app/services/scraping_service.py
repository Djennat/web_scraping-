from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException
from app.core.database import db
from app.schemas.scraping import ScrapingResultCreate, ScrapingResultOut
from app.core.supabase import supabase

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

    # Step 1: Prepare document for MongoDB
    result_doc = {
        "user_id": user_id,
        "website_url": result.website_url if isinstance(result.website_url, list) else [result.website_url],
        "keywords": result.keywords,
        "results": result.results,
        "scraped_at": datetime.utcnow()
    }

    # Step 2: Store in MongoDB
    inserted = await db["scraping_results"].insert_one(result_doc)
    result_doc["id"] = str(inserted.inserted_id)
    result_doc.pop("_id", None)

    logger.info(f"Scraping result stored in MongoDB with ID {result_doc['id']}")

    # Step 3: Prepare for Supabase (flatten website_url to comma-separated string)
    try:
        supabase_result = supabase.table("scraping_results").insert({
            "result_id": result_doc["id"],
            "user_id": user_id,
            "website_url": ", ".join(result_doc["website_url"]),
            "keywords": result_doc["keywords"],
            "results": result_doc["results"],
            "scraped_at": result_doc["scraped_at"].isoformat()
        }).execute()

        logger.info("Scraping result also stored in Supabase.")
    except Exception as e:
        logger.error(f"Failed to store result in Supabase: {e}")

    return ScrapingResultOut(**result_doc)

async def get_user_scraping_results(user_id: str) -> List[ScrapingResultOut]:
    logger.info(f"Retrieving scraping results for user {user_id}")
    try:
        response = supabase.table("scraping_results").select("*").eq("user_id", user_id).execute()
        results = []
        for result in response.data:
            # Convert comma-separated website_url back to list
            result["website_url"] = [url.strip() for url in result["website_url"].split(",")]
            results.append(ScrapingResultOut(**result))
        logger.info(f"Retrieved {len(results)} scraping results for user {user_id} from Supabase")
        return results
    except Exception as e:
        logger.error(f"Failed to retrieve results from Supabase: {e}")
        return []

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