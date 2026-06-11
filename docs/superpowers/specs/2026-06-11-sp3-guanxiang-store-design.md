# 玄枢 v1.0.0 重做 — SP-3 设计：观形 KnowledgeShell + 图片管线 + Store 拆分

> 状态: draft · SP-1 + SP-2 已完成（5 项验证 0 错）· SP-3 严格展开
> 日期: 2026-06-11
> 范围来源: SP-1 spec §10（"不在 SP-1 的后续"）

## 1. 背景

SP-2 已完成 127 文件搬移（41 shared + 40 utils + 46 pages），全栈 0 错。观形 3 pages（mianxiang/shouxiang/fenglui）当前是"setup + result"二段式，结果区直接展开所有卡片，无"知识库"维度。`src/stores/index.ts` 861 行单文件，含 settings/profile/history/notes/achievements/checkin/divination 7 块。

SP-3 三件大事：

| Task   | 主题                                          | 工作量        |
| ------ | --------------------------------------------- | ------------- |
| Task 1 | 观形 KnowledgeShell（双 tab + 36 知识条目）   | 大（3 pages） |
| Task 2 | 图片管线 `gen-illustrations.mjs`              | 中（1 脚本）  |
| Task 3 | Store 拆分 `useAppStore` + `useSettingsStore` | 中（+4 测试） |

## 2. SP-3 目标

完成后：

1. **观形 3 pages 双 tab** — "分析"（现功能）+ "知识库"（12 宫位 / 八宫丘 / 八方吉凶 等 36 条知识卡片）
2. **3 SVG 知识图** — 在知识库顶部复用现有 `MianXiangChart` / `ShouXiangChart` / `FengLuiChart` 作为知识总览图
3. **26 illustration specs** — 知识条目对应的配图规格 JSON（id/key/尺寸/风格/位置）
4. **图片管线** — `scripts/gen-illustrations.mjs` 读 specs 输出 SVG 占位文件 + 索引清单
5. **Store 拆分** — `src/stores/app.ts`（useAppStore）+ `src/stores/settings.ts`（useSettingsStore）+ 持久化 v3 独立 key
6. **4 测试** — 覆盖拆分后两个 store 的核心方法 + 持久化迁移
7. **全栈 0 错** — type-check / check-modules / lint / test / build 全过

## 3. 范围与不在范围

### 在范围

- 观形 3 pages 改造：加 `TabBar` 组件 + 知识库 tab + 36 知识条目
- `src/shared/components/ui/KnowledgeShell.vue`（新通用组件，封装 TabBar + TabContent + 知识卡片）
- `src/shared/components/ui/KnowledgeCard.vue`（新通用组件，标题 + 描述 + 缩略图占位 + 展开详情）
- `src/shared/components/ui/TabBar.vue`（新通用组件，2-3 个 tab 切换）
- 观形 3 个知识数据文件：`src/modules/guanxiang/logic/knowledge-{mianxiang,shouxiang,fenglui}.ts`
- `src/modules/guanxiang/logic/illustration-specs.ts`（26 个 illustration spec）
- `scripts/gen-illustrations.mjs`（读 specs 输出 SVG 占位 + 索引）
- `src/shared/styles/tokens.css` 加 `--tab-active` / `--tab-inactive` / `--knowledge-card-bg` 4 个 token
- `src/stores/index.ts` 拆为 `src/stores/app.ts` + `src/stores/settings.ts` + `src/stores/index.ts`（re-export）
- `src/stores/settings.ts` 用独立 key `mistverse-settings-v1`
- `src/stores/app.ts` 用独立 key `mistverse-app-v1`，迁移 v3 读 → 写 v1，v3 保留
- 4 测试：`tests/stores/app.test.ts`（2 个）+ `tests/stores/settings.test.ts`（2 个）
- 自动化：把 `pages/*/tab-bar` / `pages/*/knowledge-card` 等通用 component 允许引 modules（`scripts/check-modules.mjs` 升级）

### 不在范围（后续 SP）

- 真实 SVG 配图（仅生成占位 SVG + spec JSON，留待 SP-4 真实配图管线）→ 推后
- 模块 README 8 个 → SP-5
- motion composable 6 个 → SP-4
- 路由类型 + module manifest → SP-4
- v1.0.0 tag → SP-5
- KnowledgeShell 用于其他模块（修心 3 / 命名 4 / 健康 4）→ SP-4 推广

