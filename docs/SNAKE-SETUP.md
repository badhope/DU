# Snake Animation Setup Guide

## Initial Setup (First Time Only)

The contribution snake animation needs to be generated for the first time. Follow these steps:

### Option 1: Manual Trigger via GitHub Actions (Recommended)

1. Go to your repository on GitHub: https://github.com/badhope/badhope
2. Click on the **Actions** tab
3. Find **"Initial Snake Generation"** workflow
4. Click **"Run workflow"** button
5. Wait for the action to complete (usually takes 1-2 minutes)
6. The snake animation will be published to the `snake-animation` branch

### Option 2: Via GitHub CLI

```bash
gh workflow run init-snake.yml
```

### After Initial Setup

Once the initial snake animation is generated, it will automatically update every Sunday at midnight (UTC+8) via the scheduled workflow.

## Viewing the Snake Animation

After generation, you can view it at:
```
https://raw.githubusercontent.com/badhope/badhope/snake-animation/github-contribution-grid-snake-dark.svg
```

It's already embedded in your README.md!

## Troubleshooting

### Snake Not Showing?

1. Check if the `snake-animation` branch exists:
   ```bash
   git branch -r | grep snake-animation
   ```

2. Verify the workflow ran successfully:
   - Go to Actions tab
   - Check for any failed runs
   - Re-run if necessary

### Animation Not Updating?

- The snake updates weekly on Sundays
- You can manually trigger an update via Actions tab
- Check that your GitHub contributions are being recorded

## Customization

Want to change the snake appearance? Edit `.github/workflows/snake.yml`:

```yaml
outputs: |
  dist/github-contribution-grid-snake.svg
  dist/github-contribution-grid-snake-dark.svg?palette=github-dark
```

Available palettes: `github`, `github-dark`, `blue`, `green`, etc.
