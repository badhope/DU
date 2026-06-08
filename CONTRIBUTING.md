# Contributing to MISTVERSE · 贡献指南

> Thanks for your interest in MISTVERSE! This document is bilingual: **English first**, then 中文.
> 欢迎参与 MISTVERSE！本文档中英双语，**英文在前，中文在后**。

---

## 1. Pull Request flow · 提 PR 流程

### English

1. **Fork** the repo, then create a branch off `main` (suggested naming: `feat/<scope>` / `fix/<scope>` / `docs/<scope>` / `chore/<scope>` / `refactor/<scope>` / `perf/<scope>` / `test/<scope>`).
2. Run `pnpm install` and verify locally:
   ```bash
   pnpm run type-check
   pnpm run lint
   pnpm run test
   pnpm run build:h5
   ```
3. **Push** your branch and open a PR against `badhope/mistverse:main`.
4. CI runs `format:check` → `lint` → `test` → `audit` → `type-check` → `build:h5` — **all 6 must pass** before review.
5. A maintainer will review; merges are squash-only and performed by the maintainer (see [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)).

### 中文

1. **Fork** 仓库，从 `main` 之外开分支（建议命名 `feat/<scope>` / `fix/<scope>` / `docs/<scope>` / `chore/<scope>` / `refactor/<scope>` / `perf/<scope>` / `test/<scope>`）。
2. 本地 `pnpm install` 后验证：
   ```bash
   pnpm run type-check
   pnpm run lint
   pnpm run test
   pnpm run build:h5
   ```
3. 推送分支 → 开 PR 到 `badhope/mistverse:main`。
4. CI 会跑 `format:check` → `lint` → `test` → `audit` → `type-check` → `build:h5` 六项，**全部通过** 才进入 review。
5. 维护者 review，仓库仅允许 squash 合并，由维护者执行（详见 [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)）。

---

## 2. Commit message convention · Commit 规范

Follow [Conventional Commits](https://www.conventionalcommits.org/). The `commitlint` + `lefthook` pre-commit hook will block non-conforming messages.

```
<type>(<scope>): <subject>            ← imperative, ≤72 chars, no trailing dot
<blank line>
<body>                                 ← what & why, wrap at 72 chars
<blank line>
<footer>                               ← BREAKING CHANGE: / Refs: / Closes:
```

| `type`     | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | New user-facing feature / tool                          |
| `fix`      | Bug fix                                                 |
| `docs`     | Docs only (README, CHANGELOG, comments)                 |
| `style`    | Formatting (Prettier-only)                              |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or fixing tests                                  |
| `chore`    | Build, deps, tooling, non-src changes                   |
| `ci`       | CI / GitHub Actions changes                             |
| `revert`   | Revert a previous commit                                |

Common `scope`s: `bazi`, `tarot`, `tools`, `ci`, `deps`, `docs`, `a11y`, `i18n`.

---

## 3. Pre-PR checklist · 提 PR 前

- [ ] 改了 `src/config/tools.ts` 的话，确保新增/删除工具的 entry 完整（name / desc / glyph / gradient / path / category）。
- [ ] 改了 `src/pages.json` 的话，新增/删除 page 配套。
- [ ] 改了 `src/utils/` 的话，至少跑通 `pnpm run type-check` 与 `pnpm run test`。
- [ ] 没有把 `node_modules` / `dist` / `.env*` / `*.local` / `test-*.cjs` 误提交（`.gitignore` 已防）。
- [ ] 单一 PR 单一主题；如有多项不相关改动，请拆 PR。
- [ ] Commit 规范、PR 模板都填了（破坏性变更、CHANGELOG、关联 Issue）。

---

## 4. Adding a new tool · 工具接入

A new tool requires changes in at most 5 places — keep them tight:

| File                                    | What to add                                                        |
| --------------------------------------- | ------------------------------------------------------------------ |
| `src/config/tools.ts`                   | One new entry in `TOOLS` (status, path, category, gradient, glyph) |
| `src/pages/<key>/<key>.vue`             | The page component                                                 |
| `src/utils/<name>.ts`                   | The algorithm / business logic                                     |
| `src/components/charts/<Name>Chart.vue` | (Optional) visualization component                                 |
| `src/pages.json`                        | Register the new route                                             |

If the new tool uses a new **category**, also add an entry to `CATEGORIES` in `src/config/tools.ts`.

---

## 5. Dependencies & tooling · 依赖更新

依赖与 GitHub Actions 升级由维护者手动完成。需要升级时开一个 `deps:` 前缀的 PR，并跑通 CI。

修改 `package.json` 时务必同步更新 `pnpm-lock.yaml`（`pnpm install`）。`pnpm.overrides` 用于强制覆盖 uni-app 内嵌的脆弱依赖（见 [`README.md`](README.md) §7 Security）。

---

## 6. Code style · 代码风格

- **TypeScript strict** is enforced by `pnpm run type-check`. Avoid `any`; use `unknown` + type guards when needed.
- **Vue 3** with `<script setup lang="ts">` only.
- **Prettier** (`pnpm run format`) + **ESLint** (`pnpm run lint:fix`) run automatically via Lefthook pre-commit.
- **No `v-html` / `innerHTML` / `eval` / `new Function`** — see security policy in [SECURITY.md](.github/SECURITY.md).
- All user-facing strings should be **bilingual** (English first, 中文 after) where practical.

---

## 7. Reporting issues · 反馈问题

- **Bug?** Use the [Bug report](../../issues/new?template=bug_report.md) template.
- **Feature idea?** Use the [Feature request](../../issues/new?template=feature_request.md) template.
- **Vulnerability?** **Do not** open a public issue. Use [Security Advisories](../../security/advisories/new) (see [SECURITY.md](.github/SECURITY.md)).
- **Just a question?** Go to [Discussions](https://github.com/badhope/mistverse/discussions).
