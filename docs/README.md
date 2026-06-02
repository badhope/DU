# badhope GitHub Profile

This repository contains the `badhope/badhope` GitHub profile README together
with the automation, assets, documentation and tests required to keep it
fresh.

## Features

- **Starry-sky theme** – 23 hand-crafted SVG assets (backgrounds, dividers,
  decorative effects) all referenced from the README.
- **Automated content updates** – GitHub Actions refresh the Featured
  Projects, recent articles, daily quote, dynamic SVGs and the
  Contribution Snake animation on a regular schedule.
- **Dynamic content** – Real-time GitHub stats, contribution graph and
  language distribution are sourced from the GitHub REST API.
- **Fully tested** – Every script ships with unit tests; the GitHub
  Actions jobs run the entire test suite before pushing.
- **Modular automation** – All cross-cutting concerns live in
  `scripts/common/`, while the top-level scripts (`update_projects.py`,
  `update_blog.py`, `update_quote.py`, `generate_svg.py`) are thin entry
  points that read from a single configuration dataclass.

## Automated workflows

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `update-projects.yml` | Every 6 hours | Refreshes the Featured Projects + More Projects sections |
| `blog.yml` | Daily 06:00 UTC | Syncs the latest blog articles + daily quote |
| `snake.yml` | Weekly Sunday 00:00 UTC | Generates the Contribution Snake SVG (also supports manual first-time trigger) |
| `update-svg-stats.yml` | Daily 04:00 UTC | Regenerates dynamic SVGs in `assets/effects/` |
| `deploy-docs.yml` | On push to main | Builds the GitHub Pages documentation site |

## Project structure

```text
badhope/
├── README.md                       # Auto-refreshing profile homepage
├── QUICKSTART.md                   # 5-minute quick start
├── DEPLOYMENT-CHECKLIST.md         # Step-by-step deployment guide
├── LICENSE
├── pytest.ini                      # Pytest configuration
├── .env.example                    # Sample env file
├── docs/                           # GitHub Pages documentation site
│   ├── _config.yml                 # Jekyll configuration
│   ├── index.md                    # Landing page
│   ├── SNAKE-SETUP.md              # Snake animation guide
│   ├── ANIMATION-GUIDE.md          # SVG & visual effects reference
│   ├── MIGRATION-GUIDE.md          # Migration notes
│   ├── OPTIMIZATION-SUMMARY.md     # Repository layout and rules
│   ├── PROJECT-REVIEW-SUMMARY.md   # Project review
│   ├── QUICK-REFERENCE.md          # One-page cheat sheet
│   └── profile-readme-spec.md      # Formal profile README spec
├── assets/                         # Static assets (SVG)
│   ├── banner/                     # Top-of-page banners
│   ├── dividers/                   # Section dividers
│   └── effects/                    # Decorative effects
├── scripts/                        # Automation
│   ├── common/                     # Shared utilities
│   │   ├── __init__.py             # Package exports
│   │   ├── config.py               # Environment-driven configuration
│   │   ├── exceptions.py           # Structured exception types
│   │   ├── format.py               # Markdown formatters
│   │   ├── github.py               # GitHub REST client
│   │   ├── http.py                 # HTTP client with retries
│   │   ├── logger.py               # Logging setup
│   │   ├── readme.py               # README IO + marker updates
│   │   └── tests/                  # Tests for the common package
│   ├── tests/                      # Tests for the top-level scripts
│   ├── update_projects.py          # Sync featured + more projects
│   ├── update_blog.py              # Sync recent articles
│   ├── update_quote.py             # Daily quote refresh
│   ├── generate_svg.py             # Regenerate dynamic SVGs
│   └── test_scripts.py             # Unified test runner
└── .github/workflows/              # GitHub Actions
    ├── update-projects.yml
    ├── blog.yml
    ├── snake.yml
    ├── update-svg-stats.yml
    └── deploy-docs.yml
```

## Local development

### Prerequisites
- Python 3.11+
- pip 24+
- Git

### Setup

```bash
git clone https://github.com/badhope/badhope.git
cd badhope
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements-dev.txt
cp .env.example .env       # adjust as needed
```

### Run the automation locally

Each top-level script can be run as a module:

```bash
python -m scripts.update_projects
python -m scripts.update_blog
python -m scripts.update_quote
python -m scripts.generate_svg
```

### Run the test suite

```bash
python -m scripts.test_scripts
# or with coverage
pytest --cov=scripts
```

## Customisation

All environment variables are documented in [`.env.example`](../.env.example)
and parsed by [`scripts/common/config.py`](../scripts/common/config.py). The
most common knobs:

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECTS_LIMIT` | 4 | Number of featured projects |
| `MORE_PROJECTS_LIMIT` | 5 | Number of projects in the "More Projects" table |
| `EXCLUDED_REPOS` | _empty_ | Comma-separated repository names to skip |
| `MAX_POSTS` | 3 | Number of recent articles to show |
| `SNAKE_BRANCH` | `output` | Branch that hosts the generated snake SVG |
| `BADGE_COLOR` | `58a6ff` | Primary badge color |

## Troubleshooting

### Images not loading
- Use relative paths (`./assets/...`) – these always work locally and on
  GitHub.
- Verify the SVG file exists in the directory you reference.

### Workflows not running
- Check the **Actions** tab for error logs.
- Ensure the workflow file's `on.paths` includes the files you changed.
- The `GITHUB_TOKEN` secret is auto-injected; you don't need to configure
  it manually.

### Blog / quote sync returns nothing
- Verify the `CSDN_RSS_URL` is reachable.
- Check the fallback list in `config.py` for the daily quote.

## License

MIT License – see [LICENSE](../LICENSE) for details.

## Contact

- Email: x18825407105@outlook.com
- GitHub: [@badhope](https://github.com/badhope)
