# SP-2 Implementation Plan: 抽取 `src/shared/` 共享层

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 v1.0.1 扁平结构中的"通用 UI / 装饰 / 样式 / Composable / Helper"抽取到 `src/shared/` 共享层，建立 v1.1.0 模块化的根目录。模块专用组件（charts/ + BodyMap）留到 SP-3~5 模块化时同步处理。

**Architecture:** 创建 4 个 shared/ 子目录：
- `src/shared/components/ui/` — 9 个通用 UI 组件（CooldownDialog/LoadingSeal/MysticScan/ResultReveal/RipplePress/ToolGuard/TopBar/Typewriter/UserSwitcher）
- `src/shared/components/effects/` — 3 个跨模块装饰（Particles/StarField/TaijiBg）
- `src/shared/styles/` — 2 个 CSS（animations.css/tokens.css）
- `src/shared/composables/` — 1 个 Composable（use-cooldown.ts）
- `src/shared/components/ui/result-reveal-helpers.ts` — 抽离 `resolveHostEl` 工具函数

**Tech Stack:** uni-app x 3.0 + Vue 3.4 + TypeScript 6 + vitest + sed 批量改 import

---

### Task 1: 建 shared/ 目录结构 + TDD：写 resolveHostEl 测试

**Files:**
- Create: `src/shared/components/ui/result-reveal-helpers.ts`
- Test: `tests/components/result-reveal-helpers.test.ts`

- [ ] **Step 1: 创建 shared/ 子目录**

```bash
mkdir -p src/shared/components/ui \
         src/shared/components/effects \
         src/shared/styles \
         src/shared/composables
```

- [ ] **Step 2: 写失败的测试**

Create `tests/components/result-reveal-helpers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { resolveHostEl } from '@/shared/components/ui/result-reveal-helpers'

interface MaybeElInstance {
  $el?: HTMLElement | null
}

function makeEl(tag: string = 'div'): HTMLElement {
  return document.createElement(tag)
}

describe('resolveHostEl', () => {
  it('returns null for null', () => {
    expect(resolveHostEl(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(resolveHostEl(undefined)).toBeNull()
  })

  it('returns the element when given a raw HTMLElement', () => {
    const el = makeEl()
    expect(resolveHostEl(el)).toBe(el)
  })

  it('returns $el when given an instance ref', () => {
    const el = makeEl()
    const inst: MaybeElInstance = { $el: el }
    expect(resolveHostEl(inst)).toBe(el)
  })

  it('returns null when instance has no $el', () => {
    const inst: MaybeElInstance = { $el: null }
    expect(resolveHostEl(inst)).toBeNull()
  })

  it('returns null when $el is not an HTMLElement', () => {
    const inst = { $el: 'string-not-element' }
    expect(resolveHostEl(inst as unknown as MaybeElInstance)).toBeNull()
  })
})
```

- [ ] **Step 3: 跑测试确认 FAIL（resolveHostEl 不存在）**

```bash
pnpm test tests/components/result-reveal-helpers.test.ts
```

预期：FAIL — `Cannot find module '@/shared/components/ui/result-reveal-helpers'`

---

### Task 2: 实现 resolveHostEl + 测试通过

**Files:**
- Create: `src/shared/components/ui/result-reveal-helpers.ts`

- [ ] **Step 1: 实现 resolveHostEl**

Create `src/shared/components/ui/result-reveal-helpers.ts`:

```typescript
/**
 * 玄枢 MISTVERSE · 通用 DOM 工具
 *
 * Vue 3 setup 中的 ref 可能指向：
 * - 模板 ref → HTMLElement
 * - 组件实例 ref → { $el: HTMLElement, ... }
 * - 跨平台 uni-app 中：useTemplateRef 的值类型取决于渲染目标
 *
 * `resolveHostEl` 统一处理这两种情况，返回最终可操作的 DOM 元素。
 */

interface MaybeElInstance {
  $el?: HTMLElement | null
}

/**
 * 解析 ref 指向的最终 DOM 元素
 * @param refValue 模板 ref 或组件实例 ref
 * @returns HTMLElement 或 null
 */
export function resolveHostEl(
  refValue: HTMLElement | MaybeElInstance | null | undefined,
): HTMLElement | null {
  if (!refValue) return null
  if (refValue instanceof HTMLElement) return refValue
  const el = (refValue as MaybeElInstance).$el
  if (el instanceof HTMLElement) return el
  return null
}
```

- [ ] **Step 2: 跑测试确认 PASS**

```bash
pnpm test tests/components/result-reveal-helpers.test.ts
```

预期：6/6 PASS

- [ ] **Step 3: commit（仅 helpers + 测试）**

```bash
git add src/shared/components/ui/result-reveal-helpers.ts \
        tests/components/result-reveal-helpers.test.ts
git -c user.email="claude@anthropic.com" -c user.name="MISTVERSE Dev" commit -m "feat(shared): add resolveHostEl helper + tests"
```

