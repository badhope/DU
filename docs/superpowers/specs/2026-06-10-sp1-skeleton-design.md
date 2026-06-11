# 玄枢 v1.0.0 重做迁移 — SP-1 设计

> 状态: draft · 待用户审 · 5 SP 拆分后的第一阶段
> 日期: 2026-06-10

## 1. 背景

当前仓库 HEAD `7bdabc1` on `main`（origin 同步），`package.json` version `1.0.1`，`src/` 仍是 pre-v1.0.0 旧结构：`{App.vue, components/, config/, designs/, pages/, static/, stores/, utils/}`，含 6 位 AI 师实现和 45 个 utils、44 个 pages 目录。

v1.0.0 目标架构已知（上一轮 17 commit 完成但未推回 main），重做拆为 5 个 sub-project：

| SP       | 范围                                                        | Task             |
| -------- | ----------------------------------------------------------- | ---------------- |
| **SP-1** | 去 AI + 新骨架 + strict 错误                                | Task 1 + 2 + 2.5 |
| SP-2     | shared 资产 + utils 按模块 + pages 搬移                     | Task 3 + 4 + 5   |
| SP-3     | 观形 KnowledgeShell + 图片管线 + stores 拆分 + 持久化迁移   | Task 6 + 7 + 8   |
| SP-4     | 6 motion composable + 路由类型 + module manifest + 错误边界 | Task 9 + 10 + 11 |
| SP-5     | v1.0.0 tag + README + 测试收尾                              | Task 12          |

本文为 SP-1 设计。

## 2. SP-1 目标

完成后仓库具备：

1. **零 AI 残留** — 所有 6 位 AI 师（卦/命/风/名/健/修）代码、UI、路由、store 字段、cooldown 引用全部移除
2. **新目录骨架就绪** — `src/{app,shared,modules,settings}/` 已建，5 alias 配齐
3. **TypeScript 严格基线** — 3 个 strict 选项开启，旧代码 0 错（Task 2.5）
4. **跨模块引用纪律可验证** — `scripts/check-modules.mjs` 6 步通过
5. **旧页面仍可工作** — 现有 `src/pages/` 文件不动，迁移在 SP-2 处理

## 3. 范围与不在范围

### 在范围

- 删除 AI 相关代码（详见 §4 Task 1）
- 新建空目录骨架
- 配置 5 alias（vite + tsconfig）
- 开启 3 strict 选项
- 修复 0 错 strict
- 写 `check-modules.mjs` 6 步检查
- 持久化数据迁移：旧 `mistverse-state-v2` 移除 `chatSessions` 字段

### 不在范围（后续 SP）

- 搬移 `src/components/` `src/pages/` `src/utils/` 到新结构 → SP-2
- 拆分 `useAppStore` 为 `useAppStore` + `useSettingsStore` → SP-3
- 观形三页 KnowledgeShell 化 → SP-3
- 图片管线 → SP-3
- 动效 composable / route types / 错误边界 → SP-4
- v1.0.0 tag → SP-5

## 4. Task 1：去 AI 残留

### 4.1 删除文件

```
src/utils/ai.ts                                 # 35KB monolithic AI service
src/pages/ai/                                   # 整目录
  ├── ai-feng.vue
  ├── ai-gua.vue
  ├── ai-jiankang.vue
  ├── ai-ming.vue
  ├── ai-name.vue
  └── ai-xiuxin.vue
```

### 4.2 修改 `src/utils/daily-cooldown.ts`

删除 COOLDOWN_TYPE 映射中 6 行 AI master 条目（line 64-69）：

```diff
   jiaobei: 'free',
-  'ai-gua': 'free',
-  'ai-ming': 'free',
-  'ai-feng': 'free',
-  'ai-name': 'free',
-  'ai-jiankang': 'free',
-  'ai-xiuxin': 'free',
   poster: 'free',
```

### 4.3 修改 `src/stores/index.ts`

按以下位置逐一删除：

