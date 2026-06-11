<template>
  <view class="tarot-page">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="塔罗占卜" subtitle="TAROT · 78 CARDS" />

    <!-- 选牌阵 -->
    <view v-if="stage === 'select-spread'" class="stage-stage">
      <view class="intro card-mystic anim-fade-up">
        <text class="intro-title title-mystic">选 择 牌 阵</text>
        <text class="intro-sub">Different spreads · Different fates</text>
      </view>

      <view class="spreads">
        <view
          v-for="(s, i) in spreads"
          :key="s.id"
          class="spread-card card-mystic anim-fade-up"
          :style="{ animationDelay: i * 0.1 + 's' }"
          @click="onSelectSpread(s.id)"
        >
          <view class="spread-vis">
            <view
              v-for="p in s.count"
              :key="p"
              class="spread-pos"
              :class="'pos-' + s.id"
              :style="getPosStyle(s.id, p - 1, s.count)"
            />
          </view>
          <view class="spread-info">
            <text class="spread-name title-mystic">{{ s.name }}</text>
            <text class="spread-desc">{{ s.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 抽牌 -->
    <view v-else-if="stage === 'draw'" class="stage-stage">
      <view class="deck-area">
        <view class="deck">
          <view
            v-for="i in 8"
            :key="i"
            class="deck-card"
            :style="{
              top: i * 2 + 'rpx',
              left: i * 2 + 'rpx',
              zIndex: 8 - i,
            }"
          />
          <view class="deck-card deck-top" @click="drawOne">
            <text class="deck-glyph">✦</text>
          </view>
        </view>
      </view>
      <view class="draw-tip anim-pulse">
        <text>点击牌堆 · 抽取 {{ currentSpread.count }} 张牌</text>
      </view>
      <view class="draw-counter">
        <text>{{ drawnCount }} / {{ currentSpread.count }}</text>
      </view>
    </view>

    <!-- 翻牌解读 -->
    <view v-else class="stage-stage">
      <view class="spread-result">
        <text class="result-title title-mystic">{{ currentSpread.name }}</text>
        <view class="cards-row">
          <view
            v-for="(c, i) in cards"
            :key="i"
            class="card-flip"
            :class="{ flipped: c.flipped }"
            :style="getCardStyle(i, currentSpread.count)"
            @click="flipCard(i)"
          >
            <!-- 牌背 -->
            <view class="card-face card-back">
              <view class="card-back-pattern">
                <text class="back-glyph">✦</text>
              </view>
            </view>
            <!-- 牌面 -->
            <view
              class="card-face card-front"
              :style="{
                background: 'linear-gradient(180deg, ' + c.card.color + ' 0%, #0A0A12 100%)',
              }"
            >
              <text class="card-num">{{ c.card.number }}</text>
              <text class="card-name-cn">{{ c.card.name }}</text>
              <text class="card-name-en">{{ c.card.nameEn }}</text>
              <view class="card-keywords">
                <text
                  v-for="(k, ki) in c.reversed ? c.card.revKeywords : c.card.upKeywords"
                  :key="ki"
                  class="kw"
                >
                  {{ k }}
                </text>
              </view>
              <text class="card-pos-label">{{ c.reversed ? '逆位' : '正位' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 详细解读：点击卡牌后展示 -->
      <view v-if="selectedCard" class="card-detail card-mystic anim-fade-up">
        <view class="detail-head">
          <view class="detail-badge" :class="selectedCard.reversed ? 'rev' : 'up'">
            <text>{{ selectedCard.reversed ? '逆位' : '正位' }}</text>
          </view>
          <text class="detail-name title-mystic">{{ selectedCard.card.name }}</text>
        </view>
        <text class="detail-en">{{ selectedCard.card.nameEn }}</text>
        <text class="detail-desc">{{ selectedCard.card.desc }}</text>
        <view class="detail-kw">
          <text
            v-for="k in selectedCard.reversed
              ? selectedCard.card.revKeywords
              : selectedCard.card.upKeywords"
            :key="k"
            class="kw-chip"
          >
            {{ k }}
          </text>
        </view>
      </view>

      <view class="reset">
        <view class="btn-zhu" @click="restart">
          <text>再 抽 一 次</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import { drawCards, type TarotCard } from '@modules/zhanbu/logic/tarot'
import { useAppStore } from '@/stores'

const app = useAppStore()

interface Spread {
  id: 'one' | 'three' | 'cross'
  name: string
  desc: string
  count: number
  positions: string[]
}

const SPREADS: Spread[] = [
  { id: 'one', name: '一张牌', desc: '直指当下心境', count: 1, positions: ['当下'] },
  {
    id: 'three',
    name: '三张牌',
    desc: '过去 · 现在 · 未来',
    count: 3,
    positions: ['过去', '现在', '未来'],
  },
  {
    id: 'cross',
    name: '凯尔特十字',
    desc: '深度解读，五张牌阵',
    count: 5,
    positions: ['现状', '挑战', '潜意识', '建议', '结果'],
  },
]

const stage = ref<'select-spread' | 'draw' | 'read'>('select-spread')
const currentSpread = ref<Spread>(SPREADS[0]!)

const spreads = SPREADS

const cards = ref<
  Array<{ card: TarotCard; flipped: boolean; reversed: boolean; drawAnim: boolean }>
>([])
const drawnCount = ref(0)
const selectedCardIdx = ref<number | null>(null)

const selectedCard = computed(() => {
  if (selectedCardIdx.value === null) return null
  return cards.value[selectedCardIdx.value]
})

function onSelectSpread(id: string) {
  const s = SPREADS.find((x) => x.id === id) || SPREADS[0]!
  currentSpread.value = s
  stage.value = 'draw'
  drawnCount.value = 0
  cards.value = []
}

function getPosStyle(spreadId: string, idx: number, count: number) {
  if (spreadId === 'one') {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }
  if (spreadId === 'three') {
    const top = 50
    const spacing = 28
    const totalWidth = (count - 1) * spacing
    const startLeft = 50 - totalWidth / 2
    return {
      top: top + '%',
      left: startLeft + idx * spacing + '%',
      transform: 'translate(-50%, -50%)',
    }
  }
  // cross：十字
  if (spreadId === 'cross') {
    if (idx === 0) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    if (idx === 1) return { top: '30%', left: '50%', transform: 'translate(-50%, -50%)' }
    if (idx === 2) return { top: '50%', left: '20%', transform: 'translate(-50%, -50%)' }
    if (idx === 3) return { top: '70%', left: '50%', transform: 'translate(-50%, -50%)' }
    if (idx === 4) return { top: '50%', left: '80%', transform: 'translate(-50%, -50%)' }
  }
  return {}
}

function getCardStyle(idx: number, count: number) {
  if (count === 1) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }
  if (count === 3) {
    const spacing = 28
    const totalWidth = (count - 1) * spacing
    const startLeft = 50 - totalWidth / 2
    return { top: '50%', left: startLeft + idx * spacing + '%', transform: 'translate(-50%, -50%)' }
  }
  // 5 张：十字
  if (count === 5) {
    if (idx === 0) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    if (idx === 1) return { top: '30%', left: '50%', transform: 'translate(-50%, -50%)' }
    if (idx === 2) return { top: '50%', left: '20%', transform: 'translate(-50%, -50%)' }
    if (idx === 3) return { top: '70%', left: '50%', transform: 'translate(-50%, -50%)' }
    if (idx === 4) return { top: '50%', left: '80%', transform: 'translate(-50%, -50%)' }
  }
  return {}
}

function drawOne() {
  if (drawnCount.value >= currentSpread.value.count) return
  try {
    const pool = drawCards(1)
    if (!pool.length) {
      uni.showToast({ title: '卡池已空', icon: 'none' })
      return
    }
    const c = pool[0]!
    cards.value.push({ card: c, flipped: false, reversed: Math.random() > 0.5, drawAnim: true })
    drawnCount.value++

    if (drawnCount.value === currentSpread.value.count) {
      setTimeout(() => {
        stage.value = 'read'
        // 写入历史
        app.addHistory({
          tool: 'tarot',
          toolName: '塔罗占卜',
          category: '占卜',
          input: { spread: currentSpread.value.id, question: '' },
          output: { count: cards.value.length, main: cards.value[0]?.card.name },
          brief: `${currentSpread.value.name} · ${cards.value.map((c) => c.card.name).join(' / ')}`,
        })
      }, 800)
    }
  } catch (_e) {
    uni.showModal({ title: '抽牌失败', content: '请重试', showCancel: false })
  }
}

function flipCard(i: number) {
  if (cards.value[i]) {
    cards.value[i]!.flipped = !cards.value[i]!.flipped
  }
  if (cards.value[i]?.flipped) {
    selectedCardIdx.value = i
  }
}

function restart() {
  stage.value = 'select-spread'
  cards.value = []
  drawnCount.value = 0
  selectedCardIdx.value = null
}
</script>

<style scoped>
.tarot-page {
  position: relative;
  min-height: 100vh;
  padding: 0 var(--sp-4) var(--sp-6);
  overflow: hidden;
}

.taiji-bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg);
}