预期：1 commit，lint/format 通过

---

### Task 3: 移动 ui/ 9 个组件到 shared/components/ui/

**Files:**
- Move: `src/components/ui/CooldownDialog.vue` → `src/shared/components/ui/CooldownDialog.vue`
- Move: `src/components/ui/LoadingSeal.vue` → `src/shared/components/ui/LoadingSeal.vue`
- Move: `src/components/ui/MysticScan.vue` → `src/shared/components/ui/MysticScan.vue`
- Move: `src/components/ui/ResultReveal.vue` → `src/shared/components/ui/ResultReveal.vue`
- Move: `src/components/ui/RipplePress.vue` → `src/shared/components/ui/RipplePress.vue`
- Move: `src/components/ui/ToolGuard.vue` → `src/shared/components/ui/ToolGuard.vue`
- Move: `src/components/ui/TopBar.vue` → `src/shared/components/ui/TopBar.vue`
- Move: `src/components/ui/Typewriter.vue` → `src/shared/components/ui/Typewriter.vue`
- Move: `src/components/ui/UserSwitcher.vue` → `src/shared/components/ui/UserSwitcher.vue`
- **保留**: `src/components/ui/BodyMap.vue`（jiankang 模块专用，SP-5 处理）

- [ ] **Step 1: git mv 9 个文件**

```bash
for f in CooldownDialog LoadingSeal MysticScan ResultReveal RipplePress \
         ToolGuard TopBar Typewriter UserSwitcher; do
  git mv "src/components/ui/${f}.vue" "src/shared/components/ui/${f}.vue"
done
git status --short 2>&1 | head -15
```

预期：9 行 `R` (rename)

- [ ] **Step 2: 用 ResultReveal.vue 替换 ref 多态（用 resolveHostEl）**

在 `src/shared/components/ui/ResultReveal.vue` 找到 `const el = hostRef.value` 类似的行，把它替换为：

```typescript
import { resolveHostEl } from './result-reveal-helpers'
// ...
const el = resolveHostEl(hostRef.value)
if (!el) return
```

如果 `el` 之前是 `hostRef.value.querySelectorAll(...)` 调用，确保替换后的 `el` 类型是 `HTMLElement | null`。

- [ ] **Step 3: ResultReveal.vue 修复 `'> *'` selector**

找到 `el.querySelectorAll(props.selector)`，把它改为：

```typescript
const items = props.selector === '> *' ? el.children : el.querySelectorAll(props.selector)
```

GSAP API 接受 `HTMLCollection`（`el.children`），也接受 `NodeListOf<Element>`（querySelectorAll），不需 `Array.from`。

- [ ] **Step 4: 验证移动后 type-check 仍然 0 错**

```bash
pnpm type-check
```

预期：可能错，因为旧 import 还没改。**记录所有报错文件**（用于 Task 5 批量改）

---

### Task 4: 移动 effects/ 3 个组件到 shared/components/effects/

**Files:**
- Move: `src/components/effects/Particles.vue` → `src/shared/components/effects/Particles.vue`
- Move: `src/components/effects/StarField.vue` → `src/shared/components/effects/StarField.vue`
- Move: `src/components/effects/TaijiBg.vue` → `src/shared/components/effects/TaijiBg.vue`

- [ ] **Step 1: git mv 3 个文件**

```bash
for f in Particles StarField TaijiBg; do
  git mv "src/components/effects/${f}.vue" "src/shared/components/effects/${f}.vue"
done
git status --short 2>&1 | head -15
```

预期：3 行 `R`

---

### Task 5: 移动 2 个 CSS 到 shared/styles/

**Files:**
- Move: `src/designs/animations.css` → `src/shared/styles/animations.css`
- Move: `src/designs/tokens.css` → `src/shared/styles/tokens.css`

- [ ] **Step 1: git mv 2 个文件**

```bash
git mv src/designs/animations.css src/shared/styles/animations.css
git mv src/designs/tokens.css src/shared/styles/tokens.css
git status --short 2>&1 | head -15
```

预期：2 行 `R`

- [ ] **Step 2: 检查 main.ts / App.vue 是否 import 这 2 个 CSS**

```bash
grep -rn "@/designs/\|designs/animations\|designs/tokens" \
  --include="*.ts" --include="*.vue" --include="*.json" --include="*.js" \
  src/ 2>&1
```

预期：1-2 个引用（main.ts 顶部 + 可能有 vite.config.ts）。记录位置。

---

### Task 6: 移动 use-cooldown.ts 到 shared/composables/

**Files:**
- Move: `src/utils/use-cooldown.ts` → `src/shared/composables/use-cooldown.ts`

- [ ] **Step 1: git mv**

```bash
git mv src/utils/use-cooldown.ts src/shared/composables/use-cooldown.ts
git status --short 2>&1 | head -3
```

