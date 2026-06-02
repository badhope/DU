"""Thin GitHub REST API client.

The :class:`GitHubClient` is the single entry point for everything that talks
to api.github.com. It supports:

* Listing user repositories with pagination and filtering (forks, archived,
  topics, etc.)
* Fetching user level stats
* Fetching repository specific stats
* Fetching language statistics aggregated across all repositories
* Fetching a single repository by ``owner/name``
* Fetching the authenticated user (sanity check the token)

The client never throws raw ``requests`` exceptions; it converts them to
the project-specific :class:`NetworkError` / :class:`GitHubAPIError` /
:class:`RateLimitError` types instead.
"""

from __future__ import annotations

import re
from typing import Any, Dict, Iterator, List, Optional

import requests

from scripts.common.config import GitHubConfig
from scripts.common.exceptions import (
    GitHubAPIError,
    NetworkError,
    RateLimitError,
)
from scripts.common.http import create_session
from scripts.common.logger import get_logger

logger = get_logger(__name__)


class GitHubClient:
    """High-level GitHub REST API client.

    Example::

        client = GitHubClient(GitHubConfig(token="ghp_xxx"))
        repos = list(client.iter_user_repos("badhope"))
    """

    def __init__(self, config: GitHubConfig):
        self.config = config
        self.session = create_session(
            token=config.token,
            timeout=config.timeout,
            max_retries=config.max_retries,
        )
        self.session.headers.update(config.auth_headers())

    # ------------------------------------------------------------------
    # low-level helpers
    # ------------------------------------------------------------------

    def _build_url(self, path: str) -> str:
        """Build a fully qualified URL for the given API path."""
        base = self.config.api_url.rstrip("/")
        if not path.startswith("/"):
            path = "/" + path
        return f"{base}{path}"

    def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Perform an authenticated request and return the parsed JSON."""
        url = self._build_url(path)
        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                timeout=self.config.timeout,
            )
        except requests.RequestException as exc:
            raise NetworkError(f"GitHub request failed: {exc}") from exc

        if response.status_code == 403 and self._is_rate_limited(response):
            reset = self._rate_limit_reset(response)
            remaining = self._rate_limit_remaining(response)
            raise RateLimitError(reset_at=reset, remaining=remaining)

        if response.status_code >= 400:
            raise GitHubAPIError(
                status_code=response.status_code,
                message=response.text[:500],
                response_body=response.text,
            )

        try:
            return response.json()
        except ValueError as exc:
            raise NetworkError(f"Invalid JSON in response: {exc}") from exc

    @staticmethod
    def _is_rate_limited(response: requests.Response) -> bool:
        if "X-RateLimit-Remaining" not in response.headers:
            return False
        try:
            remaining = int(response.headers.get("X-RateLimit-Remaining", "1"))
        except ValueError:
            return False
        return remaining == 0 or response.status_code == 403

    @staticmethod
    def _rate_limit_reset(response: requests.Response) -> int:
        try:
            return int(response.headers.get("X-RateLimit-Reset", "0"))
        except ValueError:
            return 0

    @staticmethod
    def _rate_limit_remaining(response: requests.Response) -> int:
        try:
            return int(response.headers.get("X-RateLimit-Remaining", "0"))
        except ValueError:
            return 0

    def _paginate(
        self,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        per_page: Optional[int] = None,
    ) -> Iterator[Dict[str, Any]]:
        """Yield each item from a paginated GET endpoint.

        Honors the GitHub ``Link: rel="next"`` header to follow pages.
        """
        page = 1
        base_params: Dict[str, Any] = dict(params or {})
        base_params["per_page"] = per_page or self.config.per_page
        while True:
            base_params["page"] = page
            url = self._build_url(path)
            try:
                response = self.session.get(
                    url,
                    params=base_params,
                    timeout=self.config.timeout,
                )
            except requests.RequestException as exc:
                raise NetworkError(f"GitHub pagination failed: {exc}") from exc

            if response.status_code == 403 and self._is_rate_limited(response):
                raise RateLimitError(
                    reset_at=self._rate_limit_reset(response),
                    remaining=self._rate_limit_remaining(response),
                )

            if response.status_code >= 400:
                raise GitHubAPIError(
                    status_code=response.status_code,
                    message=response.text[:500],
                    response_body=response.text,
                )

            try:
                data = response.json()
            except ValueError as exc:
                raise NetworkError(f"Invalid JSON in response: {exc}") from exc

            if not data:
                return

            for item in data:
                yield item

            link = response.headers.get("Link", "")
            if 'rel="next"' not in link:
                return
            page += 1

    # ------------------------------------------------------------------
    # high-level helpers
    # ------------------------------------------------------------------

    def get_authenticated_user(self) -> Dict[str, Any]:
        """Return the user attached to the configured token (or 401)."""
        return self._request("GET", "/user")

    def get_user(self, username: Optional[str] = None) -> Dict[str, Any]:
        """Return public profile information for ``username``."""
        user = username or self.config.username
        return self._request("GET", f"/users/{user}")

    def iter_user_repos(
        self,
        username: Optional[str] = None,
        type: str = "owner",
        sort: str = "updated",
        direction: str = "desc",
    ) -> Iterator[Dict[str, Any]]:
        """Yield every repository owned by ``username``."""
        user = username or self.config.username
        params = {
            "type": type,
            "sort": sort,
            "direction": direction,
        }
        yield from self._paginate(f"/users/{user}/repos", params=params)

    def get_repo(self, owner: str, name: str) -> Dict[str, Any]:
        """Return the full repository payload for ``owner/name``."""
        return self._request("GET", f"/repos/{owner}/{name}")

    def get_repo_languages(self, owner: str, name: str) -> Dict[str, int]:
        """Return the byte count per language for ``owner/name``."""
        return self._request("GET", f"/repos/{owner}/{name}/languages")

    def iter_user_repos_languages(
        self, username: Optional[str] = None
    ) -> Dict[str, int]:
        """Aggregate byte counts across every repository owned by ``username``."""
        user = username or self.config.username
        totals: Dict[str, int] = {}
        for repo in self.iter_user_repos(user):
            if repo.get("fork") or repo.get("archived"):
                continue
            name = repo.get("name")
            if not name:
                continue
            try:
                languages = self.get_repo_languages(user, name)
            except (NetworkError, GitHubAPIError) as exc:
                logger.warning("Skipping languages for %s/%s: %s", user, name, exc)
                continue
            for lang, count in languages.items():
                totals[lang] = totals.get(lang, 0) + count
        return totals

    # ------------------------------------------------------------------
    # filtering helpers
    # ------------------------------------------------------------------

    @staticmethod
    def filter_repositories(
        repos: List[Dict[str, Any]],
        *,
        include_forks: bool = False,
        include_archived: bool = False,
        required_topic: Optional[str] = None,
        excluded_names: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Apply project-level filters to a list of repository payloads."""
        excluded = set(excluded_names or [])
        result: List[Dict[str, Any]] = []
        for repo in repos:
            if not include_forks and repo.get("fork"):
                continue
            if not include_archived and repo.get("archived"):
                continue
            if repo.get("name") in excluded:
                continue
            if required_topic:
                topics = repo.get("topics") or []
                if required_topic not in topics:
                    continue
            result.append(repo)
        return result

    @staticmethod
    def sort_repositories(
        repos: List[Dict[str, Any]],
        *,
        by: str = "stargazers_count",
        descending: bool = True,
    ) -> List[Dict[str, Any]]:
        """Sort repositories by a numeric field (e.g. stars, forks, updated_at)."""
        return sorted(
            repos,
            key=lambda repo: repo.get(by) or 0,
            reverse=descending,
        )

    @staticmethod
    def extract_repo_summary(repo: Dict[str, Any]) -> Dict[str, Any]:
        """Convert a GitHub repository payload into a small, friendly summary."""
        license_info = repo.get("license") or {}
        return {
            "name": repo.get("name", ""),
            "full_name": repo.get("full_name", ""),
            "description": (repo.get("description") or "暂无描述").strip(),
            "url": repo.get("html_url", ""),
            "stars": repo.get("stargazers_count", 0),
            "forks": repo.get("forks_count", 0),
            "open_issues": repo.get("open_issues_count", 0),
            "language": repo.get("language") or "N/A",
            "updated_at": (repo.get("updated_at") or "")[:10],
            "license": license_info.get("spdx_id") or license_info.get("name") or "N/A",
            "topics": list(repo.get("topics") or []),
            "archived": bool(repo.get("archived", False)),
            "fork": bool(repo.get("fork", False)),
        }


__all__ = ["GitHubClient"]
