# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.1] - 2026-11-08

Found by asking the app real questions instead of reading the code. Four
defects, one shape: a rule existed and did not hold.

### Fixed

- **A medical decision was answered by casting a hexagram.** 「我爸生病了要不要手术」
  produced a full chart and a reading. The medical rule was advisory-only and
  手术 was never treated as a decision to refuse. Medical now has two levels:
  treatment decisions (surgery, chemotherapy, stopping or changing medication,
  dosage) block with the doctor-referral message; somatic distress (poor sleep,
  anxiety, fatigue) stays advisory so the reading can still discuss routines.
- **Only literal spellings matched.** The list held 「手术要不要」 while people
  write 「要不要手术」 — same words, different order, no match. Medical and legal
  rules now combine a concept pattern with an intent pattern, so order stops
  mattering, and diagnosis phrasing (「查出来有病」) is recognised.
- **Corpus retrieval never worked outside the browser.** `corpus.ts` loaded JSON
  with `fetch('/corpus/...')`; the CLI, HTTP server and MCP have no same-origin
  server, so every retrieval silently returned nothing. The checkable-citation
  property existed only on the web. The data layer now takes an injected reader
  and each Node host supplies one — embedded assets for the exe, filesystem
  otherwise.
- **Citation text could be harmful.** Once retrieval worked it surfaced
  「铃羊合于命宫遇白虎，须当刑戮」 — quoting an ancient text about death at
  someone asking about their father's surgery. Passages are now filtered for
  death predictions, fatalism and curses. Snippets are cut at sentence
  boundaries, deduplicated per chapter, and directory-title fragments dropped.

### Added

- **Domain inference.** The form points out when the question looks like a
  different domain than the one selected (「男朋友不回消息」 marked as career).
- **Echo for open-ended questions.** Previously only the six recognised decision
  shapes were echoed; 「这个月适合买房吗」 went straight to "your day master is
  Xin metal".
- **Query terms come from the reading's own vocabulary** (十神 / 体用 / 命宫)
  instead of the user's sentence. A seventeenth-century book does not contain
  "should I take the job in Beijing".

### Fixed in passing

- Named-entity extraction takes the longest match and masks it, so
  「男朋友」 no longer becomes 「男朋、朋友」.
- Tests inject a corpus reader, so the test environment behaves like production
  instead of silently failing every retrieval.

## [0.7.0] - 2026-11-07

### Fixed — the readings were interchangeable

The three schools drew from one shared statement pool, picked by hash. Measured
on real input: asking about a job offer in another city, an equity split with a
partner, and postgraduate exams versus work produced *the same four sentences*.
Two different masters' answers could be swapped without noticing — which makes
the blind vote meaningless, because there is nothing to judge.

- **Each school now reads its own system** (`engine/voices.ts`). Zi Ping talks
  about day-master structure, which ten-gods carry the most weight, and the
  current luck pillar. Mei Hua talks about the original→changed hexagram pair,
  which line moves, and the body/use relation. Zi Wei talks about the soul
  palace, the body palace, the four transformations, and the current decadal.
  None of them can say what belongs to another school — a test asserts that
  Zi Ping's section contains no hexagram terms and vice versa.
- **Every reading echoes the actual question first.** "You asked whether it is
  the job in Beijing or staying in Chengdu" — not "you are waiting for a reason
  not to decide". A new `engine/understand.ts` parses decision shape
  (either/or, whether, how, judging someone else, prediction, self-assessment),
  the two options, the time horizon and the concerns behind them.
- **Mei Hua casts on the question, not only the clock** (`因事起卦`). Previously
  every question asked in the same hour produced the identical hexagram. Now the
  question is folded into the two numbers used for casting; three different
  questions yield 雷风恒 / 泽天夬 / 地雷复. Still deterministic — same question,
  same hexagram.
- **Action advice is per-domain** (`engine/advice.ts`). It used to be one
  sentence for all seven domains — "shrink the next step into something you can
  finish this week" — which fits every question and therefore helps with none.
  Now each domain has its own concrete moves; reading the career advice against
  a relationship question should feel obviously wrong.

