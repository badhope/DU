# MISTVERSE 玄枢 · SP-1 ~ SP-9 重构路线图

> 目标：在 v1.0.1 稳定基线之上，渐进式完成"删除 AI 智能助手（本地无可用 LLM，UI 是空壳）"、迁移到 `src/modules/` 模块化目录、启用 12 项 TypeScript 严格选项、抽取 `src/shared/` 共享层、修复已知 bug、补齐 dogfood 与预览脚本。所有改动必须**逐步可验证**（type-check / test / build / 预览 dogfood），最后一次性 `git push --force` 覆盖 main。

**基线状态（v1.0.1）**：

- `pnpm install` 28s / `pnpm type-check` 0 错 / `pnpm test` 20/20 / `pnpm build:h5` 成功
- 47 页面 / 41 utils（扁平 `src/pages/`、`src/utils/`）
- TypeScript 严格度：仅继承 `@vue/tsconfig/tsconfig.dom.json`（基线 strict）

---

## 9 轮总体顺序与依赖

| 轮次      | 目标                                                                                                                               | 影响面       | 验证                                | 估时   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------- | ------ |
| **SP-1**  | 删除 6 个 AI 页面 + `src/utils/ai.ts` + 路由配置 + AI 成就                                                                         | 中：14 文件  | type-check / test / build           | 30 min |
| **SP-2**  | 抽取 `src/shared/components/ui/`、`src/shared/styles/`、`src/shared/composables/` 共享层                                           | 中：~10 文件 | type-check / build                  | 45 min |
| **SP-3**  | 迁移命理类 → `src/modules/mingli/`（pages/ + logic/）                                                                              | 大：~15 文件 | type-check / test / build / dogfood | 60 min |
| **SP-4**  | 迁移占卜类 → `src/modules/zhanbu/`                                                                                                 | 大：~12 文件 | 同上                                | 45 min |
| **SP-5**  | 迁移古物/健康/修心/生活/个人中心类 5 个 module                                                                                     | 大：~25 文件 | 同上                                | 90 min |
| **SP-6**  | TS 严格选项第 1 轮（3 个）：`exactOptionalPropertyTypes` / `noImplicitOverride` / `noUncheckedIndexedAccess`                       | 中：~30 文件 | type-check                          | 60 min |
| **SP-7**  | TS 严格选项第 2 轮（3 个）：`noPropertyAccessFromIndexSignature` / `noFallthroughCasesInSwitch` / `noImplicitReturns`              | 中：~25 文件 | type-check                          | 60 min |
| **SP-8**  | TS 严格选项第 3 轮（3 个）：`useUnknownInCatchVariables` / `noImplicitThis` / `strictBindCallApply`                                | 小：~15 文件 | type-check                          | 45 min |
| **SP-9**  | TS 严格选项第 4 轮（3 个）：`strictPropertyInitialization` / `noUnusedLocals` / `noUnusedParameters`                               | 中：~30 文件 | type-check + 测试补全               | 60 min |
| **SP-10** | Bug 修复：56 个错误 navigateTo URL + 9 个真实 bug（mingji/jingluo/lingqian/dayun/shijian/checkin/poster/ResultReveal/LoadingSeal） | 中：~15 文件 | type-check / test / build / dogfood | 90 min |
| **SP-11** | 补脚本：`spa-server.py`（H5 SPA fallback server）+ `dogfood.py`（Playwright 自动化回归）+ `scripts/fix-routes.py`（保留备用）      | 新增文件     | 手动跑一次 dogfood                  | 45 min |

**累计**：约 10 小时实际开发时间（沙箱内可分多次 session 完成）。

**关键原则**：

- 每一轮**结束必须**：`pnpm type-check && pnpm test && pnpm build:h5` 三项全绿
- 每一轮**独立 commit**：`git commit -m "SP-N: 简短描述"`
- 最后一轮全部完成 → `git log --oneline` 核对 → `git push --force origin main`（保留远程的 README/CI/CHANGELOG 等基础设施）

---

## 9 轮目标详细

### SP-1 · 删除 AI 智能助手

- 删除 6 个 AI 页面：`src/pages/ai/ai-*.vue`
- 删除 `src/utils/ai.ts`（如果只是空壳）
- 删除 `src/pages.json` 6 个 AI 路径
- 删除 `src/stores/index.ts` 中 `ai-*` 6 个 ToolKey + ChatSession 相关代码（getChatSession / appendChatMessage / setChatPersona / clearChatSession / clearAllChatSessions / totalChatTurns / chattedMasters / 持久化字段）
- 删除 `src/config/tools.ts` 6 个 AI 工具
- 删除 `ai-master` 成就
- 调整 README / CHANGELOG 工具计数：49 → 43

