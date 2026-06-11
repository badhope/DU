<template>
  <view class="qmc">
    <!-- 局信息 -->
    <view class="qmc-info">
      <view class="info-cell">
        <text class="ic-l">局</text><text class="ic-v">{{ result.ju }} 局</text>
      </view>
      <view class="info-cell">
        <text class="ic-l">元</text><text class="ic-v">{{ result.yuan }}</text>
      </view>
      <view class="info-cell">
        <text class="ic-l">遁</text><text class="ic-v">{{ result.dun }}</text>
      </view>
      <view class="info-cell">
        <text class="ic-l">时</text
        ><text class="ic-v">{{ result.shiGan }}{{ result.shiZhi }}时</text>
      </view>
      <view class="info-cell">
        <text class="ic-l">值符</text
        ><text class="ic-v" :style="{ color: '#D4AF37' }">{{ result.zhiFuStar }}</text>
      </view>
      <view class="info-cell">
        <text class="ic-l">值使</text
        ><text class="ic-v" :style="{ color: '#D4AF37' }">{{ result.zhiShiMen }}门</text>
      </view>
    </view>

    <!-- 盘选择 -->
    <view class="qmc-bar">
      <view class="pbtn" :class="{ active: layer === 'all' }" @click="layer = 'all'">全 显</view>
      <view class="pbtn" :class="{ active: layer === 'di' }" @click="layer = 'di'">地 盘</view>
      <view class="pbtn" :class="{ active: layer === 'tian' }" @click="layer = 'tian'">天 盘</view>
      <view class="pbtn" :class="{ active: layer === 'ren' }" @click="layer = 'ren'">人 盘</view>
      <view class="pbtn" :class="{ active: layer === 'shen' }" @click="layer = 'shen'">神 盘</view>
    </view>

    <!-- 9 宫盘 -->
    <view class="qmc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="qmc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(91,58,142,0.2)" />
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

        <g
          v-for="p in result.palace"
          :key="p.gong"
          class="qmc-cell"
          :class="['judge-' + p.judge, { active: selectedGong === p.gong }]"
          @click="selectedGong = p.gong"
        >
          <rect
            :x="cellX(p.col)"
            :y="cellY(p.row)"
            :width="cellSize"
            :height="cellSize"
            :fill="cellFill(p.judge)"
            :stroke="cellStroke(p.judge)"
            stroke-width="1"
          />

          <!-- 宫位名 -->
          <text
            :x="cellX(p.col) + 6"
            :y="cellY(p.row) + 14"
            font-size="11"
            fill="#6B6655"
            font-family="serif"
          >
            {{ p.gong }}宫
          </text>

          <!-- 吉凶标签 -->
          <text
            :x="cellX(p.col) + cellSize - 6"
            :y="cellY(p.row) + 14"
            text-anchor="end"
            font-size="11"
            font-weight="bold"
            :fill="judgeColor(p.judge)"
            font-family="serif"
          >
            {{ p.judge }}
          </text>

          <!-- 三盘四神 -->
          <g v-if="layer === 'all' || layer === 'di'">
            <text
              :x="cellX(p.col) + 8"
              :y="cellY(p.row) + 34"
              font-size="13"
              fill="#A87C4F"
              font-family="serif"
            >
              地 {{ p.diPan }}
            </text>
          </g>
          <g v-if="layer === 'all' || layer === 'tian'">
            <text
              :x="cellX(p.col) + 8"
              :y="cellY(p.row) + 50"
              font-size="12"
              font-weight="bold"
              :fill="starColor(p.starNature)"
              font-family="serif"
            >
              天 {{ p.star }}
            </text>
          </g>
          <g v-if="layer === 'all' || layer === 'ren'">
            <text
              :x="cellX(p.col) + 8"
              :y="cellY(p.row) + 66"
              font-size="12"
              font-weight="bold"
              :fill="menColor(p.menNature)"
              font-family="serif"
            >
              人 {{ p.men }}门
            </text>
          </g>
          <g v-if="layer === 'all' || layer === 'shen'">
            <text
              :x="cellX(p.col) + 8"
              :y="cellY(p.row) + 82"
              font-size="11"
              :fill="shenColor(p.shenNature)"
              font-family="serif"
            >
              神 {{ p.shen }}
            </text>
          </g>

          <!-- 仅显示单盘时大字号 -->
          <text
            v-if="layer === 'di'"
            :x="cellX(p.col) + cellSize / 2"
            :y="cellY(p.row) + cellSize / 2 + 6"
            text-anchor="middle"
            font-size="36"
            fill="#A87C4F"
            font-family="serif"
            font-weight="bold"
          >
            {{ p.diPan }}
          </text>
          <text
            v-if="layer === 'tian'"
            :x="cellX(p.col) + cellSize / 2"
            :y="cellY(p.row) + cellSize / 2 - 8"
            text-anchor="middle"
            font-size="28"
            :fill="starColor(p.starNature)"
            font-family="serif"
            font-weight="bold"
          >
            {{ p.star }}
          </text>
          <text
            v-if="layer === 'tian'"
            :x="cellX(p.col) + cellSize / 2"
            :y="cellY(p.row) + cellSize / 2 + 18"
            text-anchor="middle"
            font-size="12"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ p.starDesc }}
          </text>
          <text
            v-if="layer === 'ren'"
            :x="cellX(p.col) + cellSize / 2"
            :y="cellY(p.row) + cellSize / 2 - 8"
            text-anchor="middle"
            font-size="32"
            :fill="menColor(p.menNature)"
            font-family="serif"
            font-weight="bold"
          >
            {{ p.men }}门
          </text>
          <text
            v-if="layer === 'ren'"
            :x="cellX(p.col) + cellSize / 2"
            :y="cellY(p.row) + cellSize / 2 + 18"
            text-anchor="middle"
            font-size="12"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ p.menDesc }}
          </text>
          <text
            v-if="layer === 'shen'"
            :x="cellX(p.col) + cellSize / 2"
            :y="cellY(p.row) + cellSize / 2 + 6"
            text-anchor="middle"
            font-size="32"
            :fill="shenColor(p.shenNature)"
            font-family="serif"
            font-weight="bold"
          >
            {{ p.shen }}
          </text>
        </g>
      </svg>
    </view>

    <!-- 选中宫位详情 -->
    <view v-if="selectedPalace" class="qmc-detail card-mystic">
      <view class="d-head">
        <text class="dh-gong">{{ selectedPalace.gong }}宫</text>
        <text class="dh-judge" :style="{ color: judgeColor(selectedPalace.judge) }">
          {{ selectedPalace.judge }}
        </text>
      </view>
      <text class="d-brief">{{ selectedPalace.brief }}</text>
      <view class="d-layers">
        <view class="dl-row">
          <text class="dlr-l">地 盘：</text><text class="dlr-v">{{ selectedPalace.diPan }}</text>
        </view>
        <view class="dl-row">
          <text class="dlr-l">天 盘：</text
          ><text class="dlr-v" :style="{ color: starColor(selectedPalace.starNature) }">
            {{ selectedPalace.star }}（{{ selectedPalace.starNature }}）
          </text>
        </view>
        <view class="dl-row">
          <text class="dlr-l">人 盘：</text
          ><text class="dlr-v" :style="{ color: menColor(selectedPalace.menNature) }">
            {{ selectedPalace.men }}门（{{ selectedPalace.menNature }}）
          </text>
        </view>
        <view class="dl-row">
          <text class="dlr-l">神 盘：</text
          ><text class="dlr-v" :style="{ color: shenColor(selectedPalace.shenNature) }">
            {{ selectedPalace.shen }}（{{ selectedPalace.shenNature }}）
          </text>
        </view>
      </view>
      <text class="d-desc">
        {{ selectedPalace.starDesc }}；{{ selectedPalace.menDesc }}；{{ selectedPalace.shenDesc }}
      </text>
    </view>

    <!-- 用神提示 -->
    <view class="qmc-tip card-mystic">
      <text class="b-title title-mystic">奇 门 用 神</text>
      <text class="tip-text">{{ tip }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QimenResult } from '@modules/zhanbu/logic/qimen'
