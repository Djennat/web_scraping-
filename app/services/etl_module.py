import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import re
from urllib.parse import urlparse
from dataclasses import dataclass

@dataclass
class SpiderResult:
    """Data class for spider result validation"""
    url: str
    keyword: str
    title: str
    authors: str
    date: str
    content: str
    character_count: int
    request_id: str
    user_id: str

class TextCleaner:
    """Handles text cleaning operations"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text content"""
        if not text:
            return ""
        # Remove extra whitespace while preserving paragraph breaks
        text = re.sub(r'\n\s*\n', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        # Preserve special characters and formatting
        text = re.sub(r'[^\w\s.,;:!?éèêëàâäôöûüçÉÈÊËÀÂÄÔÖÛÜÇ\-\(\)\[\]\{\}\'\"\n\r\t]', '', text)
        return text.strip()

    @staticmethod
    def extract_domain(url: str) -> Optional[str]:
        """Extract domain from URL"""
        try:
            if not url:
                return None
            domain = urlparse(url).netloc.replace("www.", "")
            return domain if domain else None
        except Exception:
            return None

class DateFormatter:
    """Handles date formatting and validation"""
    
    @staticmethod
    def format_date(date_str: str) -> Tuple[str, bool]:
        """
        Format date string
        Returns: (formatted_date, is_valid)
        """
        if not date_str:
            return "", False
        try:
            # Try to parse and validate the date
            datetime.strptime(date_str, "%Y-%m-%d")
            return date_str, True
        except ValueError:
            return date_str, False

class ETLTransformer:
    """Transforms spider results to backend format with validation"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.text_cleaner = TextCleaner()
        self.date_formatter = DateFormatter()

    def _validate_spider_result(self, result: Dict[str, Any]) -> Optional[SpiderResult]:
        """Validate and extract spider result fields"""
        try:
            # Check required fields
            required_fields = ['URL', 'Mot_clé', 'Contenu']
            missing_fields = [field for field in required_fields if not result.get(field)]
            if missing_fields:
                self.logger.error(f"Missing required fields: {', '.join(missing_fields)}")
                return None

            # Extract and clean fields
            return SpiderResult(
                url=str(result['URL']).strip(),
                keyword=str(result['Mot_clé']).strip(),
                title=self.text_cleaner.clean_text(str(result.get('Titre', ''))),
                authors=self.text_cleaner.clean_text(str(result.get('Auteurs', ''))),
                date=str(result.get('Date', '')).strip(),
                content=self.text_cleaner.clean_text(str(result['Contenu'])),
                character_count=int(result.get('Nombre_caractères', 0)),
                request_id=str(result.get('request_id', '')).strip(),
                user_id=str(result.get('user_id', '')).strip()
            )
        except Exception as e:
            self.logger.error(f"Error validating spider result: {str(e)}")
            return None

    def transform_spider_result(self, spider_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Transform spider result to backend format with validation
        
        Args:
            spider_result: Raw result from spider
            
        Returns:
            Transformed result in backend format or None if transformation fails
        """
        try:
            # Validate and extract fields
            validated_result = self._validate_spider_result(spider_result)
            if not validated_result:
                return None

            # Extract domain
            domain = self.text_cleaner.extract_domain(validated_result.url)
            if not domain:
                self.logger.error(f"Could not extract domain from URL: {validated_result.url}")
                return None

            # Format date
            date, is_valid = self.date_formatter.format_date(validated_result.date)
            if not is_valid:
                self.logger.warning(f"Invalid date format: {validated_result.date}, keeping original")

            # Transform to backend format
            result_doc = {
                "user_id": validated_result.user_id,
                "request_id": validated_result.request_id,
                "website_url": [domain],  # List of domains as expected by backend
                "keywords": [validated_result.keyword],  # List of keywords as expected by backend
                "results": {
                    "title": validated_result.title,
                    "content": validated_result.content,
                    "date": date,
                    "authors": validated_result.authors,
                    "character_count": validated_result.character_count or len(validated_result.content)
                },
                "scraped_at": datetime.utcnow().isoformat()
            }

            self.logger.info(f"Successfully transformed result for URL: {validated_result.url}")
            return result_doc

        except Exception as e:
            self.logger.error(f"Error transforming spider result: {str(e)}")
            return None

    def transform_batch(self, spider_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Transform a batch of spider results to backend format
        
        Args:
            spider_results: List of raw results from spider
            
        Returns:
            List of transformed results in backend format
        """
        transformed_results = []
        for result in spider_results:
            transformed = self.transform_spider_result(result)
            if transformed:
                transformed_results.append(transformed)
        
        self.logger.info(f"Transformed {len(transformed_results)} out of {len(spider_results)} results")
        return transformed_results

def main():
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(name)s] %(levelname)s: %(message)s'
    )

    # Example usage
    transformer = ETLTransformer()
    
    # Example spider result
    spider_result = {
        'URL': 'https://example.com/article',
        'Mot_clé': 'example',
        'Titre': 'Example Article',
        'Contenu': 'This is an example article content.',
        'Nombre_caractères': 30,
        'Date': '2024-03-20',
        'Auteurs': 'John Doe',
        'request_id': '123',
        'user_id': 'user123'
    }
    
    # Transform single result
    transformed = transformer.transform_spider_result(spider_result)
    if transformed:
        print("Transformed result:", transformed)

if __name__ == "__main__":
    main() 