#!/usr/bin/env python3
"""
Enhanced Blog Sync Script - Starry Sky Theme
Fetches latest posts from CSDN/Juejin and updates README.md.
"""

import re
import json
import logging
import time
from datetime import datetime
from typing import List, Dict, Optional
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


@retry_on_failure(max_retries=3, delay=1.0)
def fetch_csdn_posts(config, limit: int = 3) -> List[Dict[str, str]]:
    """
    Fetch posts from CSDN RSS feed.
    
    Args:
        config: Blog configuration
        limit: Maximum number of posts to fetch
        
    Returns:
        List of post dictionaries
        
    Raises:
        NetworkError: If fetching fails after retries
    """
    posts = []
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        response = requests.get(
            config.csdn_rss_url,
            headers=headers,
            timeout=config.timeout
        )
        response.raise_for_status()
        
        import xml.etree.ElementTree as ET
        root = ET.fromstring(response.content)
        
        for item in root.findall(".//item")[:limit]:
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            pub_date = item.findtext("pubDate", "")
            
            if title and link:
                posts.append({
                    "title": title,
                    "url": link,
                    "source": "CSDN",
                    "date": pub_date[:10] if pub_date else ""
                })
        
        logger.info(f"Fetched {len(posts)} posts from CSDN")
        
    except Timeout:
        raise NetworkError(f"CSDN request timed out after {config.timeout}s")
    except ConnectionError as e:
        raise NetworkError(f"CSDN connection error: {e}")
    except RequestException as e:
        raise NetworkError(f"CSDN request failed: {e}")
    except ET.ParseError as e:
        raise NetworkError(f"CSDN XML parse error: {e}")
    
    return posts


@retry_on_failure(max_retries=3, delay=1.0)
def fetch_juejin_posts(config, limit: int = 3) -> List[Dict[str, str]]:
    """
    Fetch posts from Juejin API.
    
    Args:
        config: Blog configuration
        limit: Maximum number of posts to fetch
        
    Returns:
        List of post dictionaries
        
    Raises:
        NetworkError: If fetching fails after retries
    """
    posts = []
    
    payload = {
        "user_id": config.juejin_user_id,
        "sort_type": 2,
        "limit": limit
    }
    
    try:
        response = requests.post(
            config.juejin_api_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=config.timeout
        )
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("err_msg") != "success":
            raise NetworkError(f"Juejin API error: {data.get('err_msg')}")
        
        for article in data.get("data", [])[:limit]:
            article_info = article.get("article_info", {})
            posts.append({
                "title": article_info.get("title", ""),
                "url": f"https://juejin.cn/post/{article.get('article_id', '')}",
                "source": "掘金",
                "date": article_info.get("mtime", "")[:10]
            })
        
        logger.info(f"Fetched {len(posts)} posts from Juejin")
        
    except Timeout:
        raise NetworkError(f"Juejin request timed out after {config.timeout}s")
    except ConnectionError as e:
        raise NetworkError(f"Juejin connection error: {e}")
    except RequestException as e:
        raise NetworkError(f"Juejin request failed: {e}")
    except (KeyError, json.JSONDecodeError) as e:
        raise NetworkError(f"Juejin response parse error: {e}")
    
    return posts


def format_blog_markdown(posts: List[Dict[str, str]]) -> str:
    """
    Format blog posts as markdown.
    
    Args:
        posts: List of post dictionaries
        
    Returns:
        str: Formatted markdown string
    """
    if not posts:
        return '<small>文章同步中...</small>'
    
    md_lines = []
    source_emoji = {'CSDN': '📕', '掘金': '📘'}
    
    for i, post in enumerate(posts[:3], 1):
        date_str = f" · {post['date']}" if post['date'] else ""
        emoji = source_emoji.get(post['source'], '📝')
        
        md_lines.append(
            f'<small>{i}. {emoji} <a href="{post["url"]}" '
            f'style="color:#a5f3fc;text-decoration:none;">{post["title"]}</a>{date_str}</small>'
        )
    
    return '<br>\n'.join(md_lines)


def update_readme_with_blog(posts: List[Dict[str, str]], readme_path: str = "README.md") -> bool:
    """
    Update README with blog posts.
    
    Args:
        posts: List of post dictionaries
        readme_path: Path to README file
        
    Returns:
        bool: True if successful
    """
    try:
        content = read_readme()
    except READMEError as e:
        logger.error(str(e))
        return False
    
    blog_markdown = format_blog_markdown(posts)
    
    blog_section = f'''<b>📚 最新文章</b>
<br>
<small>_更新于 {datetime.now().strftime('%Y-%m-%d')}_</small>
<br><br>
{blog_markdown}
'''
    
    pattern = r'(<!-- blog:start -->)\s*\n.*?\n(<!-- blog:end -->)'
    replacement = f'\\1\n\n{blog_section}\n<!-- blog:end -->'
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    if new_content == content:
        logger.warning("Could not find blog markers in README.md")
        return False
    
    try:
        write_readme(new_content)
        logger.info(f"Blog section updated with {len(posts)} posts")
        return True
    except READMEError as e:
        logger.error(str(e))
        return False


def main():
    """Main entry point."""
    logger.info("=" * 60)
    logger.info("📚 Blog Sync Script - Enhanced Version")
    logger.info("=" * 60)
    
    config = get_config()
    
    all_posts = []
    
    try:
        logger.info("📡 Fetching CSDN posts...")
        csdn_posts = fetch_csdn_posts(config.blog, limit=config.blog.max_posts)
        all_posts.extend(csdn_posts)
    except NetworkError as e:
        logger.error(f"Failed to fetch CSDN posts: {e}")
    
    try:
        logger.info("📡 Fetching Juejin posts...")
        juejin_posts = fetch_juejin_posts(config.blog, limit=config.blog.max_posts)
        all_posts.extend(juejin_posts)
    except NetworkError as e:
        logger.error(f"Failed to fetch Juejin posts: {e}")
    
    logger.info(f"📊 Total posts fetched: {len(all_posts)}")
    
    if all_posts:
        if update_readme_with_blog(all_posts[:config.blog.max_posts]):
            logger.info("✨ README updated successfully!")
        else:
            logger.error("❌ Failed to update README")
    else:
        logger.warning("⚠️ No posts fetched, skipping README update")
    
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
