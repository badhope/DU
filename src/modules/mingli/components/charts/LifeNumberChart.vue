<template>
  <view class="lnc">
    <view class="lnc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="lnc-svg">
        <defs>
          <filter :id="uid('g')">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- 背景圆 -->
        <circle
          :cx="cx"
          :cy="cy"
          :r="r"
          fill="none"
          stroke="rgba(212,175,55,0.18)"
          stroke-width="0.5"
        />
        <circle
          :cx="cx"
          :cy="cy"
          :r="r * 0.7"
          fill="none"
          stroke="rgba(212,175,55,0.12)"
          stroke-width="0.5"
        />
        <circle
          :cx="cx"
          :cy="cy"
          :r="r * 0.4"
          fill="none"
          stroke="rgba(212,175,55,0.12)"
          stroke-width="0.5"
        />

        <!-- 3x3 宫格数字（毕达哥拉斯方阵） -->
        <text
          v-for="(n, i) in magicSquare"
          :key="'m' + i"
          :x="cellX(i)"
          :y="cellY(i) + 8"
          text-anchor="middle"
          font-size="32"
          :fill="magicColor(n, i)"
          font-weight="bold"
          font-family="serif"
          :filter="`url(#${uid('g')})`"
        >
          {{ n }}
        </text>

        <!-- 9 数节点（用户主命高亮） -->
        <g
          v-for="(n, i) in positions"
          :key="'n' + i"
          :class="['num-node', { active: n.isPrimary }]"
          @click="selectNum(n.num)"
        >
          <circle
            :cx="n.x"
            :cy="n.y"
            :r="n.isPrimary ? 32 : 22"
            :fill="n.isPrimary ? metaOf(n.num).color : 'rgba(20,20,28,0.85)'"
            :stroke="metaOf(n.num).color"
            stroke-width="2"
          />
          <text
            :x="n.x"
            :y="n.y + 7"
            text-anchor="middle"
            font-size="22"
            font-weight="bold"
            :fill="n.isPrimary ? '#0A0A12' : metaOf(n.num).color"
            font-family="serif"
          >
            {{ n.num }}
          </text>
          <text
            :x="n.x"
            :y="n.y + 48"
            text-anchor="middle"
            font-size="11"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ metaOf(n.num).name }}
          </text>
        </g>

        <!-- 中心主命 -->
        <circle :cx="cx" :cy="cy" r="36" :fill="primaryMeta.color" :filter="`url(#${uid('g')})`" />
        <text
          :x="cx"
          :y="cy - 3"
          text-anchor="middle"
          font-size="22"
          font-weight="bold"
          fill="#0A0A12"
          font-family="serif"
        >
          {{ primary.lifePath }}
        </text>
        <text
          :x="cx"
          :y="cy + 14"
          text-anchor="middle"
          font-size="10"
          fill="#0A0A12"
          font-family="serif"
        >
          主命
        </text>
      </svg>
    </view>

    <!-- 四数矩阵 -->
    <view class="lnc-quad">
      <view
        v-for="(q, i) in quadList"
        :key="i"
        class="q-card"
        :class="{ active: active === q.num }"
        @click="active = q.num"
      >
        <text class="q-label">{{ q.label }}</text>
        <text class="q-num" :style="{ color: metaOf(q.num).color }">{{ q.num }}</text>
        <text class="q-name">{{ metaOf(q.num).name }}</text>
      </view>
    </view>

    <!-- 选中详情 -->
    <view v-if="selectedMeta" class="lnc-detail card-mystic">
      <view class="detail-head">
        <text class="dh-num" :style="{ color: selectedMeta.color }">{{ selectedMeta.num }}</text>
        <view>
          <text class="dh-name">{{ selectedMeta.name }}</text>
          <text class="dh-glyph">
            {{ selectedMeta.glyph }} · {{ selectedMeta.element }} · 守护
            {{ selectedMeta.planet }}
          </text>
        </view>
      </view>
      <view class="detail-grid">
        <view class="dg-cell">
          <text class="dg-l">德性</text><text class="dg-v">{{ selectedMeta.virtue }}</text>
        </view>
        <view class="dg-cell">
          <text class="dg-l">缺陷</text><text class="dg-v">{{ selectedMeta.flaw }}</text>
        </view>
        <view class="dg-cell">
          <text class="dg-l">事业</text><text class="dg-v">{{ selectedMeta.career }}</text>
        </view>
        <view class="dg-cell">
          <text class="dg-l">婚恋</text><text class="dg-v">{{ selectedMeta.relationship }}</text>
        </view>
        <view class="dg-cell">
          <text class="dg-l">健康</text><text class="dg-v">{{ selectedMeta.health }}</text>
        </view>
        <view class="dg-cell">
          <text class="dg-l">幸运</text
          ><text class="dg-v"> {{ selectedMeta.luckyColor }} · {{ selectedMeta.luckyDay }} </text>
        </view>
      </view>
      <text class="detail-desc">{{ selectedMeta.description }}</text>
    </view>

    <!-- 9 年周期 -->
    <view class="lnc-cycle">
      <text class="cycle-title title-mystic">九 年 周 期</text>
      <view class="cycle-row">
        <view
          v-for="(c, i) in cycle"
          :key="i"
          class="cycle-cell"
          :class="['phase-' + c.cycle, { current: c.year === currentYear }]"
        >
          <text class="cy-num">{{ c.year }}</text>
          <text class="cy-phase">{{ c.cycle }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NUMBER_META, type LifeNumberResult } from '@/modules/mingli/logic/life'