### SP-2 · 抽取 shared/ 共享层

- 创建 `src/shared/components/ui/ResultReveal.vue`（从 `src/components/ui/ResultReveal.vue` 移入）
- 创建 `src/shared/components/ui/LoadingSeal.vue` + `BodyMap.vue` + 其他高频组件
- 创建 `src/shared/components/ui/result-reveal-helpers.ts`（`resolveHostEl` helper）
- 创建 `src/shared/styles/`（整合 `src/designs/animations.css` + `tokens.css`）
- 创建 `src/shared/composables/`（`use-cooldown.ts` + 未来新增的 composable）
- 调整所有 imports：`@/components/ui/X` → `@/shared/components/ui/X`

### SP-3 · 迁移命理类

- 新建 `src/modules/mingli/`（pages/ + logic/）
- 移动页面：wuxing, bazi, hehun, liunian, dayun, huangli, jiazu, ziwei, life, astro, maya, ziwei
- 移动 logic：wuxing.ts, wuxing-deep.ts, bazi.ts, bazi-deep.ts, hehun.ts, liunian.ts, dayun-life.ts, huangli.ts, jiazu.ts, ziwei.ts, life.ts, astro.ts, maya.ts
- 调整 `pages.json` 路径：`pages/X/X` → `modules/mingli/pages/X`

### SP-4 · 迁移占卜类

- 新建 `src/modules/zhanbu/`
- 移动页面：gua, liuyao, meihua, qimen, liuren, xiaoliuren, tarot, jiaobei, wufu, zhuge, lingqian, shuzhi
- 移动 logic：gua.ts, liuyao.ts, jiegua.ts, meihua.ts, qimen.ts, liuren.ts, xiaoliuren.ts, tarot.ts, jiaobei.ts, wufu.ts, zhuge.ts, lingqian.ts, shuzhi.ts, jieqi.ts

### SP-5 · 迁移古物/健康/修心/生活/个人中心

- 5 个 module：
  - `src/modules/guanxiang/`：mianxiang, shouxiang, fenglui, mingji + logic
  - `src/modules/jiankang/`：qijing, ziwu, wufu, yangsheng + jingluo.ts, meridian-data.ts, zhenci.ts
  - `src/modules/xiuxin/`：zhan, fangqi, shijian, dayun
  - `src/modules/shenghuo/`：huangli, jiri, yunshi
  - `src/modules/mingming/`：hmm（命名测字已经在 guwu）

修正：原 v1.0.1 把"命名测字"放在 guwu 类。从语义看 mianxiang/shouxiang/fenglui 都是观相类（guanxiang），mingji 独立。先按 v1.0.1 分类的 6 大类对应 6 个 module（mingli/zhanbu/guanxiang+guwu/jiankang/xiuxin/shenghuo），加 personal module 装个人中心 4 页（profile/dashboard/checkin/poster/users）。

最终 8 个 module：mingli / zhanbu / guwu / jiankang / xiuxin / shenghuo / personal / common

### SP-6 ~ SP-9 · TS 12 strict

每轮开启 2-3 个 strict 选项，修复全部报错后 commit。基线 tsconfig 已有 strict，**只是没启用** 12 个额外的严格选项。

### SP-10 · 9 个 bug 修复

- 56 个错误 navigateTo URL（`/pages/X/Y` → `/modules/M/pages/X`）
- LoadingSeal v-if 缺失（9 个工具页）
- ResultReveal ref 多态 + `> *` selector
- mingji 复姓分支 `length === 4`
- jingluo 16 → 216 穴位
- 灵签 draw() 顺序
- 大运流转 SVG 转折点 click
- 拾句缺收藏
- 签到无动画
- poster canvas H5

### SP-11 · 脚本

- `spa-server.py`：H5 SPA fallback server（`/mistverse/` 前缀剥离 + 404 fallback 到 index.html）
- `dogfood.py`：Playwright 自动化（headless chromium，414x896，dpr=2），并行 7 子 agent 测 47 页面
- `scripts/fix-routes.py`：navigateTo URL 批量修复脚本（保留备用）

---

## 推送策略

- SP-1 ~ SP-11 全部完成后：`git log --oneline` 核对 ~25 个 commit
- 检查：README、CHANGELOG、CI 仍可用
- `git remote set-url origin https://ghp_xxx@github.com/badhope/mistverse.git`（用户提供 token）
- `git push --force origin main`

## 当前进度

| 轮次         | 状态                |
| ------------ | ------------------- |
| SP-1         | 📝 计划已写，待执行 |
| SP-2 ~ SP-11 | ⏳ 待启动           |
