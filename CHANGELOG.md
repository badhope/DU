# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2026-11-04

The "optional backend mode" shipped in 0.4.0 was not connected. It probed
`/api/health`, showed "SERVER" in settings, and then wrote everything to
`localStorage` anyway. Status was real; behaviour was not.

### Fixed

- **Backend mode is actually wired.** `src/composables/ledger.ts` is now the
  single read/write entry point for every page. It dispatches to `localStorage`
  or the HTTP API depending on the probed mode, so no page can be left behind.
  Ask, arena, leaderboard, ledger, master cards, home stats and settings export
  all route through it.
- Backend-mode E2E proves the writes land in SQLite, not just that the UI says
  so: `e2e/backend.spec.ts` starts a real `tianji serve`, asks a question through
  the browser, and then asserts `/api/session` reports one more match. Verified
  by forcing the facade back to local-only — four of the five tests fail.
- Voting in server mode is a network round trip, so a double click could fire
  two requests and surface a spurious "already voted" error. The vote buttons
  now lock while in flight.

### Changed

- `playwright.backend.config.ts` runs the packaged `tianji serve` rather than the
  vite dev server, so the test covers the shape users actually run.
- Architecture boundary table updated: `composables` may depend on `arena`
  (the ledger facade needs it), which the gate itself flagged.

## [0.4.0] - 2026-11-04

The engine grew three more hosts. Web, CLI, desktop and MCP now share one
computation layer, so a reading is identical wherever you ask for it.

### Added

- **CLI** (`tianji`). `ask`, `masters`, `ledger`, `resolve`, `report`, `export`,
  `import`, `serve`, `doctor`. Every command supports `--json`, exit codes follow
  Unix convention (0/1/2), and `--no-save` gives a preview without touching the
  ledger.
- **Desktop app**: a 96 MB single-file `tianji.exe` built with Node SEA, carrying
  the web UI as embedded assets. No Node install, no Electron. `tianji serve`
  opens the full site with an HTTP API behind it.
- **MCP server** (`tianji mcp`), built on the official
  `@modelcontextprotocol/sdk` over stdio. Five tools (`tianji_ask`,
  `tianji_masters`, `tianji_ledger`, `tianji_resolve_claim`, `tianji_session`)
  and two resources. No port, no network, no auth.
- **SQLite ledger** for Node hosts via built-in `node:sqlite` — no native module,
  which keeps the SEA binary portable.
- **Shared runtime** (`src/runtime/`): the blind-match logic moved out of the
  browser-only path into a host-agnostic module. `tests/runtime.spec.ts` proves
  Node and browser produce byte-identical readings from the same seed.
- Optional backend mode for the web app: it probes same-origin `/api/health` once
  with an 800 ms timeout and silently falls back to `localStorage`.
- `scripts/build-all.mjs`: one command builds web, CLI, MCP and the executable.

### Fixed

- The HTTP API returned `masterId`, chart facts, sources and claim IDs even when
  it set `revealed: false`. Anonymity is now structural: `sealMatch` strips every
  identity-bearing field, verified by an E2E assertion that greps the payload for
  all four leak vectors.
- `SqliteLedgerStore.saveMatch` used `INSERT OR IGNORE`, so a vote written after
  the first save was silently dropped. It now merges vote state in one direction
  only — never overwriting an existing vote.
- The CLI printed chart facts and sources in anonymous mode while the web UI
  sealed them. Both hosts now apply the same rule.
- Version strings were hardcoded in three files; they now come from
  `package.json` at build time through a single injected constant.
- `node:sea`'s `getAsset` rejects the `'binary'` encoding. Assets are read with
  the default ArrayBuffer return instead.

### Changed

- Runners and Playwright pinned (`ubuntu-24.04`, `1.64.1`) after
  `ubuntu-latest` moved to 26.04 and broke the browser install.
- README rewritten for the four-host story: run table, loop diagram, gate table.

## [0.3.1] - 2026-11-03

Reliability pass: the app now tells you when it cannot save, guards the shipped
corpus against silent corruption, and lets you take a reading out of the browser.

### Added

- **Local report export.** After voting, a reading can be saved as a
  self-contained HTML file; the claim ledger has the same option. Files inline
  all CSS, reference nothing external, declare `noindex`, and escape every piece
  of user-supplied text — imported JSON is untrusted input, so a crafted
  question cannot inject markup into the export.
- `scripts/check-corpus.mjs`: verifies that the manifest's claimed chapter counts
  and character totals match the JSON actually shipped. Verified by corrupting a
  manifest entry and confirming the gate fails. Wired into `npm run check`.
- Storage-failure reporting: `localStorage` writes that fail now surface as
  `quota` or `blocked` instead of being swallowed, and the ask page tells the
  user the record was not saved and points at export-then-prune.

### Fixed

- **Dependency audit: 5 moderate → 0.** All five came from one test-only chain
  (`@vue/test-utils` → `js-beautify` → `editorconfig` → `minimatch`/`glob`).
  Pinned `minimatch@^11.0.4` and `glob@^14.0.3` via `overrides` rather than
  downgrading the test library or accepting the advisories.
- The `v0.3.0` tag pointed at a commit that predated the CI-runner fix; version
  and changelog had drifted from the released tree.
- CI has a `workflow_dispatch` trigger. Refs created through the Git Data API do
  not emit a `push` event, so without a manual entry point a branch could exist
  with no way to run the gate against it.

