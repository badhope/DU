<!--
  渡 DU · 大六壬天地盘可视化
  - 12 地支 + 12 神将双环（天盘外/地盘内）
  - 4 课盘心部方形
  - 三传初/中/末横向链
-->
<template>
  <view class="ldc">
    <view class="ldc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="ldc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(212,175,55,0.16)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.9)" />
          </radialGradient>
          <filter :id="uid('g')">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#{{ uid('bg') }})" />

        <!-- 外环：12 地支 -->
        <g v-for="(p, _i) in positions" :key="'z-' + p.zhi">
          <circle
            :cx="p.zhiPos.x"
            :cy="p.zhiPos.y"
            :r="zr"
            :fill="zhiFill(p.zhi)"
            :stroke="THEME.liu"
            stroke-width="1"
            opacity="0.85"
            :filter="`url(#${uid('g')})`"
          />
          <text
            :x="p.zhiPos.x"
            :y="p.zhiPos.y - 2"
            text-anchor="middle"
            font-size="16"
            font-weight="bold"
            fill="#0A0A12"
            font-family="serif"
          >
            {{ p.zhi }}
          </text>
          <text
            :x="p.zhiPos.x"
            :y="p.zhiPos.y + 14"
            text-anchor="middle"
            font-size="9"
            fill="#0A0A12"
            opacity="0.7"
            font-family="serif"
          >
            {{ zhiWuXing(p.zhi) }}
          </text>
        </g>

        <!-- 内环：天地盘神将 -->
        <g v-for="(p, _i) in positions" :key="'g-' + p.zhi">
          <!-- 天地盘之间连线 -->
          <line
            :x1="p.tianPos.x"
            :y1="p.tianPos.y"
            :x2="p.diPos.x"
            :y2="p.diPos.y"
            :stroke="p.tianGeneral === p.diGeneral ? 'rgba(212,175,55,0.4)' : 'rgba(91,58,142,0.3)'"
            stroke-width="0.8"
            stroke-dasharray="2 2"
          />
          <!-- 天盘神将 -->
          <circle
            :cx="p.tianPos.x"
            :cy="p.tianPos.y"
            :r="tr"
            :fill="natureColor(p.tianNature, 0.35)"
            :stroke="natureColor(p.tianNature, 1)"
            stroke-width="1.2"
          />
          <text
            :x="p.tianPos.x"
            :y="p.tianPos.y + 4"
            text-anchor="middle"
            font-size="11"
            font-weight="bold"
            :fill="natureColor(p.tianNature, 1)"
            font-family="serif"
          >
            {{ p.tianGeneral }}
          </text>
          <!-- 地盘神将 -->
          <circle
            :cx="p.diPos.x"
            :cy="p.diPos.y"
            :r="dr"
            :fill="natureColor(p.diNature, 0.25)"
            :stroke="natureColor(p.diNature, 0.9)"
            stroke-width="1"
          />
          <text
            :x="p.diPos.x"
            :y="p.diPos.y + 3"
            text-anchor="middle"
            font-size="9"
            :fill="natureColor(p.diNature, 1)"
            font-family="serif"
            opacity="0.85"
          >
            {{ p.diGeneral }}
          </text>
        </g>

        <!-- 内中心：四课 -->
        <circle
          :cx="cx"
          :cy="cy"
          :r="innerR"
          fill="rgba(20,20,28,0.85)"
          :stroke="THEME.liu"
          stroke-width="1.5"
          :filter="`url(#${uid('g')})`"
        />
        <text
          :x="cx"
          :y="cy - innerR + 14"
          text-anchor="middle"
          font-size="11"
          fill="#B8B2A0"
          font-family="serif"
          letter-spacing="2"
        >
          四 课
        </text>

        <g v-for="(k, i) in fourKePositions" :key="'ke-' + i">
          <rect
            :x="k.x - kw / 2"
            :y="k.y - kh / 2"
            :width="kw"
            :height="kh"
            rx="4"
            :fill="natureColor(k.nature, 0.18)"
            :stroke="natureColor(k.nature, 1)"
            stroke-width="1"
          />
          <text
            :x="k.x"
            :y="k.y - 6"
            text-anchor="middle"
            font-size="9"
            fill="#6B6655"
            font-family="serif"
          >
            {{ k.label }}
          </text>
          <text
            :x="k.x"
            :y="k.y + 6"
            text-anchor="middle"
            font-size="12"
            font-weight="bold"
            :fill="natureColor(k.nature, 1)"
            font-family="serif"
          >
            {{ k.general }}
          </text>
          <text
            :x="k.x"
            :y="k.y + 17"
            text-anchor="middle"
            font-size="8"
            fill="#B8B2A0"
            font-family="serif"
            opacity="0.7"
          >
            支{{ k.zhi }}
          </text>
        </g>

        <!-- 三传箭头：初→中→末 -->
        <g v-for="(s, i) in sanChuanChain" :key="'sc-' + i">
          <circle
            :cx="s.x"
            :cy="s.y"
            :r="scr"
            :fill="natureColor(s.nature, 0.3)"
            :stroke="natureColor(s.nature, 1)"
            stroke-width="1.5"
            :filter="`url(#${uid('g')})`"
          />
          <text
            :x="s.x"
            :y="s.y - 2"
            text-anchor="middle"
            font-size="9"
            fill="#6B6655"
            font-family="serif"
          >
            {{ s.label }}
          </text>
          <text
            :x="s.x"
            :y="s.y + 9"
            text-anchor="middle"
            font-size="11"
            font-weight="bold"
            :fill="natureColor(s.nature, 1)"
            font-family="serif"
          >
            {{ s.general }}
          </text>
          <text
            v-if="i < sanChuanChain.length - 1"
            :x="s.x + scr + 6"
            :y="s.y + 4"
            text-anchor="middle"
            font-size="14"
            :fill="THEME.liu"
            font-family="serif"
          >
            ›
          </text>
        </g>
      </svg>
    </view>

    <!-- 图例 -->
    <view class="ldc-legend card-mystic">
      <view class="lg-row">
        <view class="lg-item">
          <view class="lg-dot" :style="{ background: THEME.liu }" />
          <text class="lg-t">外环：12 地支</text>
        </view>
        <view class="lg-item">
          <view class="lg-dot" :style="{ background: '#E8E4D8' }" />
          <text class="lg-t">中环：天盘神将</text>
        </view>
        <view class="lg-item">
          <view class="lg-dot" :style="{ background: '#5B3A8E' }" />
          <text class="lg-t">内环：地盘神将</text>
        </view>
        <view class="lg-item">
          <view class="lg-dot" :style="{ background: '#2F7D4F' }" />
          <text class="lg-t">吉神</text>
        </view>
        <view class="lg-item">
          <view class="lg-dot" :style="{ background: '#8B1F1A' }" />
          <text class="lg-t">凶神</text>
        </view>
      </view>
    </view>

    <!-- 课体判词 -->
    <view class="ldc-card card-mystic">
      <view class="dc-head">
        <text class="dh-kt">{{ result.keti }}</text>
        <text class="dh-jd" :style="{ color: judgeColor(result.judge) }">{{ result.judge }}</text>
      </view>
      <text class="dc-desc">{{ result.ketiDesc }}</text>
      <view class="dc-row">
        <text class="dr-l">日干：</text><text class="dr-v">{{ result.dayGan }}</text>
        <text class="dr-l dr-l2">日支：</text><text class="dr-v">{{ result.dayZhi }}</text>
        <text class="dr-l dr-l2">时辰：</text><text class="dr-v">{{ result.hourZhi }}时</text>
      </view>
      <view class="dc-row">
        <text class="dr-l">喜神方位：</text
        ><text class="dr-v">
          {{ result.lucky.direction }}方 · 颜色{{ result.lucky.color }} · 数{{
            result.lucky.number
          }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { polar, uid, THEME } from '@/utils/chart-utils'
import type { LiurenResult } from '@/utils/liuren'

const props = defineProps<{ result: LiurenResult }>()

const size = 520
const cx = size / 2
const cy = size / 2
const outerR = 240
const tianR = 175
const diR = 130
const innerR = 75
const zr = 22
const tr = 24
const dr = 18
const scr = 22
const kw = 52
const kh = 36

const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
const WUXING_MAP: Record<string, string> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
}

