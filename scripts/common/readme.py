"""README read/write helpers and section replacement utilities.

All scripts that mutate the profile README go through this module. It
exposes:

* :func:`get_readme_path` — resolves the README file relative to the
  repository root.
* :func:`read_readme` / :func:`write_readme` — safe UTF-8 IO that raises
  :class:`READMEError` on failure.
* :func:`update_section` — replace the content of a ``<!-- marker -->``
  block in the README.
* :func:`get_marker_content` — small helper that builds the
  ``start ... end`` payload.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Optional

from scripts.common.exceptions import READMEError
from scripts.common.logger import get_logger

logger = get_logger(__name__)


def get_readme_path(override: Optional[str] = None) -> Path:
    """Resolve the README path.

    Defaults to ``<repo_root>/README.md`` where ``repo_root`` is the parent
    of the ``scripts/`` directory. Pass ``override`` to use a different file
    (e.g. ``docs/README.md``).
    """
    if override:
        return Path(override).expanduser().resolve()
    return Path(__file__).resolve().parent.parent.parent / "README.md"


def read_readme(path: Optional[Path] = None) -> str:
    """Read README content as UTF-8 text."""
    readme_path = path or get_readme_path()
    try:
        return readme_path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise READMEError(f"README.md not found at {readme_path}") from exc
    except PermissionError as exc:
        raise READMEError(f"Permission denied reading {readme_path}") from exc
    except UnicodeDecodeError as exc:
        raise READMEError(f"Encoding error reading {readme_path}: {exc}") from exc


def write_readme(content: str, path: Optional[Path] = None) -> None:
    """Write content back to the README, atomically and UTF-8 encoded."""
    readme_path = path or get_readme_path()
    try:
        # Ensure parent exists (helps when scripts run with CWD=scripts/)
        readme_path.parent.mkdir(parents=True, exist_ok=True)
        readme_path.write_text(content, encoding="utf-8")
        logger.info("Wrote %s (%d bytes)", readme_path, len(content.encode("utf-8")))
    except PermissionError as exc:
        raise READMEError(f"Permission denied writing to {readme_path}") from exc
    except OSError as exc:
        raise READMEError(f"IO error writing to {readme_path}: {exc}") from exc


_MARKER_PATTERN_CACHE: dict[str, re.Pattern[str]] = {}


def _build_marker_pattern(start_marker: str, end_marker: str) -> re.Pattern[str]:
    """Compile (and cache) a regex that captures the content between two markers."""
    key = f"{start_marker}\u0000{end_marker}"
    if key not in _MARKER_PATTERN_CACHE:
        pattern = re.compile(
            re.escape(start_marker) + r".*?" + re.escape(end_marker),
            flags=re.DOTALL,
        )
        _MARKER_PATTERN_CACHE[key] = pattern
    return _MARKER_PATTERN_CACHE[key]


def get_marker_content(start_marker: str, end_marker: str, new_content: str) -> str:
    """Return ``start\\n\\n<content>\\n\\nend`` ready to be used as a replacement."""
    return f"{start_marker}\n\n{new_content}\n\n{end_marker}"


def update_section(
    content: str,
    start_marker: str,
    end_marker: str,
    new_inner: str,
) -> tuple[str, bool]:
    """Replace the inner content of a marker block.

    Returns a tuple ``(new_content, changed)`` where ``changed`` is ``True``
    if the replacement actually altered ``content``.
    """
    pattern = _build_marker_pattern(start_marker, end_marker)
    replacement = get_marker_content(start_marker, end_marker, new_inner)
    new_content = pattern.sub(replacement, content)
    if new_content == content:
        if start_marker not in content or end_marker not in content:
            logger.warning(
                "Markers %s / %s not found in README",
                start_marker,
                end_marker,
            )
        else:
            logger.debug("Section %s unchanged", start_marker)
    return new_content, new_content != content


__all__ = [
    "get_readme_path",
    "read_readme",
    "write_readme",
    "update_section",
    "get_marker_content",
]