### Fixed — regressions this work exposed

- **The voice layer dropped citations.** Reading from chart structure meant the
  old statement-based quotes disappeared, so 依据 fell back to "no matching
  passage in the local corpus" — the project's core checkable-citation property
  was silently lost. Each school now carries one quotation from its own canon,
  verified verbatim by `verify-quotes`.
- **The quote gate did not scan `voices.ts`.** It only looked at the two
  statement files, so the three new quotations would have escaped verification
  entirely. The gate now covers every file that renders canon text, and a
  planted fake quote makes it fail.
- **`canonCount` mislabelled citations** once an anchor quote was prepended:
  the first citation was tagged `corpus` instead of `canon`. Caught by an
  existing test.

### Changed

- `engine` may now import `core` (voices must read chart structures); `ai` may
  import `core` (types only). `docs/ARCHITECTURE.md` and the boundary gate were
  updated together, with the reason written down.

### Fixed

- **The safety gate held on the web and not on the other three hosts.** `minor`
  was blocking only because `Ask.vue` checked it; the CLI, HTTP API and MCP all
  generated readings for「我16岁」without any warning. `isBlocking` now covers
  `minor` so every host refuses identically. The HTTP host maps
  `SafetyBlockError` to **403** instead of 500 — a safety refusal is not a
  server outage, and returning 500 invites retries.
- **Minor detection only matched literal spellings.** The word list held
  「我14岁」and nothing else; 「我 14 岁」「我十四岁」「今年14」「17周岁」「初二学生」
  all slipped through. Replaced with structural patterns that separate *the
  speaker is a minor* from *the sentence mentions an age* — 「我 60 岁，孩子高三」
  is correctly not flagged.
- **Domain notices were computed and never shown.** `Ask.vue` assigned
  `domainNotice()` to a variable that never reached the template, so the medical
  and financial notices were written for nothing. Notices now live on
  `MasterAnswer` and are rendered by the web card, CLI, MCP and the exported
  HTML report. `legal` and `minor` were also missing from `domainNotice`.
- **Claim hit-rate had no sample threshold.** One resolved claim displayed
  「应验 100%」while the same function required five matches before disclosing a
  win rate — the same principle applied to only half the data. Now five.
- **`BirthInput.longitude` was declared and never used.** It promised true
  solar time and delivered nothing.

### Added

- **True solar time correction** (`core/solarTime.ts`). China uses one standard
  meridian (120°E) across five geographic time zones; Ürümqi is 129 minutes off,
  which is two whole 时辰. Correction combines the longitude offset with the
  equation of time (Spencer 1971, under 30 s error). Both kernels apply it
  before computing pillars or placing palaces, and the corrected time is written
  into the chart facts so the reader can see what was actually used. Optional —
  leaving it blank keeps the previous behaviour exactly.
- `--longitude` on the CLI, `longitude` on the MCP tool schema, and an optional
  field on the ask form.

## [0.6.0] - 2026-11-07

Sex had been accepted by the Zi Wei kernel since v0.5.0 and never passed to it.
Every user's decadal table was computed as a male chart — a hundred-year error
in the 大限 column, invisible because the chart still rendered. This release is
mostly about that class of defect: things that look finished and are not.

### Fixed

- **Decadal luck ignored sex.** `calculateZiwei` took `gender`, but
  `factsForRequest` dropped it and the form had no field. 阳男阴女 run forward,
  阴男阳女 run backward: the same birth moment put 兄弟宫 at 115–124 for a male
  and 15–24 for a female. Sex is now a form field, threaded through the runtime,
  CLI (`--gender`), HTTP API and MCP. Default is `unknown` → male, and the UI
  says so out loud rather than assuming silently.
- **Internal identifiers reached the screen.** Chart-fact fields were rendered
  straight from `Object.entries`, producing `- currentDecadal：田宅宫 35–44 岁`
  and `- 体用关系：yongShengTi`. Field keys now go through a label table, and
  enum values are mapped at the fact layer.
