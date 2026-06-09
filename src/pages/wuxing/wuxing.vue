<template>
  <view class="wuxing-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="五行罗盘" subtitle="WUXING COMPASS" />

    <!-- 介绍卡 -->
    <view class="intro card-mystic anim-fade-up">
      <text class="intro-text">五行者，天地之化机，万物之父母。</text>
      <text class="intro-sub">木 · 火 · 土 · 金 · 水 — 相生相克，循环不息</text>
    </view>

    <!-- 五边形罗盘 -->
    <view class="compass-stage">
      <view class="compass-bg anim-rotate">
        <view class="ring" />
        <view class="ring ring-2" />
        <view class="ring ring-3" />
        <text class="bagua ba-1">☰</text>
        <text class="bagua ba-2">☱</text>
        <text class="bagua ba-3">☲</text>
        <text class="bagua ba-4">☳</text>
        <text class="bagua ba-5">☴</text>
      </view>

      <view
        v-for="(wx, i) in nodes"
        :key="wx.key"
        class="wx-node"
        :class="{ active: selected?.key === wx.key }"
        :style="getNodeStyle(i)"
        @click="onNodeClick(wx.key)"
      >
        <view
          class="wx-circle"
          :style="{ background: wx.gradient, boxShadow: '0 0 32rpx ' + wx.color }"
        >
          <text class="wx-glyph">{{ wx.name }}</text>
        </view>
        <text class="wx-pinyin">{{ wx.pinyin }}</text>
        <text class="wx-season">{{ wx.direction }} · {{ wx.season }}</text>
      </view>

      <view class="compass-center">
        <text v-if="!relation" class="center-tip">{{ centerHint }}</text>
        <view v-else class="center-rel anim-stamp">
          <text class="rel-type" :class="'rel-' + relation">{{ RELATION_DESC[relation] }}</text>
          <text class="rel-pair">{{ pairLabel }}</text>
        </view>
      </view>

      <svg
        v-if="selected && other"
        class="relation-line"
        :viewBox="'0 0 100 100'"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          :x1="selectedCoord.x"
          :y1="selectedCoord.y"
          :x2="otherCoord.x"
          :y2="otherCoord.y"
          :stroke="lineColor"
          stroke-width="0.6"
          stroke-dasharray="1.5,1"
          style="filter: drop-shadow(0 0 1rpx currentColor)"
        />
      </svg>
    </view>

    <view class="legend card-mystic anim-fade-up" style="animation-delay: 0.2s">
      <view class="legend-item">
        <text class="legend-line legend-sheng" />
        <text class="legend-text">相生：木 → 火 → 土 → 金 → 水 → 木</text>
      </view>
      <view class="legend-item">
        <text class="legend-line legend-ke" />
        <text class="legend-text">相克：木 → 土 → 水 → 火 → 金 → 木</text>
      </view>
    </view>

    <!-- Tab 切换 -->
    <view v-if="selected" class="tabs anim-fade-up" style="animation-delay: 0.25s">
      <view
        v-for="t in TABS"
        :key="t.key"
        class="tab"
        :class="{ active: tab === t.key }"
        @click="tab = t.key as any"
      >
        {{ t.label }}
      </view>
    </view>

    <!-- 基础信息 -->
    <view
      v-if="selected && tab === 'base'"
      class="detail card-mystic anim-fade-up"
      style="animation-delay: 0.3s"
    >
      <view class="detail-head">
        <view class="detail-dot" :style="{ background: selected.gradient }" />
        <text class="title-mystic title-md">{{ selected.name }} · {{ selected.virtue }}</text>
      </view>
      <text class="detail-desc">{{ selected.desc }}</text>
      <view class="detail-grid">
        <view class="detail-cell">
          <text class="cell-label">季节</text>
          <text class="cell-val">{{ selected.season }}</text>
        </view>
        <view class="detail-cell">
          <text class="cell-label">方位</text>
          <text class="cell-val">{{ selected.direction }}</text>
        </view>
        <view class="detail-cell">
          <text class="cell-label">脏器</text>
          <text class="cell-val">{{ selected.organ }}</text>
        </view>
        <view class="detail-cell">
          <text class="cell-label">情志</text>
          <text class="cell-val">{{ selected.emotion }}</text>
        </view>
      </view>
    </view>

    <!-- 关系矩阵 -->
    <view
      v-if="selected && tab === 'matrix'"
      class="card card-mystic anim-fade-up"
      style="animation-delay: 0.3s"
    >
      <text class="card-title title-mystic">关 系 矩 阵</text>
      <text class="card-tip">以 {{ selected.name }} 为太极点 · 五行生克流转</text>
      <view class="matrix">
        <view v-for="(r, i) in matrixList" :key="i" class="matrix-row" :class="'mrow-' + r.name">
          <view class="mr-label">
            <text class="mr-name">{{ r.name }}</text>
            <text class="mr-desc">{{ r.desc }}</text>
          </view>
          <view class="mr-target">
            <text class="mr-glyph" :style="{ color: WUXING_META[r.target].color }">
              {{ WUXING_META[r.target].name }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 缺失补救 -->
    <view
      v-if="selected && tab === 'buji'"
      class="card card-mystic anim-fade-up"
      style="animation-delay: 0.3s"
    >
      <text class="card-title title-mystic">缺 失 补 救</text>
      <text class="card-tip">生辰 / 起名 / 居所 · 实用补救方案</text>
      <view class="buji-list">
        <view class="buji-row">
          <text class="bj-label">颜 色</text>
          <view class="bj-tags">
            <text v-for="c in buji.color" :key="c" class="bj-tag bj-color">{{ c }}</text>
          </view>
        </view>
        <view class="buji-row">
          <text class="bj-label">方 位</text>
          <text class="bj-val">{{ buji.direction }} · {{ buji.season }}</text>
        </view>
        <view class="buji-row">
          <text class="bj-label">食 物</text>
          <view class="bj-tags">
            <text v-for="f in buji.food" :key="f" class="bj-tag">{{ f }}</text>
          </view>
        </view>
        <view class="buji-row">
          <text class="bj-label">职 业</text>
          <view class="bj-tags">
            <text v-for="c in buji.career" :key="c" class="bj-tag">{{ c }}</text>
          </view>
        </view>
        <view class="buji-row">
          <text class="bj-label">数 字</text>
          <text class="bj-val bj-num">{{ buji.number }}</text>
        </view>
        <view class="buji-row">
          <text class="bj-label">身 体</text>
          <view class="bj-tags">
            <text v-for="b in buji.body" :key="b" class="bj-tag">{{ b }}</text>
          </view>
        </view>
        <view class="buji-tip">{{ buji.deco }}</view>
      </view>
    </view>

    <!-- 性格 -->
    <view
      v-if="selected && tab === 'xingge'"
      class="card card-mystic anim-fade-up"
      style="animation-delay: 0.3s"
    >
      <text class="card-title title-mystic">性 格 特 质</text>
      <text class="card-tip">旺 则 扬 长 · 弱 则 弥 短</text>
      <view class="xg-block xg-strong">
        <text class="xg-tag">旺</text>
        <text class="xg-text">{{ xgText.strong }}</text>
      </view>
      <view class="xg-block xg-weak">
        <text class="xg-tag">弱</text>
        <text class="xg-text">{{ xgText.weak }}</text>
      </view>
    </view>

    <!-- 养生 -->
    <view
      v-if="selected && tab === 'yangsheng'"
      class="card card-mystic anim-fade-up"
      style="animation-delay: 0.3s"
    >
      <text class="card-title title-mystic">养 生 要 诀</text>
      <text class="card-tip">顺 时 之 养 · 调 息 调 神</text>
      <view class="ys-list">
        <view class="ys-row">
          <text class="ys-key">顺 时</text>
          <text class="ys-val">{{ yangsheng.season }}</text>
        </view>
        <view class="ys-row">
          <text class="ys-key">调 志</text>
          <text class="ys-val">{{ yangsheng.emotion }}</text>
        </view>
        <view class="ys-row">
          <text class="ys-key">饮 食</text>
          <text class="ys-val">{{ yangsheng.food }}</text>
        </view>
        <view class="ys-row">
          <text class="ys-key">导 引</text>
          <text class="ys-val">{{ yangsheng.exercise }}</text>
        </view>
        <view class="ys-row">
          <text class="ys-key">忌 宜</text>
          <text class="ys-val ys-taboo">{{ yangsheng.taboo }}</text>
        </view>
      </view>
    </view>

    <view v-if="selected" class="action-hint">
      <text>· 点击其他节点查看 {{ selected.name }} 的生克关系 ·</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import TopBar from '@/components/ui/TopBar.vue'
import {
  WUXING_META,
  WUXING_LIST,
  wuxingRelation,
  RELATION_DESC,
  type Wuxing,
} from '@/utils/wuxing'
import { relationMatrix, getBuji, xingge, yangsheng as yangshengFn } from '@/utils/wuxing-deep'
import { useAppStore } from '@/stores'

const app = useAppStore()

const nodes = WUXING_LIST.map((k) => WUXING_META[k])
const TABS = [
  { key: 'base', label: '基础' },
  { key: 'matrix', label: '关系' },
  { key: 'buji', label: '补救' },
  { key: 'xingge', label: '性格' },
  { key: 'yangsheng', label: '养生' },
]

const COORDS: Array<{ x: number; y: number }> = [
  { x: 50, y: 5 },
  { x: 95, y: 38 },
  { x: 79, y: 90 },
  { x: 21, y: 90 },
  { x: 5, y: 38 },
]

function getNodeStyle(i: number) {
  return {
    left: COORDS[i].x + '%',
    top: COORDS[i].y + '%',
  }
}

const selected = ref<(typeof WUXING_META)[Wuxing] | null>(null)
const other = ref<Wuxing | null>(null)
const relation = ref<keyof typeof RELATION_DESC | null>(null)
const tab = ref<'base' | 'matrix' | 'buji' | 'xingge' | 'yangsheng'>('base')

const pairLabel = computed(() => {
  if (!selected.value || !other.value) return ''
  return `${selected.value.name} 与 ${WUXING_META[other.value].name}`
})

const centerHint = '点击节点 · 探索生克'

const selectedIdx = computed(() => (selected.value ? WUXING_LIST.indexOf(selected.value.key) : -1))
const otherIdx = computed(() => (other.value ? WUXING_LIST.indexOf(other.value) : -1))

const selectedCoord = computed(() => COORDS[selectedIdx.value] || { x: 50, y: 50 })
const otherCoord = computed(() => COORDS[otherIdx.value] || { x: 50, y: 50 })

const lineColor = computed(() => {
  if (relation.value === 'sheng' || relation.value === 'be-sheng') return '#4FAE6F'
  if (relation.value === 'ke' || relation.value === 'be-ke') return '#C8302A'
  return '#D4AF37'
})

const matrixList = computed(() => (selected.value ? relationMatrix(selected.value.key) : []))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buji = computed(() => (selected.value ? getBuji(selected.value.key) : (null as any)))
const xgText = computed(() => ({
  strong: selected.value ? xingge(selected.value.key, true) : '',
  weak: selected.value ? xingge(selected.value.key, false) : '',
}))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yangsheng = computed(() => (selected.value ? yangshengFn(selected.value.key) : (null as any)))

function onNodeClick(k: Wuxing) {
  if (!selected.value) {
    selected.value = WUXING_META[k]
    other.value = null
    relation.value = null
    tab.value = 'base'
  } else if (selected.value.key === k) {
    selected.value = null
    other.value = null
    relation.value = null
  } else {
    other.value = k
    relation.value = wuxingRelation(selected.value.key, k)
  }
}
</script>

<style scoped>
.wuxing-page {
  position: relative;
  min-height: 100vh;
  padding: 0 var(--sp-3) var(--sp-8);
  overflow: hidden;
}

.taiji-bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg);
}