.stage-stage {
  position: relative;
  z-index: var(--z-content);
  margin: 0 var(--sp-2);
}

/* ===== 选牌阵 ===== */
.intro {
  padding: var(--sp-4);
  text-align: center;
  margin-top: var(--sp-3);
}

.intro-title {
  font-size: var(--fs-xl);
  display: block;
  margin-bottom: var(--sp-2);
}

.intro-sub {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}

.spreads {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-top: var(--sp-4);
}

.spread-card {
  display: flex;
  align-items: center;
  padding: var(--sp-3);
  gap: var(--sp-3);
}

.spread-vis {
  position: relative;
  width: 180rpx;
  height: 200rpx;
  flex-shrink: 0;
}

.spread-pos {
  position: absolute;
  width: 60rpx;
  height: 90rpx;
  background: linear-gradient(135deg, var(--color-zi) 0%, var(--color-shui) 100%);
  border: 1rpx solid var(--color-liu);
  border-radius: 6rpx;
  box-shadow: 0 0 12rpx rgba(91, 58, 142, 0.4);
}

.spread-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.spread-name {
  font-size: var(--fs-lg);
  margin-bottom: 6rpx;
}

.spread-desc {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  letter-spacing: 0.05em;
}

/* ===== 抽牌 ===== */
.deck-area {
  position: relative;
  display: flex;
  justify-content: center;
  margin-top: var(--sp-7);
  height: 360rpx;
  align-items: center;
}

