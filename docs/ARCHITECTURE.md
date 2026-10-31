# 天机台架构

## 总体

天机台保持纯静态部署。所有计算、模型配置和测评数据默认在浏览器内完成，不需要 API 服务或数据库。AI 只通过用户配置的 endpoint 直连；没有 Key 时使用本地规则降级。

```text
用户问题 + 可选生辰
        │
        ▼
事实层：src/core/bazi.ts + src/core/meihuaFacts.ts
        │  只产确定性 ChartFact
        ▼
知识层：src/knowledge/retrieve.ts
        │  按大师书目检索 public/corpus，引用再由 verify.ts 核验
        ▼
演绎层：src/ai/prompt.ts + client.ts / offline.ts
        │  AI 组织语言，失败/无 Key 自动离线降级
        ▼
测评层：src/arena/readingFlow.ts
        │  匿名双答 → 投票 → Elo/Wilson → 应验簿
        ▼
localStorage：src/arena/store.ts
```

## 模块边界

- `src/contract`：跨层数据契约。`Master` 区分 `active`/`planned`；`BlindMatch`、`MasterAnswer`、`Claim` 是测评闭环的最小数据。
- `src/core`：纯或近纯确定性算法。八字动态加载 `lunar-typescript`，梅花复用已通过《梅花易数》原例测试的 `gua.ts`/`meihua.ts`。
- `src/masters`：方法卡注册表，不持有运行时状态。只有 `active` 大师可以进入盲测。
- `src/knowledge`：复用现有 `searchCorpus`/`locateQuote`；不引入向量库，正文保持按书懒加载。
- `src/ai`：原生 `fetch` 的 OpenAI 兼容/Anthropic 客户端、SSE 解析、prompt、Markdown 段落解析和离线 fallback。没有 `v-html`，模型正文按文本渲染。
- `src/arena`：Elo、Wilson 下界、对局幂等、断言回填和本机数据导入导出。
- `src/pages`：产品流程；典籍阅读室和旧 `/t/meihua` 入口保持兼容。

## 安全与隐私

- Key 默认存于 `sessionStorage`；只有用户勾选持久化才写 `localStorage`。Key 不写入 prompt、导出 JSON、URL、日志或结果对象。
- 外部模型请求只发送用户确认的 endpoint、问题和确定性盘面；设置页明示该边界。
- 引文在客户端通过 `locateQuote` 回查；查不到标 `unverified`，不把模型自称的引文当成事实。
- 断言只有模型按日期格式输出后才进入本机应验簿，用户可逐条回填。

## 排名口径

所有大师初始 rating=1500，盲评使用 Elo，平局记 0.5。少于 5 场不进入“在榜”；胜率同时显示 Wilson 95% 下界，避免单次胜利制造虚假冠军。应验率只统计用户回填为“应验/未验”的断言，“无法判断”不进入分母。

## 后续算法移植门槛

旧 `archive-v1` 的紫微、奇门、六爻、六壬代码不直接复制。每个新内核必须先完成：

1. 输入边界与节气/时区规则说明；
2. 至少两条外部古籍原例或公开案例的期望值测试；
3. 非法输入和边界时刻测试；
4. strict TypeScript 下无 `any` 掩盖、无未使用导出；
5. 结果字段能在 UI 显示计算依据；
6. 通过后才把对应大师从 `planned` 改为 `active`。
