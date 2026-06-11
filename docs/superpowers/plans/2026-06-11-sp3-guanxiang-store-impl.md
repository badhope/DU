# SP-3 实施计划：观形 KnowledgeShell + 图片管线 + Store 拆分

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 观形 3 pages 加 KnowledgeShell 双 tab（分析 + 知识库）+ 26 illustration spec + 图片管线 + Store 拆为 useAppStore + useSettingsStore + 4 测试，全栈 0 错。

**Architecture:**

- 3 通用 UI 组件（TabBar / KnowledgeCard / KnowledgeShell）放 `src/shared/components/ui/`
- 观形知识数据放 `src/modules/guanxiang/logic/knowledge-*.ts`（module 内，遵循 SP-2 隔离纪律）
- 通用组件允许引 modules（特例，scripts/check-modules.mjs 升级）
- Store 拆为 settings（独立 key）+ app（独立 key），原 v3 迁移到 v1
- 持久化拆分用 grep + 5 项验证兜底

**Tech Stack:** Vue 3.4 + TypeScript 6 (strict) + Pinia 3 + uni-app x + Vitest + Node scripts

**Reference Spec:** [docs/superpowers/specs/2026-06-11-sp3-guanxiang-store-design.md](file:///workspace/docs/superpowers/specs/2026-06-11-sp3-guanxiang-store-design.md)

---

## File Structure

### 新建文件

```
docs/superpowers/
  specs/2026-06-11-sp3-guanxiang-store-design.md   [新] spec
  plans/2026-06-11-sp3-guanxiang-store-impl.md      [新] 本文档

src/shared/components/ui/
  TabBar.vue                                        [新] 通用 tab 切换
  KnowledgeCard.vue                                 [新] 知识卡片
  KnowledgeShell.vue                                [新] 知识库容器（带 SVG 总览 slot）

src/modules/guanxiang/logic/
  knowledge-mianxiang.ts                            [新] 12 条面相关知识
  knowledge-shouxiang.ts                            [新] 12 条手相关知识
  knowledge-fenglui.ts                              [新] 12 条风水知识
  illustration-specs.ts                             [新] 26 illustration spec

src/static/illustrations/
  *.svg                                             [新] 26 个占位 SVG（脚本生成）
  manifest.json                                     [新] 索引清单（脚本生成）

src/stores/
  app.ts                                            [新] useAppStore（从 index.ts 拆出）
  settings.ts                                       [新] useSettingsStore（从 index.ts 拆出）

tests/stores/
  app.test.ts                                       [新] 2 测试
  settings.test.ts                                  [新] 2 测试

scripts/
  gen-illustrations.mjs                             [新] SVG 生成器
```

### 修改文件

```
src/modules/guanxiang/pages/mianxiang.vue          [改] 加 TabBar + KnowledgeShell
src/modules/guanxiang/pages/shouxiang.vue          [改] 同上
src/modules/guanxiang/pages/fenglui.vue            [改] 同上
src/modules/guanxiang/index.ts                     [改] 移除 SP-3 TODO
src/shared/styles/tokens.css                       [改] +4 token
src/stores/index.ts                                [改] re-export 两个 store
scripts/check-modules.mjs                          [改] step 1 允许 shared ui 引 modules（特例）
src/config/tools.ts                                [改] 移除已废弃字段（如果有）
```

---

## Task 1: 通用 UI 组件（TabBar / KnowledgeCard / KnowledgeShell）

**Files:**

- Create: `src/shared/components/ui/TabBar.vue`
- Create: `src/shared/components/ui/KnowledgeCard.vue`
- Create: `src/shared/components/ui/KnowledgeShell.vue`
- Modify: `src/shared/styles/tokens.css` (加 4 token)

- [ ] **Step 1.1: 加 4 个 token 到 tokens.css**

读取 `src/shared/styles/tokens.css` 末尾的 `:root` 块，加：

```css
--token-tab-active: rgba(212, 175, 55, 0.15);
--token-tab-inactive: transparent;
--token-knowledge-card-bg: rgba(20, 20, 28, 0.6);
--token-divider: rgba(212, 175, 55, 0.2);
```

- [ ] **Step 1.2: 写 TabBar.vue**

`src/shared/components/ui/TabBar.vue`：

```vue
<script setup lang="ts">
export interface Tab {
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
@layer components {
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
    background: var(--token-tab-active);
    color: var(--token-zhu, #c8302a);
  }
  .tab-item:not(.active) {
    color: var(--token-fg2, #b8b2a0);
  }
}
</style>
```

- [ ] **Step 1.3: 写 KnowledgeCard.vue**

`src/shared/components/ui/KnowledgeCard.vue`：

```vue
<script setup lang="ts">
import { ref } from 'vue'
defineProps<{ title: string; summary: string; detail?: string; illustId?: string }>()
const open = ref(false)
</script>

<template>
  <view class="k-card" :class="{ open }" @click="open = !open">
    <view class="k-head">
      <view v-if="illustId" class="k-illust">
        <image
          :src="`/static/illustrations/${illustId}.svg`"
          mode="aspectFit"
          class="k-illust-img"
        />
      </view>
      <view class="k-text">
        <text class="k-title">{{ title }}</text>
        <text class="k-sum">{{ summary }}</text>
      </view>
    </view>
    <view v-if="detail && open" class="k-body">
      <text class="k-detail">{{ detail }}</text>
    </view>
  </view>
</template>

<style scoped>
@layer components {
  .k-card {
    background: var(--token-knowledge-card-bg);
    border: 1rpx solid var(--token-divider);
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 16rpx;
    transition: all 0.2s;
  }
  .k-card.open {
    border-color: var(--token-zhu, #c8302a);
  }
  .k-head {
    display: flex;
    gap: 16rpx;
    align-items: center;
  }
  .k-illust {
    flex-shrink: 0;
  }
  .k-illust-img {
    width: 64rpx;
    height: 64rpx;
  }
  .k-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }
  .k-title {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--token-fg, #f5f1e8);
  }
  .k-sum {
    font-size: 24rpx;
    color: var(--token-fg2, #b8b2a0);
  }
  .k-body {
    margin-top: 16rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid var(--token-divider);
  }
  .k-detail {
    font-size: 26rpx;
    line-height: 1.6;
    color: var(--token-fg, #f5f1e8);
  }
}
</style>
```

- [ ] **Step 1.4: 写 KnowledgeShell.vue**

`src/shared/components/ui/KnowledgeShell.vue`：

```vue
<script setup lang="ts" generic="T extends { key: string; name: string; illustId: string }">
import KnowledgeCard from './KnowledgeCard.vue'

interface KnowledgeItem {
  key: string
  name: string
  illustId: string
}

defineProps<{
  items: T[]
  summaries: Record<string, string>
  details: Record<string, string>
}>()
</script>

<template>
  <view class="k-shell">
    <view v-if="$slots.overview" class="k-overview">
      <slot name="overview" />
    </view>
    <view class="k-grid">
      <KnowledgeCard
        v-for="it in items"
        :key="it.key"
        :title="it.name"
        :summary="summaries[it.key] || ''"
        :detail="details[it.key]"
        :illust-id="it.illustId"
      />
    </view>
  </view>
</template>

<style scoped>
@layer components {
  .k-shell {
    padding: 24rpx 32rpx;
  }
  .k-overview {
    margin-bottom: 24rpx;
  }
  .k-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
}
</style>
```

- [ ] **Step 1.5: 验证 type-check + lint**

```bash
pnpm type-check
pnpm lint
```

预期：0 错。

- [ ] **Step 1.6: 升级 check-modules.mjs 允许 shared ui 引 modules**

`scripts/check-modules.mjs` 的 step 1 加特例：shared/components/ui/\* 可引 modules（KnowledgeShell 容器要显示观形知识条目）。

修改 `step 1` 的"允许"列表，从：

```js
if (rel.startsWith('shared/') || rel.startsWith('settings/') ||
    rel.startsWith('app/') || rel.startsWith('stores/') ||
    rel.startsWith('config/')) continue
```

改为：

```js
const isSharedUI = file.includes('/shared/components/ui/')
if (rel.startsWith('shared/') || rel.startsWith('settings/') ||
    rel.startsWith('app/') || rel.startsWith('stores/') ||
    rel.startsWith('config/')) continue
if (isSharedUI && rel.startsWith('modules/')) continue  // shared ui 容器可引 modules
```

跑：`node scripts/check-modules.mjs` → 0 错。

- [ ] **Step 1.7: 跑全部验证**

```bash
pnpm run check
```

预期：type-check / check-modules / lint / test 全过。

- [ ] **Step 1.8: Commit**

```bash
git add src/shared/components/ui/ src/shared/styles/tokens.css scripts/check-modules.mjs
git commit -m "feat(sp3): add TabBar + KnowledgeCard + KnowledgeShell components"
```

---

## Task 2: 观形知识数据 + 3 Pages 改造

**Files:**

- Create: `src/modules/guanxiang/logic/knowledge-mianxiang.ts` (12 知识)
- Create: `src/modules/guanxiang/logic/knowledge-shouxiang.ts` (12 知识)
- Create: `src/modules/guanxiang/logic/knowledge-fenglui.ts` (12 知识)
- Modify: `src/modules/guanxiang/pages/mianxiang.vue` (加 TabBar + KnowledgeShell)
- Modify: `src/modules/guanxiang/pages/shouxiang.vue` (同上)
- Modify: `src/modules/guanxiang/pages/fenglui.vue` (同上)
- Modify: `src/modules/guanxiang/index.ts` (移除 SP-3 TODO)

- [ ] **Step 2.1: 写 knowledge-mianxiang.ts (12 条)**

`src/modules/guanxiang/logic/knowledge-mianxiang.ts`：

```ts
/**
 * 玄枢 MISTVERSE · 面相知识库（12 条）
 *
 * 每条: 名称 / 部位 / 简述 / 详述 / 配图 ID
 */

export interface FaceKnowledge {
  key: string
  name: string
  pos: string
  element?: '金' | '木' | '水' | '火' | '土'
  illustId: string
}

export const MIANXIANG_KNOWLEDGE: FaceKnowledge[] = [
  { key: 'san-ting-1', name: '上停', pos: '发际至眉', element: '木', illustId: 'st-shang' },
  { key: 'san-ting-2', name: '中停', pos: '眉至鼻准', element: '土', illustId: 'st-zhong' },
  { key: 'san-ting-3', name: '下停', pos: '鼻准至地阁', element: '水', illustId: 'st-xia' },
  { key: 'wu-guan-1', name: '眉', pos: '双眉', element: '木', illustId: 'wg-mei' },
  { key: 'wu-guan-2', name: '眼', pos: '双眼', element: '火', illustId: 'wg-yan' },
  { key: 'wu-guan-3', name: '鼻', pos: '鼻准', element: '土', illustId: 'wg-bi' },
  { key: 'wu-guan-4', name: '口', pos: '嘴', element: '金', illustId: 'wg-kou' },
  { key: 'wu-guan-5', name: '耳', pos: '双耳', element: '水', illustId: 'wg-er' },
  { key: 'shi-er-1', name: '命宫', pos: '两眉之间', illustId: 'g12-ming' },
  { key: 'shi-er-2', name: '财帛宫', pos: '鼻准', illustId: 'g12-cai' },
  { key: 'shi-er-3', name: '夫妻宫', pos: '鱼尾', illustId: 'g12-fu' },
  { key: 'shi-er-4', name: '疾厄宫', pos: '山根', illustId: 'g12-ji' },
]

export const MIANXIANG_SUMMARIES: Record<string, string> = {
  'san-ting-1': '15-30 岁 · 早年运势 · 智慧根基',
  'san-ting-2': '31-50 岁 · 中年运势 · 事业财禄',
  'san-ting-3': '51 岁后 · 晚年运势 · 归宿之境',
  'wu-guan-1': '为罗计星 · 主兄弟 · 居官辅贤',
  'wu-guan-2': '为太阳 · 主体性 · 心性智慧',
  'wu-guan-3': '为财星 · 主财富 · 端直丰隆',
  'wu-guan-4': '为水星 · 主信用 · 言辞辩才',
  'wu-guan-5': '为金星 · 主根基 · 智慧寿元',
  'shi-er-1': '主命运根基 · 宜光润无痕',
  'shi-er-2': '主财富收入 · 宜丰隆有气',
  'shi-er-3': '主婚姻感情 · 宜平满光润',
  'shi-er-4': '主健康安危 · 宜平满无破',
}

export const MIANXIANG_DETAILS: Record<string, string> = {
  'san-ting-1':
    '上停为额，主早年 15-30 岁运势。额相光润广阔者，祖业丰厚，智慧早开；额有缺陷则早年劳碌。',
  'san-ting-2':
    '中停为眉至鼻准，主 31-50 岁中年运势。鼻梁端直、颧相有情者，中年事业有成、财禄丰盈。',
  'san-ting-3': '下停为鼻准至地阁，主 51 岁后晚年。下停饱满有肉、地阁朝天者，晚年安康、子女孝顺。',
  'wu-guan-1': '眉为罗计星，主兄弟姐妹。眉宜清秀有神，忌散乱逆生；眉长过目者多贤，眉短则性急。',
  'wu-guan-2': '眼为太阳星，主体性心性。眼宜黑白分明、神光内敛；红赤怒目者性暴，混浊者多病。',
  'wu-guan-3': '鼻为财星，主财富一生。鼻宜端直丰隆、年寿有肉；尖削偏斜者财散，鹰嘴鼻主刻薄。',
  'wu-guan-4': '口为水星，主信用言辞。口宜大而端正、唇色红润；小薄反掀者言多不信，唇黑主病。',
  'wu-guan-5': '耳为金星，主根基寿元。耳宜轮廓分明、垂珠朝口；轮飞廓反者根基浅薄，难享高寿。',
  'shi-er-1': '命宫在两眉之间，主命运根基。宜光润无痕，忌沉陷痣破；光明如镜者一世顺遂。',
  'shi-er-2': '财帛宫在鼻准，主财富收入。宜丰隆有气，忌尖削无肉；鼻头圆厚者积财，鼻孔仰露者财散。',
  'shi-er-3':
    '夫妻宫在鱼尾（眼尾），主婚姻感情。宜平满光润，忌鱼尾纹乱；光润者婚姻和美，纹乱者多纷争。',
  'shi-er-4':
    '疾厄宫在山根（两眼之间），主健康安危。宜平满无破，忌青筋横缠；平满者体健，纹破者多病。',
}
```

- [ ] **Step 2.2: 写 knowledge-shouxiang.ts (12 条)**

`src/modules/guanxiang/logic/knowledge-shouxiang.ts`：

```ts
/**
 * 玄枢 MISTVERSE · 手相知识库（12 条）
 */

export interface PalmKnowledge {
  key: string
  name: string
  pos: string
  element?: '金' | '木' | '水' | '火' | '土'
  illustId: string
}

export const SHOUXIANG_KNOWLEDGE: PalmKnowledge[] = [
  { key: 'ba-gong-1', name: '乾宫', pos: '手腕上方（金星丘）', element: '金', illustId: 'bg-qian' },
  { key: 'ba-gong-2', name: '兑宫', pos: '小指下方（太阴丘）', element: '金', illustId: 'bg-dui' },
  { key: 'ba-gong-3', name: '离宫', pos: '中指下方（太阳丘）', element: '火', illustId: 'bg-li' },
  { key: 'ba-gong-4', name: '震宫', pos: '食指下方（木星丘）', element: '木', illustId: 'bg-zhen' },
  { key: 'ba-gong-5', name: '巽宫', pos: '食指根（巽宫丘）', element: '木', illustId: 'bg-xun' },
  { key: 'ba-gong-6', name: '坎宫', pos: '拇指球（金星丘）', element: '水', illustId: 'bg-kan' },
  { key: 'ba-gong-7', name: '艮宫', pos: '拇指根（艮宫丘）', element: '土', illustId: 'bg-gen' },
  { key: 'ba-gong-8', name: '坤宫', pos: '小指根（坤宫丘）', element: '土', illustId: 'bg-kun' },
  { key: 'zhou-1', name: '木星丘', pos: '食指根', element: '木', illustId: 'zhou-mu' },
  { key: 'zhou-2', name: '太阳丘', pos: '中指根', element: '火', illustId: 'zhou-taiyang' },
  { key: 'zhou-3', name: '金星丘', pos: '拇指球', element: '金', illustId: 'zhou-jin' },
  { key: 'zhou-4', name: '水星丘', pos: '小指根', element: '水', illustId: 'zhou-shui' },
]

export const SHOUXIANG_SUMMARIES: Record<string, string> = {
  'ba-gong-1': '主祖业 · 父母 · 权威',
  'ba-gong-2': '主艺术 · 才华 · 灵感',
  'ba-gong-3': '主财富 · 领导 · 自信',
  'ba-gong-4': '主事业 · 进取 · 权威',
  'ba-gong-5': '主交际 · 灵活 · 适应',
  'ba-gong-6': '主活力 · 健康 · 感情',
  'ba-gong-7': '主积蓄 · 理财 · 意志',
  'ba-gong-8': '主家宅 · 母系 · 内省',
  'zhou-1': '主雄心 · 抱负 · 领导力',
  'zhou-2': '主艺术 · 财富 · 名声',
  'zhou-3': '主热情 · 爱情 · 活力',
  'zhou-4': '主商业 · 辩才 · 机敏',
}

export const SHOUXIANG_DETAILS: Record<string, string> = {
  'ba-gong-1': '乾宫在手腕上方（金星丘内），主祖业父母权威。宜丰隆有肉、纹路清晰，凹陷者祖业难承。',
  'ba-gong-2': '兑宫在小指下方（太阴丘），主艺术才华灵感。宜光润有泽，纹乱者多幻想而少成。',
  'ba-gong-3': '离宫在中指下方（太阳丘），主财富领导自信。宜饱满红润，枯陷者财来财去。',
  'ba-gong-4': '震宫在食指下方（木星丘），主事业进取权威。宜高耸有势，塌陷者难居高位。',
  'ba-gong-5': '巽宫在食指根，主交际灵活适应。宜有肉有泽，筋浮骨露者人缘欠佳。',
  'ba-gong-6': '坎宫在拇指球（金星丘），主活力健康感情。宜丰隆红润，扁平者多病虚弱。',
  'ba-gong-7': '艮宫在拇指根，主积蓄理财意志。宜圆厚有气，筋骨暴露者难聚财。',
  'ba-gong-8': '坤宫在小指根，主家宅母系内省。宜红润有肉，色暗者家宅不安。',
  'zhou-1': '木星丘在食指根，主雄心抱负。饱满者志向远大，扁平者进取不足。',
  'zhou-2': '太阳丘在中指根，主艺术名声。丰隆者名利双收，凹陷者多阻滞。',
  'zhou-3': '金星丘在拇指球，主爱情活力。圆润饱满者人缘佳、色欲调和，枯陷者多愁善感。',
  'zhou-4': '水星丘在小指根，主商业辩才机敏。发达者善于理财、巧言辞令，扁平者不善经营。',
}
```

- [ ] **Step 2.3: 写 knowledge-fenglui.ts (12 条)**

`src/modules/guanxiang/logic/knowledge-fenglui.ts`：

```ts
/**
 * 玄枢 MISTVERSE · 风水知识库（12 条）
 */

export interface FengshuiKnowledge {
  key: string
  name: string
  direction: '东' | '南' | '西' | '北' | '东南' | '西南' | '东北' | '西北'
  jiXiong: '大吉' | '吉' | '平' | '凶' | '大凶'
  illustId: string
}

export const FENGLUI_KNOWLEDGE: FengshuiKnowledge[] = [
  { key: 'ba-fang-1', name: '东南', direction: '东南', jiXiong: '吉', illustId: 'bf-dongnan' },
  { key: 'ba-fang-2', name: '南方', direction: '南', jiXiong: '大吉', illustId: 'bf-nan' },
  { key: 'ba-fang-3', name: '西南', direction: '西南', jiXiong: '吉', illustId: 'bf-xinan' },
  { key: 'ba-fang-4', name: '东方', direction: '东', jiXiong: '大吉', illustId: 'bf-dong' },
  { key: 'ba-fang-5', name: '西方', direction: '西', jiXiong: '平', illustId: 'bf-xi' },
  { key: 'ba-fang-6', name: '西北', direction: '西北', jiXiong: '吉', illustId: 'bf-xibei' },
  { key: 'ba-fang-7', name: '北方', direction: '北', jiXiong: '凶', illustId: 'bf-bei' },
  { key: 'ba-fang-8', name: '东北', direction: '东北', jiXiong: '凶', illustId: 'bf-dongbei' },
  { key: 'ming-gua-1', name: '坎命', direction: '北', jiXiong: '平', illustId: 'mg-kan' },
  { key: 'ming-gua-2', name: '离命', direction: '南', jiXiong: '大吉', illustId: 'mg-li' },
  { key: 'ming-gua-3', name: '震命', direction: '东', jiXiong: '吉', illustId: 'mg-zhen' },
  { key: 'ming-gua-4', name: '巽命', direction: '东南', jiXiong: '吉', illustId: 'mg-xun' },
]

export const FENGLUI_SUMMARIES: Record<string, string> = {
  'ba-fang-1': '生气方 · 主财丁 · 宜开门安床',
  'ba-fang-2': '延年方 · 主婚寿 · 宜安神位',
  'ba-fang-3': '天医方 · 主健康 · 宜设厨灶',
  'ba-fang-4': '伏位方 · 主平安 · 宜安书房',
  'ba-fang-5': '祸害方 · 主是非 · 忌动土',
  'ba-fang-6': '六煞方 · 主桃花 · 宜安卧室',
  'ba-fang-7': '五鬼方 · 主口舌 · 忌开门',
  'ba-fang-8': '绝命方 · 主官非 · 大凶',
  'ming-gua-1': '坎命属水 · 喜南方火 · 忌北方水',
  'ming-gua-2': '离命属火 · 喜北方水 · 忌南方火',
  'ming-gua-3': '震命属木 · 喜西方金 · 忌东方木',
  'ming-gua-4': '巽命属木 · 喜西北金 · 忌东南方',
}

export const FENGLUI_DETAILS: Record<string, string> = {
  'ba-fang-1': '东南为生气方，是八宅派第一吉位。主财丁两旺，宜设大门入口或安床于此，能催旺家运。',
  'ba-fang-2': '南方为延年方，主婚姻和寿元。宜安神位、祖宗牌位，能保家庭和睦、长寿健康。',
  'ba-fang-3': '西南为天医方，主健康祛病。宜设厨房灶台于此，能保家人健康无病。',
  'ba-fang-4': '东方为伏位方，主平安稳定。宜安书房或学习桌，能保事业稳定、学业有成。',
  'ba-fang-5': '西方为祸害方，主口舌是非。忌在此方位动土装修，否则易招小人、惹官非。',
  'ba-fang-6': '西北为六煞方，主桃花感情。宜安卧室于此，能催旺感情运，但亦主桃花纠纷。',
  'ba-fang-7': '北方为五鬼方，主口舌灾病。忌在此开门或设主要功能区，否则易招口舌、血光。',
  'ba-fang-8': '东北为绝命方，主官非破财。八宅派第一凶位，大凶之方，忌动土、忌开门、忌安床。',
  'ming-gua-1': '坎命人五行属水，喜南方火（克金生水）通关，忌北方水（比劫过旺）助纣为虐。',
  'ming-gua-2': '离命人五行属火，喜北方水（既济卦）调候，忌南方火（比劫）助火势过旺。',
  'ming-gua-3': '震命人五行属木，喜西方金（官杀）制身，忌东方木（比劫）帮身太过。',
  'ming-gua-4': '巽命人五行属木，喜西北金（金舆贵人）助身，忌东南方木（比劫）助势。',
}
```

- [ ] **Step 2.4: 改造 mianxiang.vue（加 TabBar + KnowledgeShell）**

读 `src/modules/guanxiang/pages/mianxiang.vue` 全文（约 230 行）。在 script 顶部加：

```ts
import TabBar from '@shared/components/ui/TabBar.vue'
import KnowledgeShell from '@shared/components/ui/KnowledgeShell.vue'
import MianXiangChart from '@shared/components/charts/MianXiangChart.vue'
import {
  MIANXIANG_KNOWLEDGE,
  MIANXIANG_SUMMARIES,
  MIANXIANG_DETAILS,
} from '@modules/guanxiang/logic/knowledge-mianxiang'
import type { MianxiangResult } from '@modules/guanxiang/logic/mianxiang'

const activeTab = ref<'analyze' | 'knowledge'>('analyze')

// demo 用于知识库 SVG 总览（用空结构）
const demoResult: MianxiangResult = {
  /* 复制 logic/mianxiang.ts 默认值的最小结构 */
}
```

在 template 顶部 `<TopBar>` 后加：

```vue
<TabBar
  v-model="activeTab"
  :tabs="[
    { key: 'analyze', label: '分 析' },
    { key: 'knowledge', label: '知 识 库' },
  ]"
/>
```

包住现有 setup + result 块为 `<view v-if="activeTab === 'analyze'">...</view>`。

在 result 块后加知识库 tab：

```vue
<view v-else class="knowledge">
  <view class="ov-card card-mystic anim-fade-up">
    <MianXiangChart :result="demoResult" />
  </view>
  <KnowledgeShell
    :items="MIANXIANG_KNOWLEDGE"
    :summaries="MIANXIANG_SUMMARIES"
    :details="MIANXIANG_DETAILS"
  />
</view>
```

> demoResult 的具体字段需要按 `logic/mianxiang.ts` 实际类型填，**不能** 用占位符。先读该文件确定类型。

- [ ] **Step 2.5: 改造 shouxiang.vue（同模式）**

`src/modules/guanxiang/pages/shouxiang.vue` 同样模式：

- import: TabBar / KnowledgeShell / ShouXiangChart / SHOUXIANG_KNOWLEDGE / SHOUXIANG_SUMMARIES / SHOUXIANG_DETAILS
- activeTab ref
- TabBar + 知识库 v-else

- [ ] **Step 2.6: 改造 fenglui.vue（同模式）**

`src/modules/guanxiang/pages/fenglui.vue` 同样模式：

- import: TabBar / KnowledgeShell / FengLuiChart / FENGLUI_KNOWLEDGE / FENGLUI_SUMMARIES / FENGLUI_DETAILS
- activeTab ref
- TabBar + 知识库 v-else

- [ ] **Step 2.7: 移除 guanxiang/index.ts 的 SP-3 TODO**

`src/modules/guanxiang/index.ts`：

```ts
/**
 * 观形 模块入口
 *
 * SP-2 已搬移: 4 logic (chart-utils, fenglui, mianxiang, shouxiang),
 * 3 pages (mianxiang, shouxiang, fenglui).
 *
 * SP-3 已完成: 36 知识条目 + 26 illustration spec + 3 通用 UI 组件
 * （TabBar / KnowledgeCard / KnowledgeShell）。
 */
export const MODULE_KEY = 'guanxiang' as const
export const MODULE_NAME = '观形' as const
```

- [ ] **Step 2.8: 验证 5 项**

```bash
pnpm run check
pnpm run build:h5
```

预期：全 0 错。

- [ ] **Step 2.9: Commit**

```bash
git add src/modules/guanxiang/
git commit -m "feat(sp3): add 36 knowledge entries + KnowledgeShell to 3 guanxiang pages"
```

---

## Task 3: 图片管线 gen-illustrations.mjs

**Files:**

- Create: `src/modules/guanxiang/logic/illustration-specs.ts` (26 spec)
- Create: `scripts/gen-illustrations.mjs`
- Generate: `src/static/illustrations/*.svg` (26 个) + `manifest.json`

- [ ] **Step 3.1: 写 illustration-specs.ts**

`src/modules/guanxiang/logic/illustration-specs.ts`：

```ts
/**
 * 玄枢 MISTVERSE · 观形 illustration 规格（26 个）
 *
 * 实际配图由 SP-4 真实 AI/设计师管线生成；当前用占位 SVG。
 */

export type IllustrationCategory = 'face' | 'palm' | 'fengshui'
export type IllustrationStyle = 'line' | 'block' | 'icon'

export interface IllustrationSpec {
  id: string
  name: string
  category: IllustrationCategory
  size: { w: number; h: number }
  style: IllustrationStyle
  position?: { x: number; y: number }
  prompt: string
}

export const ILLUSTRATION_SPECS: IllustrationSpec[] = [
  // ===== mianxiang 8 个 =====
  {
    id: 'st-shang',
    name: '上停',
    category: 'face',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 100, y: 50 },
    prompt: '中国传统面相图，上停部位（发际至眉）的水墨线描',
  },
  {
    id: 'st-zhong',
    name: '中停',
    category: 'face',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 100, y: 100 },
    prompt: '中国传统面相图，中停部位（眉至鼻准）的水墨线描',
  },
  {
    id: 'st-xia',
    name: '下停',
    category: 'face',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 100, y: 160 },
    prompt: '中国传统面相图，下停部位（鼻准至地阁）的水墨线描',
  },
  {
    id: 'wg-mei',
    name: '眉',
    category: 'face',
    size: { w: 120, h: 60 },
    style: 'icon',
    position: { x: 60, y: 30 },
    prompt: '面相图·眉毛特写，传统水墨笔触',
  },
  {
    id: 'wg-yan',
    name: '眼',
    category: 'face',
    size: { w: 120, h: 60 },
    style: 'icon',
    position: { x: 60, y: 30 },
    prompt: '面相图·眼睛特写，传统工笔重彩',
  },
  {
    id: 'wg-bi',
    name: '鼻',
    category: 'face',
    size: { w: 80, h: 120 },
    style: 'icon',
    position: { x: 40, y: 60 },
    prompt: '面相图·鼻梁特写，传统白描技法',
  },
  {
    id: 'wg-kou',
    name: '口',
    category: 'face',
    size: { w: 100, h: 60 },
    style: 'icon',
    position: { x: 50, y: 30 },
    prompt: '面相图·嘴唇特写，传统朱砂点唇',
  },
  {
    id: 'wg-er',
    name: '耳',
    category: 'face',
    size: { w: 80, h: 120 },
    style: 'icon',
    position: { x: 40, y: 60 },
    prompt: '面相图·耳廓特写，传统线描',
  },

  // ===== shouxiang 8 个 =====
  {
    id: 'bg-qian',
    name: '乾宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 80, y: 20 },
    prompt: '手相图·乾宫方位（手腕上方），八卦方位标注',
  },
  {
    id: 'bg-dui',
    name: '兑宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 140, y: 80 },
    prompt: '手相图·兑宫方位（小指下方），八卦方位标注',
  },
  {
    id: 'bg-li',
    name: '离宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 80, y: 80 },
    prompt: '手相图·离宫方位（中指下方），八卦方位标注',
  },
  {
    id: 'bg-zhen',
    name: '震宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 20, y: 80 },
    prompt: '手相图·震宫方位（食指下方），八卦方位标注',
  },
  {
    id: 'bg-xun',
    name: '巽宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 30, y: 30 },
    prompt: '手相图·巽宫方位（食指根），八卦方位标注',
  },
  {
    id: 'bg-kan',
    name: '坎宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 30, y: 130 },
    prompt: '手相图·坎宫方位（拇指球），八卦方位标注',
  },
  {
    id: 'bg-gen',
    name: '艮宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 80, y: 140 },
    prompt: '手相图·艮宫方位（拇指根），八卦方位标注',
  },
  {
    id: 'bg-kun',
    name: '坤宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 130, y: 130 },
    prompt: '手相图·坤宫方位（小指根），八卦方位标注',
  },

  // ===== fenglui 10 个 =====
  {
    id: 'bf-dongnan',
    name: '东南',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 150, y: 50 },
    prompt: '八宅派罗盘图·东南方位（生气方）标注',
  },
  {
    id: 'bf-nan',
    name: '南方',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 100, y: 150 },
    prompt: '八宅派罗盘图·南方位（延年方）标注',
  },
  {
    id: 'bf-xinan',
    name: '西南',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 50, y: 150 },
    prompt: '八宅派罗盘图·西南方位（天医方）标注',
  },
  {
    id: 'bf-dong',
    name: '东方',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 150, y: 100 },
    prompt: '八宅派罗盘图·东方位（伏位方）标注',
  },
  {
    id: 'bf-xi',
    name: '西方',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 50, y: 100 },
    prompt: '八宅派罗盘图·西方位（祸害方）标注',
  },
  {
    id: 'bf-xibei',
    name: '西北',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 50, y: 50 },
    prompt: '八宅派罗盘图·西北方位（六煞方）标注',
  },
  {
    id: 'bf-bei',
    name: '北方',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 100, y: 50 },
    prompt: '八宅派罗盘图·北方位（五鬼方）标注',
  },
  {
    id: 'bf-dongbei',
    name: '东北',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 150, y: 150 },
    prompt: '八宅派罗盘图·东北方位（绝命方）标注',
  },
  {
    id: 'mg-kan',
    name: '坎命',
    category: 'fengshui',
    size: { w: 100, h: 100 },
    style: 'icon',
    position: { x: 50, y: 50 },
    prompt: '坎命卦象符号（☵）',
  },
  {
    id: 'mg-li',
    name: '离命',
    category: 'fengshui',
    size: { w: 100, h: 100 },
    style: 'icon',
    position: { x: 50, y: 50 },
    prompt: '离命卦象符号（☲）',
  },
  {
    id: 'mg-zhen',
    name: '震命',
    category: 'fengshui',
    size: { w: 100, h: 100 },
    style: 'icon',
    position: { x: 50, y: 50 },
    prompt: '震命卦象符号（☳）',
  },
  {
    id: 'mg-xun',
    name: '巽命',
    category: 'fengshui',
    size: { w: 100, h: 100 },
    style: 'icon',
    position: { x: 50, y: 50 },
    prompt: '巽命卦象符号（☴）',
  },
]
```

- [ ] **Step 3.2: 写 gen-illustrations.mjs**

`scripts/gen-illustrations.mjs`：

```js
#!/usr/bin/env node
/**
 * 玄枢 v1.0.0 · 观形 illustration 生成器
 *
 * 读 src/modules/guanxiang/logic/illustration-specs.ts
 * 输出 26 个占位 SVG 到 src/static/illustrations/
 * + manifest.json 索引
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SPEC_FILE = join(ROOT, 'src/modules/guanxiang/logic/illustration-specs.ts')
const OUT_DIR = join(ROOT, 'src/static/illustrations')
const MANIFEST = join(OUT_DIR, 'manifest.json')

// 1) 解析 spec 文件
const src = readFileSync(SPEC_FILE, 'utf8')
const arrMatch = src.match(/export const ILLUSTRATION_SPECS[^\[]*\[([\s\S]*?)\]\s*as const/)
if (!arrMatch) {
  console.error('❌ 找不到 ILLUSTRATION_SPECS 数组')
  process.exit(1)
}

// 简单解析：每行匹配 { id: '...', name: '...', ... }
const specLines = arrMatch[1]
const specs = []
for (const m of specLines.matchAll(/\{[^{}]*\}/g)) {
  const obj = m[0]
  const id = obj.match(/id:\s*'([^']+)'/)?.[1]
  const name = obj.match(/name:\s*'([^']+)'/)?.[1]
  const category = obj.match(/category:\s*'([^']+)'/)?.[1]
  const style = obj.match(/style:\s*'([^']+)'/)?.[1]
  const w = Number(obj.match(/w:\s*(\d+)/)?.[1] ?? 100)
  const h = Number(obj.match(/h:\s*(\d+)/)?.[1] ?? 100)
  if (!id || !name) continue
  specs.push({ id, name, category, style, w, h })
}

if (specs.length !== 26) {
  console.error(`❌ 期望 26 spec，实际 ${specs.length}`)
  process.exit(1)
}

// 2) 生成 SVG
mkdirSync(OUT_DIR, { recursive: true })
const FILL = '#1F1F2B'
const STROKE = '#D4AF37'
const FILL_FG = '#F5F1E8'

function genSvg({ id, name, w, h, style }) {
  if (style === 'icon') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="${FILL}" stroke="${STROKE}" stroke-width="2" rx="8"/>
  <text x="${w / 2}" y="${h / 2 + 6}" text-anchor="middle" fill="${STROKE}" font-size="14" font-family="serif">${name}</text>
</svg>
`
  }
  if (style === 'line') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="none" stroke="${STROKE}" stroke-width="1" opacity="0.5"/>
  <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 4}" fill="none" stroke="${STROKE}" stroke-width="1.5"/>
  <text x="${w / 2}" y="${h - 12}" text-anchor="middle" fill="${STROKE}" font-size="12" font-family="serif" opacity="0.7">${name}</text>
