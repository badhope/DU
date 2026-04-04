# badhope GitHub Profile

This repository contains my GitHub profile README with automated updates and visual enhancements.

## Features

- **Starry Sky Theme**: Custom SVG assets with a celestial aesthetic
- **Automated Updates**: GitHub Actions for daily quotes and weekly blog sync
- **Dynamic Content**: Real-time GitHub stats and contribution tracking
- **Responsive Design**: Optimized for all screen sizes

## Automated Workflows

### 1. Daily Quote Update
- **Schedule**: Daily at 2:00 PM (UTC+8)
- **Function**: Fetches inspirational quotes and updates README
- **File**: `.github/workflows/quote.yml`

### 2. Blog Sync
- **Schedule**: Weekly on Mondays at 4:00 PM (UTC+8)
- **Function**: Syncs latest articles from CSDN and Juejin
- **File**: `.github/workflows/blog.yml`

### 3. Contribution Snake
- **Schedule**: Weekly on Sundays at midnight (UTC+8)
- **Function**: Generates contribution grid snake animation
- **File**: `.github/workflows/snake.yml`

## Project Structure

```
badhope/
├── .github/
│   ├── workflows/          # GitHub Actions configurations
│   └── profiles/           # Profile configuration
├── assets/
│   ├── banner/             # Header banners
│   ├── dividers/           # Section dividers
│   └── effects/            # Visual effects and backgrounds
├── docs/                   # Documentation
├── scripts/                # Automation scripts
│   ├── update_blog.py      # Blog sync script
│   ├── update_quote.py     # Quote update script
│   └── helpers.py          # Shared utilities
├── README.md               # Main profile README
├── LICENSE                 # MIT License
└── .gitignore              # Git ignore rules
```

## Local Development

### Prerequisites
- Python 3.11+
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/badhope/badhope.git
cd badhope
```

2. Install dependencies:
```bash
pip install requests feedparser pyyaml
```

3. Test automation scripts:
```bash
python scripts/update_quote.py
python scripts/update_blog.py
```

## Customization

### Modifying Colors
Edit the SVG files in `assets/` to change the color scheme. The main colors are:
- Cream: `#fef3c7`
- Cyan: `#a5f3fc`
- Purple: `#c4b5fd`
- Pink: `#f9a8d4`

### Adding New Sections
Edit `README.md` and use the existing table structure for new content blocks.

### Changing Update Frequency
Modify the cron schedules in `.github/workflows/*.yml` files.

## Troubleshooting

### Images Not Loading
- Ensure you're using relative paths (`./assets/...`) instead of raw GitHub URLs
- Check that SVG files exist in the correct directories
- Verify file permissions

### Workflows Not Running
- Check GitHub Actions tab for error logs
- Ensure `GITHUB_TOKEN` secret is configured
- Verify workflow syntax is valid YAML

### Blog Sync Issues
- Verify RSS feed URLs are accessible
- Check API endpoints are responding
- Review script output in Actions logs

## License

MIT License - See [LICENSE](../LICENSE) for details

## Contact

- Email: x18825407105@outlook.com
- GitHub: [@badhope](https://github.com/badhope)
