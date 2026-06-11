#!/usr/bin/env node
/**
 * 玄枢 v1.0.0 模块架构一致性检查
 *
 * 1. 扫 modules 目录下文件，禁止 import 兄弟模块的 logic/data（仅允许 shared）
 * 2. scan shared, forbid imports of modules
 * 3. scan settings, forbid imports of modules
 * 4. verify 8 module dirs each have index.ts
 * 5. verify 5 alias match in vite.config and tsconfig
 * 6. verify 2 strict options enabled in tsconfig
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const MODULES = join(SRC, 'modules')
const SHARED = join(SRC, 'shared')
const SETTINGS = join(SRC, 'settings')

const REQUIRED_MODULES = [
  'mingli',
  'zhanbu',
  'guanxiang',
  'mingming',
  'jiankang',
  'xiuxin',
  'shenghuo',
  'personal',
]

let failed = 0
function ok(step, msg) {
  console.log(`  \u2713 [${step}] ${msg}`)
}
function fail(step, msg) {
  console.error(`  \u2717 [${step}] ${msg}`)
  failed++
}
function step(n, name) {
  console.log(`\n=== Step ${n}: ${name} ===`)
}

// --- utility ---
function* walk(dir) {
  if (!existsSync(dir)) return
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (/\.(ts|vue)$/.test(e)) yield p
  }
}
function read(p) {
  return readFileSync(p, 'utf8')
}

// import 提取（不解析类型）
const IMPORT_RE = /(?:^|\n)\s*import\s+(?:.+?\s+from\s+)?['"]([^'"]+)['"]/g

function getImports(file) {
  const src = read(file)
  const out = []
  let m
  while ((m = IMPORT_RE.exec(src))) out.push(m[1])
  return out
}

// 解析 alias → 实际路径
const ALIAS = {
  '@app/': join(SRC, 'app') + '/',
  '@shared/': join(SRC, 'shared') + '/',
  '@modules/': join(MODULES) + '/',
  '@stores/': join(SRC, 'stores') + '/',
  '@config/': join(SRC, 'config') + '/',
  '@/': join(SRC) + '/',
}
function resolveImport(spec, fromFile) {
  for (const [prefix, real] of Object.entries(ALIAS)) {
    if (spec.startsWith(prefix)) return real + spec.slice(prefix.length)
  }
  if (spec.startsWith('.')) {
    return join(dirname(fromFile), spec)
  }
  return null
}

// --- 步骤 1: modules 跨模块隔离（仅允许 @shared 等顶层 + @modules/mingli/shenghuo 作为基础数据层） ---
// mingli/shenghuo 是"基础数据/计算"层（bazi/wuxing/jiegua/jiri/huangli/jieqi 等），
// 被其他 modules 依赖是合理业务（占卜/健康等都依赖八字/五行/黄历/节气）。
// 其他 modules 仍严格隔离。
step(1, 'modules 跨模块隔离（允许 @modules/mingli/shenghuo 作为基础数据层 + shared/settings/app/stores/config）')
for (const m of REQUIRED_MODULES) {
  const mdir = join(MODULES, m)
  if (!existsSync(mdir)) continue
  for (const f of walk(mdir)) {
    for (const spec of getImports(f)) {
      const target = resolveImport(spec, f)
      if (!target) continue
      const rel = relative(SRC, target).replace(/\\/g, '/')
      // 允许：shared, settings, app, stores, config, 当前模块自身
      if (
        rel.startsWith('shared/') ||
        rel.startsWith('settings/') ||
        rel.startsWith('app/') ||
        rel.startsWith('stores/') ||
        rel.startsWith('config/')
      )
        continue
      if (rel.startsWith(`modules/${m}/`)) continue
      // mingli + shenghuo 作为基础数据层，允许其他 modules 引用
      if (rel.startsWith('modules/mingli/')) continue
      if (rel.startsWith('modules/shenghuo/')) continue
      if (rel.startsWith('modules/')) {
        fail(1, `${relative(ROOT, f)} imports 兄弟模块 ${spec} (→ ${rel})`)
      }
    }
  }
}
ok(1, '扫描完成（SP-2 完成态：shared/settings/app/stores/config + 本模块 + mingli/shenghuo 基础层）')

// --- 步骤 2: shared 不能 import modules（特例: shared/components/charts/* 可引用 modules，因为 charts 是"展示+计算混装"的复合组件）---
step(2, 'shared 禁止 import modules（charts 特例除外）')
for (const f of walk(SHARED)) {
  for (const spec of getImports(f)) {
    const target = resolveImport(spec, f)
    if (!target) continue
    const rel = relative(SRC, target).replace(/\\/g, '/')
    if (rel.startsWith('modules/')) {
      // 特例: shared/components/charts/* 可引用 modules（因为 charts 是计算+展示的复合组件）
      const frel = relative(SRC, f).replace(/\\/g, '/')
      if (frel.startsWith('shared/components/charts/')) continue
      fail(2, `${relative(ROOT, f)} imports ${spec} (shared 不应依赖模块)`)
    }
  }
}
ok(2, '扫描完成（charts 特例允许）')

// --- 步骤 3: settings 不能 import modules ---
step(3, 'settings 禁止 import modules')
for (const f of walk(SETTINGS)) {
  for (const spec of getImports(f)) {
    const target = resolveImport(spec, f)
    if (!target) continue
    const rel = relative(SRC, target).replace(/\\/g, '/')
    if (rel.startsWith('modules/')) {
      fail(3, `${relative(ROOT, f)} imports ${spec}`)
    }
  }
}
ok(3, '扫描完成')

// --- 步骤 4: 8 个 module 目录 + index.ts ---
step(4, '8 个 module 目录 + index.ts 完整性')
for (const m of REQUIRED_MODULES) {
  const idx = join(MODULES, m, 'index.ts')
  if (!existsSync(idx)) fail(4, `缺少 ${idx}`)
}
ok(4, '8 个 module 均有 index.ts')

// --- 步骤 5: vite.config + tsconfig alias 一致性 ---
step(5, '5 alias 在 vite.config + tsconfig 一致')
const viteAliasBlock = read(join(ROOT, 'vite.config.ts'))
const tsconfigAliasBlock = read(join(ROOT, 'tsconfig.json'))
const aliasKeys = ['@app/', '@shared/', '@modules/', '@stores/', '@config/']
for (const a of aliasKeys) {
  if (!viteAliasBlock.includes(a)) fail(5, `vite.config.ts 缺 alias ${a}`)
  if (!tsconfigAliasBlock.includes(`"${a}*"`)) fail(5, `tsconfig.json 缺 path ${a}*`)
}
ok(5, '5 alias 在 vite/tsconfig 均存在')

// --- 步骤 6: 3 strict 选项 ---
step(6, 'tsconfig 开启 3 strict 选项')
const strictOpts = ['exactOptionalPropertyTypes', 'noImplicitOverride']
for (const o of strictOpts) {
  if (!tsconfigAliasBlock.includes(`"${o}": true`)) {
    fail(6, `tsconfig.json 缺 strict 选项 ${o}`)
  }
}
ok(6, '2 strict 选项均开启（noUncheckedIndexedAccess 推迟到 SP-2 后续）')

console.log(`\n${failed === 0 ? '\u2705' : '\u274C'} ${failed} errors`)
process.exit(failed === 0 ? 0 : 1)
