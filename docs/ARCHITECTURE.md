# 天机台本地架构

## 总体

天机台是严格本地运行的静态站。问题、生辰、盘面、回答、投票和应验数据不发送到任何外部服务。浏览器只读取本项目同源的 `public/corpus` 静态语料，并使用本地确定性内核和规则断语生成结果。

```text
用户问题 + 可选生辰
        │
        ▼
事实层：src/core/bazi.ts + src/core/meihuaFacts.ts
        │  只产确定性 ChartFact
        ▼
本地知识层：src/knowledge/retrieve.ts
        │  只读取同源 public/corpus
        ▼
本地演绎层：src/ai/offline.ts + src/engine/resonance.ts
        │  规则断语、已核引文、动态应验日期
        ▼
测评层：src/arena/readingFlow.ts
        │  匿名双答 → 投票 → Elo/Wilson → 应验簿
        ▼
localStorage：src/arena/store.ts
```

## 模块边界

- `src/contract`：跨层数据契约。`AnswerMode` 只有 `local`；`BlindMatch`、`MasterAnswer`、`Claim` 是测评闭环的最小数据。
- `src/core`：确定性算法。八字动态加载 `lunar-typescript`，梅花复用已通过原例测试的 `gua.ts`/`meihua.ts`。
- `src/masters`：方法卡注册表，不持有运行时状态。只有 `active` 大师可以进入盲测。
- `src/knowledge`：复用现有 corpus 数据层，浏览器只读取同源相对路径；没有远程知识库。
- `src/ai/offline.ts`：本地规则回答生成器；目录名称保留为历史兼容路径，不代表外部推理或联网调用。
- `src/arena`：Elo、Wilson 下界、对局幂等、断言回填和本机数据导入导出。
- `src/pages`：产品流程；典籍阅读室和旧 `/t/meihua` 入口保持兼容。

## 不上传边界

- 生产代码不存在外部推理客户端、凭据、远程地址或流式远程调用。
- 设置页不提供外部协议、地址、模型或凭据控件。
- 浏览器加载的古籍来自仓库内 `public/corpus`；这是同源静态资源，不向第三方发送用户输入。
- 导出 JSON 只有用户主动点击才产生本地文件；导入只接受已知大师、合法状态和有限条数。

## 排名口径

所有 active 大师初始 rating=1500，盲评使用 Elo，平局记 0.5。少于 5 场不进入“在榜”；胜率同时显示 Wilson 95% 下界。应验率只统计用户回填为“应验/未验”的断言，“无法判断”不进入分母。

## 后续算法移植门槛

旧 `archive-v1` 的紫微、奇门、六爻、六壬代码不直接复制。每个新内核必须先完成：

1. 输入边界与节气/时区规则说明；
2. 至少两条外部古籍原例或公开案例的期望值测试；
3. 非法输入和边界时刻测试；
4. strict TypeScript 下无 `any` 掩盖、无未使用导出；
5. 结果字段能在 UI 显示计算依据；
6. 通过后才把对应大师从 `planned` 改为 `active`。