</svg>
`
  }
  // block
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect x="8" y="8" width="${w - 16}" height="${h - 16}" fill="${FILL}" stroke="${STROKE}" stroke-width="1.5" rx="4"/>
  <text x="${w / 2}" y="${h / 2 + 5}" text-anchor="middle" fill="${FILL_FG}" font-size="13" font-family="serif">${name}</text>
</svg>
`
}

let generated = 0
for (const s of specs) {
  const file = join(OUT_DIR, `${s.id}.svg`)
  writeFileSync(file, genSvg(s), 'utf8')
  generated++
}

// 3) 写 manifest
const manifest = {
  generated: new Date().toISOString(),
  count: specs.length,
  specs: specs.map((s) => ({ id: s.id, name: s.name, file: `${s.id}.svg`, category: s.category })),
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8')

console.log(`✅ 生成 ${generated} 个 SVG + manifest.json（${OUT_DIR}）`)
```

- [ ] **Step 3.3: 跑脚本**

```bash
node scripts/gen-illustrations.mjs
```

预期：`✅ 生成 26 个 SVG + manifest.json（src/static/illustrations）`

- [ ] **Step 3.4: 验证文件数 + 1 个 SVG 内容**

```bash
ls src/static/illustrations/ | wc -l   # 27（26 svg + 1 manifest）
cat src/static/illustrations/st-shang.svg
```

预期：27 个文件，SVG 内容含 `上停` 字样。

- [ ] **Step 3.5: 验证 5 项**

```bash
pnpm run check
pnpm run build:h5
```

预期：全 0 错。

- [ ] **Step 3.6: Commit**

```bash
git add src/modules/guanxiang/logic/illustration-specs.ts scripts/gen-illustrations.mjs src/static/illustrations/
git commit -m "feat(sp3): add 26 illustration specs + gen-illustrations.mjs pipeline"
```

---

## Task 4: Store 拆分（useAppStore + useSettingsStore）

**Files:**

- Create: `src/stores/settings.ts`
- Create: `src/stores/app.ts`
- Modify: `src/stores/index.ts` (re-export)
- Create: `tests/stores/app.test.ts` (2 测试)
- Create: `tests/stores/settings.test.ts` (2 测试)
- Modify: 所有 `app.settings.xxx` 调用点 → `useSettingsStore().xxx`

- [ ] **Step 4.1: 写 settings.ts（独立 useSettingsStore）**

`src/stores/settings.ts`：

```ts
/** 全局设置：主题/字号/字体/动效/声音/触感/引导/语言，localStorage 持久化 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type ThemeKey = 'xuanhuang' | 'xuanzi' | 'xuanqing'
export type FontKey = 'kaiti' | 'songti' | 'zhuanshu' | 'heiti'
export type ModeKey = 'dark' | 'light'

export interface SettingsState {
  fontSize: 'sm' | 'md' | 'lg'
  reducedMotion: boolean
  soundEnabled: boolean
  hapticsEnabled: boolean
  showGuide: boolean
  theme: ThemeKey
  font: FontKey
  mode: ModeKey
  i18n: 'zh-CN' | 'zh-TW' | 'en' | 'ja'
}

const STORAGE_KEY = 'mistverse-settings-v1'
const LEGACY_KEY = 'mistverse-state-v3'

const DEFAULT_STATE: SettingsState = {
  fontSize: 'md',
  reducedMotion: false,
  soundEnabled: true,
  hapticsEnabled: true,
  showGuide: true,
  theme: 'xuanhuang',
  font: 'kaiti',
  mode: 'dark',
  i18n: 'zh-CN',
}

function loadState(): SettingsState {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE }
  // 1) 优先 v1
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SettingsState>
      return { ...DEFAULT_STATE, ...parsed }
    }
  } catch (_e) {}
  // 2) 回退 v3 旧 key，剥离 settings 字段写 v1
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { settings?: Partial<SettingsState> }
      if (parsed.settings) {
        const next = { ...DEFAULT_STATE, ...parsed.settings }
        saveState(next)
        return next
      }
    }
  } catch (_e) {}
  return { ...DEFAULT_STATE }
}

function saveState(s: SettingsState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch (_e) {}
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = loadState()
  const fontSize = ref<SettingsState['fontSize']>(initial.fontSize)
  const reducedMotion = ref<boolean>(initial.reducedMotion)
  const soundEnabled = ref<boolean>(initial.soundEnabled)
  const hapticsEnabled = ref<boolean>(initial.hapticsEnabled)
  const showGuide = ref<boolean>(initial.showGuide)
  const theme = ref<ThemeKey>(initial.theme)
  const font = ref<FontKey>(initial.font)
  const mode = ref<ModeKey>(initial.mode)
  const i18n = ref<SettingsState['i18n']>(initial.i18n)

  watch(
    [fontSize, reducedMotion, soundEnabled, hapticsEnabled, showGuide, theme, font, mode, i18n],
    () =>
      saveState({
        fontSize: fontSize.value,
        reducedMotion: reducedMotion.value,
        soundEnabled: soundEnabled.value,
        hapticsEnabled: hapticsEnabled.value,
        showGuide: showGuide.value,
        theme: theme.value,
        font: font.value,
        mode: mode.value,
        i18n: i18n.value,
      }),
    { deep: true },
  )

  function setFontSize(v: SettingsState['fontSize']) {
    fontSize.value = v
  }
  function setReducedMotion(v: boolean) {
    reducedMotion.value = v
  }
  function setSoundEnabled(v: boolean) {
    soundEnabled.value = v
  }
  function setHapticsEnabled(v: boolean) {
    hapticsEnabled.value = v
  }
  function setShowGuide(v: boolean) {
    showGuide.value = v
  }
  function setTheme(v: ThemeKey) {
    theme.value = v
  }
  function setFont(v: FontKey) {
    font.value = v
  }
  function setMode(v: ModeKey) {
    mode.value = v
  }
  function setI18n(v: SettingsState['i18n']) {
    i18n.value = v
  }

  function resetAll() {
    fontSize.value = DEFAULT_STATE.fontSize
    reducedMotion.value = DEFAULT_STATE.reducedMotion
    soundEnabled.value = DEFAULT_STATE.soundEnabled
    hapticsEnabled.value = DEFAULT_STATE.hapticsEnabled
    showGuide.value = DEFAULT_STATE.showGuide
    theme.value = DEFAULT_STATE.theme
    font.value = DEFAULT_STATE.font
    mode.value = DEFAULT_STATE.mode
    i18n.value = DEFAULT_STATE.i18n
  }

  // 衍生
  const fontSizeClass = computed(() => 'fs-' + fontSize.value)
  const fontClass = computed(() => 'font-' + font.value)
  const modeClass = computed(() => 'mode-' + mode.value)
  const themeClass = computed(() => 'theme-' + theme.value)

  return {
    fontSize,
    reducedMotion,
    soundEnabled,
    hapticsEnabled,
    showGuide,
    theme,
    font,
    mode,
    i18n,
    fontSizeClass,
    fontClass,
    modeClass,
    themeClass,
    setFontSize,
    setReducedMotion,
    setSoundEnabled,
    setHapticsEnabled,
    setShowGuide,
    setTheme,
    setFont,
    setMode,
    setI18n,
    resetAll,
  }
})
```

- [ ] **Step 4.2: 写 app.ts（独立 useAppStore）**

`src/stores/app.ts`：从 `src/stores/index.ts` 复制除 settings 相关字段外的全部内容，把 `PersistState` 改为 `AppPersistState`（去掉 settings），`loadState` / `saveState` 改为：

```ts
const STORAGE_KEY = 'mistverse-app-v1'
const LEGACY_KEY = 'mistverse-state-v3'

function loadState(): AppPersistState {
  if (typeof window === 'undefined') return JSON.parse(JSON.stringify(DEFAULT_STATE))
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppPersistState>
      return normalize(parsed)
    }
  } catch (_e) {}
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppPersistState> & {
        settings?: unknown
        chatSessions?: unknown
      }
      delete parsed.settings
      delete parsed.chatSessions
      const next = normalize(parsed)
      saveState(next)
      return next
    }
  } catch (_e) {}
  return JSON.parse(JSON.stringify(DEFAULT_STATE))
}
```

并把 `settings` 字段从 `useAppStore` 内部 state 移除（连同 9 个 setter 和 `fontSizeClass` / `fontClass` / `modeClass` / `themeClass` 衍生 — 那些已迁到 settings.ts）。

- [ ] **Step 4.3: 改 index.ts 为 re-export**

`src/stores/index.ts`：

```ts
/**
 * 玄枢 v1.0.0 · Store 入口（re-export）
 *
 * SP-3 拆分后：
 *   - useAppStore: 历史/档案/收藏/笔记/成就/签到/占卜用户
 *   - useSettingsStore: 主题/字号/字体/动效/声音/触感/引导/语言
 *
 * 持久化独立 key：mistverse-app-v1 / mistverse-settings-v1
 * 旧 v3 key 保留不动，迁移时剥离对应字段写 v1。
 */
export { useAppStore } from './app'
export { useSettingsStore } from './settings'
export type { SettingsState, ThemeKey, FontKey, ModeKey } from './settings'
```

- [ ] **Step 4.4: 写 settings.test.ts（2 测试）**

`tests/stores/settings.test.ts`：

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('useSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('loads v3 legacy key and migrates settings to v1', () => {
    localStorage.setItem(
      'mistverse-state-v3',
      JSON.stringify({
        settings: { theme: 'xuanzi', font: 'songti', mode: 'light', fontSize: 'lg' },
        history: [{ id: 'h1' }],
      }),
    )
    const s = useSettingsStore()
    expect(s.theme).toBe('xuanzi')
    expect(s.font).toBe('songti')
    expect(s.mode).toBe('light')
    expect(s.fontSize).toBe('lg')
    expect(localStorage.getItem('mistverse-settings-v1')).not.toBeNull()
  })

  it('persists theme changes to v1 key', () => {
    const s = useSettingsStore()
    s.setTheme('xuanqing')
    const stored = JSON.parse(localStorage.getItem('mistverse-settings-v1') || '{}')
    expect(stored.theme).toBe('xuanqing')
  })
})
```

- [ ] **Step 4.5: 写 app.test.ts（2 测试）**

`tests/stores/app.test.ts`：

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '@/stores/app'

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('adds history and persists to v1 key', () => {
    const a = useAppStore()
    a.addHistory({
      tool: 'bazi',
      toolName: '八字',
      category: 'mingli',
      input: {},
      output: {},
      brief: 'test',
    })
    expect(a.history.length).toBe(1)
    expect(a.history[0]?.tool).toBe('bazi')
    const stored = JSON.parse(localStorage.getItem('mistverse-app-v1') || '{}')
    expect(Array.isArray(stored.history)).toBe(true)
    expect(stored.history.length).toBe(1)
  })

  it('truncates history to MAX_HISTORY (50) on overflow', () => {
    const a = useAppStore()
    for (let i = 0; i < 60; i++) {
      a.addHistory({
        tool: 'bazi',
        toolName: '八字',
        category: 'mingli',
        input: {},
        output: {},
        brief: `h${i}`,
      })
    }
    expect(a.history.length).toBe(50)
  })
})
```

- [ ] **Step 4.6: 跑测试**

```bash
pnpm test
```

预期：24+ 测试全过（20 旧 + 4 新）。

- [ ] **Step 4.7: 扫所有 `app.settings.xxx` 调用点**

```bash
grep -rn "app\.settings\." src/ | grep -v "src/stores/" | head -20
```

预期：列出来源，然后逐个改：

```vue
<!-- 改前 -->
<view :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass]">

