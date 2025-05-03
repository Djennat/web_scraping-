from xml.etree import ElementTree as ET
from fastapi import HTTPException
from io import BytesIO
from app.schemas.scraping import ScrapingXML
import xml.etree.ElementTree as ET
import logging
from datetime import datetime
from typing import List
logger = logging.getLogger(__name__)

def parse_xml(xml_content: bytes) -> ScrapingXML:
    try:
        tree = ET.parse(BytesIO(xml_content))
        root = tree.getroot()
        url = root.find("url").text
        keywords = [kw.text for kw in root.findall("keywords/keyword")]
        return ScrapingXML(url=url, keywords=keywords)
    except ET.ParseError:
        raise ValueError("Invalid XML format")
    


def generate_xml(url: List[str], keywords: List[str]) -> bytes:
        try:
            root = ET.Element("scraping_request")
            
            
            for single_url in url:
                site_elem = ET.SubElement(root, "site")

                url_elem = ET.SubElement(site_elem, "url")
                url_elem.text = single_url

                keywords_elem = ET.SubElement(site_elem, "keywords")
                for keyword in keywords:
                    keyword_elem = ET.SubElement(keywords_elem, "keyword")
                    keyword_elem.text = keyword
        
            timestamp_elem = ET.SubElement(root, "timestamp")
            timestamp_elem.text = datetime.utcnow().isoformat()
            tree = ET.ElementTree(root)
            
            xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
            xml_content = xml_declaration.encode('utf-8') + ET.tostring(root, encoding='utf-8', method='xml')
            
            return xml_content
        except Exception as e:
            logger.error(f"Error generating XML: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate XML")