# 玄枢 v1.0.0 重做迁移 — SP-2 设计

> 状态: draft · 2026-06-10 · 5 SP 拆分后的第二阶段
> 前置: SP-1 已完成（6 commit），零 AI 残留 + 8 module stub + 5 alias + 2 strict 基线
> 后续: SP-3 观形 KnowledgeShell + 图片管线 + Store 拆分

## 1. 背景

SP-1 完成后，仓库 `src/` 仍为旧结构（pre-v1.0.0）：
- `src/components/{charts,effects,ui}/` — 37 个 Vue 组件
- `src/designs/{tokens,animations}.css` — 2 个 CSS
- `src/utils/` — 42 个 TS utils
- `src/pages/` — 46 个 Vue 页面
- `src/App.vue` 引用 `./designs/*`
- `src/pages.json` 46 路由路径仍是 `pages/...`

SP-2 目标：把上述资产搬到 v1.0.0 新结构（`src/shared/` + `src/modules/<m>/`），更新所有 import 引用，更新 `pages.json`，删除旧目录。

## 2. SP-2 目标

完成后仓库具备：

1. **shared 资产就位** — `src/shared/{components,styles,utils}/` 已填实
2. **8 个 module 已填实** — `src/modules/<m>/{pages,logic,data}/` 已填实
3. **settings 已填实** — `src/settings/pages/` 已填实
4. **旧目录已删除** — `src/{components,designs,pages,utils}/` 不再存在
5. **0 import 残留** — 所有 `@/components/...` `@/utils/...` `@/designs/...` 全部迁移到 `@shared/...` 或 `@modules/...`
6. **pages.json 已更新** — 46 路由路径全部指向新位置
7. **全栈验证通过** — type-check 0 错 / check-modules 6 步 / lint 0 warning / test 20+20 / build:h5 成功

## 3. 范围与不在范围

### 在范围

- 搬移 components/designs/utils/pages 到 v1.0.0 新结构
- 批量改写所有 `import` 路径
- 更新 `src/App.vue` 的 `@import` 路径
- 更新 `src/pages.json` 46 路由
- 更新 `src/stores/index.ts` 和 `src/config/tools.ts` 的 `@/utils/...` import
- 删除旧 `src/components/`、`src/designs/`、`src/utils/`、`src/pages/`
- 更新 `scripts/check-modules.mjs`：步骤 1 移除 "兼容期" 例外（modules 必须只用新 alias）

### 不在范围（后续 SP）

- Store 拆分（useAppStore + useSettingsStore）→ SP-3
- 观形 KnowledgeShell 化（mianxiang/shouxiang/fenglui）→ SP-3
- 图片管线（gen-illustrations.mjs）→ SP-3
- 动效 composable / route types / 错误边界 / Button Card / module manifest → SP-4
- v1.0.0 tag → SP-5

## 4. 详细搬移映射

### 4.1 shared 资产

| 旧路径                                  | 新路径                                              | 文件数 |
| --------------------------------------- | --------------------------------------------------- | ------ |
| `src/designs/tokens.css`                | `src/shared/styles/tokens.css`                      | 1      |
| `src/designs/animations.css`            | `src/shared/styles/animations.css`                  | 1      |
| `src/utils/daily-cooldown.ts`           | `src/shared/utils/daily-cooldown.ts`                | 1      |
| `src/utils/poster-renderer.ts`          | `src/shared/utils/poster-renderer.ts`               | 1      |
| `src/components/charts/*`                | `src/shared/components/charts/*`                    | 24     |
| `src/components/effects/*`              | `src/shared/components/effects/*`                   | 3      |
| `src/components/ui/*`                   | `src/shared/components/ui/*`                        | 10     |

### 4.2 utils 按模块归属（40 个）

| module    | utils                                                                                          | 数量 |
| --------- | ---------------------------------------------------------------------------------------------- | ---- |
| mingli    | bazi, bazi-deep, hehun, jiazu, jiegua, jiri, life, dayun-life, wuxing, wuxing-deep, ziwei, astro, tieban | 13   |
| zhanbu    | gua, liuren, liuyao, maya, meihua, qimen, tarot, xiaoliuren, xuankong, zhuge                   | 10   |
| guanxiang | chart-utils, fenglui, mianxiang, shouxiang                                                     | 4    |
| mingming  | jiaobei, kangxi-strokes, lingqian, mingji, shuzhi                                              | 5    |
| jiankang  | jingluo, meridian-data, use-cooldown, wufu, zhenci                                             | 5    |
| shenghuo  | huangli, jieqi, yunshi                                                                          | 3    |
| **合计**  |                                                                                                | **40** |

