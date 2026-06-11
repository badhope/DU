# 玄枢 v1.0.0 重做迁移 — SP-6 设计：noUncheckedIndexedAccess 全面开启

> 状态: draft · 待用户审 · v1.0.0 之后技术债清还
> 日期: 2026-06-11
> 承接: SP-1 §5.3 "noUncheckedIndexedAccess 推迟" 决议

## 1. 背景

v1.0.0 tag 已发布（`5b6e019`）。当前 tsconfig 开启了 2 个 strict 选项（`exactOptionalPropertyTypes` + `noImplicitOverride`），第 3 个 `noUncheckedIndexedAccess` 仍在 SP-1 §5.3 推迟状态：

> "原 spec 计划开 3 strict 选项。开启 `noUncheckedIndexedAccess` 后旧代码爆出 **497 个 TS 编译错误**，远超预估 50-80。覆盖 30+ 文件。本 SP-1 务实妥协：**保留 `exactOptionalPropertyTypes` + `noImplicitOverride`**，**关闭 `noUncheckedIndexedAccess`**。推迟到 SP-2 后续逐文件重构时再分阶段重开。"

SP-2 / SP-3 / SP-4 / SP-5 已重写大部分代码，新架构下 497 错可能已大幅减少。但实际错数必须实测。

本 SP-6 完成两件事：
1. **写自动化辅助脚本** `scripts/fix-strict.mjs`，把简单 `arr[i]` / `obj[key]` 错批量加 `!` 或 `as Type`
2. **分阶段开启 strict** + 逐步修复，5-10 个 commit 完成

## 2. 目标

完成后仓库具备：

1. **`noUncheckedIndexedAccess: true`** 在 tsconfig 已开启，**0 错** 通过 `pnpm type-check`
2. **自动化辅助脚本** `scripts/fix-strict.mjs` 可重复使用（不依赖 LSP，AST-free，模式匹配）
3. **保留 2 个现有 strict 选项** 不变
4. **业务逻辑零变化** — 仅类型标注调整
5. **35 个测试全过** + 5 项检查全绿

## 3. 范围与不在范围

### 在范围

- 开启 `noUncheckedIndexedAccess` strict
- 写 `scripts/fix-strict.mjs` AST-free 自动化修复
- 修复所有 .ts / .vue 中的 `noUncheckedIndexedAccess` 错
- 5-10 个 commit 拆分（按风险从低到高）
- 验证 `pnpm run check` 全绿
- 更新 spec / 移除 §5.3 推迟注记

### 不在范围（推迟）

- **不开启** `noPropertyAccessFromIndexSignature`（过严，会误伤 dict 类型的属性访问）
- **不动**业务逻辑、算法、数据结构
- **不重构**已 OK 的代码
- **不开** `noUnusedLocals` / `noUnusedParameters`（影响 vue template props）
- **不改** tsconfig 其他字段

## 4. 自动化辅助脚本 `scripts/fix-strict.mjs`

### 4.1 模式识别（4 类）

| # | 模式 | 例子 | 修复策略 |
|---|------|------|----------|
| A | `arr[i]` 直接传给函数 / 赋值 | `foo(arr[i])` | 加 `!`：`foo(arr[i]!)` |
| B | `arr[i].x` 链式访问 | `arr[i].name` | 拆 const + null check |
| C | `obj[key]` typed record 访问 | `map[key].x` | 补 `as T` 或 `?? defaultVal` |
| D | 解构默认值可推导 | `const { a = params[0] }` | 改用 `?? 'default'` |

### 4.2 保守模式

- **不确定的留 `// FIXME(strict)` 注释**，**不自动修改** — 手工 review 后处理
- **单文件处理** `pnpm exec node scripts/fix-strict.mjs <file>` 模式可重入
- **dry-run 模式** `--dry` 打印 diff 不写盘
- **不去格式化**（交给 prettier）

### 4.3 输出

- 错误日志到 `strict-fix.log`（含文件:行号 + before/after）
- 总计打印 N 处自动修复 / M 处需手工
- 退出码：0 全部 OK / 1 dry-run 有修改 / 2 错误

### 4.4 不做的事

- 不解析类型（不调 TS API）
- 不改 .vue 的 `<script setup>` 之外的 template / style
- 不改 node_modules
- 不改 `src/static/*` 资源

