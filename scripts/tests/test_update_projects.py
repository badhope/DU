"""Tests for the update_projects script."""

from __future__ import annotations

import tempfile
import textwrap
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import update_projects
from scripts.common.config import get_config
from scripts.common.github import GitHubClient


def config_for_test():
    """Return a real Config object (not a MagicMock) for tests."""
    return get_config()


def _build_repos_payload():
    return [
        {
            "name": "alpha",
            "full_name": "badhope/alpha",
            "description": "Alpha project",
            "html_url": "https://github.com/badhope/alpha",
            "stargazers_count": 50,
            "forks_count": 5,
            "open_issues_count": 1,
            "language": "Python",
            "updated_at": "2026-05-01T00:00:00Z",
            "license": {"spdx_id": "MIT"},
            "topics": ["ai-agent"],
            "archived": False,
            "fork": False,
        },
        {
            "name": "beta",
            "full_name": "badhope/beta",
            "description": "Beta project",
            "html_url": "https://github.com/badhope/beta",
            "stargazers_count": 30,
            "forks_count": 2,
            "open_issues_count": 0,
            "language": "TypeScript",
            "updated_at": "2026-05-02T00:00:00Z",
            "license": None,
            "topics": ["automation"],
            "archived": False,
            "fork": False,
        },
        {
            "name": "forked",
            "full_name": "badhope/forked",
            "description": "forked project",
            "html_url": "https://github.com/badhope/forked",
            "stargazers_count": 99,
            "forks_count": 0,
            "open_issues_count": 0,
            "language": "Go",
            "updated_at": "2026-04-01T00:00:00Z",
            "license": None,
            "topics": [],
            "archived": False,
            "fork": True,
        },
    ]


class _FakeClient:
    """Tiny stand-in for ``GitHubClient`` that runs the real filter / sort / summary."""

    def __init__(self, repos):
        self._repos = repos

    def iter_user_repos(self, **kwargs):
        return iter(self._repos)

    def filter_repositories(self, repos, **kwargs):
        return GitHubClient.filter_repositories(repos, **kwargs)

    def sort_repositories(self, repos, **kwargs):
        return GitHubClient.sort_repositories(repos, **kwargs)

    def extract_repo_summary(self, repo):
        return GitHubClient.extract_repo_summary(repo)


