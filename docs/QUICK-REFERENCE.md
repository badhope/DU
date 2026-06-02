# 🚀 Quick Reference Card

A one-page cheat sheet for the most common commands and operations on the
`badhope/badhope` profile repository.

## Common commands

```bash
# Activate the virtual environment
source .venv/bin/activate

# Install / refresh dependencies
pip install -r requirements-dev.txt

# Run the automation scripts locally
python -m scripts.update_projects
python -m scripts.update_blog
python -m scripts.update_quote
python -m scripts.generate_svg

# Run the test suite
python -m scripts.test_scripts
pytest --cov=scripts

# Code quality
ruff check scripts/
mypy scripts/
```

## Module map

| Module | Purpose |
|--------|---------|
| `scripts/common/config.py` | Single source of truth for env-driven configuration |
| `scripts/common/exceptions.py` | Structured exception types (`NetworkError`, `GitHubAPIError`, `RateLimitError`, `READMEError`, `ConfigError`) |
| `scripts/common/format.py` | Markdown formatters for projects, blog, quotes and shields.io badges |
| `scripts/common/github.py` | GitHub REST client with pagination, filtering, sorting |
| `scripts/common/http.py` | HTTP session + retry decorator with exponential backoff |
| `scripts/common/logger.py` | Centralised logging setup |
| `scripts/common/readme.py` | README read/write + marker-based section updates |
| `scripts/update_projects.py` | Refreshes `<!-- projects:start -->` and `<!-- more-projects:start -->` |
| `scripts/update_blog.py` | Refreshes `<!-- blog:start -->` |
| `scripts/update_quote.py` | Refreshes `<!-- quote:start -->` |
| `scripts/generate_svg.py` | Regenerates `project-showcase.svg` and `stats-panel.svg` |
| `scripts/test_scripts.py` | Unified test runner (unittest discover) |

## README markers

| Section | Start marker | End marker | Updated by |
|---------|--------------|------------|------------|
| Featured Projects | `<!-- projects:start -->` | `<!-- projects:end -->` | `update_projects.py` |
| More Projects | `<!-- more-projects:start -->` | `<!-- more-projects:end -->` | `update_projects.py` |
| Daily Quote | `<!-- quote:start -->` | `<!-- quote:end -->` | `update_quote.py` |
| Recent Articles | `<!-- blog:start -->` | `<!-- blog:end -->` | `update_blog.py` |

## Workflows

| File | Schedule | Trigger |
|------|----------|---------|
| `update-projects.yml` | Every 6 hours | push to main, manual |
| `blog.yml` | Daily 06:00 UTC | push to main, manual |
| `snake.yml` | Weekly Sunday 00:00 UTC | push to main, manual |
| `update-svg-stats.yml` | Daily 04:00 UTC | push to main, manual |
| `deploy-docs.yml` | On push to main | — |

## Most common environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GITHUB_TOKEN` | (auto in CI) | Raises the API rate limit to 5000 req/h |
| `GITHUB_USERNAME` | `badhope` | Profile owner |
| `PROJECTS_LIMIT` | `4` | Featured project cards |
| `MORE_PROJECTS_LIMIT` | `5` | More Projects table |
| `EXCLUDED_REPOS` | _empty_ | Comma-separated list of repos to skip |
| `MAX_POSTS` | `3` | Recent blog articles |
| `SNAKE_BRANCH` | `output` | Branch hosting the Snake SVG |
| `BADGE_COLOR` | `58a6ff` | Primary badge color |
| `LOG_LEVEL` | `INFO` | `DEBUG` for verbose output |

See [`.env.example`](../.env.example) for the complete list.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| README image is broken | Use relative paths (`./assets/...`); check that the SVG exists. |
| Workflows do not run | Verify `on.paths` includes the files you touched; the `GITHUB_TOKEN` is auto-injected. |
| Blog / quote sync returns nothing | Check `CSDN_RSS_URL` and the `QUOTE_APIS` list; raise `LOG_LEVEL=DEBUG`. |
| Rate limit hit | Provide a `GITHUB_TOKEN` (5000 req/h). |
| Snake image 404s | The `output` branch does not exist yet; trigger `snake.yml` once manually. |

## Further reading

- [docs/README.md](README.md) – full project documentation
- [docs/OPTIMIZATION-SUMMARY.md](OPTIMIZATION-SUMMARY.md) – layout & rules
- [docs/SNAKE-SETUP.md](SNAKE-SETUP.md) – Snake animation guide
- [DEPLOYMENT-CHECKLIST.md](../DEPLOYMENT-CHECKLIST.md) – deployment status report