- **Header subtitle detached from the brand.** `space-between` treated `天机台`
  as a third column and parked it in the middle of the page.
- **Primary buttons failed WCAG AA in the dark skin.** White text on the four
  seasonal accents measured 2.41–4.20:1. Added `--on-accent`; the dark skin now
  uses dark text on accent.
- **Light skin small text was below AA.** `--ink-3` was 3.4:1 on paper and is
  used at 10–11px; `--accent-2` was 3.1:1. Both darkened.
- **One statement contained an English word**: 「你 sensed 的那个拐点」.
- **Footer split the clear button from its brackets** on narrow screens.
- **`npm run screenshots` never ran.** `grepInvert` excluded the screenshot
  test before `--grep` could select it, so the command always reported
  "No tests found".

### Added

- **Decadal luck for the four-pillar kernel** — direction, start age, nine
  ten-year pillars, current pillar, and the current 流年 from the calendar
  library. The Zi Wei kernel now also yields the current 大限 palace, age range
  and nominal age.
- **`scripts/check-contrast.mjs`** — 17 foreground/background pairs per skin
  plus 8 seasonal button combinations, gated at WCAG AA 4.5:1. It caught five
  real defects on its first run, including every seasonal primary button.
- **`scripts/check-fact-labels.mjs`** — every fact field must have a Chinese
  label and every enum must be mapped before it reaches a reader.
- **Loading skeleton on the ask page** with `role="status"`, shaped like the
  answer it is about to become.
- **Theme boot script** (`public/theme-boot.js`) so the chosen skin applies
  before first paint without loosening CSP.
- **Content gate rule for mixed Chinese/English** in statements.

### Changed

- **Paper (light) is now the default skin.** Ink remains one click away. The
  previous default opened a reading tool on a black page.
- `DU_BACKEND_PORT` overrides the backend E2E port; the spec reads the same
  value instead of hardcoding 4180. It had been colliding with an unrelated
  process on the same machine.

## [0.5.3] - 2026-11-06

The test suite had 190 passing assertions and I could not tell you whether half
of them would notice if the code broke. So I broke the code on purpose, 13 times.

### Added

- **`scripts/mutation-test.mjs`** — mutation testing without a framework
  dependency. Each entry names a real decision (危机网关, 断言期限, Wilson 门槛,
  匿名脱敏, 来源校验…) and a replacement that should be wrong. The script applies
  it, runs the relevant tests, and restores the file. A test that keeps passing
  is reported as a coverage gap, not a success.
- **Result: 1/5 → 13/13 mutants killed.** The first run was the useful one —
  it showed four tests were decorative.

### Test gaps this exposed and fixed

| Mutant | Why the old tests missed it | New test |
| --- | --- | --- |
| Claim deadline → 1 year | Only tested "cannot resolve before due date", never how far out the code sets it | Asserts the generated claim is exactly 7 days out and its text carries the date |
| Wilson lower bound below 5 matches | Only asserted `tier`; nothing checked the disclosed number | Asserts `wilsonLower` is null at 1 and 4 matches, non-null at 5 |
| Cross-answer exclusion removed from the flow | Existing tests passed `seen` by hand, proving *if* it is passed the answers differ — never that `composeBlindMatch` passes it | Calls `composeBlindMatch` on three questions and asserts no overlap |
| Meihua ignores the hour | Tested `castByTime` math directly, never that `calculateMeihua` feeds it the right hour | Two times of day must produce different 变卦 or 动爻 |
| Flow-level crisis gate disabled | `Ask.vue` has its own pre-check, so browser tests still passed | API test posts a crisis question directly — `composeBlindMatch` must refuse and leave no ledger row |

### Notes

- Two mutants turned out to be behaviourally equivalent (removing a redundant
  guard) rather than test gaps. Those were replaced with mutants that change
  behaviour, because a surviving-but-equivalent mutant says nothing about the
  tests.
- `npm run test:mutation` runs all 13 (≈3 min); `--quick` runs the first 5.

## [0.5.2] - 2026-11-06

Clearing the audit backlog that v0.5.1 left open. The theme is the same:
claims that lived in prose are now enforced by code, and where enforcement was
already there, it is now tested by breaking it on purpose.

