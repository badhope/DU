"""Common utilities shared by all profile automation scripts.

This package provides:
- config: Centralized environment-variable configuration
- logger: Unified logging setup
- http: HTTP client with retry/backoff
- github: GitHub REST API client
- readme: README read/write helpers and marker-based section updates
- format: Markdown formatters for projects, blog posts, quotes
"""

from scripts.common.config import Config, get_config
from scripts.common.logger import get_logger
from scripts.common.exceptions import (
    NetworkError,
    READMEError,
    GitHubAPIError,
    ConfigError,
)
from scripts.common.http import (
    create_session,
    fetch_with_retry,
    retry_on_failure,
)
from scripts.common.github import GitHubClient
from scripts.common.readme import (
    get_readme_path,
    read_readme,
    write_readme,
    update_section,
    get_marker_content,
)
from scripts.common.format import (
    format_project_card,
    format_project_row,
    format_project_table,
    format_more_projects_table,
    format_blog_post,
    format_quote,
    format_timestamp,
    format_date,
    truncate_text,
    sanitize_filename,
    escape_markdown,
    language_color,
    format_stars_badge,
    format_forks_badge,
    format_issues_badge,
    format_language_badge,
    format_last_commit_badge,
)

__all__ = [
    "Config",
    "get_config",
    "get_logger",
    "NetworkError",
    "READMEError",
    "GitHubAPIError",
    "ConfigError",
    "create_session",
    "fetch_with_retry",
    "retry_on_failure",
    "GitHubClient",
    "get_readme_path",
    "read_readme",
    "write_readme",
    "update_section",
    "get_marker_content",
    "format_project_card",
    "format_project_row",
    "format_project_table",
    "format_more_projects_table",
    "format_blog_post",
    "format_quote",
    "format_timestamp",
    "format_date",
    "truncate_text",
    "sanitize_filename",
    "escape_markdown",
    "language_color",
    "format_stars_badge",
    "format_forks_badge",
    "format_issues_badge",
    "format_language_badge",
    "format_last_commit_badge",
]
