#!/usr/bin/env python3
"""
Daily Quote Update Script - Starry Sky Theme
Fetches a quote and updates README.md with the new content.
"""

import re
import json
import random
from datetime import datetime

try:
    import requests
except ImportError:
    requests = None


QUOTE_APIS = [
    "https://zenquotes.io/api/random",
    "https://api.quotable.io/random",
]

STARRY_QUOTES = [
    {"text": "Shoot for the moon. Even if you miss, you'll land among the stars.", "author": "Les Brown"},
    {"text": "The stars are the land-marks of the universe.", "author": "John Fisher"},
    {"text": "Look up at the stars and not down at your feet.", "author": "Stephen Hawking"},
    {"text": "We are all made of starstuff.", "author": "Carl Sagan"},
    {"text": "In the sky, the stars are bright.", "author": "Unknown"},
    {"text": "The universe is within us as much as we are within it.", "author": "Neil deGrasse Tyson"},
    {"text": "The cosmos is within us. We are made of star-stuff.", "author": "Carl Sagan"},
    {"text": "Aim for the stars, but keep your feet on the ground.", "author": "Unknown"},
    {"text": "The stars are the eyes of eternity.", "author": "Unknown"},
    {"text": "In a sky full of stars, you are my favorite.", "author": "Unknown"},
]


def fetch_quote():
    if requests:
        for api_url in QUOTE_APIS:
            try:
                response = requests.get(api_url, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        return {"text": data[0].get("q", ""), "author": data[0].get("a", "")}
                    elif isinstance(data, dict):
                        return {"text": data.get("content", ""), "author": data.get("author", "")}
            except Exception:
                continue

    return random.choice(STARRY_QUOTES)


def format_quote_markdown(quote):
    text = quote["text"]
    author = quote["author"]
    return f'<b>✨ 每日星语</b>\n<br>\n<small>*"{text}"*</small>'


def update_readme(quote_text):
    readme_path = "README.md"

    try:
        with open(readme_path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Error: {readme_path} not found")
        return False
    except Exception as e:
        print(f"❌ Error reading {readme_path}: {e}")
        return False

    pattern = r'(<!-- quote:start -->)\n.*?\n(<!-- quote:end -->)'
    replacement = f'\\1\n\n{quote_text}\n\n<!-- quote:end -->'

    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    if new_content == content:
        print("⚠️  Warning: Could not find quote markers in README.md")
        return False

    try:
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("✅ Quote updated successfully!")
        return True
    except Exception as e:
        print(f"❌ Error writing to {readme_path}: {e}")
        return False


def main():
    print("=" * 60)
    print("🌟 Daily Star Quote Update Script")
    print("=" * 60)
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    quote = fetch_quote()
    print()
    print(f'📝 Quote: "{quote["text"]}" — {quote["author"]}')
    print()

    quote_markdown = format_quote_markdown(quote)
    if update_readme(quote_markdown):
        print()
        print("✨ All done! Your README has been updated with a fresh star quote.")
    else:
        print()
        print("❌ Failed to update README.")

    print("=" * 60)


if __name__ == "__main__":
    main()