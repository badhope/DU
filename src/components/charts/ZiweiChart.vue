<template>
  <view class="zwc">
    <!-- 控制条 -->
    <view class="zwc-bar">
      <view class="zbtn" :class="{ active: showSiHua }" @click="showSiHua = !showSiHua">
        <text>{{ showSiHua ? '✓ ' : '' }}四化飞星</text>
      </view>
      <view class="zbtn" :class="{ active: showLiuNian }" @click="showLiuNian = !showLiuNian">
        <text>{{ showLiuNian ? '✓ ' : '' }}流年高亮</text>
      </view>
      <view class="zbtn" :class="{ active: !!selectedGong }" @click="selectedGong = null">
        <text>{{ selectedGong ? '取消' : '宫位详批' }} </text>
      </view>
    </view>

    <view class="zwc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="zwc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="rgba(91,58,142,0.25)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.9)" />
          </radialGradient>
          <filter :id="uid('glow')">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter :id="uid('sglow')">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- 背景 -->
        <rect width="100%" height="100%" fill="url(#{{ uid('bg') }})" />

        <!-- 12 宫方阵：4×4 布局（4 角 = 宫位，中间 2×2 = 命宫详情） -->
        <g
          v-for="(cell, i) in gridCells"
          :key="i"
          class="cell"
          :class="{ selected: selectedGong === cell.gongIdx }"
          @click="onCellClick(cell)"
        >
          <!-- 宫底 -->
          <rect
            :x="cell.x"
            :y="cell.y"
            :width="cell.w"
            :height="cell.h"
            :fill="cell.gongIdx === 0 ? 'rgba(212,175,55,0.18)' : 'rgba(20,20,28,0.5)'"
            :stroke="cell.gongIdx === 0 ? '#D4AF37' : 'rgba(212,175,55,0.3)'"
            :stroke-width="cell.gongIdx === 0 ? 1.5 : 0.5"
            :filter="cell.gongIdx === 0 ? `url(#${uid('sglow')})` : ''"
          />

          <!-- 宫名 -->
          <text
            :x="cell.x + 4"
            :y="cell.y + 14"
            font-size="11"
            font-weight="bold"
            :fill="cell.gongIdx === 0 ? '#D4AF37' : '#B8B2A0'"
            font-family="serif"
          >
            {{ cell.gongName }}
          </text>
          <!-- 地支 -->
          <text
            :x="cell.x + cell.w - 4"
            :y="cell.y + 14"
            text-anchor="end"
            font-size="11"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ cell.zhi }}
          </text>

          <!-- 主星 -->
          <g v-for="(star, j) in cell.stars" :key="'s' + j">
            <text
              :x="cell.x + 6"
              :y="cell.y + 30 + j * 16"
              font-size="13"
              font-weight="bold"
              :fill="cell.starColor[j]"
              font-family="serif"
              :filter="`url(#${uid('glow')})`"
            >
              {{ star }}
            </text>
            <!-- 四化 -->
            <text
              v-if="showSiHua && cell.sihua[j]"
              :x="cell.x + 6 + star.length * 12"
              :y="cell.y + 30 + j * 16"
              font-size="11"
              :fill="siHuaColor(cell.sihua[j])"
              font-weight="bold"
              font-family="serif"
            >
              ·{{ cell.sihua[j] }}
            </text>
          </g>

          <!-- 流年高亮 -->
          <circle
            v-if="showLiuNian && cell.zhiIndex === liuNianZhiIdx"
            :cx="cell.x + cell.w / 2"
            :cy="cell.y + cell.h - 8"
            r="4"
            fill="#C8302A"
          >
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        <!-- 中心命宫信息（中间 2×2） -->
        <g v-if="mingGong">
          <rect
            :x="centerX"
            :y="centerY"
            :width="centerW"
            :height="centerH"
            fill="rgba(10,10,18,0.95)"
            stroke="rgba(212,175,55,0.5)"
            stroke-width="0.8"
          />
          <text
            :x="size / 2"
            :y="centerY + 24"
            text-anchor="middle"
            font-size="14"
            font-weight="bold"
            fill="#D4AF37"
            font-family="serif"
          >
            命 宫
          </text>
          <text
            :x="size / 2"
            :y="centerY + 50"
            text-anchor="middle"
            font-size="24"
            font-weight="bold"
            fill="#F5F1E8"
            font-family="serif"
          >
            {{ mingGong.zhi }}
          </text>
          <text
            :x="size / 2"
            :y="centerY + 72"
            text-anchor="middle"
            font-size="11"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ wuju }}
          </text>
          <text
            :x="size / 2"
            :y="centerY + 92"
            text-anchor="middle"
            font-size="11"
            fill="#B8B2A0"
            font-family="serif"
          >
            年干 {{ yearGan }}
          </text>
          <text
            :x="size / 2"
            :y="centerY + 112"
            text-anchor="middle"
            font-size="11"
            fill="#D4AF37"
            font-family="serif"
          >
            {{ mingGe }}
          </text>
        </g>
      </svg>
    </view>

    <!-- 选中宫位详情 -->
    <view v-if="selectedGongData" class="zwc-detail card-mystic anim-fade-up">
      <view class="d-head">
        <text class="dh-gong">{{ selectedGongData.gongName }}宫 · {{ selectedGongData.zhi }}</text>
        <text v-if="selectedGongData.isMingGong" class="dh-tag">命</text>
        <text v-if="selectedGongData.isShenGong" class="dh-tag">身</text>
      </view>
      <view v-if="selectedGongData.mainStars.length" class="d-stars">
        <view v-for="(s, i) in selectedGongData.mainStars" :key="i" class="d-star">
          <text class="ds-name" :style="{ color: STAR_META[s].color }">{{ s }}</text>
          <text
            v-if="selectedGongData.sihua[i]"
            class="ds-sihua"
            :style="{ color: siHuaColor(selectedGongData.sihua[i]) }"
            >
