<!--
  玄枢 MISTVERSE · 阳宅风水八宅派可视化
  - 8 宫位方位 + 户型俯视图
  - 大门/主卧/厨房/书房/客厅建议方位
-->
<template>
  <view class="flc">
    <view class="flc-head card-mystic">
      <view class="fh-row">
        <view class="fh-cell">
          <text class="fc-l">命卦</text>
          <text class="fc-v">{{ result.lifeMingName }}</text>
          <text class="fc-s">{{ result.lifeMing === 'dong' ? '东四命' : '西四命' }}</text>
        </view>
        <view class="fh-cell primary">
          <text class="fc-l">宅卦</text>
          <text class="fc-v">{{ result.zhaiGuaName }}</text>
          <text class="fc-s">{{ result.zhaiGuaName }}命同属</text>
        </view>
      </view>
      <view class="fh-score">
        <text class="fs-l">总评：</text>
        <view class="fs-bar">
          <view class="fs-fill" :style="{ width: result.totalScore + '%', background: lvColor }" />
        </view>
        <text class="fs-v" :style="{ color: lvColor }">
          {{ result.totalScore }} 分 · {{ result.level }}
        </text>
      </view>
      <text class="fh-best">最佳方位：{{ result.bestDirection }}</text>
    </view>

    <!-- 户型俯视图：8 方位 + 房屋 -->
    <view class="flc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="flc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(212,175,55,0.15)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.9)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#{{ uid('bg') }})" />

        <!-- 外环：8 方位 + 八卦 -->
        <g v-for="(b, i) in ringPos" :key="'b-' + i">
          <line
            :x1="cx"
            :y1="cy"
            :x2="b.x"
            :y2="b.y"
            :stroke="b.lvColor"
            stroke-width="1"
            opacity="0.3"
          />
          <circle
            :cx="b.x"
            :cy="b.y"
            :r="48"
            :fill="b.bg"
            :stroke="b.lvColor"
            stroke-width="2"
            :filter="`url(#${uid('g')})`"
          />
          <text
            :x="b.x"
            :y="b.y - 8"
            text-anchor="middle"
            font-size="22"
            :fill="b.lvColor"
            font-family="serif"
            font-weight="bold"
          >
            {{ b.symbol }}
          </text>
          <text
            :x="b.x"
            :y="b.y + 14"
            text-anchor="middle"
            font-size="11"
            :fill="b.lvColor"
            font-family="serif"
          >
            {{ b.name }}·{{ b.position }}
          </text>
          <text
            :x="b.x"
            :y="b.y + 30"
            text-anchor="middle"
            font-size="10"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ b.fortune }}·{{ b.level }}
          </text>
        </g>

        <!-- 中央：房屋 -->
        <rect
          :x="cx - 70"
          :y="cy - 60"
          width="140"
          height="120"
          rx="6"
          fill="rgba(168,124,79,0.15)"
          stroke="#A87C4F"
          stroke-width="2"
        />
        <!-- 房间分隔线 -->
        <line
          :x1="cx"
          :y1="cy - 60"
          :x2="cx"
          :y2="cy + 60"
          stroke="#A87C4F"
          stroke-width="1"
          stroke-dasharray="3 2"
          opacity="0.5"
        />
        <line
          :x1="cx - 70"
          :y1="cy"
          :x2="cx + 70"
          :y2="cy"
          stroke="#A87C4F"
          stroke-width="1"
          stroke-dasharray="3 2"
          opacity="0.5"
        />
        <!-- 房门指示 -->
        <rect :x="cx - 8" :y="cy - 60" width="16" height="6" fill="#D4AF37" />
        <text
          :x="cx"
          :y="cy - 14"
          text-anchor="middle"
          font-size="9"
          fill="#D4AF37"
          font-family="serif"
          letter-spacing="2"
        >
          大 门
        </text>
        <text
          :x="cx - 35"
          :y="cy - 32"
          text-anchor="middle"
          font-size="9"
          fill="#B8B2A0"
          font-family="serif"
        >
          主 卧
        </text>
        <text
          :x="cx + 35"
          :y="cy - 32"
          text-anchor="middle"
          font-size="9"
          fill="#B8B2A0"
          font-family="serif"
        >
          书 房
        </text>
        <text
          :x="cx - 35"
          :y="cy + 30"
          text-anchor="middle"
          font-size="9"
          fill="#B8B2A0"
          font-family="serif"
        >
          厨 房
        </text>
        <text
          :x="cx + 35"
          :y="cy + 30"
          text-anchor="middle"
          font-size="9"
          fill="#B8B2A0"
          font-family="serif"
        >
          客 厅
        </text>
      </svg>
    </view>

    <!-- 门位建议 -->
    <view class="flc-men card-mystic">
      <text class="b-title title-mystic">各 房 门 位 建 议</text>
      <view v-for="m in result.menWei" :key="m.key" class="men-row">
        <text class="mn-l">{{ m.name }}</text>
        <view class="mn-list">
          <text v-for="r in m.recommended" :key="r" class="mn-tag">{{ r }}</text>
        </view>
      </view>
    </view>

    <view class="flc-adv card-mystic">
      <text class="b-title title-mystic">建 议</text>
      <text v-for="(a, i) in result.advice" :key="i" class="adv-line">· {{ a }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { polar, uid, THEME as _THEME, levelColor as lColor } from '@/utils/chart-utils'
import type { FengluiResult } from '@/modules/guwu/logic/fenglui'

const props = defineProps<{ result: FengluiResult }>()

const size = 480
const cx = size / 2
const cy = size / 2
const ringR = 175

function hexToRgba(hex: string, alpha: number): string {
  const r0 = parseInt(hex.slice(1, 3), 16)
  const g0 = parseInt(hex.slice(3, 5), 16)
  const b0 = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r0},${g0},${b0},${alpha})`
}

const ringPos = computed(() => {
  return props.result.baGua.map((b, i) => {
    const angle = -90 + i * 45
    const p = polar(cx, cy, ringR, angle)
    const color = b.level === '吉' ? '#2F7D4F' : b.level === '中' ? '#B8B2A0' : '#C8302A'
    return {
      x: p.x,
      y: p.y,
      name: b.name,
      position: b.position,
      symbol: b.symbol,
      fortune: b.fortune,
      level: b.level,
      lvColor: color,
      bg: hexToRgba(color, 0.18),
    }
  })
})

const lvColor = computed(() => lColor(props.result.level))
</script>

<style scoped>
.flc {
  padding: 8rpx;
}
.flc-head {
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
  margin-bottom: 16rpx;
}
.fh-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.fh-cell {
  flex: 1;
  padding: 12rpx;
  background: rgba(10, 10, 18, 0.4);
  border-radius: 12rpx;
  text-align: center;
}
.fh-cell.primary {
  background: rgba(212, 175, 55, 0.12);
  border: 1rpx solid var(--color-liu, #d4af37);
}
.fc-l {
  display: block;
  font-size: 22rpx;
  color: var(--color-bai-3, #6b6655);
}
.fc-v {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.fc-s {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-top: 4rpx;
}
.fh-score {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 0;
}
.fs-l {
  font-size: 22rpx;
  color: var(--color-bai-3, #6b6655);
  width: 80rpx;
}
.fs-bar {
  flex: 1;
  height: 12rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6rpx;
  overflow: hidden;
}
.fs-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.6s;
}
.fs-v {
  font-size: 24rpx;
  font-weight: bold;
  font-family: serif;
}
.fh-best {
  display: block;
  padding-top: 8rpx;
  font-size: 24rpx;
  color: var(--color-liu, #d4af37);
  text-align: center;
  font-family: serif;
}
.flc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.flc-svg {
  width: 100%;
  max-width: 480rpx;
  height: auto;
}
.flc-men,
.flc-adv {
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
.men-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 0;
  border-bottom: 1rpx dashed rgba(212, 175, 55, 0.15);
}
.men-row:last-child {
  border-bottom: none;
}
.mn-l {
  width: 100rpx;
  font-size: 24rpx;
  color: var(--color-liu, #d4af37);
  font-weight: bold;
}
.mn-list {
  flex: 1;
  display: flex;
  gap: 6rpx;
  flex-wrap: wrap;
}
.mn-tag {
  padding: 4rpx 12rpx;
  background: rgba(47, 125, 79, 0.15);
  border: 1rpx solid var(--color-ji, #2f7d4f);
  border-radius: 12rpx;
  font-size: 22rpx;
  color: var(--color-ji, #2f7d4f);
  font-family: serif;
}
.adv-line {
  display: block;
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
  line-height: 1.6;
  padding: 4rpx 0;
}
</style>
