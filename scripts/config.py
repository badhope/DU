#!/usr/bin/env python3
"""
Configuration management for profile README automation scripts.
"""

import os
from dataclasses import dataclass


@dataclass
class BlogConfig:
    """Blog source configuration."""
    csdn_user_id: str
    csdn_rss_url: str
    max_posts: int = 3
    timeout: int = 10
    max_retries: int = 3


@dataclass
class QuoteConfig:
    """Quote API configuration."""
    apis: list[str]
    fallback_quotes: list[dict[str, str]]
    timeout: int = 10
    max_retries: int = 3


@dataclass
class Config:
    """Main configuration class."""
    blog: BlogConfig
    quote: QuoteConfig
    readme_path: str = "README.md"
    log_level: str = "INFO"


def _safe_int(value: str | None, default: int) -> int:
    """Safely convert string to int with fallback."""
    if value is None:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def get_config() -> Config:
    """Get configuration from environment variables or defaults."""
    blog_config = BlogConfig(
        csdn_user_id=os.environ.get("CSDN_USER_ID", "weixin_56622231"),
        csdn_rss_url=os.environ.get(
            "CSDN_RSS_URL",
            "https://blog.csdn.net/weixin_56622231/rss/list"
        ),
        max_posts=_safe_int(os.environ.get("MAX_POSTS"), 3),
        timeout=_safe_int(os.environ.get("REQUEST_TIMEOUT"), 10),
        max_retries=_safe_int(os.environ.get("MAX_RETRIES"), 3)
    )

    quote_config = QuoteConfig(
        apis=[
            "https://zenquotes.io/api/random",
            "https://api.quotable.io/random",
        ],
        fallback_quotes=[
            {"text": "Shoot for the moon. Even if you miss, you'll land among the stars.", "author": "Les Brown"},
            {"text": "The stars are the land-marks of the universe.", "author": "John Fisher"},
            {"text": "Look up at the stars and not down at your feet.", "author": "Stephen Hawking"},
            {"text": "We are all made of starstuff.", "author": "Carl Sagan"},
        ],
        timeout=_safe_int(os.environ.get("REQUEST_TIMEOUT"), 10),
        max_retries=_safe_int(os.environ.get("MAX_RETRIES"), 3)
    )

    return Config(
        blog=blog_config,
        quote=quote_config,
        readme_path=os.environ.get("README_PATH", "README.md"),
        log_level=os.environ.get("LOG_LEVEL", "INFO")
    )
