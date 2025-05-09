import xml.etree.ElementTree as ET
import logging

def parse_xml(file_path):
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        sites = []
        
        for site in root.findall('site'):
            url = site.find('url').text
            keywords = [keyword.text for keyword in site.findall('keywords/keyword')]
            sites.append({
                'url': url,
                'keywords': keywords
            })
            logging.info(f"Found site: {url} with keywords: {keywords}")
            
        return sites
    except Exception as e:
        logging.error(f"Error parsing XML file: {str(e)}")
        return []