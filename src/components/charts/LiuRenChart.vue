<template>
  <view class="lrc">
    <view class="lrc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="lrc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(212,175,55,0.18)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.9)" />
          </radialGradient>
          <filter :id="uid('g')">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#{{ uid('bg') }})" />

        <!-- 6 神将环（围绕中心） -->
        <g
          v-for="(s, i) in sixShen"
          :key="s.key"
          class="lr-shen"
          :class="{ active: s.key === result.shen.key }"
        >
          <circle
            :cx="s.x"
            :cy="s.y"
            :r="sr"
            :fill="s.fill"
            :stroke="s.stroke"
            stroke-width="1.5"
            :filter="`url(#${uid('g')})`"
          />
          <text
            :x="s.x"
            :y="s.y - 2"
            text-anchor="middle"
            font-size="16"
            font-weight="bold"
            :fill="s.textColor"
            font-family="serif"
          >
            {{ s.name }}
          </text>
          <text
            :x="s.x"
            :y="s.y + 15"
            text-anchor="middle"
            font-size="10"
            :fill="s.textColor"
            font-family="serif"
            opacity="0.7"
          >
            {{ s.wuxing }}
          </text>
        </g>

        <!-- 中心：当前神 -->
        <circle
          :cx="cx"
          :cy="cy"
          r="60"
          :fill="
            result.shen.key === '大安' || result.shen.key === '速喜' || result.shen.key === '小吉'
              ? 'rgba(212,175,55,0.2)'
              : 'rgba(200,48,42,0.15)'
          "
          stroke="#D4AF37"
          stroke-width="1.5"
          :filter="`url(#${uid('g')})`"
        />
        <text
          :x="cx"
          :y="cy - 10"
          text-anchor="middle"
          font-size="22"
          font-weight="bold"
          fill="#D4AF37"
          font-family="serif"
        >
          {{ result.shen.name }}
        </text>
        <text
          :x="cx"
          :y="cy + 15"
          text-anchor="middle"
          font-size="12"
          fill="#B8B2A0"
          font-family="serif"
        >
          {{ result.total }}
        </text>
        <text
          :x="cx"
          :y="cy + 32"
          text-anchor="middle"
          font-size="10"
          fill="#6B6655"
          font-family="serif"
        >
          {{ result.questionLabel }}
        </text>
      </svg>
    </view>

    <!-- 详情 -->
    <view class="lrc-detail card-mystic">
      <view class="d-head">
        <text class="dh-name">{{ result.shen.name }}</text>
        <text class="dh-bp">{{ result.shen.bodyPart }}</text>
      </view>
      <text class="d-meaning">{{ result.shen.meaning }}</text>
      <view class="d-row">
        <text class="dr-l">问事：</text><text class="dr-v">{{ result.questionLabel }}</text>
      </view>
      <view class="d-row d-row-main">
        <text class="dr-l">断：</text><text class="dr-v dr-v-main">{{ result.advice }}</text>
      </view>
      <view class="d-score">
        <text class="ds-l">总评：</text>
        <view class="ds-bar">
          <view
            class="ds-fill"
            :style="{
              width: result.shen.totalScore + '%',
              background:
                result.shen.totalScore >= 70
                  ? '#D4AF37'
                  : result.shen.totalScore >= 40
                    ? '#B8B2A0'
                    : '#C8302A',
            }"
          />
        </view>
        <text class="ds-val">{{ result.shen.totalScore }}</text>
      </view>
    </view>

    <!-- 6 神对照 -->
    <view class="lrc-all card-mystic">
      <text class="b-title title-mystic">六 神 全 览</text>
      <view class="all-grid">
        <view
          v-for="s in ALL_LIU_SHEN"
          :key="s.key"
          class="ag-cell"
          :class="[
            'nature-' + (s.totalScore >= 70 ? 'ji' : s.totalScore >= 40 ? 'zhong' : 'xiong'),
            { active: s.key === result.shen.key },
          ]"
        >
          <text class="agc-name">{{ s.name }}</text>
          <text class="agc-wx">{{ s.wuxing }}行</text>
          <text class="agc-bp">{{ s.bodyPart }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ALL_LIU_SHEN, type LiuShen } from '@/utils/xiaoliuren'