.deck {
  position: relative;
  width: 180rpx;
  height: 260rpx;
}

.deck-card {
  position: absolute;
  width: 180rpx;
  height: 260rpx;
  background: linear-gradient(135deg, var(--color-zi) 0%, var(--color-xuan) 100%);
  border: 2rpx solid var(--color-liu);
  border-radius: 12rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.5);
}

.deck-top {
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, var(--color-zi) 0%, var(--color-xuan) 100%);
  cursor: pointer;
  z-index: 20;
  position: relative;
  transition: transform 0.4s var(--ease-bounce);
  animation: deckPulse 2.5s ease-in-out infinite;
}

@keyframes deckPulse {
  0%,
  100% {
    box-shadow:
      0 4rpx 16rpx rgba(0, 0, 0, 0.5),
      0 0 0 0 rgba(212, 175, 55, 0.4);
  }
  50% {
    box-shadow:
      0 4rpx 16rpx rgba(0, 0, 0, 0.5),
      0 0 32rpx 4rpx rgba(212, 175, 55, 0.4);
  }
}

.deck-top:active {
  transform: scale(0.92) rotate(-3deg);
}

.deck-glyph {
  font-size: 80rpx;
  color: var(--color-liu);
  text-shadow: 0 0 24rpx var(--color-liu);
}

