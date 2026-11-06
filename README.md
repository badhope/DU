# Tianji · DU <sub>v0.5.3</sub>

两种门派读同一个问题，你盲评，然后才揭晓是谁。带日期的断言进应验簿，由你自己回填。

[中文](README.zh-CN.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

| Ask | Blind match | After voting |
| --- | --- | --- |
| ![Home](docs/screenshots/home.png) | ![Blind](docs/screenshots/blind-match.png) | ![Reveal](docs/screenshots/reveal.png) |

## Install

```bash
# CLI
npm ci && npm run build:all
node build/cli.mjs ask "我要不要换工作" --domain career

# Desktop (Windows, no Node needed)
build/install.cmd
tianji serve                 # http://127.0.0.1:7317

# MCP (Claude / VS Code / Cursor)
{ "mcpServers": { "tianji": { "command": "tianji", "args": ["mcp"] } } }
```

## What it does

| | |
| --- | --- |
| 问一次 | 写下问题，可填生辰（填了才能排子平与紫微） |
| 盲评 | 两份匿名回答，投票前看不到姓名、门派、盘面 |
| 揭晓 | 投完才看到是谁，以及引文出处 |
| 回填 | 一周后回来说这条断语准不准 |

内核：子平八字、梅花易数、紫微斗数。全部本机计算。

## License

MIT。古籍原文的公有领域来源见 `public/corpus/manifest.json`。
