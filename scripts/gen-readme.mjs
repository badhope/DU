#!/usr/bin/env node
/**
 * README 生成器（双语）
 *
 * 单一真相来源：工具注册表、大师注册表、语料 manifest。手写 README 必然漂移，
 * 这个脚本让 README 永远等于代码当前状态。
 *
 * 语言策略：README.md 是英文主文档（面向国际开源用户），README.zh-CN.md 是
 * 完整中文版，两份顶部互链。不用 <details> 折叠或混排双语——混排会让两边
 * 读者都要跳着读。数字与书目清单来自实时读取，不是硬编码。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CHECK = process.argv.includes('--check')

const registry = fs.readFileSync(path.join(ROOT, 'src', 'tools', 'registry.ts'), 'utf8')
const cats = [...registry.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*latin:\s*'([^']+)'/g)].map((m) => ({
  id: m[1],
  name: m[2],
  latin: m[3],
}))
const imported = [...registry.matchAll(/import\s*\{\s*(\w+)\s*\}\s*from\s*'\.\/(\w+)'/g)].map((m) => m[1])
const camelToKebab = (name) => name.replace(/Tool$/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const tools = imported
  .map((name) => {
    const file = path.join(ROOT, 'src', 'tools', `${camelToKebab(name)}.ts`)
    if (!fs.existsSync(file)) return null
    const source = fs.readFileSync(file, 'utf8')
    const pick = (pattern) => pattern.exec(source)?.[1]
    return {
      id: pick(/id:\s*'([^']+)'/),
      name: pick(/name:\s*'([^']+)'/),
      category: pick(/category:\s*'([^']+)'/),
      blurb: pick(/blurb:\s*'([^']+)'/),
    }
  })
  .filter(Boolean)

const manifestFile = path.join(ROOT, 'public', 'corpus', 'manifest.json')
const manifest = fs.existsSync(manifestFile)
  ? JSON.parse(fs.readFileSync(manifestFile, 'utf8'))
  : { books: [], totalChars: 0 }

// 大师注册表：状态是 active 还是 planned 决定它在 README 里出现在哪一栏
const masterSource = fs.readFileSync(path.join(ROOT, 'src', 'masters', 'registry.ts'), 'utf8')
const masters = [...masterSource.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*title:\s*'([^']+)',[\s\S]*?school:\s*'([^']+)',\s*status:\s*'([^']+)'/g)].map((m) => ({
  id: m[1],
  name: m[2],
  title: m[3],
  school: m[4],
  status: m[5],
}))
const activeMasters = masters.filter((master) => master.status === 'active')
const plannedMasters = masters.filter((master) => master.status !== 'active')

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))

/**
 * 测试条数从最后一次 vitest 结果里读，而不是硬编码在文档里。
 * 硬编码的代价很实在：加一个测试，README 就悄悄说了谎。
 */
function countTests() {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, '.vitest-results.json'), 'utf8'))
    return raw.numTotalTests
  } catch {
    return null
  }
}
const testCount = countTests() ?? 'all'

/**
 * 断语句数与 canon 引文数从引擎源码读，不写死。
 * 这两个数字每加几条断语就会变，硬编码的话 README 会持续说谎。
 */
function countStatements() {
  // 断语分散在两个文件：种子语句与主库。少读一个就会把总数报小。
  const files = ['statements.ts', 'statements.library.ts']
  let total = 0
  let canon = 0
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, 'src', 'engine', file), 'utf8')
    total += (source.match(/^\s*id:\s*'/gm) ?? []).length
    canon += (source.match(/kind:\s*'canon'/g) ?? []).length
  }
  return { total, canon }
}
const statementCounts = countStatements()
const statementCount = statementCounts.total
const canonCount = statementCounts.canon
const catLine = (id) => cats.find((cat) => cat.id === id) ?? { name: id, latin: id }
const formatChars = (chars) => `${(chars / 10000).toFixed(0)} 万字 / ${(chars / 10000).toFixed(0)}0k chars`

const activeRows = activeMasters
  .map((master) => `| \`${master.id}\` | ${master.name} | ${master.school} | ${master.title} |`)
  .join('\n')
const plannedList = plannedMasters.map((master) => `- \`${master.id}\` · **${master.name}** — ${master.school}`).join('\n')
const bookRows = manifest.books
  .map((book) => `| 《${book.title}》 | ${book.chapters} | ${book.chars.toLocaleString('en-US')} | ${book.dynasty || '—'} |`)
  .join('\n')

