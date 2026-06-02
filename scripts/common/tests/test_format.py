"""Tests for the markdown formatters."""

from __future__ import annotations

import unittest

from scripts.common.format import (
    escape_markdown,
    format_blog_markdown,
    format_blog_post,
    format_date,
    format_forks_badge,
    format_issues_badge,
    format_language_badge,
    format_last_commit_badge,
    format_more_projects_table,
    format_project_card,
    format_project_row,
    format_project_table,
    format_quote,
    format_stars_badge,
    format_timestamp,
    language_color,
    sanitize_filename,
    truncate_text,
)


class TestGenericHelpers(unittest.TestCase):
    def test_format_timestamp_length(self):
        ts = format_timestamp()
        self.assertEqual(len(ts), 16)  # "YYYY-MM-DD HH:MM"

    def test_format_date_length(self):
        self.assertEqual(len(format_date()), 10)

    def test_truncate_short(self):
        self.assertEqual(truncate_text("hi", 10), "hi")

    def test_truncate_long(self):
        result = truncate_text("abcdefghij", 5)
        self.assertEqual(len(result), 5)
        self.assertTrue(result.endswith("..."))

    def test_truncate_too_small(self):
        result = truncate_text("abcdef", 2)
        self.assertEqual(result, "ab")

    def test_sanitize_filename(self):
        self.assertEqual(sanitize_filename("Hello World!"), "Hello-World")
        self.assertEqual(sanitize_filename("  trim me  "), "trim-me")

    def test_escape_markdown(self):
        self.assertEqual(escape_markdown("<b>"), "&lt;b&gt;")
        self.assertEqual(escape_markdown(None), "")
        self.assertEqual(escape_markdown('a & "b"'), "a &amp; &quot;b&quot;")

    def test_language_color_known(self):
        self.assertEqual(language_color("Python"), "#3776AB")

    def test_language_color_unknown(self):
        self.assertEqual(language_color("Brainfuck"), "#8b949e")

    def test_language_color_none(self):
        self.assertEqual(language_color(None), "#8b949e")


class TestBadges(unittest.TestCase):
    def test_format_stars_badge(self):
        url = format_stars_badge("badhope/demo")
        self.assertIn("github/stars/badhope/demo", url)

    def test_format_stars_badge_empty(self):
        self.assertEqual(format_stars_badge(""), "")

    def test_format_forks_badge(self):
        url = format_forks_badge("badhope/demo")
        self.assertIn("github/forks/badhope/demo", url)

    def test_format_issues_badge(self):
        url = format_issues_badge("badhope/demo")
        self.assertIn("github/issues/badhope/demo", url)

    def test_format_language_badge(self):
        url = format_language_badge("badhope/demo")
        self.assertIn("languages/top/badhope/demo", url)

    def test_format_last_commit_badge(self):
        url = format_last_commit_badge("badhope/demo")
        self.assertIn("last-commit/badhope/demo", url)


