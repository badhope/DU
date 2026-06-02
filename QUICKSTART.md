# 🚀 Quick Start

Get the `badhope/badhope` profile repository up and running in 5 minutes.

## 1. Clone the repository

```bash
git clone https://github.com/badhope/badhope.git
cd badhope
```

## 2. Install dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
```

## 3. Configure environment variables

```bash
cp .env.example .env
# edit .env and provide GITHUB_TOKEN (optional for local dev)
```

## 4. Run the automation

```bash
# Update featured projects from GitHub
python -m scripts.update_projects

# Sync latest blog posts
python -m scripts.update_blog

# Refresh the daily quote
python -m scripts.update_quote

# Regenerate dynamic SVGs
python -m scripts.generate_svg
```

## 5. Run the test suite

```bash
python -m scripts.test_scripts
# or with coverage
pytest --cov=scripts
```

## 6. First-time Snake setup

The Contribution Snake is generated into the `output` branch. On a fresh
repository the branch does not exist yet, so the README image will 404
until you trigger the workflow once:

1. Open the **Actions** tab.
2. Choose **Generate Contribution Snake**.
3. Click **Run workflow** → **Run workflow**.

Full instructions live in [docs/SNAKE-SETUP.md](docs/SNAKE-SETUP.md).

## Where to look next

- [docs/README.md](docs/README.md) – full project documentation
- [docs/OPTIMIZATION-SUMMARY.md](docs/OPTIMIZATION-SUMMARY.md) – layout & rules
- [docs/QUICK-REFERENCE.md](docs/QUICK-REFERENCE.md) – one-page cheat sheet
- [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) – deployment status report