## 4. Task 1：观形 KnowledgeShell

### 4.1 架构

```
观形 3 pages (mianxiang / shouxiang / fenglui)
  └─ 顶部: TopBar（已有）
  └─ TabBar: [分析] [知识库]    ← 新
      └─ 分析 tab: 现有 setup + result 卡片（不改动逻辑）
      └─ 知识库 tab:
          └─ 顶部 SVG 总览图（复用 MianXiangChart / ShouXiangChart / FengLuiChart）
          └─ 知识卡片网格: 36 条（mianxiang 12 + shouxiang 12 + fenglui 12）
              └─ 每张: 图标 + 名称 + 一句话 + 展开详情 + illustration 占位
```

### 4.2 知识数据（36 条）

**mianxiang 12 知识**（每条 `{key, name, pos, desc, fiveElement?, illustId}`）：

| #   | key        | name   | 元素 | illustId |
| --- | ---------- | ------ | ---- | -------- |
| 1   | san-ting-1 | 上停   | 木   | st-shang |
| 2   | san-ting-2 | 中停   | 土   | st-zhong |
| 3   | san-ting-3 | 下停   | 水   | st-xia   |
| 4   | wu-guan-1  | 眉     | 木   | wg-mei   |
| 5   | wu-guan-2  | 眼     | 火   | wg-yan   |
| 6   | wu-guan-3  | 鼻     | 土   | wg-bi    |
| 7   | wu-guan-4  | 口     | 金   | wg-kou   |
| 8   | wu-guan-5  | 耳     | 水   | wg-er    |
| 9   | shi-er-1   | 命宫   | 火   | g12-ming |
| 10  | shi-er-2   | 财帛宫 | 土   | g12-cai  |
| 11  | shi-er-3   | 夫妻宫 | 木   | g12-fu   |
| 12  | shi-er-4   | 疾厄宫 | 水   | g12-ji   |

**shouxiang 12 知识**（每条 `{key, name, pos, desc, fiveElement?, illustId}`）：

| #   | key       | name   | 元素 | illustId     |
| --- | --------- | ------ | ---- | ------------ |
| 1   | ba-gong-1 | 乾宫   | 金   | bg-qian      |
| 2   | ba-gong-2 | 兑宫   | 金   | bg-dui       |
| 3   | ba-gong-3 | 离宫   | 火   | bg-li        |
| 4   | ba-gong-4 | 震宫   | 木   | bg-zhen      |
| 5   | ba-gong-5 | 巽宫   | 木   | bg-xun       |
| 6   | ba-gong-6 | 坎宫   | 水   | bg-kan       |
| 7   | ba-gong-7 | 艮宫   | 土   | bg-gen       |
| 8   | ba-gong-8 | 坤宫   | 土   | bg-kun       |
| 9   | zhou-1    | 木星丘 | 木   | zhou-mu      |
| 10  | zhou-2    | 太阳丘 | 火   | zhou-taiyang |
| 11  | zhou-3    | 金星丘 | 金   | zhou-jin     |
| 12  | zhou-4    | 水星丘 | 水   | zhou-shui    |

**fenglui 12 知识**（每条 `{key, name, direction, desc, jiXiong?, illustId}`）：

| #   | key        | name | illustId   |
| --- | ---------- | ---- | ---------- |
| 1   | ba-fang-1  | 东南 | bf-dongnan |
| 2   | ba-fang-2  | 南方 | bf-nan     |
| 3   | ba-fang-3  | 西南 | bf-xinan   |
| 4   | ba-fang-4  | 东方 | bf-dong    |
| 5   | ba-fang-5  | 西方 | bf-xi      |
| 6   | ba-fang-6  | 西北 | bf-xibei   |
| 7   | ba-fang-7  | 北方 | bf-bei     |
| 8   | ba-fang-8  | 东北 | bf-dongbei |
| 9   | ming-gua-1 | 坎命 | mg-kan     |
| 10  | ming-gua-2 | 离命 | mg-li      |
| 11  | ming-gua-3 | 震命 | mg-zhen    |
| 12  | ming-gua-4 | 巽命 | mg-xun     |

