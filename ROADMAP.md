# Roadmap

What is shipped, what is next, and what is deliberately not being built.

[中文版见文末](#中文版)

## Shipped — v0.6.0

- **Three verified deterministic kernels**: Zi Ping four pillars, Mei Hua Yi
  Shu, Zi Wei Dou Shu. Each returns chart facts only; interpretation reads them
  and may never rewrite them.
- **Decadal luck** for both calendar systems: 大运 direction and start age from
  the four-pillar kernel, current 大限 palace and age range from Zi Wei. Sex is
  an explicit input because 阳男阴女 run forward and 阴男阳女 run backward.
- Blind two-master evaluation with randomised A/B order, cross-answer
  statement exclusion, and chart facts sealed until the vote.
- Local Elo with Wilson 95% lower bound; five-match threshold before ranking.
- Claim ledger with dated, manually resolved falsifiable statements.
- Offline canon reader over 12 public-domain classics (1.87M characters),
  lazy-loaded per book, with runtime citation verification.
- Four hosts over one computation layer: web, CLI, local HTTP server, MCP.
- Bilingual README generated from the same registries the UI reads.

### Gates

`npm run check` runs typecheck, architecture boundaries, 211 unit assertions,
quote verification, corpus integrity, content safety, **colour contrast**
(WCAG AA, both skins plus eight seasonal buttons), **fact-label coverage**,
version consistency, README consistency, **README language**, production build
and the local-only scan. Each gate has been reverse-tested: break the thing it
guards and it must fail.

## Next — v0.7.0

### Content

- **Fourth verified school.** 奇门遁甲 is the next candidate; it needs boundary
  rules for 置闰, 拆补 and 转盘/飞盘 before its status can change.

### Product

- **Statement provenance UI.** Show which feature keys selected a statement, in
  the reader's words rather than internal keys.

## Later

- **A whole-ledger report bundle**, not just one reading.
- **Per-pillar strength explanation** with the same evidence labels the README
  uses for the gates.

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

## 已发布 · v0.6.0

- **三套经过验证的确定性内核**：子平四柱、梅花易数、紫微斗数。
  每套只产出盘面事实；演绎层可读不可改写。
- **大运与大限**：四柱给出顺逆、起运年月与九步大运；紫微给出当前大限宫位与年龄段。
  性别是显式输入——阳男阴女顺行、阴男阳女逆行，少这一项整列会错位。
- 盲测：甲乙顺序随机、两答断语互斥、盘面与依据在投票前封存。
- 本机 Elo，胜率附 Wilson 95% 下界；满 5 场才进入在榜。
- 应验簿：带日期的可判定断言，到期由人工回填。
- 离线典籍阅览室：12 部公版古籍（187 万字），按书懒加载，运行时可核引文。
- 四种宿主共用一层计算：网页、命令行、本机服务、MCP。
- 双语 README，由界面读取的同一份注册表生成。

### 门禁

`npm run check` 跑：类型检查、架构边界、211 条单元断言、引文校验、语料完整性、
内容安全、**配色对比度**（WCAG AA，两套皮肤 + 八个季节按钮）、
**字段标签覆盖**、版本一致性、README 一致性、**README 语言**、生产构建、本地模式扫描。
每道门禁都做过反证：把它守护的东西改坏，它必须变红。

## 下一步 · v0.7.0

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
