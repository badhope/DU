#!/usr/bin/env python3
"""Update the "Recent Articles" section of ``README.md``.

The script pulls the latest blog posts from the configured source(s),
formats them using :mod:`scripts.common.format` and writes the result into
the ``<!-- blog:start -->`` ... ``<!-- blog:end -->`` markers.

The CSDN source is hard-coded today. The architecture is intentionally
pluggable: each source is implemented as its own function that returns a
list of ``{title, url, source, date}`` dicts.
"""

from __future__ import annotations

import logging
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime
from typing import Dict, List, Protocol

import requests

from scripts.common.config import BlogConfig, Config, get_config
from scripts.common.exceptions import (
    ConfigError,
    NetworkError,
    READMEError,
)
from scripts.common.format import format_blog_markdown
from scripts.common.http import create_session
from scripts.common.logger import get_logger
from scripts.common.readme import read_readme, update_section, write_readme

logger = get_logger("scripts.update_blog")

BLOG_START = "<!-- blog:start -->"
BLOG_END = "<!-- blog:end -->"


class BlogSource(Protocol):
    """Anything that can fetch blog posts given a configuration object."""

    def __call__(self, config: Config) -> List[Dict[str, str]]: ...


def _format_rfc822_date(value: str) -> str:
    """Parse an RFC-822 date (RSS) into ``YYYY-MM-DD``; return ``""`` on failure."""
    if not value:
        return ""
    try:
        return parsedate_to_datetime(value).strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        return ""


def fetch_csdn_posts(config: Config) -> List[Dict[str, str]]:
    """Fetch the latest posts from the CSDN RSS feed configured in ``config.blog``."""
    blog_config: BlogConfig = config.blog
    if not blog_config.enabled:
        logger.info("CSDN blog source is disabled")
        return []

    session = create_session(timeout=blog_config.max_posts and config.github.timeout)
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0 Safari/537.36"
        )
    }

    try:
        response = session.get(
            blog_config.csdn_rss_url,
            headers=headers,
            timeout=config.github.timeout,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise NetworkError(f"CSDN request failed: {exc}") from exc

    try:
        root = ET.fromstring(response.content)
    except ET.ParseError as exc:
        raise NetworkError(f"CSDN RSS parse error: {exc}") from exc

    posts: List[Dict[str, str]] = []
    for item in root.findall(".//item")[: blog_config.max_posts]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_date = item.findtext("pubDate") or ""
        if not (title and link):
            continue
        posts.append(
            {
                "title": title,
                "url": link,
                "source": "CSDN",
                "date": _format_rfc822_date(pub_date),
            }
        )

    logger.info("Fetched %d CSDN posts", len(posts))
    return posts


# Registry of blog sources. New sources can be added by appending a callable
# that follows the BlogSource protocol.
DEFAULT_SOURCES: List[BlogSource] = [fetch_csdn_posts]


def collect_posts(config: Config, sources: List[BlogSource]) -> List[Dict[str, str]]:
    """Run each source in order and merge the results, capped at ``max_posts``."""
    all_posts: List[Dict[str, str]] = []
    for source in sources:
        try:
            posts = source(config)
        except NetworkError as exc:
            logger.error("Source %s failed: %s", source.__name__, exc)
            continue
        all_posts.extend(posts)
        if len(all_posts) >= config.blog.max_posts:
            break
    return all_posts[: config.blog.max_posts]


def render_blog_section(posts: List[Dict[str, str]], config: Config) -> str:
    """Build the inner content for the blog marker block."""
    formatted = format_blog_markdown(posts, max_posts=config.blog.max_posts)
    return (
        f'<b>📚 最新文章</b>\n<br>\n'
        f'<small>_更新于 {datetime.now().strftime("%Y-%m-%d")}_</small>\n'
        f"<br><br>\n{formatted}"
    )


def update_readme(posts: List[Dict[str, str]], config: Config) -> bool:
    """Replace the blog section in ``README.md`` and return whether it changed."""
    try:
        content = read_readme()
    except READMEError as exc:
        logger.error(str(exc))
        return False

    section = render_blog_section(posts, config)
    new_content, changed = update_section(
        content, BLOG_START, BLOG_END, section
    )

    if not changed:
        if BLOG_START in content and BLOG_END in content:
            logger.info("Blog content is already up to date")
            return True
        logger.error("Could not find blog markers in README.md")
        return False

    try:
        write_readme(new_content)
    except READMEError as exc:
        logger.error(str(exc))
        return False
    logger.info("Blog section updated with %d posts", len(posts))
    return True


def main(sources: List[BlogSource] = None) -> int:
    """Command line entry point."""
    logger.info("=" * 60)
    logger.info("Blog Sync")
    logger.info("=" * 60)

    try:
        config = get_config()
    except ConfigError as exc:
        logger.error("Invalid configuration: %s", exc)
        return 2

    posts = collect_posts(config, sources or DEFAULT_SOURCES)
    if not posts:
        logger.warning("No posts fetched; skipping README update")
        return 1

    if update_readme(posts, config):
        logger.info("README blog section updated successfully")
        return 0
    logger.error("Failed to update README blog section")
    return 1


# Backwards-compatible helpers preserved for the test suite
def format_blog_section(posts: List[Dict[str, str]]) -> str:  # pragma: no cover
    return format_blog_markdown(posts, max_posts=len(posts))


def update_readme_with_blog(
    posts: List[Dict[str, str]], readme_path: str = "README.md"
) -> bool:  # pragma: no cover
    """Legacy wrapper used by older tests and workflows."""
    from scripts.common.readme import get_readme_path
    try:
        content = read_readme(get_readme_path(readme_path))
    except READMEError:
        return False
    formatted = format_blog_markdown(posts, max_posts=len(posts))
    pattern = re.compile(
        re.escape(BLOG_START) + r".*?" + re.escape(BLOG_END), flags=re.DOTALL
    )
    new_content = pattern.sub(
        f"{BLOG_START}\n\n{formatted}\n\n{BLOG_END}", content
    )
    if new_content == content:
        return True
    try:
        write_readme(new_content, get_readme_path(readme_path))
        return True
    except READMEError:
        return False


if __name__ == "__main__":
    sys.exit(main())