class TestProjectFormatters(unittest.TestCase):
    def setUp(self):
        self.repo = {
            "name": "demo",
            "full_name": "badhope/demo",
            "description": "An awesome project",
            "url": "https://github.com/badhope/demo",
            "stars": 5,
            "language": "Python",
            "topics": ["ai-agent", "automation"],
        }

    def test_format_project_card(self):
        card = format_project_card(self.repo, show_badges=True)
        self.assertIn("[demo](https://github.com/badhope/demo)", card)
        self.assertIn("An awesome project", card)
        self.assertIn("`ai-agent`", card)
        self.assertIn("img.shields.io", card)

    def test_format_project_card_no_badges(self):
        card = format_project_card(self.repo, show_badges=False)
        self.assertNotIn("img.shields.io", card)

    def test_format_project_card_missing_description(self):
        repo = {**self.repo, "description": ""}
        card = format_project_card(repo, show_badges=False)
        self.assertIn("暂无描述", card)

    def test_format_project_card_skips_too_many_tags(self):
        repo = {**self.repo, "topics": ["a", "b", "c", "d"]}
        card = format_project_card(repo, show_badges=False)
        self.assertIn("`a`", card)
        self.assertIn("`c`", card)
        self.assertNotIn("`d`", card)

    def test_format_project_row(self):
        row = format_project_row(self.repo)
        self.assertTrue(row.startswith("|"))
        self.assertIn("demo", row)
        self.assertIn("An awesome", row)
        self.assertIn("img.shields.io/github/languages/top/badhope/demo", row)

    def test_format_project_row_no_full_name(self):
        repo = {**self.repo, "full_name": ""}
        row = format_project_row(repo)
        self.assertIn("N/A", row)

    def test_format_project_table_two_columns(self):
        repos = [
            self.repo,
            {
                **self.repo,
                "name": "demo2",
                "full_name": "badhope/demo2",
                "url": "https://github.com/badhope/demo2",
            },
        ]
        table = format_project_table(repos)
        self.assertIn("<table>", table)
        self.assertIn("<tr>", table)
        self.assertIn("</tr>", table)
        # contains two cards with distinct project names
        self.assertIn("[demo](https://github.com/badhope/demo)", table)
        self.assertIn("[demo2](https://github.com/badhope/demo2)", table)
        self.assertEqual(table.count("<tr>"), 1)
        self.assertEqual(table.count("<td"), 2)

    def test_format_project_table_one_column(self):
        repos = [self.repo]
        table = format_project_table(repos, columns=1)
        self.assertIn("width=\"100%\"", table)

    def test_format_project_table_columns_validation(self):
        with self.assertRaises(ValueError):
            format_project_table([], columns=0)

    def test_format_more_projects_table(self):
        repos = [self.repo, {**self.repo, "name": "x", "full_name": "b/x"}]
        table = format_more_projects_table(repos)
        self.assertIn("| Project | Description | Tech | Stars |", table)
        self.assertIn("| [demo]", table)
        self.assertIn("| [x]", table)

    def test_format_more_projects_table_filters_archived(self):
        repos = [
            self.repo,
            {**self.repo, "name": "old", "archived": True},
        ]
        table = format_more_projects_table(repos)
        self.assertIn("| [demo]", table)
        self.assertNotIn("| [old]", table)

    def test_format_more_projects_table_empty(self):
        table = format_more_projects_table([])
        self.assertIn("| - | - | - | - |", table)


class TestBlogFormatters(unittest.TestCase):
    def test_format_blog_post(self):
        line = format_blog_post(
            {
                "title": "Hello & world",
                "url": "https://blog.example/hello",
                "source": "CSDN",
                "date": "2026-05-29",
            },
            index=1,
        )
        self.assertIn("Hello &amp; world", line)
        self.assertIn("2026-05-29", line)
        self.assertIn("https://blog.example/hello", line)

    def test_format_blog_post_no_date(self):
        line = format_blog_post(
            {"title": "Hi", "url": "https://blog.example/hi", "source": "CSDN"},
            index=1,
        )
        self.assertNotIn("·", line)

    def test_format_blog_markdown_empty(self):
        out = format_blog_markdown([])
        self.assertIn("文章同步中", out)

    def test_format_blog_markdown_limits(self):
        posts = [
            {"title": f"Post {i}", "url": f"https://example/{i}", "source": "CSDN"}
            for i in range(5)
        ]
        out = format_blog_markdown(posts, max_posts=3)
        self.assertEqual(out.count("<small>"), 3)


class TestQuoteFormatter(unittest.TestCase):
    def test_format_quote_with_author(self):
        result = format_quote({"text": "Hello", "author": "Me"})
        self.assertIn("Hello", result)
        self.assertIn("Me", result)

    def test_format_quote_no_author(self):
        result = format_quote({"text": "Hello", "author": ""})
        self.assertNotIn("—", result)


if __name__ == "__main__":
    unittest.main()
