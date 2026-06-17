<!--
  渡 DU · 命名测字可视化
  - 姓名大字号 + 偏旁拆解
  - 五格：天/地/人/外/总
  - 五行雷达
  - 喜用神分析
-->
<template>
  <view class="mjc">
    <view class="mjc-hero card-mystic">
      <view class="mh-name">
        <text
          v-for="(c, i) in result.name.split('')"
          :key="i"
          class="mh-char"
          :style="{ borderColor: charColor(i) }"
        >
          {{ c }}
        </text>
      </view>
      <view class="mh-row">
        <text class="mhr-l">姓：</text><text class="mhr-v">{{ result.surname }}</text>
        <text class="mhr-l mhr-l2">名：</text><text class="mhr-v">{{ result.given }}</text>
        <text class="mhr-l mhr-l2">总笔画：</text
        ><text class="mhr-v">{{ result.totalStrokes }}</text>
      </view>
      <view class="mh-level" :style="{ background: levelBg, borderColor: levelBorder }">
        <text class="mhl-t" :style="{ color: levelColor }">{{ result.level }}</text>
        <text class="mhl-s">综合评分 {{ result.score }} 分</text>
      </view>
    </view>

    <view class="mjc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="mjc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(31,78,74,0.18)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.9)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#{{ uid('bg') }})" />

        <!-- 五行五边形 -->
        <polygon
          v-for="(g, i) in gridPolys"
          :key="'g-' + i"
          :points="g"
          stroke="rgba(212,175,55,0.15)"
          stroke-width="0.8"
          fill="none"
        />
        <polygon
          :points="dataPoly"
          :stroke="THEME.liu"
          stroke-width="2.5"
          fill="rgba(212,175,55,0.2)"
          :style="{
            strokeDasharray: polyLen,
            strokeDashoffset: polyLen,
            animation: 'pathDraw 1.8s ease-out 0.2s forwards',
          }"
        />
        <line
          v-for="(axis, i) in axes"
          :key="'ax-' + i"
          :x1="cx"
          :y1="cy"
          :x2="axis.x"
          :y2="axis.y"
          stroke="rgba(212,175,55,0.25)"
          stroke-width="0.8"
        />
        <text
          v-for="(axis, i) in axes"
          :key="'lb-' + i"
          :x="axis.lx"
          :y="axis.ly"
          text-anchor="middle"
          font-size="16"
          :fill="axis.color"
          font-family="serif"
          font-weight="bold"
        >
          {{ axis.label }}
        </text>
        <circle
          v-for="(pt, i) in dataPts"
          :key="'pt-' + i"
          :cx="pt.x"
          :cy="pt.y"
          r="5"
          :fill="axes[i].color"
        />
        <text
          v-for="(pt, i) in dataPts"
          :key="'vl-' + i"
          :x="pt.x + 8"
          :y="pt.y - 8"
          font-size="11"
          :fill="THEME.fg"
          font-family="serif"
        >
          {{ result.fiveElBalance[axes[i].key] }}
        </text>
      </svg>
    </view>

    <!-- 五格 -->
    <view class="mjc-ge card-mystic">
      <text class="b-title title-mystic">三 才 五 格</text>
      <view class="ge-row">
        <view class="ge-cell">
          <text class="gc-l">天格</text><text class="gc-v">{{ result.wuGe.tianGe }}</text>
        </view>
        <view class="ge-cell primary">
          <text class="gc-l">人格</text><text class="gc-v">{{ result.wuGe.renGe }}</text>
        </view>
        <view class="ge-cell">
          <text class="gc-l">地格</text><text class="gc-v">{{ result.wuGe.diGe }}</text>
        </view>
        <view class="ge-cell">
          <text class="gc-l">外格</text><text class="gc-v">{{ result.wuGe.waiGe }}</text>
        </view>
        <view class="ge-cell primary">
          <text class="gc-l">总格</text><text class="gc-v">{{ result.wuGe.zongGe }}</text>
        </view>
      </view>
      <view class="ge-meta">
        <text class="gm-l">三才：</text><text class="gm-v">{{ result.wuGe.sanCai }}</text>
        <text class="gm-l gm-l2">吉凶：</text
        ><text class="gm-v" :style="{ color: jiColor(result.wuGe.jiXiong) }">
          {{ result.wuGe.jiXiong }}
        </text>
      </view>
      <text class="gm-desc">{{ result.wuGe.desc }}</text>
    </view>

    <!-- 偏旁拆解 -->
    <view class="mjc-rad card-mystic">
      <text class="b-title title-mystic">偏 旁 五 行</text>
      <view class="rad-row">
        <view v-for="(c, i) in result.name.split('')" :key="i" class="rad-cell">
          <text class="rc-char" :style="{ color: charColor(i) }">{{ c }}</text>
          <text class="rc-st">笔画 {{ strokes[i] }}</text>
          <text class="rc-wx" :style="{ color: charColor(i) }">
            {{ wxName(result.charWx[i]) }}行
          </text>
        </view>
      </view>
    </view>

    <!-- 喜用神 -->
    <view class="mjc-adv card-mystic">
      <text class="b-title title-mystic">喜 用 神 提 示</text>
      <text class="adv-text">{{ result.advice }}</text>
      <text class="adv-text adv-text2">{{ result.summary }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { polar, uid, THEME, WUXING_COLOR, levelColor as lColor } from '@/utils/chart-utils'
import type { MingjiResult } from '@/utils/mingji'
import { WUXING_META } from '@/utils/wuxing'
import type { Wuxing } from '@/utils/bazi'

const props = defineProps<{ result: MingjiResult }>()

const size = 380
const cx = size / 2
const cy = size / 2
const r = 130

const wxList: Wuxing[] = ['mu', 'huo', 'tu', 'jin', 'shui']
const axes = computed(() =>
  wxList.map((key, i) => {
    const angle = -90 + i * 72
    const end = polar(cx, cy, r, angle)
    const lp = polar(cx, cy, r + 22, angle)
    return {
      key,
      label: WUXING_META[key].name,
      color: WUXING_COLOR[key],
      x: end.x,
      y: end.y,
      lx: lp.x,
      ly: lp.y + 5,
    }
  }),
)

const dataPts = computed(() =>
  wxList.map((key, i) => {
    const angle = -90 + i * 72
    const v = Math.min(props.result.fiveElBalance[key], 5)
    return polar(cx, cy, (v / 5) * r, angle)
  }),
)

const dataPoly = computed(() => dataPts.value.map((p) => `${p.x},${p.y}`).join(' '))

const gridPolys = computed(() => {
  return [0.2, 0.4, 0.6, 0.8, 1].map((scale) => {
    return wxList
      .map((_, i) => {
        const p = polar(cx, cy, r * scale, -90 + i * 72)
        return `${p.x},${p.y}`
      })
      .join(' ')
  })
})

const strokes = computed(() => props.result.name.split('').map((c) => (c.charCodeAt(0) % 30) + 4))

function charColor(i: number): string {
  return WUXING_COLOR[props.result.charWx[i]] || WUXING_COLOR.mu
}
function wxName(w: Wuxing): string {
  return WUXING_META[w].name
}
function jiColor(j: '吉' | '半吉' | '凶'): string {
  if (j === '吉') return '#2F7D4F'
  if (j === '半吉') return '#B8B2A0'
  return '#C8302A'
}

const levelColor = computed(() => lColor(props.result.level))
const levelBorder = computed(() => `${THEME.liu}66`)
const levelBg = computed(() => 'rgba(212,175,55,0.12)')

// 数据五边形周长（用于 stroke-dasharray 动画）
const polyLen = computed(() => {
  const pts = props.result.fiveElBalance
  if (!pts) return '1000'
  const cx2 = 250,
    cy2 = 200,
    r2 = 130
  const N = 5
  const wxKeys = Object.keys(pts) as Wuxing[]
  let perim = 0
  for (let i = 0; i < N; i++) {
    const a1 = (i / N) * Math.PI * 2 - Math.PI / 2
    const a2 = ((i + 1) / N) * Math.PI * 2 - Math.PI / 2
    const v1 = Math.min(1, (pts[wxKeys[i]] || 0) / 100)
    const v2 = Math.min(1, (pts[wxKeys[(i + 1) % N]] || 0) / 100)
    const x1 = cx2 + Math.cos(a1) * r2 * v1,
      y1 = cy2 + Math.sin(a1) * r2 * v1
    const x2 = cx2 + Math.cos(a2) * r2 * v2,
      y2 = cy2 + Math.sin(a2) * r2 * v2
    perim += Math.hypot(x2 - x1, y2 - y1)
  }
  return String(Math.ceil(perim))
})
</script>

<style scoped>
.mjc {
  padding: 8rpx;
}
.mjc-hero {
  padding: 24rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, rgba(31, 78, 74, 0.12), rgba(20, 20, 28, 0.5));
  border: 2rpx solid rgba(31, 78, 74, 0.3);
  margin-bottom: 16rpx;
}
.mh-name {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  padding: 16rpx 0;
}
.mh-char {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  font-size: 72rpx;
  font-weight: bold;
  font-family: serif;
  background: rgba(10, 10, 18, 0.5);
  border: 4rpx solid;
  border-radius: 12rpx;
}
.mh-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  align-items: center;
  padding: 12rpx 0;
}
.mhr-l {
  font-size: 22rpx;
  color: var(--color-bai-3, #6b6655);
}
.mhr-l2 {
  margin-left: 16rpx;
}
.mhr-v {
  font-size: 26rpx;
  color: var(--color-bai, #f5f1e8);
  font-weight: bold;
  font-family: serif;
}
.mh-level {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 16rpx;
  border-radius: 12rpx;
  border: 1rpx solid;
  margin-top: 8rpx;
}
.mhl-t {
  font-size: 32rpx;
  font-weight: bold;
  font-family: serif;
}
.mhl-s {
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.mjc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.mjc-svg {
  width: 100%;
  max-width: 380rpx;
  height: auto;
}
.mjc-ge,
.mjc-rad,
.mjc-adv {
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
}
.b-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  margin-bottom: 12rpx;
  font-family: serif;
}
.ge-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8rpx;
  margin-bottom: 12rpx;
}
.ge-cell {
  padding: 12rpx;
  background: rgba(10, 10, 18, 0.4);
  border-radius: 8rpx;
  text-align: center;
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}
.ge-cell.primary {
  background: rgba(212, 175, 55, 0.12);
  border-color: var(--color-liu, #d4af37);
}
.gc-l {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-3, #6b6655);
}
.gc-v {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
  margin-top: 4rpx;
}
.ge-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  align-items: center;
  padding-top: 8rpx;
  border-top: 1rpx dashed rgba(212, 175, 55, 0.2);
}
.gm-l {
  font-size: 22rpx;
  color: var(--color-bai-3, #6b6655);
}
.gm-l2 {
  margin-left: 16rpx;
}
.gm-v {
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
  font-weight: bold;
}
.gm-desc {
  display: block;
  padding-top: 8rpx;
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.rad-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.rad-cell {
  flex: 1;
  min-width: 140rpx;
  padding: 12rpx;
  background: rgba(10, 10, 18, 0.4);
  border-radius: 12rpx;
  text-align: center;
}
.rc-char {
  display: block;
  font-size: 56rpx;
  font-weight: bold;
  font-family: serif;
}
.rc-st {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-top: 4rpx;
}
.rc-wx {
  display: block;
  font-size: 22rpx;
  font-weight: bold;
  margin-top: 4rpx;
}
.adv-text {
  display: block;
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
  line-height: 1.6;
}
.adv-text2 {
  padding-top: 8rpx;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
</style>