合计 36 知识条目 = 3 × 12。

### 4.3 Illustration Specs（26 个）

`src/modules/guanxiang/logic/illustration-specs.ts`：

```ts
export interface IllustrationSpec {
  id: string // 唯一 id，对应知识条目 illustId
  name: string // 中文名
  category: 'face' | 'palm' | 'fengshui'
  size: { w: number; h: number } // 建议尺寸
  style: 'line' | 'block' | 'icon' // 占位 SVG 风格
  position?: { x: number; y: number } // 在图中的位置（用于 face/palm 部位图）
  prompt: string // 真实配图 prompt（SP-4 用）
}

export const ILLUSTRATION_SPECS: IllustrationSpec[] = [
  // mianxiang 8 个部位图（5 五官 + 3 三停）
  {
    id: 'st-shang',
    name: '上停示意',
    category: 'face',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 100, y: 50 },
    prompt: '...',
  },
  // ... 共 26 个
]
```

**26 个 distribution**：

- mianxiang: 5 五官 + 3 三停 = 8 个
- shouxiang: 4 八宫 + 4 丘 = 8 个
- fenglui: 8 方位 + 2 命卦（坎/离）= 10 个

### 4.4 通用组件

**`src/shared/components/ui/TabBar.vue`**（2-3 tab 切换）：

```vue
<script setup lang="ts">
interface Tab {
  key: string
  label: string
}
defineProps<{ tabs: Tab[]; modelValue: string }>()
defineEmits<{ 'update:modelValue': [v: string] }>()
</script>

<template>
  <view class="tab-bar" role="tablist">
    <view
      v-for="t in tabs"
      :key="t.key"
      class="tab-item"
      :class="{ active: modelValue === t.key }"
      role="tab"
      :aria-selected="modelValue === t.key"
      @click="$emit('update:modelValue', t.key)"
    >
      <text class="tab-label">{{ t.label }}</text>
    </view>
  </view>
</template>

<style scoped>
.tab-bar {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 32rpx;
  border-bottom: 1rpx solid var(--token-divider);
}
.tab-item {
  padding: 16rpx 24rpx;
  border-radius: 8rpx;
  cursor: pointer;
  transition: background 0.2s;
}
.tab-item.active {
  background: var(--token-tab-active, rgba(212, 175, 55, 0.15));
  color: var(--token-zhu);
}
.tab-item:not(.active) {
  color: var(--token-fg2);
}
</style>
```

**`src/shared/components/ui/KnowledgeCard.vue`**（标题 + 一句话 + 展开）：

```vue
<script setup lang="ts">
import { ref } from 'vue'
defineProps<{ title: string; summary: string; expanded?: string }>()
const open = ref(false)
</script>

<template>
  <view class="k-card card-mystic" :class="{ open }" @click="open = !open">
    <view class="k-head">
      <text class="k-title title-mystic">{{ title }}</text>
      <text class="k-sum">{{ summary }}</text>
    </view>
    <view v-if="expanded && open" class="k-body">
      <text class="k-detail">{{ expanded }}</text>
    </view>
  </view>
</template>
```

**`src/shared/components/ui/KnowledgeShell.vue`**（知识库容器，含 SVG 总览 + 卡片网格）：

```vue
<script setup lang="ts" generic="T extends { key: string; name: string; illustId: string }">
import KnowledgeCard from './KnowledgeCard.vue'
defineProps<{ items: T[]; summary: Record<string, string>; details: Record<string, string> }>()
</script>

<template>
  <view class="k-shell">
    <slot name="overview" />
    <view class="k-grid">
      <KnowledgeCard
        v-for="it in items"
        :key="it.key"
        :title="it.name"
        :summary="summary[it.key] || ''"
        :expanded="details[it.key]"
      />
    </view>
  </view>
</template>
```

### 4.5 Pages 改造

`mianxiang.vue` 改造 diff（伪）：

