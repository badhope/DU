<template>
  <view class="tdc">
    <!-- 牌阵类型选择 -->
    <view class="tdc-bar">
      <view class="sp-btn" :class="{ active: spread === 'three' }" @click="spread = 'three'">
        三牌阵
      </view>
      <view class="sp-btn" :class="{ active: spread === 'celtic' }" @click="spread = 'celtic'">
        凯尔特
      </view>
      <view class="sp-btn" :class="{ active: spread === 'cross' }" @click="spread = 'cross'">
        十字阵
      </view>
    </view>

    <!-- 牌阵画布 -->
    <view class="tdc-canvas">
      <svg :viewBox="`0 0 ${cw} ${ch}`" class="tdc-svg">
        <defs>
          <linearGradient :id="uid('cardbg')" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F5F1E8" />
            <stop offset="100%" stop-color="#D8D2BD" />
          </linearGradient>
          <linearGradient :id="uid('cardback')" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#5B3A8E" />
            <stop offset="50%" stop-color="#1B3A5C" />
            <stop offset="100%" stop-color="#5B3A8E" />
          </linearGradient>
          <filter :id="uid('shadow')">
            <feDropShadow dx="2" dy="3" stdDeviation="3" flood-opacity="0.5" />
          </filter>
        </defs>

        <!-- 牌阵位置 -->
        <g
          v-for="(pos, i) in spreadPositions"
          :key="i"
          class="card-pos"
          :transform="`translate(${pos.x}, ${pos.y})`"
          @click="flipCard(i)"
        >
          <rect
            :width="cardW"
            :height="cardH"
            rx="8"
            :fill="flipped[i] ? 'url(#' + uid('cardbg') + ')' : 'url(#' + uid('cardback') + ')'"
            :stroke="flipped[i] ? pos.color : 'rgba(212,175,55,0.6)'"
            stroke-width="1.5"
            :filter="`url(#${uid('shadow')})`"
            class="card-rect"
          />
          <!-- 牌背图案 -->
          <g v-if="!flipped[i]">
            <circle
              :cx="cardW / 2"
              :cy="cardH / 2"
              r="28"
              fill="none"
              stroke="#D4AF37"
              stroke-width="1.5"
            />
            <text
              :x="cardW / 2"
              :y="cardH / 2 + 8"
              text-anchor="middle"
              font-size="28"
              fill="#D4AF37"
              font-family="serif"
            >
              ✦
            </text>
          </g>
          <!-- 牌面 -->
          <g v-else>
            <!-- 顶部装饰 -->
            <rect x="6" y="6" :width="cardW - 12" height="6" :fill="pos.color" />
            <text
              :x="cardW / 2"
              y="32"
              text-anchor="middle"
              font-size="11"
              fill="#1A1A22"
              font-weight="bold"
              font-family="serif"
            >
              {{ getCard(i)?.name }}
            </text>
            <!-- 主体图案 -->
            <text
              :x="cardW / 2"
              :y="cardH / 2 + 20"
              text-anchor="middle"
              font-size="56"
              :fill="pos.color"
              font-family="serif"
            >
              {{ getCard(i)?.symbol }}
            </text>
            <!-- 关键词 -->
            <text
              v-for="(kw, ki) in getCard(i)?.upKeywords.slice(0, 2) || []"
              :key="ki"
              :x="cardW / 2"
              :y="cardH - 50 + ki * 16"
              text-anchor="middle"
              font-size="10"
              fill="#1A1A22"
              font-family="serif"
            >
              {{ kw }}
            </text>
            <!-- 逆位标记 -->
            <text
              v-if="reversed[i]"
              :x="cardW - 12"
              :y="cardH - 8"
              text-anchor="end"
              font-size="9"
              fill="#C8302A"
              font-weight="bold"
              font-family="serif"
            >
              逆位
            </text>
          </g>
          <!-- 位置标签 -->
          <text
            :x="cardW / 2"
            :y="-10"
            text-anchor="middle"
            font-size="11"
            fill="#D4AF37"
            font-weight="bold"
            font-family="serif"
          >
            {{ pos.label }}
          </text>
        </g>
      </svg>
    </view>

    <!-- 操作按钮 -->
    <view class="tdc-actions">
      <view class="abtn" @click="drawAll"><text>重 新 抽 牌</text></view>
      <view v-if="allFlipped" class="abtn abtn-rev" @click="reverseAll">
        <text>翻 转 全 部</text>
      </view>
    </view>

    <!-- 选中牌详情 -->
    <view v-if="selectedCard" class="tdc-detail card-mystic anim-fade-up">
      <view class="td-head">
        <text class="tdh-name">{{ selectedCard.name }}</text>
        <text class="tdh-en">{{ selectedCard.nameEn }}</text>
      </view>
      <view class="td-keywords">
        <text class="tk-label">{{ isReversed ? '逆位' : '正位' }}：</text>
        <text
          v-for="(kw, i) in isReversed ? selectedCard.revKeywords : selectedCard.upKeywords"
          :key="i"
          class="tk-tag"
        >
          {{ kw }}
        </text>
      </view>
      <text class="td-desc">{{ selectedCard.desc }}</text>
    </view>

    <!-- 全牌解读 -->
    <view v-if="allFlipped" class="tdc-interpret card-mystic anim-fade-up">
      <text class="ti-title title-mystic">牌 阵 综 合 阐 释</text>
      <text class="ti-text">{{ interpretation }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { TAROT_DECK as _TAROT_DECK, drawCards, type TarotCard } from '@/utils/tarot'
import { uid } from '@/utils/chart-utils'

const props = defineProps<{ question?: string; cards?: TarotCard[] }>()

const spread = ref<'three' | 'celtic' | 'cross'>('three')
const cards = ref<TarotCard[]>(props.cards || drawCards(3))
const flipped = ref<boolean[]>([
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
])
const reversed = ref<boolean[]>([
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
])
const selectedIdx = ref(0)

const cardW = 96
const cardH = 150
const cw = 720
const ch = 540

const spreadPositions = computed(() => {
  if (spread.value === 'three') {
    return [
      { x: 60, y: 180, label: '过 去', color: '#A87C4F' },
      { x: 312, y: 180, label: '现 在', color: '#D4AF37' },
      { x: 564, y: 180, label: '未 来', color: '#5B3A8E' },
    ]
  }
  if (spread.value === 'celtic') {
    // 凯尔特十字 10 张（简化：取 6 张代表）
    return [
      { x: 312, y: 180, label: '现 况', color: '#D4AF37' },
      { x: 312, y: 60, label: '障 碍', color: '#C8302A' },
      { x: 200, y: 180, label: '根 源', color: '#1B3A5C' },
      { x: 424, y: 180, label: '过 去', color: '#A87C4F' },
      { x: 312, y: 380, label: '可 能', color: '#5B3A8E' },
      { x: 60, y: 380, label: '未 来', color: '#2F7D4F' },
    ]
  }
  // 十字阵
  return [
    { x: 312, y: 200, label: '自 我', color: '#D4AF37' },
    { x: 312, y: 320, label: '环 境', color: '#1B3A5C' },
    { x: 200, y: 200, label: '意 识', color: '#C8302A' },
    { x: 424, y: 200, label: '潜 意 识', color: '#5B3A8E' },
    { x: 312, y: 40, label: '结 果', color: '#2F7D4F' },
  ]
})

// 抽牌数量
const cardCount = computed(() => spreadPositions.value.length)

const drawAll = () => {
  cards.value = drawCards(Math.max(cardCount.value, 3))
  flipped.value = flipped.value.map(() => false)
  reversed.value = reversed.value.map(() => false)
}

const flipCard = (i: number) => {
  flipped.value[i] = !flipped.value[i]
  if (flipped.value[i] && Math.random() < 0.3) reversed.value[i] = !reversed.value[i]
  selectedIdx.value = i
}

const reverseAll = () => {
  reversed.value = reversed.value.map(() => !reversed.value[0])
}

const getCard = (i: number) => cards.value[i] || null
const selectedCard = computed(() => cards.value[selectedIdx.value] || null)
const isReversed = computed(() => reversed.value[selectedIdx.value])
const allFlipped = computed(() => flipped.value.filter(Boolean).length === cardCount.value)

watch(spread, () => {
  drawAll()
})

const interpretation = computed(() => {
  if (!allFlipped.value) return ''
  const flipCards = cards.value.slice(0, cardCount.value).map((c, i) => {
    const pos = reversed.value[i] ? '逆位' : '正位'
    return `${c.name}${pos}`
  })
  const majorCount = cards.value.slice(0, cardCount.value).filter((c) => c.suit === 'major').length
  const majorNote =
    majorCount >= 2
      ? '大阿卡那占多 · 命运之力量主导 · 重要转折'
      : majorCount === 1
        ? '大阿卡那与小阿卡那并存 · 命与日常交织'
        : '小阿卡那主导 · 日常能量主导 · 行动与感受'
  return (
    `本牌阵抽得：${flipCards.join(' · ')}。${majorNote}。` +
    `针对所问之事，关键牌为「${cards.value[0].name}」，${cards.value[0].desc}。` +
    `综合启示：${cards.value[0].upKeywords[0]}与${cards.value[0].upKeywords[1]}。`
  )
})
</script>

<style scoped>
.tdc {
  padding: 8rpx;
}
.tdc-bar {
  display: flex;
  gap: 8rpx;
  margin-bottom: 12rpx;
}
.sp-btn {
  flex: 1;
  padding: 12rpx;
  text-align: center;
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: 8rpx;
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.sp-btn.active {
  background: rgba(212, 175, 55, 0.15);
  border-color: var(--color-liu, #d4af37);
  color: var(--color-liu, #d4af37);
}
.tdc-canvas {
  display: flex;
  justify-content: center;
  padding: 16rpx;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.6), transparent);
  border-radius: 24rpx;
}
.tdc-svg {
  width: 100%;
  max-width: 720rpx;
  height: auto;
}
.card-pos {
  cursor: pointer;
}
.card-rect {
  transition: all 0.4s cubic-bezier(0.65, 0, 0.35, 1);
}
.card-pos:hover .card-rect {
  transform: translateY(-4rpx);
}
.tdc-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}
.abtn {
  flex: 1;
  padding: 16rpx;
  text-align: center;
  background: linear-gradient(135deg, #d4af37, #a87c4f);
  color: var(--color-xuan, #0a0a12);
  font-weight: bold;
  font-size: 28rpx;
  border-radius: 12rpx;
}
.abtn-rev {
  background: linear-gradient(135deg, #5b3a8e, #1b3a5c);
  color: var(--color-bai, #f5f1e8);
}
.tdc-detail {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
}
.td-head {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  padding-bottom: 8rpx;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}
.tdh-name {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.tdh-en {
  font-size: 22rpx;
  color: var(--color-bai-3, #6b6655);
  font-style: italic;
}
.td-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  padding: 12rpx 0;
  align-items: center;
}
.tk-label {
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-right: 4rpx;
}
.tk-tag {
  padding: 4rpx 12rpx;
  background: rgba(212, 175, 55, 0.12);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  border-radius: 6rpx;
  font-size: 22rpx;
  color: var(--color-liu, #d4af37);
}
.td-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--color-bai-2, #b8b2a0);
}
.tdc-interpret {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, rgba(91, 58, 142, 0.2), rgba(20, 20, 28, 0.6));
}
.ti-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  margin-bottom: 12rpx;
  font-family: serif;
}
.ti-text {
  display: block;
  font-size: 26rpx;
  line-height: 1.8;
  color: var(--color-bai, #f5f1e8);
}
</style>
