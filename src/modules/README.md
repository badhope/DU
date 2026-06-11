# modules/

8 个业务模块。模块之间禁止相互 import `logic/` 或 `data/`，仅允许通过 `@shared/*` 共享。

SP-1 状态：每个模块有 `index.ts` stub。SP-2 起搬入 `pages/` / `logic/` / `data/`。

| module | 中文 | 主题 |
|---|---|---|
| mingli | 命理 | 八字/五行/紫微/大运 |
| zhanbu | 占卜 | 梅卦/六壬/三式 |
| guanxiang | 观形 | 面/手/风水（SP-3 KnowledgeShell 化） |
| mingming | 命名 | 测字/起名 |
| jiankang | 健康 | 经络/养生/节气 |
| xiuxin | 修心 | 坐禅/冥想/拾句 |
| shenghuo | 生活 | 万年历/择吉/运势 |
| personal | 个人中心 | 首页/收藏/历史/玄枢台 |
