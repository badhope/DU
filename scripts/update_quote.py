#!/usr/bin/env python3
"""
Enhanced Daily Quote Update Script - Starry Sky Theme
Fetches a quote and updates README.md with the new content.
"""

import re
import random
import logging
from typing import Dict, Optional

try:
    import requests
    from requests.exceptions import RequestException, Timeout, ConnectionError
except ImportError:
    raise ImportError(
        "requests library is required. Install with: pip install requests"
    )

try:
    from scripts.config import get_config
    from scripts.helpers import (
        read_readme, write_readme, READMEError, NetworkError, logger
    )
except ImportError:
    from config import get_config
    from helpers import (
        read_readme, write_readme, READMEError, NetworkError, logger
    )


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
        
    except (RequestException, ValueError, KeyError) as e:
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
    author = quote.get("author", "")
    
    if author:
        return f'<b>✨ 每日星语</b>\n<br>\n<small>— {author}: "{text}"</small>'
    return f'<b>✨ 每日星语</b>\n<br>\n<small>"{text}"</small>'


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
    
    pattern = r'(<!-- quote:start -->)\s*\n.*?\n(<!-- quote:end -->)'
    replacement = f'\\1\n\n{quote_text}\n\n\\2'
    
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
