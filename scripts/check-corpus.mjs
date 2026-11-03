#!/usr/bin/env node
/**
 * 语料完整性门禁
 *
 * manifest.json 声称每部书有多少章、多少字，并根据这些数字生成 README 与界面。
 * 但此前没有任何东西验证"声称的数字"与"实际分发的 JSON"一致 —— 一次失败的
 * 同步、一个被截断的文件、或者手工改过 manifest，都不会被发现，而界面上
 * 依然会显示"187 万字"。
 *
 * 这条门禁做三件事：
 *  1. manifest 里列的每个文件都存在且能解析；
 *  2. 每个文件的章节数与 manifest 记录一致，章 id 不重复；
 *  3. 实际正文字数与 manifest 声称的字数偏差在容差内（默认 0.5%）。
 *
 * 为什么用容差而不是精确相等：字数是同步脚本当时的计数口径（是否含标题、空白），
 * 不同版本的抓取脚本可能差几个字符。差 0.5% 以上就不是口径问题，是真丢内容了。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CORPUS = path.join(ROOT, 'public', 'corpus')
const TOLERANCE = Number(process.env.DU_CORPUS_TOLERANCE ?? '0.005')

const errors = []
const warnings = []

const manifestPath = path.join(CORPUS, 'manifest.json')
if (!fs.existsSync(manifestPath)) {
  console.error(`语料门禁失败：找不到 ${path.relative(ROOT, manifestPath)}`)
  process.exit(1)
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

if (!Array.isArray(manifest.books) || !manifest.books.length) {
  console.error('语料门禁失败：manifest 里没有任何书。')
  process.exit(1)
}

let declaredChars = 0
let actualChars = 0
let declaredChapters = 0
let actualChapters = 0

for (const book of manifest.books) {
  const label = `《${book.title}》(${book.id})`

  if (!Array.isArray(book.files) || !book.files.length) {
    errors.push(`${label} 没有 files 条目。`)
    continue
  }

  let bookChars = 0
  let bookChapters = 0
  const seenChapterIds = new Set()

  for (const file of book.files) {
    const filePath = path.join(CORPUS, 'books', file.file)
    if (!fs.existsSync(filePath)) {
      errors.push(`${label} 声明的文件缺失：books/${file.file}`)
      continue
    }

    let payload
    try {
      payload = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (error) {
      errors.push(`${label} 的 books/${file.file} 不是合法 JSON：${(error).message}`)
      continue
    }

    if (!Array.isArray(payload.chapters)) {
      errors.push(`${label} 的 books/${file.file} 没有 chapters 数组。`)
      continue
    }

    // manifest 里 files[].chapters 存的是章节元数据数组（id/title/chars），不是数量
    const declaredInFile = file.chapters
    if (Array.isArray(declaredInFile) && declaredInFile.length !== payload.chapters.length) {
      errors.push(
        `${label} 的 books/${file.file} 声明 ${declaredInFile.length} 章，实际 ${payload.chapters.length} 章。`,
      )
    }

    for (const chapter of payload.chapters) {
      if (!chapter || typeof chapter.id !== 'string' || typeof chapter.text !== 'string') {
        errors.push(`${label} 的 books/${file.file} 里有章节缺少 id 或 text。`)
        continue
      }
      if (seenChapterIds.has(chapter.id)) {
        errors.push(`${label} 里章节 id 重复：${chapter.id}`)
      }
      seenChapterIds.add(chapter.id)
      // 字数口径：正文字符数（不含标题），与同步脚本保持一致
      bookChars += chapter.text.length
      bookChapters += 1
    }
  }

  if (book.chapters !== bookChapters) {
    errors.push(`${label} 声称 ${book.chapters} 章，实际汇总 ${bookChapters} 章。`)
  }

  // 逐书字数偏差
  if (book.chars > 0) {
    const drift = Math.abs(bookChars - book.chars) / book.chars
    if (drift > TOLERANCE) {
      errors.push(
        `${label} 声称 ${book.chars} 字，实际 ${bookChars} 字（偏差 ${(drift * 100).toFixed(2)}%，容差 ${(TOLERANCE * 100).toFixed(1)}%）。`,
      )
    } else if (drift > 0.0005) {
      warnings.push(`${label} 字数偏差 ${(drift * 100).toFixed(3)}%（在容差内）`)
    }
  }

  declaredChars += book.chars
  actualChars += bookChars
  declaredChapters += book.chapters
  actualChapters += bookChapters
}

if (typeof manifest.totalChars === 'number') {
  const drift = Math.abs(actualChars - manifest.totalChars) / manifest.totalChars
  if (drift > TOLERANCE) {
    errors.push(
      `manifest.totalChars 声称 ${manifest.totalChars}，实际汇总 ${actualChars}（偏差 ${(drift * 100).toFixed(2)}%）。`,
    )
  }
}

if (errors.length) {
  console.error('语料完整性门禁失败：')
  for (const error of errors) console.error(`- ${error}`)
  console.error('\n如果是有意改动语料，请更新 manifest.json 里的 chapters/chars/totalChars。')
  process.exit(1)
}

const summary = `${manifest.books.length} 部 · ${declaredChapters} 章 · ${declaredChars.toLocaleString('en-US')} 字`
if (warnings.length) {
  console.log(`语料完整性通过（${summary}），但有 ${warnings.length} 条偏差提示：`)
  for (const warning of warnings) console.log(`- ${warning}`)
} else {
  console.log(`语料完整性通过：${summary}，与 manifest 完全一致。`)
}
