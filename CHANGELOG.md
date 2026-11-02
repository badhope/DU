# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/badhope/DU/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/badhope/DU/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/badhope/DU/releases/tag/v0.1.0
