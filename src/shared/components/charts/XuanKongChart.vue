<template>
  <view class="xkc">
    <!-- 盘选择 -->
    <view class="xkc-bar">
      <view class="pbtn" :class="{ active: pan === 'yun' }" @click="pan = 'yun'">运 盘</view>
      <view class="pbtn" :class="{ active: pan === 'liu' }" @click="pan = 'liu'">流 年 盘</view>
      <view class="pbtn" :class="{ active: pan === 'over' }" @click="pan = 'over'">
        流 年 叠 运
      </view>
    </view>

    <view class="xkc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="xkc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(212,175,55,0.2)" />
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

        <!-- 九宫格 -->
        <g
          v-for="(c, i) in cells"
          :key="i"
          class="xkc-cell"
          :class="{ active: selectedPos === c.pos, ['lvl-' + c.level]: true }"
          @click="selectedPos = c.pos"
        >
          <rect
            :x="c.x"
            :y="c.y"
            :width="cellSize"
            :height="cellSize"
            :fill="c.fill"
            :stroke="c.stroke"
            stroke-width="1"
            :filter="c.pos === 5 ? '' : `url(#${uid('g')})`"
          />
          <!-- 宫位方位名 -->
          <text :x="c.x + 8" :y="c.y + 16" font-size="11" fill="#B8B2A0" font-family="serif">
            {{ c.dir }}
          </text>
          <!-- 数字（运盘） -->
          <text
            :x="c.x + cellSize - 8"
            :y="c.y + 16"
            text-anchor="end"
            font-size="11"
            fill="#6B6655"
            font-family="serif"
          >
            宫{{ c.pos }}
          </text>
          <!-- 主体数字 -->
          <text
            :x="c.x + cellSize / 2"
            :y="c.y + cellSize / 2 - 4"
            text-anchor="middle"
            font-size="36"
            font-weight="bold"
            :fill="c.color"
            font-family="serif"
          >
            {{ c.mainNum }}
          </text>
          <text
            :x="c.x + cellSize / 2"
            :y="c.y + cellSize / 2 + 18"
            text-anchor="middle"
            font-size="11"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ c.starName }}
          </text>
          <!-- 流年数字 -->
          <text
            v-if="pan !== 'yun'"
            :x="c.x + cellSize / 2"
            :y="c.y + cellSize / 2 + 36"
            text-anchor="middle"
            font-size="13"
            :fill="c.liuColor"
            font-weight="bold"
            font-family="serif"
          >
            流{{ c.liuNum }}
          </text>
          <!-- 吉凶 -->
          <circle
            v-if="c.level === '大吉'"
            :cx="c.x + cellSize - 10"
            :cy="c.y + cellSize - 10"
            r="4"
            fill="#D4AF37"
          />
          <circle
            v-else-if="c.level === '大凶'"
            :cx="c.x + cellSize - 10"
            :cy="c.y + cellSize - 10"
            r="4"
            fill="#C8302A"
          />
        </g>
      </svg>
    </view>

    <!-- 选中详情 -->
    <view v-if="selectedCell" class="xkc-detail card-mystic">
      <view class="d-head">
        <text class="dh-pos">{{ selectedCell.dir }}（{{ selectedCell.starName }}）</text>
        <text class="dh-lvl" :style="{ color: levelColor(selectedCell.level) }">
          {{ selectedCell.level }}
        </text>
      </view>
      <text class="d-advice">{{ selectedCell.advice }}</text>
      <view class="d-meta">
        <text class="dm-line">五行：{{ selectedCell.wx }}</text>
        <text class="dm-line">含义：{{ selectedCell.meaning }}</text>
      </view>
    </view>

    <!-- 八方位吉凶 -->
    <view class="xkc-dir card-mystic">
      <text class="b-title title-mystic">八 方 位 吉 凶</text>
      <view class="dir-grid">
        <view v-for="d in directionList" :key="d.dir" class="dir-cell" :class="['lvl-' + d.level]">
          <text class="dc-dir">{{ d.dir }}</text>
          <text class="dc-star" :style="{ color: levelColor(d.level) }">{{ d.starName }}</text>
          <text class="dc-lvl">{{ d.level }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  GONG_NAMES_9,
  GONG_DIR,
  type GONG_NUM,
  type XuanKongResult,
} from '@modules/zhanbu/logic/xuankong'
import { uid, levelColor } from '@modules/guanxiang/logic/chart-utils'

const props = defineProps<{ result: XuanKongResult }>()

const size = 720
const cellSize = size / 3
const pan = ref<'yun' | 'liu' | 'over'>('over')
const selectedPos = ref(5)

