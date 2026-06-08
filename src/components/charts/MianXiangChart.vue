<template>
  <view class="mxc">
    <view class="mxc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="mxc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(212,175,55,0.18)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.9)" />
          </radialGradient>
          <linearGradient :id="uid('face')" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(245,241,232,0.15)" />
            <stop offset="100%" stop-color="rgba(168,124,79,0.15)" />
          </linearGradient>
          <filter :id="uid('g')">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#{{ uid('bg') }})" />

        <!-- 面部轮廓（简化：鹅蛋形） -->
        <ellipse
          :cx="cx"
          :cy="cy"
          :rx="faceR"
          :ry="faceR * 1.15"
          fill="url(#{{ uid('face') }})"
          stroke="rgba(212,175,55,0.5)"
          stroke-width="1"
        />

        <!-- 三停（横线） -->
        <line
          :x1="cx - faceR * 0.7"
          :y1="cy - faceR * 0.4"
          :x2="cx + faceR * 0.7"
          :y2="cy - faceR * 0.4"
          stroke="rgba(212,175,55,0.3)"
          stroke-width="0.5"
          stroke-dasharray="2 2"
        />
        <line
          :x1="cx - faceR * 0.7"
          :y1="cy"
          :x2="cx + faceR * 0.7"
          :y2="cy"
          stroke="rgba(212,175,55,0.3)"
          stroke-width="0.5"
          stroke-dasharray="2 2"
        />
        <line
          :x1="cx - faceR * 0.7"
          :y1="cy + faceR * 0.4"
          :x2="cx + faceR * 0.7"
          :y2="cy + faceR * 0.4"
          stroke="rgba(212,175,55,0.3)"
          stroke-width="0.5"
          stroke-dasharray="2 2"
        />

        <!-- 五官 -->
        <text :x="cx - 36" :y="cy - 10" font-size="20" fill="#F5F1E8" font-family="serif">目</text>
        <text :x="cx + 24" :y="cy - 10" font-size="20" fill="#F5F1E8" font-family="serif">目</text>
        <text
          :x="cx"
          :y="cy + 6"
          text-anchor="middle"
          font-size="16"
          fill="#F5F1E8"
          font-family="serif"
        >
          鼻
        </text>
        <text
          :x="cx"
          :y="cy + 28"
          text-anchor="middle"
          font-size="14"
          fill="#F5F1E8"
          font-family="serif"
        >
          口
        </text>

        <!-- 12 宫位标签 -->
        <g
          v-for="(p, i) in points"
          :key="i"
          class="mxp"
          :class="{ active: selected === p.key }"
          @click="selected = p.key"
        >
          <circle
            :cx="p.x"
            :cy="p.y"
            :r="p.r"
            :fill="selected === p.key ? 'rgba(212,175,55,0.3)' : 'rgba(91,58,142,0.3)'"
            :stroke="selected === p.key ? '#D4AF37' : 'rgba(212,175,55,0.5)'"
            stroke-width="1"
            :filter="`url(#${uid('g')})`"
          />
          <text
            :x="p.x"
            :y="p.y + 4"
            text-anchor="middle"
            font-size="13"
            font-weight="bold"
            fill="#D4AF37"
            font-family="serif"
          >
            {{ p.label }}
          </text>
        </g>
      </svg>
    </view>

    <!-- 选中宫位 -->
    <view v-if="selectedPoint" class="mxc-detail card-mystic">
      <view class="d-head">
        <text class="dh-label">{{ selectedPoint.label }}宫</text>
        <text class="dh-name">{{ selectedPoint.name }}</text>
      </view>
      <text class="d-desc">{{ selectedPoint.desc }}</text>
      <view class="d-meta">
        <view class="dm-row">
          <text class="dmr-l">主：</text><text class="dmr-v">{{ selectedPoint.zhu }}</text>
        </view>
        <view class="dm-row">
          <text class="dmr-l">应：</text><text class="dmr-v">{{ selectedPoint.ying }}</text>
        </view>
        <view class="dm-row">
          <text class="dmr-l">吉相：</text><text class="dmr-v">{{ selectedPoint.jixiang }}</text>
        </view>
      </view>
    </view>

    <!-- 12 宫列表 -->
    <view class="mxc-list card-mystic">
      <text class="b-title title-mystic">十 二 宫 位 全 览</text>
      <view class="l-grid">
        <view
          v-for="(p, i) in points"
          :key="i"
          class="l-cell"
          :class="{ active: selected === p.key }"
          @click="selected = p.key"
        >
          <text class="lc-label">{{ p.label }}宫</text>
          <text class="lc-name">{{ p.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { uid } from '@/utils/chart-utils'

interface MxPoint {
  key: string
  label: string
  name: string
  x: number
  y: number
  r: number
  desc: string
  zhu: string
  ying: string
  jixiang: string
}

const size = 360
const cx = size / 2
const cy = size / 2
const faceR = 130

const points = ref<MxPoint[]>([
  {
    key: 'ming',
    label: '命',
    name: '命宫',
    x: cx,
    y: cy - faceR * 1.05,
    r: 22,
    desc: '命宫位居印堂，主一生命格与整体运势',
    zhu: '意志 · 性格',
    ying: '整体命运',
    jixiang: '光润平满',
  },
  {
    key: 'cai',
    label: '财',
    name: '财帛宫',
    x: cx + faceR * 1.1,
    y: cy - faceR * 0.5,
    r: 20,
    desc: '财帛宫在鼻准头，主财富与理财能力',
    zhu: '财富 · 物质',
    ying: '理财能力',
    jixiang: '鼻丰隆正',
  },
  {
    key: 'guan',
    label: '官',
    name: '官禄宫',
    x: cx,
    y: cy - faceR * 0.6,
    r: 20,
    desc: '官禄宫在印堂上中，主事业与地位',
    zhu: '事业 · 地位',
    ying: '职场运势',
    jixiang: '光润分明',
  },
  {
    key: 'fu',
    label: '福',
    name: '福德宫',
    x: cx + faceR * 1.05,
    y: cy,
    r: 20,
    desc: '福德宫在眉尾上方天仓处，主精神与祖德',
    zhu: '精神 · 福气',
    ying: '祖荫德泽',
    jixiang: '天仓地库饱满',
  },
  {
    key: 'qin',
    label: '亲',
    name: '父母宫',
    x: cx - faceR * 1.1,
    y: cy - faceR * 0.5,
    r: 20,
    desc: '父母宫在日月角，主与父母之关系',
    zhu: '亲情 · 父母',
    ying: '长辈助力',
    jixiang: '高圆无破',
  },
  {
    key: 'lu',
    label: '奴',
    name: '奴仆宫',
    x: cx - faceR * 1.15,
    y: cy + faceR * 0.4,
    r: 20,
    desc: '奴仆宫在地阁两侧，主下属与交友',
    zhu: '交友 · 下属',
    ying: '人际和谐',
    jixiang: '地阁朝天',
  },
  {
    key: 'ji',
    label: '疾',
    name: '疾厄宫',
    x: cx,
    y: cy + faceR * 0.3,
    r: 20,
    desc: '疾厄宫在山根连鼻梁，主健康与灾厄',
    zhu: '健康 · 灾厄',
    ying: '身体状况',
    jixiang: '山根挺直',
  },
  {
    key: 'qian',
    label: '迁',
    name: '迁移宫',
    x: cx + faceR * 1.1,
    y: cy + faceR * 0.4,
    r: 20,
    desc: '迁移宫在眉角上外，主出行与远迁',
    zhu: '出行 · 迁移',
    ying: '异地运势',
    jixiang: '驿马高起',
  },
  {
    key: 'fu2',
    label: '夫',
    name: '夫妻宫',
    x: cx + faceR * 0.5,
    y: cy - faceR * 0.15,
    r: 20,
    desc: '夫妻宫在鱼尾奸门处，主婚姻与配偶',
    zhu: '婚姻 · 配偶',
    ying: '感情运势',
    jixiang: '纹痣清朗',
  },
  {
    key: 'zi',
    label: '子',
    name: '子女宫',
    x: cx - faceR * 0.5,
    y: cy - faceR * 0.15,
    r: 20,
    desc: '子女宫在泪堂卧蚕处，主子嗣与晚运',
    zhu: '子嗣 · 晚运',
    ying: '后代缘分',
    jixiang: '卧蚕明润',
  },
  {
    key: 'jie',
    label: '兄',
    name: '兄弟宫',
    x: cx - faceR * 0.5,
    y: cy - faceR * 0.5,
    r: 20,
    desc: '兄弟宫在眉形，主兄弟姐妹之缘',
    zhu: '兄弟 · 朋友',
    ying: '手足之情',
    jixiang: '眉清目秀',
  },
  {
    key: 'tian',
    label: '田',
    name: '田宅宫',
    x: cx - faceR * 1.1,
    y: cy,
    r: 20,
    desc: '田宅宫在眼睑，主家宅与不动产',
    zhu: '家宅 · 产业',
    ying: '居住运势',
    jixiang: '眼如卧龙',
  },
])

const selected = ref<string | null>('ming')
const selectedPoint = computed(() => points.value.find((p) => p.key === selected.value) || null)
</script>

<style scoped>
.mxc {
  padding: 8rpx;
}
.mxc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.mxc-svg {
  width: 100%;
  max-width: 480rpx;
  height: auto;
}
.mxp {
  cursor: pointer;
  transition: all 0.2s;
}
.mxp:hover {
  transform: scale(1.1);
  transform-origin: center;
}
.mxc-detail {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
}
.d-head {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  padding-bottom: 8rpx;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}
.dh-label {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
.dh-name {
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
}
.d-desc {
  display: block;
  padding: 12rpx 0;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--color-bai, #f5f1e8);
}
.d-meta {
  padding-top: 8rpx;
  border-top: 1rpx dashed rgba(212, 175, 55, 0.2);
}
.dm-row {
  display: flex;
  padding: 4rpx 0;
  font-size: 24rpx;
}
.dmr-l {
  color: var(--color-bai-3, #6b6655);
  width: 120rpx;
}
.dmr-v {
  color: var(--color-bai, #f5f1e8);
}
.mxc-list {
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
.l-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8rpx;
}
.l-cell {
  padding: 12rpx 8rpx;
  background: rgba(10, 10, 18, 0.5);
  border-radius: 8rpx;
  text-align: center;
  border: 1rpx solid transparent;
}
.l-cell.active {
  border-color: var(--color-liu, #d4af37);
  background: rgba(212, 175, 55, 0.1);
}
.lc-label {
  display: block;
  font-size: 22rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
.lc-name {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-top: 2rpx;
}
</style>
