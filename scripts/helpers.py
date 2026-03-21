#!/usr/bin/env python3
"""
Shared helper utilities for profile README automation scripts.
"""

import re
import os
from datetime import datetime
from typing import Optional, Dict, Any


def get_readme_path() -> str:
    """Get the README.md file path."""
    return os.path.join(os.path.dirname(os.path.dirname(__file__)), "README.md")


def read_readme() -> str:
    """Read and return README.md content."""
    readme_path = get_readme_path()
    with open(readme_path, "r", encoding="utf-8") as f:
        return f.read()


def write_readme(content: str) -> bool:
    """Write content to README.md."""
    readme_path = get_readme_path()
    try:
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error writing README: {e}")
        return False


def update_section(pattern: str, replacement: str, content: str) -> str:
    """Update a section in README using regex pattern."""
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    if new_content == content:
        print(f"Warning: Pattern not found in README")
    return new_content


def get_marker_content(start_marker: str, end_marker: str, new_content: str) -> str:
    """Generate replacement content between two markers."""
    return f"{start_marker}\n\n{new_content}\n\n{end_marker}"


def format_timestamp() -> str:
    """Get current timestamp in readable format."""
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def format_date() -> str:
    """Get current date in readable format."""
    return datetime.now().strftime("%Y-%m-%d")


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to max length with suffix."""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def sanitize_filename(name: str) -> str:
    """Sanitize string to be used as filename."""
    return re.sub(r'[^\w\s-]', '', name).strip().replace(' ', '-')


def generate_badge_url(service: str, **kwargs) -> str:
    """Generate badge URL for various services."""
    badge_urls = {
        "shields": "https://img.shields.io/badge/{label}-{message}-{color}",
        "komarev": "https://komarev.com/ghpvc/?username={username}&label={label}",
    }

    if service == "shields":
        label = kwargs.get("label", "").replace("-", "--")
        message = kwargs.get("message", "").replace("-", "--")
        color = kwargs.get("color", "00F5FF")
        return f"https://img.shields.io/badge/{label}-{message}-{color}"

    elif service == "komarev":
        username = kwargs.get("username", "")
        label = kwargs.get("label", "Profile Views")
        color = kwargs.get("color", "0ea5e9")
        return f"https://komarev.com/ghpvc/?username={username}&label={label}&color={color}"

    return ""


def log_action(action: str, details: str = ""):
    """Log an action with timestamp."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_msg = f"[{timestamp}] {action}"
    if details:
        log_msg += f" - {details}"
    print(log_msg)


def validate_github_token() -> bool:
    """Validate if GitHub token is available."""
    token = os.environ.get("GITHUB_TOKEN", "")
    return bool(token and len(token) > 0)


def get_repo_info() -> Dict[str, str]:
    """Get repository information from environment."""
    return {
        "owner": os.environ.get("GITHUB_REPOSITORY_OWNER", "badhope"),
        "repo": os.environ.get("GITHUB_REPOSITORY", "").split("/")[-1] if os.environ.get("GITHUB_REPOSITORY") else "badhope",
        "sha": os.environ.get("GITHUB_SHA", "")[:7],
    }