.intro {
  margin: var(--sp-3) var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  text-align: center;
}

.intro-text {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.6;
}

.intro-sub {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-top: var(--sp-2);
  letter-spacing: 0.1em;
}

.compass-stage {
  position: relative;
  width: 620rpx;
  height: 620rpx;
  max-width: 92vw;
  max-height: 92vw;
  margin: var(--sp-5) auto;
  z-index: var(--z-content);
}

.compass-bg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring {
  position: absolute;
  inset: 0;
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: 50%;
}

.ring-2 {
  inset: 12%;
  border-color: rgba(212, 175, 55, 0.25);
  border-style: dashed;
}
.ring-3 {
  inset: 25%;
  border-color: rgba(200, 48, 42, 0.3);
}

.bagua {
  position: absolute;
  font-size: 40rpx;
  color: rgba(212, 175, 55, 0.4);
  font-weight: 600;
}
.ba-1 {
  top: 4%;
  left: 50%;
  transform: translateX(-50%);
}
.ba-2 {
  right: 4%;
  top: 50%;
  transform: translateY(-50%);
}
.ba-3 {
  bottom: 4%;
  left: 50%;
  transform: translateX(-50%);
}
.ba-4 {
  left: 4%;
  top: 50%;
  transform: translateY(-50%);
}
.ba-5 {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 56rpx;
}

