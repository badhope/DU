#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CHECK = process.argv.includes('--check')
const registry = fs.readFileSync(path.join(ROOT, 'src', 'tools', 'registry.ts'), 'utf8')
const cats = [...registry.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*latin:\s*'([^']+)'/g)].map((m) => ({ id: m[1], name: m[2], latin: m[3] }))
const imported = [...registry.matchAll(/import\s*\{\s*(\w+)\s*\}\s*from\s*'\.\/(\w+)'/g)].map((m) => m[1])
const camelToKebab = (name) => name.replace(/Tool$/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const tools = imported.map((name) => {
  const file = path.join(ROOT, 'src', 'tools', `${camelToKebab(name)}.ts`)
  if (!fs.existsSync(file)) return null
  const source = fs.readFileSync(file, 'utf8')
  const pick = (pattern) => pattern.exec(source)?.[1]
  return { id: pick(/id:\s*'([^']+)'/), name: pick(/name:\s*'([^']+)'/), category: pick(/category:\s*'([^']+)'/), blurb: pick(/blurb:\s*'([^']+)'/) }
}).filter(Boolean)
const corpusFile = path.join(ROOT, 'public', 'corpus', 'manifest.json')
const manifest = fs.existsSync(corpusFile) ? JSON.parse(fs.readFileSync(corpusFile, 'utf8')) : { books: [], totalChars: 0 }
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const catLine = (id) => cats.find((cat) => cat.id === id) ?? { name: id, latin: id }
const toolRows = tools.map((tool) => `| \`${tool.id}\` | ${tool.name} | ${catLine(tool.category).name} ${catLine(tool.category).latin} | ${tool.blurb} |`).join('\n')
const bookRows = manifest.books.map((book) => `- 《${book.title}》 ${book.chapters} 章 · ${book.chars.toLocaleString('en-US')} 字${book.dynasty ? ` · ${book.dynasty}` : ''} · ${book.license}`).join('\n')

const md = `# 天机台 · DU（v${pkg.version}）

**玄学大师测评平台**：同一问题，请两位大师各断一遍；先匿名盲评，再看门派与模型。确定性排盘负责事实，古籍负责可核材料，模型只负责演绎，准不准由你的投票和后续应验记录决定。

纯静态部署，无后端。输入与测评数据默认只留在浏览器；模型接入采用 BYOK，Key 默认只存当前会话。部署目标：GitHub Pages / Cloudflare Pages，同一份构建产物。

## 核心流程

1. **问天**：输入问题，可补充公历出生日期和时间。
2. **双师盲测**：当前首版启用子平八字与梅花易数两位大师；模型不可用时自动离线降级。
3. **投票与榜单**：先看甲/乙回答，再投票；本机 Elo 从 1500 起算，至少 5 场才进入“在榜”。
4. **应验簿**：回答中的带日期可判定断言可逐条回填“应验/未验/无法判断”。

## 兼容工具入口（${tools.length} 个）

| id | 名称 | 分类 | 一句话 |
| --- | --- | --- | --- |
${toolRows}

> 该入口用于保留旧版梅花排盘体验；平台主流程从 \`/ask\` 开始，榜单和应验簿分别位于 \`/leaderboard\`、\`/ledger\`。

## 大师方法卡

首版有 2 位大师进入盲测，另有 4 位公开方法卡但状态为筹备中。紫微、奇门、六壬和相法必须补齐边界规则、外部原例与回归测试后才会进入可测评状态；不拿旧代码冒充已验证算法。

详见 [定位诊断](docs/POSITIONING.md)、[大师方法卡](docs/MASTERS.md) 和 [技术架构](docs/ARCHITECTURE.md)。

## 典籍阅览室（${manifest.books.length} 部 · ${Math.round(manifest.totalChars / 10000)} 万字）

每条 canon 引文都应能在站内分发语料中逐字核对；模型引用查不到时显示“未核”，不会静默当作出处。

${bookRows}

原文取自维基文库公版书（繁体），检索时按需做繁简归一，因此首屏不背 opencc 的体积。

## 透明与边界

- 共鸣引擎保留 \`require\` 硬门槛、baseRate 与负面行动建议；高基率泛谈会明示适用范围。
- 事实层与模型演绎分离：模型不能改写四柱、卦名、动爻或体用字段。
- 不提供医疗、法律、投资建议；不预测死亡和重病；不使用恐吓式话术；不做人脸识别。
- 榜单是本机样本记录，不是科学证明或全局排名；没有数据就显示“尚无样本”。

## 开发

\`\`\`bash
npm ci
npm run dev
npm run check
\`\`\`

\`npm run check\` 会依次执行 typecheck、Vitest、引文门禁、README 一致性检查与生产 build。梅花内核测试使用《梅花易数》观梅占、牡丹占原例；新平台另有八字、评分、盲测幂等和 AI prompt 契约测试。
`

const target = path.join(ROOT, 'README.md')
if (CHECK) {
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : ''
  if (current !== md) {
    console.error('README.md 与注册表/语料不一致：跑 npm run gen:readme')
    process.exit(1)
  }
  console.log('README 与注册表一致。')
} else {
  fs.writeFileSync(target, md)
  console.log(`README.md 已生成（工具 ${tools.length}，书目 ${manifest.books.length}）`)
}