const NATURE_MAP: Record<string, '吉' | '凶' | '中'> = {
  贵人: '吉',
  螣蛇: '凶',
  朱雀: '凶',
  六合: '吉',
  勾陈: '凶',
  青龙: '吉',
  天空: '中',
  白虎: '凶',
  太常: '吉',
  玄武: '凶',
  太阴: '吉',
  天后: '吉',
}

function natureOf(g: string): '吉' | '凶' | '中' {
  return NATURE_MAP[g] || '中'
}
function natureColor(n: '吉' | '凶' | '中', alpha: number): string {
  if (n === '吉') return `rgba(47,125,79,${alpha})`
  if (n === '凶') return `rgba(200,48,42,${alpha})`
  return `rgba(232,228,216,${alpha})`
}
function zhiFill(z: string): string {
  const wx = WUXING_MAP[z]
  if (wx === '金') return 'rgba(232,228,216,0.7)'
  if (wx === '木') return 'rgba(47,125,79,0.55)'
  if (wx === '水') return 'rgba(27,58,92,0.65)'
  if (wx === '火') return 'rgba(200,48,42,0.55)'
  return 'rgba(168,124,79,0.6)'
}
function zhiWuXing(z: string): string {
  return WUXING_MAP[z] || ''
}
function judgeColor(j: string): string {
  if (j === '大吉') return '#D4AF37'
  if (j === '吉') return '#2F7D4F'
  if (j === '中') return '#B8B2A0'
  if (j === '凶') return '#C8302A'
  return '#8B1F1A'
}

