"""Tests for the update_blog script."""

from __future__ import annotations

import tempfile
import textwrap
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import requests

from scripts import update_blog
from scripts.common.config import get_config
from scripts.common.exceptions import NetworkError


def _rss_payload(items):
    """Build a minimal RSS XML response for testing."""
    body = "<rss><channel>"
    for item in items:
        body += (
            f"<item><title>{item['title']}</title>"
            f"<link>{item['url']}</link>"
            f"<pubDate>{item.get('pubDate', '')}</pubDate></item>"
        )
    body += "</channel></rss>"
    return body.encode("utf-8")


class TestUpdateBlog(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.readme = Path(self.tmp.name) / "README.md"
        self.readme.write_text(
            textwrap.dedent(
                """\
                # Top

                <!-- blog:start -->
                old blog
                <!-- blog:end -->
                """
            ),
            encoding="utf-8",
        )
        patcher = patch("scripts.common.readme.get_readme_path", return_value=self.readme)
        patcher.start()
        self.addCleanup(patcher.stop)

    def _session_response(self, content: bytes, status: int = 200):
        response = MagicMock()
        response.status_code = status
        response.content = content
        response.raise_for_status = MagicMock()
        if status >= 400:
            response.raise_for_status.side_effect = requests.HTTPError("boom")
        return response

    def test_format_rfc822_date(self):
        self.assertEqual(
            update_blog._format_rfc822_date("Fri, 22 May 2026 12:00:00 GMT"),
            "2026-05-22",
        )
        self.assertEqual(update_blog._format_rfc822_date(""), "")
        self.assertEqual(update_blog._format_rfc822_date("garbage"), "")

    def test_fetch_csdn_posts_success(self):
        response = self._session_response(
            _rss_payload(
                [
                    {"title": "Hello", "url": "https://blog/hello", "pubDate": "Mon, 12 May 2026 00:00:00 GMT"},
                    {"title": "World", "url": "https://blog/world", "pubDate": "Tue, 13 May 2026 00:00:00 GMT"},
                ]
            )
        )
        session = MagicMock()
        session.get.return_value = response
        with patch("scripts.update_blog.create_session", return_value=session):
            config = get_config()
            config.blog.csdn_rss_url = "https://blog/rss"
            posts = update_blog.fetch_csdn_posts(config)
        self.assertEqual(len(posts), 2)
        self.assertEqual(posts[0]["title"], "Hello")
        self.assertEqual(posts[0]["date"], "2026-05-12")

    def test_fetch_csdn_posts_request_error(self):
        session = MagicMock()
        session.get.side_effect = requests.ConnectionError("boom")
        with patch("scripts.update_blog.create_session", return_value=session):
            with self.assertRaises(NetworkError):
                update_blog.fetch_csdn_posts(get_config())

    def test_fetch_csdn_posts_parse_error(self):
        response = self._session_response(b"<rss><not-valid>")
        session = MagicMock()
        session.get.return_value = response
        with patch("scripts.update_blog.create_session", return_value=session):
            with self.assertRaises(NetworkError):
                update_blog.fetch_csdn_posts(get_config())

    def test_fetch_csdn_posts_disabled(self):
        config = get_config()
        config.blog.enabled = False
        self.assertEqual(update_blog.fetch_csdn_posts(config), [])

    def test_collect_posts_merges_and_caps(self):
        config = get_config()
        config.blog.max_posts = 2

        def source_a(_config):
            return [{"title": "a", "url": "u", "source": "x", "date": "2026-01-01"}]

        def source_b(_config):
            return [
                {"title": "b", "url": "u", "source": "x", "date": "2026-01-02"},
                {"title": "c", "url": "u", "source": "x", "date": "2026-01-03"},
            ]

        merged = update_blog.collect_posts(config, [source_a, source_b])
        self.assertEqual([post["title"] for post in merged], ["a", "b"])

    def test_collect_posts_continues_after_failure(self):
        config = get_config()
        config.blog.max_posts = 3

        def bad(_config):
            raise NetworkError("down")

        def good(_config):
            return [{"title": "x", "url": "u", "source": "y", "date": ""}]

        merged = update_blog.collect_posts(config, [bad, good])
        self.assertEqual([post["title"] for post in merged], ["x"])

    def test_update_readme_replaces_section(self):
        config = get_config()
        config.blog.max_posts = 2
        posts = [
            {"title": "P1", "url": "https://blog/p1", "source": "CSDN", "date": "2026-05-12"}
        ]
        self.assertTrue(update_blog.update_readme(posts, config))
        content = self.readme.read_text(encoding="utf-8")
        self.assertIn("P1", content)
        self.assertNotIn("old blog", content)

    def test_main_success(self):
        config = get_config()
        config.blog.max_posts = 1

        def fake_source(_config):
            return [{"title": "ok", "url": "u", "source": "x", "date": ""}]

        with patch("scripts.update_blog.get_config", return_value=config):
            exit_code = update_blog.main(sources=[fake_source])
        self.assertEqual(exit_code, 0)

    def test_main_no_posts(self):
        config = get_config()

        def empty_source(_config):
            return []

        with patch("scripts.update_blog.get_config", return_value=config):
            exit_code = update_blog.main(sources=[empty_source])
        self.assertEqual(exit_code, 1)


if __name__ == "__main__":
    unittest.main()
