# 🐍 Snake Animation Setup Guide

This guide explains how the Contribution Snake animation works in this
profile repository and how to make sure it renders on the profile README.

## Overview

The "Contribution Snake" is an animated SVG that visualizes your
GitHub contribution graph as a snake eating the activity. The SVG is
generated on a separate `output` branch and embedded into `README.md`
using a `raw.githubusercontent.com` URL.

The single source of truth for the snake workflow lives in
[`.github/workflows/snake.yml`](../.github/workflows/snake.yml).
It is triggered in three ways:

* **`push` to `main`** – rebuilds the snake whenever the main branch
  changes.
* **`schedule` (weekly, Sunday 00:00 UTC+8)** – keeps the animation
  fresh even when you do not push.
* **`workflow_dispatch`** – lets you manually trigger the very first
  build without waiting for the schedule.

## One-time initial setup

The snake action needs a populated `output` branch before the README
can display anything. Until that branch exists, the image in
`README.md` will 404.

1. Open the **Actions** tab in your repository.
2. Choose the **Generate Contribution Snake** workflow.
3. Click **Run workflow** → **Run workflow** (on the `main` branch).
4. Wait for the run to finish; a new `output` branch will be created
   and will contain two SVGs:
   * `github-contribution-grid-snake.svg`
   * `github-contribution-grid-snake-dark.svg`

Once the branch exists, the README will start showing the animation on
the next page refresh.

## How the README references the SVG

The README contains a single line of Markdown that points at the
dark-mode SVG in the `output` branch:

```markdown
![Snake Animation](https://raw.githubusercontent.com/badhope/badhope/output/github-contribution-grid-snake-dark.svg)
```

If you ever want to switch to the light-mode variant, just edit that
URL to `github-contribution-grid-snake.svg` (no `-dark` suffix).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| README shows a broken image | `output` branch does not exist yet | Run the workflow manually as described above |
| Image is outdated | Cron job skipped the run | Manually trigger the workflow or push to `main` |
| Workflow fails with `403` | The `GITHUB_TOKEN` lacks `contents: write` | The `permissions` block in `snake.yml` already requests it, double-check repository settings |

## Customisation knobs

The `snake` section of the configuration (see
[`scripts/common/config.py`](../scripts/common/config.py)) controls the
branch and the file name:

| Variable | Default | Description |
|----------|---------|-------------|
| `SNAKE_BRANCH` | `output` | Branch that hosts the generated SVG |
| `SNAKE_DARK_PALETTE` | `github-dark` | Color palette for the dark variant |
| `SNAKE_FILE_NAME` | `github-contribution-grid-snake-dark.svg` | File name referenced from the README |

You can override any of these via the GitHub Actions environment or
`.env` (see [`.env.example`](../.env.example)).
