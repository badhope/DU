#!/usr/bin/env node
/**
 * 玄枢 v1.0.0 · 观形 illustration 生成器
 *
 * 读 src/modules/guanxiang/logic/illustration-specs.ts
 * 输出 26 个占位 SVG 到 src/static/illustrations/
 * + manifest.json 索引
 *
 * 幂等：二次运行检查 hash 一致则跳过。
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SPEC_FILE = join(ROOT, 'src/modules/guanxiang/logic/illustration-specs.ts')
const OUT_DIR = join(ROOT, 'src/static/illustrations')
const MANIFEST = join(OUT_DIR, 'manifest.json')

// ---- 1) 解析 spec 文件（简单 regex）----
const src = readFileSync(SPEC_FILE, 'utf8')
// ILLUSTRATION_SPECS: IllustrationSpec[] = [ ... ]  or  = [ ... ] as const
const arrMatch = src.match(/ILLUSTRATION_SPECS[\s\S]*?=\s*\[([\s\S]*?)\]\s*(?:as const)?\s*$|ILLUSTRATION_SPECS[\s\S]*?=\s*\[([\s\S]*?)\]\s*(?:as const)?/)
if (!arrMatch) {
  console.error('❌ 找不到 ILLUSTRATION_SPECS 数组')
  process.exit(1)
}
const arrBody = arrMatch[1] ?? arrMatch[2]
if (!arrBody || arrBody.length === 0) {
  console.error('❌ 匹配到的数组体为空')
  process.exit(1)
}

const specs = []
// 手工跟踪 brace depth，跳过嵌套对象（size/position 内的 { w, h }）
{
  let i = 0
  while (i < arrBody.length) {
    if (arrBody[i] !== '{') {
      i++
      continue
    }
    const start = i
    let depth = 0
    let end = -1
    while (i < arrBody.length) {
      const c = arrBody[i]
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) {
          end = i
          break
        }
      }
      i++
    }
    if (end < 0) break
    const obj = arrBody.slice(start, end + 1)
    // 只取顶层带 id + name 的 spec
    if (obj.includes('id:') && obj.includes('name:') && obj.includes('category:')) {
      const id = obj.match(/id:\s*'([^']+)'/)?.[1]
      const name = obj.match(/name:\s*'([^']+)'/)?.[1]
      const category = obj.match(/category:\s*'([^']+)'/)?.[1]
      const style = obj.match(/style:\s*'([^']+)'/)?.[1]
      const w = Number(obj.match(/w:\s*(\d+)/)?.[1] ?? 100)
      const h = Number(obj.match(/h:\s*(\d+)/)?.[1] ?? 100)
      if (id && name) specs.push({ id, name, category, style, w, h })
    }
    i++
  }
}

if (specs.length !== 28) {
  console.error(`❌ 期望 28 spec，实际 ${specs.length}`)
  process.exit(1)
}

// ---- 2) 生成 SVG ----
const FILL = '#1F1F2B'
const STROKE = '#D4AF37'
const FILL_FG = '#F5F1E8'

function genSvg({ name, w, h, style }) {
  if (style === 'icon') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="${FILL}" stroke="${STROKE}" stroke-width="2" rx="8"/>
  <text x="${w / 2}" y="${h / 2 + 6}" text-anchor="middle" fill="${STROKE}" font-size="14" font-family="serif">${name}</text>
</svg>
`
  }
  if (style === 'line') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="none" stroke="${STROKE}" stroke-width="1" opacity="0.5"/>
  <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 4}" fill="none" stroke="${STROKE}" stroke-width="1.5"/>
  <text x="${w / 2}" y="${h - 12}" text-anchor="middle" fill="${STROKE}" font-size="12" font-family="serif" opacity="0.7">${name}</text>
</svg>
`
  }
  // block
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect x="8" y="8" width="${w - 16}" height="${h - 16}" fill="${FILL}" stroke="${STROKE}" stroke-width="1.5" rx="4"/>
  <text x="${w / 2}" y="${h / 2 + 5}" text-anchor="middle" fill="${FILL_FG}" font-size="13" font-family="serif">${name}</text>
</svg>
`
}

mkdirSync(OUT_DIR, { recursive: true })

let generated = 0
let skipped = 0
for (const s of specs) {
  const file = join(OUT_DIR, `${s.id}.svg`)
  const content = genSvg(s)
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 16)

  if (existsSync(file)) {
    const old = readFileSync(file, 'utf8')
    const oldHash = createHash('sha256').update(old).digest('hex').slice(0, 16)
    if (oldHash === hash) {
      skipped++
      continue
    }
  }
  writeFileSync(file, content, 'utf8')
  generated++
}

// ---- 3) 写 manifest ----
const manifest = {
  generated: new Date().toISOString(),
  count: specs.length,
  specs: specs.map((s) => ({ id: s.id, name: s.name, file: `${s.id}.svg`, category: s.category })),
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8')

console.log(`✅ 生成 ${generated} 个新 SVG，跳过 ${skipped} 个已存在，共 ${specs.length} 个`)
console.log(`   输出目录: ${OUT_DIR}`)
console.log(`   manifest: ${MANIFEST}`)

// 输出大小
if (existsSync(OUT_DIR)) {
  const stat = statSync(OUT_DIR)
  console.log(`   目录大小: ${(stat.size / 1024).toFixed(1)} KB（仅参考）`)
}
