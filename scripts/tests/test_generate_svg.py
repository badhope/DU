"""Tests for the generate_svg script."""

from __future__ import annotations

import tempfile
import textwrap
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from scripts import generate_svg
from scripts.common.config import GitHubConfig
from scripts.common.exceptions import NetworkError


class TestGenerateSvg(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.output = Path(self.tmp.name)

    def test_generate_project_showcase(self):
        projects = [
            {
                "name": "alpha",
                "description": "Alpha description",
                "stars": 10,
                "language": "Python",
            }
        ]
        path = self.output / "showcase.svg"
        generate_svg.generate_project_showcase_svg(
            projects, path, username="badhope"
        )
        content = path.read_text(encoding="utf-8")
        self.assertIn("alpha", content)
        self.assertIn("badhope", content)
        self.assertIn("Total Projects: 1", content)

    def test_generate_project_showcase_empty(self):
        path = self.output / "showcase.svg"
        generate_svg.generate_project_showcase_svg([], path, username="badhope")
        content = path.read_text(encoding="utf-8")
        self.assertIn("Total Projects: 0", content)

    def test_generate_stats_panel(self):
        stats = {"Python": 50, "TypeScript": 30, "Go": 20}
        path = self.output / "stats.svg"
        generate_svg.generate_stats_panel_svg(stats, path)
        content = path.read_text(encoding="utf-8")
        self.assertIn("Python 50%", content)
        self.assertIn("TypeScript 30%", content)

    def test_fetch_projects_handles_error(self):
        client = MagicMock()
        client.iter_user_repos.side_effect = NetworkError("boom")
        self.assertEqual(generate_svg.fetch_projects(client, "x"), [])

    def test_fetch_projects_filters_and_sorts(self):
        client = MagicMock()
        client.iter_user_repos.return_value = iter(
            [
                {
                    "name": "low",
                    "fork": False,
                    "archived": False,
                    "stargazers_count": 1,
                    "language": "Python",
                    "html_url": "u",
                    "full_name": "u/low",
                    "description": "d",
                    "topics": [],
                },
                {
                    "name": "high",
                    "fork": False,
                    "archived": False,
                    "stargazers_count": 100,
                    "language": "Go",
                    "html_url": "u",
                    "full_name": "u/high",
                    "description": "d",
                    "topics": [],
                },
                {
                    "name": "fork",
                    "fork": True,
                    "archived": False,
                    "stargazers_count": 999,
                    "language": "Go",
                    "html_url": "u",
                    "full_name": "u/fork",
                    "description": "d",
                    "topics": [],
                },
            ]
        )
        result = generate_svg.fetch_projects(client, "x")
        self.assertEqual([r["name"] for r in result], ["high", "low"])

    def test_fetch_languages_handles_error(self):
        client = MagicMock()
        client.iter_user_repos_languages.side_effect = NetworkError("boom")
        result = generate_svg.fetch_languages(client, "x")
        self.assertIn("Python", result)

    def test_fetch_languages_uses_defaults_when_zero(self):
        client = MagicMock()
        client.iter_user_repos_languages.return_value = {}
        result = generate_svg.fetch_languages(client, "x")
        self.assertIn("Python", result)

    def test_fetch_languages_computes_percentages(self):
        client = MagicMock()
        client.iter_user_repos_languages.return_value = {
            "Python": 800,
            "TypeScript": 200,
        }
        result = generate_svg.fetch_languages(client, "x")
        self.assertAlmostEqual(result["Python"], 80.0)
        self.assertAlmostEqual(result["TypeScript"], 20.0)

    def test_main(self):
        client = MagicMock()
        client.iter_user_repos.return_value = iter(
            [
                {
                    "name": "alpha",
                    "fork": False,
                    "archived": False,
                    "stargazers_count": 10,
                    "language": "Python",
                    "html_url": "u",
                    "full_name": "u/alpha",
                    "description": "d",
                    "topics": [],
                }
            ]
        )
        client.iter_user_repos_languages.return_value = {"Python": 1000}
        config_mock = MagicMock()
        config_mock.github = GitHubConfig(token=None)
        config_mock.github.username = "badhope"
        config_mock.svg.output_dir = str(self.output)
        with patch("scripts.generate_svg.get_config", return_value=config_mock):
            with patch("scripts.generate_svg.GitHubClient", return_value=client):
                exit_code = generate_svg.main()
        self.assertEqual(exit_code, 0)
        self.assertTrue((self.output / "project-showcase.svg").exists())
        self.assertTrue((self.output / "stats-panel.svg").exists())


if __name__ == "__main__":
    unittest.main()
