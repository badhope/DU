#!/usr/bin/env python3
"""
Enhanced Blog Sync Script - Starry Sky Theme
Fetches latest posts from CSDN/Juejin and updates README.md.
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


@retry_on_failure(max_retries=3, delay=1.0)
def fetch_juejin_posts(config, limit: int = 3) -> List[Dict[str, str]]:
    """
    Fetch posts from Juejin API.
    
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
    
    # 如果没有配置掘金用户ID，跳过
    if not blog_config.juejin_user_id:
        logger.info("Juejin user ID not configured, skipping")
        return posts
    
    payload = {
        "user_id": blog_config.juejin_user_id,
        "sort_type": 2,
        "limit": limit
    }
    
    try:
        response = requests.post(
            blog_config.juejin_api_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=blog_config.timeout
        )
        response.raise_for_status()
        
        data = response.json()
        
        # 处理不同版本的 API 响应
        if data.get("code") != 0:
            err_msg = data.get("message", data.get("err_msg", "Unknown error"))
            raise NetworkError(f"Juejin API error: {err_msg}")
        
        # 新 API 格式: data.get("data", {}).get("list", [])
        article_list = data.get("data", {}).get("list", data.get("data", []))
        
        for article in article_list[:limit]:
            # 处理不同的数据结构
            if isinstance(article, dict):
                # 新格式
                title = article.get("title", "")
                article_id = article.get("article_id", article.get("id", ""))
                mtime = article.get("mtime", article.get("update_time", ""))
            else:
                # 旧格式（兼容）
                article_info = article.get("article_info", {}) if isinstance(article, dict) else {}
                title = article_info.get("title", "")
                article_id = article.get("article_id", "")
                mtime = article_info.get("mtime", "")
            
            if title and article_id:
                posts.append({
                    "title": title,
                    "url": f"https://juejin.cn/post/{article_id}",
                    "source": "掘金",
                    "date": str(mtime)[:10] if mtime else ""
                })
        
        logger.info(f"Fetched {len(posts)} posts from Juejin")
        
    except Timeout:
        raise NetworkError(f"Juejin request timed out after {blog_config.timeout}s")
    except ConnectionError as e:
        raise NetworkError(f"Juejin connection error: {e}")
    except RequestException as e:
        raise NetworkError(f"Juejin request failed: {e}")
    except (KeyError, ValueError) as e:
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
    
    try:
        logger.info("📡 Fetching Juejin posts...")
        juejin_posts = fetch_juejin_posts(config, limit=config.blog.max_posts)
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