import { uid, levelColor } from '@modules/guanxiang/logic/chart-utils'

const props = defineProps<{ result: QimenResult }>()

const size = 720
const cellSize = size / 3
const layer = ref<'all' | 'di' | 'tian' | 'ren' | 'shen'>('all')
const selectedGong = ref<string | null>(null)

const cellX = (col: number) => col * cellSize
const cellY = (row: number) => row * cellSize

const cellFill = (j: string) => {
  if (j === '大吉') return 'rgba(212,175,55,0.18)'
  if (j === '吉') return 'rgba(47,125,79,0.15)'
  if (j === '中') return 'rgba(20,20,28,0.5)'
  if (j === '凶') return 'rgba(200,48,42,0.12)'
  return 'rgba(139,31,26,0.2)'
}
const cellStroke = (j: string) => {
  if (j === '大吉') return '#D4AF37'
  if (j === '吉') return '#2F7D4F'
  if (j === '中') return 'rgba(212,175,55,0.2)'
  if (j === '凶') return '#C8302A'
  return '#8B1F1A'
}
const judgeColor = (j: string) => levelColor(j)
const starColor = (n: string) => (n === '吉' ? '#2F7D4F' : n === '凶' ? '#C8302A' : '#B8B2A0')
const menColor = (n: string) => (n === '吉' ? '#D4AF37' : n === '凶' ? '#C8302A' : '#B8B2A0')
const shenColor = (n: string) => (n === '吉' ? '#5B3A8E' : n === '凶' ? '#8B1F1A' : '#B8B2A0')