const positions = computed(() =>
  ZHI.map((z, i) => {
    const angle = -90 + i * 30
    const zhiPos = polar(cx, cy, outerR, angle)
    const tianPos = polar(cx, cy, tianR, angle)
    const diPos = polar(cx, cy, diR, angle)
    const tian = props.result.tianPan.find((t) => t.zhi === z)
    const di = props.result.diPan.find((t) => t.zhi === z)
    return {
      zhi: z,
      zhiPos,
      tianPos,
      diPos,
      tianGeneral: tian?.general || '贵人',
      tianNature: natureOf(tian?.general || '贵人'),
      diGeneral: di?.general || '贵人',
      diNature: natureOf(di?.general || '贵人'),
    }
  }),
)

const fourKePositions = computed(() => {
  // 4 课在中心内 2×2 排布
  const r2 = innerR - 18
  const positions = [
    { x: cx - r2 / 2, y: cy - 12 },
    { x: cx + r2 / 2, y: cy - 12 },
    { x: cx - r2 / 2, y: cy + 12 },
    { x: cx + r2 / 2, y: cy + 12 },
  ]
  return props.result.fourKe.map((k, i) => ({
    ...k,
    ...positions[i],
    label: k.ke,
    nature: natureOf(k.general),
  }))
})

const sanChuanChain = computed(() => {
  // 三传在 SVG 底部一条横线
  const y = size - 24
  const startX = cx - 70
  return [
    {
      label: '初传',
      x: startX,
      y,
      general: props.result.sanChuan.chu,
      nature: natureOf(props.result.sanChuan.chu),
    },
    {
      label: '中传',
      x: startX + 70,
      y,
      general: props.result.sanChuan.zhong,
      nature: natureOf(props.result.sanChuan.zhong),
    },
    {
      label: '末传',
      x: startX + 140,
      y,
      general: props.result.sanChuan.mo,
      nature: natureOf(props.result.sanChuan.mo),
    },
  ]
})
</script>

<style scoped>
.ldc {
  padding: 8rpx;
}
.ldc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.ldc-svg {
  width: 100%;
  max-width: 520rpx;
  height: auto;
}
.ldc-legend,
.ldc-card {
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
}
.lg-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx 20rpx;
}
.lg-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
}
.lg-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}
.lg-t {
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.dc-head {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  padding-bottom: 8rpx;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}
.dh-kt {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
.dh-jd {
  font-size: 30rpx;
  font-weight: bold;
  font-family: serif;
}
.dc-desc {
  display: block;
  padding: 10rpx 0;
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--color-bai-2, #b8b2a0);
}
.dc-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  padding: 4rpx 0;
  font-size: 24rpx;
}
.dr-l {
  color: var(--color-bai-3, #6b6655);
}
.dr-l2 {
  margin-left: 24rpx;
}
.dr-v {
  color: var(--color-bai, #f5f1e8);
  font-weight: 500;
}
</style>
