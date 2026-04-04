#!/usr/bin/env python3
"""
Blog Sync Script - Starry Sky Theme
Fetches latest posts from CSDN/Juejin and updates README.md.
"""

import re
import json
from datetime import datetime

try:
    import requests
except ImportError:
    requests = None


CSDN_RSS_URL = "https://blog.csdn.net/weixin_56622231/rss/list"
JUEJIN_API_URL = "https://api.juejin.cn/content_api/v1/article/query"


BLOG_SOURCES = {
    "csdn": {
        "name": "CSDN",
        "url": "https://blog.csdn.net/weixin_56622231",
        "rss": CSDN_RSS_URL,
    },
    "juejin": {
        "name": "掘金",
        "url": "https://juejin.cn/user/2350111542479753",
        "api": JUEJIN_API_URL,
    }
}


def fetch_csdn_posts(limit=3):
    posts = []
    if not requests:
        return posts

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(
            BLOG_SOURCES["csdn"]["rss"],
            headers=headers,
            timeout=15
        )
        if response.status_code == 200:
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
    except Exception as e:
        print(f"CSDN fetch error: {e}")

    return posts


def fetch_juejin_posts(limit=3):
    posts = []
    if not requests:
        return posts

    try:
        payload = {
            "user_id": "2350111542479753",
            "sort_type": 2,
            "limit": limit
        }
        response = requests.post(
            JUEJIN_API_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("err_msg") == "success":
                for article in data.get("data", [])[:limit]:
                    posts.append({
                        "title": article.get("article_info", {}).get("title", ""),
                        "url": f"https://juejin.cn/post/{article.get('article_id', '')}",
                        "source": "掘金",
                        "date": article.get("article_info", {}).get("mtime", "")[:10]
                    })
    except Exception as e:
        print(f"Juejin fetch error: {e}")

    return posts


def format_blog_markdown(posts):
    if not posts:
        return '<small>文章同步中...</small>'

    md_lines = []
    for i, post in enumerate(posts[:3], 1):
        date_str = f" · {post['date']}" if post['date'] else ""
        source_emoji = {
            'CSDN': '📕',
            '掘金': '📘'
        }.get(post['source'], '📝')

        md_lines.append(
            f'<small>{i}. {source_emoji} <a href="{post["url"]}" style="color:#a5f3fc;text-decoration:none;">{post["title"]}</a>{date_str}</small>'
        )

    return '<br>\n'.join(md_lines)


def update_readme(csdn_posts, juejin_posts):
    readme_path = "README.md"

    try:
        with open(readme_path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: {readme_path} not found")
        return False

    all_posts = csdn_posts + juejin_posts
    blog_markdown = format_blog_markdown(all_posts[:3])

    blog_section = f'''<b>📚 最新文章</b>
<br>
<small>_更新于 {datetime.now().strftime('%Y-%m-%d')}_</small>
<br><br>
{blog_markdown}
'''

    pattern = r'(<!-- blog:start -->)\n.*?\n(<!-- blog:end -->)'
    replacement = f'\\1\n\n{blog_section}\n<!-- blog:end -->'

    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    if new_content == content:
        print("Warning: Could not find blog markers in README.md")
        return False

    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"Blog section updated with {len(all_posts)} posts!")
    return True


def main():
    print("=" * 60)
    print("📚 Blog Sync Script - Starry Sky Theme")
    print("=" * 60)
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    print("  📡 Fetching CSDN...")
    csdn_posts = fetch_csdn_posts(limit=3)

    print("  📡 Fetching 掘金...")
    juejin_posts = fetch_juejin_posts(limit=3)

    print()
    print(f"📊 Total posts fetched: {len(csdn_posts) + len(juejin_posts)}")
    print(f"   - CSDN: {len(csdn_posts)} posts")
    print(f"   - 掘金: {len(juejin_posts)} posts")
    print()

    if update_readme(csdn_posts, juejin_posts):
        print()
        print("✨ All done! Your README has been updated with the latest posts.")
    else:
        print()
        print("❌ Failed to update README.")

    print("=" * 60)


if __name__ == "__main__":
    main()