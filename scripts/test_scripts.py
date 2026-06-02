#!/usr/bin/env python3
"""Unified test runner for the profile automation scripts.

Discovers and runs every test in :mod:`scripts.common.tests` and
:mod:`scripts.tests`. Run with::

    python -m scripts.test_scripts
    # or
    python scripts/test_scripts.py
"""

from __future__ import annotations

import importlib
import os
import pkgutil
import sys
import unittest
from pathlib import Path
from typing import Iterable


def _iter_test_modules(package_name: str) -> Iterable[str]:
    """Yield dotted module names of every test_*.py inside the package."""
    try:
        package = importlib.import_module(package_name)
    except ImportError as exc:
        print(f"⚠️  Could not import {package_name}: {exc}")
        return

    for mod_info in pkgutil.iter_modules(package.__path__):
        if mod_info.name.startswith("test_") and mod_info.ispkg is False:
            yield f"{package_name}.{mod_info.name}"


def build_suite() -> unittest.TestSuite:
    """Build a test suite covering every test module in the project."""
    repo_root = Path(__file__).resolve().parent.parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    for package in ("scripts.common.tests", "scripts.tests"):
        for module_name in _iter_test_modules(package):
            try:
                suite.addTests(loader.loadTestsFromName(module_name))
            except Exception as exc:  # pragma: no cover
                print(f"⚠️  Could not load {module_name}: {exc}")

    return suite


def run_tests() -> bool:
    """Run every discovered test and print a human readable summary."""
    print("🚀 Running profile automation test suite...")
    suite = build_suite()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 60)
    print(f"Tests run : {result.testsRun}")
    print(f"Failures  : {len(result.failures)}")
    print(f"Errors    : {len(result.errors)}")
    print(f"Skipped   : {len(result.skipped)}")
    print("=" * 60)
    return result.wasSuccessful()


if __name__ == "__main__":
    sys.exit(0 if run_tests() else 1)
