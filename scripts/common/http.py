"""HTTP helpers with retry/backoff for the profile automation scripts.

The :func:`retry_on_failure` decorator is the most commonly used building block
in this project. It catches the configured exception types, applies an
exponential-ish backoff, and re-raises after the final attempt.

Use :func:`create_session` to obtain a :class:`requests.Session` with a
default user agent and timeout. Use :func:`fetch_with_retry` for one-off GETs
that need to survive transient network problems.
"""

from __future__ import annotations

import time
from functools import wraps
from typing import Any, Callable, Iterable, Optional, Type, TypeVar, cast

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from scripts.common.exceptions import NetworkError
from scripts.common.logger import get_logger

logger = get_logger(__name__)

T = TypeVar("T")

DEFAULT_RETRYABLE_STATUSES = (429, 500, 502, 503, 504)
DEFAULT_USER_AGENT = "badhope-profile-automation/1.0 (+https://github.com/badhope)"


def retry_on_failure(
    max_retries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: Iterable[Type[BaseException]] = (NetworkError, requests.RequestException),
):
    """Retry the wrapped function on the given exception types.

    Args:
        max_retries: Total number of attempts (must be >= 1).
        delay: Sleep before the *second* attempt. Each subsequent attempt
            multiplies this by ``backoff``.
        exceptions: Exception classes that should trigger a retry. Anything
            else propagates immediately.
    """

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            current_delay = delay
            last_exception: Optional[BaseException] = None

            for attempt in range(1, max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except tuple(exceptions) as exc:
                    last_exception = exc
                    if attempt >= max_retries:
                        logger.error(
                            "All %d attempts failed for %s: %s",
                            max_retries,
                            func.__name__,
                            exc,
                        )
                        break
                    logger.warning(
                        "Attempt %d/%d for %s failed: %s. Retrying in %.1fs",
                        attempt,
                        max_retries,
                        func.__name__,
                        exc,
                        current_delay,
                    )
                    time.sleep(current_delay)
                    current_delay *= backoff

            assert last_exception is not None
            raise last_exception

        return cast(Callable[..., T], wrapper)

    return decorator


def create_session(
    token: Optional[str] = None,
    user_agent: str = DEFAULT_USER_AGENT,
    timeout: int = 30,
    max_retries: int = 3,
    backoff_factor: float = 0.5,
    status_forcelist: Iterable[int] = DEFAULT_RETRYABLE_STATUSES,
) -> requests.Session:
    """Build a :class:`requests.Session` with sane defaults and retry.

    The returned session:
    * Sends a custom user agent.
    * Optionally attaches a bearer token to every request.
    * Wraps the underlying HTTPAdapter with a urllib3 Retry policy that
      automatically retries on transient statuses (e.g. 429, 5xx).
    """
    session = requests.Session()
    session.headers.update(
        {
            "Accept": "application/json",
            "User-Agent": user_agent,
            "X-GitHub-Api-Version": "2022-11-28",
        }
    )
    if token:
        session.headers["Authorization"] = f"Bearer {token}"

    retry = Retry(
        total=max_retries,
        read=max_retries,
        connect=max_retries,
        status=max_retries,
        backoff_factor=backoff_factor,
        status_forcelist=tuple(status_forcelist),
        allowed_methods=frozenset(["GET", "HEAD"]),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    session.request = _wrap_with_timeout(session.request, timeout)  # type: ignore[assignment]
    return session


def _wrap_with_timeout(func: Callable[..., requests.Response], timeout: int) -> Callable[..., requests.Response]:
    """Inject a default ``timeout`` kwarg into every call to ``session.request``."""

    @wraps(func)
    def wrapper(*args, **kwargs):
        kwargs.setdefault("timeout", timeout)
        return func(*args, **kwargs)

    return wrapper


@retry_on_failure(max_retries=3, delay=1.0, backoff=2.0)
def fetch_with_retry(
    url: str,
    session: Optional[requests.Session] = None,
    method: str = "GET",
    timeout: int = 30,
    **kwargs: Any,
) -> requests.Response:
    """Perform an HTTP request and raise :class:`NetworkError` on failure."""
    sess = session or create_session()
    try:
        response = sess.request(method=method, url=url, timeout=timeout, **kwargs)
    except requests.RequestException as exc:
        raise NetworkError(f"HTTP request failed: {exc}") from exc
    return response


__all__ = [
    "create_session",
    "fetch_with_retry",
    "retry_on_failure",
    "DEFAULT_USER_AGENT",
    "DEFAULT_RETRYABLE_STATUSES",
]
