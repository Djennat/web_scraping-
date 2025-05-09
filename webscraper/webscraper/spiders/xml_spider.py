import scrapy
from scrapy_selenium import SeleniumRequest
from webscraper.xml_parser import parse_xml
import os
import logging
import re

class XmlSpider(scrapy.Spider):
    name = 'xml_spider'
    
    custom_settings = {
        'FEEDS': {
            'resultats.csv': {
                'format': 'csv',
                'encoding': 'utf-8',
                'fields': ['URL', 'Mot_clé', 'Titre', 'Contenu', 'Date', 'Auteurs'],
                'overwrite': True,
            },
        },
        'SELENIUM_DRIVER_NAME': 'firefox',
        'SELENIUM_DRIVER_EXECUTABLE_PATH': r'C:\Users\celine\scraper_project\geckodriver.exe',
        'SELENIUM_BROWSER_EXECUTABLE_PATH': r'C:\Program Files\Mozilla Firefox\firefox.exe',
        'SELENIUM_DRIVER_ARGUMENTS': ['-headless'],
        'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'ROBOTSTXT_OBEY': False,
        'DOWNLOAD_DELAY': 3,
        'CONCURRENT_REQUESTS': 1,
        'DOWNLOAD_TIMEOUT': 30,
    }

    def __init__(self, *args, **kwargs):
        super(XmlSpider, self).__init__(*args, **kwargs)
        csv_path = os.path.join(os.getcwd(), 'resultats.csv')
        if os.path.exists(csv_path):
            os.remove(csv_path)
            self.logger.info(f"Removed existing CSV file: {csv_path}")

    def start_requests(self):
        self.logger.info("Starting spider...")
        sites = parse_xml('config.xml')
        
        if not sites:
            self.logger.error("No sites found in config.xml")
            return
            
        self.logger.info(f"Found {len(sites)} sites to process")
        
        for site in sites:
            self.logger.info(f"Processing site: {site['url']}")
            yield SeleniumRequest(
                url=site['url'],
                callback=self.parse,
                meta={'keywords': site['keywords']},
                wait_time=30,
                wait_until=lambda driver: driver.execute_script('return document.readyState') == 'complete',
                dont_filter=True,
                headers={
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
            )

    def clean_text(self, text):
        if not text:
            return ""
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s.,;:!?éèêëàâäôöûüçÉÈÊËÀÂÄÔÖÛÜÇ-]', '', text)
        return text.strip()

    def extract_metadata(self, response):
        metadata = {
            'title': '',
            'authors': '',
            'date': ''
        }
        
        title_selectors = [
            'title::text', 'h1::text', '.title::text', '.article-title::text',
            '.post-title::text', '.entry-title::text', '.content-title::text',
            '#title::text', '[itemprop="headline"]::text'
        ]
        for selector in title_selectors:
            title = response.css(selector).get()
            if title:
                metadata['title'] = self.clean_text(title)
                break

        author_selectors = [
            '.author::text', '.authors::text', '.byline::text',
            '[itemprop="author"]::text', '.post-author::text',
            '.article-author::text', '.contributor::text'
        ]
        authors = []
        for selector in author_selectors:
            authors.extend(response.css(selector).getall())
        metadata['authors'] = ', '.join([self.clean_text(author) for author in authors if author.strip()])

        date_selectors = [
            '.date::text', '.published::text', '.post-date::text',
            '[itemprop="datePublished"]::text', '.article-date::text',
            '.timestamp::text', '.time::text'
        ]
        for selector in date_selectors:
            date = response.css(selector).get()
            if date:
                metadata['date'] = self.clean_text(date)
                break

        return metadata

    def parse(self, response):
        try:
            keywords = response.meta['keywords']
            self.logger.info(f"Parsing URL: {response.url}")
            
            metadata = self.extract_metadata(response)
            self.logger.info(f"Extracted title: {metadata['title']}")
            
            content_selectors = [
                'article', '.article', '.post', '.entry',
                '.content', '.main', '.body', '.text',
                '[itemprop="articleBody"]', '.article-content',
                '.post-content', '.entry-content'
            ]
            
            content_parts = []
            for selector in content_selectors:
                content_parts.extend(response.css(f'{selector}::text, {selector} *::text').getall())
            
            content = ' '.join([
                self.clean_text(text) for text in content_parts
                if text.strip() 
                and not text.strip().startswith('{')
                and not text.strip().startswith('document.')
                and not text.strip().startswith('Skip to')
                and not text.strip().startswith('Advertisement')
                and not text.strip().startswith('Cookie')
                and not text.strip().startswith('Sign in')
                and len(text.strip()) > 3
            ])
            
            self.logger.info(f"Content length: {len(content)}")
            if content:
                self.logger.info(f"Content preview: {content[:200]}...")
            else:
                self.logger.warning(f"No content extracted from {response.url}")
                return

            found_keywords = False
            for keyword in keywords:
                if keyword.lower() in content.lower():
                    self.logger.info(f"Found keyword: {keyword}")
                    found_keywords = True
                    yield {
                        'URL': response.url,
                        'Mot_clé': keyword,
                        'Titre': metadata['title'],
                        'Contenu': content[:1000],
                        'Date': metadata['date'],
                        'Auteurs': metadata['authors']
                    }
            
            if not found_keywords:
                self.logger.warning(f"No keywords found in content for {response.url}")
                
        except Exception as e:
            self.logger.error(f"Error in parse method: {str(e)}")