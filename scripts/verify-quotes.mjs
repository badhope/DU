/**
 * 出处校验门禁
 *
 * 硬规则：statements 里每一条 canon 的 quote，必须能在**站内实际分发的那本书**里逐字找到。
 *
 * 这条规则是被我自己的错误逼出来的：写断语时很容易"凭印象"引经据典，
 * 而权威感恰恰来自引文可核。任何编造引文都应让 CI 变红。
 *
 * 上一版这里漏了一个真错：它同时在 raw/（未整理的原始抓取）里找，
 * 于是《黄帝内经》这种引用能靠 raw 的同名前缀过关，而站上分发的其实是
 * 素问、灵枢两个本子 —— 门禁绿了，用户点出处却搜不到。
 * 现在只读 public/corpus（sync-corpus 的产物，也就是要部署的东西），
 * 书名不一致靠 src/data/book-aliases.json 显式别名解决，不做模糊匹配。
 *
 * 用法：npm run corpus && node scripts/verify-quotes.mjs
 *
 * 比对口径：繁简归一 + 去标点后的子串存在；引文含省略号时按段分别核对。
 */
import fs from 'node:fs'
import path from 'node:path'
import { Converter } from 'opencc-js'

const ROOT = path.resolve(import.meta.dirname, '..')
const SHIPPED = process.env.DU_SHIPPED || path.join(ROOT, 'public', 'corpus')
/*
 * 所有会向用户显示 canon 原文的文件都必须在这里。
 * 曾经只有 statement 两个文件，于是 voices.ts 里新加的三条引文
 * 完全逃过校验 —— 那是"看起来有门禁、实际漏了一整块"。
 */
const FILES = [
  'src/engine/statements.ts',
  'src/engine/statements.library.ts',
  'src/engine/voices.ts',
]

const t2s = Converter({ from: 't', to: 'cn' })
const norm = (s) =>
  t2s(s).replace(/[，。、！？；：\s「」『』“”‘’（）《》,.!?;:"'()\[\]…\-—]/g, '')

const { aliases } = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src', 'data', 'book-aliases.json'), 'utf8'),
)

/** 站内部署语料：manifest 说有什么，就只认什么 */
function loadShipped() {
  const mf = path.join(SHIPPED, 'manifest.json')
  if (!fs.existsSync(mf)) {
    console.error(`找不到 ${mf} —— 先跑 npm run corpus（把 ../du-corpus 同步进 public/）`)
    process.exit(2)
  }
  const manifest = JSON.parse(fs.readFileSync(mf, 'utf8'))
  return manifest.books.map((b) => {
    const body = b.files
      .map((f) => {
        const d = JSON.parse(fs.readFileSync(path.join(SHIPPED, 'books', f.file), 'utf8'))
        return (d.chapters ?? []).map((c) => c.text).join('\n')
      })
      .join('\n')
    return { title: b.title, id: b.id, body: norm(body) }
  })
}

/**
 * 抠出 { book, quote } —— 直接扫源码，不依赖构建产物。
 *
 * 支持两种写法：
 *   1. 对象字面量：kind: 'canon', book: '...', quote: '...'
 *   2. 扁平记录（voices.ts 的 CITATIONS）：book:'...' 与 quote:'...' 相邻出现
 * 第二种同样会渲染给用户，漏掉它就等于留了个后门。
 */
function collectCanon(src) {
  const out = []
  // 写法 1：块内出现 kind:'canon'
  const block = /kind:\s*'canon'([\s\S]*?)\}/g
  let m
  while ((m = block.exec(src))) {
    const seg = m[1]
    const book = /book:\s*'([^']+)'/.exec(seg)?.[1]
    const quote = /quote:\s*'([^']+)'/.exec(seg)?.[1]
    if (book && quote) out.push({ book, quote })
  }
  // 写法 2：book 与 quote 在同一个对象里相邻（24 行内），且不含 kind 标记
  const flat = /book:\s*'([^']+)'[\s\S]{0,300}?quote:\s*'([^']+)'/g
  let n
  while ((n = flat.exec(src))) {
    const pair = { book: n[1], quote: n[2] }
    if (!out.some((o) => o.book === pair.book && o.quote === pair.quote)) out.push(pair)
  }
  return out
}

const shipped = loadShipped()
const byTitle = new Map(shipped.map((b) => [b.title, b]))

let total = 0
const bad = []
for (const rel of FILES) {
  const file = path.join(ROOT, rel)
  if (!fs.existsSync(file)) continue
  for (const { book, quote } of collectCanon(fs.readFileSync(file, 'utf8'))) {
    total++
    const titles = aliases[book] ?? [book]
    const targets = titles.map((t) => byTitle.get(t)).filter(Boolean)
    if (!targets.length) {
      bad.push({
        book,
        quote,
        why: `站内没有《${book}》：未分发，也没在 src/data/book-aliases.json 里给别名`,
      })
      continue
    }
    const parts = quote.split(/…+|\.{3,}/).map(norm).filter(Boolean)
    const missing = parts.filter((p) => !targets.some((t) => t.body.includes(p)))
    if (missing.length) {
      bad.push({
        book,
        quote,
        why: `在 ${targets.map((t) => `《${t.title}》`).join('/')} 里找不到：${missing.join(' / ')}`,
      })
    }
  }
}

console.log(`校验 canon 引文 ${total} 条（站内 ${shipped.length} 部书）`)
if (bad.length) {
  for (const b of bad) console.error(`✗ ${b.book} — ${b.quote}\n   ${b.why}`)
  console.error(`\n失败 ${bad.length} 条：要么补齐语料/别名，要么把该条改成 kind:'observation'。`)
  process.exit(1)
}
console.log('全部可核。')
