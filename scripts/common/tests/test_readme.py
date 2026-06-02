"""Tests for the README read/write helpers."""

from __future__ import annotations

import tempfile
import textwrap
import unittest
from pathlib import Path

from scripts.common.exceptions import READMEError
from scripts.common.readme import (
    get_marker_content,
    get_readme_path,
    read_readme,
    update_section,
    write_readme,
)


class TestReadmeHelpers(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / "README.md"
        self.path.write_text(
            textwrap.dedent(
                """\
                # Heading

                <!-- projects:start -->
                old content
                <!-- projects:end -->

                end
                """
            ),
            encoding="utf-8",
        )

    def test_get_readme_path_with_override(self):
        self.assertEqual(get_readme_path(str(self.path)), self.path)

    def test_read_and_write_readme(self):
        self.assertIn("Heading", read_readme(self.path))
        write_readme("# New", self.path)
        self.assertEqual(read_readme(self.path), "# New")

    def test_read_missing_raises(self):
        missing = self.path.with_name("missing.md")
        with self.assertRaises(READMEError):
            read_readme(missing)

    def test_update_section_replaces_block(self):
        original = read_readme(self.path)
        updated, changed = update_section(
            original,
            "<!-- projects:start -->",
            "<!-- projects:end -->",
            "new content",
        )
        self.assertTrue(changed)
        self.assertIn("new content", updated)
        self.assertNotIn("old content", updated)

    def test_update_section_unchanged(self):
        original = read_readme(self.path)
        updated, changed = update_section(
            original,
            "<!-- projects:start -->",
            "<!-- projects:end -->",
            "new content",
        )
        # call twice - second one is a no-op for "new content"
        updated2, changed2 = update_section(
            updated,
            "<!-- projects:start -->",
            "<!-- projects:end -->",
            "new content",
        )
        self.assertFalse(changed2)
        self.assertEqual(updated, updated2)

    def test_update_section_missing_markers(self):
        original = "# No markers here"
        updated, changed = update_section(
            original,
            "<!-- x:start -->",
            "<!-- x:end -->",
            "body",
        )
        self.assertFalse(changed)
        self.assertEqual(updated, original)

    def test_get_marker_content(self):
        content = get_marker_content(
            "<!-- s -->",
            "<!-- e -->",
            "body",
        )
        self.assertIn("<!-- s -->", content)
        self.assertIn("<!-- e -->", content)
        self.assertIn("body", content)


if __name__ == "__main__":
    unittest.main()
