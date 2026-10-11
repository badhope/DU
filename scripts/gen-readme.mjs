#!/usr/bin/env node
/**
 * README 生成器
 *
 * v1 的 README 写"49 个工具"，代码里只有 43 个，没人发现——
 * 因为 README 是手写的。这里改成从注册表与语料 manifest 生成：
 * 加一个工具、下一部书，文档自己跟着变；对不上就是 CI 红。
 *
 * 用法：node scripts/gen-readme.mjs（--check 只比较不写，供 CI 用）
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CHECK = process.argv.includes('--check')

/** 只读注册表源码，避免为了生成文档去跑一次构建 */
const registry = fs.readFileSync(path.join(ROOT, 'src', 'tools', 'registry.ts'), 'utf8')
const cats = [...registry.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*latin:\s*'([^']+)'/g)].map(
  (m) => ({ id: m[1], name: m[2], latin: m[3] }),
)
const imported = [...registry.matchAll(/import\s*\{\s*(\w+)\s*\}\s*from\s*'\.\/(\w+)'/g)].map(
  (m) => m[1],
)
const tools = imported
  .map((name) => {
    const file = path.join(ROOT, 'src', 'tools', `${camelToKebab(name)}.ts`)
    if (!fs.existsSync(file)) return null
    const src = fs.readFileSync(file, 'utf8')
    const pick = (re) => re.exec(src)?.[1]
    return {
      id: pick(/id:\s*'([^']+)'/),
      name: pick(/name:\s*'([^']+)'/),
      latin: pick(/latin:\s*'([^']+)'/),
      category: pick(/category:\s*'([^']+)'/),
      blurb: pick(/blurb:\s*'([^']+)'/),
    }
  })
  .filter(Boolean)

function camelToKebab(n) {
  // meihuaTool → meihua
  return n.replace(/Tool$/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

const corpusFile = path.join(ROOT, 'public', 'corpus', 'manifest.json')
const manifest = fs.existsSync(corpusFile)
  ? JSON.parse(fs.readFileSync(corpusFile, 'utf8'))
  : { books: [], totalChars: 0 }

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))

const catLine = (id) => cats.find((c) => c.id === id) ?? { name: id, latin: id }

const md = `# DU · 渡（v${pkg.version}）

纯前端的传统数术游乐站。**没有后端**——所有计算都在你的浏览器里跑，输入不上传，
学习记录只存在本机 localStorage，页面上有清除按钮。

部署目标：GitHub Pages / Cloudflare Pages，同一份构建产物。

## 工具（${tools.length} 个，由注册表生成）

| id | 名称 | 分类 | 一句话 |
| --- | --- | --- | --- |
${tools
  .map(
    (t) =>
      `| \`${t.id}\` | ${t.name} | ${catLine(t.category).name} ${catLine(t.category).latin} | ${t.blurb} |`,
  )
  .join('\n')}

分类：${cats.map((c) => `${c.name}（${c.latin}）`).join(' · ')}

> 本表由 \`scripts/gen-readme.mjs\` 从 \`src/tools/registry.ts\` 生成，
> 手写工具清单会被 CI 拦下（v1 就栽在文档漂移上）。

## 典籍阅览室（${manifest.books.length} 部 · ${Math.round(manifest.totalChars / 10000)} 万字）

断语里出现的每一句原文，都能在站内这些书里逐字搜到；搜到就给出章节，搜不到就明说搜不到。

${manifest.books
  .map((b) => `- 《${b.title}》 ${b.chapters} 章 · ${b.chars.toLocaleString('en-US')} 字${b.dynasty ? ` · ${b.dynasty}` : ''} · ${b.license}`)
  .join('\n')}

原文取自维基文库公版书（繁体），检索时按需做繁简归一，因此首屏不背 opencc 的体积。

## 关于"说中"这件事

本站的共鸣引擎是公开机制，不是玄学：

- 每条断语必须先通过 \`require\` 硬闸（你的输入真的含有对应特征）才会入选，
  打分只能排序，不能把不相关的条目挤进来。
- 每条都标出"人群天然适用"的比例——巴纳姆效应（Forer 1948：同一份星座评语，
  39 名学生平均打 4.26/5 觉得"说得极准"）在站上是**被展示的数值**，不是被利用的漏洞。
- 单次输出最多一条泛谈；不用吓人的话换你的点击。
- 引擎学到的一切来自你点过的"说中/没有"，就在本机，可清。

引文门禁：\`npm run verify:quotes\` 会拿每条 canon 引文去**站内实际分发的那本书**里逐字比对，
编造引文或书名对不上（需 \`src/data/book-aliases.json\` 显式别名）直接让 CI 变红。

## 开发

\`\`\`bash
npm ci
npm run corpus    # 从 ../du-corpus 同步书籍与派生数据到 public/corpus
npm run dev
npm run check     # typecheck + vitest + 引文门禁 + build，CI 跑的就是这条
\`\`\`

单测里钉住内核验算：梅花起卦对得上《梅花易数》书里的两例原案（观梅占、牡丹占），
卦名、动爻、互变卦、体用关系逐项钉死——算法错一处就红。
`

const target = path.join(ROOT, 'README.md')
if (CHECK) {
  const cur = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : ''
  if (cur !== md) {
    console.error('README.md 与注册表/语料不一致：跑 npm run gen:readme')
    process.exit(1)
  }
  console.log('README 与注册表一致。')
} else {
  fs.writeFileSync(target, md)
  console.log(`README.md 已生成（工具 ${tools.length}，书目 ${manifest.books.length}）`)
}
