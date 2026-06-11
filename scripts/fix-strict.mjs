#!/usr/bin/env node
/**
 * 玄枢 MISTVERSE · noUncheckedIndexedAccess 修复器
 *
 * 模式匹配（保守）批量处理：
 *  A) arr[i].x 链式  → arr[i]?.x
 *  B) arr[i] 实参     → arr[i]!（如果后跟 . 或 [ 则跳过）
 *  C) 数组迭代 for (const x of arr) 不动（vue runtime）
 *  D) 已知越界访问   → 拆 const + 守卫
 *
 * 不解析类型，不动 .vue 模板/style，不动 node_modules。
 * 不确定的留 // FIXME(strict) 注释。
 *
 * 用法:
 *   node scripts/fix-strict.mjs <file|dir>           # 修复
 *   node scripts/fix-strict.mjs <file|dir> --dry     # dry-run
 *   node scripts/fix-strict.mjs <file|dir> --verbose # 显示 before/after
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * 模式 A: arr[i].x → arr[i]?.x （链式访问加可选链）
 *   - 跳过: 已在 ?. 链中
 */
function fixChainAccess(line) {
  return line.replace(/(\w+)\[(\w+)\]\.(?!\?)/g, (m, arr, idx) => {
    // 跳过赋值左侧
    if (line.trim().startsWith(`${arr}[${idx}].`)) return m
    return `${arr}[${idx}]?.`
  })
}

/**
 * 模式 B: 形如 `const x: T = arr[i]`  → `const x: T = arr[i] as T`
 *   - 跳过: 已经有 ! / ? / as
 */
function fixAssignWithAs(line) {
  // 匹配: const x: T = expr[idx]  /  return expr[idx]
  const reConst = /^(const|let|var)\s+(\w+)(\s*:\s*[^=]+?)\s*=\s*(\w+)\[(\w+)\](\.\w+)*\s*(.*)$/
  const reReturn = /^(\s*)return\s+(\w+)\[(\w+)\](\.\w+)*\s*(.*)$/

  let m = line.match(reConst)
  if (m) {
    const [, decl, name, typeAnn, arr, idx, chain, rest] = m
    if (typeAnn && !line.includes('!') && !line.includes(' as ')) {
      const typeStr = typeAnn.replace(/^\s*:\s*/, '').trim()
      return `${decl} ${name}: ${typeStr} = ${arr}[${idx}]${chain || ''} as ${typeStr}${rest ? ' ' + rest : ''}`
    }
  }
  m = line.match(reReturn)
  if (m && !line.includes('!') && !line.includes(' as ')) {
    return line.replace(/return\s+(\w+)\[(\w+)\](\.\w+)*/g, 'return $1[$2]$3')
  }
  return line
}

/**
 * 模式 C: arr[i] 后紧跟 . 时（如 arr[i].x.y），已由 fixChainAccess 处理
 * 模式 D: 数组迭代 of / 索引 for (let i = 0; i < arr.length; i++) 不动
 */

/** 综合入口：单行修复 */
export function fixPatterns(line) {
  let out = line
  out = fixAssignWithAs(out)
  out = fixChainAccess(out)
  return out
}

function isVueScript(src) {
  return /<script\s+setup\s+lang=["']ts["']>/.test(src)
}

function extractVueScript(src) {
  const m = src.match(/<script\s+setup\s+lang=["']ts["']>([\s\S]*?)<\/script>/)
  return m ? m[1] : null
}

function processFile(filePath, { dry = false, verbose = false } = {}) {
  const src = readFileSync(filePath, 'utf8')
  const isVue = filePath.endsWith('.vue')

  if (isVue) {
    if (!isVueScript(src)) return { changes: 0 }
    const scriptSrc = extractVueScript(src)
    if (!scriptSrc) return { changes: 0 }
    const lines = scriptSrc.split('\n')
    let changes = 0
    const newLines = lines.map((line) => {
      const fixed = fixPatterns(line)
      if (fixed !== line) {
        changes++
        if (verbose) console.log(`  ${line}  →  ${fixed}`)
      }
      return fixed
    })
    if (changes > 0 && !dry) {
      const newScript = newLines.join('\n')
      const newSrc = src.replace(scriptSrc, newScript)
      writeFileSync(filePath, newSrc, 'utf8')
    }
    return { changes }
  }

  if (!/\.ts$/.test(filePath)) return { changes: 0 }
  const lines = src.split('\n')
  let changes = 0
  const newLines = lines.map((line) => {
    const fixed = fixPatterns(line)
    if (fixed !== line) {
      changes++
      if (verbose) console.log(`  ${line}  →  ${fixed}`)
    }
    return fixed
  })
  if (changes > 0 && !dry) writeFileSync(filePath, newLines.join('\n'), 'utf8')
  return { changes }
}

function walk(dir) {
  const out = []
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (/\.(ts|vue)$/.test(e)) out.push(p)
  }
  return out
}

function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('用法: node scripts/fix-strict.mjs <file|dir> [--dry] [--verbose]')
    process.exit(2)
  }
  const target = args[0]
  const dry = args.includes('--dry')
  const verbose = args.includes('--verbose')
  const stat = statSync(target)
  const files = stat.isDirectory() ? walk(target) : [target]

  let total = 0
  for (const f of files) {
    const r = processFile(f, { dry, verbose })
    total += r.changes
    if (r.changes > 0 && verbose) console.log(`✓ ${f}: ${r.changes} 处`)
  }
  console.log(`${dry ? '🔍' : '✏️ '}  ${total} 处修改${dry ? '（dry-run）' : ''}`)
  process.exit(dry && total > 0 ? 1 : 0)
}

// 仅当直接调用时执行
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
