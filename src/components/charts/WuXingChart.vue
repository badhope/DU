<template>
  <view class="wxc">
    <!-- 中心装饰 + 五环 -->
    <view class="wxc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="wxc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(212,175,55,0.18)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.7)" />
          </radialGradient>
          <filter :id="uid('glow')">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle :cx="cx" :cy="cy" :r="rOuter" fill="url(#{{ gid('bg') }})" />
        <!-- 五环弧（相生） -->
        <path
          v-for="(s, i) in arcs"
          :key="i"
          :d="s.d"
          :stroke="s.color"
          stroke-width="14"
          fill="none"
          stroke-linecap="round"
          :filter="`url(#${gid('glow')})`"
          :opacity="s.opacity"
          class="arc-anim"
        />
        <!-- 五角连线（相克） -->
        <g class="ke-lines">
          <line
            v-for="(k, i) in keLines"
            :key="'k' + i"
            :x1="k.x1"
            :y1="k.y1"
            :x2="k.x2"
            :y2="k.y2"
            stroke="rgba(200,48,42,0.4)"
            stroke-width="1.5"
            stroke-dasharray="3 3"
          />
        </g>
        <!-- 五行文字 -->
        <g v-for="(p, i) in positions" :key="'t' + i">
          <circle :cx="p.x" :cy="p.y" r="22" :fill="p.color" :opacity="0.9" />
          <text
            :x="p.x"
            :y="p.y + 6"
            text-anchor="middle"
            font-size="20"
            font-weight="bold"
            :fill="p.textColor"
            font-family="serif"
          >
            {{ p.name }}
          </text>
        </g>
        <!-- 中心圈 -->
        <circle
          :cx="cx"
          :cy="cy"
          :r="38"
          fill="rgba(10,10,18,0.9)"
          stroke="rgba(212,175,55,0.6)"
          stroke-width="1.5"
        />
        <text
          :x="cx"
          :y="cy - 3"
          text-anchor="middle"
          font-size="13"
          fill="#D4AF37"
          font-family="serif"
        >
          五行
        </text>
        <text :x="cx" :y="cy + 14" text-anchor="middle" font-size="11" fill="#B8B2A0">
          {{ summary }}
        </text>
      </svg>
    </view>

    <!-- 详情面板 -->
    <view class="wxc-list">
      <view
        v-for="(m, i) in items"
        :key="i"
        class="wx-row"
        :class="{ active: active === m.key }"
        @click="active = m.key"
      >
        <view class="wx-dot" :style="{ background: m.color }" />
        <view class="wx-name">{{ m.name }}行</view>
        <view class="wx-bar">
          <view class="wx-fill" :style="{ width: m.score + '%', background: m.color }" />
        </view>
        <view class="wx-val" :style="{ color: m.color }">{{ m.score }}</view>
      </view>
    </view>

    <!-- 选中详情 -->
    <view v-if="selected" class="wxc-detail card-mystic">
      <view class="detail-row">
        <text class="dr-label">五行：</text
        ><text class="dr-val" :style="{ color: selected.color }">{{ selected.name }}</text>
      </view>
      <view class="detail-row">
        <text class="dr-label">方位：</text><text class="dr-val">{{ selected.direction }}</text>
      </view>
      <view class="detail-row">
        <text class="dr-label">季节：</text><text class="dr-val">{{ selected.season }}</text>
      </view>
      <view class="detail-row">
        <text class="dr-label">脏腑：</text><text class="dr-val">{{ selected.organ }}</text>
      </view>
      <view class="detail-row">
        <text class="dr-label">情志：</text><text class="dr-val">{{ selected.emotion }}</text>
      </view>
      <view class="detail-row">
        <text class="dr-label">德性：</text><text class="dr-val">{{ selected.virtue }}</text>
      </view>
      <view class="detail-desc">{{ selected.desc }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { WUXING_META, type Wuxing } from '@/utils/wuxing'
import { polar, arcPath, uid } from '@/utils/chart-utils'

const gid = (s: string) => uid(s)

interface Props {
  scores?: Partial<Record<Wuxing, number>> // 0-100 各行强度
  summary?: string
}

const props = withDefaults(defineProps<Props>(), {
  scores: () => ({}),
  summary: '相生相克 · 动态平衡',
})

const WX_ORDER: Wuxing[] = ['mu', 'huo', 'tu', 'jin', 'shui']
// 五角顶点角度（从顶部开始）
const NAMES = ['木', '火', '土', '金', '水']

const size = 360
const cx = size / 2
const cy = size / 2
const rOuter = 150
const rText = 118

const active = ref<Wuxing>('mu')

const positions = computed(() =>
  NAMES.map((n, i) => {
    const angle = (360 / 5) * i - 90
    const p = polar(cx, cy, rText, angle)
    const m = WUXING_META[WX_ORDER[i]]
    return { name: n, x: p.x, y: p.y, color: m.color, textColor: m.textColor }
  }),
)

// 相生弧（每两行之间画一段弧）
const arcs = computed(() => {
  const arr: Array<{ d: string; color: string; opacity: number }> = []
  for (let i = 0; i < 5; i++) {
    const a1 = (360 / 5) * i - 90 + 18
    const a2 = (360 / 5) * (i + 1) - 90 - 18
    arr.push({
      d: arcPath(cx, cy, rOuter, a1, a2),
      color: WUXING_META[WX_ORDER[i]].color,
      opacity: 0.85,
    })
  }
  return arr
})

// 相克线（隔一个连一条）
const keLines = computed(() => {
  const arr: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (let i = 0; i < 5; i++) {
    const j = (i + 2) % 5
    const a1 = polar(cx, cy, rText, (360 / 5) * i - 90)
    const a2 = polar(cx, cy, rText, (360 / 5) * j - 90)
    arr.push({ x1: a1.x, y1: a1.y, x2: a2.x, y2: a2.y })
  }
  return arr
})

const items = computed(() =>
  WX_ORDER.map((k) => {
    const m = WUXING_META[k]
    const score = props.scores?.[k] ?? 50
    return { key: k, name: m.name, color: m.color, score }
  }),
)

const selected = computed(() => WUXING_META[active.value])
</script>

<style scoped>
.wxc {
  padding: 8rpx;
}
.wxc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.wxc-svg {
  width: 100%;
  max-width: 600rpx;
  height: auto;
}
.wxc-list {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.wx-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx 16rpx;
  background: rgba(20, 20, 28, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: 12rpx;
  transition: all 0.2s;
}
.wx-row.active {
  border-color: var(--color-liu, #d4af37);
  background: rgba(212, 175, 55, 0.08);
}
.wx-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 12rpx currentColor;
}
.wx-name {
  width: 80rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.wx-bar {
  flex: 1;
  height: 12rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6rpx;
  overflow: hidden;
}
.wx-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.6s cubic-bezier(0.65, 0, 0.35, 1);
}
.wx-val {
  width: 60rpx;
  text-align: right;
  font-size: 26rpx;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
}
.wxc-detail {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
}
.detail-row {
  display: flex;
  gap: 12rpx;
  padding: 4rpx 0;
  font-size: 26rpx;
}
.dr-label {
  color: var(--color-bai-2, #b8b2a0);
}
.dr-val {
  color: var(--color-bai, #f5f1e8);
}
.detail-desc {
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx dashed rgba(212, 175, 55, 0.2);
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--color-bai-2, #b8b2a0);
}
.arc-anim {
  animation: arc-draw 1.2s cubic-bezier(0.65, 0, 0.35, 1) backwards;
}
.arc-anim:nth-child(1) {
  animation-delay: 0s;
}
.arc-anim:nth-child(2) {
  animation-delay: 0.15s;
}
.arc-anim:nth-child(3) {
  animation-delay: 0.3s;
}
.arc-anim:nth-child(4) {
  animation-delay: 0.45s;
}
.arc-anim:nth-child(5) {
  animation-delay: 0.6s;
}
@keyframes arc-draw {
  from {
    stroke-dasharray: 0 999;
    opacity: 0;
  }
  to {
    opacity: 0.85;
  }
}
</style>
