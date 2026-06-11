<template>
  <view
    class="cat-page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <!-- 背景 -->
    <view class="taiji-bg">
      <TaijiBg />
    </view>

    <!-- 状态栏 + 顶栏 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <TopBar :title="category.name" :subtitle="category.subtitle" />

    <!-- 分类头部（主题色装饰） -->
    <view v-if="cat" class="cat-hero" :style="heroStyle">
      <view class="cat-hero-bg" :style="heroBgStyle" />
      <view class="cat-hero-content">
        <text
          class="cat-hero-glyph"
          :style="{ color: category.accent, textShadow: '0 0 24rpx ' + category.accent }"
        >
          {{ category.glyph }}
        </text>
        <text class="cat-hero-name" :style="{ color: category.accent }">{{ category.name }}</text>
        <text class="cat-hero-en">{{ category.enName }}</text>
        <text class="cat-hero-sub">{{ category.subtitle }} · {{ tools.length }} 项</text>
        <view
          class="cat-hero-divider"
          :style="{
            background: 'linear-gradient(90deg, transparent, ' + category.accent + ', transparent)',
          }"
        />
        <text class="cat-hero-desc">{{ CATEGORY_DESC[cat] || '' }}</text>
      </view>
    </view>

    <!-- 工具列表 -->
    <view class="tools">
      <view class="section-title">
        <text class="section-title-text">入 口</text>
        <text
          class="section-title-line"
          :style="{ background: 'linear-gradient(90deg, ' + category.accent + ', transparent)' }"
        />
      </view>

      <view class="tool-grid">
        <view
          v-for="(tool, i) in tools"
          :key="tool.key"
          class="t-card"
          :class="['t-' + tool.status, 't-card-anim']"
          :style="{ animationDelay: i * 0.06 + 's' }"
          @click="onClick(tool)"
        >
          <view class="t-card-inner">
            <view class="t-icon" :style="{ background: tool.gradient }">
              <text class="t-deco">{{ tool.deco }}</text>
              <text class="t-glyph">{{ tool.glyph }}</text>
              <view v-if="tool.status !== 'ready'" class="t-mask">
                <text class="t-mask-text">{{ tool.status === 'wip' ? '开发中' : '规划中' }}</text>
              </view>
            </view>
            <view class="t-info">
              <text class="t-name title-mystic">{{ tool.name }}</text>
              <text class="t-desc">{{ tool.desc }}</text>
              <view class="t-status">
                <view class="t-dot" :style="{ background: statusColor(tool.status) }" />
                <text class="t-status-text" :style="{ color: statusColor(tool.status) }">
                  {{ statusText(tool.status) }}
                </text>
              </view>
            </view>
            <text class="t-arrow">›</text>
            <view class="t-glow" :style="{ background: tool.glow }" />
          </view>
        </view>
      </view>
    </view>

    <!-- 底部签语 -->
    <view class="footer">
      <text class="footer-stat">已上线 {{ readyCount }} / 规划 {{ plannedCount }} 项</text>
      <view class="verse-box" @click="nextVerse">
        <text class="verse">{{ currentVerse?.text ?? '' }}</text>
        <text class="footer-sub">{{ currentVerse?.from ?? '' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import {
  CATEGORIES,
  getToolsByCategory,
  READY_COUNT as _READY_COUNT,
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
  const cur = pages[pages.length - 1]!
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opt = ((cur as any)?.options || {}) as Record<string, string>
  const k = opt['cat'] as CategoryKey
  return k || 'mingli'
}

const cat = ref<CategoryKey>(getCategoryKey())
const category = computed(() => CATEGORIES.find((c) => c.key === cat.value) || CATEGORIES[0]!)
const tools = computed(
  () => getToolsByCategory().find((g) => g.category.key === cat.value)?.tools || [],
)
const readyCount = computed(() => tools.value.filter((t) => t.status === 'ready').length)
const plannedCount = computed(() => tools.value.length - readyCount.value)

const heroStyle = computed(() => ({
  '--cat-accent': category.value.accent,
}))
const heroBgStyle = computed(() => ({
  background: `radial-gradient(ellipse at center, ${category.value.accent}20 0%, transparent 70%)`,
}))

function statusColor(s: string) {
  if (s === 'ready') return '#4FAE6F'
  if (s === 'wip') return '#D4AF37'
  return 'rgba(212,175,55,0.5)'
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
</script>

<style scoped>
.cat-page {
  position: relative;
  min-height: 100vh;
  padding: 0 20rpx 40rpx;
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

/* ===== 分类头 ===== */
.cat-hero {
  position: relative;
  z-index: var(--z-content);
  margin-top: 20rpx;
  padding: 36rpx 24rpx 28rpx;
  border-radius: var(--r-lg);
  background: linear-gradient(135deg, var(--color-xuan-2) 0%, var(--color-xuan) 100%);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  overflow: hidden;
}

.cat-hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cat-hero-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.cat-hero-glyph {
  font-size: 80rpx;
  font-weight: 700;
  font-family: 'KaiTi', serif;
  line-height: 1;
  margin-bottom: 8rpx;
}

.cat-hero-name {
  font-size: 48rpx;
  font-weight: 700;
  font-family: 'KaiTi', serif;
  letter-spacing: 0.3em;
  margin-bottom: 4rpx;
}

.cat-hero-en {
  font-size: 18rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.4em;
}

.cat-hero-sub {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  letter-spacing: 0.2em;
  margin-top: 6rpx;
}

.cat-hero-divider {
  width: 80%;
  height: 1rpx;
  margin: 16rpx 0;
  opacity: 0.6;
}

.cat-hero-desc {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.8;
  letter-spacing: 0.05em;
  font-family: 'KaiTi', serif;
  text-align: center;
  padding: 0 8rpx;
}

/* ===== 工具区 ===== */
.tools {
  position: relative;
  z-index: var(--z-content);
  margin-top: 32rpx;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
  padding: 0 4rpx;
}

.section-title-text {
  font-size: var(--fs-md);
  color: var(--color-liu);
  letter-spacing: 0.4em;
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.section-title-line {
  flex: 1;
  height: 1rpx;
  opacity: 0.4;
}

.tool-grid {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.t-card {
  position: relative;
  border-radius: var(--r-md);
  overflow: hidden;
  transition: all 0.3s var(--ease-mystic);
  cursor: pointer;
}

.t-card-anim {
  animation: cardIn 0.5s var(--ease-mystic) both;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateX(20rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.t-card:active {
  transform: scale(0.98);
}

.t-card.t-planned,
.t-card.t-wip {
  opacity: 0.6;
}

.t-card-inner {
  position: relative;
  display: flex;
  align-items: center;
  padding: 16rpx 18rpx;
  background: linear-gradient(135deg, var(--color-xuan-2) 0%, var(--color-xuan) 100%);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  z-index: 1;
}

.t-icon {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
  overflow: hidden;
  flex-shrink: 0;
}

.t-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25) 0%, transparent 60%);
  pointer-events: none;
}

.t-icon::after {
  content: '';
  position: absolute;
  inset: 3rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  pointer-events: none;
}

.t-deco {
  position: absolute;
  top: 1rpx;
  right: 3rpx;
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.4);
  z-index: 1;
}

.t-glyph {
  font-size: 42rpx;
  color: var(--color-bai);
  font-weight: 700;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.t-mask {
  position: absolute;
  inset: 0;
  background: rgba(10, 10, 18, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
}

.t-mask-text {
  font-size: 16rpx;
  color: var(--color-liu);
  letter-spacing: 0.15em;
  font-family: 'KaiTi', serif;
}

.t-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.t-name {
  font-size: var(--fs-md);
  font-weight: 600;
  letter-spacing: 0.1em;
  margin-bottom: 4rpx;
  color: var(--color-bai);
}

.t-desc {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.05em;
  margin-bottom: 6rpx;
  line-height: 1.3;
}

.t-status {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.t-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 9999rpx;
}

.t-status-text {
  font-size: 18rpx;
  letter-spacing: 0.1em;
  opacity: 0.85;
}

.t-arrow {
  font-size: 32rpx;
  color: var(--color-bai-3);
  font-weight: 300;
  margin-left: 8rpx;
}

.t-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
  z-index: 0;
}

.t-card:active .t-glow {
  opacity: 0.3;
}

/* ===== 底部 ===== */
.footer {
  position: relative;
  z-index: var(--z-content);
  margin-top: 32rpx;
  text-align: center;
  padding: 0 8rpx;
}

.footer-stat {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
  opacity: 0.6;
  margin-bottom: 16rpx;
}

.verse-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.verse {
  font-size: var(--fs-xs);
  color: var(--color-bai);
  line-height: 1.5;
  letter-spacing: 0.1em;
  font-family: 'KaiTi', serif;
  font-style: italic;
  text-align: center;
}

.footer-sub {
  font-size: 18rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.3em;
  margin-top: 2rpx;
}
</style>
