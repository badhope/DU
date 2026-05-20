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
    juejin_user_id: str
    juejin_api_url: str
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


def get_config() -> Config:
    """Get configuration from environment variables or defaults."""
    blog_config = BlogConfig(
        csdn_user_id=os.getenv("CSDN_USER_ID", "weixin_56622231"),
        csdn_rss_url=os.getenv(
            "CSDN_RSS_URL",
            "https://blog.csdn.net/weixin_56622231/rss/list"
        ),
        juejin_user_id=os.getenv("JUEJIN_USER_ID", ""),
        juejin_api_url=os.getenv(
            "JUEJIN_API_URL",
            "https://api.juejin.cn/content_service/v1/article/query_list"
        ),
        max_posts=int(os.getenv("MAX_POSTS", "3")),
        timeout=int(os.getenv("REQUEST_TIMEOUT", "10")),
        max_retries=int(os.getenv("MAX_RETRIES", "3"))
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
        timeout=int(os.getenv("REQUEST_TIMEOUT", "10")),
        max_retries=int(os.getenv("MAX_RETRIES", "3"))
    )

    return Config(
        blog=blog_config,
        quote=quote_config,
        readme_path=os.getenv("README_PATH", "README.md"),
        log_level=os.getenv("LOG_LEVEL", "INFO")
    )
