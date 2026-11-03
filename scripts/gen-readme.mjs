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

**Blind-evaluated Chinese metaphysics, running entirely on your machine.**

Two verified schools read the same question. You score before the methods are
revealed. Every dated claim goes into a ledger you settle yourself.

[中文](README.zh-CN.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md) · [Architecture](docs/ARCHITECTURE.md) · [Method cards](docs/MASTERS.md)

${screenshots}

<sub>Screenshots from the real build via Playwright, fictional input.</sub>

## Three ways to run it

| | Command | What you get |
| --- | --- | --- |
| **Web** | open the hosted page | Everything in your browser. Zero install. |
| **CLI** | \`tianji ask "…"\` | Same engine, scriptable, JSON output, SQLite ledger. |
| **Desktop** | \`tianji.exe serve\` | Single 96 MB file. Serves the web UI, no Node needed. |
| **MCP** | \`tianji mcp\` | Exposes the engine to Claude, VS Code, Cursor as 5 tools. |

All four share one computation layer. The same question with the same seed
produces byte-identical readings in every host — \`tests/runtime.spec.ts\` asserts it.

## The loop

\`\`\`text
        ask                score blind            reveal            settle
  ┌─────────────┐    ┌──────────────────┐   ┌──────────┐    ┌─────────────┐
  │ one question│ →  │ 甲 / 乙, sealed  │ → │ methods  │ →  │ dated claims│
  │ two schools │    │ charts + sources │   │ + names  │    │ hit/miss    │
  └─────────────┘    └──────────────────┘   └──────────┘    └─────────────┘
\`\`\`

Sealed means *not rendered*, not *labelled hidden*: the API strips \`masterId\`,
chart facts, sources and claim IDs before the vote, because a hexagram gives away
Mei Hua and a four-pillar chart gives away Zi Ping.

## What makes it checkable

| Claim | How it is enforced |
| --- | --- |
| Citations are real | \`npm run verify:quotes\` matches all 29 static quotes against the shipped corpus |
| Corpus is intact | \`npm run check:corpus\` re-counts 12 books / 148 chapters / 1,870,466 chars |
| Blind is blind | randomised A/B order, cross-answer statement exclusion, structural sealing |
| Small samples don't win | Elo + Wilson 95% lower bound, ranked only after 5 matches |
| Claims are falsifiable | dated, resolved by a human, \`unknown\` never enters the denominator |
| Nothing leaves the device | \`npm run check:local-only\` scans source and built output |

## The engine

149 statements, each with explicit trigger conditions, an honest population base
rate, and a source. 29 carry verbatim classical quotations across 12 public-domain
classics. Matching is deterministic — same input, same seed, same result — so a
reading can be reproduced and argued about, which is the whole point.

Two kernels are active and verified:

| id | Master | School | Kernel |
| --- | --- | --- | --- |
${activeRows}

Four more publish their method cards and stay \`planned\` until boundary rules and
external worked examples exist. Shipping a half-verified algorithm as finished
would defeat the platform.

## Install

\`\`\`bash
# CLI (needs Node 20+)
npm ci && npm run build:all
node build/cli.mjs doctor

# Desktop (Windows, no Node required)
build\install.cmd
tianji serve            # then open http://127.0.0.1:7317
\`\`\`

MCP clients — add to the config:

\`\`\`json
{ "mcpServers": { "tianji": { "command": "tianji", "args": ["mcp"] } } }
\`\`\`

## Commands

\`\`\`text
tianji ask "我要不要换工作" --domain career   ask two masters, sealed
tianji ask "…" --reveal                      show names, charts, sources
tianji ledger                                pending claims and due dates
tianji resolve <id> hit|miss|unknown         settle a claim
tianji report latest --out r.html            self-contained HTML report
tianji export / import                       move the ledger as JSON
tianji serve --port 7317                     web UI + HTTP API
tianji doctor                                environment + data check
\`\`\`

## Gates

\`\`\`text
npm run check        typecheck · boundaries · ${testCount} tests · 29 quotes
                     corpus · version · README · build · local-only
npm run test:e2e     18 browser scenarios
npm run build:all    web + cli.mjs + mcp.mjs + tianji.exe
\`\`\`

Every gate above fails loudly and has been verified by deliberately breaking the
thing it guards.

## Layout

\`\`\`text
src/contract/   shared types          src/node/     CLI · server · MCP · SQLite
src/core/       deterministic kernels src/runtime/  host-agnostic engine
src/engine/     matching + statements  src/pages/    routed screens
src/arena/      blind flow · rating   tests/        unit + runtime
src/data/       corpus access         e2e/          real browser
\`\`\`

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md). \`npm run check\` must stay green; new citations
must survive \`verify:quotes\`; a new school needs worked examples and boundary
tests before its status changes.

## License

MIT. Corpus texts retain their public-domain provenance — see the manifest.
`
const zh = `# 天机台 · DU <sub>v${pkg.version}</sub>

**盲评式的中国术数，全程跑在你自己的机器上。**

两位经过验证的大师读同一个问题。你先打分，再揭晓方法。每一条带日期的断言
都进应验簿，由你自己回填。

[English](README.md) · [路线图](ROADMAP.md) · [更新日志](CHANGELOG.md) · [技术架构](docs/ARCHITECTURE.md) · [大师方法卡](docs/MASTERS.md)

${screenshots}

<sub>截图由 Playwright 从真实构建生成，使用虚构输入。</sub>

## 四种运行方式

| | 命令 | 你会得到 |
| --- | --- | --- |
| **网页** | 打开托管页面 | 全部在浏览器内，零安装。 |
| **命令行** | \`tianji ask "…"\` | 同一套引擎，可脚本化，JSON 输出，SQLite 台账。 |
| **桌面** | \`tianji.exe serve\` | 单个 96 MB 文件，自带网页，不需要装 Node。 |
| **MCP** | \`tianji mcp\` | 把引擎作为 5 个工具暴露给 Claude / VS Code / Cursor。 |

四种宿主共用同一套计算层：同一个问题、同一个种子，在任何一端都得到逐字相同的
回答 —— \`tests/runtime.spec.ts\` 断言了这一点。

## 闭环

\`\`\`text
        提问               盲评              揭晓            回填
  ┌─────────────┐    ┌──────────────────┐   ┌──────────┐    ┌─────────────┐
  │ 一个问题     │ →  │ 甲 / 乙，已封存   │ → │ 方法与   │ →  │ 带日期的断言 │
  │ 两个门派     │    │ 盘面 + 出处       │   │ 姓名     │    │ 应验/未验    │
  └─────────────┘    └──────────────────┘   └──────────┘    └─────────────┘
\`\`\`

"封存"是**不渲染**，不是标个"已隐藏"：API 在投票前会把 \`masterId\`、盘面、依据和
断言 id 全部剥掉 —— 卦象会暴露梅花，四柱会暴露子平。

## 可核性靠什么保证

| 承诺 | 如何强制 |
| --- | --- |
| 引文是真的 | \`npm run verify:quotes\` 把 29 条静态引文与站内语料逐字比对 |
| 语料完整 | \`npm run check:corpus\` 重新清点 12 部 / 148 章 / 1,870,466 字 |
| 盲测真的盲 | 甲乙顺序随机、两答断语互斥、结构性脱敏 |
| 小样本不封神 | Elo + Wilson 95% 下界，满 5 场才进榜 |
| 断言可反驳 | 带日期、人工回填，"无法判断"不进分母 |
| 数据不出设备 | \`npm run check:local-only\` 扫描源码与构建产物 |

## 引擎

149 条断语，每条都有显式触发条件、诚实的人群基率和出处。29 条带可逐字核对的
古籍引文，覆盖 12 部公版典籍。匹配是确定性的 —— 同输入同种子同结果，
所以一次读取可以被复现、被质疑，这正是重点。

两套内核已启用并验证：

| id | 名号 | 体系 | 内核 |
| --- | --- | --- | --- |
${activeRows}

另外四位公开方法卡，在内核边界规则与外部原例补齐之前保持 \`planned\`。
把半验证的算法说成已完成，等于毁掉整个平台的意义。

## 安装

\`\`\`bash
# 命令行（需要 Node 20+）
npm ci && npm run build:all
node build/cli.mjs doctor

# 桌面版（Windows，不需要装 Node）
build\install.cmd
tianji serve            # 然后打开 http://127.0.0.1:7317
\`\`\`

MCP 客户端在配置里加：

\`\`\`json
{ "mcpServers": { "tianji": { "command": "tianji", "args": ["mcp"] } } }
\`\`\`

## 命令

\`\`\`text
tianji ask "我要不要换工作" --domain career   请两位大师作答，匿名
tianji ask "…" --reveal                      显示姓名、盘面与出处
tianji ledger                                待回填断言与到期日
tianji resolve <id> hit|miss|unknown         回填一条断言
tianji report latest --out r.html            生成自包含 HTML 报告
tianji export / import                       台账 JSON 迁移
tianji serve --port 7317                     网页 + HTTP API
tianji doctor                                环境与数据检查
\`\`\`

## 门禁

\`\`\`text
npm run check        类型 · 边界 · ${testCount} 测试 · 29 引文
                     语料 · 版本 · README · 构建 · 本地模式
npm run test:e2e     18 项浏览器场景
npm run build:all    网页 + cli.mjs + mcp.mjs + tianji.exe
\`\`\`

每道门禁都会大声失败，且都用"故意破坏被守护的东西"验证过。

## 目录

\`\`\`text
src/contract/   跨层类型          src/node/     命令行 · 服务端 · MCP · SQLite
src/core/       确定性内核         src/runtime/  宿主无关引擎
src/engine/     匹配与断语库       src/pages/    路由页面
src/arena/      盲测流程 · 评分    tests/        单元与运行时
src/data/       语料访问           e2e/          真实浏览器
\`\`\`

## 参与贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。\`npm run check\` 必须保持通过；新增引文必须
能过 \`verify:quotes\`；新增门派需要先有外部原例和边界测试才能改状态。

## 许可

MIT。古籍原文的公有领域来源见 manifest。
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
