"""Centralized configuration loaded from environment variables.

All scripts that need configuration should import ``get_config`` from this module
rather than reading environment variables directly. This guarantees a single
source of truth and makes the scripts easier to test.
"""

from __future__ import annotations

import os
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Optional

from scripts.common.exceptions import ConfigError


def _safe_int(value: Optional[str], default: int) -> int:
    """Convert a string to ``int`` while gracefully handling ``None`` or junk."""
    if value is None or value == "":
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def _safe_str(value: Optional[str], default: str) -> str:
    """Return the trimmed string or a default when ``None``/empty."""
    if value is None:
        return default
    stripped = value.strip()
    return stripped if stripped else default


def _safe_list(value: Optional[str], default: List[str], separator: str = ",") -> List[str]:
    """Split a comma-delimited env variable into a list of trimmed non-empty items."""
    if value is None or value.strip() == "":
        return list(default)
    items = [item.strip() for item in value.split(separator)]
    return [item for item in items if item]


@dataclass
class GitHubConfig:
    """GitHub related configuration."""

    api_url: str = "https://api.github.com"
    username: str = "badhope"
    token: Optional[str] = None
    timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 2.0
    per_page: int = 100

    def auth_headers(self) -> Dict[str, str]:
        """Return the headers required to authenticate against the GitHub API."""
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "badhope-profile-automation",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    @property
    def has_token(self) -> bool:
        return bool(self.token)


@dataclass
class ProjectsConfig:
    """Featured projects configuration."""

    limit: int = 4
    more_projects_limit: int = 5
    excluded_repos: List[str] = field(default_factory=list)
    required_topic: Optional[str] = None

    def should_exclude(self, repo_name: str) -> bool:
        return repo_name in self.excluded_repos


@dataclass
class BlogConfig:
    """Blog source configuration."""

    csdn_user_id: str = "weixin_56622231"
    csdn_rss_url: str = "https://blog.csdn.net/weixin_56622231/rss/list"
    max_posts: int = 3
    enabled: bool = True


@dataclass
class QuoteConfig:
    """Daily quote configuration."""

    apis: List[str] = field(
        default_factory=lambda: [
            "https://zenquotes.io/api/random",
            "https://api.quotable.io/random",
        ]
    )
    fallback_quotes: List[Dict[str, str]] = field(
        default_factory=lambda: [
            {
                "text": "Shoot for the moon. Even if you miss, you'll land among the stars.",
                "author": "Les Brown",
            },
            {
                "text": "The stars are the land-marks of the universe.",
                "author": "John Fisher",
            },
            {
                "text": "Look up at the stars and not down at your feet.",
                "author": "Stephen Hawking",
            },
            {
                "text": "We are all made of starstuff.",
                "author": "Carl Sagan",
            },
        ]
    )
    timeout: int = 10
    max_retries: int = 3


@dataclass
class SnakeConfig:
    """Snake animation configuration."""

    branch: str = "output"
    dark_palette: str = "github-dark"
    file_name: str = "github-contribution-grid-snake-dark.svg"


@dataclass
class SVGConfig:
    """Dynamic SVG generator configuration."""

    output_dir: str = "assets/effects"
    badge_color: str = "58a6ff"
    secondary_color: str = "93c5fd"
    language_secondary_color: str = "3776AB"


@dataclass
class DocsConfig:
    """Documentation / GitHub Pages configuration."""

    docs_dir: str = "docs"
    site_url: str = "https://badhope.github.io"
    jekyll_env: str = "production"
    deploy_on_push: bool = True


@dataclass
class Config:
    """Top-level configuration object containing every sub-config."""

    github: GitHubConfig
    projects: ProjectsConfig
    blog: BlogConfig
    quote: QuoteConfig
    snake: SnakeConfig
    svg: SVGConfig
    docs: DocsConfig

    readme_path: str = "README.md"
    log_level: str = "INFO"

    @property
    def log_level_int(self) -> int:
        return logging.getLevelName(self.log_level.upper()) or logging.INFO