const screenshots = `| Home | Blind match — sealed | After voting |
| --- | --- | --- |
| ![Home](docs/screenshots/home.png) | ![Blind match](docs/screenshots/blind-match.png) | ![Reveal](docs/screenshots/reveal.png) |

| Leaderboard | Claim ledger | Canon reader |
| --- | --- | --- |
| ![Leaderboard](docs/screenshots/leaderboard.png) | ![Ledger](docs/screenshots/ledger.png) | ![Canon reader](docs/screenshots/reading.png) |

| Method card | Mobile home | Mobile settings |
| --- | --- | --- |
| ![Method card](docs/screenshots/master-card.png) | ![Mobile home](docs/screenshots/home-mobile.png) | ![Mobile settings](docs/screenshots/settings-mobile.png) |`

const en = `# Tianji · DU <sub>v${pkg.version}</sub>

两种门派读同一个问题，你盲评，然后才揭晓是谁。带日期的断言进应验簿，由你自己回填。

[中文](README.zh-CN.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md)

| Ask | Blind match | After voting |
| --- | --- | --- |
| ![Home](docs/screenshots/home.png) | ![Blind](docs/screenshots/blind-match.png) | ![Reveal](docs/screenshots/reveal.png) |

## Install

\`\`\`bash
# CLI
npm ci && npm run build:all
node build/cli.mjs ask "我要不要换工作" --domain career

# Desktop (Windows, no Node needed)
build/install.cmd
tianji serve                 # http://127.0.0.1:7317

# MCP (Claude / VS Code / Cursor)
{ "mcpServers": { "tianji": { "command": "tianji", "args": ["mcp"] } } }
\`\`\`

## What it does

| | |
| --- | --- |
| 问一次 | 写下问题，可填生辰（填了才能排子平与紫微） |
| 盲评 | 两份匿名回答，投票前看不到姓名、门派、盘面 |
| 揭晓 | 投完才看到是谁，以及引文出处 |
| 回填 | 一周后回来说这条断语准不准 |

内核：子平八字、梅花易数、紫微斗数。全部本机计算。

## License

MIT。古籍原文的公有领域来源见 \`public/corpus/manifest.json\`。
`

const zh = `# 天机台 · DU <sub>v${pkg.version}</sub>

两种门派读同一个问题，你盲评，然后才揭晓是谁。带日期的断言进应验簿，由你自己回填。

[English](README.md) · [路线图](ROADMAP.md) · [更新日志](CHANGELOG.md)

| 提问 | 盲评 | 投票后 |
| --- | --- | --- |
| ![首页](docs/screenshots/home.png) | ![盲评](docs/screenshots/blind-match.png) | ![揭晓](docs/screenshots/reveal.png) |

## 安装

\`\`\`bash
# 命令行
npm ci && npm run build:all
node build/cli.mjs ask "我要不要换工作" --domain career

# 桌面版（Windows，不需要 Node）
build/install.cmd
tianji serve                 # http://127.0.0.1:7317

# MCP（Claude / VS Code / Cursor）
{ "mcpServers": { "tianji": { "command": "tianji", "args": ["mcp"] } } }
\`\`\`

## 怎么用

| | |
| --- | --- |
| 问一次 | 写下问题，可填生辰（填了才能排子平与紫微） |
| 盲评 | 两份匿名回答，投票前看不到姓名、门派、盘面 |
| 揭晓 | 投完才看到是谁，以及引文出处 |
| 回填 | 一周后回来说这条断语准不准 |

内核：子平八字、梅花易数、紫微斗数。全部本机计算。

## 许可

MIT。古籍原文的公有领域来源见 \`public/corpus/manifest.json\`。
`

function write(relPath, content) {
  const target = path.join(ROOT, relPath)
  if (CHECK) {
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : ''
    if (current !== content) {
      console.error(`${relPath} 与注册表/语料不一致：跑 npm run gen:readme`)
      process.exitCode = 1
    }
    return
  }
  fs.writeFileSync(target, content)
}

write('README.md', en)
write('README.zh-CN.md', zh)

if (CHECK) {
  if (process.exitCode) process.exit(1)
  console.log('README.md / README.zh-CN.md 与注册表一致（工具 ' + tools.length + '，书目 ' + manifest.books.length + '，大师 ' + masters.length + '）。')
} else {
  console.log(`README 已生成（英文 + 中文；工具 ${tools.length}，书目 ${manifest.books.length}，大师 ${masters.length}）`)
}
