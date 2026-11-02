# Contributing to Tianji (DU)

Thanks for taking the time to contribute. This project has an unusual bar: it
sells itself on **verifiability**, so contributions are judged on whether the
claims they make can be checked, not only on whether the code runs.

[中文贡献指南见文末](#中文说明)

## Ground rules

1. **No data leaves the browser.** There is no backend and there will not be
   one. Do not add analytics, remote logging, telemetry, CDN-hosted fonts, or any
   network call other than same-origin static asset fetches. `npm run
   check:local-only` enforces this and will fail the build.
2. **No invented citations.** Every quoted passage must exist verbatim in the
   corpus shipped under `public/corpus`. `npm run verify:quotes` compares each
   static quotation against the shipped text and fails on any mismatch.
3. **Facts and interpretation stay separate.** A rule may read the deterministic
   chart (pillars, hexagram, moving line, body/use) but may never rewrite it.
4. **No fear-based copy, no medical/legal/financial advice, no death or
   serious-illness predictions, no face recognition.**
5. **Honest status.** A school is `planned` until its kernel has boundary rules,
   external worked examples and regression tests. Do not flip a status to make a
   page look more complete.

## Development setup

```bash
npm ci                 # Node 20+
npm run dev            # http://localhost:5173
npm run check          # the full gate — must pass before any PR
```

`npm run check` runs, in order: TypeScript, Vitest, quote verification, version
consistency, README consistency, production build, and the local-only scan.

Browser tests need a one-time Chromium download:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm exec playwright test
```

## What a good pull request looks like

- **One concern per PR.** A bug fix does not carry an unrelated refactor.
- **Tests that assert behaviour.** Assert what the user can observe — rendered
  text, stored state, returned values, thrown errors. Do not assert internal
  call counts or snapshot whole DOM trees.
- **Regression test for every bug fix.** If you fixed it, there is a test that
  would have failed before.
- **Comments explain why, not what.** If a line needs a comment to be readable,
  rename things instead.
- **Both lockfiles updated** if dependencies changed (`package-lock.json` and
  `pnpm-lock.yaml`).

## Adding a statement to the engine

Statements live in `src/engine/statements.ts` (seed) and
`src/engine/statements.library.ts` (library). Each entry needs:

| Field | Requirement |
| --- | --- |
| `id` | Stable, prefixed by kind (`canon-`, `psy-`, `stage-`, …) |
| `text` | The claim itself, in the master's voice |
| `domain` | One or more of the seven domains |
| `require` / `boost` / `ban` | Explicit feature conditions — no hand-waving |
| `baseRate` | Honest population applicability, 0–1. High rates are shown to the user as "generic" |
| `polarity` | `tough` entries **must** carry an `action` |
| `source` | `canon` entries need book, chapter and a verbatim quote |

Then run `npm run verify:quotes`. If your quote is not found, the corpus does not
contain it — do not adjust the corpus to fit the quote.

## Adding a school

1. Write the method card in `src/masters/registry.ts` with `status: 'planned'`
   and `kernel: 'none'`.
2. Implement the deterministic kernel under `src/core/`.
3. Add boundary tests: invalid input, edge timestamps, and at least two worked
   examples from an external source with expected values.
4. Only then switch `status` to `'active'` and `kernel` to the real value.

`tests/masters.spec.ts` locks the planned/active split; it will fail if you skip
a step.

## Commit messages

Imperative mood, present tense, no trailing period:

```text
fix: seal chart facts until the blind vote is cast
feat: add boundary tests for leap-month pillar derivation
docs: clarify Wilson lower bound in the leaderboard
```

Scope prefixes in use: `fix`, `feat`, `docs`, `test`, `chore`, `refactor`,
`perf`, `ci`.

## Reporting a security issue

Do not open a public issue. See [SECURITY.md](SECURITY.md).

## Code of conduct

Participation is covered by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## 中文说明

### 底线

1. **数据不出浏览器。** 不接后端、不加统计、不加远程日志、不用 CDN 字体。除同源
   静态资源外不得发起任何网络请求；`npm run check:local-only` 会拦住这类改动。
2. **不许编造引文。** 每条引文必须能在 `public/corpus` 中逐字找到；
   `npm run verify:quotes` 会逐字比对，对不上就失败。
3. **事实层与演绎层分离。** 规则可以读盘面，但不能改盘面。
4. **不写恐吓话术**，不给医疗/法律/投资建议，不预测死亡重病，不做人脸识别。
5. **状态要诚实。** 门派内核没有边界规则、外部原例和回归测试之前，只能标 `planned`。

### 开发

```bash
npm ci
npm run dev
npm run check      # 提交前必须全绿
```

`npm run check` 依次执行：TypeScript、Vitest、引文门禁、版本一致性、README
一致性、生产构建、本地模式扫描。

### 提交要求

- 一个 PR 只做一件事。
- 测试断言用户可观察的行为，不断言内部调用次数。
- 每个 bug 修复都配一条回归测试（修复前应当是失败的）。
- 依赖变更时两个锁文件都要更新。

### 新增断语

在 `src/engine/statements.ts` 或 `statements.library.ts` 里添加条目，必须写清
`require` / `boost` / `ban` 条件、真实的 `baseRate`、以及 `source`。`polarity:
'tough'` 的条目必须带 `action`。`canon` 条目必须提供书名、篇章和逐字原文，然后
跑 `npm run verify:quotes`。引文搜不到就是语料里没有这句话——不要为了迁就引文
去改语料。

### 新增门派

1. 在 `src/masters/registry.ts` 写方法卡，`status: 'planned'`、`kernel: 'none'`。
2. 在 `src/core/` 实现确定性内核。
3. 补边界测试：非法输入、边界时刻，以及至少两条来自外部的原例期望值。
4. 全部通过后才把 `status` 改为 `'active'`。

`tests/masters.spec.ts` 锁定了 planned/active 的划分，跳步会失败。
