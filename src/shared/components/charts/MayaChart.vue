<template>
  <view class="macc">
    <!-- 中心：今日 Kin -->
    <view class="macc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="macc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(91,58,142,0.3)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.95)" />
          </radialGradient>
          <filter :id="uid('g')">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#{{ uid('bg') }})" />

        <!-- 卓尔金轮 4 圈同心环 -->
        <!-- 第 1 圈（最外）：20 个日主 -->
        <g
          v-for="(s, i) in sealList"
          :key="'s' + i"
          class="seal-node"
          :class="{ active: s.name === result.seal }"
          @click="onSeal(s)"
        >
          <circle
            :cx="s.x"
            :cy="s.y"
            :r="sR"
            :fill="s.fill"
            :stroke="s.color"
            stroke-width="1.5"
            :filter="`url(#${uid('g')})`"
          />
          <text
            :x="s.x"
            :y="s.y + 5"
            text-anchor="middle"
            font-size="16"
            :fill="s.color"
            font-family="serif"
            font-weight="bold"
          >
            {{ s.glyph }}
          </text>
        </g>

        <!-- 第 2 圈：13 个调性（径向坐标） -->
        <g
          v-for="(t, i) in toneList"
          :key="'t' + i"
          class="tone-node"
          :class="{ active: t.num === result.tone }"
        >
          <text
            :x="t.x"
            :y="t.y"
            text-anchor="middle"
            font-size="13"
            font-weight="bold"
            :fill="t.color"
            font-family="serif"
          >
            {{ t.num }}
          </text>
          <text
            :x="t.x"
            :y="t.y + 12"
            text-anchor="middle"
            font-size="8"
            :fill="t.color"
            font-family="serif"
            opacity="0.7"
          >
            {{ t.name }}
          </text>
        </g>

        <!-- 第 3 圈：螺旋线连接 Kin 序列 -->
        <path
          :d="kinPath"
          stroke="rgba(212,175,55,0.4)"
          stroke-width="1"
          fill="none"
          stroke-dasharray="2 2"
        />

        <!-- 第 4 圈（中心）：今日 Kin -->
        <circle
          :cx="cx"
          :cy="cy"
          r="60"
          :fill="result.toneColor"
          stroke="#D4AF37"
          stroke-width="2"
          :filter="`url(#${uid('g')})`"
        >
          <animate attributeName="r" values="60;66;60" dur="3s" repeatCount="indefinite" />
        </circle>
        <text
          :x="cx"
          :y="cy - 22"
          text-anchor="middle"
          font-size="10"
          fill="#0A0A12"
          font-family="serif"
          opacity="0.7"
        >
          KIN
        </text>
        <text
          :x="cx"
          :y="cy + 8"
          text-anchor="middle"
          font-size="36"
          font-weight="bold"
          fill="#0A0A12"
          font-family="serif"
        >
          {{ result.kin }}
        </text>
        <text
          :x="cx"
          :y="cy + 28"
          text-anchor="middle"
          font-size="14"
          fill="#0A0A12"
          font-family="serif"
          font-weight="bold"
        >
          {{ result.toneName }} · {{ result.sealName }}
        </text>

        <!-- 连接线（中心 → 当前日主 + 调性） -->
        <line
          v-if="currentSealPos"
          :x1="cx"
          :y1="cy"
          :x2="currentSealPos.x"
          :y2="currentSealPos.y"
          stroke="#D4AF37"
          stroke-width="1.5"
          stroke-dasharray="3 2"
        />
      </svg>
    </view>

    <!-- 选中详情 -->
    <view v-if="selected" class="macc-detail card-mystic anim-fade-up">
      <view class="d-head">
        <text class="dh-glyph">{{ selected.glyph }}</text>
        <view>
          <text class="dh-name" :style="{ color: selected.color }">{{ selected.name }}</text>
          <text class="dh-elem">· {{ selected.element }} · 力量 · {{ selected.power }}</text>
        </view>
      </view>
      <text class="d-meaning">{{ selected.meaning }}</text>
      <text class="d-desc">{{ selected.desc }}</text>
    </view>

    <!-- 13 天波符（高亮当前波符） -->
    <view class="macc-wave card-mystic">
      <text class="b-title title-mystic">13 天 波 符 · 灵 魂 轨 迹</text>
      <view class="wave-grid">
        <view
          v-for="(s, i) in wavespellGrid"
          :key="i"
          class="wave-cell"
          :class="{ 'is-today': s.today, 'is-active': s.inWavespell }"
        >
          <text class="wc-day">{{ i + 1 }}</text>
          <text class="wc-glyph" :style="{ color: MAYA_SEAL_META[s.seal].color }">
            {{ MAYA_SEAL_META[s.seal].glyph }}
          </text>
          <text class="wc-name">{{ s.seal }}</text>
        </view>
      </view>
    </view>

    <!-- 五维评分 -->
    <view class="macc-scores card-mystic">
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

    <!-- 元素分布 -->
    <view class="macc-elem card-mystic">
      <text class="b-title title-mystic">四 大 元 素 分 布</text>
      <view class="e-grid">
        <view
          v-for="(e, i) in elementStats"
          :key="i"
          class="e-cell"
          :class="{ dominant: e.isDominant }"
        >
          <text class="ec-name" :style="{ color: e.color }">{{ e.name }}</text>
          <text class="ec-count">{{ e.count }}</text>
          <text class="ec-frac">{{ e.frac }}%</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MAYA_SEAL_META, type MayaTzolkin, type MayaSeal } from '@zhanbu/logic/maya'
