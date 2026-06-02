#!/usr/bin/env python3
"""Update the Featured Projects sections of ``README.md``.

This script talks to the GitHub REST API, picks the user's top repositories
(non-fork, non-archived) and renders them into two sections of ``README.md``:

* ``<!-- projects:start -->`` ... ``<!-- projects:end -->``
  The two-column "Top Projects" card grid that appears in the
  :guilabel:`Featured Projects` section.
* ``<!-- more-projects:start -->`` ... ``<!-- more-projects:end -->``
  The "More Projects" Markdown table that lists additional repositories.

Both sections are kept up to date automatically. Filtering, sizing and
exclusions are controlled via environment variables - see
:mod:`scripts.common.config` for the full list.

Usage::

    python -m scripts.update_projects

The script never raises raw ``requests`` exceptions; it converts them to
project-specific errors so the GitHub Action logs are easier to read.
"""

from __future__ import annotations

import sys
from typing import List

from scripts.common.config import get_config
from scripts.common.exceptions import (
    ConfigError,
    GitHubAPIError,
    NetworkError,
    READMEError,
    RateLimitError,
)
from scripts.common.format import (
    format_more_projects_table,
    format_project_table,
)
from scripts.common.github import GitHubClient
from scripts.common.logger import get_logger
from scripts.common.readme import read_readme, update_section, write_readme

logger = get_logger("scripts.update_projects")

PROJECTS_START = "<!-- projects:start -->"
PROJECTS_END = "<!-- projects:end -->"
MORE_PROJECTS_START = "<!-- more-projects:start -->"
MORE_PROJECTS_END = "<!-- more-projects:end -->"


def _fetch_repositories(client: GitHubClient) -> List[dict]:
    """Fetch and filter the user's repositories.

    The list is sorted by star count (descending) and includes only the
    non-archived, non-forked repositories that the configuration allows.
    """
    config = get_config()
    try:
        repos = list(
            client.iter_user_repos(
                username=config.github.username,
                type="owner",
                sort="stargazers",
                direction="desc",
            )
        )
    except RateLimitError as exc:
        logger.error("GitHub rate limit reached (reset at %s)", exc.reset_at)
        raise
    except GitHubAPIError as exc:
        logger.error("GitHub API error: %s", exc)
        raise

    logger.info(
        "Fetched %d raw repositories for %s",
        len(repos),
        config.github.username,
    )

    filtered = client.filter_repositories(
        repos,
        include_forks=False,
        include_archived=False,
        required_topic=config.projects.required_topic,
        excluded_names=config.projects.excluded_repos,
        # Always drop the profile repository itself (e.g. ``badhope/badhope``)
        # and anything else explicitly listed in excluded_repos by full name.
        excluded_full_names=[f"{config.github.username}/{config.github.username}"],
    )
    sorted_repos = client.sort_repositories(
        filtered, by="stargazers_count", descending=True
    )
    summaries = [client.extract_repo_summary(r) for r in sorted_repos]
    logger.info("Filtered down to %d active repositories", len(summaries))
    return summaries


def _render_featured(repositories: List[dict], limit: int) -> str:
    """Render the "Top Projects" two-column grid."""
    if limit < 1:
        return "_No projects to display._"
    table = format_project_table(
        repositories[:limit],
        columns=2,
        badge_color="58a6ff",
        language_color_hex="3776AB",
    )
    return table


def _render_more_projects(repositories: List[dict], start: int, limit: int) -> str:
    """Render the "More Projects" table starting at ``start`` index."""
    if limit < 1:
        return "_No additional projects to display._"
    extras = repositories[start : start + limit]
    if not extras:
        return "_No additional projects to display._"
    return format_more_projects_table(
        extras,
        badge_color="58a6ff",
        language_color_hex="3776AB",
    )


def update_readme(
    featured_limit: int,
    more_projects_start: int,
    more_projects_limit: int,
) -> bool:
    """Run the full update pipeline.

    Returns ``True`` if the README was modified, ``False`` otherwise.
    """
    config = get_config()
    client = GitHubClient(config.github)

    try:
        repositories = _fetch_repositories(client)
    except (NetworkError, GitHubAPIError) as exc:
        logger.error("Could not fetch repositories: %s", exc)
        return False

    if not repositories:
        logger.warning("No repositories to render - skipping update")
        return False

    featured_section = _render_featured(repositories, featured_limit)
    more_projects_section = _render_more_projects(
        repositories, more_projects_start, more_projects_limit
    )

    try:
        content = read_readme()
    except READMEError as exc:
        logger.error("Could not read README: %s", exc)
        return False

    new_content, changed_a = update_section(
        content, PROJECTS_START, PROJECTS_END, featured_section
    )
    new_content, changed_b = update_section(
        new_content, MORE_PROJECTS_START, MORE_PROJECTS_END, more_projects_section
    )

    if not (changed_a or changed_b):
        logger.info("README is already up to date")
        return False

    try:
        write_readme(new_content)
    except READMEError as exc:
        logger.error("Could not write README: %s", exc)
        return False

    logger.info(
        "Updated README - featured: %d, more-projects: %d",
        featured_limit,
        min(more_projects_limit, max(0, len(repositories) - more_projects_start)),
    )
    return True


def main() -> int:
    """Command line entry point returning a Unix exit code."""
    logger.info("=" * 60)
    logger.info("Featured Projects Update")
    logger.info("=" * 60)

    try:
        config = get_config()
    except ConfigError as exc:
        logger.error("Invalid configuration: %s", exc)
        return 2

    featured_limit = config.projects.limit
    more_projects_start = config.projects.limit
    more_projects_limit = config.projects.more_projects_limit

    logger.info(
        "Configured: featured=%d, more-projects start=%d, count=%d",
        featured_limit,
        more_projects_start,
        more_projects_limit,
    )

    updated = update_readme(
        featured_limit=featured_limit,
        more_projects_start=more_projects_start,
        more_projects_limit=more_projects_limit,
    )

    if updated:
        logger.info("README updated successfully")
        return 0
    logger.warning("README was not modified")
    return 1


if __name__ == "__main__":
    sys.exit(main())
