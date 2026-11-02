#!/usr/bin/env node
/**
 * 架构边界门禁
 *
 * docs/ARCHITECTURE.md 里画了一张"谁可以 import 谁"的表。文档里的架构图
 * 不会自动生效 —— 三个月后没人记得住，`pages/Arena.vue` 就会直接去 fetch
 * 语料、`ui/AnswerCard.vue` 就会 import 一个内核。这条门禁把那张表变成 CI。
 *
 * 规则来源单一：下面的 LAYERS 就是 ARCHITECTURE.md 那张表的机器可读版本。
 * 改架构时要改两处（文档 + 这里），这是故意的 —— 架构变更本就该被显式看见。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'src')

/** 层 → { 允许依赖的层, 说明 } */
const LAYERS = {
  contract: { may: [], note: '只放类型，不依赖任何层' },
  core: { may: ['contract'], note: '确定性内核' },
  data: { may: ['contract'], note: '语料读取与检索' },
  knowledge: { may: ['contract', 'data'], note: '查询 → 片段' },
  engine: { may: ['contract'], note: '特征与匹配' },
  ai: { may: ['contract', 'engine', 'knowledge'], note: '本地回答组装' },
  arena: { may: ['contract', 'core', 'ai', 'masters', 'engine'], note: '对局与持久化' },
  masters: { may: ['contract'], note: '方法卡注册表' },
  tools: { may: ['contract', 'core', 'engine'], note: '兼容工具' },
  composables: { may: ['contract'], note: '组合式状态' },
  ui: { may: ['contract', 'arena'], note: '展示组件（只读 arena 的类型，不写状态）' },
  pages: { may: ['contract', 'core', 'data', 'knowledge', 'engine', 'ai', 'arena', 'masters', 'tools', 'composables', 'ui'], note: '页面可组合全部能力' },
}

/** 这些文件不受层规则约束：应用外壳与路由 */
const EXEMPT = new Set(['main.ts', 'router.ts', 'App.vue', 'env.d.ts'])

function layerOf(relPath) {
  const [head] = relPath.split(/[\\/]/)
  return LAYERS[head] ? head : null
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(ts|vue)$/.test(entry.name)) out.push(path.relative(SRC, full))
  }
  return out
}

const violations = []
const files = walk(SRC)

for (const rel of files) {
  const from = layerOf(rel)
  if (!from || EXEMPT.has(rel)) continue
  const source = fs.readFileSync(path.join(SRC, rel), 'utf8')
  const allowed = new Set(LAYERS[from].may)

  // 静态 import、动态 import、以及 re-export 都要检查
  const specifiers = [
    ...source.matchAll(/(?:^|\n)\s*import\s+(?:type\s+)?[^'"\n]*?from\s*['"]([^'"]+)['"]/g),
    ...source.matchAll(/(?:^|\n)\s*export\s+(?:type\s+)?[^'"\n]*?from\s*['"]([^'"]+)['"]/g),
    ...source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map((m) => m[1])

  for (const spec of specifiers) {
    if (!spec || !spec.startsWith('@/')) continue
    const target = layerOf(spec.slice(2))
    if (!target) continue
    if (target === from) continue
    if (!allowed.has(target)) {
      violations.push({
        file: rel,
        from,
        target,
        note: `${from} 不允许依赖 ${target}（${LAYERS[from].note}）`,
      })
    }
  }
}

if (violations.length) {
  console.error('架构边界门禁失败：以下 import 违反了 docs/ARCHITECTURE.md 的分层表。')
  for (const v of violations) console.error(`- src/${v.file}: 依赖 ${v.target} —— ${v.note}`)
  console.error('\n如果这是有意为之，请先更新 docs/ARCHITECTURE.md 的分层表，再更新 scripts/check-boundaries.mjs。')
  process.exit(1)
}

console.log(`架构边界门禁通过：${files.length} 个源文件，全部符合分层表。`)
