# 天机台 · DU <sub>v0.3.0</sub>

**严格本地运行的玄学大师测评平台。** 同一个问题，两位不同门派的大师各断一遍；
先匿名评分，再揭晓方法，最后跟踪那些带日期的断言到底有没有发生。

没有后端，没有账号，没有埋点。排盘、规则、古籍检索、投票和应验记录全部在浏览器
内完成并留在本机。

[English](README.md) · [路线图](ROADMAP.md) · [更新日志](CHANGELOG.md) · [技术架构](docs/ARCHITECTURE.md) · [大师方法卡](docs/MASTERS.md)

| Home | Blind match — sealed | After voting |
| --- | --- | --- |
| ![Home](docs/screenshots/home.png) | ![Blind match](docs/screenshots/blind-match.png) | ![Reveal](docs/screenshots/reveal.png) |

| Leaderboard | Claim ledger | Canon reader |
| --- | --- | --- |
| ![Leaderboard](docs/screenshots/leaderboard.png) | ![Ledger](docs/screenshots/ledger.png) | ![Canon reader](docs/screenshots/reading.png) |

| Method card | Mobile home | Mobile settings |
| --- | --- | --- |
| ![Method card](docs/screenshots/master-card.png) | ![Mobile home](docs/screenshots/home-mobile.png) | ![Mobile settings](docs/screenshots/settings-mobile.png) |

*截图由 Playwright 从真实构建生成，使用虚构示例输入。*

## 它解决什么问题

传统数术通常被当作一次性判词：排一次盘，给一句话，事后无从检验。天机台把它
变成一条可以复核的链路。

1. **问天** — 写下具体问题，可选填公历出生日期与时间。
2. **双师作答** — 每位大师使用自己的确定性内核，并引用仓库内分发的古籍原文。
3. **盲评** — 姓名、门派、盘面事实和引文在你投票前全部封存；甲乙位置每局随机。
4. **揭晓对比** — 投票后才看到哪一家说了什么，以及依据是什么。
5. **事后应验** — 带日期的可判定断语进入本机应验簿，到期由你回填应验、未验或
   无法判断。

榜单只代表这台设备的记录，不是全局结论。所有大师初始 1500 分，满 5 场才进入
"在榜"，胜率旁边给出 Wilson 95% 下界——连胜几局不会被包装成实力。

## 已启用大师

| id | 名号 | 体系 | 主张 |
| --- | --- | --- | --- |
| `ziping` | 沈砚舟 | 子平八字 | 以四柱看结构，不以一句话定命 |
| `meihua` | 梅叟 | 梅花易数 | 以一时一念观变化 |

每位已启用大师背后都是经过验证的确定性内核，不是挂在 API 后面的人格提示词。

### 已公开方法卡、尚未实现

- `ziwei` · **观星女史** — 紫微斗数
- `qimen` · **云台先生** — 奇门遁甲
- `liuren` · **课中郎** — 大六壬
- `xiangfa` · **铁关客** — 相法与现代观察

这些方法卡是故意公开的。一个门派只有补齐边界规则、外部原例和回归测试之后才会
转为 `active`；把半验证的算法说成已完成，等于毁掉整个平台的意义。

## 典籍阅览室 — 12 部 · 187 万字 / 1870k chars

| 书名 | 章数 | 字数 | 朝代 |
| --- | --- | --- | --- |
| 《素问》 | 28 | 592,848 | 先秦 |
| 《三命通会》 | 22 | 526,594 | 明 |
| 《灵枢》 | 14 | 388,749 | 先秦 |
| 《滴天髓》 | 44 | 102,527 | 宋 |
| 《紫微斗数全书》 | 4 | 71,323 | 宋 |
| 《梅花易数》 | 4 | 42,623 | 宋 |
| 《京氏易传》 | 5 | 39,269 | 汉 |
| 《奇门遁甲元灵经》 | 1 | 37,901 | 清 |
| 《神相铁关刀》 | 1 | 33,701 | 宋 |
| 《六壬指南》 | 3 | 25,076 | 明 |
| 《焦氏易林》 | 5 | 6,736 | 汉 |
| 《许负相法》 | 17 | 3,119 | 汉 |

原文取自维基文库公版书，作为静态 JSON 随仓库分发在 `public/corpus`。回答中出现的
每一条引文都能在运行时回溯到具体段落；`npm run verify:quotes` 会在每次 CI 中把
全部静态引文与站内语料逐字比对。查不到的引文会明确标为无法核对，绝不会被悄悄
包装成权威出处。

## 设计边界

- **事实层与演绎层分离。** 规则不能改写四柱、卦名、动爻或体用关系。
- **数据不出浏览器。** 问题、生辰、盘面、回答、投票和断言只写入 `localStorage`，
  只有你主动点击导出才会生成 JSON 文件。该文件是明文，请按私人笔记对待。
- **不提供医疗、法律、投资建议。** 不预测死亡和重病，不使用恐吓式话术，不做人脸识别。
- **应验簿天然可反驳。** 断言只在到期后由人工回填才计入；"无法判断"不进分母。

## 快速开始

```bash
npm ci
npm run dev        # http://localhost:5173
npm run check      # 类型检查 · 单元测试 · 引文门禁 · 版本门禁 · README 门禁 · 构建 · 本地模式扫描
```

浏览器端到端测试使用固定版本的 Playwright 和本地 Chromium：

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm exec playwright test
pnpm exec playwright test --grep @screenshots   # 重新生成 docs/screenshots
```

需要 Node 20 或更高版本。仓库同时维护 `package-lock.json` 与 `pnpm-lock.yaml`，
依赖变更时两个锁文件都要更新，否则 `npm run check` 会失败。

## 目录结构

```text
src/contract/    跨层共享的数据契约
src/core/        确定性内核（四柱、梅花）
src/knowledge/   同源语料检索
src/engine/      特征提取、匹配、断语库
src/ai/          本地规则回答组装（无网络调用）
src/arena/       盲测流程、Elo 评分、本机台账、导入导出
src/masters/     方法卡注册表——大师状态的唯一来源
src/pages/       路由页面
src/ui/          可复用展示组件
scripts/         构建期与 CI 门禁
tests/           单元与组件断言
e2e/             真实浏览器流程与截图生成
docs/            架构、定位、方法卡、截图
```

## 参与贡献

请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。任何改动都必须让 `npm run check` 保持
通过；新增引文必须能通过 `npm run verify:quotes`。新增门派需要先有外部原例和边界
测试，才能改变状态。

## 许可

MIT，见 [LICENSE](LICENSE)。古籍原文的公有领域来源见 manifest 中每本书的著录。
