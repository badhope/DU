<template>
  <view class="sxc">
    <view class="sxc-canvas">
      <svg :viewBox="`0 0 ${size} ${size}`" class="sxc-svg">
        <defs>
          <radialGradient :id="uid('bg')" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(212,175,55,0.18)" />
            <stop offset="100%" stop-color="rgba(10,10,18,0.9)" />
          </radialGradient>
          <linearGradient :id="uid('palm')" x1="0" y1="0" x2="0" y2="1">
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

        <!-- 手掌轮廓 -->
        <path
          :d="palmPath"
          fill="url(#{{ uid('palm') }})"
          stroke="rgba(212,175,55,0.5)"
          stroke-width="1"
        />

        <!-- 手指分隔 -->
        <line
          v-for="f in fingerLines"
          :key="f.id"
          :x1="f.x1"
          :y1="f.y1"
          :x2="f.x2"
          :y2="f.y2"
          stroke="rgba(212,175,55,0.25)"
          stroke-width="0.5"
          stroke-dasharray="2 2"
        />

        <!-- 三主线 -->
        <g
          v-for="l in lines"
          :key="l.key"
          class="sx-line"
          :class="{ active: selected === l.key }"
          @click="selected = l.key"
        >
          <path
            :d="l.d"
            :stroke="selected === l.key ? '#D4AF37' : l.color"
            stroke-width="2.5"
            fill="none"
            stroke-linecap="round"
            :filter="`url(#${uid('g')})`"
          />
          <text
            :x="l.lx"
            :y="l.ly"
            font-size="13"
            font-weight="bold"
            :fill="selected === l.key ? '#D4AF37' : l.color"
            font-family="serif"
          >
            {{ l.name }}
          </text>
        </g>

        <!-- 八宫丘 -->
        <g
          v-for="m in mounts"
          :key="m.key"
          class="sx-mount"
          :class="{ active: selectedMount === m.key }"
          @click="selectedMount = m.key"
        >
          <circle
            :cx="m.x"
            :cy="m.y"
            r="14"
            :fill="selectedMount === m.key ? 'rgba(212,175,55,0.25)' : 'rgba(91,58,142,0.18)'"
            :stroke="selectedMount === m.key ? '#D4AF37' : 'rgba(212,175,55,0.4)'"
            stroke-width="1"
          />
          <text
            :x="m.x"
            :y="m.y + 4"
            text-anchor="middle"
            font-size="10"
            font-weight="bold"
            fill="#D4AF37"
            font-family="serif"
          >
            {{ m.label }}
          </text>
        </g>
      </svg>
    </view>

    <!-- 选中主线 -->
    <view v-if="selectedLine" class="sxc-line card-mystic">
      <view class="d-head">
        <text class="dh-label">{{ selectedLine.name }}</text>
        <text class="dh-desc">{{ selectedLine.subdesc }}</text>
      </view>
      <text class="d-text">{{ selectedLine.desc }}</text>
    </view>

    <!-- 选中丘 -->
    <view v-if="selectedMountData" class="sxc-mount card-mystic">
      <view class="d-head">
        <text class="dh-label">{{ selectedMountData.label }}丘</text>
        <text class="dh-name">{{ selectedMountData.name }}</text>
      </view>
      <text class="d-text">{{ selectedMountData.desc }}</text>
    </view>

    <!-- 八宫丘列表 -->
    <view class="sxc-mlist card-mystic">
      <text class="b-title title-mystic">八 宫 丘 解 读</text>
      <view class="ml-grid">
        <view
          v-for="m in mounts"
          :key="m.key"
          class="ml-cell"
          :class="{ active: selectedMount === m.key }"
          @click="selectedMount = m.key"
        >
          <text class="mlc-label">{{ m.label }}丘</text>
          <text class="mlc-name">{{ m.name }}</text>
          <text class="mlc-desc">{{ m.brief }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { uid } from '@guanxiang/logic/chart-utils'

const size = 360
const cx = size / 2

// 简化手掌：左上指、右上指、左下掌、右下掌的椭圆
const palmPath = `M ${cx - 60} 60 Q ${cx - 80} 80 ${cx - 80} ${cx + 20} Q ${cx - 90} ${cx + 90} ${cx - 40} ${cx + 120} Q ${cx} ${cx + 130} ${cx + 40} ${cx + 120} Q ${cx + 90} ${cx + 90} ${cx + 80} ${cx + 20} Q ${cx + 80} 80 ${cx + 60} 60 Q ${cx + 30} 30 ${cx} 30 Q ${cx - 30} 30 ${cx - 60} 60 Z`

// 手指分隔线（4 条）
const fingerLines = [
  { id: 0, x1: cx - 60, y1: 50, x2: cx - 30, y2: 50 },
  { id: 1, x1: cx - 30, y1: 35, x2: cx, y2: 35 },
  { id: 2, x1: cx, y1: 35, x2: cx + 30, y2: 35 },
  { id: 3, x1: cx + 30, y1: 50, x2: cx + 60, y2: 50 },
]

// 三主线
const lines = [
  {
    key: 'life',
    name: '生命线',
    subdesc: '主健康与寿命',
    color: '#C8302A',
    d: `M ${cx - 50} 70 Q ${cx - 70} ${cx + 30} ${cx - 30} ${cx + 110}`,
    lx: cx - 80,
    ly: cx + 30,
    desc: '生命线起于食指与拇指之间，环绕金星丘至手腕。线长而深刻者健康长寿；线细弱或断者须注意调养；若呈链状或岛纹，主某段时期体弱多病。',
  },
  {
    key: 'head',
    name: '智慧线',
    subdesc: '主智慧与思维',
    color: '#5B3A8E',
    d: `M ${cx - 50} 70 Q ${cx - 10} ${cx - 10} ${cx + 50} ${cx + 20}`,
    lx: cx - 80,
    ly: cx - 10,
    desc: '智慧线主思考能力与判断力。线长而弯垂者具艺术气质；线平直者理性务实；线过短或断者需培养耐性。',
  },
  {
    key: 'heart',
    name: '感情线',
    subdesc: '主感情与婚姻',
    color: '#E04A3A',
    d: `M ${cx - 50} 90 Q ${cx} 50 ${cx + 50} 90`,
    lx: cx - 80,
    ly: 60,
    desc: '感情线主情感与婚姻。线清晰深刻至木星丘者感情专一；线尾下垂者情感细腻；线多叉者情路曲折。',
  },
]

// 八宫丘
const mounts = ref([
  {
    key: 'jinxing',
    label: '金',
    name: '金星丘',
    x: cx - 50,
    y: cx + 60,
    brief: '主爱情与活力',
    desc: '金星丘在拇指球部，主情欲与生命力。丰厚者多情而富魅力；凹陷者宜补肝肾。',
  },
  {
    key: 'mu',
    label: '木',
    name: '木星丘',
    x: cx - 25,
    y: 80,
    brief: '主权力与野心',
    desc: '木星丘在食指根，主权威与进取。隆起者领导力强；平薄者宜培养决断。',
  },
  {
    key: 'tu',
    label: '土',
    name: '土星丘',
    x: cx,
    y: 80,
    brief: '主稳重与孤独',
    desc: '土星丘在中指根，主深沉与孤独感。发达者深思远虑；凹陷者需多社交。',
  },
  {
    key: 'taiyang',
    label: '日',
    name: '太阳丘',
    x: cx + 25,
    y: 80,
    brief: '主艺术与名声',
    desc: '太阳丘在无名指根，主才华与声望。发达者艺术天赋出众；平薄者宜培养兴趣。',
  },
  {
    key: 'shuishen',
    label: '水',
    name: '水星丘',
    x: cx + 50,
    y: 100,
    brief: '主机智与商业',
    desc: '水星丘在小指根，主机敏与理财。发达者精于计算；平薄者宜补肾经。',
  },
  {
    key: 'tianwen',
    label: '月',
    name: '月丘',
    x: cx + 50,
    y: cx + 30,
    brief: '主直觉与浪漫',
    desc: '月丘在小指侧腕部，主灵感与梦幻。发达者直觉敏锐；平薄者宜养心神。',
  },
  {
    key: 'tianchuang',
    label: '天',
    name: '天丘',
    x: cx,
    y: cx + 30,
    brief: '主精神与命运',
    desc: '天丘在掌心正上方月丘与金星丘之间，主精神世界与命运走向。',
  },
  {
    key: 'ditai',
    label: '地',
    name: '地丘',
    x: cx - 50,
    y: cx + 30,
    brief: '主健康与家庭',
    desc: '地丘在掌根上方月丘对侧，主家宅与健康。发达者福寿绵长；凹陷者宜调养。',
  },
])

const selected = ref<string>('life')
const selectedMount = ref<string>('jinxing')
const selectedLine = computed(() => lines.find((l) => l.key === selected.value))
const selectedMountData = computed(() => mounts.value.find((m) => m.key === selectedMount.value))
</script>

<style scoped>
.sxc {
  padding: 8rpx;
}
.sxc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx 0;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.sxc-svg {
  width: 100%;
  max-width: 480rpx;
  height: auto;
}
.sx-line,
.sx-mount {
  cursor: pointer;
  transition: all 0.2s;
}
.sx-line:hover path {
  stroke-width: 3.5;
}
.sxc-line,
.sxc-mount,
.sxc-mlist {
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
.dh-name,
.dh-desc {
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.d-text {
  display: block;
  padding: 12rpx 0;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--color-bai, #f5f1e8);
}
.b-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  margin-bottom: 12rpx;
  font-family: serif;
}
.ml-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8rpx;
}
.ml-cell {
  padding: 10rpx;
  background: rgba(10, 10, 18, 0.5);
  border-radius: 8rpx;
  border: 1rpx solid transparent;
}
.ml-cell.active {
  border-color: var(--color-liu, #d4af37);
  background: rgba(212, 175, 55, 0.1);
}
.mlc-label {
  display: block;
  font-size: 22rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
.mlc-name {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai, #f5f1e8);
  margin: 2rpx 0;
}
.mlc-desc {
  display: block;
  font-size: 16rpx;
  color: var(--color-bai-3, #6b6655);
}
</style>
