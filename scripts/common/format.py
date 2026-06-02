"""Markdown formatting helpers shared by the profile automation scripts.

Every script that needs to render a badge, a project card, a blog entry or a
table should use the helpers in this module. Centralizing the formatting
logic means a single tweak updates every README in the project.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Sequence

DEFAULT_BADGE_COLOR = "58a6ff"
DEFAULT_LANGUAGE_COLOR = "3776AB"
DEFAULT_FORK_COLOR = "93c5fd"
DEFAULT_LAST_COMMIT_COLOR = "c9d1d9"
DEFAULT_ISSUE_COLOR = "8b949e"

LANGUAGE_COLORS: Dict[str, str] = {
    "Python": "#3776AB",
    "TypeScript": "#3178C6",
    "JavaScript": "#F7DF1E",
    "Java": "#007396",
    "Go": "#00ADD8",
    "Rust": "#DEA584",
    "C++": "#00599C",
    "C#": "#239120",
    "Swift": "#FA7343",
    "Kotlin": "#A97BFF",
    "Ruby": "#CC342D",
    "PHP": "#777BB4",
    "HTML": "#E34F26",
    "CSS": "#1572B6",
    "Shell": "#89E051",
    "Dart": "#00B4AB",
}


# ---------------------------------------------------------------------------
# generic helpers
# ---------------------------------------------------------------------------

def format_timestamp() -> str:
    """Return ``YYYY-MM-DD HH:MM`` for the current local time."""
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def format_date() -> str:
    """Return ``YYYY-MM-DD`` for the current local time."""
    return datetime.now().strftime("%Y-%m-%d")


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Trim ``text`` to ``max_length`` characters, appending ``suffix`` when needed."""
    if len(text) <= max_length:
        return text
    if max_length <= len(suffix):
        return text[:max_length]
    return text[: max_length - len(suffix)] + suffix


def sanitize_filename(name: str) -> str:
    """Return a filesystem-friendly version of ``name``."""
    sanitized = re.sub(r"[^\w\s.-]", "", name).strip()
    return re.sub(r"\s+", "-", sanitized)


def escape_markdown(text: str) -> str:
    """Escape characters that carry special meaning in Markdown / HTML."""
    if text is None:
        return ""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def language_color(language: Optional[str]) -> str:
    """Return the canonical hex color for a language, falling back to gray."""
    if not language:
        return "#8b949e"
    return LANGUAGE_COLORS.get(language, "#8b949e")


# ---------------------------------------------------------------------------
# shields.io badge builders
# ---------------------------------------------------------------------------

def _badge(label: str, value: str, color: str, style: str = "flat-square") -> str:
    """Build a shields.io badge image markdown snippet."""
    safe_label = label.replace(" ", "_")
    safe_value = value.replace(" ", "_").replace("-", "--")
    return (
        f"![{label}](https://img.shields.io/badge/"
        f"{safe_label}-{safe_value}?style={style}&color={color})"
    )


def format_stars_badge(
    full_name: str,
    color: str = DEFAULT_BADGE_COLOR,
    style: str = "flat-square",
) -> str:
    """Build a badge showing the current star count for ``full_name``."""
    if not full_name:
        return ""
    return (
        f"![Stars](https://img.shields.io/github/stars/{full_name}"
        f"?style={style}&color={color})"
    )


def format_forks_badge(
    full_name: str,
    color: str = DEFAULT_FORK_COLOR,
    style: str = "flat-square",
) -> str:
    """Build a badge showing the current fork count for ``full_name``."""
    if not full_name:
        return ""
    return (
        f"![Forks](https://img.shields.io/github/forks/{full_name}"
        f"?style={style}&color={color})"
    )


def format_issues_badge(
    full_name: str,
    color: str = DEFAULT_ISSUE_COLOR,
    style: str = "flat-square",
) -> str:
    """Build a badge showing the open issue count for ``full_name``."""
    if not full_name:
        return ""
    return (
        f"![Issues](https://img.shields.io/github/issues/{full_name}"
        f"?style={style}&color={color})"
    )


def format_language_badge(
    full_name: str,
    color: str = DEFAULT_LANGUAGE_COLOR,
    style: str = "flat-square",
) -> str:
    """Build a badge showing the top language for ``full_name``."""
    if not full_name:
        return ""
    return (
        f"![Language](https://img.shields.io/github/languages/top/{full_name}"
        f"?style={style}&color={color})"
    )


def format_last_commit_badge(
    full_name: str,
    color: str = DEFAULT_LAST_COMMIT_COLOR,
    style: str = "flat-square",
) -> str:
    """Build a badge showing the last commit timestamp for ``full_name``."""
    if not full_name:
        return ""
    return (
        f"![Last Commit](https://img.shields.io/github/last-commit/{full_name}"
        f"?style={style}&color={color})"
    )


# ---------------------------------------------------------------------------
# project formatters
# ---------------------------------------------------------------------------

def _format_tags(tags: Sequence[str], max_tags: int = 3) -> str:
    """Render up to ``max_tags`` repository topics as a Markdown chip list."""
    if not tags:
        return ""
    sample = list(tags[:max_tags])
    return "\n\n**标签**: " + ", ".join(f"`{tag}`" for tag in sample)