import { polar, uid } from '@guanxiang/logic/chart-utils'

const props = defineProps<{ result: MayaTzolkin }>()

const size = 480
const cx = size / 2
const cy = size / 2
const rSeal = 200
const rTone = 145
const sR = 28

const SEAL_LIST: MayaSeal[] = [
  '红龙',
  '白风',
  '蓝夜',
  '黄种子',
  '红蛇',
  '白世界桥',
  '蓝手',
  '黄星',
  '红月',
  '白狗',
  '蓝猴',
  '黄人',
  '红天行者',
  '白巫师',
  '蓝鹰',
  '黄战士',
  '红地球',
  '白镜',
  '蓝风暴',
  '黄太阳',
]

const sealList = computed(() =>
  SEAL_LIST.map((name, i) => {
    const angle = (360 / 20) * i - 90
    const p = polar(cx, cy, rSeal, angle)
    const meta = MAYA_SEAL_META[name]!
    return {
      name,
      x: p.x,
      y: p.y,
      glyph: meta.glyph,
      color: meta.color,
      element: meta.element,
      fill: name === props.result.seal ? 'rgba(212,175,55,0.25)' : 'rgba(20,20,28,0.5)',
      meaning: meta.meaning,
      power: meta.power,
      desc: meta.desc,
    }
  }),
)

const TONE_NAMES = [
  '磁性',
  '月亮',
  '电',
  '自我',
  '倍增',
  '韵律',
  '共振',
  '银河',
  '太阳',
  '行星',
  '光谱',
  '水晶',
  '宇宙',
]
const TONE_COLORS = [
  '#C8302A',
  '#E8E4D8',
  '#C8302A',
  '#D4AF37',
  '#1B3A5C',
  '#5B3A8E',
  '#4FAE6F',
  '#E8E4D8',
  '#D4AF37',
  '#A87C4F',
  '#5B3A8E',
  '#1B3A5C',
  '#8B1F1A',
]

const toneList = computed(() =>
  TONE_NAMES.map((name, i) => {
    const angle = (360 / 13) * i - 90
    const p = polar(cx, cy, rTone, angle)
    return { num: i + 1, name, x: p.x, y: p.y, color: TONE_COLORS[i] }
  }),
)

// 当前日主位置
const currentSealPos = computed(() => sealList.value.find((s) => s.name === props.result.seal))

// 选中
const selected = ref({ name: props.result.seal, ...MAYA_SEAL_META[props.result.seal] })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onSeal = (s: any) => {
  selected.value = { name: s.name, ...s }
}