class TestUpdateProjects(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.readme = Path(self.tmp.name) / "README.md"
        self.readme.write_text(
            textwrap.dedent(
                """\
                # Top

                ## Projects

                <!-- projects:start -->
                old featured
                <!-- projects:end -->

                <!-- more-projects:start -->
                old more
                <!-- more-projects:end -->

                Footer
                """
            ),
            encoding="utf-8",
        )
        # Use real IO so each call sees the latest state of the file.
        patcher = patch(
            "scripts.common.readme.get_readme_path", return_value=self.readme
        )
        patcher.start()
        self.addCleanup(patcher.stop)
        # Override read_readme / write_readme in update_projects with the
        # real ones that operate on self.readme
        patcher2 = patch(
            "scripts.update_projects.read_readme",
            side_effect=lambda: self.readme.read_text(encoding="utf-8"),
        )
        patcher2.start()
        self.addCleanup(patcher2.stop)
        patcher3 = patch(
            "scripts.update_projects.write_readme",
            side_effect=lambda content: self.readme.write_text(
                content, encoding="utf-8"
            ),
        )
        patcher3.start()
        self.addCleanup(patcher3.stop)

    def _patch_config(self, **overrides):
        """Patch get_config to return a config with given overrides."""
        from scripts.common.config import Config, GitHubConfig, ProjectsConfig

        config = Config(
            github=GitHubConfig(token=None, username="badhope"),
            projects=ProjectsConfig(
                limit=overrides.get("limit", 2),
                more_projects_limit=overrides.get("more_limit", 1),
                excluded_repos=overrides.get("excluded", []),
                required_topic=overrides.get("required_topic"),
            ),
            blog=config_for_test().blog,
            quote=config_for_test().quote,
            snake=config_for_test().snake,
            svg=config_for_test().svg,
            docs=config_for_test().docs,
        )
        return patch("scripts.update_projects.get_config", return_value=config)

    def test_update_readme_replaces_both_sections(self):
        # Build a larger payload: 2 active + 1 fork (filtered) + 1 extra active
        payload = _build_repos_payload() + [
            {
                "name": "gamma",
                "full_name": "badhope/gamma",
                "description": "Gamma project",
                "html_url": "https://github.com/badhope/gamma",
                "stargazers_count": 10,
                "forks_count": 0,
                "open_issues_count": 0,
                "language": "Go",
                "updated_at": "2026-05-03T00:00:00Z",
                "license": None,
                "topics": [],
                "archived": False,
                "fork": False,
            }
        ]
        client = _FakeClient(payload)
        with self._patch_config(limit=2, more_limit=1):
            with patch.object(update_projects, "GitHubClient", return_value=client):
                result = update_projects.update_readme(
                    featured_limit=2, more_projects_start=2, more_projects_limit=1
                )
        self.assertTrue(result)
        content = self.readme.read_text(encoding="utf-8")
        self.assertIn("[alpha]", content)
        self.assertNotIn("old featured", content)
        self.assertIn("| [gamma]", content)

    def test_update_readme_handles_no_repos(self):
        client = _FakeClient([])
        with self._patch_config(limit=2, more_limit=1):
            with patch.object(update_projects, "GitHubClient", return_value=client):
                result = update_projects.update_readme(
                    featured_limit=2, more_projects_start=2, more_projects_limit=1
                )
        self.assertFalse(result)

    def test_update_readme_handles_api_error(self):
        from scripts.common.exceptions import NetworkError

        class FailingClient:
            def iter_user_repos(self, **kwargs):
                raise NetworkError("boom")

        with self._patch_config(limit=2, more_limit=1):
            with patch.object(
                update_projects, "GitHubClient", return_value=FailingClient()
            ):
                result = update_projects.update_readme(
                    featured_limit=2, more_projects_start=2, more_projects_limit=1
                )
        self.assertFalse(result)

    def test_render_featured_respects_limit(self):
        from scripts.update_projects import _render_featured

        repos = [
            {"name": "a", "url": "u", "description": "d", "full_name": "x/a", "topics": []},
            {"name": "b", "url": "u", "description": "d", "full_name": "x/b", "topics": []},
        ]
        out = _render_featured(repos, limit=1)
        self.assertIn("[a]", out)
        self.assertNotIn("[b]", out)
        out_zero = _render_featured(repos, limit=0)
        self.assertIn("No projects", out_zero)

    def test_render_more_projects_respects_start(self):
        from scripts.update_projects import _render_more_projects

        repos = [
            {"name": "a", "url": "u", "description": "d", "full_name": "x/a", "topics": []},
            {"name": "b", "url": "u", "description": "d", "full_name": "x/b", "topics": []},
            {"name": "c", "url": "u", "description": "d", "full_name": "x/c", "topics": []},
        ]
        out = _render_more_projects(repos, start=2, limit=5)
        self.assertIn("| [c]", out)
        self.assertNotIn("| [a]", out)

    def test_main_returns_zero_on_success(self):
        client = _FakeClient(_build_repos_payload())
        with self._patch_config(limit=2, more_limit=1):
            with patch.object(update_projects, "GitHubClient", return_value=client):
                exit_code = update_projects.main()
        self.assertEqual(exit_code, 0)

    def test_main_returns_one_when_no_change(self):
        client = _FakeClient(_build_repos_payload())
        with self._patch_config(limit=2, more_limit=1):
            with patch.object(update_projects, "GitHubClient", return_value=client):
                # First run - should write content
                update_projects.update_readme(
                    featured_limit=2, more_projects_start=2, more_projects_limit=1
                )
                # Second run with same data - should be a no-op
                exit_code = update_projects.main()
        # Second run: README already up to date, returns 1
        self.assertEqual(exit_code, 1)


if __name__ == "__main__":
    unittest.main()
