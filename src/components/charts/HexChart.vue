<!--
  渡 DU · 六爻卦象可视化
  - 本卦 6 爻垂直排列（自下而上 1-6）
  - 动爻高亮 + 变爻显示
  - 世爻/应爻标记
  - 互卦/变卦对照右侧
-->
<template>
  <view class="hxc">
    <view class="hxc-head card-mystic">
      <view class="hh-left">
        <text class="hh-name">{{ result.benGua.name }}</text>
        <text class="hh-sym">{{ result.benGua.symbol }}</text>
      </view>
      <view class="hh-mid">
        <text class="hm-label">变卦</text>
        <text class="hm-arrow">→</text>
        <text class="hm-name">{{ result.bianGua.name }}</text>
        <text class="hm-sym">{{ result.bianGua.symbol }}</text>
      </view>
      <view class="hh-right">
        <text class="hr-pc">{{ result.benGua.palaceName }}</text>
        <text class="hr-sh">世{{ result.benGua.shiPos }} · 应{{ result.benGua.yingPos }}</text>
      </view>
    </view>

    <view class="hxc-canvas">
      <svg :viewBox="`0 0 ${sizeW} ${sizeH}`" class="hxc-svg">
        <defs>
          <linearGradient :id="uid('bg')" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(212,175,55,0.15)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.9)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#{{ uid('bg') }})" />

        <!-- 6 爻自下而上排列 -->
        <g v-for="(y, i) in result.benGua.yaoList" :key="'by-' + i">
          <!-- 爻水平线 -->
          <g :transform="`translate(0, ${yStart + i * yGap})`">
            <!-- 爻符号 -->
            <line
              :x1="x0"
              :y1="0"
              :x2="x0 + yWidth"
              y2="0"
              :stroke="y.isMoving ? THEME.zhu : THEME.liu"
              stroke-width="3"
              :stroke-dasharray="y.isYang ? '0' : `${yWidth / 2 - 4} ${gap}`"
            />
            <line
              v-if="!y.isYang"
              :x1="x0 + yWidth / 2 + gap"
              :y1="0"
              :x2="x0 + yWidth"
              y2="0"
              :stroke="y.isMoving ? THEME.zhu : THEME.liu"
              stroke-width="3"
            />

            <!-- 爻位标签 -->
            <text
              :x="x0 - 30"
              y="5"
              text-anchor="end"
              font-size="14"
              :fill="y.isShi || y.isYing ? THEME.liu : THEME.fg2"
              font-weight="bold"
              font-family="serif"
            >
              {{ y.pos }}
            </text>
            <text
              v-if="y.isShi"
              :x="x0 - 30"
              y="20"
              text-anchor="end"
              font-size="10"
              :fill="THEME.liu"
              font-family="serif"
            >
              世
            </text>
            <text
              v-if="y.isYing"
              :x="x0 - 30"
              y="20"
              text-anchor="end"
              font-size="10"
              :fill="THEME.zhu"
              font-family="serif"
            >
              应
            </text>

            <!-- 地支 + 纳甲 -->
            <text
              :x="x0 + yWidth + 12"
              y="5"
              font-size="13"
              :fill="THEME.fg"
              font-weight="bold"
              font-family="serif"
            >
              {{ y.dizhi }}
            </text>
            <text :x="x0 + yWidth + 30" y="5" font-size="11" :fill="THEME.fg3" font-family="serif">
              {{ y.tiangan }}
            </text>

            <!-- 六亲 -->
            <rect
              :x="x0 + yWidth + 60"
              :y="-10"
              width="40"
              height="20"
              rx="4"
              :fill="liuqinColor(y.liuqin, 0.2)"
              :stroke="liuqinColor(y.liuqin, 1)"
              stroke-width="1"
            />
            <text
              :x="x0 + yWidth + 80"
              y="4"
              text-anchor="middle"
              font-size="11"
              font-weight="bold"
              :fill="liuqinColor(y.liuqin, 1)"
              font-family="serif"
            >
              {{ y.liuqin }}
            </text>

            <!-- 神煞标签 -->
            <g
              v-for="(s, si) in y.shen"
              :key="si"
              :transform="`translate(${x0 + yWidth + 110 + si * 60}, 0)`"
            >
              <rect
                x="0"
                y="-9"
                width="55"
                height="18"
                rx="9"
                fill="rgba(212,175,55,0.15)"
                :stroke="THEME.liu"
                stroke-width="0.8"
              />
              <text
                x="27.5"
                y="4"
                text-anchor="middle"
                font-size="10"
                :fill="THEME.liu"
                font-family="serif"
              >
                {{ s }}
              </text>
            </g>

            <!-- 动爻标记：圆点 + 变爻 -->
            <g v-if="y.isMoving && y.bian">
              <circle :cx="x0 + yWidth + 180" cy="0" r="4" :fill="THEME.zhu" />
              <text
                :x="x0 + yWidth + 190"
                y="-3"
                font-size="10"
                :fill="THEME.zhu"
                font-family="serif"
              >
                动
              </text>
              <text
                :x="x0 + yWidth + 190"
                y="10"
                font-size="9"
                :fill="THEME.fg3"
                font-family="serif"
              >
                →{{ y.bian.dizhi }}
              </text>
            </g>
          </g>
        </g>

        <!-- 标题 -->
        <text
          :x="x0 + yWidth / 2"
          y="20"
          text-anchor="middle"
          font-size="13"
          :fill="THEME.liu"
          font-family="serif"
          letter-spacing="4"
        >
          本 卦
        </text>
      </svg>
    </view>

    <!-- 变卦与互卦 -->
    <view class="hxc-comp card-mystic">
      <view class="cmp-cell">
        <text class="cc-label">变 卦</text>
        <text class="cc-name">{{ result.bianGua.name }}</text>
        <text class="cc-sym">{{ result.bianGua.symbol }}</text>
        <text class="cc-reason">{{ result.bianGua.reason }}</text>
      </view>
      <view class="cmp-cell">
        <text class="cc-label">互 卦</text>
        <text class="cc-name">{{ result.huGua.name }}</text>
        <text class="cc-sym">{{ result.huGua.symbol }}</text>
        <text class="cc-reason">{{ result.huGua.desc }}</text>
      </view>
      <view class="cmp-cell">
        <text class="cc-label">伏 卦</text>
        <text class="cc-name">{{ result.fuGua.name }}</text>
        <text class="cc-reason">本宫卦 · 借爻查用</text>
      </view>
    </view>

    <!-- 用神 + 评分 -->
    <view class="hxc-ys card-mystic">
      <view class="ys-head">
        <text class="yh-l">用神：</text>
        <text class="yh-v">{{ result.yongshen.name }}</text>
        <text class="yh-pos">
          {{ result.yongshen.yaoPos ? `立第 ${result.yongshen.yaoPos} 爻` : '卦中无此爻' }}
        </text>
        <text class="yh-st" :style="{ color: statusColor(result.yongshen.status) }">
          {{ result.yongshen.status }}
        </text>
      </view>
      <text class="ys-reason">{{ result.yongshen.statusDesc }}</text>
    </view>

    <!-- 5 维评分 -->
    <view class="hxc-fort card-mystic">
      <text class="b-title title-mystic">五 维 评 分</text>
      <view v-for="(f, k) in fortunesList" :key="k" class="fort-row">
        <text class="fr-l">{{ f.label }}</text>
        <view class="fr-bar">
          <view class="fr-fill" :style="{ width: f.score + '%', background: f.color }" />
        </view>
        <text class="fr-v" :style="{ color: f.color }">{{ f.score }}</text>
        <text class="fr-t" :style="{ color: f.color }">{{ f.text }}</text>
      </view>
    </view>

    <!-- 综合解读 -->
    <view class="hxc-sum card-mystic">
      <text class="b-title title-mystic">综 合 解 读</text>
      <text class="sum-text">{{ result.summary }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { uid, THEME, levelColor } from '@/utils/chart-utils'
import type { LiuyaoResult } from '@/utils/liuyao'

const props = defineProps<{ result: LiuyaoResult }>()

const sizeW = 540
const sizeH = 360
const x0 = 50
const yStart = 50
const yGap = 44
const yWidth = 280
const gap = 8

function liuqinColor(lq: string, alpha: number): string {
  const map: Record<string, string> = {
    父母: '212,175,55',
    兄弟: '232,228,216',
    子孙: '47,125,79',
    妻财: '200,48,42',
    官鬼: '91,58,142',
  }
  const c = map[lq] || '184,178,160'
  return `rgba(${c},${alpha})`
}

function statusColor(s: string): string {
  if (s === '旺' || s === '相') return '#2F7D4F'
  if (s === '休') return '#B8B2A0'
  if (s === '囚') return '#C8302A'
  if (s === '死' || s === '缺') return '#8B1F1A'
  return '#B8B2A0'
}

const fortunesList = computed(() => [
  {
    key: 'career',
    label: '事业',
    score: props.result.fortunes.career.score,
    text: props.result.fortunes.career.text,
    color: levelColor(props.result.fortunes.career.text),
  },
  {
    key: 'wealth',
    label: '求财',
    score: props.result.fortunes.wealth.score,
    text: props.result.fortunes.wealth.text,
    color: levelColor(props.result.fortunes.wealth.text),
  },
  {
    key: 'love',
    label: '姻缘',
    score: props.result.fortunes.love.score,
    text: props.result.fortunes.love.text,
    color: levelColor(props.result.fortunes.love.text),
  },
  {
    key: 'health',
    label: '健康',
    score: props.result.fortunes.health.score,
    text: props.result.fortunes.health.text,
    color: levelColor(props.result.fortunes.health.text),
  },
  {
    key: 'study',
    label: '学业',
    score: props.result.fortunes.study.score,
    text: props.result.fortunes.study.text,
    color: levelColor(props.result.fortunes.study.text),
  },
])
</script>

<style scoped>
.hxc {
  padding: 8rpx;
}
.hxc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
  margin-bottom: 16rpx;
}
.hh-left,
.hh-right {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.hh-mid {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.hh-name {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
.hh-sym {
  font-size: 40rpx;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.hm-label {
  font-size: 22rpx;
  color: var(--color-bai-3, #6b6655);
}
.hm-arrow {
  font-size: 28rpx;
  color: var(--color-liu, #d4af37);
}
.hm-name {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.hm-sym {
  font-size: 36rpx;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.hr-pc {
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.hr-sh {
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}

.hxc-canvas {
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.hxc-svg {
  width: 100%;
  max-width: 540rpx;
  height: auto;
}

.hxc-comp {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
  margin-top: 16rpx;
}
.cmp-cell {
  flex: 1;
  padding: 12rpx;
  background: rgba(10, 10, 18, 0.4);
  border-radius: 12rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}
.cc-label {
  display: block;
  font-size: 22rpx;
  color: var(--color-bai-3, #6b6655);
  margin-bottom: 6rpx;
}
.cc-name {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.cc-sym {
  display: block;
  font-size: 32rpx;
  color: var(--color-liu, #d4af37);
  font-family: serif;
  margin: 4rpx 0;
}
.cc-reason {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-2, #b8b2a0);
  line-height: 1.4;
  margin-top: 4rpx;
}

.hxc-ys,
.hxc-fort,
.hxc-sum {
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
  margin-top: 16rpx;
}
.ys-head {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-wrap: wrap;
}
.yh-l {
  font-size: 24rpx;
  color: var(--color-bai-3, #6b6655);
}
.yh-v {
  font-size: 28rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.yh-pos {
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.yh-st {
  font-size: 24rpx;
  font-weight: bold;
  margin-left: auto;
}
.ys-reason {
  display: block;
  padding-top: 8rpx;
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
  line-height: 1.5;
}
.b-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  margin-bottom: 12rpx;
  font-family: serif;
}
.fort-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 6rpx 0;
}
.fr-l {
  width: 80rpx;
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.fr-bar {
  flex: 1;
  height: 12rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6rpx;
  overflow: hidden;
}
.fr-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.6s;
}
.fr-v {
  width: 60rpx;
  text-align: right;
  font-size: 24rpx;
  font-weight: bold;
  font-family: serif;
}
.fr-t {
  width: 80rpx;
  text-align: right;
  font-size: 22rpx;
}
.sum-text {
  display: block;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--color-bai, #f5f1e8);
}
</style>
