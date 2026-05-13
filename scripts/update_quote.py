#!/usr/bin/env python3
"""
Enhanced Daily Quote Update Script - Starry Sky Theme
Fetches a quote and updates README.md with the new content.
"""

import re
import json
import random
import logging
import time
from datetime import datetime
from typing import Dict, Optional
from functools import wraps

try:
    import requests
    from requests.exceptions import RequestException, Timeout, ConnectionError
except ImportError:
    raise ImportError(
        "requests library is required. Install with: pip install requests"
    )

from config import get_config
from helpers_v2 import (
    read_readme, write_readme, READMEError, NetworkError, logger
)


def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """
    Decorator to retry function on failure.
    
    Args:
        max_retries: Maximum number of retries
        delay: Delay between retries in seconds
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (RequestException, NetworkError) as e:
                    last_exception = e
                    logger.warning(
                        f"Attempt {attempt + 1}/{max_retries} failed: {e}"
                    )
                    if attempt < max_retries - 1:
                        time.sleep(delay * (attempt + 1))
            raise NetworkError(
                f"All {max_retries} attempts failed: {last_exception}"
            )
        return wrapper
    return decorator


def fetch_quote_from_api(api_url: str, timeout: int) -> Optional[Dict[str, str]]:
    """
    Fetch quote from a single API.
    
    Args:
        api_url: API endpoint URL
        timeout: Request timeout in seconds
        
    Returns:
        Quote dictionary or None
    """
    try:
        response = requests.get(api_url, timeout=timeout)
        response.raise_for_status()
        
        data = response.json()
        
        if isinstance(data, list) and len(data) > 0:
            return {
                "text": data[0].get("q", ""),
                "author": data[0].get("a", "")
            }
        elif isinstance(data, dict):
            return {
                "text": data.get("content", ""),
                "author": data.get("author", "")
            }
        
        return None
        
    except (RequestException, json.JSONDecodeError, KeyError) as e:
        logger.debug(f"API {api_url} failed: {e}")
        return None


def fetch_quote(config) -> Dict[str, str]:
    """
    Fetch quote from multiple APIs with fallback.
    
    Args:
        config: Quote configuration
        
    Returns:
        Quote dictionary
    """
    for api_url in config.quote.apis:
        try:
            quote = fetch_quote_from_api(api_url, config.quote.timeout)
            if quote and quote.get("text"):
                logger.info(f"Successfully fetched quote from {api_url}")
                return quote
        except Exception as e:
            logger.debug(f"Failed to fetch from {api_url}: {e}")
            continue
    
    logger.warning("All APIs failed, using fallback quote")
    return random.choice(config.quote.fallback_quotes)


def format_quote_markdown(quote: Dict[str, str]) -> str:
    """
    Format quote as markdown.
    
    Args:
        quote: Quote dictionary with text and author
        
    Returns:
        str: Formatted markdown string
    """
    text = quote.get("text", "")
    author = quote.get("author", "Unknown")
    
    return (
        f'<b>✨ 每日星语</b>\n'
        f'<br>\n'
        f'<small>*"{text}"*</small>'
    )


def update_readme_with_quote(quote_text: str) -> bool:
    """
    Update README with quote.
    
    Args:
        quote_text: Formatted quote text
        
    Returns:
        bool: True if successful
    """
    try:
        content = read_readme()
    except READMEError as e:
        logger.error(str(e))
        return False
    
    pattern = r'(<!-- quote:start -->)\n.*?\n(<!-- quote:end -->)'
    replacement = f'\\1\n\n{quote_text}\n\n<!-- quote:end -->'
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    if new_content == content:
        logger.warning("Could not find quote markers in README.md")
        return False
    
    try:
        write_readme(new_content)
        logger.info("Quote updated successfully")
        return True
    except READMEError as e:
        logger.error(str(e))
        return False


def main():
    """Main entry point."""
    logger.info("=" * 60)
    logger.info("🌟 Daily Star Quote Update Script - Enhanced Version")
    logger.info("=" * 60)
    
    config = get_config()
    
    quote = fetch_quote(config)
    
    logger.info(f'📝 Quote: "{quote["text"]}" — {quote["author"]}')
    
    quote_markdown = format_quote_markdown(quote)
    
    if update_readme_with_quote(quote_markdown):
        logger.info("✨ README updated with fresh star quote!")
    else:
        logger.error("❌ Failed to update README")
    
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