```vue
<!-- 顶部: 加 TabBar -->
<TabBar v-model="activeTab" :tabs="[{ key: 'analyze', label: '分 析' }, { key: 'knowledge', label: '知 识 库' }]" />

<!-- 分析 tab: 用 v-if 包住现有 setup + result 块 -->
<view v-if="activeTab === 'analyze'">
  <view v-if="!result" class="setup ...">...</view>
  <view v-else class="result ...">...</view>
</view>

<!-- 知识库 tab: 新 -->
<view v-else class="knowledge">
  <view class="ov-card card-mystic">
    <MianXiangChart :result="demoResult" />
  </view>
  <KnowledgeShell :items="MIANXIANG_KNOWLEDGE" :summary="MIANXIANG_SUMMARY" :details="MIANXIANG_DETAILS">
    <template #overview>...</template>
  </KnowledgeShell>
</view>
```

> shouxiang / fenglui 同样模式。

### 4.6 验收

- 3 pages 都有 TabBar，默认选中"分析"
- 知识库 tab 显示 12 知识卡片 + SVG 总览
- 点击卡片可展开详情
- 切换 tab 不丢分析结果
- type-check 0 错 / check-modules 0 错 / lint 0 错 / test 全过

## 5. Task 2：图片管线 `gen-illustrations.mjs`

### 5.1 目标

读 `src/modules/guanxiang/logic/illustration-specs.ts`（26 spec）→ 输出：

1. `src/static/illustrations/<id>.svg`（26 个占位 SVG，line/block/icon 风格）
2. `src/static/illustrations/manifest.json`（索引清单：id → 文件路径 + metadata）

### 5.2 脚本设计

```js
// scripts/gen-illustrations.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SPEC_FILE = join(ROOT, 'src/modules/guanxiang/logic/illustration-specs.ts')
const OUT_DIR = join(ROOT, 'src/static/illustrations')
const MANIFEST = join(OUT_DIR, 'manifest.json')

// 1) 解析 illustration-specs.ts → 提取 ILLUSTRATION_SPECS 数组
// 2) 为每个 spec 生成占位 SVG 字符串
// 3) 写文件到 OUT_DIR
// 4) 写 manifest.json
```

### 5.3 占位 SVG 模板

```js
function genSvg({ id, name, size, style, position }) {
  const { w, h } = size
  const fill = '#1F1F2B'
  const stroke = '#D4AF37'
  const label = name
  if (style === 'icon') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="8"/><text x="${w / 2}" y="${h / 2 + 6}" text-anchor="middle" fill="${stroke}" font-size="14" font-family="serif">${label}</text></svg>`
  }
  if (style === 'line') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="none" stroke="${stroke}" stroke-width="1" opacity="0.5"/><circle cx="${position?.x ?? w / 2}" cy="${position?.y ?? h / 2}" r="20" fill="none" stroke="${stroke}" stroke-width="1.5"/><text x="${w / 2}" y="${h - 12}" text-anchor="middle" fill="${stroke}" font-size="12" font-family="serif" opacity="0.7">${label}</text></svg>`
  }
  // 'block' 类似
  ...
}
```

### 5.4 验收

- 跑 `node scripts/gen-illustrations.mjs` 一次
- `src/static/illustrations/` 下有 26 `.svg` 文件 + `manifest.json`
- 跑第二次幂等（不重复生成相同内容，hash 检查）
- type-check / check-modules / lint 0 错

## 6. Task 3：Store 拆分

### 6.1 拆分策略

**当前**：`src/stores/index.ts`（861 行）= settings + profile + history + favorites + notes + achievements + checkin + divination 8 块。

**拆为**：

- `src/stores/settings.ts`（`useSettingsStore`，~80 行）— fontSize / reducedMotion / soundEnabled / hapticsEnabled / showGuide / theme / font / mode / i18n + 9 个 setter
- `src/stores/app.ts`（`useAppStore`，~600 行）— history / profile / favorites / notes / achievements / checkin / divination 7 块
- `src/stores/index.ts`（re-export 两个）— `export { useAppStore } from './app'; export { useSettingsStore } from './settings';`

**持久化拆分**：

- 旧 key `mistverse-state-v3`（含 settings + app）→ 拆为：
  - `mistverse-settings-v1`（settings 独立）
  - `mistverse-app-v1`（app 独立）
- 旧 key 读：尝试读 v3，剥离 settings / app 两块写回 v1，v3 保留不动
- 启动时优先 v1，找不到 v3 迁移

### 6.2 接口兼容

`useAppStore()` 调用点不动（re-export 保持原 API），但内部 `settings` 字段移除（迁移到 `useSettingsStore`）。

