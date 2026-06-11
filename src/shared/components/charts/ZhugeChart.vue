<!--
  玄枢 MISTVERSE · 诸葛神数 384 签可视化
  - 签号大字 + 签级 + 卦象
  - 签诗楷体 + 5 维雷达
-->
<template>
  <view class="zgc">
    <view class="zgc-hero card-mystic">
      <view class="zh-top">
        <text class="zh-num-label">第</text>
        <text class="zh-num">{{ qian.num }}</text>
        <text class="zh-num-label">签</text>
      </view>
      <view class="zh-mid">
        <text class="zh-gua">{{ qian.gua }}卦</text>
        <view
          class="zh-level"
          :style="{ background: levelBg(qian.level), borderColor: levelColor(qian.level) }"
        >
          <text class="zh-lv" :style="{ color: levelColor(qian.level) }">{{ qian.level }}</text>
        </view>
      </view>
      <text class="zh-title">{{ qian.title }}</text>
    </view>

    <view class="zgc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="zgc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" :stop-color="levelHex(qian.level, 0.18)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.9)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#{{ uid('bg') }})" />

        <!-- 5 维雷达多边形 -->
        <polygon
          :points="radarPoints"
          :stroke="levelColor(qian.level)"
          stroke-width="2"
          :fill="levelHex(qian.level, 0.2)"
        />
        <polygon
          v-for="(rp, i) in radarGrids"
          :key="i"
          :points="rp"
          stroke="rgba(212,175,55,0.18)"
          stroke-width="0.8"
          fill="none"
        />
        <line
          v-for="(axis, i) in axes"
          :key="'ax-' + i"
          :x1="cx"
          :y1="cy"
          :x2="axis.x"
          :y2="axis.y"
          stroke="rgba(212,175,55,0.25)"
          stroke-width="0.8"
        />
        <text
          v-for="(axis, i) in axes"
          :key="'lb-' + i"
          :x="axis.lx"
          :y="axis.ly"
          text-anchor="middle"
          font-size="14"
          :fill="THEME.fg"
          font-family="serif"
          font-weight="bold"
        >
          {{ axis.label }}
        </text>
        <circle
          v-for="(pt, i) in radarPointsArr"
          :key="'pt-' + i"
          :cx="pt.x"
          :cy="pt.y"
          r="4"
          :fill="levelColor(qian.level)"
        />
        <text
          v-for="(axis, i) in axes"
          :key="'vl-' + i"
          :x="axis.vx"
          :y="axis.vy"
          text-anchor="middle"
          font-size="10"
          :fill="THEME.liu"
          font-family="serif"
        >
          {{ values[i] }}
        </text>
      </svg>
    </view>

    <view class="zgc-card card-mystic">
      <text class="zc-poem">{{ qian.poem }}</text>
      <text class="zc-jie">解：{{ qian.jie }}</text>
    </view>

    <view class="zgc-detail card-mystic">
      <text class="b-title title-mystic">各 签 详 解</text>
      <view class="zd-row">
        <text class="zr-l">事业</text><text class="zr-v">{{ qian.career }}</text>
      </view>
      <view class="zd-row">
        <text class="zr-l">求财</text><text class="zr-v">{{ qian.wealth }}</text>
      </view>
      <view class="zd-row">
        <text class="zr-l">婚姻</text><text class="zr-v">{{ qian.marriage }}</text>
      </view>
      <view class="zd-row">
        <text class="zr-l">疾病</text><text class="zr-v">{{ qian.health }}</text>
      </view>
      <view class="zd-row">
        <text class="zr-l">出行</text><text class="zr-v">{{ qian.travel }}</text>
      </view>
    </view>

    <view class="zgc-score card-mystic">
      <text class="b-title title-mystic">总 评</text>
      <view class="zs-bar">
        <view
          class="zs-fill"
          :style="{ width: qian.score + '%', background: levelColor(qian.level) }"
        />
      </view>
      <text class="zs-val" :style="{ color: levelColor(qian.level) }">
        {{ qian.score }} 分 · {{ qian.level }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { polar, uid, THEME, levelColor } from '@guanxiang/logic/chart-utils'
import type { ZhugeQian } from '@zhanbu/logic/zhuge'

const props = defineProps<{ qian: ZhugeQian }>()

const size = 420
const cx = size / 2
const cy = size / 2
const r = 130

function levelHex(level: string, alpha: number): string {
  const c = levelColor(level)
  // 提取 hex → rgba
  const r0 = parseInt(c.slice(1, 3), 16)
  const g0 = parseInt(c.slice(3, 5), 16)
  const b0 = parseInt(c.slice(5, 7), 16)
  return `rgba(${r0},${g0},${b0},${alpha})`
}
function levelBg(level: string): string {
  return levelHex(level, 0.18)
}

const values = computed(() => [
  props.qian.scores.career,
  props.qian.scores.wealth,
  props.qian.scores.relationship,
  props.qian.scores.health,
  props.qian.scores.social,
])

const labels = ['事业', '求财', '人际', '健康', '社交']

const axes = computed(() => {
  return labels.map((label, i) => {
    const angle = -90 + i * 72
    const end = polar(cx, cy, r, angle)
    const lp = polar(cx, cy, r + 18, angle)
    const vp = polar(cx, cy, r - 18, angle)
    return { label, x: end.x, y: end.y, lx: lp.x, ly: lp.y + 4, vx: vp.x, vy: vp.y + 4 }
  })
})

const radarPointsArr = computed(() =>
  values.value.map((v, i) => {
    const angle = -90 + i * 72
    return polar(cx, cy, (v / 100) * r, angle)
  }),
)

const radarPoints = computed(() => radarPointsArr.value.map((p) => `${p.x},${p.y}`).join(' '))

const radarGrids = computed(() => {
  return [0.25, 0.5, 0.75, 1].map((scale) => {
    return labels
      .map((_, i) => {
        const p = polar(cx, cy, r * scale, -90 + i * 72)
        return `${p.x},${p.y}`
      })
      .join(' ')
  })
})
</script>

<style scoped>
.zgc {
  padding: 8rpx;
}
.zgc-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 24rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, rgba(212, 175, 55, 0.12), rgba(20, 20, 28, 0.5));
  border: 2rpx solid rgba(212, 175, 55, 0.3);
  margin-bottom: 16rpx;
}
.zh-top {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}
.zh-num {
  font-size: 80rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
  line-height: 1;
}
.zh-num-label {
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
  font-family: serif;
}
.zh-mid {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}
.zh-gua {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.zh-level {
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  border: 1rpx solid;
}
.zh-lv {
  font-size: 24rpx;
  font-weight: bold;
  font-family: serif;
}
.zh-title {
  font-size: 30rpx;
  color: var(--color-bai, #f5f1e8);
  margin-top: 12rpx;
  font-family: serif;
  letter-spacing: 4rpx;
}
.zgc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.zgc-svg {
  width: 100%;
  max-width: 420rpx;
  height: auto;
}
.zgc-card,
.zgc-detail,
.zgc-score {
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
}
.zc-poem {
  display: block;
  font-size: 32rpx;
  line-height: 1.6;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
  letter-spacing: 2rpx;
  text-align: center;
  padding: 12rpx 0;
}
.zc-jie {
  display: block;
  font-size: 24rpx;
  color: var(--color-liu, #d4af37);
  text-align: center;
  padding-top: 8rpx;
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
.zd-row {
  display: flex;
  padding: 6rpx 0;
  border-bottom: 1rpx dashed rgba(212, 175, 55, 0.15);
}
.zd-row:last-child {
  border-bottom: none;
}
.zr-l {
  width: 100rpx;
  font-size: 24rpx;
  color: var(--color-bai-3, #6b6655);
}
.zr-v {
  flex: 1;
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
  line-height: 1.5;
}
.zs-bar {
  height: 16rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8rpx;
  overflow: hidden;
  margin: 8rpx 0 12rpx;
}
.zs-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.6s;
}
.zs-val {
  display: block;
  text-align: right;
  font-size: 28rpx;
  font-weight: bold;
  font-family: serif;
}
</style>