`meridian-data.ts` 体积较大且纯数据 → 放 `src/modules/jiankang/data/meridian-data.ts`（特殊处理）。
其他 39 个 utils 放 `src/modules/<m>/logic/<filename>.ts`。
`use-cooldown.ts` 是 composable → 放 `src/modules/jiankang/logic/use-cooldown.ts`（暂不抽到 shared/composables，SP-4 统一处理）。

### 4.3 pages 按模块归属（46 个）

| module    | pages                                                                                                                | 数量 |
| --------- | -------------------------------------------------------------------------------------------------------------------- | ---- |
| mingli    | wuxing, bazi, hehun, liunian, dayun, ziwei, life, astro, jiazu, jiri, tieban                                          | 11   |
| zhanbu    | qimen, liuren, gua, gua/interpret, tarot, meihua, liuyao, xuankong, xiaoliuren, zhuge, maya                          | 11   |
| guanxiang | mianxiang, shouxiang, fenglui                                                                                        | 3    |
| mingming  | jiaobei, lingqian, shuzhi, mingji                                                                                    | 4    |
| jiankang  | qijing, ziwu, wufu, yangsheng                                                                                        | 4    |
| xiuxin    | zhan, fangqi, shijian                                                                                                | 3    |
| shenghuo  | huangli, yunshi                                                                                                      | 2    |
| personal  | index, category, profile, dashboard, checkin, poster, users                                                          | 7    |
| settings  | settings                                                                                                             | 1    |
| **合计**  |                                                                                                                      | **46** |

### 4.4 pages.json 路径转换

```diff
-      "path": "pages/wuxing/wuxing",
+      "path": "modules/mingli/pages/wuxing/wuxing",
```

`gua` 有两个页面（gua/ 和 gua/interpret）→ `modules/zhanbu/pages/gua/{gua,interpret}.vue`。

## 5. Import 路径批量改写规则

**规则 A：components import**

```diff
- import TopBar from '@/components/ui/TopBar.vue'
+ import TopBar from '@shared/components/ui/TopBar.vue'
```

正则：`@/components/(charts|effects|ui)/` → `@shared/components/\1/`

**规则 B：utils import（区分 shared / module）**

```diff
- import { drawCards } from '@/utils/tarot'                        # tarot → zhanbu
+ import { drawCards } from '@modules/zhanbu/logic/tarot'

- import { newDivinator } from '@/utils/daily-cooldown'           # daily-cooldown → shared
+ import { newDivinator } from '@shared/utils/daily-cooldown'
```

**规则 C：utils → module 映射表**（脚本维护）

```python
UTIL_TO_MODULE = {
    # shared
    'daily-cooldown': 'shared/utils',
    'poster-renderer': 'shared/utils',
    # mingli
    'astro': 'mingli/logic', 'bazi': 'mingli/logic', ...
    # zhanbu
    'gua': 'zhanbu/logic', 'liuren': 'zhanbu/logic', ...
    # jiankang (特殊: meridian-data 放 data/)
    'meridian-data': 'jiankang/data',
    ...
}
```

**规则 D：pages import（pages 引用 pages）**

uni-app 路由跳转用绝对路径或 `pages/...`，但页面之间不直接 import。保留 `<navigator>` 或 store 跳转。

**规则 E：CSS @import**

```diff
- @import './designs/tokens.css';
+ @import './shared/styles/tokens.css';
```

仅改 `src/App.vue`（仅此一处用相对 @import 引用 designs）。

## 6. scripts/move-sp2.mjs 设计

**职责**：

1. 读 `docs/superpowers/sp2-mappings.json`（人类可读映射表 + 机器执行清单）
2. 对每条映射执行 `git mv <old> <new>` 保留历史
3. 对每个新位置的 `.ts/.vue` 文件，跑 `scripts/rewrite-imports.py` 改 import
4. 对 `src/App.vue` 改 `@import` 路径
5. 对 `src/pages.json` 改 `path` 字段

**dry-run 模式**：`--dry-run` 仅打印计划，不动文件。

**rollback 模式**：`--rollback`（基于 `docs/superpowers/sp2-mappings.json` 反向操作）。

