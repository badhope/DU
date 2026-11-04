# Tianji · DU <sub>v0.4.1</sub>

**Blind-evaluated Chinese metaphysics, running entirely on your machine.**

Two verified schools read the same question. You score before the methods are
revealed. Every dated claim goes into a ledger you settle yourself.

[中文](README.zh-CN.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md) · [Architecture](docs/ARCHITECTURE.md) · [Method cards](docs/MASTERS.md)

| Home | Blind match — sealed | After voting |
| --- | --- | --- |
| ![Home](docs/screenshots/home.png) | ![Blind match](docs/screenshots/blind-match.png) | ![Reveal](docs/screenshots/reveal.png) |

| Leaderboard | Claim ledger | Canon reader |
| --- | --- | --- |
| ![Leaderboard](docs/screenshots/leaderboard.png) | ![Ledger](docs/screenshots/ledger.png) | ![Canon reader](docs/screenshots/reading.png) |

| Method card | Mobile home | Mobile settings |
| --- | --- | --- |
| ![Method card](docs/screenshots/master-card.png) | ![Mobile home](docs/screenshots/home-mobile.png) | ![Mobile settings](docs/screenshots/settings-mobile.png) |

<sub>Screenshots from the real build via Playwright, fictional input.</sub>

## Three ways to run it

| | Command | What you get |
| --- | --- | --- |
| **Web** | open the hosted page | Everything in your browser. Zero install. |
| **CLI** | `tianji ask "…"` | Same engine, scriptable, JSON output, SQLite ledger. |
| **Desktop** | `tianji.exe serve` | Single 96 MB file. Serves the web UI, no Node needed. |
| **MCP** | `tianji mcp` | Exposes the engine to Claude, VS Code, Cursor as 5 tools. |

All four share one computation layer. The same question with the same seed
produces byte-identical readings in every host — `tests/runtime.spec.ts` asserts it.

## The loop

```text
        ask                score blind            reveal            settle
  ┌─────────────┐    ┌──────────────────┐   ┌──────────┐    ┌─────────────┐
  │ one question│ →  │ 甲 / 乙, sealed  │ → │ methods  │ →  │ dated claims│
  │ two schools │    │ charts + sources │   │ + names  │    │ hit/miss    │
  └─────────────┘    └──────────────────┘   └──────────┘    └─────────────┘
```

Sealed means *not rendered*, not *labelled hidden*: the API strips `masterId`,
chart facts, sources and claim IDs before the vote, because a hexagram gives away
Mei Hua and a four-pillar chart gives away Zi Ping.

## What makes it checkable

| Claim | How it is enforced |
| --- | --- |
| Citations are real | `npm run verify:quotes` matches all 29 static quotes against the shipped corpus |
| Corpus is intact | `npm run check:corpus` re-counts 12 books / 148 chapters / 1,870,466 chars |
| Blind is blind | randomised A/B order, cross-answer statement exclusion, structural sealing |
| Small samples don't win | Elo + Wilson 95% lower bound, ranked only after 5 matches |
| Claims are falsifiable | dated, resolved by a human, `unknown` never enters the denominator |
| Nothing leaves the device | `npm run check:local-only` scans source and built output |

## The engine

149 statements, each with explicit trigger conditions, an honest population base
rate, and a source. 29 carry verbatim classical quotations across 12 public-domain
classics. Matching is deterministic — same input, same seed, same result — so a
reading can be reproduced and argued about, which is the whole point.

Two kernels are active and verified:

| id | Master | School | Kernel |
| --- | --- | --- | --- |
| `ziping` | 沈砚舟 | 子平八字 | 以四柱看结构，不以一句话定命 |
| `meihua` | 梅叟 | 梅花易数 | 以一时一念观变化 |

Four more publish their method cards and stay `planned` until boundary rules and
external worked examples exist. Shipping a half-verified algorithm as finished
would defeat the platform.

## Install

```bash
# CLI (needs Node 20+)
npm ci && npm run build:all
node build/cli.mjs doctor

# Desktop (Windows, no Node required)
buildinstall.cmd
tianji serve            # then open http://127.0.0.1:7317
```

MCP clients — add to the config:

```json
{ "mcpServers": { "tianji": { "command": "tianji", "args": ["mcp"] } } }
```

## Commands

```text
tianji ask "我要不要换工作" --domain career   ask two masters, sealed
tianji ask "…" --reveal                      show names, charts, sources
tianji ledger                                pending claims and due dates
tianji resolve <id> hit|miss|unknown         settle a claim
tianji report latest --out r.html            self-contained HTML report
tianji export / import                       move the ledger as JSON
tianji serve --port 7317                     web UI + HTTP API
tianji doctor                                environment + data check
```

## Gates

```text
npm run check        typecheck · boundaries · 139 tests · 29 quotes
                     corpus · version · README · build · local-only
npm run test:e2e     18 browser scenarios
npm run build:all    web + cli.mjs + mcp.mjs + tianji.exe
```

Every gate above fails loudly and has been verified by deliberately breaking the
thing it guards.

## Layout

```text
src/contract/   shared types          src/node/     CLI · server · MCP · SQLite
src/core/       deterministic kernels src/runtime/  host-agnostic engine
src/engine/     matching + statements  src/pages/    routed screens
src/arena/      blind flow · rating   tests/        unit + runtime
src/data/       corpus access         e2e/          real browser
```

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md). `npm run check` must stay green; new citations
must survive `verify:quotes`; a new school needs worked examples and boundary
tests before its status changes.

## License

MIT. Corpus texts retain their public-domain provenance — see the manifest.
