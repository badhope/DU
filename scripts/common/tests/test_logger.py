"""Tests for the common logger helper."""

from __future__ import annotations

import logging
import os
import unittest

from scripts.common.logger import _resolve_level, configure_logging, get_logger


class TestResolveLevel(unittest.TestCase):
    def test_none_default_info(self):
        self.assertEqual(_resolve_level(None), logging.INFO)

    def test_string_upper(self):
        self.assertEqual(_resolve_level("warning"), logging.WARNING)

    def test_invalid_string(self):
        self.assertEqual(_resolve_level("nope"), logging.INFO)


class TestConfigureLogging(unittest.TestCase):
    def setUp(self):
        from scripts.common import logger as logger_module
        logger_module._configured = False

    def test_idempotent(self):
        configure_logging(level="INFO")
        first = get_logger("scripts.test1")
        configure_logging(level="DEBUG")
        second = get_logger("scripts.test2")
        self.assertIsInstance(first, logging.Logger)
        self.assertIsInstance(second, logging.Logger)
        self.assertEqual(first.name, "scripts.test1")
        self.assertEqual(second.name, "scripts.test2")

    def test_get_logger(self):
        logger = get_logger("scripts.dummy")
        self.assertEqual(logger.name, "scripts.dummy")


if __name__ == "__main__":
    unittest.main()