import { polar, uid } from '@/utils/chart-utils'

interface Result {
  question: string
  questionLabel: string
  shen: LiuShen
  total: number
  shenIndex: number
  threeRemainder: number
  advice: string
}
const props = defineProps<{ result: Result }>()

const size = 480
const cx = size / 2
const cy = size / 2
const r = 180
const sr = 56

const COLOR_MAP: Record<string, { fill: string; stroke: string; text: string }> = {
  大安: { fill: 'rgba(47,125,79,0.25)', stroke: '#2F7D4F', text: '#2F7D4F' },
  留连: { fill: 'rgba(168,124,79,0.25)', stroke: '#A87C4F', text: '#A87C4F' },
  速喜: { fill: 'rgba(200,48,42,0.25)', stroke: '#C8302A', text: '#C8302A' },
  赤口: { fill: 'rgba(232,228,216,0.15)', stroke: '#E8E4D8', text: '#E8E4D8' },
  小吉: { fill: 'rgba(47,125,79,0.2)', stroke: '#2F7D4F', text: '#2F7D4F' },
  空亡: { fill: 'rgba(27,58,92,0.25)', stroke: '#1B3A5C', text: '#1B3A5C' },
}

const sixShen = computed(() =>
  ALL_LIU_SHEN.map((s, i) => {
    // 大安起于 12 点位置，顺时针
    const angle = -90 + i * 60
    const p = polar(cx, cy, r, angle)
    const c = COLOR_MAP[s.key]
    return {
      ...s,
      x: p.x,
      y: p.y,
      fill: c.fill,
      stroke: c.stroke,
      textColor: c.text,
    }
  }),
)
</script>

<style scoped>
.lrc {
  padding: 8rpx;
}
.lrc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.lrc-svg {
  width: 100%;
  max-width: 480rpx;
  height: auto;
}
.lr-shen {
  transition: all 0.3s;
  cursor: pointer;
}
.lr-shen.active {
  transform: scale(1.1);
  transform-origin: center;
}
.lrc-detail,
.lrc-all {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
}
.d-head {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  padding-bottom: 8rpx;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}
.dh-name {
  font-size: 40rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
.dh-bp {
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.d-meaning {
  display: block;
  padding: 12rpx 0;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--color-bai-2, #b8b2a0);
}
.d-row {
  display: flex;
  padding: 4rpx 0;
  font-size: 24rpx;
}
.d-row-main {
  padding: 12rpx;
  background: rgba(212, 175, 55, 0.08);
  border-radius: 8rpx;
  margin-top: 8rpx;
}
.dr-l {
  color: var(--color-bai-3, #6b6655);
  width: 100rpx;
}
.dr-v {
  color: var(--color-bai, #f5f1e8);
  flex: 1;
}
.dr-v-main {
  font-weight: bold;
  font-size: 28rpx;
  color: var(--color-liu, #d4af37);
}
.d-score {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx dashed rgba(212, 175, 55, 0.2);
}
.ds-l {
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
  width: 80rpx;
}
.ds-bar {
  flex: 1;
  height: 12rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6rpx;
  overflow: hidden;
}
.ds-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.6s;
}
.ds-val {
  width: 60rpx;
  text-align: right;
  font-size: 26rpx;
  font-weight: bold;
  font-family: serif;
}
.b-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  margin-bottom: 12rpx;
  font-family: serif;
}
.all-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8rpx;
}
.ag-cell {
  padding: 10rpx 8rpx;
  background: rgba(10, 10, 18, 0.4);
  border-radius: 8rpx;
  text-align: center;
  border: 1rpx solid transparent;
}
.ag-cell.nature-ji {
  border-color: var(--color-liu, #d4af37);
  background: rgba(212, 175, 55, 0.08);
}
.ag-cell.nature-xiong {
  border-color: var(--color-zhu, #c8302a);
  background: rgba(200, 48, 42, 0.08);
}
.ag-cell.active {
  transform: scale(1.05);
  border-width: 2rpx;
}
.agc-name {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.agc-wx {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.agc-bp {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-3, #6b6655);
  margin-top: 2rpx;
}
</style>