def format_project_card(
    repo: Dict[str, Any],
    *,
    badge_color: str = DEFAULT_BADGE_COLOR,
    language_color_hex: str = DEFAULT_LANGUAGE_COLOR,
    fork_color: str = DEFAULT_FORK_COLOR,
    last_commit_color: str = DEFAULT_LAST_COMMIT_COLOR,
    show_badges: bool = True,
    max_tag_count: int = 3,
) -> str:
    """Render a single project as a Markdown card.

    The card contains the project title, description, optional topics and a
    row of shields.io badges for stars, language, forks and last commit.
    """
    name = repo.get("name", "").strip()
    url = repo.get("url", "").strip()
    description = repo.get("description", "").strip() or "暂无描述"
    tags = repo.get("topics") or []

    header = f"### [{name}]({url})" if name and url else f"### {name or 'Project'}"
    badges: List[str] = []
    if show_badges:
        full_name = repo.get("full_name", "")
        if full_name:
            badges.extend(
                [
                    format_stars_badge(full_name, color=badge_color),
                    format_language_badge(full_name, color=language_color_hex),
                    format_forks_badge(full_name, color=fork_color),
                    format_last_commit_badge(full_name, color=last_commit_color),
                ]
            )
    badge_block = ("\n\n" + " ".join(badges)) if badges else ""
    tag_block = _format_tags(tags, max_tags=max_tag_count)
    return f"{header}\n\n{description}{tag_block}{badge_block}"


def format_project_row(
    repo: Dict[str, Any],
    *,
    badge_color: str = DEFAULT_BADGE_COLOR,
    language_color_hex: str = DEFAULT_LANGUAGE_COLOR,
) -> str:
    """Render a compact one-line row for a repository (used by tables)."""
    name = repo.get("name", "")
    url = repo.get("url", "")
    description = truncate_text(
        repo.get("description", "") or "暂无描述", max_length=60
    )
    full_name = repo.get("full_name", "")
    if not full_name:
        return (
            f"| [{escape_markdown(name)}]({url}) | {escape_markdown(description)} "
            f"| N/A | ![Stars](https://img.shields.io/badge/⭐-0-grey?style=flat-square) |"
        )

    return (
        f"| [{escape_markdown(name)}]({url}) | {escape_markdown(description)} "
        f"| {format_language_badge(full_name, color=language_color_hex)} "
        f"| {format_stars_badge(full_name, color=badge_color)} |"
    )


def format_project_table(
    repos: Sequence[Dict[str, Any]],
    *,
    columns: int = 2,
    **card_kwargs: Any,
) -> str:
    """Render a ``<table>`` of project cards laid out in N columns."""
    if columns < 1:
        raise ValueError("columns must be >= 1")
    rows: List[str] = []
    active = [repo for repo in repos if not repo.get("archived")]
    for i in range(0, len(active), columns):
        cells: List[str] = []
        for j in range(columns):
            if i + j < len(active):
                cell = format_project_card(active[i + j], **card_kwargs)
            else:
                cell = ""
            cells.append(
                f'<td width="{int(100 / columns)}%">\n\n{cell}\n\n</td>'
            )
        rows.append("<tr>\n" + "\n".join(cells) + "\n</tr>")
    if not rows:
        return "<table>\n</table>"
    return "<table>\n" + "\n".join(rows) + "\n</table>"


def format_more_projects_table(
    repos: Sequence[Dict[str, Any]],
    *,
    badge_color: str = DEFAULT_BADGE_COLOR,
    language_color_hex: str = DEFAULT_LANGUAGE_COLOR,
) -> str:
    """Render the secondary Markdown table used in the "More Projects" section."""
    header = (
        "| Project | Description | Tech | Stars |\n"
        "|---------|-------------|------|-------|"
    )
    rows = [
        format_project_row(
            repo,
            badge_color=badge_color,
            language_color_hex=language_color_hex,
        )
        for repo in repos
        if not repo.get("archived")
    ]
    if not rows:
        return header + "\n| - | - | - | - |"
    return "\n".join([header, *rows])


# ---------------------------------------------------------------------------
# blog / quote formatters
# ---------------------------------------------------------------------------

def format_blog_post(post: Dict[str, str], index: int) -> str:
    """Render a single blog post as a small Markdown line with a badge."""
    title = post.get("title", "")
    url = post.get("url", "")
    source = post.get("source", "Blog")
    date = post.get("date", "")
    date_part = f" · {date}" if date else ""
    safe_title = escape_markdown(title)
    return (
        f'<small>{index}. 📕 '
        f'<a href="{url}" style="color:#a5f3fc;text-decoration:none;">'
        f"{safe_title}</a>{date_part}</small>"
    )


def format_blog_markdown(posts: Iterable[Dict[str, str]], max_posts: int = 3) -> str:
    """Render the entire blog section as Markdown (or a placeholder if empty)."""
    posts_list = list(posts)
    if not posts_list:
        return '<small>文章同步中...</small>'
    items = [
        format_blog_post(post, index)
        for index, post in enumerate(posts_list[:max_posts], start=1)
    ]
    return "<br>\n".join(items)


def format_quote(quote: Dict[str, str]) -> str:
    """Render a quote as a Markdown / HTML snippet for the daily quote section."""
    text = quote.get("text", "")
    author = quote.get("author", "")
    if author:
        return (
            '<b>✨ 每日星语</b>\n<br>\n'
            f'<small>— {escape_markdown(author)}: '
            f'"{escape_markdown(text)}"</small>'
        )
    return (
        '<b>✨ 每日星语</b>\n<br>\n'
        f'<small>"{escape_markdown(text)}"</small>'
    )


__all__ = [
    "DEFAULT_BADGE_COLOR",
    "DEFAULT_LANGUAGE_COLOR",
    "DEFAULT_FORK_COLOR",
    "DEFAULT_LAST_COMMIT_COLOR",
    "DEFAULT_ISSUE_COLOR",
    "LANGUAGE_COLORS",
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
    "format_project_card",
    "format_project_row",
    "format_project_table",
    "format_more_projects_table",
    "format_blog_post",
    "format_blog_markdown",
    "format_quote",
]