const cells = computed(() => {
  const posMap: Array<{ pos: number; col: number; row: number; dir: string }> = [
    { pos: 7, col: 0, row: 0, dir: '正西' },
    { pos: 8, col: 1, row: 0, dir: '东北' },
    { pos: 9, col: 2, row: 0, dir: '正南' },
    { pos: 6, col: 0, row: 1, dir: '西北' },
    { pos: 5, col: 1, row: 1, dir: '中央' },
    { pos: 1, col: 2, row: 1, dir: '正北' },
    { pos: 4, col: 0, row: 2, dir: '东南' },
    { pos: 3, col: 1, row: 2, dir: '正东' },
    { pos: 2, col: 2, row: 2, dir: '西南' },
  ]
  return posMap.map((c) => {
    const yunNum = props.result.yunPan[c.pos]! as GONG_NUM
    const liuNum = props.result.liuNianPan[c.pos]! as GONG_NUM
    const dir = GONG_DIR[yunNum]!
    const meta = GONG_NAMES_9[yunNum - 1]!
    const level = getLevel(yunNum)
    const liuLevel = getLevel(liuNum)
    const isCenter = c.pos === 5
    const x = c.col * cellSize
    const y = c.row * cellSize
    return {
      x,
      y,
      pos: c.pos,
      mainNum: pan.value === 'yun' || isCenter ? yunNum : liuNum,
      liuNum: pan.value === 'over' && !isCenter ? liuNum : 0,
      starName: meta,
      dir: c.dir,
      wx: dir.wx,
      meaning: dir.meaning,
      level:
        pan.value === 'yun'
          ? level
          : isCenter
            ? level
            : pan.value === 'liu'
              ? liuLevel
              : Math.max(score(level), score(liuLevel)) >= 2
                ? '大吉'
                : '大凶',
      advice: getAdvice(c.pos, pan.value === 'yun' ? yunNum : liuNum, level),
      color: levelColor(level),
      liuColor: levelColor(liuLevel),
      fill: isCenter
        ? 'rgba(212,175,55,0.15)'
        : pan.value === 'over'
          ? 'rgba(91,58,142,0.12)'
          : 'rgba(20,20,28,0.4)',
      stroke: isCenter ? '#D4AF37' : 'rgba(212,175,55,0.3)',
    }
  })
})

const getLevel = (n: GONG_NUM): '大吉' | '吉' | '平' | '凶' | '大凶' => {
  if (n === 1 || n === 8 || n === 9) return '大吉'
  if (n === 4 || n === 6) return '吉'
  if (n === 3 || n === 7) return '平'
  return '大凶'
}

const score = (lvl: string) => (lvl === '大吉' ? 2 : lvl === '吉' ? 1 : lvl === '平' ? 0 : -1)

const getAdvice = (_pos: number, num: GONG_NUM, level: string): string => {
  const dirName = GONG_DIR[num]?.dir ?? ''
  const starName = GONG_NAMES_9[num - 1]!
  if (level === '大吉') return `${dirName}方见${starName}大吉 · 可动土开门 · 宜求财谋职`
  if (level === '吉') return `${dirName}方见${starName}为吉 · 可布置 · 宜静守`
  if (level === '平') return `${dirName}方见${starName}平和 · 不宜大动`
  return `${dirName}方见${starName}大凶 · 需安符镇煞`
}

const selectedCell = computed(() => cells.value.find((c) => c.pos === selectedPos.value))

const directionList = computed(() => props.result.directions)
</script>

<style scoped>
.xkc {
  padding: 8rpx;
}
.xkc-bar {
  display: flex;
  gap: 8rpx;
  margin-bottom: 12rpx;
}
.pbtn {
  flex: 1;
  padding: 10rpx;
  text-align: center;
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: 8rpx;
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.pbtn.active {
  background: rgba(212, 175, 55, 0.15);
  border-color: var(--color-liu, #d4af37);
  color: var(--color-liu, #d4af37);
}
.xkc-canvas {
  display: flex;
  justify-content: center;
  padding: 8rpx;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.xkc-svg {
  width: 100%;
  max-width: 720rpx;
  height: auto;
}
.xkc-cell {
  cursor: pointer;
  transition: all 0.2s;
}
.xkc-cell:hover rect {
  filter: brightness(1.3);
}
.xkc-cell.active rect {
  stroke: #d4af37 !important;
  stroke-width: 2 !important;
}
.xkc-detail {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
}
.d-head {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  padding-bottom: 8rpx;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}
.dh-pos {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.dh-lvl {
  font-size: 26rpx;
  font-weight: bold;
}
.d-advice {
  display: block;
  padding: 12rpx 0;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--color-bai, #f5f1e8);
}
.d-meta {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  padding-top: 8rpx;
  border-top: 1rpx dashed rgba(212, 175, 55, 0.2);
}
.dm-line {
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.xkc-dir {
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
.dir-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8rpx;
}
.dir-cell {
  padding: 10rpx 8rpx;
  background: rgba(10, 10, 18, 0.4);
  border-radius: 6rpx;
  text-align: center;
  border: 1rpx solid transparent;
}
.dir-cell.lvl-大吉 {
  border-color: var(--color-liu, #d4af37);
  background: rgba(212, 175, 55, 0.1);
}
.dir-cell.lvl-大凶 {
  border-color: var(--color-zhu, #c8302a);
  background: rgba(200, 48, 42, 0.1);
}
.dc-dir {
  display: block;
  font-size: 22rpx;
  color: var(--color-bai, #f5f1e8);
}
.dc-star {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
  font-family: serif;
  margin: 2rpx 0;
}
.dc-lvl {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-2, #b8b2a0);
}
</style>
