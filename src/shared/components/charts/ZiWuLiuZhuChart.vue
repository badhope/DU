<template>
  <view class="zwl">
    <view class="zwl-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="zwl-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(91,58,142,0.18)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.9)" />
          </radialGradient>
          <filter :id="uid('g')">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#{{ uid('bg') }})" />

        <!-- 钟表外环 -->
        <circle
          :cx="cx"
          :cy="cy"
          :r="rOuter"
          fill="none"
          stroke="rgba(212,175,55,0.4)"
          stroke-width="1"
        />
        <circle
          :cx="cx"
          :cy="cy"
          :r="rInner"
          fill="none"
          stroke="rgba(212,175,55,0.2)"
          stroke-width="0.5"
        />

        <!-- 12 时辰刻度 -->
        <g v-for="(s, i) in shiChen" :key="i" class="shichen" :class="{ active: s.isCurrent }">
          <line
            :x1="s.lx1"
            :y1="s.ly1"
            :x2="s.lx2"
            :y2="s.ly2"
            :stroke="s.isCurrent ? '#D4AF37' : 'rgba(212,175,55,0.5)'"
            stroke-width="1"
          />
          <text
            :x="s.tx"
            :y="s.ty"
            text-anchor="middle"
            font-size="13"
            font-weight="bold"
            :fill="s.isCurrent ? '#D4AF37' : s.color"
            font-family="serif"
          >
            {{ s.name }}
          </text>
          <text
            :x="s.mx"
            :y="s.my"
            text-anchor="middle"
            font-size="9"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ s.timeRange }}
          </text>
        </g>

        <!-- 时辰之间连弧（经络循环） -->
        <path
          :d="cyclePath"
          stroke="rgba(91,58,142,0.5)"
          stroke-width="2"
          stroke-dasharray="4 3"
          fill="none"
          :filter="`url(#${uid('g')})`"
        />

        <!-- 当前时辰高亮 -->
        <circle
          v-if="currentShiChen"
          :cx="currentShiChen.x"
          :cy="currentShiChen.y"
          r="38"
          fill="none"
          stroke="#D4AF37"
          stroke-width="2"
          :filter="`url(#${uid('g')})`"
        >
          <animate attributeName="r" values="38;44;38" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
        </circle>

        <!-- 中心：当前经络 -->
        <circle
          :cx="cx"
          :cy="cy"
          r="50"
          :fill="currentShiChen?.fill || 'rgba(212,175,55,0.15)'"
          stroke="#D4AF37"
          stroke-width="1"
        />
        <text
          :x="cx"
          :y="cy - 10"
          text-anchor="middle"
          font-size="20"
          font-weight="bold"
          :fill="currentShiChen?.color || '#D4AF37'"
          font-family="serif"
        >
          {{ currentShiChen?.jingluo || '子午' }}
        </text>
        <text
          :x="cx"
          :y="cy + 10"
          text-anchor="middle"
          font-size="11"
          fill="#B8B2A0"
          font-family="serif"
        >
          {{ currentShiChen?.name }}时
        </text>
        <text
          :x="cx"
          :y="cy + 28"
          text-anchor="middle"
          font-size="9"
          fill="#6B6655"
          font-family="serif"
        >
          {{ currentTime }}
        </text>
      </svg>
    </view>

    <!-- 24 时辰流注 -->
    <view class="zwl-timeline card-mystic">
      <text class="b-title title-mystic">二 十 四 时 辰 经 络 流 注</text>
      <view class="tl-grid">
        <view v-for="(s, i) in all24" :key="i" class="tl-cell" :class="{ active: s.isCurrent }">
          <text class="tlc-name" :style="{ color: s.color }">{{ s.name }}</text>
          <text class="tlc-time">{{ s.timeRange }}</text>
          <text class="tlc-jl" :style="{ color: s.color }">{{ s.jingluo }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { polar, uid } from '@modules/guanxiang/logic/chart-utils'

// 12 经络 + 12 时辰
const SHICHEN_DATA = [
  { name: '子', timeRange: '23-1', jingluo: '胆经', color: '#1B3A5C' },
  { name: '丑', timeRange: '1-3', jingluo: '肝经', color: '#2F7D4F' },
  { name: '寅', timeRange: '3-5', jingluo: '肺经', color: '#E8E4D8' },
  { name: '卯', timeRange: '5-7', jingluo: '大肠经', color: '#A87C4F' },
  { name: '辰', timeRange: '7-9', jingluo: '胃经', color: '#A87C4F' },
  { name: '巳', timeRange: '9-11', jingluo: '脾经', color: '#D4AF37' },
  { name: '午', timeRange: '11-13', jingluo: '心经', color: '#C8302A' },
  { name: '未', timeRange: '13-15', jingluo: '小肠经', color: '#C8302A' },
  { name: '申', timeRange: '15-17', jingluo: '膀胱经', color: '#1B3A5C' },
  { name: '酉', timeRange: '17-19', jingluo: '肾经', color: '#1B3A5C' },
  { name: '戌', timeRange: '19-21', jingluo: '心包经', color: '#5B3A8E' },
  { name: '亥', timeRange: '21-23', jingluo: '三焦经', color: '#5B3A8E' },
]

const props = defineProps<{ currentHour?: number }>()

const size = 540
const cx = size / 2
const cy = size / 2
const rOuter = 220
const rInner = 160

const currentHour = computed(() => props.currentHour ?? new Date().getHours())

const currentShiChenIdx = computed(() => {
  const h = currentHour.value
  // 子时 23-1 = 0
  if (h >= 23 || h < 1) return 0
  return Math.floor((h + 1) / 2)
})

const currentTime = computed(() => {
  const h = new Date().getHours().toString().padStart(2, '0')
  const m = new Date().getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
})

const currentShiChen = computed(() => {
  const idx = currentShiChenIdx.value
  const s = SHICHEN_DATA[idx]!
  const p = polar(cx, cy, rInner, (360 / 12) * idx - 90)
  return { ...s, x: p.x, y: p.y, fill: 'rgba(212,175,55,0.18)' }
})

const shiChen = computed(() =>
  SHICHEN_DATA.map((s, i) => {
    const angle = (360 / 12) * i - 90
    const tickOuter = polar(cx, cy, rOuter, angle)
    const tickInner = polar(cx, cy, rOuter - 14, angle)
    const textP = polar(cx, cy, rInner + 24, angle)
    const meridianP = polar(cx, cy, rInner - 22, angle)
    return {
      ...s,
      lx1: tickOuter.x,
      ly1: tickOuter.y,
      lx2: tickInner.x,
      ly2: tickInner.y,
      tx: textP.x,
      ty: textP.y + 5,
      mx: meridianP.x,
      my: meridianP.y + 4,
      isCurrent: i === currentShiChenIdx.value,
    }
  }),
)

// 流注路径
const cyclePath = computed(() => {
  const pts = SHICHEN_DATA.map((_, i) => {
    const p = polar(cx, cy, rInner, (360 / 12) * i - 90)
    return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
  })
  pts.push('Z')
  return pts.join(' ')
})

// 24 时辰（每 2 小时细化为 2 段）
const all24 = computed(() => {
  const arr: Array<{
    name: string
    timeRange: string
    jingluo: string
    color: string
    isCurrent: boolean
  }> = []
  for (let i = 0; i < 12; i++) {
    const s = SHICHEN_DATA[i]!
    const h1 = (i * 2 + 23) % 24
    const h2 = (h1 + 1) % 24
    arr.push({
      name: s.name + '初',
      timeRange: `${h1}-${h2}`,
      jingluo: s.jingluo,
      color: s.color,
      isCurrent: false,
    })
    arr.push({
      name: s.name + '正',
      timeRange: `${h2}-${(h2 + 1) % 24}`,
      jingluo: s.jingluo,
      color: s.color,
      isCurrent: i === currentShiChenIdx.value,
    })
  }
  return arr
})
</script>

<style scoped>
.zwl {
  padding: 8rpx;
}
.zwl-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.zwl-svg {
  width: 100%;
  max-width: 540rpx;
  height: auto;
}
.shichen {
  transition: all 0.3s;
}
.zwl-timeline {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
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
.tl-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6rpx;
}
.tl-cell {
  padding: 8rpx 4rpx;
  background: rgba(10, 10, 18, 0.5);
  border-radius: 6rpx;
  text-align: center;
  border: 1rpx solid transparent;
}
.tl-cell.active {
  background: rgba(212, 175, 55, 0.15);
  border-color: var(--color-liu, #d4af37);
}
.tlc-name {
  display: block;
  font-size: 22rpx;
  font-weight: bold;
  font-family: serif;
}
.tlc-time {
  display: block;
  font-size: 16rpx;
  color: var(--color-bai-3, #6b6655);
  margin: 2rpx 0;
}
.tlc-jl {
  display: block;
  font-size: 18rpx;
  font-weight: bold;
  font-family: serif;
}
</style>
