<template>
  <view class="mhc">
    <view class="mhc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="mhc-svg">
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

        <!-- 后天八卦圆 -->
        <g v-for="(b, i) in baguaSectors" :key="'b' + i">
          <line
            :x1="b.lineX1"
            :y1="b.lineY1"
            :x2="b.lineX2"
            :y2="b.lineY2"
            stroke="rgba(212,175,55,0.3)"
            stroke-width="0.5"
          />
          <text
            :x="b.tx"
            :y="b.ty"
            text-anchor="middle"
            font-size="24"
            :fill="b.color"
            font-family="serif"
            font-weight="bold"
          >
            {{ b.symbol }}
          </text>
          <text
            :x="b.nx"
            :y="b.ny"
            text-anchor="middle"
            font-size="11"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ b.name }}
          </text>
        </g>

        <!-- 64 卦主卦 -->
        <g v-if="hexCenter">
          <circle
            :cx="cx"
            :cy="cy"
            r="50"
            :fill="hexCenter.fill"
            stroke="rgba(212,175,55,0.5)"
            stroke-width="1"
            :filter="`url(#${uid('g')})`"
          />
          <text
            :x="cx"
            :y="cy - 12"
            text-anchor="middle"
            font-size="22"
            font-weight="bold"
            fill="#D4AF37"
            font-family="serif"
          >
            {{ hexCenter.name }}
          </text>
          <text
            :x="cx"
            :y="cy + 10"
            text-anchor="middle"
            font-size="11"
            fill="#B8B2A0"
            font-family="serif"
          >
            动爻 {{ result.dongYao }}
          </text>
          <text
            :x="cx"
            :y="cy + 26"
            text-anchor="middle"
            font-size="10"
            fill="#6B6655"
            font-family="serif"
          >
            {{ hexCenter.title }}
          </text>
        </g>

        <!-- 体卦高亮 -->
        <g v-if="tiGua">
          <circle
            :cx="tiGua.x"
            :cy="tiGua.y"
            r="38"
            fill="none"
            stroke="#D4AF37"
            stroke-width="2"
            stroke-dasharray="4 3"
          />
          <text
            :x="tiGua.x"
            :y="tiGua.y + 56"
            text-anchor="middle"
            font-size="10"
            fill="#D4AF37"
            font-weight="bold"
            font-family="serif"
          >
            体 卦
          </text>
        </g>
        <g v-if="yongGua">
          <circle
            :cx="yongGua.x"
            :cy="yongGua.y"
            r="38"
            fill="none"
            stroke="#C8302A"
            stroke-width="2"
            stroke-dasharray="4 3"
          />
          <text
            :x="yongGua.x"
            :y="yongGua.y + 56"
            text-anchor="middle"
            font-size="10"
            fill="#C8302A"
            font-weight="bold"
            font-family="serif"
          >
            用 卦
          </text>
        </g>

        <!-- 内圈 8 卦 -->
        <circle
          :cx="cx"
          :cy="cy"
          :r="rInner"
          fill="none"
          stroke="rgba(212,175,55,0.15)"
          stroke-width="0.5"
        />
        <circle
          :cx="cx"
          :cy="cy"
          :r="rOuter"
          fill="none"
          stroke="rgba(212,175,55,0.3)"
          stroke-width="0.5"
        />
      </svg>
    </view>

    <!-- 卦象详情 -->
    <view class="mhc-hex card-mystic">
      <text class="b-title title-mystic">主 卦 · 体 用 · 变 卦</text>
      <view class="hex-row">
        <view class="hr-cell">
          <text class="hrc-label">主卦</text>
          <text class="hrc-symbol" :style="{ color: result.upper.color }">
            {{ result.upper.symbol }}
          </text>
          <text class="hrc-name" :style="{ color: result.upper.color }">
            {{ result.upper.name }}
          </text>
          <text class="hrc-wx">{{ result.upper.wuxing }}</text>
        </view>
        <text class="hex-sep">+</text>
        <view class="hr-cell">
          <text class="hrc-label">下卦</text>
          <text class="hrc-symbol" :style="{ color: result.lower.color }">
            {{ result.lower.symbol }}
          </text>
          <text class="hrc-name" :style="{ color: result.lower.color }">
            {{ result.lower.name }}
          </text>
          <text class="hrc-wx">{{ result.lower.wuxing }}</text>
        </view>
        <text class="hex-sep">→</text>
        <view class="hr-cell">
          <text class="hrc-label">变卦</text>
          <text class="hrc-symbol" :style="{ color: result.bian.color }">
            {{ result.bian.symbol }}
          </text>
          <text class="hrc-name" :style="{ color: result.bian.color }">{{ result.bian.name }}</text>
          <text class="hrc-wx">{{ result.bian.wuxing }}</text>
        </view>
      </view>
      <text class="hex-name">{{ result.hexName }}（{{ result.interpretation }}）</text>
    </view>

    <!-- 五维评分 -->
    <view class="mhc-scores card-mystic">
      <text class="b-title title-mystic">五 维 评 分</text>
      <view class="s-grid">
        <view v-for="(s, i) in scoreList" :key="i" class="s-cell">
          <text class="s-name">{{ s.name }}</text>
          <view class="s-bar">
            <view class="s-fill" :style="{ width: s.val + '%', background: s.color }" />
          </view>
          <text class="s-val" :style="{ color: s.color }">{{ s.val }}</text>
        </view>
      </view>
    </view>

    <!-- 建议 -->
    <view class="mhc-advice card-mystic">
      <text class="b-title title-mystic">总 断 与 建 议</text>
      <text class="ad-summary">{{ result.summary }}</text>
      <view class="ad-tip">
        <text class="adt-l">建议：</text><text class="adt-v">{{ result.advice }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BAGUA_LIST, type MeihuaResult } from '@/modules/zhanbu/logic/meihua'
