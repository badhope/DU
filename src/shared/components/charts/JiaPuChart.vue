<template>
  <view class="jpc">
    <!-- 控制 -->
    <view class="jpc-bar">
      <view class="zbtn" @click="zoom = Math.max(0.5, zoom - 0.1)">－</view>
      <text class="ztext">{{ Math.round(zoom * 100) }}%</text>
      <view class="zbtn" @click="zoom = Math.min(1.5, zoom + 0.1)">＋</view>
      <view class="zbtn zbtn-gen" @click="selectGen(0)">始祖</view>
      <view class="zbtn zbtn-gen" @click="selectGen(generations.length)">当代</view>
    </view>

    <view class="jpc-scroll">
      <svg
        :viewBox="`0 0 ${width} ${height}`"
        class="jpc-svg"
        :style="{ transform: `scale(${zoom})`, transformOrigin: '0 0' }"
      >
        <defs>
          <filter :id="uid('g')">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- 世代分隔横线 -->
        <line
          v-for="(g, i) in generations"
          :key="'l' + i"
          :x1="20"
          :y1="g.y"
          :x2="width - 20"
          :y2="g.y"
          stroke="rgba(212,175,55,0.15)"
          stroke-width="0.5"
          stroke-dasharray="3 3"
        />
        <text
          v-for="(g, i) in generations"
          :key="'t' + i"
          :x="10"
          :y="g.y + 4"
          font-size="11"
          fill="#6B6655"
          font-family="serif"
          text-anchor="end"
        >
          {{ g.gen }} 世
        </text>

        <!-- 世代间连线 -->
        <line
          v-for="(c, i) in connectLines"
          :key="'c' + i"
          :x1="c.x1"
          :y1="c.y1"
          :x2="c.x2"
          :y2="c.y2"
          stroke="rgba(212,175,55,0.5)"
          stroke-width="1"
        />

        <!-- 节点 -->
        <g
          v-for="n in nodes"
          :key="n.id"
          class="jp-node"
          :class="{ current: n.isCurrent, focus: focusGen === n.gen }"
          @click="focusGen = n.gen"
        >
          <rect
            :x="n.x"
            :y="n.y"
            :width="nodeW"
            :height="nodeH"
            rx="8"
            :fill="n.isCurrent ? 'rgba(212,175,55,0.2)' : 'rgba(20,20,28,0.85)'"
            :stroke="n.isCurrent ? '#D4AF37' : 'rgba(212,175,55,0.4)'"
            stroke-width="1.2"
            :filter="`url(#${uid('g')})`"
          />
          <text
            :x="n.x + nodeW / 2"
            :y="n.y + 18"
            text-anchor="middle"
            font-size="12"
            font-weight="bold"
            :fill="n.isCurrent ? '#D4AF37' : '#F5F1E8'"
            font-family="serif"
          >
            {{ n.zibei }}
          </text>
          <text
            :x="n.x + nodeW / 2"
            :y="n.y + 32"
            text-anchor="middle"
            font-size="9"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ n.gen }} 世
          </text>
          <text
            :x="n.x + nodeW / 2"
            :y="n.y + 46"
            text-anchor="middle"
            font-size="8"
            fill="#6B6655"
            font-family="serif"
          >
            {{ n.yearRange }}
          </text>
          <text
            :x="n.x + nodeW / 2"
            :y="n.y + 60"
            text-anchor="middle"
            font-size="9"
            fill="#D4AF37"
            font-family="serif"
          >
            ×{{ n.count }}
          </text>
        </g>
      </svg>
    </view>

    <!-- 字辈诗 -->
    <view class="jpc-poem card-mystic">
      <text class="b-title title-mystic">字 辈 诗</text>
      <text class="poem-text">{{ result.poem }}</text>
      <view class="poem-tag">
        <text class="pt-l">始祖辈数：</text>
        <text class="pt-v">{{ result.startGen }} 世起</text>
      </view>
      <view class="poem-tag">
        <text class="pt-l">当前世代：</text>
        <text class="pt-v" style="color: #d4af37">
          {{ result.currentGen }} 世（{{ result.currentZibei }}字辈）
        </text>
      </view>
    </view>

    <!-- 取名建议 -->
    <view class="jpc-suggest card-mystic">
      <text class="b-title title-mystic">取 名 建 议</text>
      <view class="sg-grid">
        <view v-for="(s, i) in result.suggested" :key="i" class="sg-cell">
          <text class="sgc-name">{{ s.name }}</text>
          <text class="sgc-wx" :style="{ color: wuColor(s.wuXing) }">{{ s.wuXing }}</text>
          <text class="sgc-meaning">{{ s.meaning }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FamilyTree } from '@mingli/logic/jiazu'