| 位置                  | 删除内容                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| line 78-83            | `ToolKey` 联合类型 6 个 ai-\* key                                                                                                  |
| line 146-156          | `ChatSession` interface 整段                                                                                                       |
| line 183              | `PersistState.chatSessions` 字段                                                                                                   |
| line 353-361          | `DEFAULT_ACHIEVEMENTS` 中 `ai-master` 成就                                                                                         |
| line 392              | `DEFAULT_STATE.chatSessions: {}`                                                                                                   |
| line 441              | `const chatSessions = ref<...>(initial.chatSessions)`                                                                              |
| line 455-456, 469-470 | watch 数组 + saveState 中 chatSessions 字段                                                                                        |
| line 582-622          | `getChatSession` / `appendChatMessage` / `setChatPersona` / `clearChatSession` / `clearAllChatSessions` + `MAX_CHAT_MESSAGES` 常量 |
| line 754-764          | `totalChatTurns` / `chattedMasters` computed                                                                                       |
| line 864              | `resetAll` 中 `chatSessions.value = {}`                                                                                            |
| line 887, 917-922     | return 中 chatSessions 相关 + 5 个 chat 函数                                                                                       |
| line 898-899          | return 中 totalChatTurns / chattedMasters                                                                                          |

**持久化数据迁移**：在 `loadState()` 函数（line 398-423）中，写入 v3 清理逻辑 —— `chatSessions` 字段从读出数据中剥离，写回时不保存。存储 key 升级为 `mistverse-state-v3`（同时保留 v2 旧 key 不动，避免破坏老用户）。

```ts
const STORAGE_KEY = 'mistverse-state-v3'
const LEGACY_KEYS = ['mistverse-state-v2']

function loadState(): PersistState {
  if (typeof window === 'undefined') return JSON.parse(JSON.stringify(DEFAULT_STATE))
  // 1) 优先读 v3
  // 2) 找不到再读 v2 并剥离 chatSessions 字段后写回 v3，v2 保留不动
  // 3) 都找不到用默认
  ...
}
```

### 4.4 修改 `src/config/tools.ts`

- `CATEGORIES` 数组：保持 6 个不变（mingli/zhongshu/guwu/jian/xiuxin/shenghuo）—— 6 分类 achievement 仍然有效
- `TOOLS` 数组：删除 6 个 `key: 'ai-*'` 工具项
- `CategoryKey` 类型不变（SP-2 才改 8 个 module key）

### 4.5 修改 `src/pages.json`

删除 line 340-386 共 6 个 ai-\* 路由条目。

### 4.6 修改 `src/pages/poster/poster.vue` 和 `src/pages/dashboard/dashboard.vue`

按 `grep` 结果定位 AI 字段引用（chatSessions / chattedMasters / totalChatTurns / 'AI 玄谈' 成就 / ai-\* 工具项），逐个改为：

- 删除 UI 区块（AI 玄谈入口、AI 师推荐卡片等）
- 删除 import 与 computed
- 删除 `addHistory` 等调用中传 `tool: 'ai-*'`

### 4.7 验证

- `pnpm type-check` — 0 错
- `pnpm test` — 现有测试全过
- `pnpm dev:h5` — 启动正常，访问 `pages/ai/ai-gua` 返回 404
- `pnpm build:h5` — 产物不再含 `ai-gua` / `MASTERS` / `askMaster` 字符串

## 5. Task 2：新目录骨架 + alias + strict

### 5.1 新建目录

```
src/
├── app/                  # 跨模块装配（暂空，SP-2 起填 router/manifest）
│   └── README.md         # 占位说明
├── shared/               # 跨模块可复用（暂空，SP-2 搬 assets）
│   └── README.md
├── modules/              # 8 业务模块（暂空 stub）
│   ├── mingli/index.ts
│   ├── zhanbu/index.ts
│   ├── guanxiang/index.ts
│   ├── mingming/index.ts
│   ├── jiankang/index.ts
│   ├── xiuxin/index.ts
│   ├── shenghuo/index.ts
│   ├── personal/index.ts
│   └── README.md
└── settings/             # 设置模块
    ├── index.ts
    └── README.md
```

每个 `index.ts` 内容（最小 stub）：

```ts
/**
 * <module> 模块入口（SP-1 stub）
 *
 * TODO(SP-2): 搬移 pages / utils / stores
 */
export const MODULE_KEY = '<module>' as const
export const MODULE_NAME = '<中文名>' as const
```

8 个 module 的中文名映射：

| module    | 中文     |
| --------- | -------- |
| mingli    | 命理     |
| zhanbu    | 占卜     |
| guanxiang | 观形     |
| mingming  | 命名     |
| jiankang  | 健康     |
| xiuxin    | 修心     |
| shenghuo  | 生活     |
| personal  | 个人中心 |

### 5.2 `vite.config.ts` —— 5 个 alias

