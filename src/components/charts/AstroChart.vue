<template>
  <view class="asc">
    <view class="asc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="asc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(91,58,142,0.25)" />
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

        <!-- 12 宫环（外环：星座） -->
        <g v-for="(s, i) in zodiacSectors" :key="i">
          <path :d="s.d" :fill="s.color" :opacity="s.opacity" />
          <text
            :x="s.textX"
            :y="s.textY"
            text-anchor="middle"
            font-size="20"
            :fill="i === ascIndex ? '#D4AF37' : '#F5F1E8'"
            font-weight="bold"
            font-family="serif"
          >
            {{ s.glyph }}
          </text>
          <text
            :x="s.nameX"
            :y="s.nameY"
            text-anchor="middle"
            font-size="9"
            fill="#B8B2A0"
            font-family="serif"
          >
            {{ s.name }}
          </text>
        </g>

        <!-- 12 宫分割线 -->
        <line
          v-for="(l, i) in sectorLines"
          :key="'l' + i"
          :x1="l.x1"
          :y1="l.y1"
          :x2="l.x2"
          :y2="l.y2"
          stroke="rgba(212,175,55,0.3)"
          stroke-width="0.5"
        />

        <!-- 12 宫位（黄道宫）数字 -->
        <g v-for="(h, i) in houses" :key="'h' + i">
          <text
            :x="h.x"
            :y="h.y"
            text-anchor="middle"
            font-size="11"
            fill="rgba(212,175,55,0.4)"
            font-family="serif"
          >
            {{ i + 1 }}
          </text>
        </g>

        <!-- 相位线 -->
        <g class="aspects">
          <line
            v-for="(a, i) in aspectLines"
            :key="'a' + i"
            :x1="a.x1"
            :y1="a.y1"
            :x2="a.x2"
            :y2="a.y2"
            :stroke="a.color"
            :stroke-width="a.width"
            :opacity="a.opacity"
            :stroke-dasharray="a.dashed ? '3 3' : 'none'"
          />
        </g>

        <!-- 行星 -->
        <g v-for="(p, i) in planetMarkers" :key="'p' + i" class="planet" @click="selectPlanet(p)">
          <circle
            :cx="p.x"
            :cy="p.y"
            :r="14"
            :fill="p.isBigThree ? 'rgba(212,175,55,0.2)' : 'rgba(20,20,28,0.85)'"
            :stroke="p.color"
            :stroke-width="p.isBigThree ? 2 : 1.2"
            :filter="`url(#${uid('g')})`"
          />
          <text
            :x="p.x"
            :y="p.y + 4"
            text-anchor="middle"
            font-size="13"
            font-weight="bold"
            :fill="p.color"
            font-family="serif"
          >
            {{ p.glyph }}
          </text>
          <!-- 逆行标记 -->
          <text
            v-if="p.retrograde"
            :x="p.x + 16"
            :y="p.y - 8"
            font-size="9"
            fill="#C8302A"
            font-weight="bold"
          >
            ℞
          </text>
        </g>

        <!-- 中心大十字 -->
        <line
          :x1="cx"
          :y1="rInner"
          :x2="cx"
          :y2="size - rInner"
          stroke="rgba(212,175,55,0.15)"
          stroke-width="0.5"
        />
        <line
          :x1="rInner"
          :y1="cy"
          :x2="size - rInner"
          :y2="cy"
          stroke="rgba(212,175,55,0.15)"
          stroke-width="0.5"
        />
      </svg>
    </view>

    <!-- Big Three 概览 -->
    <view class="asc-bt">
      <view
        v-for="(bt, i) in bigThree"
        :key="i"
        class="bt-card"
        :style="{ borderColor: bt.meta.color }"
      >
        <text class="bt-label">{{ bt.label }}</text>
        <text class="bt-name" :style="{ color: bt.meta.color }">{{ bt.sign }}</text>
        <text class="bt-glyph">{{ bt.meta.glyph }}</text>
        <text class="bt-arc">
          {{ bt.meta.archetype }} · {{ bt.meta.element }}{{ bt.meta.quality }}
        </text>
      </view>
    </view>

    <!-- 行星详情 -->
    <view v-if="selectedP" class="asc-pdetail card-mystic anim-fade-up">
      <view class="pd-head">
        <text class="pdh-name" :style="{ color: selectedP.color }">{{ selectedP.name }}</text>
        <text class="pdh-sign">{{ selectedP.sign }} · {{ selectedP.signMeta.glyph }}</text>
      </view>
      <text class="pd-meaning">{{ selectedP.meaning }}</text>
      <text class="pd-meta">{{ selectedP.signMeta.desc }}</text>
      <view class="pd-row">
        <text class="pdr-l">守护星：</text><text class="pdr-v">{{ selectedP.signMeta.ruler }}</text>
      </view>
      <view class="pd-row">
        <text class="pdr-l">对宫：</text><text class="pdr-v">{{ selectedP.signMeta.polar }}</text>
      </view>
      <view class="pd-row">
        <text class="pdr-l">对应身体：</text
        ><text class="pdr-v">{{ selectedP.signMeta.bodyPart }}</text>
      </view>
      <view v-if="selectedP.retrograde" class="pd-retro">⚠ 当前逆行 · 内省与重新审视</view>
    </view>

    <!-- 主导元素 -->
    <view class="asc-elem card-mystic">
      <text class="b-title title-mystic">主 导 元 素 与 性 质</text>
      <view class="elem-grid">
        <view
          v-for="(e, i) in elementStats"
          :key="i"
          class="e-cell"
          :class="{ dominant: e.name === dominantElement }"
        >
          <text class="ec-name" :style="{ color: e.color }">{{ e.name }}</text>
          <text class="ec-count">{{ e.count }}</text>
          <view class="ec-bar">
            <view class="ec-fill" :style="{ width: e.percent + '%', background: e.color }" />
          </view>
        </view>
      </view>
      <view class="qual-row">
        <text class="qr-l">主导性质：</text>
        <text class="qr-v" :style="{ color: '#D4AF37' }">{{ dominantQuality }}</text>
      </view>
    </view>

    <!-- 行星列表 -->
    <view class="asc-list card-mystic">
      <text class="b-title title-mystic">行 星 与 宫 位</text>
      <view
        v-for="(p, i) in result.planets"
        :key="i"
        class="pl-row"
        @click="selectPlanetByName(p.name)"
      >
        <text class="plr-name" :style="{ color: ZODIAC_META[p.sign].color }">{{ p.name }}</text>
        <text class="plr-sign">{{ p.sign }}</text>
        <text v-if="p.retrograde" class="plr-retro">逆行</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ZODIAC_META,
  type AstroResult,
  type AstroPlanet as _AstroPlanet,
  type Zodiac,
} from '@/utils/astro'
import { ringSectorPath, polar, uid } from '@/utils/chart-utils'