import { polar, uid } from '@/utils/chart-utils'

const props = defineProps<{ result: LifeNumberResult }>()

const size = 360
const cx = size / 2
const cy = size / 2
const r = 165

// 毕达哥拉斯方阵
const magicSquare = [4, 9, 2, 3, 5, 7, 8, 1, 6]
const magicColor = (n: number, _i: number) => {
  const meta = NUMBER_META[n] || NUMBER_META[1]
  return meta.color
}

const cellX = (i: number) => 30 + (i % 3) * 100 + 50
const cellY = (i: number) => 30 + Math.floor(i / 3) * 100 + 50

// 1-9 数在九宫位置
const positions = computed(() => {
  return Array.from({ length: 9 }, (_, i) => {
    const num = i + 1
    const angle = (360 / 9) * i - 90
    const p = polar(cx, cy, r * 0.85, angle)
    return {
      num,
      x: p.x,
      y: p.y,
      isPrimary: num === (props.result.number.lifePath > 9 ? 11 : props.result.number.lifePath),
    }
  })
})

const primary = computed(() => props.result.number)
const primaryMeta = computed(() => props.result.primary)

const active = ref(props.result.number.lifePath > 9 ? 11 : props.result.number.lifePath)
const selectNum = (n: number) => {
  active.value = n
}

const metaOf = (n: number) => NUMBER_META[n] || NUMBER_META[1]
const selectedMeta = computed(() => metaOf(active.value))

const quadList = computed(() => [
  { label: '生命数', num: props.result.number.lifePath },
  { label: '表现数', num: props.result.number.expression },
  { label: '灵魂数', num: props.result.number.soulUrge },
  { label: '命运数', num: props.result.number.destiny },
])

const cycle = computed(() => props.result.cycle)
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.lnc {
  padding: 8rpx;
}
.lnc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.lnc-svg {
  width: 100%;
  max-width: 600rpx;
  height: auto;
}
.num-node {
  cursor: pointer;
  transition: transform 0.2s;
}
.num-node:hover {
  transform: scale(1.1);
}
.num-node.active circle {
  stroke-width: 3;
}
.lnc-quad {
  margin-top: 24rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}
.q-card {
  background: rgba(20, 20, 28, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: 12rpx;
  padding: 16rpx 8rpx;
  text-align: center;
  transition: all 0.2s;
}
.q-card.active {
  border-color: var(--color-liu, #d4af37);
  background: rgba(212, 175, 55, 0.1);
}
.q-label {
  display: block;
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.q-num {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  font-family: serif;
  line-height: 1.2;
}
.q-name {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-3, #6b6655);
}
.lnc-detail {
  margin-top: 16rpx;
  padding: 24rpx;
  border-radius: 16rpx;
}
.detail-head {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}
.dh-num {
  font-size: 80rpx;
  font-weight: bold;
  line-height: 1;
  font-family: serif;
}
.dh-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
}
.dh-glyph {
  display: block;
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-top: 4rpx;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx 24rpx;
  padding: 16rpx 0;
}
.dg-cell {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.dg-l {
  font-size: 22rpx;
  color: var(--color-bai-3, #6b6655);
}
.dg-v {
  font-size: 26rpx;
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
.lnc-cycle {
  margin-top: 24rpx;
}
.cycle-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  margin-bottom: 12rpx;
  font-family: serif;
}
.cycle-row {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 6rpx;
}
.cycle-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx 4rpx;
  background: rgba(20, 20, 28, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: 8rpx;
}
.cycle-cell.current {
  border-color: var(--color-liu, #d4af37);
  background: rgba(212, 175, 55, 0.15);
  transform: scale(1.08);
}
.cycle-cell.phase-播种 {
  border-top: 3rpx solid #4fae6f;
}
.cycle-cell.phase-生长 {
  border-top: 3rpx solid #d4af37;
}
.cycle-cell.phase-收获 {
  border-top: 3rpx solid #c8302a;
}
.cycle-cell.phase-完成 {
  border-top: 3rpx solid #5b3a8e;
}
.cy-num {
  font-size: 20rpx;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.cy-phase {
  font-size: 18rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-top: 2rpx;
}
</style>
