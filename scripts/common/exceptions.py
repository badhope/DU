"""Centralized exception types for the profile automation scripts."""

from __future__ import annotations


class ConfigError(Exception):
    """Raised when configuration loading or validation fails."""


class NetworkError(Exception):
    """Raised when an HTTP request fails after all retry attempts."""


class GitHubAPIError(NetworkError):
    """Raised when the GitHub API returns a non-2xx response."""

    def __init__(self, status_code: int, message: str, response_body: str = ""):
        self.status_code = status_code
        self.response_body = response_body
        super().__init__(f"GitHub API error {status_code}: {message}")


class READMEError(Exception):
    """Raised when a README file cannot be read, written, or parsed."""


class RateLimitError(GitHubAPIError):
    """Raised when the GitHub API rate limit is exceeded."""

    def __init__(self, reset_at: int = 0, remaining: int = 0):
        self.reset_at = reset_at
        self.remaining = remaining
        super().__init__(
            status_code=403,
            message=f"Rate limit exceeded (remaining={remaining}, reset_at={reset_at})",
        )