const props = defineProps<{ result: AstroResult }>()

const size = 720
const cx = size / 2
const cy = size / 2
const rOuter = 320
const rMid = 240
const rInner = 140
const rPlanet = 195

const ZODIAC_LIST: Zodiac[] = [
  '白羊',
  '金牛',
  '双子',
  '巨蟹',
  '狮子',
  '处女',
  '天秤',
  '天蝎',
  '射手',
  '摩羯',
  '水瓶',
  '双鱼',
]

// 上升星座索引
const ascIndex = computed(() => ZODIAC_LIST.indexOf(props.result.rising))

// 12 星座扇形（从上升开始）
const zodiacSectors = computed(() => {
  const arr: Array<{
    d: string
    color: string
    opacity: number
    glyph: string
    name: string
    textX: number
    textY: number
    nameX: number
    nameY: number
  }> = []
  const sectorSize = 360 / 12
  for (let i = 0; i < 12; i++) {
    const signIdx = (ascIndex.value + i) % 12
    const sign = ZODIAC_LIST[signIdx]!
    const meta = ZODIAC_META[sign]!
    const startDeg = -90 + i * sectorSize + 2
    const endDeg = -90 + (i + 1) * sectorSize - 2
    const d = ringSectorPath(cx, cy, rOuter, rMid, startDeg, endDeg)
    const textP = polar(cx, cy, (rOuter + rMid) / 2, -90 + (i + 0.5) * sectorSize)
    const nameP = polar(cx, cy, rMid - 16, -90 + (i + 0.5) * sectorSize)
    arr.push({
      d,
      color: meta.color,
      opacity: 0.18,
      glyph: meta.glyph,
      name: sign,
      textX: textP.x,
      textY: textP.y,
      nameX: nameP.x,
      nameY: nameP.y,
    })
  }
  return arr
})

// 12 宫分割线
const sectorLines = computed(() => {
  const arr: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  for (let i = 0; i < 12; i++) {
    const deg = -90 + i * 30
    const p1 = polar(cx, cy, rInner, deg)
    const p2 = polar(cx, cy, rOuter, deg)
    arr.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
  }
  return arr
})

// 12 宫位数字
const houses = computed(() => {
  return Array.from({ length: 12 }, (_, i) => {
    const deg = -90 + (i + 0.5) * 30
    const p = polar(cx, cy, rInner - 25, deg)
    return { x: p.x, y: p.y + 4 }
  })
})

// 行星位置
const planetMarkers = computed(() => {
  return props.result.planets.map((p, i) => {
    const signIdx = ZODIAC_LIST.indexOf(p.sign)
    // 计算在 12 宫位中的角度（每宫 30°）
    // 简化：每颗行星分散在 30° 内不同位置
    const baseDeg = -90 + ((signIdx - ascIndex.value + 12) % 12) * 30
    const offset = ((i % 4) - 1.5) * 6 // 错开避免重叠
    const deg = baseDeg + offset
    const pos = polar(cx, cy, rPlanet, deg)
    const _isBigThree =
      ['太阳', '月亮', '上升'].includes(p.name) || (p.name === props.result.sun && false)
    const GLYPH: Record<string, string> = {
      太阳: '☉',
      月亮: '☽',
      水星: '☿',
      金星: '♀',
      火星: '♂',
      木星: '♃',
      土星: '♄',
      天王: '♅',
      海王: '♆',
      冥王: '♇',
    }
    return {
      ...p,
      x: pos.x,
      y: pos.y,
      glyph: GLYPH[p.name] || '?',
      color: ZODIAC_META[p.sign].color,
      signMeta: ZODIAC_META[p.sign],
      retrograde: p.retrograde,
      isBigThree: p.name === '太阳' || p.name === '月亮',
    }
  })
})

