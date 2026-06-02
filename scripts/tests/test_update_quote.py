"""Tests for the update_quote script."""

from __future__ import annotations

import tempfile
import textwrap
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from scripts import update_quote
from scripts.common.config import get_config


class TestUpdateQuote(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.readme = Path(self.tmp.name) / "README.md"
        self.readme.write_text(
            textwrap.dedent(
                """\
                # Top

                <!-- quote:start -->
                old quote
                <!-- quote:end -->
                """
            ),
            encoding="utf-8",
        )
        patcher = patch("scripts.common.readme.get_readme_path", return_value=self.readme)
        patcher.start()
        self.addCleanup(patcher.stop)

    def _response(self, payload, status: int = 200):
        response = MagicMock()
        response.status_code = status
        response.json.return_value = payload
        response.raise_for_status = MagicMock()
        return response

    def test_fetch_from_zenquotes_list(self):
        session = MagicMock()
        session.get.return_value = self._response(
            [{"q": "Hello", "a": "Me"}]
        )
        with patch("scripts.update_quote.create_session", return_value=session):
            quote = update_quote._fetch_from_single_api(session, "u", 5)
        self.assertEqual(quote, {"text": "Hello", "author": "Me"})

    def test_fetch_from_quotable_dict(self):
        session = MagicMock()
        session.get.return_value = self._response(
            {"content": "Hi", "author": "You"}
        )
        quote = update_quote._fetch_from_single_api(session, "u", 5)
        self.assertEqual(quote, {"text": "Hi", "author": "You"})

    def test_fetch_returns_none_for_empty(self):
        session = MagicMock()
        session.get.return_value = self._response([])
        self.assertIsNone(update_quote._fetch_from_single_api(session, "u", 5))

    def test_fetch_returns_none_for_unknown_shape(self):
        session = MagicMock()
        session.get.return_value = self._response(42)
        self.assertIsNone(update_quote._fetch_from_single_api(session, "u", 5))

    def test_fetch_returns_none_for_exception(self):
        import requests

        session = MagicMock()
        session.get.side_effect = requests.RequestException("boom")
        self.assertIsNone(update_quote._fetch_from_single_api(session, "u", 5))

    def test_fetch_quote_falls_back(self):
        config = get_config()
        config.quote.apis = ["https://primary", "https://secondary"]

        session = MagicMock()
        session.get.side_effect = [
            self._response([], status=200),
            self._response({"unrelated": "x"}),
        ]
        with patch("scripts.update_quote.create_session", return_value=session):
            quote = update_quote.fetch_quote(config)
        self.assertIn(
            quote,
            config.quote.fallback_quotes,
        )

    def test_fetch_quote_uses_first_successful_api(self):
        config = get_config()
        config.quote.apis = ["https://primary"]

        session = MagicMock()
        session.get.return_value = self._response(
            [{"q": "Real", "a": "Real Author"}]
        )
        with patch("scripts.update_quote.create_session", return_value=session):
            quote = update_quote.fetch_quote(config)
        self.assertEqual(quote, {"text": "Real", "author": "Real Author"})

    def test_update_readme_writes_quote(self):
        quote = {"text": "Stay hungry", "author": "Jobs"}
        self.assertTrue(update_quote.update_readme(quote))
        content = self.readme.read_text(encoding="utf-8")
        self.assertIn("Stay hungry", content)
        self.assertNotIn("old quote", content)

    def test_update_readme_no_change_is_success(self):
        # First write
        update_quote.update_readme({"text": "Same", "author": "Me"})
        # Second write with same content - should return True (no change needed)
        result = update_quote.update_readme({"text": "Same", "author": "Me"})
        self.assertTrue(result)

    def test_main_no_change_returns_one(self):
        config = get_config()
        config.quote.apis = ["https://primary"]
        session = MagicMock()
        session.get.return_value = self._response([{"q": "x", "a": "y"}])
        with patch("scripts.update_quote.create_session", return_value=session):
            with patch("scripts.update_quote.get_config", return_value=config):
                with patch("scripts.update_quote.update_readme", return_value=False) as mock_update:
                    exit_code = update_quote.main()
        self.assertEqual(exit_code, 1)
        mock_update.assert_called_once()


if __name__ == "__main__":
    unittest.main()
