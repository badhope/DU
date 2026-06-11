# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versions follow [Semantic Versioning](https://semver.org/).

---

## [1.2.0] - 2026-06-11

### Added

- **TypeScript strict v2**: turn on 3 more strict options
  - `noPropertyAccessFromIndexSignature` (TS4111: dict key access)
  - `noFallthroughCasesInSwitch` (TS7029: switch fallthrough)
  - `noImplicitReturns` (TS2366: implicit return)
- **`docs/superpowers/specs/2026-06-11-sp7-strict-v2.md`**: SP-7 design spec
- **`docs/superpowers/plans/2026-06-11-sp7-strict-impl.md`**: SP-7 implementation plan

### Changed

- **`tsconfig.json`**: 3 → 6 strict options enabled
- **`package.json`**: version 1.1.0 → 1.2.0
- **4 source files**: fix 14 `TS4111` errors (astro.ts 10 + category.vue 1 + interpret.vue 2 + KnowledgeShell.vue 1)
- **`docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md`**: §5.3 标题更新为 "v1.2.0 全开"

---

## [1.1.0] - 2026-06-11

### Added

- **TypeScript strict**: turn on 3rd strict option `noUncheckedIndexedAccess` (closed SP-1 §5.3 deferral)
- **`scripts/fix-strict.mjs`**: AST-free pattern-matching auto-fix tool for common `noUncheckedIndexedAccess` errors (4 pattern types: chain access / typed record / destructured default / typed assignment)
- **`tests/scripts/fix-strict.test.ts`**: 6 tests covering all 4 fix patterns + 2 no-op cases
- **`docs/superpowers/specs/2026-06-11-sp6-strict-rewrite.md`**: SP-6 design spec
- **`docs/superpowers/plans/2026-06-11-sp6-strict-impl.md`**: SP-6 implementation plan

### Changed

- **`tsconfig.json`**: add `"noUncheckedIndexedAccess": true` (3 strict options now enabled)
- **`package.json`**: version 1.0.0 → 1.1.0
- **51 source files**: fix 193 `noUncheckedIndexedAccess` errors via 4 parallel subagents + `fix-strict.mjs` auto-fix
  - `src/modules/mingli/` (50 errors → 0)
  - `src/modules/zhanbu/` (45 errors → 0)
  - `src/modules/mingming/` + 5 small modules (78 errors → 0)
  - `src/shared/components/charts/` + `effects/` (20 errors → 0)
- **`docs/superpowers/specs/2026-06-10-sp1-skeleton-design.md`**: §5.3 / §6 注记更新 (v1.1.0 完成)

### Fixed

- **`scripts/fix-strict.mjs`**: remove unused `ROOT` constant (lint warning)

---

## [Unreleased]

### Security

- Fix `localStorage` key docs (`v1` → `v2`) to match `src/stores/index.ts`
- `package.json`: add `"private": true` to prevent accidental `npm publish`
- `package.json`: add `engines.node >=20` / `engines.pnpm >=10`
- `package.json`: add `author` field (`badhope <https://github.com/badhope>`)
- Add `pnpm audit` step to CI (block on high-severity prod deps, warn on dev)
- Add CodeQL workflow (`javascript-typescript`)
- gitleaks schedule: weekly → daily
- gitleaks: remove `continue-on-error` — leaked secrets now fail the build
- Add "Breaking change" and "CHANGELOG" required fields to PR template
- Add OG / Twitter / favicon meta and `robots.txt`
- `postbuild:h5`: copy `robots.txt` to `dist/build/h5/` root
- `vue-i18n` upgrade `^9.1.9` → `^9.1.11` (fix `Vue I18n Allows Prototype Pollution in handleFlatJson`)
- `vite` upgrade `5.2.8` → `5.4.20` (fix `launch-editor` command injection + `server.fs` bypass)
- `pnpm.overrides` force `jpeg-js@^0.4.4` / `@intlify/core-base@^9.1.11` / `@intlify/message-resolver@^9.1.11`, overriding uni-app's bundled 9.1.9

### Changed