// 相位线（简化：每两颗星画一条，亮度按元素共鸣度）
const aspectLines = computed(() => {
  const arr: Array<{
    x1: number
    y1: number
    x2: number
    y2: number
    color: string
    width: number
    opacity: number
    dashed: boolean
  }> = []
  const markers = planetMarkers.value
  for (let i = 0; i < markers.length; i++) {
    for (let j = i + 1; j < markers.length; j++) {
      const a = markers[i]!,
        b = markers[j]
      const ea = a.signMeta.element
      const eb = b.signMeta.element
      if (ea === eb) {
        // 同元素：合相
        arr.push({
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          color: '#D4AF37',
          width: 1,
          opacity: 0.6,
          dashed: false,
        })
      }
    }
  }
  return arr.slice(0, 12) // 限制数量
})

const bigThree = computed(() => props.result.bigThree)
const dominantElement = computed(() => props.result.dominantElement)

const dominantQuality = computed(() => props.result.dominantQuality)

const elementStats = computed(() => {
  const el = props.result.elementCounts
  const max = Math.max(...Object.values(el), 1)
  const colors: Record<string, string> = {
    火: '#C8302A',
    土: '#A87C4F',
    风: '#D4AF37',
    水: '#1B3A5C',
  }
  return Object.entries(el).map(([name, count]) => ({
    name,
    count,
    color: colors[name],
    percent: (count / max) * 100,
  }))
})

// 选中行星
const selectedPIdx = ref(-1)
const selectedP = computed(() => {
  if (selectedPIdx.value < 0) return null
  return planetMarkers.value[selectedPIdx.value]
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectPlanet = (p: any) => {
  const idx = planetMarkers.value.findIndex((x) => x.name === p.name)
  selectedPIdx.value = idx
}
const selectPlanetByName = (name: string) => {
  const idx = planetMarkers.value.findIndex((x) => x.name === name)
  selectedPIdx.value = idx
}
</script>

<style scoped>
.asc {
  padding: 8rpx;
}
.asc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.asc-svg {
  width: 100%;
  max-width: 720rpx;
  height: auto;
}
.planet {
  cursor: pointer;
  transition: all 0.2s;
}
.planet:hover {
  transform: scale(1.2);
}
.asc-bt {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}
.bt-card {
  padding: 16rpx;
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid;
  border-radius: 12rpx;
  text-align: center;
}
.bt-label {
  display: block;
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.bt-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  font-family: serif;
  margin-top: 4rpx;
}
.bt-glyph {
  display: block;
  font-size: 36rpx;
  font-family: serif;
}
.bt-arc {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-3, #6b6655);
  margin-top: 4rpx;
}
.asc-pdetail {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
}
.pd-head {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  padding-bottom: 8rpx;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}
.pdh-name {
  font-size: 36rpx;
  font-weight: bold;
  font-family: serif;
}
.pdh-sign {
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.pd-meaning {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: var(--color-bai, #f5f1e8);
}
.pd-meta {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--color-bai-2, #b8b2a0);
}
.pd-row {
  display: flex;
  padding: 4rpx 0;
  font-size: 24rpx;
}
.pdr-l {
  color: var(--color-bai-3, #6b6655);
  width: 140rpx;
}
.pdr-v {
  color: var(--color-bai, #f5f1e8);
}
.pd-retro {
  margin-top: 8rpx;
  padding: 8rpx 12rpx;
  background: rgba(200, 48, 42, 0.15);
  border-radius: 6rpx;
  font-size: 22rpx;
  color: var(--color-zhu, #c8302a);
}
.asc-elem {
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
  margin-bottom: 16rpx;
  font-family: serif;
}
.elem-grid {
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
.ec-bar {
  height: 6rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3rpx;
  overflow: hidden;
  margin-top: 4rpx;
}
.ec-fill {
  height: 100%;
  transition: width 0.6s;
}
.qual-row {
  margin-top: 12rpx;
  padding: 12rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 8rpx;
}
.qr-l {
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.qr-v {
  font-size: 28rpx;
  font-weight: bold;
  font-family: serif;
  margin-left: 8rpx;
}
.asc-list {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
}
.pl-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 10rpx 12rpx;
  border-radius: 6rpx;
  transition: all 0.2s;
}
.pl-row:active {
  background: rgba(212, 175, 55, 0.1);
}
.plr-name {
  width: 100rpx;
  font-size: 26rpx;
  font-weight: bold;
  font-family: serif;
}
.plr-sign {
  flex: 1;
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
}
.plr-retro {
  padding: 2rpx 8rpx;
  background: var(--color-zhu, #c8302a);
  color: var(--color-bai, #f5f1e8);
  font-size: 18rpx;
  border-radius: 4rpx;
}
</style>
