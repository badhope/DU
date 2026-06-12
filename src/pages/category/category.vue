<template>
  <view
    class="cat-page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <!-- 背景 -->
    <view class="taiji-bg"><TaijiBg /></view>
    <StarField :count="40" density="low" colors="mixed" :shooting="false" />

    <!-- 状态栏 + 顶栏 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <TopBar :title="category.name" :subtitle="category.enName" />

    <!-- 分类英雄区 -->
    <view v-if="cat" class="cat-hero">
      <!-- 背景光效 -->
      <view class="cat-hero-glow" :style="heroBgStyle" />

      <!-- 主字符 -->
      <view class="cat-hero-seal">
        <view class="cat-hero-ring" :style="{ borderColor: category.accent + '50' }" />
        <text
          class="cat-hero-glyph"
          :style="{ color: category.accent, textShadow: '0 0 30rpx ' + category.accent + '80' }"
        >
          {{ category.glyph }}
        </text>
      </view>

      <!-- 标题组 -->
      <view class="cat-hero-title-group">
        <text class="cat-hero-name" :style="{ color: category.accent }">{{ category.name }}</text>
        <text class="cat-hero-en">{{ category.enName }}</text>
      </view>

      <!-- 分隔线 -->
      <view class="cat-hero-divider">
        <view class="cat-hero-divider-line" :style="{ background: 'linear-gradient(90deg, transparent, ' + category.accent + '60, transparent)' }" />
      </view>

      <!-- 描述 -->
      <text class="cat-hero-sub">{{ category.subtitle }} · {{ tools.length }} 项</text>
      <text class="cat-hero-desc">{{ CATEGORY_DESC[cat] || '' }}</text>
    </view>

    <!-- 工具列表 -->
    <view class="tools-section">
      <view class="section-header">
        <view class="section-header-line" :style="{ background: 'linear-gradient(90deg, transparent, ' + category.accent + '40, transparent)' }" />
        <text class="section-header-text" :style="{ color: category.accent }">工 具 入 口</text>
        <view class="section-header-line" :style="{ background: 'linear-gradient(90deg, transparent, ' + category.accent + '40, transparent)' }" />
      </view>

      <view class="tool-list">
        <view
          v-for="(tool, i) in tools"
          :key="tool.key"
          class="tool-card"
          :class="['tool-' + tool.status]"
          :style="{ animationDelay: i * 0.08 + 's' }"
          @click="onClick(tool)"
        >
          <!-- 卡片光效背景 -->
          <view class="tool-card-glow" :style="{ background: tool.glow }" />

          <!-- 图标 -->
          <view class="tool-icon" :style="{ background: tool.gradient }">
            <text class="tool-icon-deco">{{ tool.deco }}</text>
            <text class="tool-icon-glyph">{{ tool.glyph }}</text>
            <!-- 状态遮罩 -->
            <view v-if="tool.status !== 'ready'" class="tool-icon-mask">
              <text class="tool-icon-mask-text">{{ tool.status === 'wip' ? '开发中' : '规划中' }}</text>
            </view>
          </view>

          <!-- 信息 -->
          <view class="tool-info">
            <view class="tool-name-row">
              <text class="tool-name">{{ tool.name }}</text>
              <view class="tool-status-badge" :style="{ background: statusBgColor(tool.status), color: statusColor(tool.status) }">
                <view class="tool-status-dot" :style="{ background: statusColor(tool.status) }" />
                <text class="tool-status-text">{{ statusText(tool.status) }}</text>
              </view>
            </view>
            <text class="tool-desc">{{ tool.desc }}</text>
          </view>

          <!-- 箭头 -->
          <view class="tool-arrow" :style="{ color: category.accent }">
            <text>›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部 -->
    <view class="footer">
      <view class="footer-divider">
        <view class="footer-divider-line" />
        <text class="footer-divider-dot" :style="{ color: category.accent }">·</text>
        <view class="footer-divider-line" />
      </view>
      <text class="footer-stat">已上线 {{ readyCount }} · 规划中 {{ plannedCount }}</text>
      <view class="footer-verse" @click="nextVerse">
        <text class="footer-verse-text">「{{ currentVerse.text }}」</text>
        <text class="footer-verse-from">{{ currentVerse.from }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { gsap } from 'gsap'
import { onMounted } from 'vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import StarField from '@/components/effects/StarField.vue'
import TopBar from '@/components/ui/TopBar.vue'
import {
  CATEGORIES,
  getToolsByCategory,
  type Tool,
  type CategoryKey,
} from '@/config/tools'
import { useAppStore } from '@/stores'

const app = useAppStore()
const statusBarHeight = ref(44)
try {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight ?? 0
} catch (_e) {}

const CATEGORY_DESC: Record<CategoryKey, string> = {
  mingli:
    '命理以生辰为根，推演人生格局。本类聚合中国传统的命理之术，从五行八字到奇门遁甲，窥探天地人之间的因果脉络。',
  zhongshu: '占卜以当下为镜，照见未来吉凶。蓍草、塔罗、灵签，形式各异，其本皆为起心动念间的一问。',
  guwu: '古物以器为引，融合象、数、理。三式与术数之学，既是文化的延续，也是古人观天的智慧。',
  jian: '健康以气血为本，关注身心之衡。十二经络、五运六气，将古老的生命观融入现代养生。',
  xiuxin: '修心以静为径，回归内在清明。在喧嚣中觅一处静观，调息、内照、刹那明悟。',
  shenghuo: '生活以日为尺，落地日常所需。黄历择日、十二属相，让传统智慧回归柴米油盐。',
  life: '管理占卜人档案、查看占卜记录。一日同人同工具不宜二占，恐心念不诚，反失灵验。',
}

function getCategoryKey(): CategoryKey {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opt = ((cur as any)?.options || {}) as Record<string, string>
  const k = opt.cat as CategoryKey
  return k || 'mingli'
}

const cat = ref<CategoryKey>(getCategoryKey())
const category = computed(() => CATEGORIES.find((c) => c.key === cat.value) || CATEGORIES[0])
const tools = computed(
  () => getToolsByCategory().find((g) => g.category.key === cat.value)?.tools || [],
)
const readyCount = computed(() => tools.value.filter((t) => t.status === 'ready').length)
const plannedCount = computed(() => tools.value.length - readyCount.value)

const heroBgStyle = computed(() => ({
  background: `radial-gradient(ellipse at 50% 30%, ${category.value.accent}18 0%, transparent 60%)`,
}))

function statusColor(s: string) {
  if (s === 'ready') return '#4FAE6F'
  if (s === 'wip') return '#D4AF37'
  return 'rgba(212,175,55,0.5)'
}
function statusBgColor(s: string) {
  if (s === 'ready') return 'rgba(79,174,111,0.15)'
  if (s === 'wip') return 'rgba(212,175,55,0.15)'
  return 'rgba(212,175,55,0.08)'
}
function statusText(s: string) {
  if (s === 'ready') return '已上线'
  if (s === 'wip') return '开发中'
  return '规划中'
}

function onClick(tool: Tool) {
  if (tool.status === 'ready' && tool.path) {
    uni.navigateTo({ url: tool.path })
  } else if (tool.status === 'wip') {
    uni.showToast({ title: '「' + tool.name + '」开发中 · 敬请期待', icon: 'none', duration: 1800 })
  } else {
    uni.showToast({ title: '「' + tool.name + '」规划中 · 等待解锁', icon: 'none', duration: 1800 })
  }
}

const VERSES = [
  { text: '道生一，一生二，二生三，三生万物。', from: '· 道德经 ·' },
  { text: '易有太极，是生两仪，两仪生四象，四象生八卦。', from: '· 易经 ·' },
  { text: '人法地，地法天，天法道，道法自然。', from: '· 道德经 ·' },
]
const verseIdx = ref(0)
const currentVerse = computed(() => VERSES[verseIdx.value % VERSES.length])
function nextVerse() {
  verseIdx.value++
}

onMounted(() => {
  try {
    gsap.fromTo('.cat-hero-seal', { scale: 0, rotation: -180, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' })
    gsap.fromTo('.cat-hero-title-group', { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, delay: 0.3, ease: 'power2.out' })
    gsap.fromTo('.cat-hero-desc', { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.5, ease: 'power2.out' })
    gsap.fromTo('.tool-card', { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.6, ease: 'power2.out' })
  } catch (_e) {}
})
</script>

<style scoped>
.cat-page {
  position: relative;
  min-height: 100vh;
  padding: 0 24rpx 48rpx;
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

/* ===== 分类英雄区 ===== */
.cat-hero {
  position: relative;
  z-index: var(--z-content);
  margin-top: 16rpx;
  padding: 40rpx 28rpx 32rpx;
  border-radius: var(--r-xl);
  background: linear-gradient(180deg, rgba(31, 31, 43, 0.95) 0%, rgba(10, 10, 18, 0.98) 100%);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.cat-hero-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* 主字符印章 */
.cat-hero-seal {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.cat-hero-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2rpx solid;
  opacity: 0.6;
}

.cat-hero-ring::after {
  content: '';
  position: absolute;
  inset: 8rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.cat-hero-glyph {
  position: relative;
  font-size: 64rpx;
  font-weight: 700;
  font-family: 'KaiTi', serif;
  line-height: 1;
}

/* 标题组 */
.cat-hero-title-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12rpx;
}

.cat-hero-name {
  font-size: 48rpx;
  font-weight: 700;
  font-family: 'KaiTi', serif;
  letter-spacing: 0.4em;
  padding-right: -0.4em;
}

.cat-hero-en {
  font-size: 18rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.3em;
  margin-top: 4rpx;
  opacity: 0.7;
}

/* 分隔线 */
.cat-hero-divider {
  width: 60%;
  margin: 12rpx 0 16rpx;
}

.cat-hero-divider-line {
  height: 1rpx;
}

.cat-hero-sub {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  letter-spacing: 0.2em;
  margin-bottom: 16rpx;
}

.cat-hero-desc {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.8;
  letter-spacing: 0.05em;
  font-family: 'KaiTi', serif;
  text-align: center;
  padding: 0 12rpx;
  opacity: 0.85;
}

/* ===== 工具区 ===== */
.tools-section {
  position: relative;
  z-index: var(--z-content);
  margin-top: 32rpx;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
  padding: 0 4rpx;
}

.section-header-line {
  flex: 1;
  height: 1rpx;
}

.section-header-text {
  font-size: var(--fs-md);
  letter-spacing: 0.4em;
  font-family: 'KaiTi', serif;
  font-weight: 600;
  white-space: nowrap;
}

.tool-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

/* 工具卡片 */
.tool-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-radius: var(--r-lg);
  background: linear-gradient(135deg, rgba(31, 31, 43, 0.95) 0%, rgba(10, 10, 18, 0.98) 100%);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s var(--ease-power);
  animation: slideInLeft 0.5s var(--ease-power) both;
}

.tool-card:active {
  transform: scale(0.98);
  border-color: rgba(212, 175, 55, 0.4);
}

.tool-card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s var(--ease-mystic);
  pointer-events: none;
}

.tool-card:active .tool-card-glow {
  opacity: 0.15;
}

.tool-card.tool-planned,
.tool-card.tool-wip {
  opacity: 0.65;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 图标 */
.tool-icon {
  position: relative;
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.4);
  overflow: hidden;
  flex-shrink: 0;
}

.tool-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 60%);
  pointer-events: none;
}

.tool-icon::after {
  content: '';
  position: absolute;
  inset: 4rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  pointer-events: none;
}

.tool-icon-deco {
  position: absolute;
  top: 2rpx;
  right: 4rpx;
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.4);
  z-index: 1;
}

