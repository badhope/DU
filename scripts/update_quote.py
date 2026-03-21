#!/usr/bin/env python3
"""
Daily Quote Update Script
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

TECH_QUOTES = [
    {"text": "The best way to predict the future is to create it.", "author": "Peter Drucker"},
    {"text": "Code is like humor. When you have to explain it, it's bad.", "author": "Cory House"},
    {"text": "First, solve the problem. Then, write the code.", "author": "John Johnson"},
    {"text": "Experience is the name everyone gives to their mistakes.", "author": "Oscar Wilde"},
    {"text": "The only way to learn a new programming language is by writing programs in it.", "author": "Dennis Ritchie"},
    {"text": "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.", "author": "Dan Salomon"},
    {"text": "Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", "author": "Bill Gates"},
    {"text": "The computer was born to solve problems that did not exist before.", "author": "Bill Gates"},
    {"text": "AI is the new electricity.", "author": "Andrew Ng"},
    {"text": "Data is the new oil.", "author": "Clive Humby"},
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

    return random.choice(TECH_QUOTES)


def format_quote_markdown(quote):
    text = quote["text"]
    author = quote["author"]
    return f'> *"{text}"*  \n> — *{author}*'


def update_readme(quote_text):
    readme_path = "README.md"

    try:
        with open(readme_path, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: {readme_path} not found")
        return False

    pattern = r'(<!-- quote:start -->)\n.*?\n(<!-- quote:end -->)'
    replacement = f'\\1\n\n✨ **Daily Quote** — {datetime.now().strftime("%Y-%m-%d")}\n\n{quote_text}\n\n\\2'

    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    if new_content == content:
        print("Warning: Could not find quote markers in README.md")
        return False

    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"Quote updated successfully!")
    return True


def main():
    print("Fetching daily quote...")
    quote = fetch_quote()
    print(f'Quote: "{quote["text"]}" — {quote["author"]}')

    quote_markdown = format_quote_markdown(quote)
    update_readme(quote_markdown)


if __name__ == "__main__":
    main()