**所有引用 `app.settings.xxx` 的地方改为 `useSettingsStore().xxx`**（`grep` 扫后批量改）。

### 6.3 类型迁移

`PersistState` 拆为 `AppPersistState` + `SettingsPersistState`（分别独立 type）。

`ToolKey` / `UserProfile` / `HistoryItem` / `Note` / `Achievement` / `CheckinInfo` / `DivinationRecord` 全部留在 `app.ts`（业务相关）。

`ThemeKey` / `FontKey` / `ModeKey` 移到 `settings.ts`。

### 6.4 4 测试

**`tests/stores/app.test.ts`**：

- `test1`: 加载不存在 key → 用默认 state，`addHistory` 正确，`clearHistory` 清空
- `test2`: 历史记录截断 50 条（`addHistory` 50+ 次 → 长度 50），成就自动检查

**`tests/stores/settings.test.ts`**：

- `test3`: 加载 v3 旧 key → 迁移后 settings 各字段正确
- `test4`: `setTheme('xuanhuang' | 'xuanzi' | 'xuanqing')` 切换 + 持久化 + 重新加载正确

### 6.5 验收

- 拆分后 5 项验证 0 错
- 4 测试全过
- 旧 v3 key 用户加载后自动迁移到 v1
- 调用点 `app.settings.xxx` → `useSettingsStore().xxx` 全部改完

## 7. 验收（SP-3 整体）

```bash
pnpm type-check              # 0 错
pnpm check:modules           # 0 错（含 KnowledgeShell 允许引 modules 规则）
pnpm lint                    # 0 warning
pnpm test                    # 24+ 测试（20 旧 + 4 新）全过
pnpm build:h5                # 构建成功
node scripts/gen-illustrations.mjs  # 生成 26 SVG + manifest
```

## 8. 风险与缓解

| 风险                              | 缓解                                                             |
| --------------------------------- | ---------------------------------------------------------------- |
| 3 pages 改造工作量大，可能漏细节  | 写 spec 锁定 36 知识条目表，TDD 验证 knowledge import 不为空     |
| KnowledgeShell 通用组件抽象不够用 | 先在观形 1 page 跑通（Task 1 步 6-10），再推广到 3 pages         |
| 持久化 v3 → v1 迁移丢数据         | 旧 v3 key 保留不动，迁移只是把数据"复制"到 v1                    |
| `useAppStore` 调用点改动漏改      | 5 项验证 + grep 兜底 + `app.settings.xxx` 编译报错               |
| 26 SVG 占位文件提交后膨胀仓库     | 加 `.gitignore` 例外（已含 `src/static/` 全部提交），实际 < 30KB |

## 9. 交付物

- `src/shared/components/ui/TabBar.vue`（新）
- `src/shared/components/ui/KnowledgeCard.vue`（新）
- `src/shared/components/ui/KnowledgeShell.vue`（新）
- `src/modules/guanxiang/logic/knowledge-{mianxiang,shouxiang,fenglui}.ts`（3 新）
- `src/modules/guanxiang/logic/illustration-specs.ts`（新）
- `src/modules/guanxiang/pages/{mianxiang,shouxiang,fenglui}.vue`（3 改造）
- `src/shared/styles/tokens.css`（加 4 token）
- `scripts/gen-illustrations.mjs`（新）
- `src/static/illustrations/*.svg`（26 新）+ `manifest.json`
- `src/stores/app.ts`（从 index.ts 拆出）
- `src/stores/settings.ts`（从 index.ts 拆出）
- `src/stores/index.ts`（re-export）
- `tests/stores/app.test.ts`（新）
- `tests/stores/settings.test.ts`（新）
- `scripts/check-modules.mjs`（升 step 1 允许 KnowledgeShell 引 modules）
- 5 commit 序列：Task 1 / Task 1.5（components） / Task 2 / Task 3 / Task 3.5（tests）

## 10. 不在 SP-3 的后续

- SP-4：6 motion composable + Button/Card + page-fade + 路由类型 + 8 module manifest + 错误边界 + Result<T,E> + 5 算法 safe wrapper + check-bundle.mjs + a11y
- SP-5：v1.0.0 tag + 8 模块 README + 根 README project structure + 1 集成测试 + version 1.0.0
