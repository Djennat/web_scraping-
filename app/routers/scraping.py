from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import Response
from typing import List
from app.services.scraping_service import store_xml_temp, get_xml_temp, store_scraping_result, get_user_scraping_results
from app.schemas.scraping import ScrapingResultCreate, ScrapingResultOut, UploadXMLResponse
from app.services.auth_service import get_current_user
from app.utils.xml_parser import parse_xml
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/xml", response_model=UploadXMLResponse)
async def upload_xml(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    logger.info(f"Uploading XML for user {current_user['_id']}")
    if file.content_type != "application/xml":
        logger.error("Invalid file type, must be XML")
        raise HTTPException(status_code=400, detail="Invalid file type. Must be XML")
    content = await file.read()
    xml_data = parse_xml(content)
    if xml_data.url not in current_user["allowed_websites"]:
        logger.error(f"Website {xml_data.url} not allowed for user {current_user['_id']}")
        raise HTTPException(status_code=403, detail="Website not allowed for scraping")
    request_id = store_xml_temp(current_user["_id"], xml_data.url, content)
    logger.info(f"XML temporarily queued with request_id {request_id}")
    return UploadXMLResponse(request_id=request_id, message="XML received and ready for robot")

@router.get("/xml")
async def fetch_xml(request_id: str, current_user: dict = Depends(get_current_user)):
    logger.info(f"Robot fetching XML for user {current_user['_id']} with request_id {request_id}")
    xml_content = get_xml_temp(current_user["_id"], request_id)
    if not xml_content:
        logger.error(f"No XML found for user {current_user['_id']} with request_id {request_id}")
        raise HTTPException(status_code=404, detail="No XML available for this request")
    logger.info(f"XML retrieved for request_id {request_id}")
    return Response(content=xml_content, media_type="application/xml")

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