.wx-node {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.wx-circle {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  transition: all 0.4s var(--ease-bounce);
  position: relative;
}

.wx-circle::after {
  content: '';
  position: absolute;
  inset: -8rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}

.wx-node.active .wx-circle {
  transform: scale(1.15);
  border-color: var(--color-liu);
  box-shadow: 0 0 48rpx currentColor;
}

.wx-glyph {
  font-size: 48rpx;
  font-weight: 700;
  font-family: 'KaiTi', serif;
}

.wx-pinyin {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-top: 8rpx;
  letter-spacing: 0.15em;
}

.wx-season {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-top: 2rpx;
}

.compass-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  pointer-events: none;
  text-align: center;
  max-width: 40%;
}

.relation-line {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  animation: lineDraw 0.6s var(--ease-mystic) both;
}

@keyframes lineDraw {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.center-tip {
  font-size: 22rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.15em;
  padding: 4rpx var(--sp-2);
  background: rgba(10, 10, 18, 0.7);
  border-radius: var(--r-sm);
  border: 1rpx dashed rgba(212, 175, 55, 0.3);
  white-space: nowrap;
}

.center-rel {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rel-type {
  font-size: var(--fs-md);
  font-weight: 600;
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  padding: 4rpx var(--sp-3);
  background: rgba(10, 10, 18, 0.85);
  border: 2rpx solid var(--color-liu);
  border-radius: var(--r-sm);
  box-shadow: 0 0 16rpx rgba(212, 175, 55, 0.5);
  white-space: nowrap;
}

.rel-type.rel-sheng,
.rel-type.rel-be-sheng {
  color: #4fae6f;
  border-color: #4fae6f;
  box-shadow: 0 0 16rpx rgba(79, 174, 111, 0.5);
}
.rel-type.rel-ke,
.rel-type.rel-be-ke {
  color: var(--color-zhu);
  border-color: var(--color-zhu);
  box-shadow: 0 0 16rpx rgba(200, 48, 42, 0.5);
}
.rel-type.rel-tong {
  color: var(--color-liu);
}

.rel-pair {
  font-size: 22rpx;
  color: var(--color-bai);
  margin-top: 4rpx;
  font-family: 'KaiTi', serif;
  white-space: nowrap;
}

.legend {
  margin: 0 var(--sp-2) var(--sp-3);
  padding: var(--sp-3);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.legend-line {
  width: 32rpx;
  height: 4rpx;
  border-radius: 2rpx;
}

.legend-sheng {
  background: #4fae6f;
  box-shadow: 0 0 8rpx #4fae6f;
}
.legend-ke {
  background: var(--color-zhu);
  box-shadow: 0 0 8rpx var(--color-zhu);
}

.legend-text {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.05em;
}

/* ===== Tabs ===== */
.tabs {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  margin: 0 var(--sp-2) var(--sp-3);
  padding: 4rpx;
  background: rgba(10, 10, 18, 0.6);
  border-radius: var(--r-full);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}

.tab {
  flex: 1;
  text-align: center;
  padding: var(--sp-2) 0;
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
  color: var(--color-bai-2);
  border-radius: var(--r-full);
  transition: all 0.2s ease;
  letter-spacing: 0.1em;
}

.tab.active {
  background: linear-gradient(135deg, var(--color-liu) 0%, #8b6914 100%);
  color: var(--color-bai);
  box-shadow: 0 0 12rpx rgba(212, 175, 55, 0.4);
}

/* ===== 通用卡 ===== */
.card,
.detail {
  position: relative;
  z-index: var(--z-content);
  margin: 0 var(--sp-2) var(--sp-3);
  padding: var(--sp-4);
}

.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-2);
  letter-spacing: 0.2em;
}

.card-tip {
  display: block;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-bottom: var(--sp-3);
  letter-spacing: 0.1em;
}

.detail-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.detail-dot {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  box-shadow: 0 0 12rpx currentColor;
}

.detail-desc {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-3);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}

.detail-cell {
  display: flex;
  flex-direction: column;
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
}

.cell-label {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}

.cell-val {
  font-size: var(--fs-md);
  color: var(--color-liu);
  margin-top: 4rpx;
  font-family: 'KaiTi', serif;
}

/* ===== 关系矩阵 ===== */
.matrix {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.matrix-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
}

.matrix-row.mrow-我生 {
  border-left: 4rpx solid #5b8cbe;
}
.matrix-row.mrow-生我 {
  border-left: 4rpx solid #4fae6f;
}
.matrix-row.mrow-我克 {
  border-left: 4rpx solid var(--color-liu);
}
.matrix-row.mrow-克我 {
  border-left: 4rpx solid var(--color-zhu);
}
.matrix-row.mrow-同我 {
  border-left: 4rpx solid #8b6f47;
}

.mr-label {
  flex: 1;
}

.mr-name {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.mr-desc {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-top: 2rpx;
  font-family: 'KaiTi', serif;
}

.mr-target {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 18, 0.5);
  border: 2rpx solid var(--color-liu);
}

.mr-glyph {
  font-size: 36rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 8rpx currentColor;
}

/* ===== 缺失补救 ===== */
.buji-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.buji-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}