预期：1 行 `R`

- [ ] **Step 2: 检查 use-cooldown 的内部 import**

读 `src/shared/composables/use-cooldown.ts`，看是否 import `@/utils/daily-cooldown` 之类。如果有，**保持原样**（utils/daily-cooldown 不动，留到 SP-10 修 bug 时统一处理）。

---

### Task 7: 批量改 47 个 import 路径

**Files:**
- Modify: 47 个 .vue 文件（所有 import `@/components/ui/X`、`@/components/effects/X`、`@/designs/X`、`@/utils/use-cooldown` 的文件）

- [ ] **Step 1: 写 Python 脚本批量改 imports**

```bash
python3 << 'PY'
import re
from pathlib import Path

mapping = {
    "@/components/ui/": "@/shared/components/ui/",
    "@/components/effects/": "@/shared/components/effects/",
    "@/designs/": "@/shared/styles/",
    "@/utils/use-cooldown": "@/shared/composables/use-cooldown",
    "components/ui/": "shared/components/ui/",
    "components/effects/": "shared/components/effects/",
}

files = []
for ext in ("*.vue", "*.ts"):
    files.extend(Path("src").rglob(ext))

changed = 0
for fp in files:
    s = fp.read_text(encoding="utf-8")
    new = s
    for old, repl in mapping.items():
        new = new.replace(old, repl)
    if new != s:
        fp.write_text(new, encoding="utf-8")
        changed += 1
        print(f"  modified: {fp}")
print(f"Total: {changed} files")
PY
```

预期：~47 个文件 modified（src/pages/* 中大部分）

- [ ] **Step 2: type-check 验证**

```bash
pnpm type-check
```

预期：0 错（如果还有错，多半是 Task 5 Step 2 的 main.ts 引用没改）

- [ ] **Step 3: 修 main.ts / vite.config.ts 引用（如有）**

如果 grep 之前发现 main.ts / vite.config.ts 引用了 `@/designs/...`，按相同规则 replace。

- [ ] **Step 4: test 验证**

```bash
pnpm test
```

预期：26/26 通过（之前 20 + 6 新增 resolveHostEl）

- [ ] **Step 5: build 验证**

```bash
pnpm build:h5
```

预期：DONE Build complete

---

### Task 8: 清理空目录

- [ ] **Step 1: 删 src/components/ui/ 空目录**

```bash
ls src/components/ui/ 2>&1  # 应该是空的 (只剩 BodyMap.vue)
ls src/components/ui/BodyMap.vue 2>&1  # 应该存在
```

预期：`src/components/ui/` 还剩 `BodyMap.vue` 一个文件，**保留**（SP-5 处理）

- [ ] **Step 2: 删 src/components/effects/ 空目录**

```bash
ls src/components/effects/ 2>&1
# 如果空，git 不跟踪空目录，自然消失
```

预期：原 `src/components/effects/` 已 git mv 到 shared，没有空目录

- [ ] **Step 3: 删 src/designs/ 空目录**

```bash
ls src/designs/ 2>&1
# 同上
```

预期：空

---

### Task 9: 验证 + Commit

- [ ] **Step 1: 全套验证**

```bash
pnpm type-check && pnpm test && pnpm build:h5
```

预期：全绿

- [ ] **Step 2: git status**

```bash
git status --short
```

预期：~50 个文件改动（9 R / 3 R / 2 R / 1 R + 47 modified imports）

- [ ] **Step 3: commit**

```bash
git add -A
git -c user.email="claude@anthropic.com" -c user.name="MISTVERSE Dev" commit -m "$(cat <<'EOF'
refactor: SP-2 抽取 src/shared/ 共享层

v1.1.0 模块化的根目录建立。

- src/shared/components/ui/: 9 个通用 UI 组件
  (CooldownDialog/LoadingSeal/MysticScan/ResultReveal/RipplePress/
   ToolGuard/TopBar/Typewriter/UserSwitcher) + resolveHostEl helper
- src/shared/components/effects/: 3 个跨模块装饰
  (Particles/StarField/TaijiBg)
- src/shared/styles/: 2 个 CSS (animations.css/tokens.css)
- src/shared/composables/: use-cooldown.ts

BodyMap.vue 留 src/components/ui/ 暂不动,SP-5 jiankang 模块化时
迁 modules/jiankang/components/。charts/ 24 个也留到 SP-3~5 模块化
时按归属迁 modules/*/components/。

47 个 import 路径批量改:
- @/components/ui/ → @/shared/components/ui/
- @/components/effects/ → @/shared/components/effects/
- @/designs/ → @/shared/styles/
- @/utils/use-cooldown → @/shared/composables/use-cooldown

type-check 0 错 / test 26-26 (含 6 新增 resolveHostEl) / build:h5 通过
EOF
)"
```

预期：1 commit，prettier/eslint/commitlint 通过
