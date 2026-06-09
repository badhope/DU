<template>
  <view
    class="home"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <!-- 背景 -->
    <view class="taiji-bg">
      <TaijiBg />
    </view>

    <!-- 星辰粒子装饰 -->
    <StarField :count="60" :density="'mid'" :colors="'mixed'" :shooting="true" />

    <!-- 状态栏 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- L1 大标题区（一屏内） -->
    <view class="hero">
      <view class="brand-seal anim-float">
        <view class="seal-content">
          <text class="seal-char">玄</text>
        </view>
      </view>
      <text class="brand-title title-mystic">玄枢</text>
      <text class="brand-en">MISTVERSE</text>
      <text class="brand-sub">— 万象皆数 · 一念即卦 —</text>
      <view class="time-block">
        <text class="time-gz">{{ nowGanzi }}</text>
      </view>
    </view>

    <!-- 介绍语（一屏内） -->
    <view class="intro">
      <view class="divider-liu">
        <text>· 玄 枢 寄 语 ·</text>
      </view>
      <text
        :key="verseIdx"
        class="intro-text"
        :class="{ 'verse-flip': verseFlip }"
        @click="nextVerse"
      >
        「{{ currentVerse.text }}」
      </text>
      <text class="intro-from">— {{ currentVerse.from }}</text>
    </view>

    <!-- L1 分类大路口：6 个入口卡片 -->
    <view class="cat-entries">
      <view class="entries-title">
        <text class="entries-title-text">入 口</text>
        <text class="entries-title-line" />
      </view>
      <view class="entries-grid">
        <view
          v-for="(cat, i) in categories"
          :key="cat.key"
          class="entry-card card-hoverable lift"
          :style="{
            background:
              'linear-gradient(135deg, ' + cat.accent + '25 0%, ' + cat.accent + '08 100%)',
            borderColor: cat.accent + '40',
            animationDelay: i * 0.08 + 's',
          }"
          @click="goCategory(cat.key)"
        >
          <view
            class="entry-glyph"
            :style="{ color: cat.accent, textShadow: '0 0 16rpx ' + cat.accent }"
          >
            {{ cat.glyph }}
          </view>
          <view class="entry-body">
            <text class="entry-name" :style="{ color: cat.accent }">{{ cat.name }}</text>
            <text class="entry-sub">{{ cat.subtitle }}</text>
            <view class="entry-meta">
              <text class="entry-count">{{ getCount(cat.key) }} 项</text>
              <text class="entry-arrow" :style="{ color: cat.accent }">›</text>
            </view>
          </view>
          <view class="entry-en">{{ cat.enName }}</view>
        </view>
      </view>
    </view>

    <!-- 底部统计 -->
    <view class="footer">
      <text class="footer-stat">已上线 {{ readyCount }} / 规划 {{ plannedCount }} 项</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { gsap } from 'gsap'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import StarField from '@/components/effects/StarField.vue'
import _Particles from '@/components/effects/Particles.vue'
import _RipplePress from '@/components/ui/RipplePress.vue'
import { calcBazi } from '@/utils/bazi'
import { CATEGORIES, TOOLS, READY_COUNT, TOTAL_TOOLS, type CategoryKey } from '@/config/tools'
import { useAppStore } from '@/stores'

const app = useAppStore()
const statusBarHeight = ref(44)
const categories = CATEGORIES
const readyCount = READY_COUNT
const plannedCount = TOTAL_TOOLS - READY_COUNT

function getCount(key: CategoryKey) {
  return TOOLS.filter((t) => t.category === key).length
}

function goCategory(key: CategoryKey) {
  uni.navigateTo({ url: '/pages/category/category?cat=' + key })
}

const now = ref(new Date())
const nowGanzi = computed(() => {
  const d = now.value
  const b = calcBazi(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours())
  return `${b.year.gan}${b.year.zhi}年 ${b.month.gan}${b.month.zhi}月 ${b.day.gan}${b.day.zhi}日`
})

const VERSES = [
  { text: '道生一，一生二，二生三，三生万物。', from: '道德经' },
  { text: '易有太极，是生两仪，两仪生四象，四象生八卦。', from: '易经' },
  { text: '人法地，地法天，天法道，道法自然。', from: '道德经' },
  { text: '万物负阴而抱阳，冲气以为和。', from: '道德经' },
  { text: '穷则变，变则通，通则久。', from: '易经' },
  { text: '一花一世界，一叶一菩提。', from: '偈语' },
  { text: '静曰虚，虚则明；明则通，通则久。', from: '淮南子' },
  { text: '天行有常，不为尧存，不为桀亡。', from: '荀子' },
]
const verseIdx = ref(new Date().getDate() % VERSES.length)
const verseFlip = ref(false)
const currentVerse = computed(() => VERSES[verseIdx.value])
function nextVerse() {
  verseFlip.value = true
  setTimeout(() => {
    verseIdx.value = (verseIdx.value + 1) % VERSES.length
    verseFlip.value = false
  }, 400)
}

onMounted(() => {
  try {
    const sys = uni.getSystemInfoSync()
    statusBarHeight.value = sys.statusBarHeight ?? 0
  } catch (_e) {}
  // GSAP 入场
  try {
    gsap.fromTo(
      '.brand-seal',
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 1.0, ease: 'elastic.out(1, 0.6)' },
    )
    gsap.fromTo(
      '.brand-title',
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, delay: 0.3, ease: 'power2.out' },
    )
    gsap.fromTo(
      '.brand-en',
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, delay: 0.4, ease: 'power2.out' },
    )
    gsap.fromTo(
      '.brand-sub',
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, delay: 0.5, ease: 'power2.out' },
    )
    gsap.fromTo(
      '.time-block',
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, delay: 0.6, ease: 'back.out(1.4)' },
    )
    gsap.fromTo(
      '.intro',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, delay: 0.7, ease: 'power2.out' },
    )
    gsap.fromTo(
      '.entry-card',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.8, ease: 'power2.out' },
    )
  } catch (_e) {}
})
</script>