.draw-tip {
  text-align: center;
  margin-top: var(--sp-5);
  font-size: var(--fs-md);
  color: var(--color-bai-2);
  letter-spacing: 0.15em;
  font-family: 'KaiTi', serif;
}

.draw-counter {
  text-align: center;
  margin-top: var(--sp-3);
  font-size: var(--fs-xl);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}

/* ===== 牌面 ===== */
.spread-result {
  position: relative;
  margin-top: var(--sp-4);
  height: 700rpx;
}

.result-title {
  text-align: center;
  font-size: var(--fs-lg);
  margin-bottom: var(--sp-4);
}

.cards-row {
  position: relative;
  width: 100%;
  height: 100%;
}

.card-flip {
  position: absolute;
  width: 140rpx;
  height: 210rpx;
  perspective: 1200rpx;
  transition: transform 0.6s var(--ease-mystic);
  cursor: pointer;
  transform-style: preserve-3d;
}

.card-flip.draw-anim {
  animation: cardDrawIn 0.6s var(--ease-bounce) both;
}

@keyframes cardDrawIn {
  0% {
    transform: translate(-200rpx, -300rpx) scale(0.5) rotate(-180deg);
    opacity: 0;
  }
  60% {
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) scale(1) rotate(0);
    opacity: 1;
  }
}

.card-face {
  position: absolute;
  inset: 0;
  border-radius: 12rpx;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: transform 0.9s var(--ease-mystic);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.6);
  border: 2rpx solid var(--color-liu);
}

.card-back {
  background: radial-gradient(circle at center, var(--color-zi) 0%, var(--color-xuan) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-back-pattern {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80%;
  height: 80%;
  border: 1rpx solid rgba(212, 175, 55, 0.4);
  border-radius: 6rpx;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 8rpx,
    rgba(212, 175, 55, 0.1) 8rpx,
    rgba(212, 175, 55, 0.1) 16rpx
  );
}

.back-glyph {
  font-size: 48rpx;
  color: var(--color-liu);
  text-shadow: 0 0 16rpx var(--color-liu);
}

.card-front {
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-2);
  text-align: center;
  color: var(--color-bai);
}

.card-flip.flipped .card-back {
  transform: rotateY(180deg);
}
.card-flip.flipped .card-front {
  transform: rotateY(360deg);
}

.card-num {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-weight: 700;
  margin-bottom: 4rpx;
}

.card-name-cn {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
  letter-spacing: 0.05em;
  margin: 4rpx 0;
}

.card-name-en {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  font-style: italic;
  margin-bottom: var(--sp-2);
}

.card-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  justify-content: center;
  margin-top: auto;
  margin-bottom: var(--sp-1);
}

.kw {
  font-size: 18rpx;
  color: var(--color-bai-2);
  background: rgba(10, 10, 18, 0.4);
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.card-pos-label {
  font-size: var(--fs-xs);
  color: var(--color-liu);
  letter-spacing: 0.1em;
  margin-top: 4rpx;
}

/* ===== 卡牌详情 ===== */
.card-detail {
  margin-top: var(--sp-3);
  padding: var(--sp-4);
}

.detail-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.detail-badge {
  padding: 4rpx 12rpx;
  border-radius: var(--r-sm);
  font-size: var(--fs-xs);
  letter-spacing: 0.2em;
  border: 1rpx solid;
}

.detail-badge.up {
  color: var(--color-liu);
  border-color: var(--color-liu);
  background: rgba(212, 175, 55, 0.1);
}

.detail-badge.rev {
  color: var(--color-zhu);
  border-color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.1);
}

.detail-name {
  font-size: var(--fs-xl);
}

.detail-en {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  font-style: italic;
  letter-spacing: 0.1em;
  margin-bottom: var(--sp-3);
}

.detail-desc {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-3);
}

.detail-kw {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.kw-chip {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  background: rgba(91, 58, 142, 0.3);
  border: 1rpx solid rgba(91, 58, 142, 0.5);
  padding: 4rpx 12rpx;
  border-radius: var(--r-full);
}

.reset {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}
</style>