import { WUXING_META, type Wuxing } from '@mingli/logic/wuxing'
import { uid } from '@guanxiang/logic/chart-utils'

const props = defineProps<{ result: FamilyTree }>()

const zoom = ref(1)
const focusGen = ref<number | null>(null)
const nodeW = 90
const nodeH = 70
const spacing = 130
const ySpacing = 110

const generations = computed(() => {
  return props.result.generations.map((g, i) => ({
    ...g,
    y: 40 + i * ySpacing,
  }))
})

const width = computed(() => Math.max(generations.value.length * spacing + 100, 720))
const height = computed(() => generations.value.length * ySpacing + 60)

const nodes = computed(() => {
  const arr: Array<{
    id: number
    x: number
    y: number
    gen: number
    zibei: string
    yearRange: string
    count: number
    isCurrent: boolean
  }> = []
  generations.value.forEach((g, i) => {
    arr.push({
      id: i,
      x: 60 + i * spacing,
      y: g.y - nodeH / 2,
      gen: g.gen,
      zibei: g.zibei,
      yearRange: `${g.startYear}-${g.endYear}`,
      count: g.totalCount,
      isCurrent: g.gen === props.result.currentGen,
    })
  })
  return arr
})

const connectLines = computed(() => {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (let i = 0; i < generations.value.length - 1; i++) {
    const a = nodes.value[i]!
    const b = nodes.value[i + 1]!
    lines.push({
      x1: a.x + nodeW / 2,
      y1: a.y + nodeH,
      x2: b.x + nodeW / 2,
      y2: b.y,
    })
  }
  return lines
})

const wuColor = (wx: string) => {
  const w = wx as Wuxing
  return WUXING_META[w]?.color || '#D4AF37'
}

const selectGen = (idx: number) => {
  if (idx === 0) focusGen.value = props.result.generations[0]!.gen
  else focusGen.value = props.result.generations[generations.value.length - 1].gen
}
</script>

<style scoped>
.jpc {
  padding: 8rpx;
}
.jpc-bar {
  display: flex;
  gap: 8rpx;
  margin-bottom: 12rpx;
  align-items: center;
}
.zbtn {
  padding: 8rpx 16rpx;
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: 8rpx;
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.zbtn-gen {
  margin-left: auto;
}
.ztext {
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
  min-width: 70rpx;
  text-align: center;
}
.jpc-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.jpc-svg {
  min-width: 720px;
  height: auto;
}
.jp-node {
  cursor: pointer;
  transition: all 0.2s;
}
.jp-node:hover rect {
  filter: brightness(1.3);
}
.jp-node.focus rect {
  stroke: #d4af37;
  stroke-width: 2;
}
.jpc-poem,
.jpc-suggest {
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
.poem-text {
  display: block;
  padding: 12rpx;
  background: rgba(91, 58, 142, 0.15);
  border-radius: 8rpx;
  font-size: 32rpx;
  line-height: 1.8;
  color: var(--color-liu, #d4af37);
  font-family: serif;
  letter-spacing: 0.1em;
  text-align: center;
}
.poem-tag {
  display: flex;
  gap: 8rpx;
  padding: 4rpx 0;
  font-size: 24rpx;
}
.pt-l {
  color: var(--color-bai-2, #b8b2a0);
  width: 140rpx;
}
.pt-v {
  color: var(--color-bai, #f5f1e8);
  font-weight: bold;
}
.sg-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx;
}
@media (max-width: 600px) {
  .sg-grid {
    grid-template-columns: 1fr;
  }
}
.sg-cell {
  padding: 12rpx;
  background: rgba(10, 10, 18, 0.5);
  border-radius: 8rpx;
}
.sgc-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.sgc-wx {
  display: inline-block;
  margin-top: 4rpx;
  padding: 0 8rpx;
  border-radius: 4rpx;
  background: rgba(255, 255, 255, 0.05);
  font-size: 20rpx;
}
.sgc-meaning {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: var(--color-bai-2, #b8b2a0);
}
</style>
