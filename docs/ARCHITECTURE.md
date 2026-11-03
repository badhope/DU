# Architecture

Tianji is a static single-page application. There is no server component, no
database and no authentication. This document explains the layer boundaries and
why each one exists, so that a change can be placed in the right layer instead
of leaking across all of them.

[中文版见文末](#中文版)

## Data flow

```text
user question (+ optional birth date/time)
        │
        ▼
facts layer ── src/core/bazi.ts, src/core/meihuaFacts.ts
        │      deterministic ChartFact only; rules may read, never rewrite
        ▼
knowledge layer ── src/knowledge/retrieve.ts + src/data/corpus.ts
        │      same-origin fetch of public/corpus, lazy per book
        ▼
interpretation layer ── src/engine/*, src/ai/*
        │      feature extraction → statement matching → local composition
        ▼
evaluation layer ── src/arena/*
        │      blind match → vote → Elo/Wilson → claim ledger
        ▼
localStorage ── src/arena/store.ts
```

## Why these boundaries

**Facts are not opinions.** A four-pillar chart or a hexagram is a computable
object. If an interpretation layer could edit the pillars, every downstream
number would become unfalsifiable. So `ChartFact` is produced once, is readonly
by convention, and is passed through unchanged.

**The corpus is data, not prompts.** The classics are shipped as static JSON and
retrieved by substring search after traditional→simplified normalisation.
Retrieval returns a snippet plus its book and chapter; it never returns generated
text. That is what makes runtime citation checking possible at all.

**Blind means structurally blind.** `runBlindMatch` randomises A/B order and
passes the first answer's statement ids to the second as an exclusion set.
`AnswerCard.vue` does not render the chart-facts or sources sections until the
vote is recorded. Anonymity is a property of what is rendered, not a promise in
copy.

**Ratings are local and small-sample aware.** Elo starts at 1500. A master enters
the ranked table only after five matches, and win rate is shown with a Wilson 95%
lower bound so three lucky wins do not read as 100% skill. Claim resolution is
only counted after the due date and only for `hit`/`miss`; `unknown` never enters
the denominator.

## Module map

| Path | Responsibility | May import |
| --- | --- | --- |
| `src/contract/` | Shared types only | nothing |
| `src/core/` | Deterministic kernels | `contract` |
| `src/data/` | Corpus fetch, alias resolution, search | `contract` |
| `src/knowledge/` | Query → passages | `data`, `contract` |
| `src/engine/` | Features, matching, statement library | `contract` |
| `src/ai/` | Local answer composition | `contract`, `engine`, `knowledge` |
| `src/arena/` | Match flow, rating, persistence | `contract`, `core`, `ai`, `masters` |
| `src/masters/` | Method-card registry | `contract` |
| `src/ui/` | Presentational components | `contract` |
| `src/pages/` | Routed screens | everything above |

A file that violates this table usually indicates a missing abstraction, not a
missing import permission.

## Loading strategy

The initial bundle deliberately excludes anything large:

- `lunar-typescript` (ephemeris tables) is a dynamic import inside
  `calculateBazi`, so it only downloads when a birth date is supplied.
- `opencc-js` (1.1 MB traditional→simplified converter) is a dynamic import
  inside `needSimplify`, only loaded when a search or the "simplified" toggle is
  used.
- Corpus books are fetched per book on demand and cached in a module-level `Map`,
  so reading one book never loads the other eleven.
- Route components are lazily imported by the router.

The result is a ~175 KB main chunk instead of a multi-megabyte one, with the
large pieces paid for only by users who need them.

## Failure isolation

Every optional layer degrades instead of throwing:

| Failure | Behaviour |
| --- | --- |
| Corpus fetch fails | Reading still generated from the static statement library |
| `localStorage` unavailable (private mode) | App works; history is not persisted |
| Imported JSON malformed | Rejected wholesale, existing local data untouched |
| One kernel fails (bad birth input) | Other kernel still produces facts |
| Clipboard/file download blocked | UI shows an error message, no crash |

## Versioning

`package.json`, `CHANGELOG.md` and `CITATION.cff` must agree; `npm run
check:versions` enforces it. The project follows Semantic Versioning: `0.x`
releases may change internal contracts, `1.0.0` will mark the point where the
statement library and the two active kernels are considered stable.

## Release gate

`npm run check` is the whole gate, and CI runs exactly the same command:

```text
typecheck → unit tests → quote verification → version consistency
          → README consistency → production build → local-only scan
```

Two rules that are easy to break accidentally and are therefore automated:

1. **Quote gate** — every `canon` quote must appear verbatim in the shipped
   corpus. It reads `public/corpus`, not a raw archive, so a quote cannot pass by
   existing in a file that is not actually deployed.
2. **Local-only gate** — scans source, docs, README, `package.json`, `index.html`
   and the built `dist` for known remote endpoints, credential patterns and
   upload wording.

---

## 中文版

## 数据流

```text
用户问题（可选生辰）
        │
        ▼
事实层 ── src/core/bazi.ts、src/core/meihuaFacts.ts
        │      只产出确定性 ChartFact；规则可读不可改写
        ▼
知识层 ── src/knowledge/retrieve.ts + src/data/corpus.ts
        │      同源读取 public/corpus，按书懒加载
        ▼
演绎层 ── src/engine/*、src/ai/*
        │      特征提取 → 断语匹配 → 本地组装
        ▼
测评层 ── src/arena/*
        │      盲测 → 投票 → Elo/Wilson → 应验簿
        ▼
localStorage ── src/arena/store.ts
```

## 为什么这样分层

**事实不是观点。** 四柱和卦象是可计算对象。如果演绎层能改写它们，下游所有数字
都会变得不可反驳。所以 `ChartFact` 只生成一次，原样传递。

**语料是数据，不是提示词。** 古籍以静态 JSON 分发，检索做繁简归一后的子串匹配，
返回片段及其书名、章节，从不返回生成文本。这是运行时可核引文的前提。

**盲测是结构性的。** `runBlindMatch` 随机化甲乙顺序，并把第一位大师用过的断语 id
传给第二位做排除集；`AnswerCard.vue` 在投票前不渲染盘面事实与依据两节。匿名是
渲染结果的性质，不是文案里的承诺。

**评分是本机的小样本判断。** Elo 初始 1500，满 5 场才进入在榜，胜率附带 Wilson
95% 下界，避免三连胜被读成 100% 实力。应验只统计到期后由人回填的"应验/未验"，
"无法判断"不进分母。

## 模块边界

| 路径 | 职责 | 允许依赖 |
| --- | --- | --- |
| `src/contract/` | 仅共享类型 | 无 |
| `src/core/` | 确定性内核 | `contract` |
| `src/data/` | 语料读取、别名解析、检索 | `contract` |
| `src/knowledge/` | 查询 → 片段 | `data`、`contract` |
| `src/engine/` | 特征、匹配、断语库 | `contract` |
| `src/ai/` | 本地回答组装 | `contract`、`engine`、`knowledge` |
| `src/arena/` | 对局流程、评分、持久化 | `contract`、`core`、`ai`、`masters` |
| `src/masters/` | 方法卡注册表 | `contract` |
| `src/ui/` | 展示组件 | `contract` |
| `src/pages/` | 路由页面 | 以上全部 |

违反这张表的文件通常说明缺了一层抽象，而不是缺了一条 import 权限。

## 加载策略

首屏包刻意不含大体积依赖：

- `lunar-typescript`（历法表）在 `calculateBazi` 内动态 import，只有填了生辰才下载；
- `opencc-js`（1.1 MB 繁简转换）在 `needSimplify` 内动态 import，只有检索或点"转
  简体"时才载入；
- 古籍按书 fetch，并用模块级 `Map` 缓存，读一本不会加载另外十一本；
- 路由组件由 router 懒加载。

主包因此保持在约 175 KB，大块依赖只由真正需要的用户承担。

## 失败隔离

| 失败点 | 行为 |
| --- | --- |
| 语料 fetch 失败 | 仍用断语库静态引文生成完整回答 |
| localStorage 不可用（隐私模式） | 功能照常，历史不持久 |
| 导入 JSON 结构错误 | 整体拒绝，本机数据不受影响 |
| 某一内核失败（生辰非法） | 另一内核照常产出事实 |
| 下载/复制被浏览器阻止 | 界面给出错误提示，不崩溃 |

## 版本管理

`package.json`、`CHANGELOG.md`、`CITATION.cff` 三处版本必须一致，由
`npm run check:versions` 强制。项目遵循语义化版本：`0.x` 阶段内部契约可能变化，
`1.0.0` 表示断语库与两个已启用内核进入稳定期。

## 发布门禁

`npm run check` 是完整门禁，CI 跑的就是同一条命令：

```text
类型检查 → 单元测试 → 引文校验 → 版本一致性
        → README 一致性 → 生产构建 → 本地模式扫描
```

两条容易被无意破坏、因此自动化的规则：

1. **引文门禁** —— 每条 canon 引文必须逐字出现在站内分发的语料中。它读的是
   `public/corpus`（真正部署的产物），不是原始归档，所以"在没发布的文件里存在"
   不能蒙混过关。
2. **本地模式门禁** —— 扫描源码、文档、README、`package.json`、`index.html`
   和构建后的 `dist`，拦截已知远程 endpoint、凭据模式和上传文案。

---

## 多宿主架构（v0.4.0 起）

同一套计算跑在四种宿主上。这不是"另写一份命令行版"，而是把应用层从浏览器里
抽出来：

```text
                 ┌──────────────────────────────────────────┐
                 │  src/runtime/     宿主无关的应用层         │
                 │  ask · askAndRecord · sessionView        │
                 │  renderMatch · renderLedger · catalog    │
                 └────────────┬─────────────────────────────┘
                              │
     ┌────────────┬───────────┼───────────┬─────────────────┐
     ▼            ▼           ▼           ▼                 ▼
  src/pages/   src/node/    src/node/   src/node/       (未来)
  浏览器       cli.ts       server.ts   mcp.ts
   │            │            │            │
 localStorage  SQLite       SQLite      SQLite
```

关键约束写在 `scripts/check-boundaries.mjs` 里：`runtime/` 不得 import
`node/` 或 `pages/`，`node/` 不得 import `pages/`。反过来允许，因为页面可以
调用运行时，但运行时不知道宿主是谁。

### 为什么这很重要

`tests/runtime.spec.ts` 里有一条断言：同一问题、同一种子下，Node 端与浏览器端
生成的 `statementIds` 与正文必须完全一致。这条测试的存在意味着，如果哪天有人
在 Web 里改了一条规则却没改共享层，CI 会直接失败——而不是等到用户发现
"命令行算的和网页不一样"。

### 存储适配器

```ts
interface LedgerStore {
  listMatches(): BlindMatch[]
  listClaims(): Claim[]
  saveMatch(match: BlindMatch): void
  saveClaims(claims: Claim[]): void
  resolveClaim(id: string, status: 'hit' | 'miss' | 'unknown'): boolean
  reset(): void
  leaderboard(): LeaderboardRow[]
}
```

浏览器实现基于 `localStorage`，Node 实现基于 `node:sqlite`。两者的评分都复用
`arena/rating.ts` 的同一个 `updateElo`，所以 Elo 不会出现"服务端算高了"这种事。

### 为什么是 SEA 而不是 Electron

Electron 会把整份 Chromium 打进安装包。但本项目三种界面里只有网页需要浏览器，
而网页本来就跑在用户自己的浏览器里。SEA 把 Node 运行时和一个 ~1.5 MB 的脚本
合成单个二进制，安装包 96 MB（其中 90 MB 是 Node 本体），启动快、不需要管理员
权限、卸载就是删目录。

网页资源以 SEA assets 的形式嵌进二进制，`tianji serve` 时由 `node:sea` 的
`getAsset` 取出。这里有个坑值得记下：`getAsset` 只接受 `'utf8'` 或省略编码
（返回 ArrayBuffer），传 `'binary'` 会抛 `The "binary" encoding is not supported`。

### MCP

用官方 `@modelcontextprotocol/sdk`，stdio 传输。选择 stdio 而不是 SSE/HTTP
的原因很直接：本地工具不该为了被 AI 客户端调用而开一个端口。客户端配置里写
`command: tianji, args: ["mcp"]` 就够了，没有鉴权、没有网络、没有监听。

工具设计遵循最小能力原则：`tianji_ask` 默认不落库（`save=false`），
`tianji_resolve_claim` 会拒绝未到期的判定。AI 能调用的是已经验证过的计算，
不是"随便生成一段运势"的自由度。
