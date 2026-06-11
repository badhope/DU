#!/usr/bin/env node
/**
 * 玄枢 v1.0.0 SP-2 搬移编排器
 *
 * 用法:
 *   node scripts/move-sp2.mjs                  # 全量
 *   node scripts/move-sp2.mjs --phase=<name>   # 单阶段: designs|shared-utils|components|module-utils|module-pages
 *   node scripts/move-sp2.mjs --dry-run        # 预览
 */

import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()
const MAPPING = JSON.parse(
  readFileSync('docs/superpowers/sp2-mappings.json', 'utf8'),
)
const DRY = process.argv.includes('--dry-run')
const PHASE = process.argv.find(a => a.startsWith('--phase='))?.split('=')[1]

function run(cmd) {
  console.log(`  $ ${cmd}`)
  if (!DRY) execSync(cmd, { stdio: 'inherit' })
}

function runQuiet(cmd) {
  if (DRY) {
    console.log(`  $ ${cmd}`)
  } else {
    try { execSync(cmd, { stdio: 'pipe' }) } catch (_e) { /* tolerate empty dirs */ }
  }
}

function phase(name, fn) {
  if (PHASE && PHASE !== name) return
  console.log(`\n=== Phase: ${name} ===`)
  fn()
}

// 1. 搬 designs
phase('designs', () => {
  for (const d of MAPPING.designs) {
    if (!existsSync(d.from)) {
      console.log(`  skip ${d.from} (not exist)`)
      continue
    }
    run(`git mv ${d.from} ${d.to}`)
  }
})

// 2. 搬 shared/utils
phase('shared-utils', () => {
  for (const u of MAPPING.utils) {
    if (!existsSync(u.from)) {
      console.log(`  skip ${u.from} (not exist)`)
      continue
    }
    run(`git mv ${u.from} ${u.to}`)
  }
  if (!DRY) {
    run(`python3 scripts/rewrite-imports.py src/shared/ src/stores/ src/config/ src/App.vue`)
  }
})

// 3. 搬 shared/components
phase('components', () => {
  for (const c of MAPPING.components) {
    if (!existsSync(c.from)) {
      console.log(`  skip ${c.from} (not exist)`)
      continue
    }
    run(`git mv ${c.from}/* ${c.to}/`)
    runQuiet(`git rm -r ${c.from}`)
  }
  if (!DRY) {
    run(`python3 scripts/rewrite-imports.py src/shared/components/ src/App.vue src/uni.scss`)
  }
})

// 4. 搬 8 个 module 的 utils + 1 个 data
phase('module-utils', () => {
  for (const [mod, utils] of Object.entries(MAPPING.moduleUtils)) {
    for (const name of utils) {
      const from = `src/utils/${name}.ts`
      const to = `src/modules/${mod}/logic/${name}.ts`
      if (!existsSync(from)) {
        console.log(`  skip ${from} (not exist)`)
        continue
      }
      run(`git mv ${from} ${to}`)
    }
  }
  for (const [mod, datas] of Object.entries(MAPPING.moduleData || {})) {
    for (const name of datas) {
      const from = `src/utils/${name}.ts`
      const to = `src/modules/${mod}/data/${name}.ts`
      if (!existsSync(from)) {
        console.log(`  skip ${from} (not exist)`)
        continue
      }
      run(`git mv ${from} ${to}`)
    }
  }
  runQuiet(`git rm -r src/utils`)
  if (!DRY) {
    run(`python3 scripts/rewrite-imports.py src/modules/ src/stores/ src/config/ src/App.vue src/uni.scss`)
  }
})

// 5. 搬 8 个 module + settings 的 pages
phase('module-pages', () => {
  for (const [mod, pages] of Object.entries(MAPPING.modulePages)) {
    for (const page of pages) {
      const from = `src/pages/${page}.vue`
      const to = `src/modules/${mod}/pages/${page}.vue`
      if (!existsSync(from)) {
        console.log(`  skip ${from} (not exist)`)
        continue
      }
      run(`git mv ${from} ${to}`)
    }
  }
  for (const page of MAPPING.settingsPages) {
    const from = `src/pages/${page}/${page}.vue`
    const to = `src/settings/pages/${page}.vue`
    if (existsSync(from)) {
      run(`git mv ${from} ${to}`)
    }
  }
  runQuiet(`git rm -r src/pages`)
  if (!DRY) {
    run(`python3 scripts/rewrite-imports.py src/modules/ src/settings/ src/stores/ src/config/ src/App.vue`)
  }
})

console.log(`\n${DRY ? '(dry-run) ' : ''}move-sp2 complete`)