.tool-icon-glyph {
  font-size: 44rpx;
  color: var(--color-bai);
  font-weight: 700;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.tool-icon-mask {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 18, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  z-index: 2;
}

.tool-icon-mask-text {
  font-size: 16rpx;
  color: var(--color-liu);
  letter-spacing: 0.15em;
  font-family: 'KaiTi', serif;
}

/* 信息 */
.tool-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tool-name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 6rpx;
}

.tool-name {
  font-size: var(--fs-md);
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}

.tool-status-badge {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 2rpx 10rpx;
  border-radius: 9999rpx;
  font-size: 16rpx;
  letter-spacing: 0.05em;
}

.tool-status-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
}

.tool-status-text {
  white-space: nowrap;
}

.tool-desc {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.03em;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 箭头 */
.tool-arrow {
  font-size: 40rpx;
  font-weight: 300;
  margin-left: 12rpx;
  opacity: 0.6;
  transition: transform 0.3s var(--ease-mystic);
  flex-shrink: 0;
}

.tool-card:active .tool-arrow {
  transform: translateX(4rpx);
}

/* ===== 底部 ===== */
.footer {
  position: relative;
  z-index: var(--z-content);
  margin-top: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer-divider {
  display: flex;
  align-items: center;
  gap: 12rpx;
  width: 60%;
  margin-bottom: 16rpx;
}

.footer-divider-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent);
}

.footer-divider-dot {
  font-size: 20rpx;
}

.footer-stat {
  font-size: 18rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
  margin-bottom: 20rpx;
}

.footer-verse {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 12rpx 24rpx;
  border-radius: var(--r-md);
  transition: background 0.3s var(--ease-mystic);
}

.footer-verse:active {
  background: rgba(212, 175, 55, 0.05);
}

.footer-verse-text {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  line-height: 1.6;
  letter-spacing: 0.1em;
  font-family: 'KaiTi', serif;
  text-align: center;
}

.footer-verse-from {
  font-size: 16rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.3em;
  margin-top: 4rpx;
}

/* 减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .tool-card,
  .cat-hero-seal {
    animation: none !important;
  }
}
</style>
