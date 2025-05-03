from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from typing import List
from app.services.scraping_service import store_xml_temp, get_xml_temp, store_scraping_result, get_user_scraping_results
from app.schemas.scraping import ScrapingResultCreate, ScrapingResultOut, UploadXMLResponse, ScrapingXML
from app.services.auth_service import get_current_user
import logging
import xml.etree.ElementTree as ET
from datetime import datetime
from app.core.database import db
from app.utils.xml_parser import generate_xml

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/xml", response_model=UploadXMLResponse)
async def upload_xml(xml_data: ScrapingXML, current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"Creating XML request for user {current_user['_id']}")
        
        # Check if all URLs in the list are allowed
        for url in xml_data.url:
            if url not in current_user["allowed_websites"]:
                logger.error(f"Website {url} not allowed for user {current_user['_id']}")
                raise HTTPException(status_code=403, detail=f"Website {url} not allowed for scraping")
        
        # Generate XML content
        xml_content = generate_xml(xml_data.url, xml_data.keywords)
        
        # Store in temporary queue
        request_id = store_xml_temp(current_user["_id"], xml_data.url, xml_content)
        
        # Store XML in database
        xml_doc = {
            "user_id": current_user["_id"],
            "request_id": request_id,
            "website_url": xml_data.url,
            "xml_content": xml_content.decode('utf-8'),
            "created_at": datetime.utcnow()
        }
        await db["xml_requests"].insert_one(xml_doc)
        logger.info(f"XML request stored in database with request_id {request_id}")
        
        return UploadXMLResponse(request_id=request_id, message="XML request created and stored")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing XML request: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process XML request")

@router.get("/xml")
async def fetch_xml(request_id: str, current_user: dict = Depends(get_current_user)):
    try:
        logger.info(f"Robot fetching XML for user {current_user['_id']} with request_id {request_id}")
        xml_content = get_xml_temp(current_user["_id"], request_id)
        if not xml_content:
            logger.error(f"No XML found for user {current_user['_id']} with request_id {request_id}")
            raise HTTPException(status_code=404, detail="No XML available for this request")
        
        # Delete the XML request from database after fetching
        await db["xml_requests"].delete_one({
            "user_id": current_user["_id"],
            "request_id": request_id
        })
        logger.info(f"XML request deleted from database for request_id {request_id}")
        
        logger.info(f"XML retrieved for request_id {request_id}")
        return Response(content=xml_content, media_type="application/xml")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching XML: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch XML")
    


@router.post("/results", response_model=ScrapingResultOut)
async def store_result(result: ScrapingResultCreate, current_user: dict = Depends(get_current_user)):
    logger.info(f"Storing scraping result for user {current_user['_id']}")
    stored_result = await store_scraping_result(current_user["_id"], result)
    logger.info("Scraping result stored")
    return stored_result

@router.get("/results", response_model=List[ScrapingResultOut])
async def get_scraping_results(current_user: dict = Depends(get_current_user)):
    logger.info(f"Retrieving scraping results for user {current_user['_id']}")
    results = await get_user_scraping_results(current_user["_id"])
    logger.info(f"Retrieved {len(results)} results")
    return results