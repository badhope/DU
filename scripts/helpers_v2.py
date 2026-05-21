#!/usr/bin/env python3
"""
Enhanced helper utilities for profile README automation scripts.
"""

import re
import os
import logging
import time
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path
from functools import wraps


logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class READMEError(Exception):
    """Custom exception for README operations."""
    pass


class NetworkError(Exception):
    """Custom exception for network operations."""
    pass


def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """
    Decorator to retry function on failure.
    
    Args:
        max_retries: Maximum number of retries
        delay: Delay between retries in seconds
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    logger.warning(
                        f"Attempt {attempt + 1}/{max_retries} failed: {e}"
                    )
                    if attempt < max_retries - 1:
                        time.sleep(delay * (attempt + 1))
            raise NetworkError(
                f"All {max_retries} attempts failed: {last_exception}"
            )
        return wrapper
    return decorator


def get_readme_path() -> Path:
    """Get the README.md file path as Path object."""
    return Path(__file__).parent.parent / "README.md"


def read_readme() -> str:
    """
    Read and return README.md content.
    
    Returns:
        str: README content
        
    Raises:
        READMEError: If file cannot be read
    """
    readme_path = get_readme_path()
    try:
        return readme_path.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise READMEError(f"README.md not found at {readme_path}")
    except PermissionError:
        raise READMEError(f"Permission denied reading {readme_path}")
    except UnicodeDecodeError as e:
        raise READMEError(f"Encoding error reading {readme_path}: {e}")


def write_readme(content: str) -> None:
    """
    Write content to README.md.
    
    Args:
        content: Content to write
        
    Raises:
        READMEError: If file cannot be written
    """
    readme_path = get_readme_path()
    try:
        readme_path.write_text(content, encoding="utf-8")
        logger.info(f"Successfully updated {readme_path}")
    except PermissionError:
        raise READMEError(f"Permission denied writing to {readme_path}")
    except IOError as e:
        raise READMEError(f"IO error writing to {readme_path}: {e}")


def update_section(pattern: str, replacement: str, content: str) -> str:
    """
    Update a section in README using regex pattern.
    
    Args:
        pattern: Regex pattern to match
        replacement: Replacement string
        content: Original content
        
    Returns:
        str: Updated content
        
    Raises:
        READMEError: If pattern not found
    """
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    if new_content == content:
        logger.warning(f"Pattern not found in README: {pattern[:50]}...")
    return new_content


def get_marker_content(start_marker: str, end_marker: str, new_content: str) -> str:
    """
    Generate replacement content between two markers.
    
    Args:
        start_marker: Start marker string
        end_marker: End marker string
        new_content: Content to insert
        
    Returns:
        str: Formatted content with markers
    """
    return f"{start_marker}\n\n{new_content}\n\n{end_marker}"


def format_timestamp() -> str:
    """Get current timestamp in readable format."""
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def format_date() -> str:
    """Get current date in readable format."""
    return datetime.now().strftime("%Y-%m-%d")


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to max length with suffix.
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to append if truncated
        
    Returns:
        str: Truncated text
    """
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def sanitize_filename(name: str) -> str:
    """
    Sanitize string to be used as filename.
    
    Args:
        name: Original name
        
    Returns:
        str: Sanitized filename
    """
    return re.sub(r'[^\w\s-]', '', name).strip().replace(' ', '-')


def validate_github_token() -> bool:
    """
    Validate if GitHub token is available.
    
    Returns:
        bool: True if token exists and is not empty
    """
    token = os.environ.get("GITHUB_TOKEN", "")
    return bool(token and len(token) > 0)


def get_repo_info() -> Dict[str, str]:
    """
    Get repository information from environment.
    
    Returns:
        dict: Repository information
    """
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    return {
        "owner": os.environ.get("GITHUB_REPOSITORY_OWNER", "badhope"),
        "repo": repo.split("/")[-1] if repo else "badhope",
        "sha": os.environ.get("GITHUB_SHA", "")[:7],
    }