// Kin 序列螺旋路径（13 螺旋）—— 简化：只画 1-13 的螺旋
const kinPath = computed(() => {
  const pts: string[] = []
  for (let i = 0; i < 13; i++) {
    const t = i / 12
    const r = 70 + t * 130
    const angle = t * 360 * 2.5 // 螺旋
    const p = polar(cx, cy, r, angle)
    pts.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
  }
  return pts.join(' ')
})

// 13 天波符（按当前 Kin 的 13 天）
const wavespellGrid = computed(() => {
  const wavespell = props.result.wavespell || []
  return Array.from({ length: 13 }, (_, i) => ({
    seal: wavespell[i] || '红龙',
    today: i + 1 === props.result.tone,
    inWavespell: !!wavespell[i],
  }))
})

const scoreList = computed(() => [
  { name: '事业', val: props.result.scores.career, color: '#D4AF37' },
  { name: '财帛', val: props.result.scores.wealth, color: '#C8302A' },
  { name: '感情', val: props.result.scores.relationship, color: '#E04A3A' },
  { name: '健康', val: props.result.scores.health, color: '#2F7D4F' },
  { name: '人际', val: props.result.scores.social, color: '#5B3A8E' },
])

const elementStats = computed(() => {
  const counts: Record<string, number> = { 火: 0, 土: 0, 风: 0, 水: 0 }
  sealList.value.forEach((s) => {
    counts[s.element] = (counts[s.element] || 0) + 1
  })
  const total = 20
  const ELEMENT_COLORS: Record<string, string> = {
    火: '#C8302A',
    土: '#A87C4F',
    风: '#E8E4D8',
    水: '#1B3A5C',
  }
  const arr = Object.entries(counts).map(([name, count]) => ({
    name,
    count,
    color: ELEMENT_COLORS[name],
    frac: Math.round((count / total) * 100),
    isDominant: false,
  }))
  const max = Math.max(...arr.map((a) => a.count))
  arr.forEach((a) => {
    a.isDominant = a.count === max
  })
  return arr
})
</script>

<style scoped>
.macc {
  padding: 8rpx;
}
.macc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.macc-svg {
  width: 100%;
  max-width: 540rpx;
  height: auto;
}
.seal-node {
  cursor: pointer;
  transition: transform 0.3s;
  transform-origin: center;
}
.seal-node:hover {
  transform: scale(1.15);
}
.seal-node.active circle {
  stroke: #d4af37 !important;
  stroke-width: 2.5;
}
.tone-node {
  pointer-events: none;
}
.macc-detail {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
}
.d-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}
.dh-glyph {
  font-size: 60rpx;
}
.dh-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  font-family: serif;
}
.dh-elem {
  display: block;
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-top: 4rpx;
}
.d-meaning {
  display: block;
  padding: 12rpx 0;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--color-bai, #f5f1e8);
}
.d-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--color-bai-2, #b8b2a0);
}
.macc-wave,
.macc-scores,
.macc-elem {
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
.wave-grid {
  display: grid;
  grid-template-columns: repeat(13, 1fr);
  gap: 4rpx;
}
.wave-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6rpx 2rpx;
  background: rgba(10, 10, 18, 0.4);
  border-radius: 4rpx;
}
.wave-cell.is-today {
  background: rgba(212, 175, 55, 0.25);
  border: 1rpx solid var(--color-liu, #d4af37);
  transform: scale(1.05);
}
.wc-day {
  font-size: 16rpx;
  color: var(--color-bai-3, #6b6655);
}
.wc-glyph {
  font-size: 24rpx;
  line-height: 1.2;
}
.wc-name {
  font-size: 16rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-top: 2rpx;
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
.e-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}
.e-cell {
  padding: 12rpx;
  background: rgba(10, 10, 18, 0.5);
  border-radius: 8rpx;
  text-align: center;
  border: 1rpx solid transparent;
}
.e-cell.dominant {
  border-color: var(--color-liu, #d4af37);
  background: rgba(212, 175, 55, 0.1);
}
.ec-name {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
  font-family: serif;
}
.ec-count {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  margin: 4rpx 0;
  font-family: serif;
}
.ec-frac {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-3, #6b6655);
}
</style>
