#!/usr/bin/env node
/**
 * DU v2 · 语料同步
 *
 * 把 ../du-corpus 的成书 JSON、检索索引与派生数据拷进 public/corpus/，
 * 并生成 manifest.json（书名、篇章、字数、许可证）。
 *
 * 为什么放 public 而不打包：成书正文约 5.3MB，
 * 打进 bundle 会让首页白屏；放 public 由阅览室按需 fetch，
 * 引擎只依赖已经编译进包的断语，离线也能出结果。
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = process.argv[2] ?? '../du-corpus'
const OUT = join(process.cwd(), 'public', 'corpus')

if (!existsSync(SRC)) {
  console.error(`找不到语料源目录 ${SRC}；先跑 du-corpus 的抓取脚本。`)
  process.exit(1)
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(join(OUT, 'books'), { recursive: true })
mkdirSync(join(OUT, 'derived'), { recursive: true })

// 故意不分发 indexes/：那批 MiniSearch 索引只含每章前 1 万字（全库 31.7%），
// 且默认空格分词对中文无效。阅览室改走运行时子串匹配，留着只会误导。
for (const dir of ['books', 'derived'])
  for (const f of readdirSync(join(SRC, dir)))
    if (f.endsWith('.json')) cpSync(join(SRC, dir, f), join(OUT, dir, f))

/** 分卷书合并成一个逻辑书目：sanming-tonghui.part1/part2 → 一部书 */
const books = new Map()
for (const f of readdirSync(join(OUT, 'books')).sort()) {
  if (f.includes('.index.')) continue
  const b = JSON.parse(readFileSync(join(OUT, 'books', f), 'utf8'))
  const entry = books.get(b.id) ?? {
    id: b.id,
    title: b.title,
    author: b.author ?? '佚名',
    dynasty: b.dynasty ?? '',
    license: b.license ?? '公版',
    files: [],
    chapters: 0,
    chars: 0,
  }
  // 篇章 id 在分卷之间会重复，阅览室一律用 file + chapter 两级寻址
  entry.files.push({
    file: f,
    chapters: b.chapters.map((c) => ({ id: c.id, title: c.title, chars: [...c.text].length })),
  })
  entry.chapters += b.chapters.length
  entry.chars += b.chapters.reduce((a, c) => a + [...c.text].length, 0)
  books.set(b.id, entry)
}

const manifest = {
  generatedFrom: '维基文库（zh.wikisource.org）原文，繁简转换在浏览器端按需完成',
  books: [...books.values()].sort((a, b) => b.chars - a.chars),
  totalChars: [...books.values()].reduce((a, b) => a + b.chars, 0),
  derived: ['zhouyi.json', 'jiri-activities.json'],
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1))

console.log(`书目 ${manifest.books.length} 部，共 ${manifest.totalChars.toLocaleString()} 字`)
for (const b of manifest.books)
  console.log(
    `  ${b.title.padEnd(10, '　')} ${String(b.chapters).padStart(3)}章 ${b.chars.toLocaleString().padStart(9)}字  ${b.files.map((x) => x.file).join('+')}`,
  )
