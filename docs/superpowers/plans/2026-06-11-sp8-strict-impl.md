# SP-8 实施计划 — 4 个新 Strict 选项补完

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 开启 TypeScript strict 4 个新选项（`useUnknownInCatchVariables` + `noImplicitThis` + `strictBindCallApply` + `strictPropertyInitialization`），修复所有新错，发布 v1.3.0。

**Architecture:** 复用 SP-6/7 模式：开启 → 测基线 → 分阶段 commit 修复（按 strict 选项从最大宗到最小宗） → 文档 + tag。

**Tech Stack:** TypeScript 6 strict (10 选项) + vitest + lefthook

**Spec:** [2026-06-11-sp8-strict-v3.md](file:///workspace/docs/superpowers/specs/2026-06-11-sp8-strict-v3.md)

---

## 文件结构（SP-8 内变化）

### 修改

```
tsconfig.json                  # +4 行 strict
src/stores/app.ts              # 修 catch / class（大概率 0-3 错）
src/stores/settings.ts         # 修 catch
src/shared/utils/result.ts     # 修（如需）
src/modules/*/logic/*.ts       # 修 class 属性（如有）
src/modules/*/pages/*.vue      # 修（如有）
package.json                   # version 1.2.0 → 1.3.0
CHANGELOG.md                   # +v1.3.0 段
docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md  # §5.3 标题更新
```

---

## Task 1: 开启 4 strict 选项 + 测基线

**Files:**
- Modify: `tsconfig.json` (在 `noImplicitReturns` 之后加 4 行)

- [ ] **Step 1: 编辑 tsconfig.json**

```diff
   "noPropertyAccessFromIndexSignature": true,
   "noFallthroughCasesInSwitch": true,
   "noImplicitReturns": true,
+  "useUnknownInCatchVariables": true,
+  "noImplicitThis": true,
+  "strictBindCallApply": true,
+  "strictPropertyInitialization": true,
```

- [ ] **Step 2: 跑 type-check 测基线错数**

```bash
pnpm type-check 2>&1 | grep -cE "error TS"
```

- [ ] **Step 3: 跑按错类型分类**

```bash
pnpm type-check 2>&1 | grep -oE "error TS[0-9]+" | sort | uniq -c | sort -rn
```

预期：
- TS2722: Property 'X' has no initializer（最大宗）
- TS18046: 'e' is of type 'unknown'
- TS2683: 'this' implicitly has type 'any'
- TS2345: Argument of type ... is not assignable to parameter

- [ ] **Step 4: Commit 基线**

```bash
git add tsconfig.json
git commit -m "chore(sp8): turn on 4 new strict options baseline"
```

---

## Task 2-4: 分阶段修复（模式相同）

每个 Task 步骤：

- [ ] **Step 1: 列出该类型错**

```bash
pnpm type-check 2>&1 | grep "TS<NUMBER>"
```

- [ ] **Step 2: 逐个手工修**

策略（按错类型）：
- **TS2722** (class 属性)：加 `!` 或在 constructor 中赋值
- **TS18046** (unknown)：加 `if (e instanceof Error)` 守卫或 `(e as Error)`
- **TS2683** (this)：加 `this: { ... }` 注解或改用 arrow function
- **TS2345** (bind/call/apply)：调整参数类型匹配签名

- [ ] **Step 3: 跑 pnpm check 验证**

```bash
pnpm type-check 2>&1 | grep -c "TS<NUMBER>"
```

**Expected:** 0。

- [ ] **Step 4: Commit**

```bash
git add <files>
git commit -m "chore(sp8): fix <strict option name> errors"
```

按预期错数从大到小顺序：
- Task 2: `strictPropertyInitialization`（最大宗，3-10 错）
- Task 3: `useUnknownInCatchVariables`（0-3 错）
- Task 4: `noImplicitThis` + `strictBindCallApply`（0-5 错，可合并）

如果某 Task 错数 = 0 跳过该 commit。

---

## Task 5: 文档收尾 + v1.3.0 release

**Files:**
- Modify: `CHANGELOG.md`（+ v1.3.0 段）
- Modify: `package.json`（version 1.2.0 → 1.3.0）
- Modify: `docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md`（更新 §5.3 标题）

- [ ] **Step 1: 更新 package.json version**

```diff
- "version": "1.2.0",
+ "version": "1.3.0",
```

- [ ] **Step 2: 加 CHANGELOG.md v1.3.0 段**

在 `## [1.2.0] - 2026-06-11` 之前插入：

```md
## [1.3.0] - 2026-06-11

### Added

- **TypeScript strict v3**: turn on 4 more strict options
  - `useUnknownInCatchVariables` (TS18046: catch error type)
  - `noImplicitThis` (TS2683: implicit this)
  - `strictBindCallApply` (TS2345: bind/call/apply type)
  - `strictPropertyInitialization` (TS2722: class property init)
- **`docs/superpowers/specs/2026-06-11-sp8-strict-v3.md`**: SP-8 design spec
- **`docs/superpowers/plans/2026-06-11-sp8-strict-impl.md`**: SP-8 implementation plan

### Changed

- **`tsconfig.json`**: 6 → 10 strict options enabled
- **`package.json`**: version 1.2.0 → 1.3.0

---
```

- [ ] **Step 3: 更新 SP-1 spec §5.3 标题**

```diff
- ### 5.3 `tsconfig.json` —— 5 paths + 6 strict（v1.2.0 全开）
+ ### 5.3 `tsconfig.json` —— 5 paths + 10 strict（v1.3.0 全开）
```

- [ ] **Step 4: 最终验证**

```bash
pnpm run check
pnpm build:h5 2>&1 | tail -3
```

**Expected:** 5 项全绿，build 成功。

- [ ] **Step 5: Commit + Tag**

```bash
git add package.json CHANGELOG.md docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md
git commit -m "docs(sp8): v1.3.0 release + 10 strict options"
git tag v1.3.0 -m "v1.3.0: 10 strict options (4 new)"
```

---

## 自检

- ✅ Spec 覆盖率：§6/7/8/9 全部对应 Task
- ✅ 无占位符
- ✅ 类型一致
- ✅ 验收标准：Task 5 Step 4 明确 `pnpm run check` + `pnpm build:h5`

---

直接进入实施（沿用 SP-6/7 节奏：开启 → 测基线 → 分阶段修复 → 文档 + tag）。
