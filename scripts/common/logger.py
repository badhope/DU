"""Centralized logging setup for the profile automation scripts.

Call :func:`get_logger` to obtain a properly configured logger that respects
the ``LOG_LEVEL`` environment variable and writes timestamped lines to stdout.
"""

from __future__ import annotations

import logging
import os
import sys
from typing import Optional

_DEFAULT_FORMAT = "[%(asctime)s] %(levelname)-8s - %(name)s - %(message)s"
_DEFAULT_DATEFMT = "%Y-%m-%d %H:%M:%S"

_configured = False


def _resolve_level(name: Optional[str]) -> int:
    """Convert a string log level (e.g. ``INFO``) to its integer constant."""
    if not name:
        return logging.INFO
    level = logging.getLevelName(name.upper())
    if not isinstance(level, int):
        return logging.INFO
    return level


def configure_logging(
    level: Optional[str] = None,
    fmt: str = _DEFAULT_FORMAT,
    datefmt: str = _DEFAULT_DATEFMT,
    stream=None,
) -> None:
    """Configure the root logger once.

    Subsequent calls are a no-op so individual scripts can call this safely.
    """
    global _configured
    if _configured:
        return

    handler = logging.StreamHandler(stream or sys.stdout)
    handler.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)

    log_level = level or os.environ.get("LOG_LEVEL", "INFO")
    root.setLevel(_resolve_level(log_level))

    _configured = True


def get_logger(name: str) -> logging.Logger:
    """Return a configured logger for the given module name."""
    configure_logging()
    return logging.getLogger(name)


__all__ = ["configure_logging", "get_logger"]
