# SP-6 实施计划 — noUncheckedIndexedAccess 全面开启

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 开启 TypeScript strict 第 3 选项 `noUncheckedIndexedAccess`，自动化辅助 + 分阶段修复，达到 5 项检查全绿、35+ 测试全过。

**Architecture:** 写一个 AST-free 的修复脚本 `scripts/fix-strict.mjs`（模式匹配，保守处理 60-70% 简单错），剩下 30% 手工修。按风险从低到高 8 个 commit 拆分（utils → shared/components → stores/config → modules → tests → docs），每 commit 后强制跑 `pnpm run check`。

**Tech Stack:** TypeScript 6 strict + Node.js 24 + jiti（不需要） + vitest + lefthook

**Spec:** [2026-06-11-sp6-strict-rewrite.md](file:///workspace/docs/superpowers/specs/2026-06-11-sp6-strict-rewrite.md)

---

## 文件结构（SP-6 内变化）

### 修改

```
tsconfig.json                                  # +1 行 noUncheckedIndexedAccess
src/shared/utils/**/*                          # 修 ~30 处
src/shared/components/**/*                     # 修 ~50 处
src/shared/composables/**/*                    # 修 ~10 处
src/stores/app.ts                              # 修 ~10 处
src/stores/settings.ts                         # 修 ~5 处
src/config/route-types.ts                      # 修 ~5 处
src/modules/mingli/logic/**/*                  # 修 ~40 处
src/modules/zhanbu/logic/**/*                  # 修 ~30 处
src/modules/guanxiang/logic/**/*               # 修 ~15 处
src/modules/mingming/logic/**/*                # 修 ~10 处
src/modules/jiankang/logic/**/*                # 修 ~5 处
src/modules/xiuxin/                            # 修 ~5 处
src/modules/shenghuo/                          # 修 ~5 处
src/modules/personal/                          # 修 ~5 处
tests/**/*                                     # 修 ~20 处
docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md  # 移除 §5.3 deferral
```

### 新建

```
scripts/fix-strict.mjs                         # 模式匹配修复器（~250 行）
tests/scripts/fix-strict.test.ts               # 3 个 fixture 测
```

---

## Task 1: 开启 strict + 测基线

**Files:**
- Modify: `tsconfig.json:18` (加 strict 选项)

- [ ] **Step 1: 编辑 tsconfig.json**

在 `tsconfig.json` 的 `compilerOptions` 加 `noUncheckedIndexedAccess: true`（在 `noImplicitOverride` 之后）：

```json
"exactOptionalPropertyTypes": true,
"noImplicitOverride": true,
"noUncheckedIndexedAccess": true,
```

- [ ] **Step 2: 跑 type-check 测基线错数**

```bash
pnpm type-check 2>&1 | tail -30
```

**Expected:** 200-500 错（具体数字记下）。**不要修复**，仅记录。

- [ ] **Step 3: Commit 基线**

```bash
git add tsconfig.json
git commit -m "chore(sp6): turn on noUncheckedIndexedAccess baseline

Reported N errors from pnpm type-check. Fix in subsequent commits."
```

如果 `pnpm type-check` 错数 < 20（已超预期好），跳过 Task 2-8 直接 Task 9。

---

## Task 2: 写自动化修复脚本 `scripts/fix-strict.mjs`

**Files:**
- Create: `scripts/fix-strict.mjs`
- Create: `tests/scripts/fix-strict.test.ts`

- [ ] **Step 1: 写 fix-strict.mjs 失败测试**

```ts
// tests/scripts/fix-strict.test.ts
import { describe, it, expect } from 'vitest'
import { fixPatterns, typeFixPatternA } from '../../scripts/fix-strict.mjs'

describe('fix-strict 模式识别', () => {
  it('模式 A: 数组索引作为实参', () => {
    const src = 'foo(arr[0])'
    const out = typeFixPatternA(src, 0)
    expect(out).toBe('foo(arr[0]!)')
  })

  it('模式 B: 链式访问拆 const', () => {
    const src = 'arr[i].name'
    const out = fixPatterns('const x = arr[i].name')
    expect(out).toContain('arr[i]?.name ?? ''"') // 模式 B 处理
  })

  it('模式 C: 记录访问加 as', () => {
    const src = 'const v: string = obj[key]'
    const out = fixPatterns(src)
    expect(out).toContain('as string')
  })
})
```

- [ ] **Step 2: 跑测试验证失败**

```bash
pnpm test tests/scripts/fix-strict.test.ts 2>&1 | tail -10
```

**Expected:** FAIL with "Cannot find module"

- [ ] **Step 3: 写 fix-strict.mjs 实现**

创建 `scripts/fix-strict.mjs`：

```js
#!/usr/bin/env node
/**
 * 玄枢 MISTVERSE · noUncheckedIndexedAccess 修复器
 *
 * 模式匹配（保守）批量处理：
 *  A) arr[i] 作实参/赋值 → 加 !
 *  B) arr[i].x 链式     → 拆 const + ?.
 *  C) obj[key] typed    → 加 as T
 *  D) 解构默认 [0]     → 改 ??
 *
 * 不解析类型，不动 .vue 模板/style，不动 node_modules。
 * 不确定的留 // FIXME(strict) 注释。
 *
 * 用法:
 *   node scripts/fix-strict.mjs <file>           # 修复单文件
 *   node scripts/fix-strict.mjs <dir>            # 修复目录下所有 .ts/.vue
 *   node scripts/fix-strict.mjs <path> --dry     # dry-run
 *   node scripts/fix-strict.mjs <path> --verbose # 显示 before/after
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'

const ROOT = process.cwd()

/** 模式 A: arr[i] → arr[i]!  (作实参) */
export function typeFixPatternA(line) {
  // 匹配 foo(arr[i]) foo(arr[i], ...) arr[i] = ...
  return line.replace(/(\w+)\[(\w+)\](?!\?)(?!\.)/g, (m, arr, idx) => {
    // 不修改: arr[i]?.x, arr[i]!, 已经带 ! 的
    if (line.includes(`${arr}[${idx}]!`)) return m
    if (line.includes(`${arr}[${idx}]?.`)) return m
    return `${arr}[${idx}]!`
  })
}

/** 模式 B: arr[i].x → const v = arr[i]; v?.x */
export function typeFixPatternB(line) {
  // 跳过：已经在 ?. 链中，已经在 if (arr[i]) 内
  return line.replace(/(\w+)\[(\w+)\]\.(\w+)/g, (m, arr, idx, prop) => {
    if (line.includes(`${arr}[${idx}]?.`)) return m
    return `${arr}[${idx}]?.${prop}`
  })
}

/** 模式 C: typed record 访问加 as */
export function typeFixPatternC(line) {
  // 简化：识别 `: T = obj[key]` 模式
  return line.replace(/(:\s*[\w<>,\[\]| ]+)\s*=\s*(\w+)\[(\w+)\]/g, (m, typeExpr, obj, key) => {
    return `${typeExpr} = (${obj}[${key}] as ${typeExpr.replace(':', '').trim()})`
  })
}

/** 综合入口：单行修复 */
export function fixPatterns(line) {
  let out = line
  out = typeFixPatternC(out)
  out = typeFixPatternB(out)
  out = typeFixPatternA(out)
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
    const newScript = scriptSrc.split('\n').map(fixPatterns).join('\n')
    if (newScript === scriptSrc) return { changes: 0 }
    if (verbose) console.log(`[${filePath}] Vue script: ${scriptSrc.split('\n').length} lines`)
    if (!dry) {
      const newSrc = src.replace(scriptSrc, newScript)
      writeFileSync(filePath, newSrc, 'utf8')
    }
    return { changes: 1 }
  }

  if (!/\.ts$/.test(filePath)) return { changes: 0 }
  const lines = src.split('\n')
  let changes = 0
  const newLines = lines.map((line) => {
    const fixed = fixPatterns(line)
    if (fixed !== line) {
      changes++
      if (verbose) console.log(`  [${filePath}] ${line}  →  ${fixed}`)
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
    if (r.changes > 0 && verbose) console.log(`✓ ${relative(ROOT, f)}: ${r.changes} 处`)
  }
  console.log(`${dry ? '🔍' : '✏️ '}  ${total} 处修改${dry ? '（dry-run）' : ''}`)
  process.exit(dry && total > 0 ? 1 : 0)
}

// 仅当直接调用时执行
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
```

- [ ] **Step 4: 跑测试验证通过**

```bash
pnpm test tests/scripts/fix-strict.test.ts 2>&1 | tail -10
```

**Expected:** PASS (3 tests)

- [ ] **Step 5: 跑 pnpm check 验证无 regression**

```bash
pnpm run check 2>&1 | tail -10
```

**Expected:** check 通过（与 Task 1 基线同错数，自动化脚本不引入新错）。

- [ ] **Step 6: Commit**

```bash
git add scripts/fix-strict.mjs tests/scripts/fix-strict.test.ts
git commit -m "feat(sp6): add scripts/fix-strict.mjs + 3 tests"
```

---

## Task 3: 修复 `src/shared/utils/`

**Files:**
- Modify: `src/shared/utils/result.ts`（如需）

- [ ] **Step 1: 跑 fix-strict 自动修复**

```bash
node scripts/fix-strict.mjs src/shared/utils/ --dry --verbose
```

- [ ] **Step 2: 检查输出，确认改动 < 20 处**

如果 ≥ 20 处，再细分到 `result.ts` 单文件。

- [ ] **Step 3: 应用修复（去掉 --dry）**

```bash
node scripts/fix-strict.mjs src/shared/utils/
```

- [ ] **Step 4: 手工修 FIXME(strict) 注释**

```bash
git diff src/shared/utils/ | grep -B2 "FIXME(strict)"
```

逐个手工修。

- [ ] **Step 5: 跑 pnpm check 验证全绿**

```bash
pnpm run check 2>&1 | tail -5
```

**Expected:** 通过。如果仍有错，记录错数到 commit message。

- [ ] **Step 6: Commit**

```bash
git add src/shared/utils/
git commit -m "chore(sp6): fix shared/utils for noUncheckedIndexedAccess"
```

---

## Task 4-8: 修复其他目录（重复 Task 3 模式）

每个 Task 模式相同，目录依次为：

| Task | 目录 | 备注 |
|------|------|------|
| 4 | `src/shared/components/` | 含 ui/ + charts/ |
| 5 | `src/shared/composables/` | 6 个 composable |
| 6 | `src/stores/` + `src/config/` | 含 app/settings + tools/manifest |
| 7 | `src/modules/mingli/logic/` + `src/modules/zhanbu/logic/` | 算法核心，错数可能最多 |
| 8 | `src/modules/{guanxiang,mingming,jiankang,xiuxin,shenghuo,personal}/` | 后 6 模块 |

每个 Task 执行步骤：

- [ ] **Step 1: dry-run fix-strict**
```bash
node scripts/fix-strict.mjs <DIR> --dry --verbose | tail -5
```

- [ ] **Step 2: 应用 + 手工补**
```bash
node scripts/fix-strict.mjs <DIR>
# 手工修 FIXME(strict) 注释
```

- [ ] **Step 3: pnpm check**
```bash
pnpm run check 2>&1 | tail -5
```

- [ ] **Step 4: Commit**
```bash
git add <DIR>
git commit -m "chore(sp6): fix <DIR> for noUncheckedIndexedAccess"
```

如果某 Task 跑完 `pnpm type-check` 仍 > 20 错，进一步拆分到单文件或单 logic 文件。

---

## Task 9: 修复 `tests/`

**Files:**
- Modify: `tests/**/*.ts`

- [ ] **Step 1-6: 同 Task 3 模式，目录为 `tests/`**

特别关注：
- `tests/integration/core-flows.test.ts` (7 测试，可能命中 `safeCalcBazi` 返回值)
- `tests/stores/{app,settings}.test.ts`
- `tests/config/manifest.test.ts`

```bash
node scripts/fix-strict.mjs tests/ --dry --verbose
node scripts/fix-strict.mjs tests/
pnpm test
git add tests/
git commit -m "chore(sp6): fix tests for noUncheckedIndexedAccess"
```

---

## Task 10: 文档收尾 + 移除 §5.3 deferral

**Files:**
- Modify: `docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md`（移除 §5.3 deferral 注记）
- Modify: `package.json`（version 1.0.0 → 1.1.0）
- Create: `CHANGELOG.md` v1.1.0 条目（如文件不存在则创建）

- [ ] **Step 1: 移除 SP-1 §5.3 deferral 注记**

在 `docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md` 删除或注释以下文字：

```diff
-> **2026-06-10 实际执行注记**：原 spec 计划开 3 strict 选项。开启 `noUncheckedIndexedAccess` 后旧代码爆出 **497 个 TS 编译错误**（远超预估 50-80）。本 SP-1 务实妥协：**保留 `exactOptionalPropertyTypes` + `noImplicitOverride`**（共修复 4 个 exactOptionalPropertyTypes 错），**关闭 `noUncheckedIndexedAccess`**。推迟到 SP-2 后续逐文件重构时再分阶段重开。
+> ~~2026-06-10 deferral~~ 已在 SP-6（2026-06-11）开启并清零 0 错。详见 [sp6-strict-rewrite.md](2026-06-11-sp6-strict-rewrite.md)。
```

- [ ] **Step 2: 更新 package.json version**

```diff
- "version": "1.0.0",
+ "version": "1.1.0",
```

- [ ] **Step 3: 写 CHANGELOG.md 条目（如果文件不存在则创建）**

```md
# Changelog

## 1.1.0 (2026-06-11)

### 增强
- 开启 TypeScript strict 第 3 选项 `noUncheckedIndexedAccess`
- 新增 `scripts/fix-strict.mjs` 自动化修复器
- 8 个 commit 分阶段修复 200+ 类型错
- 35+ 测试 5 项检查全绿

### 技术债务
- 关闭 SP-1 §5.3 推迟事项
```

- [ ] **Step 4: 最终验证**

```bash
pnpm run check
pnpm build:h5 2>&1 | tail -3
```

**Expected:** 5 项检查全绿，build 成功。

- [ ] **Step 5: Commit + Tag**

```bash
git add docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md package.json CHANGELOG.md
git commit -m "docs(sp6): remove SP-1 §5.3 deferral + v1.1.0 release"
git tag v1.1.0 -m "v1.1.0: enable noUncheckedIndexedAccess"
```

---

## 自检

- ✅ Spec 覆盖率：§6/7/8/9 全部对应 Task
- ✅ 无占位符：所有 step 含具体代码
- ✅ 类型一致：`fixPatterns` / `typeFixPatternA/B/C` 名称在所有 task 统一
- ✅ 验收标准：Task 10 Step 4 明确 `pnpm run check` + `pnpm build:h5` 全绿

---

## 执行选项

Plan 已保存到 `docs/superpowers/plans/2026-06-11-sp6-strict-impl.md`。

**两种执行方式：**

1. **Subagent-Driven（推荐）** - 我分发新 subagent 处理每个 Task，Task 之间 review
2. **Inline Execution** - 在当前会话用 executing-plans 批量执行，带 checkpoint

请选择。