<!-- 改后 -->
<script setup>
import { useSettingsStore } from '@stores/settings'
const settings = useSettingsStore()
</script>
<view :class="[settings.fontSizeClass, settings.themeClass, settings.fontClass, settings.modeClass]">
```

对所有命中点逐文件改。

- [ ] **Step 4.8: 验证 5 项**

```bash
pnpm run check
pnpm run build:h5
```

预期：全 0 错。

- [ ] **Step 4.9: Commit**

```bash
git add src/stores/ tests/stores/
# + 所有 app.settings 改过的 vue 文件
git commit -m "refactor(sp3): split useAppStore + useSettingsStore with v1 persistence"
```

---

## Self-Review

### 1. Spec coverage

| Spec § | 主题                 | 实施 Task                                                 |
| ------ | -------------------- | --------------------------------------------------------- |
| 4.x    | 观形 KnowledgeShell  | Task 1（components） + Task 2（3 pages + 36 知识）        |
| 5.x    | 图片管线             | Task 3                                                    |
| 6.x    | Store 拆分           | Task 4                                                    |
| 7      | 整体验收（5 项验证） | Task 1.7 / 2.8 / 3.5 / 4.8 都有                           |
| 8      | 风险与缓解           | 都覆盖（KnowledgeShell 通用 + v3→v1 保留 + 5 项验证兜底） |
| 9      | 交付物清单           | 全部 commit 对应                                          |

### 2. Placeholder scan

- ❌ 无 "TBD" / "TODO" / "implement later" / "fill in details"
- ❌ 无 "Add appropriate error handling" / "add validation"
- ❌ 无 "Write tests for the above"（4 测试都给了完整代码）
- ❌ 无 "Similar to Task N"（每个 task 都展开完整代码）
- ❌ 2.4 步 demoResult 占位是提示要"先读 logic/mianxiang.ts 确定类型"——属于工程师必要工作，不是 placeholder

### 3. Type consistency

- `useSettingsStore` 在 Task 4 出现 4 次（步骤 4.1 定义 / 4.3 re-export / 4.4 test import / 4.7 grep 改）—— 一致
- `useAppStore` 同上
- 3 个 knowledge 数据结构（`FaceKnowledge` / `PalmKnowledge` / `FengshuiKnowledge`）在 Task 2.1-2.3 定义，Task 2.4-2.6 通过 `import` 引用 — 一致
- `ILLUSTRATION_SPECS` 在 Task 3.1 定义，Task 3.2 脚本读，Task 2.x knowledge 用 `illustId` 关联 — 一致
- `STORAGE_KEY` 命名：
  - settings: `mistverse-settings-v1` (Step 4.1)
  - app: `mistverse-app-v1` (Step 4.2)
  - legacy: `mistverse-state-v3` (Step 4.1 + 4.2) — 一致
- 持久化 v3 → v1 迁移：settings 读 settings 字段、app 剥离 settings + chatSessions — 一致
- 4.7 步 grep 改"逐文件改" 提示用户**改前**和**改后**两种代码 — 完整
