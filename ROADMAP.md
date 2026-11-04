# Roadmap

What is shipped, what is next, and what is deliberately not being built.

[中文版见文末](#中文版)

## Shipped — v0.5.0

- Two verified deterministic kernels: Zi Ping four pillars, Mei Hua Yi Shu.
- Blind two-master evaluation with randomised A/B order, cross-answer
  statement exclusion, and chart facts sealed until the vote.
- Local Elo with Wilson 95% lower bound; five-match threshold before ranking.
- Claim ledger with dated, manually resolved falsifiable statements.
- Offline canon reader over 12 public-domain classics (1.87M characters),
  lazy-loaded per book, with runtime citation verification.
- Bilingual README generated from the same registries the UI reads.
- Gates: typecheck, 105 unit assertions, quote verification, version
  consistency, README consistency, build, local-only scan, architecture
  boundaries.

- Local report export: a reading and the claim ledger can each be saved as a
  self-contained, escaped, offline-openable HTML file.
- Corpus integrity gate: manifest chapter counts and character totals are
  verified against the JSON actually shipped.
- Storage-failure reporting: failed `localStorage` writes surface as quota or
  blocked instead of failing silently.
- Dependency audit at zero vulnerabilities.
- Optional backend mode that actually routes reads and writes to the local
  server, with E2E proving the data lands in SQLite.

## Next — v0.4.0

### Content

- **Fourth verified school.** 奇门遁甲 is the next candidate; it needs boundary
  rules for 置闰, 拆补 and 转盘/飞盘 before its status can change.

### Product

- **Self-contained report bundle for a whole ledger**, not just one reading.

## Later

- **A third verified school.** Zi Wei Dou Shu is the natural next candidate: the
  canon is already shipped. It requires boundary rules for leap months, the five
  element bureau, and transformation stars, plus external worked examples with
  expected values — no status change before that exists.
- **Exported report.** A printable, self-contained HTML summary of one reading,
  generated locally, so users can archive without relying on the site.
- **Statement provenance UI.** Show which feature keys triggered a statement, in
  the user's words rather than internal keys.

## Not planned

- **Any backend, account, or sync.** The product's whole premise is that nothing
  leaves the device. Cloud sync would require a threat model the project cannot
  honour.
- **Remote LLM generation.** Even self-hosted: it would make readings
  non-deterministic and unverifiable, which is the opposite of the premise.
- **Leaderboards across users.** A global ranking would be a small-sample
  statistical claim dressed as fact.
- **Face or image input for physiognomy.** Permanently excluded on privacy and
  ethics grounds.
- **Prediction of death, serious illness, or financial outcomes.** Excluded by
  the safety rules in every method card.

## How priorities are set

A change gets in when it makes a claim in this repository *checkable*. Features
that make the product feel richer but less verifiable are rejected, however
popular they would be.

---

## 中文版

## 已发布 · v0.5.0

- 两套经过验证的确定性内核：子平四柱、梅花易数。
- 盲测：甲乙顺序随机、两答断语互斥、盘面与依据在投票前封存。
- 本机 Elo，胜率附 Wilson 95% 下界；满 5 场才进入在榜。
- 应验簿：带日期的可判定断言，到期由人工回填。
- 离线典籍阅览室：12 部公版古籍（187 万字），按书懒加载，运行时可核引文。
- 双语 README，由界面读取的同一份注册表生成。
- 门禁：类型检查、105 条单元断言、引文校验、版本一致性、README 一致性、
  构建、本地模式扫描、架构边界。

- 本地报告导出：单次读取与应验簿都能存成自包含、已转义、断网可打开的 HTML。
- 语料完整性门禁：manifest 的章数与字数会与真正分发的 JSON 核对。
- 存储写入失败会如实显示为"配额满"或"被禁用"，不再静默。
- 依赖审计 0 漏洞。
- 可选后端模式真正接管读写，E2E 证明数据落到 SQLite。

## 下一步 · v0.4.0

### 可靠性



### 内容




## 更远

- **第四套已验证体系。** 奇门遁甲是下一个候选；必须先确定置闰、拆补与转盘/飞盘
  三套流派取舍，并补齐外部原例。
- **可导出的报告。** 单次回答生成为本地自包含 HTML，便于用户归档而不依赖站点。
- **断语触发依据界面化。** 用用户能懂的话展示"为什么选中这句"，而不是内部特征键。

## 明确不做

- **任何后端、账号或同步。** 产品前提就是数据不出设备，云同步需要本项目无法兑现
  的威胁模型。
- **远程大模型生成。** 即便自托管也不行：它会让回答变得不确定、不可核，与前提相反。
- **跨用户排行榜。** 全局排名是把小样本统计包装成事实。
- **相法的人脸/图像输入。** 因隐私与伦理原因永久排除。
- **预测死亡、重病或财务结果。** 各方法卡的安全规则已明确排除。

## 优先级怎么定

只有让这个仓库里的某个说法**变得可核**的改动才会被采纳。让产品更"丰富"但更不可
验证的功能，即使更受欢迎，也会被拒绝。
