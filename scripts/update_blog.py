#!/usr/bin/env python3
"""
Enhanced Blog Sync Script - Starry Sky Theme
Fetches latest posts from CSDN and updates README.md.
"""

import re
import logging
from datetime import datetime
from typing import List, Dict, Optional

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
        read_readme, write_readme, READMEError, NetworkError, logger, retry_on_failure
    )
except ImportError:
    from config import get_config
    from helpers import (
        read_readme, write_readme, READMEError, NetworkError, logger, retry_on_failure
    )


@retry_on_failure(max_retries=3, delay=1.0)
def fetch_csdn_posts(config, limit: int = 3) -> List[Dict[str, str]]:
    """
    Fetch posts from CSDN RSS feed.
    
    Args:
        config: Blog configuration or full Config object
        limit: Maximum number of posts to fetch
        
    Returns:
        List of post dictionaries
        
    Raises:
        NetworkError: If fetching fails after retries
    """
    posts = []
    
    # Handle both cases: config is a full Config or just BlogConfig
    blog_config = config.blog if hasattr(config, 'blog') else config
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        response = requests.get(
            blog_config.csdn_rss_url,
            headers=headers,
            timeout=blog_config.timeout
        )
        response.raise_for_status()
        
        import xml.etree.ElementTree as ET
        root = ET.fromstring(response.content)
        
        for item in root.findall(".//item")[:limit]:
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            pub_date = item.findtext("pubDate", "")
            
            # Parse RFC-822 date format (e.g., "Fri, 22 May 2026 12:00:00 GMT")
            formatted_date = ""
            if pub_date:
                try:
                    from email.utils import parsedate_to_datetime
                    dt = parsedate_to_datetime(pub_date)
                    formatted_date = dt.strftime("%Y-%m-%d")
                except (ImportError, ValueError):
                    # Fallback if parsing fails
                    pass
            
            if title and link:
                posts.append({
                    "title": title,
                    "url": link,
                    "source": "CSDN",
                    "date": formatted_date
                })
        
        logger.info(f"Fetched {len(posts)} posts from CSDN")
        
    except Timeout:
        raise NetworkError(f"CSDN request timed out after {blog_config.timeout}s")
    except ConnectionError as e:
        raise NetworkError(f"CSDN connection error: {e}")
    except RequestException as e:
        raise NetworkError(f"CSDN request failed: {e}")
    except Exception as e:
        raise NetworkError(f"CSDN processing error: {e}")
    
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
    
    for i, post in enumerate(posts[:3], 1):
        date_str = f" · {post['date']}" if post['date'] else ""
        
        md_lines.append(
            f'<small>{i}. 📕 <a href="{post["url"]}" '
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
    
    blog_section = f'<b>📚 最新文章</b>\n<br>\n<small>_更新于 {datetime.now().strftime("%Y-%m-%d")}_</small>\n<br><br>\n{blog_markdown}'
    
    pattern = r'<!-- blog:start -->.*?<!-- blog:end -->'
    replacement = f'<!-- blog:start -->\n\n{blog_section}\n\n<!-- blog:end -->'
    
    # 检查标记位置
    start_idx = content.find('<!-- blog:start -->')
    end_idx = content.find('<!-- blog:end -->')
    match = re.search(pattern, content, flags=re.DOTALL)
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    if new_content == content:
        # 检查是否替换成功但内容相同（内容未变化）
        if match:
            logger.info("博客内容已是最新，无需更新")
            return True  # 内容已是最新，视为成功
        else:
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
        csdn_posts = fetch_csdn_posts(config, limit=config.blog.max_posts)
        all_posts.extend(csdn_posts)
    except NetworkError as e:
        logger.error(f"Failed to fetch CSDN posts: {e}")
    
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
