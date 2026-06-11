#!/usr/bin/env node
/**
 * 玄枢 MISTVERSE · 产物体积检查
 *
 * 在 build 后运行，检查各模块产物大小是否超出阈值。
 * 用法: node scripts/check-bundle.mjs
 *
 * 阈值（单模块 gzip 前）:
 *   - 单页面 ≤ 80KB
 *   - 单模块总 ≤ 300KB
 *   - 全局 vendor ≤ 200KB
 */

import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist', 'build', 'h5')

// 阈值配置（字节）
const PAGE_LIMIT = 80 * 1024
const VENDOR_LIMIT = 200 * 1024

let failed = 0

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}

function checkDir(dir: string, limit: number, label: string) {
  if (!existsSync(dir)) {
    console.log(`  ⏭ [${label}] 目录不存在，跳过: ${dir}`)
    return
  }

  let totalSize = 0
  const files: Array<{ name: string; size: number }> = []

  function walk(d: string) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) walk(full)
      else {
        totalSize += stat.size
        files.push({ name: full.replace(dir + '/', ''), size: stat.size })
      }
    }
  }

  walk(dir)

  const overLimit = files.filter((f) => f.size > limit)
  if (overLimit.length > 0) {
    for (const f of overLimit) {
      console.error(`  ✗ [${label}] ${f.name} = ${formatSize(f.size)} > ${formatSize(limit)}`)
      failed++
    }
  } else {
    console.log(`  ✓ [${label}] 总计 ${formatSize(totalSize)}（${files.length} 文件）`)
  }
}

console.log('\n=== 产物体积检查 ===\n')

// 检查各模块
const modules = ['mingli', 'zhanbu', 'guanxiang', 'mingming', 'jiankang', 'xiuxin', 'shenghuo', 'personal']
for (const m of modules) {
  const moduleDir = join(DIST, 'static', 'js', 'modules', m)
  checkDir(moduleDir, PAGE_LIMIT, `modules/${m}`)
}

// 检查 vendor
const vendorDir = join(DIST, 'static', 'js', 'vendor')
checkDir(vendorDir, VENDOR_LIMIT, 'vendor')

// 检查全局
const globalDir = join(DIST, 'static', 'js')
if (existsSync(globalDir)) {
  let globalSize = 0
  for (const f of readdirSync(globalDir)) {
    const full = join(globalDir, f)
    if (statSync(full).isFile()) globalSize += statSync(full).size
  }
  console.log(`  ℹ [全局 JS] 总计 ${formatSize(globalSize)}`)
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${failed} 个超限文件\n`)
process.exit(failed === 0 ? 0 : 1)