- `author` changed from `Mistverse Team` to `badhope <https://github.com/badhope>`
- README directory listing: add workflows/codeql, tests, config files
- `robots.txt`: remove `Sitemap:` reference (pure static hash SPA has no separate sitemap)
- README: remove reference to non-existent `public/` directory
- **README full rewrite**: English-primary, Chinese-auxiliary; 11 sections (intro / 49 tools / quick start / tech stack / structure / contributing / security / deploy / FAQ / license / 中文简介)
- **Community files bilingualized**: `CONTRIBUTING.md` / `CODE_OF_CONDUCT.md` / `.github/SECURITY.md` / `.github/PULL_REQUEST_TEMPLATE.md` / `.github/ISSUE_TEMPLATE/{bug_report,feature_request,config}.yml` — all English-primary + Chinese-auxiliary
- **Repo meta**: `index.html` title / description / keywords / OG / Twitter / canonical → English-primary, `<html lang="en">`; `package.json` `description` → English; `src/manifest.json` name / description / `h5.title` → English
- **Tool key rename**: `src/config/tools.ts` — 古易心易 key `qimen` → `guyi` (avoid confusion with 奇门遁甲 which uses key `mingmen` + path `/pages/qimen/qimen`)
- **ToolKey type sync**: `src/stores/index.ts` ToolKey union updated `qimen` → `guyi`
- **Dead code removed**: `src/pages.json` — delete `easycom.custom` rule pointing to non-existent `src/components/mystic/` directory
- **Stale dependency removed**: `playwright` (unused, project uses vitest + happy-dom) and `prettier-plugin-vue` (Prettier has built-in Vue support since v3)
- **VSCode extensions cleaned**: remove `ms-playwright.playwright` and `bradlc.vscode-tailwindcss` recommendations (neither is used); add `bradlc.vscode-tailwindcss` to unwanted list
- **`.prettierignore` cleaned**: remove blanket `src/**` / `tests/**` / `README.md` / `CHANGELOG.md` / `.github/SECURITY.md` exclusions (temporary workaround from earlier PR, no longer needed)
- **`.git-blame-ignore-revs` populated**: add commit hashes for PR #22–#25 (bulk refactor/formatting commits)
- **Deleted file**: `security_best_practices_report.md` (one-off internal audit report; findings merged into `SECURITY.md` and `CHANGELOG.md`)

### Fixed

- **`daily-cooldown.ts`**: `qimen` → `mingmen` — cooldown for 奇门遁甲 was registered under wrong key, breaking daily limit (#25)
- **`eslint-config-prettier`**: add to resolve Prettier/ESLint `no-extra-semi` conflict (#24)
- **CI pnpm version**: all jobs updated from pnpm 9 to pnpm 10 to match lockfile format (#24)
- **`shime-uni.d.ts`**: rename to `shims-uni.d.ts` (typo fix) (#25)
- **Duplicate `.nvmrc`**: deleted (`.node-version` already exists) (#25)
- **Unused imports removed**: `calcBazi` (tieban), `TIANGAN`/`DIZHI` (wufu, hehun), `DIZHI`/`DiZhi` (xuankong), `DIZHI_WUXING` (yunshi, dayun-life), `TIANGAN_WUXING` (liuyao), `UserSwitcher` (bazi, hehun, qimen, tieban, xiaoliuren, xuankong, zhuge) (#24, #25)
- **Unused variables prefixed**: 51 files — all `@typescript-eslint/no-unused-vars` and `vue/no-unused-vars` warnings resolved with `_` prefix convention

## [1.0.1] - 2026-06-08

### Added

- Developer tooling: Prettier, ESLint, Vitest, Lefthook, commitlint, VSCode recommendations
- Scripts: `pnpm run lint` / `format` / `test` / `type-check` / `build:h5`
- CI split into format / lint / test / build jobs
- Lefthook pre-commit (prettier + eslint) / commit-msg (commitlint)
- `.editorconfig` / `.gitattributes` / `.gitignore` improvements
- `.github/ISSUE_TEMPLATE/config.yml`: disable blank issues

## [1.0.0] - 2026-06-08

### Added

- 49 core tools: Fate 6, Divination 6, Ancient Arts 5, Wellness 4, Cultivation 4, Life 4, Extended 14, AI Masters 6
- Multi-user management (one divination per user per tool per day)
- Ritual scan animation, AI master 3-stage animation
- GitHub Pages deployment (`actions/deploy-pages`)
- gitleaks secret scanning
- Open-source collaboration files: CONTRIBUTING, CODE_OF_CONDUCT, LICENSE (MIT)
- Branch protection: all changes must go through PR

### Security

- TypeScript strict mode
- gitleaks scanning on push / PR
- `localStorage` for user data isolation, no third-party analytics
