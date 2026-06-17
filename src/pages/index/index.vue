<template>
  <view
    class="home"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <!-- 背景层 -->
    <view class="taiji-bg">
      <TaijiBg />
    </view>
    <StarField :count="80" density="mid" colors="mixed" :shooting="true" />

    <!-- 状态栏 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />

    <!-- 主视觉区 -->
    <view class="hero">
      <!-- 光晕装饰 -->
      <view class="hero-halo" />

      <!-- 品牌印章 -->
      <view class="brand-seal anim-float">
        <view class="seal-ring" />
        <view class="seal-inner">
          <text class="seal-char">渡</text>
        </view>
      </view>

      <!-- 品牌标题 -->
      <view class="brand-group">
        <text class="brand-title title-mystic">渡</text>
        <view class="brand-divider">
          <view class="brand-divider-line" />
          <text class="brand-divider-dot">·</text>
          <view class="brand-divider-line" />
        </view>
        <text class="brand-en">D U · 渡 己 渡 人</text>
      </view>

      <!-- 副标题 -->
      <text class="brand-sub">万象皆数 · 一念即卦</text>

      <!-- 时辰干支 -->
      <view class="time-block">
        <view class="time-icon">
          <text class="time-icon-text">辰</text>
        </view>
        <text class="time-gz">{{ nowGanzi }}</text>
      </view>
    </view>

    <!-- 寄语区 -->
    <view class="verse-section">
      <view class="verse-deco">
        <view class="verse-deco-line" />
        <text class="verse-deco-text">渡己寄语</text>
        <view class="verse-deco-line" />
      </view>
      <view class="verse-card" @click="nextVerse">
        <text class="verse-mark-left">「</text>
        <text :key="verseIdx" class="verse-text" :class="{ 'verse-flip': verseFlip }">
          {{ currentVerse.text }}
        </text>
        <text class="verse-mark-right">」</text>
        <text class="verse-from">— {{ currentVerse.from }}</text>
      </view>
    </view>

    <!-- 入口区 -->
    <view class="entries-section">
      <view class="section-header">
        <view class="section-header-line" />
        <text class="section-header-text">六 道 入 口</text>
        <view class="section-header-line" />
      </view>

      <view class="entries-grid">
        <view
          v-for="(cat, i) in categories"
          :key="cat.key"
          class="entry-card"
          :style="{ animationDelay: i * 0.1 + 's' }"
          @click="goCategory(cat.key)"
        >
          <!-- 卡片背景光效 -->
          <view class="entry-card-glow" :style="{ background: cat.accent + '15' }" />

          <!-- 主字符 -->
          <view class="entry-glyph-wrap">
            <view class="entry-glyph-ring" :style="{ borderColor: cat.accent + '60' }" />
            <text
              class="entry-glyph"
              :style="{ color: cat.accent, textShadow: '0 0 20rpx ' + cat.accent + '80' }"
            >
              {{ cat.glyph }}
            </text>
          </view>

          <!-- 信息 -->
          <view class="entry-info">
            <text class="entry-name" :style="{ color: cat.accent }">{{ cat.name }}</text>
            <text class="entry-en">{{ cat.enName }}</text>
            <text class="entry-sub">{{ cat.subtitle }}</text>
          </view>

          <!-- 底部统计 -->
          <view class="entry-footer">
            <view
              class="entry-count-badge"
              :style="{ background: cat.accent + '20', color: cat.accent }"
            >
              <text>{{ getCount(cat.key) }} 项</text>
            </view>
            <view class="entry-arrow" :style="{ color: cat.accent }">
              <text>›</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部 -->
    <view class="footer">
      <view class="footer-line" />
      <text class="footer-stat">已上线 {{ readyCount }} · 规划中 {{ plannedCount }}</text>
      <view class="footer-line" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { gsap } from 'gsap'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import StarField from '@/components/effects/StarField.vue'
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

  // GSAP 入场动画
  try {
    gsap.fromTo(
      '.brand-seal',
      { scale: 0, rotation: -180, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 1.2, ease: 'elastic.out(1, 0.5)' },
    )
    gsap.fromTo(
      '.brand-group',
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.4, ease: 'power3.out' },
    )
    gsap.fromTo(
      '.brand-sub',
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, delay: 0.6, ease: 'power2.out' },
    )
    gsap.fromTo(
      '.time-block',
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.7, delay: 0.7, ease: 'back.out(1.7)' },
    )
    gsap.fromTo(
      '.verse-section',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, delay: 0.9, ease: 'power2.out' },
    )
    gsap.fromTo(
      '.entry-card',
      { y: 40, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, delay: 1.1, ease: 'power3.out' },
    )
  } catch (_e) {}
})
</script>

