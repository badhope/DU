"""Tests for the common config loader."""

from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from scripts.common.config import (
    BlogConfig,
    Config,
    DocsConfig,
    GitHubConfig,
    ProjectsConfig,
    QuoteConfig,
    SnakeConfig,
    SVGConfig,
    _safe_int,
    _safe_list,
    _safe_str,
    get_config,
)


class TestSafeHelpers(unittest.TestCase):
    def test_safe_int_valid(self):
        self.assertEqual(_safe_int("10", 5), 10)

    def test_safe_int_none(self):
        self.assertEqual(_safe_int(None, 5), 5)

    def test_safe_int_invalid(self):
        self.assertEqual(_safe_int("abc", 5), 5)

    def test_safe_int_empty_string(self):
        self.assertEqual(_safe_int("", 5), 5)

    def test_safe_str_none(self):
        self.assertEqual(_safe_str(None, "fallback"), "fallback")

    def test_safe_str_empty(self):
        self.assertEqual(_safe_str("   ", "fallback"), "fallback")

    def test_safe_str_trims(self):
        self.assertEqual(_safe_str("  hello  ", "fallback"), "hello")

    def test_safe_list_default(self):
        self.assertEqual(_safe_list(None, ["a", "b"]), ["a", "b"])

    def test_safe_list_parse(self):
        self.assertEqual(
            _safe_list("a, b ,c", ["x"]),
            ["a", "b", "c"],
        )

    def test_safe_list_filters_empty(self):
        self.assertEqual(_safe_list("a,,b,", ["x"]), ["a", "b"])


class TestGitHubConfig(unittest.TestCase):
    def test_auth_headers_without_token(self):
        cfg = GitHubConfig()
        headers = cfg.auth_headers()
        self.assertNotIn("Authorization", headers)
        self.assertEqual(headers["Accept"], "application/vnd.github+json")
        self.assertFalse(cfg.has_token)

    def test_auth_headers_with_token(self):
        cfg = GitHubConfig(token="ghp_test")
        headers = cfg.auth_headers()
        self.assertEqual(headers["Authorization"], "Bearer ghp_test")
        self.assertTrue(cfg.has_token)


class TestGetConfig(unittest.TestCase):
    def setUp(self):
        # strip everything related to our config
        self._env_backup = {
            key: os.environ.pop(key)
            for key in list(os.environ)
            if key
            in {
                "GITHUB_API_URL",
                "GITHUB_USERNAME",
                "GITHUB_TOKEN",
                "REQUEST_TIMEOUT",
                "MAX_RETRIES",
                "RETRY_DELAY",
                "GITHUB_PER_PAGE",
                "PROJECTS_LIMIT",
                "MORE_PROJECTS_LIMIT",
                "EXCLUDED_REPOS",
                "REQUIRED_TOPIC",
                "CSDN_USER_ID",
                "CSDN_RSS_URL",
                "MAX_POSTS",
                "BLOG_ENABLED",
                "QUOTE_APIS",
                "QUOTE_TIMEOUT",
                "QUOTE_MAX_RETRIES",
                "SNAKE_BRANCH",
                "SNAKE_DARK_PALETTE",
                "SNAKE_FILE_NAME",
                "SVG_OUTPUT_DIR",
                "BADGE_COLOR",
                "SECONDARY_COLOR",
                "LANGUAGE_COLOR",
                "DOCS_DIR",
                "SITE_URL",
                "JEKYLL_ENV",
                "DOCS_DEPLOY_ON_PUSH",
                "README_PATH",
                "LOG_LEVEL",
            }
        }

    def tearDown(self):
        for key, value in self._env_backup.items():
            os.environ[key] = value

    def test_defaults(self):
        config = get_config()
        self.assertIsInstance(config, Config)
        self.assertEqual(config.github.api_url, "https://api.github.com")
        self.assertEqual(config.github.username, "badhope")
        self.assertEqual(config.projects.limit, 4)
        self.assertEqual(config.projects.more_projects_limit, 5)
        self.assertEqual(config.blog.csdn_user_id, "weixin_56622231")
        self.assertEqual(config.quote.timeout, 10)
        self.assertEqual(config.snake.branch, "output")
        self.assertEqual(config.svg.output_dir, "assets/effects")
        self.assertEqual(config.docs.docs_dir, "docs")
        self.assertEqual(config.log_level, "INFO")
        self.assertTrue(config.docs.deploy_on_push)
        self.assertTrue(config.blog.enabled)

    def test_overrides(self):
        with patch.dict(
            os.environ,
            {
                "GITHUB_USERNAME": "alice",
                "PROJECTS_LIMIT": "10",
                "MORE_PROJECTS_LIMIT": "12",
                "EXCLUDED_REPOS": "a, b,c",
                "LOG_LEVEL": "DEBUG",
                "BADGE_COLOR": "ff0000",
                "SNAKE_BRANCH": "gh-pages",
            },
        ):
            config = get_config()
            self.assertEqual(config.github.username, "alice")
            self.assertEqual(config.projects.limit, 10)
            self.assertEqual(config.projects.more_projects_limit, 12)
            self.assertEqual(config.projects.excluded_repos, ["a", "b", "c"])
            self.assertEqual(config.log_level, "DEBUG")
            self.assertEqual(config.svg.badge_color, "ff0000")
            self.assertEqual(config.snake.branch, "gh-pages")

    def test_required_topic(self):
        with patch.dict(os.environ, {"REQUIRED_TOPIC": "ai-agent"}):
            config = get_config()
            self.assertEqual(config.projects.required_topic, "ai-agent")
        with patch.dict(os.environ, {"REQUIRED_TOPIC": ""}, clear=False):
            config = get_config()
            self.assertIsNone(config.projects.required_topic)

    def test_log_level_int(self):
        config = get_config()
        with patch.dict(os.environ, {"LOG_LEVEL": "WARNING"}):
            config = get_config()
        self.assertEqual(config.log_level_int, 30)


if __name__ == "__main__":
    unittest.main()