const selectedPalace = computed(() =>
  props.result.palace.find((p) => p.gong === selectedGong.value),
)

const tip = computed(() => {
  const zf = props.result.zhiFuStar
  const zs = props.result.zhiShiMen
  return (
    `本局值符 ${zf} · 值使 ${zs}门 · 测事以所问之门落宫为用神。` +
    `${props.result.dun}${props.result.ju}局${props.result.yuan}，${props.result.jieqi}，` +
    `宜${zs.charAt(0) === '开' || zs.charAt(0) === '生' || zs.charAt(0) === '休' ? '谋事可成' : '守正待时'}。`
  )
})
</script>

<style scoped>
.qmc {
  padding: 8rpx;
}
.qmc-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8rpx;
  margin-bottom: 12rpx;
  padding: 12rpx;
  background: rgba(20, 20, 28, 0.5);
  border-radius: 12rpx;
}
.info-cell {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
}
.ic-l {
  font-size: 22rpx;
  color: var(--color-bai-3, #6b6655);
}
.ic-v {
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
  font-weight: bold;
  font-family: serif;
}
.qmc-bar {
  display: flex;
  gap: 6rpx;
  margin-bottom: 12rpx;
  flex-wrap: wrap;
}
.pbtn {
  flex: 1;
  min-width: 100rpx;
  padding: 8rpx 12rpx;
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
.qmc-canvas {
  display: flex;
  justify-content: center;
  padding: 8rpx;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.qmc-svg {
  width: 100%;
  max-width: 720rpx;
  height: auto;
}
.qmc-cell {
  cursor: pointer;
  transition: all 0.2s;
}
.qmc-cell:hover rect {
  filter: brightness(1.2);
}
.qmc-cell.active rect {
  stroke: #d4af37 !important;
  stroke-width: 2 !important;
}
.qmc-detail {
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
.dh-gong {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.dh-judge {
  font-size: 28rpx;
  font-weight: bold;
}
.d-brief {
  display: block;
  padding: 8rpx 0;
  font-size: 26rpx;
  color: var(--color-liu, #d4af37);
  font-weight: bold;
}
.d-layers {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  padding: 8rpx 0;
  border-top: 1rpx dashed rgba(212, 175, 55, 0.15);
  border-bottom: 1rpx dashed rgba(212, 175, 55, 0.15);
}
.dl-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
}
.dlr-l {
  color: var(--color-bai-3, #6b6655);
  width: 100rpx;
}
.dlr-v {
  color: var(--color-bai, #f5f1e8);
  font-weight: bold;
  font-family: serif;
}
.d-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--color-bai-2, #b8b2a0);
}
.qmc-tip {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, rgba(91, 58, 142, 0.2), rgba(20, 20, 28, 0.6));
}
.b-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  margin-bottom: 8rpx;
  font-family: serif;
}
.tip-text {
  display: block;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--color-bai, #f5f1e8);
}
</style>