.bj-label {
  width: 80rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
}

.bj-val {
  flex: 1;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}

.bj-num {
  color: var(--color-liu);
  font-weight: 700;
  font-size: 40rpx;
}

.bj-tags {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
}

.bj-tag {
  font-size: var(--fs-xs);
  padding: 2rpx 12rpx;
  background: rgba(212, 175, 55, 0.1);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  border-radius: var(--r-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}

.bj-tag.bj-color {
  color: var(--color-bai);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05));
}

.buji-tip {
  margin-top: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(212, 175, 55, 0.08);
  border-left: 4rpx solid var(--color-liu);
  border-radius: 4rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  font-style: italic;
  line-height: 1.6;
}

/* ===== 性格 ===== */
.xg-block {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  margin-bottom: var(--sp-2);
}

.xg-block.xg-strong {
  border-left: 4rpx solid #4fae6f;
}
.xg-block.xg-weak {
  border-left: 4rpx solid var(--color-zhu);
}

.xg-tag {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
}

.xg-strong .xg-tag {
  background: #4fae6f;
  color: var(--color-bai);
}
.xg-weak .xg-tag {
  background: var(--color-zhu);
  color: var(--color-bai);
}

.xg-text {
  flex: 1;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
}

/* ===== 养生 ===== */
.ys-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.ys-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}

.ys-key {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
}

.ys-val {
  flex: 1;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}

.ys-taboo {
  color: var(--color-zhu);
}

.action-hint {
  position: relative;
  z-index: var(--z-content);
  text-align: center;
  margin-top: var(--sp-4);
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  letter-spacing: 0.15em;
}
</style>