def get_config() -> Config:
    """Build a :class:`Config` instance from environment variables.

    Missing variables fall back to safe defaults so the scripts can run
    locally without any explicit configuration. GitHub Actions injects
    ``GITHUB_TOKEN`` and ``GITHUB_REPOSITORY`` automatically.
    """
    github_token = os.environ.get("GITHUB_TOKEN")

    github = GitHubConfig(
        api_url=os.environ.get("GITHUB_API_URL", "https://api.github.com"),
        username=_safe_str(os.environ.get("GITHUB_USERNAME"), "badhope"),
        token=github_token,
        timeout=_safe_int(os.environ.get("REQUEST_TIMEOUT"), 30),
        max_retries=_safe_int(os.environ.get("MAX_RETRIES"), 3),
        retry_delay=float(os.environ.get("RETRY_DELAY", "2.0")),
        per_page=_safe_int(os.environ.get("GITHUB_PER_PAGE"), 100),
    )

    projects = ProjectsConfig(
        limit=_safe_int(os.environ.get("PROJECTS_LIMIT"), 4),
        more_projects_limit=_safe_int(os.environ.get("MORE_PROJECTS_LIMIT"), 5),
        excluded_repos=_safe_list(os.environ.get("EXCLUDED_REPOS"), []),
        required_topic=os.environ.get("REQUIRED_TOPIC") or None,
    )

    blog = BlogConfig(
        csdn_user_id=_safe_str(os.environ.get("CSDN_USER_ID"), "weixin_56622231"),
        csdn_rss_url=_safe_str(
            os.environ.get("CSDN_RSS_URL"),
            "https://blog.csdn.net/weixin_56622231/rss/list",
        ),
        max_posts=_safe_int(os.environ.get("MAX_POSTS"), 3),
        enabled=_safe_str(os.environ.get("BLOG_ENABLED"), "true").lower()
        in ("1", "true", "yes", "on"),
    )

    quote = QuoteConfig(
        apis=_safe_list(
            os.environ.get("QUOTE_APIS"),
            [
                "https://zenquotes.io/api/random",
                "https://api.quotable.io/random",
            ],
        ),
        timeout=_safe_int(os.environ.get("QUOTE_TIMEOUT"), 10),
        max_retries=_safe_int(os.environ.get("QUOTE_MAX_RETRIES"), 3),
    )

    snake = SnakeConfig(
        branch=_safe_str(os.environ.get("SNAKE_BRANCH"), "output"),
        dark_palette=_safe_str(os.environ.get("SNAKE_DARK_PALETTE"), "github-dark"),
        file_name=_safe_str(
            os.environ.get("SNAKE_FILE_NAME"),
            "github-contribution-grid-snake-dark.svg",
        ),
    )

    svg = SVGConfig(
        output_dir=_safe_str(os.environ.get("SVG_OUTPUT_DIR"), "assets/effects"),
        badge_color=_safe_str(os.environ.get("BADGE_COLOR"), "58a6ff"),
        secondary_color=_safe_str(os.environ.get("SECONDARY_COLOR"), "93c5fd"),
        language_secondary_color=_safe_str(
            os.environ.get("LANGUAGE_COLOR"), "3776AB"
        ),
    )

    docs = DocsConfig(
        docs_dir=_safe_str(os.environ.get("DOCS_DIR"), "docs"),
        site_url=_safe_str(
            os.environ.get("SITE_URL"), "https://badhope.github.io"
        ),
        jekyll_env=_safe_str(os.environ.get("JEKYLL_ENV"), "production"),
        deploy_on_push=_safe_str(os.environ.get("DOCS_DEPLOY_ON_PUSH"), "true").lower()
        in ("1", "true", "yes", "on"),
    )

    return Config(
        github=github,
        projects=projects,
        blog=blog,
        quote=quote,
        snake=snake,
        svg=svg,
        docs=docs,
        readme_path=os.environ.get("README_PATH", "README.md"),
        log_level=_safe_str(os.environ.get("LOG_LEVEL"), "INFO"),
    )


__all__ = [
    "Config",
    "GitHubConfig",
    "ProjectsConfig",
    "BlogConfig",
    "QuoteConfig",
    "SnakeConfig",
    "SVGConfig",
    "DocsConfig",
    "get_config",
]
