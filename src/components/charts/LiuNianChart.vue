<template>
  <view class="lyc">
    <view class="lyc-canvas">
      <svg :viewBox="`0 0 ${size} ${h}`" class="lyc-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient :id="uid('g-pos')" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(212,175,55,0.6)" />
            <stop offset="100%" stop-color="rgba(212,175,55,0.1)" />
          </linearGradient>
          <linearGradient :id="uid('g-neg')" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(200,48,42,0.1)" />
            <stop offset="100%" stop-color="rgba(200,48,42,0.6)" />
          </linearGradient>
          <filter :id="uid('glow')">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- 零线 -->
        <line
          :x1="padX"
          :y1="midY"
          :x2="size - padX"
          :y2="midY"
          stroke="rgba(212,175,55,0.3)"
          stroke-width="1"
          stroke-dasharray="4 3"
        />
        <text :x="padX" :y="midY - 6" font-size="11" fill="#B8B2A0" font-family="serif">吉</text>
        <text :x="padX" :y="midY + 16" font-size="11" fill="#B8B2A0" font-family="serif">凶</text>

        <!-- 当前年高亮竖线 -->
        <line
          v-if="currentIdx >= 0"
          :x1="xAt(currentIdx)"
          :y1="padY"
          :x2="xAt(currentIdx)"
          :y2="h - padY"
          stroke="rgba(212,175,55,0.3)"
          stroke-width="1"
          stroke-dasharray="3 4"
        />

        <!-- 轨迹连线 (path 绘制动画) -->
        <path
          v-if="years.length > 1"
          :d="trendPath"
          fill="none"
          stroke="rgba(212,175,55,0.55)"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          :filter="`url(#${uid('glow')})`"
          :style="{
            strokeDasharray: dashTotal,
            strokeDashoffset: dashTotal,
            animation: 'pathDraw 2.4s ease-out 0.2s forwards',
          }"
        />

        <!-- 柱体 -->
        <g v-for="(y, i) in years" :key="i" class="bar" @click="selectIdx(i)">
          <rect
            :x="xAt(i) - barW / 2"
            :y="scoreOf(i) >= 0 ? midY - barH(scoreOf(i)) : midY"
            :width="barW"
            :height="barH(scoreOf(i))"
            :fill="scoreOf(i) >= 0 ? `url(#${uid('g-pos')})` : `url(#${uid('g-neg')})`"
            :stroke="scoreOf(i) >= 0 ? '#D4AF37' : '#C8302A'"
            stroke-width="1"
            :opacity="activeIdx === i ? 1 : 0.7"
            rx="3"
            :filter="`url(#${uid('glow')})`"
          />
          <!-- 干支 -->
          <text
            :x="xAt(i)"
            :y="h - padY + 18"
            text-anchor="middle"
            font-size="13"
            font-weight="bold"
            :fill="activeIdx === i ? '#D4AF37' : '#F5F1E8'"
            font-family="serif"
          >
            {{ y.ganZhi }}
          </text>
          <!-- 流年 -->
          <text
            :x="xAt(i)"
            :y="h - padY + 36"
            text-anchor="middle"
            font-size="11"
            fill="#6B6655"
            font-family="serif"
          >
            {{ y.year }}
          </text>
          <!-- 十神 -->
          <text
            v-if="y.shishen"
            :x="xAt(i)"
            :y="h - padY + 52"
            text-anchor="middle"
            font-size="10"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ y.shishen }}
          </text>
          <!-- 当前年 -->
          <circle v-if="i === currentIdx" :cx="xAt(i)" :cy="padY" r="4" fill="#D4AF37" />
        </g>

        <!-- 选中年分数 -->
        <g v-if="selected">
          <rect
            :x="xAt(activeIdx) - 30"
            :y="padY + 12"
            width="60"
            height="22"
            rx="11"
            fill="rgba(212,175,55,0.15)"
            stroke="#D4AF37"
            stroke-width="0.5"
          />
          <text
            :x="xAt(activeIdx)"
            :y="padY + 27"
            text-anchor="middle"
            font-size="13"
            fill="#D4AF37"
            font-family="serif"
            font-weight="bold"
          >
            {{ selected.score }}
          </text>
        </g>
      </svg>
    </view>

    <view v-if="selected" class="lyc-detail card-mystic">
      <view class="detail-head">
        <text class="dh-year">{{ selected.year }}年</text>
        <text class="dh-gz"
          >
{{ selected.ganZhi || selected.gan + selected.zhi }} · {{ selected.shishen || '' }}
</text
        >
      </view>
      <view class="detail-body">
        <text class="db-line"
          >