// BAGUA_LIST is used as value in scripts above
import { polar, uid } from '@/utils/chart-utils'
import type { Wuxing } from '@/modules/mingli/logic/wuxing'

const props = defineProps<{ result: MeihuaResult }>()

const size = 480
const cx = size / 2
const cy = size / 2
const rOuter = 180
const rInner = 100

const WX_COLOR: Record<Wuxing, string> = {
  jin: '#E8E4D8',
  mu: '#2F7D4F',
  shui: '#1B3A5C',
  huo: '#C8302A',
  tu: '#A87C4F',
}

// 数字 1-8 在 8 卦圆上的位置（洛书九宫轨迹）
// 1 乾(西北) 2 兑(西) 3 离(南) 4 震(东) 5 巽(东南) 6 坎(北) 7 艮(东北) 8 坤(西南)
const BAGUA_POS = [
  { num: 1, deg: -45 }, // 乾 西北
  { num: 2, deg: 0 }, // 兑 西
  { num: 3, deg: -90 }, // 离 南
  { num: 4, deg: -180 }, // 震 东
  { num: 5, deg: -135 }, // 巽 东南
  { num: 6, deg: 90 }, // 坎 北
  { num: 7, deg: -45 - 45 }, // 艮 东北
  { num: 8, deg: 45 }, // 坤 西南
]

const baguaSectors = computed(() => {
  return BAGUA_LIST.map((b, i) => {
    const p = BAGUA_POS[i]
    const p1 = polar(cx, cy, rOuter, p.deg - 22.5)
    const p2 = polar(cx, cy, rOuter, p.deg + 22.5)
    const textP = polar(cx, cy, (rOuter + rInner) / 2 + 20, p.deg)
    const nameP = polar(cx, cy, rOuter + 14, p.deg)
    return {
      ...b,
      color: WX_COLOR[b.wuxing],
      lineX1: p1.x,
      lineY1: p1.y,
      lineX2: p2.x,
      lineY2: p2.y,
      tx: textP.x,
      ty: textP.y,
      nx: nameP.x,
      ny: nameP.y,
    }
  })
})

// 找体卦、用卦在圆盘上的位置
const findGuaPos = (guaName: string) => {
  const idx = BAGUA_LIST.findIndex((b) => b.name === guaName)
  if (idx < 0) return null
  const pos = BAGUA_POS[idx]
  return polar(cx, cy, rInner, pos.deg)
}

const tiGua = computed(() => {
  const p = findGuaPos(props.result.ti.name)
  return p ? { x: p.x, y: p.y } : null
})
const yongGua = computed(() => {
  const p = findGuaPos(props.result.yong.name)
  return p ? { x: p.x, y: p.y } : null
})

const hexCenter = computed(() => {
  return {
    name: props.result.hexName,
    title: props.result.interpretation,
    fill: 'rgba(20,20,28,0.7)',
  }
})

const scoreList = computed(() => [
  { name: '事业', val: props.result.scores.shiye, color: '#D4AF37' },
  { name: '财运', val: props.result.scores.caiyun, color: '#C8302A' },
  { name: '感情', val: props.result.scores.ganqing, color: '#E04A3A' },
  { name: '健康', val: props.result.scores.jiankang, color: '#2F7D4F' },
  { name: '精神', val: props.result.scores.jingshen, color: '#5B3A8E' },
])
</script>

<style scoped>
.mhc {
  padding: 8rpx;
}
.mhc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.mhc-svg {
  width: 100%;
  max-width: 480rpx;
  height: auto;
}
.mhc-hex,
.mhc-scores,
.mhc-advice {
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
.hex-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 12rpx 0;
}
.hr-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.hrc-label {
  font-size: 20rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.hrc-symbol {
  font-size: 48rpx;
  font-weight: bold;
  font-family: serif;
  line-height: 1.1;
}
.hrc-name {
  font-size: 22rpx;
  font-weight: bold;
  font-family: serif;
}
.hrc-wx {
  font-size: 18rpx;
  color: var(--color-bai-3, #6b6655);
}
.hex-sep {
  font-size: 28rpx;
  color: var(--color-liu, #d4af37);
  font-weight: bold;
}
.hex-name {
  display: block;
  text-align: center;
  padding: 8rpx 0;
  font-size: 26rpx;
  color: var(--color-liu, #d4af37);
  font-weight: bold;
  font-family: serif;
}
.s-grid {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.s-cell {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.s-name {
  width: 80rpx;
  font-size: 26rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.s-bar {
  flex: 1;
  height: 12rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6rpx;
  overflow: hidden;
}
.s-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.8s cubic-bezier(0.65, 0, 0.35, 1);
}
.s-val {
  width: 60rpx;
  text-align: right;
  font-size: 26rpx;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
}
.ad-summary {
  display: block;
  padding: 8rpx 0;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--color-bai, #f5f1e8);
}
.ad-tip {
  margin-top: 8rpx;
  padding: 12rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 8rpx;
}
.adt-l {
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.adt-v {
  font-size: 26rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  margin-left: 8rpx;
}
</style>
