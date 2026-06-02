"""Tests for the GitHub REST API client."""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

import requests

from scripts.common.config import GitHubConfig
from scripts.common.exceptions import GitHubAPIError, NetworkError, RateLimitError
from scripts.common.github import GitHubClient


def _build_client() -> tuple[GitHubClient, MagicMock]:
    config = GitHubConfig(token="ghp_test", max_retries=1, retry_delay=0.0)
    client = GitHubClient(config)
    session = MagicMock()
    client.session = session
    return client, session


class TestGithubHelpers(unittest.TestCase):
    def test_build_url(self):
        client, _ = _build_client()
        self.assertEqual(
            client._build_url("users/badhope"),
            "https://api.github.com/users/badhope",
        )
        self.assertEqual(
            client._build_url("/users/badhope"),
            "https://api.github.com/users/badhope",
        )

    def test_is_rate_limited_true_when_remaining_zero(self):
        response = MagicMock()
        response.headers = {"X-RateLimit-Remaining": "0"}
        self.assertTrue(GitHubClient._is_rate_limited(response))

    def test_is_rate_limited_false_when_remaining_positive(self):
        response = MagicMock()
        response.headers = {"X-RateLimit-Remaining": "10"}
        self.assertFalse(GitHubClient._is_rate_limited(response))

    def test_is_rate_limited_false_when_header_missing(self):
        response = MagicMock()
        response.headers = {}
        self.assertFalse(GitHubClient._is_rate_limited(response))


class TestGithubRequest(unittest.TestCase):
    def test_request_success(self):
        client, session = _build_client()
        response = MagicMock()
        response.status_code = 200
        response.json.return_value = {"login": "badhope"}
        session.request.return_value = response

        data = client._request("GET", "/user")
        self.assertEqual(data, {"login": "badhope"})

    def test_request_invalid_json_raises_network_error(self):
        client, session = _build_client()
        response = MagicMock()
        response.status_code = 200
        response.json.side_effect = ValueError("bad json")
        session.request.return_value = response
        with self.assertRaises(NetworkError):
            client._request("GET", "/user")

    def test_request_translates_request_exception(self):
        client, session = _build_client()
        session.request.side_effect = requests.ConnectionError("boom")
        with self.assertRaises(NetworkError):
            client._request("GET", "/user")

    def test_request_rate_limited(self):
        client, session = _build_client()
        response = MagicMock()
        response.status_code = 403
        response.headers = {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": "1700000000",
        }
        response.text = "rate limit"
        session.request.return_value = response
        with self.assertRaises(RateLimitError):
            client._request("GET", "/user")

    def test_request_http_error(self):
        client, session = _build_client()
        response = MagicMock()
        response.status_code = 500
        response.headers = {}
        response.text = "internal error"
        session.request.return_value = response
        with self.assertRaises(GitHubAPIError):
            client._request("GET", "/user")


class TestGithubFilters(unittest.TestCase):
    def setUp(self):
        self.repos = [
            {
                "name": "real",
                "fork": False,
                "archived": False,
                "topics": ["ai-agent"],
                "stargazers_count": 10,
            },
            {
                "name": "forked",
                "fork": True,
                "archived": False,
                "topics": [],
                "stargazers_count": 100,
            },
            {
                "name": "old",
                "fork": False,
                "archived": True,
                "topics": [],
                "stargazers_count": 50,
            },
            {
                "name": "no-topic",
                "fork": False,
                "archived": False,
                "topics": [],
                "stargazers_count": 30,
            },
        ]

    def test_filter_repositories_default(self):
        result = GitHubClient.filter_repositories(self.repos)
        self.assertEqual([r["name"] for r in result], ["real", "no-topic"])

    def test_filter_repositories_include_archived(self):
        result = GitHubClient.filter_repositories(
            self.repos, include_archived=True
        )
        self.assertEqual([r["name"] for r in result], ["real", "old", "no-topic"])

    def test_filter_repositories_required_topic(self):
        result = GitHubClient.filter_repositories(
            self.repos, required_topic="ai-agent"
        )
        self.assertEqual([r["name"] for r in result], ["real"])

    def test_filter_repositories_excluded_names(self):
        result = GitHubClient.filter_repositories(
            self.repos, excluded_names=["no-topic"]
        )
        self.assertEqual([r["name"] for r in result], ["real"])

    def test_sort_repositories_by_stars(self):
        sorted_repos = GitHubClient.sort_repositories(
            self.repos, by="stargazers_count"
        )
        self.assertEqual(
            [r["name"] for r in sorted_repos],
            ["forked", "old", "no-topic", "real"],
        )

    def test_extract_repo_summary(self):
        summary = GitHubClient.extract_repo_summary(
            {
                "name": "demo",
                "full_name": "badhope/demo",
                "description": "demo project",
                "html_url": "https://github.com/badhope/demo",
                "stargazers_count": 5,
                "forks_count": 1,
                "open_issues_count": 2,
                "language": "Python",
                "updated_at": "2026-05-29T12:00:00Z",
                "license": {"spdx_id": "MIT", "name": "MIT License"},
                "topics": ["ai", "agent"],
                "archived": False,
                "fork": False,
            }
        )
        self.assertEqual(summary["name"], "demo")
        self.assertEqual(summary["full_name"], "badhope/demo")
        self.assertEqual(summary["license"], "MIT")
        self.assertEqual(summary["topics"], ["ai", "agent"])
        self.assertEqual(summary["updated_at"], "2026-05-29")


if __name__ == "__main__":
    unittest.main()
