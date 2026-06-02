# Profile Optimization Summary

This document is the single, consolidated reference for the structure and
optimization rules of the `badhope/badhope` profile repository. It
supersedes the older `README-OPTIMIZATION-SUMMARY.md`,
`README-OPTIMIZATION-GUIDE.md`, and `OPTIMIZATION-GUIDE.md` files
(those have been removed).

## Repository layout

```
badhope/
├── README.md                       # Auto-refreshing profile homepage
├── QUICKSTART.md                   # 5-minute quick start
├── DEPLOYMENT-CHECKLIST.md         # Step-by-step deployment guide
├── docs/                           # GitHub Pages documentation site
│   ├── _config.yml                 # Jekyll configuration
│   ├── index.md                    # Landing page
│   ├── SNAKE-SETUP.md              # Snake animation guide
│   ├── ANIMATION-GUIDE.md          # SVG & visual effects reference
│   ├── MIGRATION-GUIDE.md          # Migration notes between revisions
│   ├── PROJECT-REVIEW-SUMMARY.md   # Project review and rationale
│   ├── QUICK-REFERENCE.md          # One-page cheat sheet
│   └── profile-readme-spec.md      # Formal profile README specification
├── assets/                         # Static assets (SVG, images)
│   ├── banner/                     # Top-of-page banners
│   ├── dividers/                   # Section dividers
│   └── effects/                    # Decorative effects
├── scripts/                        # Automation
│   ├── common/                     # Shared utilities
│   ├── tests/                      # Tests for top-level scripts
│   ├── common/tests/               # Tests for the common package
│   ├── update_projects.py          # Sync featured + more projects
│   ├── update_blog.py              # Sync recent articles
│   ├── update_quote.py             # Daily quote refresh
│   ├── generate_svg.py             # Regenerate dynamic SVGs
│   └── test_scripts.py             # Unified test runner
└── .github/workflows/              # GitHub Actions
    ├── update-projects.yml         # 4x daily projects sync
    ├── blog.yml                    # Blog + daily quote
    ├── snake.yml                   # Snake animation generator
    ├── update-svg-stats.yml        # Dynamic SVG regeneration
    └── deploy-docs.yml             # GitHub Pages documentation
```

## Optimization principles

1. **Single source of truth for configuration** – All environment-driven
   configuration is loaded through
   [`scripts/common/config.py`](../scripts/common/config.py). Every
   script reads the same dataclass, so a new flag only needs to be
   added in one place.
2. **Marker-based README updates** – Updates target explicit
   `<!-- marker:start -->` / `<!-- marker:end -->` blocks in the README.
   This keeps the human-authored content (text, tables, images) safe
   while letting the automation replace only the dynamic sections.
3. **Common utilities** – The `scripts/common` package owns every
   cross-cutting concern: HTTP retries, GitHub API client, Markdown
   formatting, README IO, and structured exceptions.
4. **Tested** – Every script has a dedicated unit test module under
   `scripts/tests/`; common utilities are tested under
   `scripts/common/tests/`. CI runs the whole suite before pushing.
5. **Asset-friendly** – All 23 SVG assets are referenced in `README.md`
   (top section and the dedicated "Asset Showcase" section) so nothing
   is dead weight.
6. **Workflow consolidation** – Previously there were two `blog` and
   two `snake` workflows; they have been merged into single
   authoritative files.

## Operational rules

* **Always** add or update a `<!-- marker -->` block in `README.md`
  before writing a new script that mutates the README. Without the
  marker, `update_section()` logs a warning and skips the change.
* **Always** add a test when you add functionality. Run
  `python -m scripts.test_scripts` locally before opening a PR.
* **Always** update this document when the layout changes.
