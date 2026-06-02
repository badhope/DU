"""Tests for the common HTTP client and retry decorator."""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

import requests

from scripts.common.exceptions import NetworkError
from scripts.common.http import (
    DEFAULT_RETRYABLE_STATUSES,
    DEFAULT_USER_AGENT,
    create_session,
    fetch_with_retry,
    retry_on_failure,
)


class TestRetryDecorator(unittest.TestCase):
    def test_success_first_try(self):
        calls = {"count": 0}

        @retry_on_failure(max_retries=3, delay=0)
        def succeed():
            calls["count"] += 1
            return "ok"

        self.assertEqual(succeed(), "ok")
        self.assertEqual(calls["count"], 1)

    def test_retry_then_succeed(self):
        calls = {"count": 0}

        @retry_on_failure(
            max_retries=3, delay=0, exceptions=(ValueError,)
        )
        def maybe_fail():
            calls["count"] += 1
            if calls["count"] < 3:
                raise ValueError("boom")
            return "ok"

        self.assertEqual(maybe_fail(), "ok")
        self.assertEqual(calls["count"], 3)

    def test_retry_exhausted(self):
        @retry_on_failure(max_retries=2, delay=0, exceptions=(ValueError,))
        def always_fail():
            raise ValueError("nope")

        with self.assertRaises(ValueError):
            always_fail()

    def test_non_retryable_exception(self):
        calls = {"count": 0}

        @retry_on_failure(max_retries=3, delay=0, exceptions=(ValueError,))
        def bad_call():
            calls["count"] += 1
            raise KeyError("not retried")

        with self.assertRaises(KeyError):
            bad_call()
        self.assertEqual(calls["count"], 1)


class TestCreateSession(unittest.TestCase):
    def test_default_session(self):
        session = create_session()
        self.assertIsInstance(session, requests.Session)
        self.assertEqual(session.headers["User-Agent"], DEFAULT_USER_AGENT)
        self.assertNotIn("Authorization", session.headers)

    def test_session_with_token(self):
        session = create_session(token="abc")
        self.assertEqual(session.headers["Authorization"], "Bearer abc")

    def test_session_with_custom_user_agent(self):
        session = create_session(user_agent="custom-agent")
        self.assertEqual(session.headers["User-Agent"], "custom-agent")


class TestFetchWithRetry(unittest.TestCase):
    def test_successful_get(self):
        response = MagicMock(spec=requests.Response)
        response.status_code = 200
        with patch("scripts.common.http.create_session") as session_factory:
            session = MagicMock()
            session.request.return_value = response
            session_factory.return_value = session
            result = fetch_with_retry("https://example.com", session=session)
            self.assertEqual(result, response)
            session.request.assert_called_once()

    def test_request_exception_raises_network_error(self):
        with patch("scripts.common.http.create_session") as session_factory:
            session = MagicMock()
            session.request.side_effect = requests.ConnectionError("boom")
            session_factory.return_value = session
            with self.assertRaises(NetworkError):
                fetch_with_retry("https://example.com", session=session)

    def test_retryable_statuses_contains_common_codes(self):
        for code in (429, 500, 502, 503, 504):
            self.assertIn(code, DEFAULT_RETRYABLE_STATUSES)


if __name__ == "__main__":
    unittest.main()