<style scoped>
.home {
  position: relative;
  min-height: 100vh;
  padding: 0 24rpx 24rpx;
  overflow-x: hidden;
}

.status-bar {
  width: 100%;
}

.taiji-bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg);
}

/* ===== L1 大标题 ===== */
.hero {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0 24rpx;
}

.brand-seal {
  width: 76rpx;
  height: 76rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, var(--color-zhu) 0%, #8b1f1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--sh-glow-zhu);
  margin-bottom: 4rpx;
  border: 2rpx solid rgba(212, 175, 55, 0.5);
  position: relative;
}

.brand-seal::after {
  content: '';
  position: absolute;
  inset: 5rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 18rpx;
  pointer-events: none;
}

.seal-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.seal-char {
  font-family: '霞鹜文楷', 'KaiTi', serif;
  font-size: 46rpx;
  color: var(--color-bai);
  font-weight: 700;
  text-shadow: 0 0 16rpx rgba(255, 255, 255, 0.4);
}

.brand-title {
  display: block;
  text-align: center;
  font-size: 48rpx;
  font-weight: 700;
  letter-spacing: 0.4em;
  color: var(--color-bai);
  text-shadow: 0 0 24rpx rgba(212, 175, 55, 0.6);
  width: 100%;
}

.brand-en {
  display: block;
  text-align: center;
  font-size: 18rpx;
  color: var(--color-liu);
  letter-spacing: 0.6em;
  margin-top: 2rpx;
  width: 100%;
}

.brand-sub {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.3em;
  margin-top: 4rpx;
  text-align: center;
}

.time-block {
  margin-top: 12rpx;
  padding: 4rpx 16rpx;
  background: rgba(20, 20, 28, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: 9999rpx;
  backdrop-filter: blur(10rpx);
}

.time-gz {
  font-size: var(--fs-xs);
  color: var(--color-liu);
  letter-spacing: 0.15em;
  font-family: 'KaiTi', serif;
  text-align: center;
}

/* ===== 介绍语 ===== */
.intro {
  position: relative;
  z-index: var(--z-content);
  margin: 8rpx 0 4rpx;
  padding: 8rpx 20rpx 10rpx;
  background: rgba(20, 20, 28, 0.4);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.divider-liu {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
  width: 100%;
}

.divider-liu::before,
.divider-liu::after {
  content: '';
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, var(--color-liu), transparent);
  opacity: 0.5;
}

.divider-liu text {
  font-size: 18rpx;
  letter-spacing: 0.3em;
  color: var(--color-liu);
  padding: 0 16rpx;
  white-space: nowrap;
}

.intro-text {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.7;
  letter-spacing: 0.1em;
  font-family: 'KaiTi', serif;
  font-style: italic;
  text-align: center;
  transition: all 0.4s var(--ease-mystic);
}

.verse-flip {
  animation: verseFlip 0.6s var(--ease-mystic);
}

@keyframes verseFlip {
  0% {
    transform: rotateX(0);
    opacity: 1;
  }
  50% {
    transform: rotateX(90deg);
    opacity: 0;
  }
  100% {
    transform: rotateX(0);
    opacity: 1;
  }
}

.intro-from {
  display: block;
  margin-top: 4rpx;
  font-size: 18rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}

/* ===== 分类大路口 ===== */
.cat-entries {
  position: relative;
  z-index: var(--z-content);
  margin-top: 6rpx;
}

.entries-title {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
  padding: 0 4rpx;
}

.entries-title-text {
  font-size: var(--fs-md);
  color: var(--color-liu);
  letter-spacing: 0.4em;
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.entries-title-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, var(--color-liu), transparent);
  opacity: 0.4;
}

.entries-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10rpx;
}

.entry-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 10rpx 14rpx;
  border: 1rpx solid;
  border-radius: var(--r-md);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s var(--ease-mystic);
}

.entry-card:active {
  transform: scale(0.98);
}

.entry-glyph {
  font-size: 44rpx;
  font-weight: 700;
  font-family: 'KaiTi', serif;
  line-height: 1;
  margin-right: 16rpx;
  flex-shrink: 0;
  width: 56rpx;
  text-align: center;
}

.entry-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.entry-name {
  font-size: var(--fs-lg);
  font-weight: 700;
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  margin-bottom: 4rpx;
}

.entry-sub {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  letter-spacing: 0.1em;
  margin-bottom: 6rpx;
}

.entry-meta {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.entry-count {
  font-size: 16rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.05em;
  padding: 0 6rpx;
  background: rgba(212, 175, 55, 0.08);
  border-radius: 9999rpx;
}

.entry-arrow {
  font-size: 32rpx;
  font-weight: 300;
  margin-left: auto;
  opacity: 0.7;
}

.entry-en {
  position: absolute;
  top: 4rpx;
  right: 8rpx;
  font-size: 14rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
  opacity: 0.5;
}

/* ===== 底部 ===== */
.footer {
  position: relative;
  z-index: var(--z-content);
  margin-top: 6rpx;
  text-align: center;
  padding: 0 8rpx;
}

.footer-stat {
  font-size: 18rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
  opacity: 0.6;
}
</style>