流年强度：<text :style="{ color: currentScore >= 0 ? '#D4AF37' : '#C8302A' }"
            >
{{ currentScore > 0 ? '吉' : '凶' }}{{ Math.abs(currentScore) }}
</text
          >
</text
        >
        <text class="db-line">事业：{{ careerText(currentScore) }}</text>
        <text class="db-line">财帛：{{ wealthText(currentScore) }}</text>
        <text class="db-line">健康：{{ healthText(currentScore) }}</text>
        <text class="db-line">人际：{{ socialText(currentScore) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { uid } from '@/utils/chart-utils'

export interface LiuNianYear {
  year: number
  gan: string
  zhi: string
  ganZhi?: string
  shishen?: string
  score?: number // -100 ~ 100, 可选，缺省时根据 shishen 推断
  highlight?: string
}

const props = defineProps<{ years: LiuNianYear[] }>()

const size = 720
const h = 360
const padX = 36
const padY = 24
const midY = h / 2 + 10
const barW = 36
const maxH = h / 2 - padY

const activeIdx = ref(0)
const currentYear = new Date().getFullYear()
const currentIdx = computed(() => props.years.findIndex((y) => y.year === currentYear))

const selectIdx = (i: number) => {
  activeIdx.value = i
}
const selected = computed(() => props.years[activeIdx.value])
const currentScore = computed(() => (selected.value ? inferScore(selected.value) : 0))

const scoreOf = (i: number) => inferScore(props.years[i])

const xAt = (i: number) =>
  padX + barW / 2 + (i * (size - padX * 2)) / Math.max(1, props.years.length - 1)
const barH = (score: number) => (Math.abs(score) * maxH) / 100

// 推断分数（无 score 时根据 shishen 推断）
function inferScore(y: LiuNianYear): number {
  if (typeof y.score === 'number') return y.score
  const s = (y.shishen || '').replace(/[()（） ]/g, '')
  // 比劫 食伤 财 才 官 杀 印 枭 → 不同吉凶
  if (s.includes('财') || s.includes('食') || s.includes('伤')) return 30
  if (s.includes('印') || s.includes('比') || s.includes('劫')) return 10
  if (s.includes('官') || s.includes('杀') || s.includes('七')) return -20
  return 0
}

const careerText = (s: number) =>
  s > 30 ? '大展宏图' : s > 0 ? '稳中有进' : s > -30 ? '守成为上' : '暂避锋芒'
const wealthText = (s: number) =>
  s > 30 ? '财源广进' : s > 0 ? '小有进账' : s > -30 ? '守财为要' : '破财风险'
const healthText = (s: number) => (s > 0 ? '身强体健' : '注意调养')
const socialText = (s: number) =>
  s > 30 ? '贵人相助' : s > 0 ? '人缘尚可' : s > -30 ? '少言寡语' : '口舌纷争'

// 趋势连线 + 动画长度
const trendPath = computed(() => {
  if (props.years.length < 2) return ''
  return props.years
    .map(
      (_, i) =>
        `${i === 0 ? 'M' : 'L'}${xAt(i)},${scoreOf(i) >= 0 ? midY - barH(scoreOf(i)) : midY + barH(scoreOf(i))}`,
    )
    .join(' ')
})
const dashTotal = computed(() => {
  if (props.years.length < 2) return 0
  // 简化估算：路径长度 = 段数 * 平均 dx
  const n = props.years.length - 1
  const avgDx = (size - padX * 2) / Math.max(1, n)
  return Math.ceil(n * avgDx * 1.2)
})
</script>

<style scoped>
.lyc {
  padding: 8rpx;
}
.lyc-canvas {
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
  padding: 16rpx;
}
.lyc-svg {
  width: 100%;
  height: auto;
}
.bar {
  cursor: pointer;
}
.bar:hover rect {
  opacity: 1 !important;
}
@keyframes pathDraw {
  to {
    stroke-dashoffset: 0;
  }
}
.lyc-detail {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
}
.detail-head {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}
.dh-year {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
.dh-gz {
  font-size: 26rpx;
  color: var(--color-bai, #f5f1e8);
}
.detail-body {
  padding-top: 12rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.db-line {
  font-size: 26rpx;
  color: var(--color-bai-2, #b8b2a0);
  line-height: 1.6;
}
</style>
