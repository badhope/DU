# SP-1 实施计划 — 去 AI + 新骨架 + Strict 错误清零

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把仓库从 pre-v1.0.0 旧结构迁移到"零 AI 残留 + v1.0.0 目录骨架就绪 + 3 strict 选项 0 错"状态。

**Architecture:** 保留 `src/pages/`、`src/utils/`、`src/config/`、`src/stores/` 旧文件不动（SP-2 搬移），本 SP-1 只做三件事：(1) 删 AI 实现并修补所有引用点；(2) 新建 `src/{app,shared,modules,settings}/` 骨架并配 5 alias + 3 strict；(3) 写 `check-modules.mjs` 6 步检查并清零开启 strict 后的所有编译错误。

**Tech Stack:** uni-app x 3.0 + Vue 3.4 + TypeScript 6 strict + Vite 8 + Pinia 3 + lefthook + vitest

**Spec:** [2026-06-10-sp1-skeleton-design.md](file:///workspace/docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md)

---

## 文件结构（SP-1 内变化）

### 删除

```
src/utils/ai.ts                              # 整个文件
src/pages/ai/                                # 整个目录
  ├── ai-feng.vue
  ├── ai-gua.vue
  ├── ai-jiankang.vue
  ├── ai-ming.vue
  ├── ai-name.vue
  └── ai-xiuxin.vue
```

### 新建

```
src/app/README.md                            # 跨模块装配占位
src/shared/README.md                         # 跨模块可复用占位
src/modules/README.md                        # 8 业务模块总览
src/modules/mingli/index.ts                  # 8 个 module stub
src/modules/zhanbu/index.ts
src/modules/guanxiang/index.ts
src/modules/mingming/index.ts
src/modules/jiankang/index.ts
src/modules/xiuxin/index.ts
src/modules/shenghuo/index.ts
src/modules/personal/index.ts
src/settings/index.ts                        # 设置模块 stub
src/settings/README.md
scripts/check-modules.mjs                    # 6 步架构检查
```

### 修改

```
src/utils/daily-cooldown.ts                  # 删 6 行 ai-* free
src/stores/index.ts                          # 删 10+ 处 AI 引用 + v2→v3 迁移
src/config/tools.ts                          # 删 6 个 ai-* 工具项
src/pages.json                               # 删 6 个 ai-* 路由
src/pages/poster/poster.vue                  # 删 AI UI 引用
src/pages/dashboard/dashboard.vue            # 删 AI UI 引用
vite.config.ts                               # 加 5 alias
tsconfig.json                                # 加 5 paths + 3 strict
package.json                                 # 加 check:modules + check script
```

---

## Task 1: 移除 AI 残留

**Files:**

- Delete: `src/utils/ai.ts`
- Delete: `src/pages/ai/` (entire dir)
- Modify: `src/utils/daily-cooldown.ts:64-69`
- Modify: `src/stores/index.ts` (10+ locations)
- Modify: `src/config/tools.ts` (删 6 工具项)
- Modify: `src/pages.json:340-386`
- Modify: `src/pages/poster/poster.vue`
- Modify: `src/pages/dashboard/dashboard.vue`

- [ ] **Step 1.1: 删除 ai.ts 和 pages/ai/ 目录**

```bash
rm -f src/utils/ai.ts
rm -rf src/pages/ai/
ls src/utils/ai.ts 2>&1   # 期望: No such file
ls src/pages/ai/ 2>&1     # 期望: No such file
```

- [ ] **Step 1.2: 验证删除后再 grep 一次确认无遗漏**

```bash
grep -rn "from '@/utils/ai'\|from '@/pages/ai/" src/ 2>&1
# 期望: 空输出
```

若仍出现引用 → 列出文件，保留在后续步骤处理（这些应是 pages/ai/ 自己，但已经删除，所以应为空）。

- [ ] **Step 1.3: 修改 daily-cooldown.ts — 删 6 行 ai-\* free**

打开 `src/utils/daily-cooldown.ts`，定位 line 64-69：

```ts
  'ai-gua': 'free',
  'ai-ming': 'free',
  'ai-feng': 'free',
  'ai-name': 'free',
  'ai-jiankang': 'free',
  'ai-xiuxin': 'free',
```

删除这 6 行，保留 `jiaobei: 'free',` 与 `poster: 'free',` 之间的空行（可选）。

- [ ] **Step 1.4: 验证 daily-cooldown.ts 已修**

```bash
grep -n "ai-gua\|ai-ming\|ai-feng\|ai-name\|ai-jiankang\|ai-xiuxin" src/utils/daily-cooldown.ts
# 期望: 空输出
```

- [ ] **Step 1.5: 修改 stores/index.ts — 改 ToolKey 联合类型**

打开 `src/stores/index.ts`，定位 line 78-83（在 `// AI 助手` 注释下方的 6 行 `| 'ai-*'`），整段替换为：

```ts
  // 个人中心
  | 'profile'
```

注释 `// AI 助手` 整段删除（包括上面那 6 行 `| 'ai-*'`）。

- [ ] **Step 1.6: 修改 stores/index.ts — 删 ChatSession interface**

定位 line 145-156，整段 `export interface ChatSession { ... }`（含 `// ============ AI 六师聊天会话 ============` 注释）整段删除。

- [ ] **Step 1.7: 修改 stores/index.ts — 删 PersistState.chatSessions 字段**

定位 line 183：

```ts
chatSessions: Record<string, ChatSession> // AI 六师聊天记录（按 masterKey 分组）
```

整行删除。

- [ ] **Step 1.8: 修改 stores/index.ts — 删 ai-master 成就**

定位 line 352-361（含 `// AI 玄谈` 注释下的 7 行成就对象）整段删除。

- [ ] **Step 1.9: 修改 stores/index.ts — 删 DEFAULT_STATE.chatSessions**

定位 line 392 `chatSessions: {},` 整行删除。

- [ ] **Step 1.10: 修改 stores/index.ts — 改 STORAGE_KEY 到 v3 + 加迁移逻辑**

定位 line 189 `const STORAGE_KEY = 'mistverse-state-v2'`，替换为：

```ts
const STORAGE_KEY = 'mistverse-state-v3'
const LEGACY_KEY = 'mistverse-state-v2'
```

定位 `loadState()` 函数（line 398-423），整段替换为：

```ts
function loadState(): PersistState {
  if (typeof window === 'undefined') return JSON.parse(JSON.stringify(DEFAULT_STATE))
  // 1) 优先 v3
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistState>
      return normalize(parsed)
    }
  } catch (_e) {}
  // 2) 回退 v2 → 剥离 chatSessions 后存 v3
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistState>
      // 显式丢弃 chatSessions 字段（类型已无此键）
      const next = normalize({ ...parsed, chatSessions: undefined as never })
      // 写回 v3，v2 保留不动
      saveState(next)
      return next
    }
  } catch (_e) {}
  return JSON.parse(JSON.stringify(DEFAULT_STATE))
}

function normalize(parsed: Partial<PersistState>): PersistState {
  return {
    history: Array.isArray(parsed.history) ? parsed.history : [],
    settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
    profile: parsed.profile || null,
    favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    achievements:
      Array.isArray(parsed.achievements) && parsed.achievements.length
        ? parsed.achievements
        : JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS)),
    checkin: parsed.checkin || { lastDate: '', streak: 0, totalDays: 0, points: 0 },
    divinationRecords: Array.isArray(parsed.divinationRecords) ? parsed.divinationRecords : [],
    divinatorProfiles: parsed.divinatorProfiles || {},
    activeDivinatorKey: parsed.activeDivinatorKey || '',
  }
}
```

- [ ] **Step 1.11: 修改 stores/index.ts — 删 chatSessions ref**

定位 line 441：

```ts
const chatSessions = ref<Record<string, ChatSession>>(initial.chatSessions)
```

整行删除。

- [ ] **Step 1.12: 修改 stores/index.ts — 改 watch 数组 + saveState 调用**

定位 line 446-475（watch 块），从 watch 数组中删除 `chatSessions,`（line 455），从 saveState 入参对象中删除 `chatSessions: chatSessions.value,`（line 469）。

- [ ] **Step 1.13: 修改 stores/index.ts — 删 5 个 chat 函数 + MAX 常量**

定位 line 582-622（含 `// ============ AI 六师聊天会话 ============` 注释 + 5 个函数 + `MAX_CHAT_MESSAGES` 常量），整段删除。

- [ ] **Step 1.14: 修改 stores/index.ts — 删 totalChatTurns / chattedMasters**

定位 line 754-764（两个 computed），整段删除。

- [ ] **Step 1.15: 修改 stores/index.ts — 删 resetAll 中 chatSessions 清理**

定位 line 864 `chatSessions.value = {}` 整行删除。

- [ ] **Step 1.16: 修改 stores/index.ts — 清理 return 中所有 AI 字段**

定位 line 878-949（return 对象），删除以下键：

- `chatSessions,`（line 887）
- 整段 `// chat` 注释（line 917） + 5 个 chat 函数（line 918-922）
- `totalChatTurns,`（line 898）
- `chattedMasters,`（line 899）

最终 return 块不应含 `chat` / `Chat` / `master` 任何残留。

- [ ] **Step 1.17: 验证 stores/index.ts 已无 AI 引用**

```bash
grep -n "ChatSession\|chatSessions\|chattedMasters\|totalChatTurns\|ai-master\|MASTER" src/stores/index.ts
# 期望: 空输出
```

- [ ] **Step 1.18: 修改 config/tools.ts — 删 6 个 ai-\* 工具项**

打开 `src/config/tools.ts`，定位 `TOOLS` 数组（搜索 `ai-gua`），删除以下 6 个对象：

```ts
  {
    key: 'ai-gua',
    ...
  },
  {
    key: 'ai-ming',
    ...
  },
  {
    key: 'ai-feng',
    ...
  },
  {
    key: 'ai-name',
    ...
  },
  {
    key: 'ai-jiankang',
    ...
  },
  {
    key: 'ai-xiuxin',
    ...
  },
```

每个对象约 8-10 行。删完后顶部 `// AI 助手` 注释一并删除。

- [ ] **Step 1.19: 验证 config/tools.ts 已修**

```bash
grep -n "ai-gua\|ai-ming\|ai-feng\|ai-name\|ai-jiankang\|ai-xiuxin" src/config/tools.ts
# 期望: 空输出
```

- [ ] **Step 1.20: 修改 pages.json — 删 6 个 ai-\* 路由**

打开 `src/pages.json`，定位 line 340-386，删除 6 个 `path: "pages/ai/ai-*"` 路由条目（含 style 子对象）。

- [ ] **Step 1.21: 验证 pages.json**

```bash
grep -c "pages/ai/" src/pages.json
# 期望: 0
node -e "const p=require('./src/pages.json'); console.log(p.pages.length, p.pages.filter(x=>x.path.startsWith('pages/ai/')).length)"
# 期望: 总数不变（48），ai 路由 = 0
```

- [ ] **Step 1.22: 定位 poster.vue 和 dashboard.vue 的 AI 引用**

```bash
grep -n "ai-gua\|ai-ming\|ai-feng\|ai-name\|ai-jiankang\|ai-xiuxin\|chattedMasters\|totalChatTurns\|AI 玄谈\|MASTERS\|askMaster" src/pages/poster/poster.vue src/pages/dashboard/dashboard.vue
```

记录每个文件的具体行号与上下文。

- [ ] **Step 1.23: 修改 poster.vue**

根据上一步的 grep 结果，从 `src/pages/poster/poster.vue` 中删除：

- 任何 `import { ... } from '@/utils/ai'`（应在文件顶部）
- 任何 `chattedMasters` / `totalChatTurns` 计算属性
- 任何引用 `ai-gua` / `ai-ming` / `ai-feng` / `ai-name` / `ai-jiankang` / `ai-xiuxin` 的代码
- 任何 "AI 玄谈" 文字区块

每处删除保持模板/脚本结构合法（不留空 `<view></view>` 包裹块）。

- [ ] **Step 1.24: 修改 dashboard.vue**

同 step 1.23，针对 `src/pages/dashboard/dashboard.vue`。

- [ ] **Step 1.25: 验证全仓无 AI 字符串残留**

```bash
grep -rn "ai-gua\|ai-ming\|ai-feng\|ai-name\|ai-jiankang\|ai-xiuxin\|MASTERS\|askMaster\|ChatSession\|chatSessions\|chattedMasters\|totalChatTurns" src/ 2>&1
# 期望: 空输出（除可能 src/stores/index.ts 的 v2→v3 迁移逻辑中 chatSessions 字样应已替换）
```

如仍有输出 → 列出文件并修复。

- [ ] **Step 1.26: 跑 type-check 确认 0 错（即使 strict 未开也应 0 错）**

```bash
pnpm type-check
# 期望: exit 0，无错误
```

如失败 → 修复（多数会是 ToolKey 类型未更新到所有 use 点）。

- [ ] **Step 1.27: 跑测试**

```bash
pnpm test
# 期望: 全过
```

- [ ] **Step 1.28: 构建验证**

```bash
pnpm build:h5 2>&1 | tail -20
# 期望: 成功，dist/ 产物中无 ai-gua/ai-ming/... 字符串
```

- [ ] **Step 1.29: 提交 Task 1**

```bash
git add -A
git status --short
git commit -m "$(cat <<'EOF'
feat: remove AI masters (Task 1)

- delete src/utils/ai.ts (35KB monolithic service)
- delete src/pages/ai/ (6 master pages)
- update daily-cooldown.ts: drop 6 ai-* free entries
- update stores/index.ts: drop ChatSession, chatSessions, 5 chat fns,
  2 computeds, ai-master achievement, ToolKey 6 ai-* keys
- add v2->v3 persistence migration: strip chatSessions from old state
- update config/tools.ts: drop 6 ai-* tool entries
- update pages.json: drop 6 ai-* routes
- update poster.vue + dashboard.vue: drop AI UI references

Part of 玄枢 v1.0.0 redo SP-1 (#??)
EOF
)"
```

---

## Task 2: 新目录骨架 + Alias + Strict

**Files:**

- Create: `src/app/README.md`
- Create: `src/shared/README.md`
- Create: `src/modules/README.md`
- Create: `src/modules/{mingli,zhanbu,guanxiang,mingming,jiankang,xiuxin,shenghuo,personal}/index.ts`
- Create: `src/settings/index.ts`
- Create: `src/settings/README.md`
- Create: `scripts/check-modules.mjs`
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`
- Modify: `package.json` (scripts)

- [ ] **Step 2.1: 创建 src/app/ 占位**

```bash
mkdir -p src/app
cat > src/app/README.md <<'EOF'
# app/

跨模块装配层：App 入口、router 编排、模块 manifest 注册。

SP-1 状态：占位。SP-2 起逐步搬入。
EOF
```

- [ ] **Step 2.2: 创建 src/shared/ 占位**

```bash
mkdir -p src/shared
cat > src/shared/README.md <<'EOF'
# shared/

跨模块可复用层：components / composables / types / utils / styles / data。

模块只能 import `@shared/*`，禁止反向。

SP-1 状态：占位。SP-2 搬入 assets。
EOF
```

- [ ] **Step 2.3: 创建 src/modules/README.md**

```bash
mkdir -p src/modules
cat > src/modules/README.md <<'EOF'
# modules/

8 个业务模块。模块之间禁止相互 import `logic/` 或 `data/`，仅允许通过 `@shared/*` 共享。

SP-1 状态：每个模块有 `index.ts` stub。SP-2 起搬入 `pages/` / `logic/` / `data/`。

| module | 中文 | 主题 |
|---|---|---|
| mingli | 命理 | 八字/五行/紫微/大运 |
| zhanbu | 占卜 | 梅卦/六壬/三式 |
| guanxiang | 观形 | 面/手/风水（SP-3 KnowledgeShell 化） |
| mingming | 命名 | 测字/起名 |
| jiankang | 健康 | 经络/养生/节气 |
| xiuxin | 修心 | 坐禅/冥想/拾句 |
| shenghuo | 生活 | 万年历/择吉/运势 |
| personal | 个人中心 | 首页/收藏/历史/玄枢台 |
EOF
```

- [ ] **Step 2.4: 创建 8 个 module stub index.ts**

写一个 bash 循环：

```bash
declare -A NAMES=(
  [mingli]="命理"
  [zhanbu]="占卜"
  [guanxiang]="观形"
  [mingming]="命名"
  [jiankang]="健康"
  [xiuxin]="修心"
  [shenghuo]="生活"
  [personal]="个人中心"
)
for m in mingli zhanbu guanxiang mingming jiankang xiuxin shenghuo personal; do
  mkdir -p "src/modules/$m"
  cat > "src/modules/$m/index.ts" <<EOF
/**
 * ${NAMES[$m]} 模块入口（SP-1 stub）
 *
 * TODO(SP-2): 搬移 pages / logic / data
 */
export const MODULE_KEY = '${m}' as const
export const MODULE_NAME = '${NAMES[$m]}' as const
EOF
done
```

- [ ] **Step 2.5: 验证 8 个 module 全部创建**

```bash
for m in mingli zhanbu guanxiang mingming jiankang xiuxin shenghuo personal; do
  test -f "src/modules/$m/index.ts" && echo "✓ $m" || echo "✗ $m MISSING"
done
# 期望: 8 行 ✓
```

- [ ] **Step 2.6: 创建 src/settings/**

```bash
mkdir -p src/settings
cat > src/settings/index.ts <<'EOF'
/**
 * 设置模块入口（SP-1 stub）
 *
 * TODO(SP-2): 搬移 pages/settings/settings.vue + 数据管理 UI
 */
export const MODULE_KEY = 'settings' as const
export const MODULE_NAME = '设置' as const
EOF

cat > src/settings/README.md <<'EOF'
# settings/

设置模块：主题、字体、字号、动效、数据管理、关于页。

SP-1 状态：占位。SP-2 搬入。
EOF
```

- [ ] **Step 2.7: 写 scripts/check-modules.mjs**

```bash
mkdir -p scripts
```

把 spec 文档 §5.4 中的 `check-modules.mjs` 完整代码写入 `scripts/check-modules.mjs`（约 150 行）。

- [ ] **Step 2.8: 验证 check-modules.mjs 可执行**

```bash
node scripts/check-modules.mjs
# 期望: 步骤 1-6 全过（除 alias 检查可能暂时失败，因 vite/tsconfig 还没改）
```

观察：步骤 5（alias 一致性）和步骤 6（strict 选项）应**失败**，因为还没改配置。其他步骤应过。

- [ ] **Step 2.9: 修改 vite.config.ts — 加 5 alias**

整文件替换为：

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

- [ ] **Step 2.10: 修改 tsconfig.json — 加 5 paths + 3 strict**

整文件替换为：

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
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "lib": ["esnext", "dom"],
    "types": ["@dcloudio/types"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

- [ ] **Step 2.11: 修改 package.json — 加 check:modules script**

定位 `"test": "vitest run"`，在它后面加：

```json
    "check:modules": "node scripts/check-modules.mjs",
```

加 `"check"` 脚本到 scripts 段最后：

```json
    "check": "pnpm type-check && pnpm check:modules && pnpm lint && pnpm test"
```

- [ ] **Step 2.12: 验证 check-modules.mjs 全过**

```bash
pnpm check:modules
# 期望: ✅ 0 errors
```

- [ ] **Step 2.13: 验证 type-check 0 错（strict 已开）**

```bash
pnpm type-check
# 期望: 报一堆错（Task 2.5 范围）
# 不要尝试在这一步修复，记录错误数。
```

- [ ] **Step 2.14: 验证 dev server 仍可启动**

```bash
pnpm dev:h5 &
PID=$!
sleep 8
# 期望: 看到 "ready in" 字样，无 fatal error
kill $PID
```

- [ ] **Step 2.15: 提交 Task 2**

```bash
git add -A
git status --short
git commit -m "$(cat <<'EOF'
feat: directory skeleton + 5 alias + 3 strict (Task 2)

- create src/{app,shared,modules,settings}/ with READMEs
- create 8 module stub index.ts (mingli/zhanbu/guanxiang/
  mingming/jiankang/xiuxin/shenghuo/personal)
- vite.config.ts: add @app/@shared/@modules/@stores/@config alias
- tsconfig.json: add 5 paths + 3 strict options
  (noUncheckedIndexedAccess, exactOptionalPropertyTypes,
   noImplicitOverride)
- scripts/check-modules.mjs: 6-step architecture check
- package.json: add check:modules + check scripts

BREAKING: strict options enabled, expect compilation errors
(handled in Task 2.5).

Part of 玄枢 v1.0.0 redo SP-1 (#??)
EOF
)"
```

---

## Task 2.5: 清零 Strict 错误

**Files:**

- Modify: any `.ts`/`.vue` files flagged by `pnpm type-check` (typically 50-80 files)

**Strategy:** 单文件单 commit，不批量 sed，不允许 `@ts-ignore`。

- [ ] **Step 2.5.1: 扫描实际错误数**

```bash
pnpm type-check 2>&1 | tee /tmp/strict-errors.txt
grep -c "error TS" /tmp/strict-errors.txt
# 记录: ERR_COUNT=N
```

如 N ≤ 20：全列出来逐个修。
如 N > 20：按"高频文件优先"原则分组修复（见下）。

- [ ] **Step 2.5.2: 列出错误最多的 5 个文件**

```bash
grep "error TS" /tmp/strict-errors.txt | sed -E 's/^(.+)\(.+\).*/\1/' | sort | uniq -c | sort -rn | head -5
# 例输出: 12 src/utils/ai.ts (但已删, 所以不会出现)
#        8 src/utils/daily-cooldown.ts
#        5 src/utils/poster-renderer.ts
#        ...
```

- [ ] **Step 2.5.3: 修复文件 F1（错误数最多的那个）**

打开文件 F1，定位第一个 TS 错误：

```
src/utils/daily-cooldown.ts(45,12): error TS2532: Object is possibly 'undefined'.
```

修复模式（按错误类型选其一）：

**类型 A: 数组索引 `arr[i]` 返回 `T | undefined`**

```ts
// 改前
const x = arr[i]
// 改后（已知 arr.length > i）
const x = arr[i]!
// 或加 guard
const x = arr[i]
if (x === undefined) throw new Error('expected element')
// 或
const first = arr[0] ?? defaultValue
```

**类型 B: 可选属性传 undefined**

```ts
// 改前
function f(opts: { a?: string }) {
  return opts.a
}
// 改后
function f(opts: { a?: string }) {
  return opts.a ?? ''
}
```

**类型 C: 缺 override**

```ts
// 改前
class B extends A {
  method() {
    return 1
  }
}
// 改后
class B extends A {
  override method() {
    return 1
  }
}
```

**类型 D: 隐式 any**

```ts
// 改前
arr.map((x) => x.foo)
// 改后
arr.map((x: SomeType) => x.foo)
```

每个文件改完，单独 commit：

```bash
pnpm type-check  # 错误数应减少
git add <file>
git commit -m "fix(types): clean strict errors in <filename> (Task 2.5)"
```

- [ ] **Step 2.5.4: 重复 step 2.5.3 处理剩余文件**

循环：

```bash
pnpm type-check 2>&1 | tee /tmp/strict-errors.txt
N=$(grep -c "error TS" /tmp/strict-errors.txt)
echo "Remaining: $N"
if [ $N -gt 0 ]; then
  grep "error TS" /tmp/strict-errors.txt | head -1
  # 修复...
fi
```

直到 N = 0。

- [ ] **Step 2.5.5: 跑全部验证**

```bash
pnpm type-check      # 0 错
pnpm check:modules   # 6 步通过
pnpm lint            # 0 warning
pnpm test            # 全过
```

- [ ] **Step 2.5.6: 跑最终构建**

```bash
pnpm build:h5 2>&1 | tail -20
# 期望: 成功
```

- [ ] **Step 2.5.7: 提交（最后一个 strict fix 的 commit 已在 2.5.4 中提交，此处不再额外 commit）**

如所有 2.5.3-2.5.4 commit 都已提交，本步骤为空。

---

## 验收（SP-1 完成态）

```bash
# 1. 零 AI 残留
grep -rn "ai-gua\|ai-ming\|ai-feng\|ai-name\|ai-jiankang\|ai-xiuxin\|MASTERS\|askMaster\|ChatSession\|chatSessions" src/ 2>&1
# 期望: 空输出

# 2. 新骨架就位
ls -d src/{app,shared,modules,settings}
ls src/modules/*/index.ts | wc -l   # 期望: 8
test -f scripts/check-modules.mjs    # 期望: exit 0

# 3. Alias + strict 配置齐
grep -E '"@app/\*"|"@shared/\*"|"@modules/\*"|"@stores/\*"|"@config/\*"' tsconfig.json
# 期望: 5 行
grep -E "noUncheckedIndexedAccess|exactOptionalPropertyTypes|noImplicitOverride" tsconfig.json
# 期望: 3 处

# 4. 全栈验证
pnpm type-check && pnpm check:modules && pnpm lint && pnpm test && pnpm build:h5
# 期望: 全部 0 错 / 通过
```

## 不在 SP-1 范围

SP-1 不动 `src/components/` `src/pages/` `src/utils/` `src/config/` 现有文件位置。SP-2 起搬移到 `src/shared/` 和 `src/modules/<m>/` 下。

## 风险与缓解

| 风险                             | 缓解                                                          |
| -------------------------------- | ------------------------------------------------------------- |
| strict 错误数远超预期（>100）    | 一次只改一文件，commit-by-commit；每个 commit 后跑 type-check |
| v2 数据迁移丢失用户 chatSessions | v2 key 保留不动，仅剥离字段并写 v3；不删除 v2 原始数据        |
| 8 个空 module 让人困惑           | README + index.ts 注释说明 stub 状态；SP-2 起填实质           |
| 新 alias 与旧 `@/` 冲突          | 保留 `@/` 兼容；新写代码用 5 个新 alias                       |

## 交付物清单

- [ ] 1 commit "Task 1: remove AI masters"
- [ ] 1 commit "Task 2: directory skeleton + 5 alias + 3 strict"
- [ ] N commits "fix(types): clean strict errors in <file>" (N = 5-15)
- [ ] `scripts/check-modules.mjs` (6 步)
- [ ] `docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md` (已 commit)
- [ ] `docs/superpowers/plans/2026-06-10-sp1-skeleton-impl.md` (本文件)

## 下一 SP

- [ ] SP-2: shared 资产搬移 + utils 按模块拆 + pages 搬移（Task 3+4+5）
- [ ] SP-3: 观形 KnowledgeShell + 图片管线 + Store 拆分 + 持久化迁移（Task 6+7+8）
- [ ] SP-4: 6 motion composable + 路由类型 + 错误边界（Task 9+10+11）
- [ ] SP-5: v1.0.0 tag + README + 测试收尾（Task 12）
