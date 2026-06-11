<!--
  玄枢 MISTVERSE · 铁板神数可视化
  - 母数 + 本卦大字号
  - 6 卦 6 宫 5 边形（中央+ 6 卫星）
  - 10 年流年柱状
-->
<template>
  <view class="tbc">
    <view class="tbc-hero card-mystic">
      <text class="th-mushu">母数 {{ result.muShu }}</text>
      <text class="th-gua">{{ result.benGua.name }} · {{ result.benGua.trigram }}</text>
      <text class="th-poem">{{ result.benGua.poem }}</text>
    </view>

    <view class="tbc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="tbc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(91,58,142,0.18)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.9)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#{{ uid('bg') }})" />

        <!-- 中央本卦 -->
        <circle :cx="cx" :cy="cy" r="55" :fill="THEME.liu" stroke="#0A0A12" stroke-width="2" />
        <text
          :x="cx"
          :y="cy - 8"
          text-anchor="middle"
          font-size="14"
          fill="#0A0A12"
          font-family="serif"
          font-weight="bold"
        >
          本 卦
        </text>
        <text
          :x="cx"
          :y="cy + 12"
          text-anchor="middle"
          font-size="13"
          fill="#0A0A12"
          font-family="serif"
        >
          {{ result.benGua.name }}
        </text>
        <text
          :x="cx"
          :y="cy + 28"
          text-anchor="middle"
          font-size="18"
          fill="#0A0A12"
          font-family="serif"
          font-weight="bold"
        >
          {{ result.benGua.trigram }}
        </text>

        <!-- 6 卫星（6 卦六亲） -->
        <g v-for="(q, i) in satPositions" :key="i">
          <line
            :x1="cx"
            :y1="cy"
            :x2="q.x"
            :y2="q.y"
            :stroke="q.color"
            stroke-width="1"
            stroke-dasharray="2 3"
            opacity="0.5"
          />
          <circle
            :cx="q.x"
            :cy="q.y"
            :r="q.r"
            :fill="q.color"
            opacity="0.18"
            :stroke="q.color"
            stroke-width="1.5"
          />
          <text
            :x="q.x"
            :y="q.y - 12"
            text-anchor="middle"
            font-size="11"
            :fill="q.color"
            font-family="serif"
            font-weight="bold"
          >
            {{ q.label }}
          </text>
          <text
            :x="q.x"
            :y="q.y + 4"
            text-anchor="middle"
            font-size="10"
            fill="#F5F1E8"
            font-family="serif"
          >
            {{ q.gua }}
          </text>
          <text
            :x="q.x"
            :y="q.y + 17"
            text-anchor="middle"
            font-size="9"
            fill="#B8B2A0"
            font-family="serif"
            opacity="0.7"
          >
            数 {{ q.num }}
          </text>
        </g>
      </svg>
    </view>

    <view class="tbc-card card-mystic">
      <text class="b-title title-mystic">六 亲 各 卦</text>
      <view v-for="q in result.liuQin" :key="q.label" class="lq-row">
        <text class="lq-l">{{ q.label }}</text>
        <text class="lq-num">{{ q.num }}</text>
        <text class="lq-gua">{{ q.gua.name }}</text>
        <text class="lq-tg">{{ q.gua.trigram }}</text>
      </view>
    </view>

    <view class="tbc-card card-mystic">
      <text class="b-title title-mystic">本 卦 详 解</text>
      <view class="d-row">
        <text class="dr-l">事业</text><text class="dr-v">{{ result.benGua.career }}</text>
      </view>
      <view class="d-row">
        <text class="dr-l">财运</text><text class="dr-v">{{ result.benGua.wealth }}</text>
      </view>
      <view class="d-row">
        <text class="dr-l">六亲</text><text class="dr-v">{{ result.benGua.relationship }}</text>
      </view>
      <view class="d-row">
        <text class="dr-l">健康</text><text class="dr-v">{{ result.benGua.health }}</text>
      </view>
    </view>

    <view class="tbc-year card-mystic">
      <text class="b-title title-mystic">十 年 流 年</text>
      <view class="yr-grid">
        <view
          v-for="y in result.yearly"
          :key="y.year"
          class="yr-cell"
          :class="
            'lv-' +
            (y.level === '大吉' || y.level === '吉' ? 'ji' : y.level === '平' ? 'zhong' : 'xiong')
          "
        >
          <text class="yr-age">{{ y.age }}岁</text>
          <text class="yr-yr">{{ y.year }}</text>
          <text class="yr-gua">{{ y.gua.name }}</text>
          <text class="yr-lv" :style="{ color: ylColor(y.level) }">{{ y.level }}</text>
        </view>
      </view>
    </view>

    <view class="tbc-sum card-mystic">
      <text class="ts-text">{{ result.summary }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { polar, uid, THEME, levelColor } from '@guanxiang/logic/chart-utils'
import type { TiebanResult } from '@mingli/logic/tieban'

const props = defineProps<{ result: TiebanResult }>()

const size = 480
const cx = size / 2
const cy = size / 2
const satR = 175

const lqColor = ['#D4AF37', '#E8E4D8', '#C8302A', '#2F7D4F', '#5B3A8E', '#1B3A5C']

const satPositions = computed(() => {
  return props.result.liuQin.map((q, i) => {
    const angle = -90 + i * 60
    const p = polar(cx, cy, satR, angle)
    const score = q.gua.score
    const r = 22 + (score / 100) * 18
    return {
      label: q.label,
      gua: q.gua.name,
      num: q.num,
      x: p.x,
      y: p.y,
      r,
      color: lqColor[i % lqColor.length],
    }
  })
})

function ylColor(lv: string): string {
  return levelColor(
    lv === '大吉' ? '上上' : lv === '吉' ? '上' : lv === '平' ? '中' : lv === '凶' ? '下' : '下下',
  )
}
</script>

<style scoped>
.tbc {
  padding: 8rpx;
}
.tbc-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28rpx 24rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, rgba(91, 58, 142, 0.12), rgba(20, 20, 28, 0.5));
  border: 2rpx solid rgba(91, 58, 142, 0.3);
  margin-bottom: 16rpx;
}
.th-mushu {
  font-size: 24rpx;
  color: var(--color-bai-3, #6b6655);
  letter-spacing: 4rpx;
}
.th-gua {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--color-zi, #5b3a8e);
  font-family: serif;
  margin: 8rpx 0;
}
.th-poem {
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
  text-align: center;
}
.tbc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.tbc-svg {
  width: 100%;
  max-width: 480rpx;
  height: auto;
}
.tbc-card,
.tbc-year,
.tbc-sum {
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
.lq-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 6rpx 0;
  border-bottom: 1rpx dashed rgba(91, 58, 142, 0.15);
}
.lq-row:last-child {
  border-bottom: none;
}
.lq-l {
  width: 80rpx;
  font-size: 24rpx;
  color: var(--color-liu, #d4af37);
  font-weight: bold;
  font-family: serif;
}
.lq-num {
  width: 60rpx;
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
  text-align: center;
}
.lq-gua {
  flex: 1;
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
}
.lq-tg {
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
  font-family: serif;
}
.d-row {
  display: flex;
  padding: 6rpx 0;
  border-bottom: 1rpx dashed rgba(212, 175, 55, 0.15);
}
.d-row:last-child {
  border-bottom: none;
}
.dr-l {
  width: 100rpx;
  font-size: 24rpx;
  color: var(--color-bai-3, #6b6655);
}
.dr-v {
  flex: 1;
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
  line-height: 1.5;
}
.yr-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8rpx;
}
.yr-cell {
  padding: 8rpx;
  background: rgba(10, 10, 18, 0.4);
  border-radius: 8rpx;
  text-align: center;
  border: 1rpx solid transparent;
}
.yr-cell.lv-ji {
  border-color: var(--color-liu, #d4af37);
  background: rgba(212, 175, 55, 0.08);
}
.yr-cell.lv-xiong {
  border-color: var(--color-zhu, #c8302a);
  background: rgba(200, 48, 42, 0.08);
}
.yr-age {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-3, #6b6655);
}
.yr-yr {
  display: block;
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.yr-gua {
  display: block;
  font-size: 22rpx;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
  margin: 4rpx 0;
}
.yr-lv {
  display: block;
  font-size: 20rpx;
  font-weight: bold;
}
.ts-text {
  display: block;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--color-bai, #f5f1e8);
  text-align: center;
  padding: 12rpx 0;
}
</style>