·{{ selectedGongData.sihua[i] }}
</text
          >
        </view>
      </view>
      <text class="d-interp">{{ selectedGongData.interpretation }}</text>
    </view>

    <!-- 五维评分 -->
    <view class="zwc-scores card-mystic">
      <text class="s-title title-mystic">五 维 评 分</text>
      <view class="s-grid">
        <view v-for="(s, i) in scoreList" :key="i" class="s-cell">
          <text class="s-name">{{ s.name }}</text>
          <view class="s-bar"
            >
<view class="s-fill" :style="{ width: s.val + '%', background: s.color }"
          />
</view>
          <text class="s-val" :style="{ color: s.color }">{{ s.val }}</text>
        </view>
      </view>
    </view>

    <!-- 流年大运 -->
    <view class="zwc-yearly">
      <text class="y-title title-mystic">未 来 五 年 流 年</text>
      <view class="y-row">
        <view v-for="(y, i) in yearly" :key="i" class="y-cell">
          <text class="yc-num">{{ y.year }}</text>
          <text class="yc-gz">{{ y.gan }}{{ y.zhi }}</text>
          <text class="yc-text">{{ y.highlight }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { STAR_META, type ZiweiResult, type ZiweiGong } from '@/utils/ziwei'
import { uid } from '@/utils/chart-utils'

const props = defineProps<{ result: ZiweiResult }>()

const size = 720
const cellSize = size / 4
const centerX = cellSize
const centerY = cellSize
const centerW = cellSize * 2
const centerH = cellSize * 2

const showSiHua = ref(true)
const showLiuNian = ref(false)
const selectedGong = ref<number | null>(null)

const mingGong = computed(() => props.result.palaces[0])
const wuju = computed(() => props.result.wuju)
const yearGan = computed(() => props.result.yearGan)
const mingGe = computed(() => props.result.mingGe)
const yearly = computed(() => props.result.yearly)
const scores = computed(() => props.result.scores)

// 流年地支
const liuNianZhiIdx = computed(() => {
  const yr = new Date().getFullYear()
  return (((yr - 4) % 12) + 12) % 12
})

// 12 宫在 4x4 方阵中的位置
// 行0：[命(0) 兄弟(1) 夫妻(2) 子女(3)]
// 行1：[迁移(11) - - - 财帛(4)]
// 行2：[交友(10) - - - 疾厄(5)]
// 行3：[官禄(9) 田宅(8) 福德(7) 父母(6)]
const gridCells = computed(() => {
  const cells: Array<{
    x: number
    y: number
    w: number
    h: number
    gongIdx: number
    gongName: string
    zhi: string
    zhiIndex: number
    stars: string[]
    starColor: string[]
    sihua: string[]
  }> = []
  const posMap: Array<[number, number, number]> = [
    [0, 0, 0],
    [1, 0, 1],
    [2, 0, 2],
    [3, 0, 3], // 上排
    [0, 1, 11],
    [3, 1, 4], // 第二排
    [0, 2, 10],
    [3, 2, 5], // 第三排
    [0, 3, 9],
    [1, 3, 8],
    [2, 3, 7],
    [3, 3, 6], // 下排
  ]
  posMap.forEach(([col, row, gongIdx]) => {
    const p = props.result.palaces[gongIdx]
    cells.push({
      x: col * cellSize,
      y: row * cellSize,
      w: cellSize,
      h: cellSize,
      gongIdx,
      gongName: p.gongName,
      zhi: p.zhi,
      zhiIndex: p.zhiIndex,
      stars: p.mainStars,
      starColor: p.mainStars.map((s) => STAR_META[s].color),
      sihua: p.sihua,
    })
  })
  return cells
})

const onCellClick = (cell: (typeof gridCells.value)[number]) => {
  selectedGong.value = selectedGong.value === cell.gongIdx ? null : cell.gongIdx
}
const selectedGongData = computed<ZiweiGong | null>(() => {
  if (selectedGong.value === null) return null
  return props.result.palaces[selectedGong.value]
})

const siHuaColor = (s: string) => {
  if (s === '禄') return '#D4AF37'
  if (s === '权') return '#C8302A'
  if (s === '科') return '#4FAE6F'
  if (s === '忌') return '#5B3A8E'
  return '#B8B2A0'
}

const scoreList = computed(() => [
  { name: '事业', val: scores.value.career, color: '#D4AF37' },
  { name: '财帛', val: scores.value.wealth, color: '#C8302A' },
  { name: '婚姻', val: scores.value.relationship, color: '#E04A3A' },
  { name: '健康', val: scores.value.health, color: '#2F7D4F' },
  { name: '人际', val: scores.value.social, color: '#5B3A8E' },
])
</script>

<style scoped>
.zwc {
  padding: 8rpx;
}
.zwc-bar {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
  flex-wrap: wrap;
}
.zbtn {
  padding: 8rpx 16rpx;
  background: rgba(20, 20, 28, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: 8rpx;
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.zbtn.active {
  background: rgba(212, 175, 55, 0.15);
  border-color: var(--color-liu, #d4af37);
  color: var(--color-liu, #d4af37);
}
.zwc-canvas {
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
  padding: 8rpx;
}
.zwc-svg {
  width: 100%;
  height: auto;
}
.cell {
  cursor: pointer;
  transition: all 0.2s;
}
.cell:hover rect {
  filter: brightness(1.3);
}
.cell.selected rect {
  stroke: #d4af37 !important;
  stroke-width: 2 !important;
}
.zwc-detail {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
}
.d-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}
.dh-gong {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.dh-tag {
  padding: 2rpx 12rpx;
  background: var(--color-liu, #d4af37);
  color: var(--color-xuan, #0a0a12);
  font-size: 20rpx;
  font-weight: bold;
  border-radius: 4rpx;
}
.d-stars {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 12rpx 0;
}
.d-star {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 4rpx 12rpx;
  background: rgba(20, 20, 28, 0.6);
  border-radius: 8rpx;
}
.ds-name {
  font-size: 26rpx;
  font-weight: bold;
  font-family: serif;
}
.ds-sihua {
  font-size: 22rpx;
  font-weight: bold;
}
.d-interp {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--color-bai-2, #b8b2a0);
}
.zwc-scores {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
}
.s-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  margin-bottom: 16rpx;
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
.zwc-yearly {
  margin-top: 16rpx;
}
.y-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  margin-bottom: 12rpx;
  font-family: serif;
}
.y-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8rpx;
}
.y-cell {
  padding: 12rpx 8rpx;
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: 8rpx;
  text-align: center;
}
.yc-num {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-3, #6b6655);
}
.yc-gz {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
.yc-text {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-top: 4rpx;
  line-height: 1.3;
}
</style>
