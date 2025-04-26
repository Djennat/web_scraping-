from xml.etree import ElementTree as ET
from io import BytesIO
from app.schemas.scraping import ScrapingXML

def parse_xml(xml_content: bytes) -> ScrapingXML:
    try:
        tree = ET.parse(BytesIO(xml_content))
        root = tree.getroot()
        url = root.find("url").text
        keywords = [kw.text for kw in root.findall("keywords/keyword")]
        return ScrapingXML(url=url, keywords=keywords)
    except ET.ParseError:
        raise ValueError("Invalid XML format")