## [0.3.0] - 2026-11-03

Navigation could go permanently blank, and the project had no way to stop its own
architecture from eroding. Both are fixed, and the repo now carries the files a
maintainer expects to find.

### Fixed

- **Blank screen on every in-app navigation.** `<Transition mode="out-in">` around
  the router view waited for the leaving page's animation to finish before mounting
  the next one. When that transition never completed, `<main>` stayed on an empty
  comment node — clicking any nav link from the home page produced a blank page.
  The transition wrapper is replaced with a keyed container plus a CSS enter
  animation, which cannot block mounting. Covered by an E2E test that clicks real
  nav links and fails if the target page does not render.
- Pages with multiple template root nodes (`Home`, `ToolPage`) were wrapped in a
  single root element; Vue cannot animate a fragment and warned about it on every
  render.

### Added

- `scripts/check-boundaries.mjs`: enforces the import table from
  `docs/ARCHITECTURE.md` in CI. Verified by deliberately adding a forbidden import
  and confirming the gate fails.
- Skip-to-content link, `:focus-visible` ring, per-route `document.title`, focus
  restoration to `<main>` on navigation, and `noscript` fallback.
- Print stylesheet: white background, navigation and vote controls hidden, link
  targets printed inline, blocks kept from splitting across pages.
- `ROADMAP.md` with shipped / next / explicitly-not-planned sections.
- `.editorconfig`, `.gitattributes`, `.nvmrc`, and a grouped monthly
  `dependabot.yml` (major version bumps excluded from automated PRs).
- Richer `<meta>`: Open Graph tags, referrer policy, stricter CSP
  (`object-src 'none'`, `base-uri 'self'`, `form-action 'none'`).

### Changed

- E2E suite grown to 15 scenarios: accessibility, 404 recovery, print media,
  navigation regression, plus the existing flow coverage.
- Playwright pinned to 1.64.1 and CI runners pinned to `ubuntu-24.04`.
  GitHub's `ubuntu-latest` moved to 26.04, which Playwright 1.55 has no browser
  build for, so the E2E job failed at install time. A CI image that changes
  under the project is not a reproducible gate.
- The Pages deploy workflow now runs `npm run check` instead of a hand-copied
  command list, which had already drifted (it was missing the version and
  boundary gates).
- Screenshot generation is excluded from `npm run test:e2e` by default so runs do
  not dirty the working tree with sub-pixel rasterisation differences; use
  `npm run screenshots` to regenerate deliberately.

## [0.2.0] - 2026-11-02

Blind evaluation now actually blinds, and every published citation is machine-checked.

### Added

- `src/ui/AnswerCard.vue`: single answer renderer that seals the chart-facts and
  source sections until the user votes, so a school can no longer be identified
  from its own output before scoring.
- `tests/blind.spec.ts`: 11 assertions covering randomised A/B ordering,
  cross-answer statement exclusion, empty-section removal, per-kernel fact
  scoping, and citation provenance.
- `scripts/gen-readme.mjs` now generates a bilingual README from the same
  registries that drive the UI, so the docs cannot drift from the code.

### Changed

- `src/ai/offline.ts`: removed the per-master opening line that named each
  school's method; both masters now open with the same neutral sentence.
- `runBlindMatch` shuffles the display order of the two masters and passes the
  first answer's statement ids to the second as an exclusion set.
- `MasterAnswer.statementIds` and `Citation.origin` are now part of the
  contract, so provenance is data rather than a rendering guess.
- Import validation in `src/arena/store.ts` now validates nested citations,
  sections, facts and answers instead of only top-level counters.
- Exported JSON carries a `schema` version field.

### Fixed

- Citations retrieved from the shipped corpus were labelled `unverified` while
  unverified static text was labelled `verified`. The condition was inverted.
- The home page rendered the legacy tool card without any styling, causing the
  heading and body text to overlap.
- A master with no matching chart fact rendered an empty "chart facts" heading.
- Both masters in one match could emit the same statement, and both wrote an
  identical claim into the ledger, forcing the user to resolve it twice.

## [0.1.0] - 2026-11-01

First local-only release.

### Added

- Static Vue 3 + Vite + TypeScript platform with hash routing and no backend.
- Two verified fact kernels: Zi Ping four pillars (`lunar-typescript`) and
  Mei Hua Yi Shu (plum blossom numerology).
- Blind two-master evaluation, local Elo rating with Wilson lower bound,
  and a claim ledger with manual resolution.
- Offline canon reader over 12 public-domain classics (1.87M characters)
  shipped in-repo, with runtime quote verification.
- `npm run check` gate: typecheck, unit tests, quote verification, README
  consistency, production build and a local-only source scan.

[Unreleased]: https://gitcode.com/badhope/DU/compare/v0.4.1...HEAD
[0.4.1]: https://gitcode.com/badhope/DU/compare/v0.4.0...v0.4.1
[0.4.0]: https://gitcode.com/badhope/DU/compare/v0.3.1...v0.4.0
[0.3.1]: https://gitcode.com/badhope/DU/compare/v0.3.0...v0.3.1
[0.3.0]: https://gitcode.com/badhope/DU/compare/v0.2.0...v0.3.0
[0.2.0]: https://gitcode.com/badhope/DU/compare/v0.1.0...v0.2.0
[0.1.0]: https://gitcode.com/badhope/DU/releases/tag/v0.1.0