<style scoped>
.home {
  position: relative;
  min-height: 100vh;
  padding: 0 32rpx 40rpx;
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

/* ===== 主视觉区 ===== */
.hero {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0 32rpx;
}

.hero-halo {
  position: absolute;
  top: -60rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 600rpx;
  height: 400rpx;
  background: radial-gradient(ellipse, rgba(212, 175, 55, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

/* 品牌印章 */
.brand-seal {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.seal-ring {
  position: absolute;
  inset: 0;
  border-radius: 24rpx;
  border: 3rpx solid rgba(212, 175, 55, 0.6);
  background: linear-gradient(135deg, var(--color-zhu) 0%, #8b1f1a 100%);
  box-shadow:
    0 0 40rpx rgba(200, 48, 42, 0.5),
    inset 0 0 20rpx rgba(0, 0, 0, 0.3);
}

.seal-ring::before {
  content: '';
  position: absolute;
  inset: 8rpx;
  border-radius: 18rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.15);
}

.seal-inner {
  position: relative;
  z-index: 1;
}

.seal-char {
  font-family: '霞鹜文楷', 'KaiTi', serif;
  font-size: 64rpx;
  color: var(--color-bai);
  font-weight: 700;
  text-shadow:
    0 0 20rpx rgba(255, 255, 255, 0.5),
    0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

/* 品牌标题组 */
.brand-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16rpx;
}

.brand-title {
  display: block;
  text-align: center;
  font-size: 72rpx;
  font-weight: 700;
  letter-spacing: 0.5em;
  color: var(--color-bai);
  text-shadow: 0 0 32rpx rgba(212, 175, 55, 0.6);
  padding-right: -0.5em;
}

.brand-divider {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 12rpx 0;
  width: 280rpx;
}

.brand-divider-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, var(--color-liu), transparent);
}

.brand-divider-dot {
  font-size: 24rpx;
  color: var(--color-liu);
}

.brand-en {
  display: block;
  text-align: center;
  font-size: 20rpx;
  color: var(--color-liu);
  letter-spacing: 0.4em;
  opacity: 0.8;
}

.brand-sub {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  letter-spacing: 0.4em;
  text-align: center;
  margin-bottom: 24rpx;
}

/* 时辰干支 */
.time-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 10rpx 24rpx;
  background: rgba(20, 20, 28, 0.7);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  border-radius: 9999rpx;
  backdrop-filter: blur(16rpx);
}

.time-icon {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-liu), #b8941f);
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-icon-text {
  font-size: 20rpx;
  color: var(--color-xuan);
  font-weight: 700;
  font-family: 'KaiTi', serif;
}

.time-gz {
  font-size: var(--fs-xs);
  color: var(--color-liu);
  letter-spacing: 0.15em;
  font-family: 'KaiTi', serif;
}

/* ===== 寄语区 ===== */
.verse-section {
  position: relative;
  z-index: var(--z-content);
  margin-bottom: 32rpx;
}

.verse-deco {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
  padding: 0 8rpx;
}

.verse-deco-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent);
}

.verse-deco-text {
  font-size: var(--fs-xs);
  color: var(--color-liu);
  letter-spacing: 0.3em;
  font-family: 'KaiTi', serif;
}

.verse-card {
  position: relative;
  padding: 24rpx 32rpx;
  background: rgba(20, 20, 28, 0.5);
  border-radius: var(--r-lg);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s var(--ease-mystic);
}

.verse-card:active {
  transform: scale(0.98);
  border-color: rgba(212, 175, 55, 0.3);
}

.verse-mark-left,
.verse-mark-right {
  font-size: var(--fs-lg);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  opacity: 0.6;
  line-height: 1;
}

.verse-text {
  font-size: var(--fs-base);
  color: var(--color-bai);
  line-height: 1.8;
  letter-spacing: 0.15em;
  font-family: 'KaiTi', serif;
  text-align: center;
  flex: 1;
  min-width: 0;
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

.verse-from {
  width: 100%;
  display: block;
  text-align: center;
  margin-top: 12rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}

/* ===== 入口区 ===== */
.entries-section {
  position: relative;
  z-index: var(--z-content);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
  padding: 0 8rpx;
}

.section-header-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
}

.section-header-text {
  font-size: var(--fs-md);
  color: var(--color-liu);
  letter-spacing: 0.5em;
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.entries-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.entry-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 24rpx 20rpx 20rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.25);
  border-radius: var(--r-lg);
  background: linear-gradient(180deg, rgba(31, 31, 43, 0.9) 0%, rgba(10, 10, 18, 0.95) 100%);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s var(--ease-power);
  animation: fadeInUp 0.6s var(--ease-power) both;
}

.entry-card:active {
  transform: scale(0.97);
  border-color: rgba(212, 175, 55, 0.5);
}

.entry-card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.4s var(--ease-mystic);
  pointer-events: none;
}

.entry-card:active .entry-card-glow {
  opacity: 1;
}

/* 主字符 */
.entry-glyph-wrap {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

.entry-glyph-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2rpx solid;
  opacity: 0.5;
}

.entry-glyph {
  position: relative;
  font-size: 48rpx;
  font-weight: 700;
  font-family: 'KaiTi', serif;
  line-height: 1;
}

/* 信息 */
.entry-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.entry-name {
  font-size: var(--fs-lg);
  font-weight: 700;
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  margin-bottom: 4rpx;
}

.entry-en {
  font-size: 16rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.15em;
  margin-bottom: 6rpx;
  opacity: 0.6;
}

.entry-sub {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  letter-spacing: 0.05em;
  line-height: 1.4;
}

/* 底部 */
.entry-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid rgba(212, 175, 55, 0.1);
}

.entry-count-badge {
  padding: 4rpx 12rpx;
  border-radius: 9999rpx;
  font-size: 18rpx;
  letter-spacing: 0.05em;
}

.entry-arrow {
  font-size: 36rpx;
  font-weight: 300;
  opacity: 0.7;
  transition: transform 0.3s var(--ease-mystic);
}

.entry-card:active .entry-arrow {
  transform: translateX(4rpx);
}

/* ===== 底部 ===== */
.footer {
  position: relative;
  z-index: var(--z-content);
  margin-top: 40rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.footer-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
}

.footer-stat {
  font-size: 18rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
  white-space: nowrap;
}

/* 入场动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .entry-card,
  .verse-card,
  .brand-seal {
    animation: none !important;
  }
}
</style>