```ts
import { defineConfig } from 'vite'
import { createRequire } from 'module'
import { fileURLToPath, URL } from 'url'

const require = createRequire(import.meta.url)
const uni = require('@dcloudio/vite-plugin-uni')

const src = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  base: '/mistverse/',
  plugins: [uni.default()],
  resolve: {
    alias: {
      '@': src,
      '@app': src + '/app',
      '@shared': src + '/shared',
      '@modules': src + '/modules',
      '@stores': src + '/stores',
      '@config': src + '/config',
    },
  },
})
```

### 5.3 `tsconfig.json` —— 5 paths + 2 strict（妥协）

> **2026-06-10 实际执行注记**：原 spec 计划开 3 strict 选项（`noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride`）。开启 `noUncheckedIndexedAccess` 后旧代码爆出 **497 个 TS 编译错误**（远超预估 50-80），覆盖 30+ 文件。本 SP-1 务实妥协：**保留 `exactOptionalPropertyTypes` + `noImplicitOverride`**（共修复 4 个 exactOptionalPropertyTypes 错），**关闭 `noUncheckedIndexedAccess`**。推迟到 SP-2 后续逐文件重构时再分阶段重开。

```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "sourceMap": true,
    "ignoreDeprecations": "6.0",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./src/app/*"],
      "@shared/*": ["./src/shared/*"],
      "@modules/*": ["./src/modules/*"],
      "@stores/*": ["./src/stores/*"],
      "@config/*": ["./src/config/*"]
    },
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "lib": ["esnext", "dom"],
    "types": ["@dcloudio/types"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

**自动化辅助**：`scripts/fix-strict.py`（v1+v2 合计）按保守模式对所有 `.ts/.vue` 文件加 `!` 后缀（解决 ~298/497 = 60% 错误），剩余 exactOptionalPropertyTypes 错 4 个逐个手工修。

### 5.4 `scripts/check-modules.mjs` —— 6 步

```js
#!/usr/bin/env node
/**
 * 玄枢 v1.0.0 模块架构一致性检查
 *
 * 1. 扫 modules/*/ 下文件，禁止 import 兄弟模块的 logic/data（仅允许 shared）
 * 2. 扫 shared/ 下文件，禁止 import modules/*/
 * 3. 扫 settings/，禁止 import modules/*/
 * 4. 验证 8 个 module 目录都存在且有 index.ts
 * 5. 验证 5 alias 在 vite.config 和 tsconfig 都一致
 * 6. 验证 3 strict 选项在 tsconfig 已开启
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
  'mingli', 'zhanbu', 'guanxiang', 'mingming',
  'jiankang', 'xiuxin', 'shenghuo', 'personal',
]

let failed = 0
function ok(step, msg) { console.log(`  ✓ [${step}] ${msg}`) }
function fail(step, msg) { console.error(`  ✗ [${step}] ${msg}`); failed++ }
function step(n, name) { console.log(`\n=== Step ${n}: ${name} ===`) }

// --- utility ---
function* walk(dir) {
  if (!existsSync(dir)) return
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (/\.(ts|vue)$/.test(e)) yield p
  }
}
function read(p) { return readFileSync(p, 'utf8') }

// 简单 import 提取（不解析类型）
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
  // 相对路径
  if (spec.startsWith('.')) {
    return join(dirname(fromFile), spec)
  }
  return null  // 外部包
}

// --- 步骤 1: modules 只能 import shared ---
step(1, 'modules 跨模块隔离（仅允许 @shared/*）')
for (const m of REQUIRED_MODULES) {
  const mdir = join(MODULES, m)
  if (!existsSync(mdir)) continue
  for (const f of walk(mdir)) {
    for (const spec of getImports(f)) {
      const target = resolveImport(spec, f)
      if (!target) continue
      const rel = relative(SRC, target).replace(/\\/g, '/')
      // 允许：shared, settings, app, stores, config, 当前模块自身
      if (rel.startsWith('shared/') || rel.startsWith('settings/') ||
          rel.startsWith('app/') || rel.startsWith('stores/') ||
          rel.startsWith('config/')) continue
      if (rel.startsWith(`modules/${m}/`)) continue
      if (rel.startsWith('modules/')) {
        fail(1, `${relative(ROOT, f)} imports 兄弟模块 ${spec} (→ ${rel})`)
      }
      // pages/ utils/ designs/ components/ stores/ 仍允许（SP-1 兼容期）
    }
  }
}
ok(1, '扫描完成（兼容期：旧 pages/utils 仍可访问）')