## 5. 分阶段 Commit 拆分

按风险从低到高，每 commit 后跑 `pnpm run check` 验证。

| # | Commit | 范围 | 预期错数 |
|---|--------|------|---------:|
| 1 | `chore(sp6): turn on noUncheckedIndexedAccess` | 改 tsconfig 1 行 | 200-500（基线） |
| 2 | `chore(sp6): fix utils + types (low-risk)` | `src/shared/utils/`, `src/shared/types/` | ~30 |
| 3 | `chore(sp6): fix shared/components (mid-risk)` | `src/shared/components/*` | ~50 |
| 4 | `chore(sp6): fix stores + config` | `src/stores/*`, `src/config/*` | ~30 |
| 5 | `chore(sp6): fix modules/mingli + zhanbu` | mingli (13 logic) + zhanbu (11 logic) | ~80 |
| 6 | `chore(sp6): fix modules/guanxiang + mingming` | guanxiang + mingming | ~40 |
| 7 | `chore(sp6): fix modules/jiankang + xiuxin + shenghuo + personal` | 后 4 模块 | ~40 |
| 8 | `chore(sp6): fix tests (vitest)` | `tests/**` | ~20 |
| 9 | `docs(sp6): update spec + remove §5.3 deferral` | 文档 | 0 |

**总 commit 数**：8-10（按实测错数可能 ±2）

## 6. Task 1：开启 strict（基线 commit）

```diff
// tsconfig.json
   "exactOptionalPropertyTypes": true,
   "noImplicitOverride": true,
+  "noUncheckedIndexedAccess": true,
```

跑 `pnpm type-check`，记录报错数到 commit message body。

**目标**：基线，**不修复**。

## 7. Task 2：写 `scripts/fix-strict.mjs`

按 §4 设计实现，单文件 ~200 行，纯 Node.js（不用 TypeScript 依赖），可读可改。

完成后写 `tests/scripts/fix-strict.test.ts`（3 个 fixture 测 4 类模式识别）。

## 8. Task 3-9：分阶段修复

每阶段按 §5 commit 拆分执行：

1. 跑 `node scripts/fix-strict.mjs <dir>` 自动修复 60-70%
2. 手工修剩下 30% 边界 / FIXME 注释
3. 跑 `pnpm run check` 验证全绿
4. `git add` + 写 commit

**判定完成**：`pnpm type-check` 报错数 = 0。

## 9. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 实际错数远超 200（仍可能有 400+） | 5/6/7 commit 进一步拆分（按 logic 文件逐个） |
| 自动化脚本误改 | dry-run 必走，PR review |
| 修类型影响运行时行为 | 严格用 `!`/`as`，不引入新逻辑分支 |
| 改 .vue template 类型 | 不在范围内，模板用 `as` 即可 |
| `Record<K, V>` 索引访问有 undefined | 加 `as V` 而非 `!`（更安全） |

## 10. 验收

```bash
pnpm run check                 # type-check / check-modules / lint / test 全绿
node scripts/fix-strict.mjs --dry   # dry-run 显示 0 处需要修复（已修完）
git tag v1.1.0                 # 发布 v1.1.0
```

## 11. 交付物

- 1 commit `chore(sp6): turn on noUncheckedIndexedAccess`
- 1 commit `feat(sp6): add scripts/fix-strict.mjs + 3 tests`
- 6-7 commit 分阶段修复
- 1 commit `docs(sp6): remove §5.3 deferral + update CHANGELOG`
- `scripts/fix-strict.mjs` (~200 行)
- `tests/scripts/fix-strict.test.ts` (3 测试)
- `docs/superpowers/specs/2026-06-11-sp6-strict-rewrite.md`（本文）
- `docs/superpowers/plans/2026-06-11-sp6-strict-impl.md`（实施计划）
- 1 tag `v1.1.0`

## 12. 后续

- **v1.1.0 之后**：可考虑开启 `noPropertyAccessFromIndexSignature`（影响小）+ `noFallthroughCasesInSwitch`（开/关影响都小）
- **CI 加强**：跑 `node scripts/fix-strict.mjs --dry` 在 CI，防回归
- **编辑器集成**：让 fix-strict.mjs 支持 watch 模式（dev 改文件自动修复）
