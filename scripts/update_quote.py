#!/usr/bin/env python3
"""Update the daily quote section of ``README.md``.

The script tries every API listed in ``config.quote.apis`` in order. If all
APIs fail, it falls back to one of the curated ``fallback_quotes``. The
chosen quote is written into the ``<!-- quote:start -->`` ...
``<!-- quote:end -->`` block of ``README.md``.
"""

from __future__ import annotations

import random
import sys
from typing import Dict, List, Optional

import requests

from scripts.common.config import Config, get_config
from scripts.common.exceptions import ConfigError, NetworkError, READMEError
from scripts.common.format import format_quote
from scripts.common.http import create_session
from scripts.common.logger import get_logger
from scripts.common.readme import read_readme, update_section, write_readme

logger = get_logger("scripts.update_quote")

QUOTE_START = "<!-- quote:start -->"
QUOTE_END = "<!-- quote:end -->"


def _fetch_from_single_api(
    session: requests.Session, api_url: str, timeout: int
) -> Optional[Dict[str, str]]:
    """Hit a single quote API and normalize the response to a dict.

    Returns ``None`` for malformed or empty responses so the caller can try
    the next API in the list.
    """
    try:
        response = session.get(api_url, timeout=timeout)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as exc:
        logger.debug("API %s failed: %s", api_url, exc)
        return None

    if isinstance(data, list) and data:
        item = data[0]
        text = item.get("q") or item.get("content")
        author = item.get("a") or item.get("author")
        if text:
            return {"text": str(text).strip(), "author": str(author or "").strip()}
        return None

    if isinstance(data, dict):
        text = data.get("content") or data.get("text") or data.get("quote")
        author = data.get("author")
        if text:
            return {"text": str(text).strip(), "author": str(author or "").strip()}

    return None


def fetch_quote(config: Config) -> Dict[str, str]:
    """Try every API in order, falling back to a curated quote when needed."""
    session = create_session(timeout=config.quote.timeout)
    for api_url in config.quote.apis:
        quote = _fetch_from_single_api(session, api_url, config.quote.timeout)
        if quote and quote["text"]:
            logger.info("Fetched quote from %s", api_url)
            return quote
        logger.debug("No quote returned by %s", api_url)

    logger.warning("All quote APIs failed; using fallback")
    return random.choice(config.quote.fallback_quotes)


def update_readme(quote: Dict[str, str]) -> bool:
    """Write the formatted quote into the README."""
    formatted = format_quote(quote)
    try:
        content = read_readme()
    except READMEError as exc:
        logger.error(str(exc))
        return False

    new_content, changed = update_section(
        content, QUOTE_START, QUOTE_END, formatted
    )
    if not changed:
        if QUOTE_START in content and QUOTE_END in content:
            logger.info("Quote is already up to date")
            return True
        logger.error("Could not find quote markers in README.md")
        return False

    try:
        write_readme(new_content)
    except READMEError as exc:
        logger.error(str(exc))
        return False
    logger.info("Quote section updated")
    return True


def main() -> int:
    """Command line entry point."""
    logger.info("=" * 60)
    logger.info("Daily Quote Update")
    logger.info("=" * 60)

    try:
        config = get_config()
    except ConfigError as exc:
        logger.error("Invalid configuration: %s", exc)
        return 2

    quote = fetch_quote(config)
    logger.info("Selected quote: \"%s\" — %s", quote["text"], quote["author"])

    if update_readme(quote):
        logger.info("README quote section updated")
        return 0
    logger.error("Failed to update README quote section")
    return 1


# Backwards compatible helpers for older tests / workflows
def fetch_quote_from_api(  # pragma: no cover
    api_url: str, timeout: int = 10
) -> Optional[Dict[str, str]]:
    session = create_session(timeout=timeout)
    return _fetch_from_single_api(session, api_url, timeout)


def format_quote_markdown(quote: Dict[str, str]) -> str:  # pragma: no cover
    return format_quote(quote)


def update_readme_with_quote(quote_text: str) -> bool:  # pragma: no cover
    try:
        content = read_readme()
    except READMEError:
        return False
    new_content, changed = update_section(
        content, QUOTE_START, QUOTE_END, quote_text
    )
    if not changed:
        return False
    try:
        write_readme(new_content)
        return True
    except READMEError:
        return False


if __name__ == "__main__":
    sys.exit(main())