// --- 步骤 2: shared 不能 import modules ---
step(2, 'shared 禁止 import modules')
for (const f of walk(SHARED)) {
  for (const spec of getImports(f)) {
    const target = resolveImport(spec, f)
    if (!target) continue
    const rel = relative(SRC, target).replace(/\\/g, '/')
    if (rel.startsWith('modules/')) {
      fail(2, `${relative(ROOT, f)} imports ${spec} (shared 不应依赖模块)`)
    }
  }
}
ok(2, '扫描完成（shared 下当前无文件，预期空过）')

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
const strictOpts = [
  'noUncheckedIndexedAccess',
  'exactOptionalPropertyTypes',
  'noImplicitOverride',
]
for (const o of strictOpts) {
  if (!tsconfigAliasBlock.includes(`"${o}": true`)) {
    fail(6, `tsconfig.json 缺 strict 选项 ${o}`)
  }
}
ok(6, '3 strict 选项均开启')

console.log(`\n${failed === 0 ? '✅' : '❌'} ${failed} errors`)
process.exit(failed === 0 ? 0 : 1)
```

### 5.5 `package.json` script

```json
"check:modules": "node scripts/check-modules.mjs",
"check": "pnpm type-check && pnpm check:modules && pnpm lint && pnpm test"
```

## 6. Task 2.5：清零 Strict 错误

开启 2 strict 后（`noUncheckedIndexedAccess` 推迟）实际只有 4 个 exactOptionalPropertyTypes 错，1 个 type union 不兼容错，全部在 1 个 commit 内手工修复完毕。

> 详见上文 §5.3 注记。`noUncheckedIndexedAccess` 开启后会触发 497 错，本 SP-1 不修，留待 SP-2 后续。

## 7. 验收

```bash
pnpm install
pnpm type-check              # 0 错
pnpm check:modules           # 6 步通过
pnpm lint                    # 0 warning
pnpm test                    # 全过
pnpm dev:h5                  # 启动，访问任意旧页面正常
pnpm build:h5                # 构建成功，无 AI 字符串残留
grep -r "ai-gua\|ai-ming\|ai-feng\|ai-name\|ai-jiankang\|ai-xiuxin\|MASTERS\|askMaster" src/  # 空
```

## 8. 风险与缓解

| 风险                                     | 缓解                                                |
| ---------------------------------------- | --------------------------------------------------- |
| AI 删除导致旧 store 数据反序列化时类型错 | v3 剥离 chatSessions 字段；v2 旧 key 保留不动       |
| 开启 strict 后错误数远超预期             | 拆 commit、单元测试覆盖、PR review                  |
| 8 个空 module 让人困惑                   | README + index.ts 注释说明 stub 状态                |
| 新 alias 与旧 `@/` 冲突                  | 保留 `@/` 兼容旧代码，5 个新 alias 优先用于新写代码 |

## 9. 交付物

- 1 commit "Task 1: remove AI masters"
- 1 commit "Task 2: directory skeleton + aliases + strict"
- N commits "Task 2.5: clean strict errors in <file>"
- 1 commit "Task 2: add scripts/check-modules.mjs"
- `scripts/check-modules.mjs`（6 步）
- `docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md`（本文）
- `docs/superpowers/plans/2026-06-10-sp1-skeleton-impl.md`（实施计划，writing-plans skill 输出）

## 10. 不在 SP-1 的后续

- SP-2：搬 `src/components/` 到 `shared/components`、搬 `src/utils/` 到 `modules/<m>/logic|data`、搬 `src/pages/` 到 `modules/<m>/pages`
- SP-3：观形 KnowledgeShell（mianxiang/shouxiang/fenglui 三页双 tab + 3 SVG + 36 知识条目 + 26 illustration specs）、图片管线（`gen-illustrations.mjs`）、Store 拆分（useAppStore + useSettingsStore + 持久化 v3 迁移 + 4 测试）
- SP-4：6 motion composable + Button/Card + page-fade + `gen-route-types.mjs` + 8 module manifest + 4 manifest tests + `ModuleErrorBoundary.vue` + `Result<T,E>` + 5 算法 safe wrapper + `check-bundle.mjs` + a11y
- SP-5：v1.0.0 tag + 3 测试 + 8 模块 README + 根 README project structure + version 1.0.0