**scripts/rewrite-imports.py**：

```python
# 1. 解析所有 .ts/.vue 文件
# 2. 对每个文件扫描 import 语句
# 3. 匹配 '@/components/X/Y' 或 '@/utils/X' 或 '@/designs/X' 或 '@/pages/X'
# 4. 按映射表替换为 '@shared/...' 或 '@modules/...'
# 5. 写入新文件（保留原文件不动，让 git mv 后的指针对应新内容）
```

## 7. 验收（SP-2 完成态）

```bash
# 1. 新结构就位
ls -d src/shared/{components,styles,utils}
ls src/shared/components/charts | wc -l   # 期望: 24
ls src/shared/components/effects | wc -l  # 期望: 3
ls src/shared/components/ui | wc -l       # 期望: 10
for m in mingli zhanbu guanxiang mingming jiankang xiuxin shenghuo personal; do
  ls src/modules/$m/pages 2>/dev/null | wc -l
  ls src/modules/$m/logic 2>/dev/null | wc -l
done
ls src/settings/pages | wc -l            # 期望: 1

# 2. 旧目录已删
test ! -d src/components && echo "✓ components deleted"
test ! -d src/designs && echo "✓ designs deleted"
test ! -d src/utils && echo "✓ utils deleted"
test ! -d src/pages && echo "✓ pages deleted"

# 3. 0 import 残留
grep -rn "@/components/\|@/utils/\|@/designs/\|@/pages/" src/ 2>&1
# 期望: 空

# 4. 全栈验证
pnpm type-check      # 0 错
pnpm check:modules   # 6 步通过
pnpm lint            # 0 warning
pnpm test            # 全过
pnpm build:h5        # 成功
```

## 8. 风险与缓解

| 风险                                       | 缓解                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 42 utils × 46 pages 搬移后 import 错误     | 写 python 脚本批量改（不手工 Edit） + Grep 验证 + type-check 兜底                              |
| 路径写错导致运行时找不到组件                | 改完每步跑 `pnpm type-check` + `pnpm build:h5` 验证                                           |
| 脚本覆盖了不需要改的文件                   | 脚本只处理 `git mv` 后的新位置文件 + 严格正则匹配 import                                       |
| 7 个 charts/24 文件搬移耗时                | 一个 git mv 一次性 + 一次性 regex rewrite                                                     |
| SP-1 spec/plan 与 SP-2 spec 冲突           | SP-2 spec 是 SP-1 spec 的扩展（继承 + 细化），不冲突                                          |
| pages.json 改错导致页面找不到              | 写脚本基于 `sp2-mappings.json` 自动转换 + 跑 dev server 抽样访问验证                          |

## 9. 交付物

- `docs/superpowers/specs/2026-06-10-sp2-shared-modules-design.md`（本文件）
- `docs/superpowers/plans/2026-06-10-sp2-shared-modules-impl.md`
- `docs/superpowers/sp2-mappings.json`（人类可读 + 机器执行）
- `scripts/move-sp2.mjs`（搬移 + 改 import 编排）
- `scripts/rewrite-imports.py`（import 路径批量改写）
- 约 27 commits：
  - 1 commit 写脚本
  - 2 commit 搬 shared/styles
  - 1 commit 搬 shared/utils
  - 3 commits 搬 shared/components（charts/effects/ui）
  - 8 commits 搬 8 module 的 utils
  - 9 commits 搬 8 module + settings 的 pages
  - 1 commit 更新 pages.json + App.vue + uni.scss + stores + config
  - 1 commit 删旧目录
  - 1 commit 全栈验证

## 10. 不在 SP-2 的后续

- SP-3：观形 KnowledgeShell（mianxiang/shouxiang/fenglui 三页双 tab + 3 SVG + 36 知识条目 + 26 illustration specs）、图片管线（`gen-illustrations.mjs`）、Store 拆分（useAppStore + useSettingsStore + 持久化 v3 迁移 + 4 测试）
- SP-4：6 motion composable + Button/Card + page-fade + `gen-route-types.mjs` + 8 module manifest + 4 manifest tests + `ModuleErrorBoundary.vue` + `Result<T,E>` + 5 算法 safe wrapper + `check-bundle.mjs` + a11y
- SP-5：v1.0.0 tag + 3 测试 + 8 模块 README + 根 README project structure + version 1.0.0
