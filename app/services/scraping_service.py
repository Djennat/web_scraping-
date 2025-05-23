from typing import List, Optional
from datetime import datetime
from fastapi import HTTPException
from app.core.database import db
from app.schemas.scraping import ScrapingResultCreate, ScrapingResultOut
from app.core.supabase import supabase
from app.services.email_service import send_scraping_status_email, send_scraping_results_email
from app.services.etl_module import ETLTransformer
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

    # Get user information for email notification
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        logger.error(f"User {user_id} not found")
        raise HTTPException(status_code=404, detail="User not found")

    # Step 1: Store raw result in MongoDB
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

    logger.info(f"Scraping result stored in MongoDB with ID {result_doc['id']}")

    # Step 2: Apply ETL transformation before storing in Supabase
    transformer = ETLTransformer()

    # Reconstruct a flat version that mimics spider result for ETL input
    spider_result_input = {
        "URL": result.website_url[0] if isinstance(result.website_url, list) else result.website_url,
        "Mot_clé": result.keywords[0] if isinstance(result.keywords, list) else result.keywords,
        "Titre": "",  # Since results is now a string, we'll use empty defaults
        "Contenu": result.results,  # Use the results string directly as content
        "Nombre_caractères": len(result.results),  # Calculate character count from the string
        "Date": datetime.utcnow().strftime("%Y-%m-%d"),  # Use current date
        "Auteurs": "",  # Empty default for authors
        "request_id": result_doc["id"],
        "user_id": user_id
    }

    result_etl = transformer.transform_spider_result(spider_result_input)

    if result_etl:
        try:
            # Convert the results dictionary to a JSON string for Supabase
            results_json = {
                "title": result_etl["results"]["title"],
                "content": result_etl["results"]["content"],
                "date": result_etl["results"]["date"],
                "authors": result_etl["results"]["authors"],
                "character_count": result_etl["results"]["character_count"]
            }

            supabase_data = {
                "result_id": result_etl["request_id"],
                "user_id": result_etl["user_id"],
                "website_url": ", ".join(result_etl["website_url"]),
                "keywords": ", ".join(result_etl["keywords"]),
                "results": results_json,
                "scraped_at": result_etl["scraped_at"]
            }
            
            logger.info(f"Attempting to store in Supabase with data: {supabase_data}")
            
            supabase_result = supabase.table("scraping_results").insert(supabase_data).execute()
            
            logger.info(f"Supabase response: {supabase_result}")

            if hasattr(supabase_result, 'error') and supabase_result.error:
                logger.error(f"Supabase error: {supabase_result.error}")
            else:
                logger.info("Scraping result successfully stored in Supabase after ETL.")
                
                # Send email notification
                await send_scraping_results_email(
                    email=user["email"],
                    username=user["username"],
                    website_url=result.website_url[0] if isinstance(result.website_url, list) else result.website_url,
                    result_id=result_doc["id"]
                )
        except Exception as e:
            logger.error(f"Failed to store result in Supabase: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
    else:
        logger.warning("ETL transformation failed. Result not stored in Supabase.")

    return ScrapingResultOut(**result_doc)

async def get_user_scraping_results(user_id: str) -> List[ScrapingResultOut]:
    logger.info(f"Retrieving scraping results for user {user_id}")
    try:
        # First try to get from Supabase
        response = supabase.table("scraping_results").select("*").eq("user_id", user_id).execute()
        logger.info(f"Supabase response: {response}")
        
        results = []
        if response.data:
            for result in response.data:
                try:
                    # Convert the data to match ScrapingResultOut format
                    formatted_result = {
                        "id": result.get("result_id", ""),
                        "website_url": result.get("website_url", "").split(", ") if result.get("website_url") else [],
                        "keywords": result.get("keywords", "").split(", ") if result.get("keywords") else [],
                        "results": result.get("results", {}).get("content", ""),  # Get content from results JSON
                        "scraped_at": datetime.fromisoformat(result.get("scraped_at", datetime.utcnow().isoformat()))
                    }
                    results.append(ScrapingResultOut(**formatted_result))
                except Exception as e:
                    logger.error(f"Error formatting result: {str(e)}")
                    continue

        # If no results in Supabase, try MongoDB as fallback
        if not results:
            logger.info("No results found in Supabase, trying MongoDB...")
            mongo_results = await db["scraping_results"].find({"user_id": user_id}).to_list(length=None)
            for result in mongo_results:
                result["id"] = str(result.pop("_id"))
                results.append(ScrapingResultOut(**result))

        logger.info(f"Retrieved {len(results)} scraping results for user {user_id}")
        return results
    except Exception as e:
        logger.error(f"Failed to retrieve results: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return []

async def approve_scraping_request(request_id: str, admin_id: str, admin_message: str = None):
    logger.info(f"Approving scraping request {request_id}")
    
    # Get the request and user info
    request = await db["scraping_requests"].find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Scraping request not found")
    
    user = await db["users"].find_one({"_id": ObjectId(request["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update request status
    result = await db["scraping_requests"].update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": "approved",
                "approved_by": admin_id,
                "approved_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to approve request")
    
    # Send email notification
    await send_scraping_status_email(
        email=user["email"],
        username=user["username"],
        website_url=request["website_url"],
        status="approved",
        # admin_message="Your request has been approved. You can now start scraping this website."
    )
    
    logger.info(f"Scraping request {request_id} approved successfully")

async def reject_scraping_request(request_id: str, admin_id: str, admin_message: str = None):
    logger.info(f"Rejecting scraping request {request_id}")
    
    # Get the request and user info
    request = await db["scraping_requests"].find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Scraping request not found")
    
    user = await db["users"].find_one({"_id": ObjectId(request["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update request status
    result = await db["scraping_requests"].update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": "rejected",
                "rejected_by": admin_id,
                "rejected_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to reject request")
    
    # Send email notification
    await send_scraping_status_email(
        email=user["email"],
        username=user["username"],
        website_url=request["website_url"],
        status="rejected",
        # admin_message="Your request has been rejected if you have any question contact admin."
    )
    
    logger.info(f"Scraping request {request_id} rejected successfully")