### Content safety

- **Added `scripts/check-content-safety.mjs`, wired into `npm run check`.** The
  audit found three classes of overreach in the statement library: physical
  diagnoses ("你的颈椎比你的计划表先一步垮了"), symptom denial ("你不是失眠，
  是…"), and investment conclusions ("超过你耐心的一半就先别做"). Reviewing 175
  statements by eye does not scale, so the gate now rejects those patterns and
  points at the offending statement id.
  - **Reverse-tested**: re-inserting the original sentence turns it red. The
    first version of the gate silently passed because the regex span was too
    narrow (9 characters between "颈椎" and "垮", limit was 6) — found only
    because I tried to break it.
- Rewrote the offending statements as observable behaviour instead of
  conclusions: "你坐着的时长，可能比你以为的要多得多", "躺下之后，你脑子里还在开会".
  Medical actions now end with "请就医" rather than implying a diagnosis.

### MCP

- **Birth data now requires explicit `allowBirth: true`.** Tool arguments enter
  the AI client's model context, so a cloud client means the birth date leaves
  the device. This is stated at startup on stderr and in the parameter
  description.
- `tianji://ledger` returns status and due dates only, not statement text —
  resources are dumped wholesale into the model context.

### Storage

- **SQLite now sets `PRAGMA secure_delete=ON`**; `reset()` VACUUMs and truncates
  the WAL. Deleted records no longer linger in free pages or the write-ahead log.
- Data directory created with mode `0700` — default umask left it world-readable
  on Linux and macOS.
- **New `tianji reset --yes`.** There was no way to clear the server ledger at
  all; the web "clear all" only touched `localStorage`.

### Accessibility

- Touch targets raised to 44px: nav links were ~15px tall, the WCAG 2.2 floor
  is 24px and the mobile recommendation is 44px. An E2E test now asserts every
  visible nav link and button meets it, so this cannot regress.

### Docs

- `SECURITY.md` rewritten. It claimed "a static site with no backend"; that has
  been false since v0.4.0. It now documents both storage modes, the SQLite file
  path and its plaintext nature, the token requirement, the `tianji reset`
  semantics, and the MCP context risk.

## [0.5.1] - 2026-11-05

An external audit found that several safety and privacy claims existed only in
documentation. This release makes them executable.

### Security & safety (highest priority)

- **Crisis input is now blocked before any generation.** Previously "我想自杀"
  produced "你不是在做决定，是在等一个不用负责的理由" — dangerous output for
  someone in crisis. `src/core/safety.ts` is a gate that runs before the chart,
  statements and claims are produced, and it covers suicide, self-harm, abuse,
  medical decisions, minors, leverage and legal matters. It is shared by web,
  CLI, HTTP and MCP, so no host can bypass it. 24 tests plus 2 browser tests.
- **The HTTP API had no authentication.** A page on any other origin could read
  the whole ledger — including birth dates — via DNS rebinding, and could write
  to it with a `text/plain` POST. Now: Host must be loopback, cross-site Origin
  is rejected, and non-browser clients need the token written to the data
  directory. Verified by tests that assert 403 on both vectors.
- **Server-mode blind evaluation was decorative.** The web client requested
  `reveal: true` and hid the identity in the UI only; `/api/matches` returned
  every match in full. Now the ask response is structurally sealed, the list
  endpoint returns identity only for already-voted matches, and the UI fetches
  the full object after voting.
- **The local-only gate could be bypassed.** It matched a fixed list of vendor
  domains, so `fetch("https://evil.example")` in `src/` passed. It now detects
  network APIs (`fetch`, `XHR`, `WebSocket`, `node:http`, …) with an explicit,
  reasoned allowlist. Reverse-tested: adding a `fetch` probe turns it red.
- **"Clear all local data" left data behind.** It never removed
  `tianji.arena.quarantine`, which holds up to 200 KB of raw ledger including
  birth dates.

### Correctness

- **Claims were dated one year out while their text said "this week".** The
  ledger therefore rejected every attempt to resolve them, and the UI ignored
  the rejection — the core loop was dead on first use. Claims are now +7 days
  and their text shows the deadline; the resolver reports why it refused and
  disables the buttons before the due date.
- **Sample-size gate was documented but not implemented.** A master with one
  match showed "见习 · 胜率下界 21%", contradicting "at least 5 matches before
  ranking". `wilsonLower` is now null below the threshold.
- About page claimed 紫微 was still pending while it had been active since
  v0.5.0; the list of pending schools is now derived from the registry.
- Footer "本机提问 N 次" never incremented because the ask flow never called
  `recordVisit`.

### Changed

- README reduced from 137 lines to 39: one sentence, three screenshots, install
  commands, four-step usage table. Everything else moved to `docs/`.
- `process.env` removed from browser-path code — it crashed the whole page.

## [0.5.0] - 2026-11-04

The third kernel lands, and the three reliability items the roadmap kept
deferring are done.

### Added

- **Zi Wei Dou Shu kernel**, on `iztro` (MIT) rather than hand-rolled. 星曜安放
  has too many edges — leap months, 子时 day boundary, 五行局 determining decadal
  direction — for a second implementation to be trustworthy. The kernel exposes
  12 palaces, 五行局, 命主/身主, 四化, brightness, and decadal ranges as
  `ChartFact`; it makes no judgements.
- 观星女史 moves from `planned` to `active`, so the arena now pairs any two of
  three masters at random. Fixing the first two would have left the third with
  no data forever.
- **Import schema migration.** Export format is v2. `migrate()` handles v1 files
  (and files with no `schema` field), rejects anything newer than the app with a
  readable reason instead of guessing, and `importArena` now returns
  `{ ok, from } | { ok: false, reason }` so the UI can say what happened.
- **Cross-session statement rotation.** `seen` used to live only inside one
  match, so the same question tomorrow repeated the same lines. The ledger
  facade now passes session history into the engine and records what was shown.
- **8 more statements each** for `family` and `study`, which were the thinnest
  domains (13 each). Now 21 apiece; total statement count 173.

### Fixed

- `factsForMaster` had a hardcoded two-branch map; adding a third kernel would
  have handed it every other school's chart. It now derives the fact kind from
  `master.kernel`.
- The ziwei canon statements were all gated behind `domain:wealth` or
  `stage:settled`, so 观星女史 could produce answers with no citable source at
  all. Added two general-purpose ones — and the quote gate immediately caught
  two fabricated quotations I wrote, which is exactly what it is for.
- CLI/export rendering sliced chart fields to the first four; for ziwei that
  skipped 命宫 and 四化.

### Verification

- 158 unit/runtime/API assertions in 18 files, 12 of them new for ziwei
  (hour-index mapping, 子时 boundary, leap month, leap day, invalid dates,
  gender affecting decadal direction, fact layer containing no judgement words).
- 31 canon quotations verified verbatim against the shipped corpus.

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

[Unreleased]: https://gitcode.com/badhope/DU/compare/v0.5.3...HEAD
[0.5.3]: https://gitcode.com/badhope/DU/compare/v0.5.2...v0.5.3
[0.5.2]: https://gitcode.com/badhope/DU/compare/v0.5.1...v0.5.2
[0.5.1]: https://gitcode.com/badhope/DU/compare/v0.5.0...v0.5.1
[0.5.0]: https://gitcode.com/badhope/DU/compare/v0.4.1...v0.5.0
[0.4.1]: https://gitcode.com/badhope/DU/compare/v0.4.0...v0.4.1
[0.4.0]: https://gitcode.com/badhope/DU/compare/v0.3.1...v0.4.0
[0.3.1]: https://gitcode.com/badhope/DU/compare/v0.3.0...v0.3.1
[0.3.0]: https://gitcode.com/badhope/DU/compare/v0.2.0...v0.3.0
[0.2.0]: https://gitcode.com/badhope/DU/compare/v0.1.0...v0.2.0
[0.1.0]: https://gitcode.com/badhope/DU/releases/tag/v0.1.0
