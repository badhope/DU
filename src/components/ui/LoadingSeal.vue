<!--
  玄枢 MISTVERSE · 占卜中 Loading 封印
  - 中心太极图旋转
  - 外环 12 道光芒 + 卦爻飘动
  - 内圈倒计时 + 步骤文字
  - 8 卦粒子绕轨运行
-->
<template>
  <view class="loading-mask anim-fade">
    <view class="lm-card card-mystic anim-scale-in">
      <!-- 外层光芒 -->
      <view class="lm-rays">
        <view v-for="i in 12" :key="'r-' + i" class="ray" :class="`ray-${i}`" />
      </view>

      <!-- 中心卦印 -->
      <view class="lm-taiji" :class="{ 'is-shaking': isShake }">
        <view class="taiji-ring anim-rotate-fast" />
        <view class="taiji-disc anim-breathe">
          <view class="taiji-yang" />
          <view class="taiji-yin" />
        </view>
        <view class="taiji-glyph text-glow-liu">卦</view>
      </view>

      <!-- 8 卦粒子 -->
      <view class="lm-orbit">
        <view v-for="(g, i) in 8" :key="'o-' + i" class="orbit-item" :class="`orbit-${i}`">
          <text class="orbit-glyph">{{ BAGUA[i] }}</text>
        </view>
      </view>

      <!-- 标题 -->
      <text class="lm-title title-mystic anim-fade-up">{{ title }}</text>
      <text class="lm-step anim-fade-up delay-200">{{ stepText }}</text>

      <!-- 进度条 -->
      <view class="lm-progress progress">
        <view class="progress-fill" :style="{ width: progress + '%' }" />
        <view class="progress-shimmer" />
      </view>

      <!-- 进度文字 -->
      <text class="lm-pct">{{ Math.floor(progress) }}%</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 标题 */
    title?: string
    /** 步骤列表（循环） */
    steps?: string[]
    /** 总时长（ms） */
    duration?: number
    /** 摇卦阶段（0-1） */
    shakeRatio?: number
    /** 是否可见 */
    visible?: boolean
  }>(),
  {
    title: '玄 机 推 演 中',
    steps: () => [
      '清 心 · 凝 神',
      '观 象 · 感 应',
      '起 卦 · 演 数',
      '排 盘 · 归 藏',
      '解 卦 · 断 事',
    ],
    duration: 3000,
    shakeRatio: 0.4,
    visible: true,
  },
)

const BAGUA = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷']
const progress = ref(0)
const stepIdx = ref(0)
const isShake = ref(false)
let raf: any = null
let startTime = 0

const stepText = computed(() => props.steps[stepIdx.value] || '')

function tick() {
  const elapsed = Date.now() - startTime
  const pct = Math.min(100, (elapsed / props.duration) * 100)
  progress.value = pct
  // 摇卦阶段（前 40%）
  isShake.value = pct < props.shakeRatio * 100
  // 步骤切换
  const n = Math.floor((pct / 100) * props.steps.length)
  stepIdx.value = Math.min(props.steps.length - 1, n)
  if (pct < 100) {
    raf = requestAnimationFrame(tick)
  }
}

function start() {
  if (typeof window === 'undefined') return
  startTime = Date.now()
  progress.value = 0
  stepIdx.value = 0
  if (raf) cancelAnimationFrame(raf)
  raf = requestAnimationFrame(tick)
}

function stop() {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = null
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) start()
    else stop()
  },
)
watch(
  () => props.duration,
  () => {
    if (props.visible) start()
  },
)

onMounted(() => {
  if (props.visible) start()
})
onBeforeUnmount(stop)
</script>

<style scoped>
.loading-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 18, 0.85);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
}
.lm-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 600rpx;
  max-width: 90vw;
  padding: 80rpx 40rpx 60rpx;
  border-radius: 32rpx;
  background:
    radial-gradient(ellipse at center, rgba(212, 175, 55, 0.12) 0%, transparent 70%),
    linear-gradient(180deg, rgba(20, 20, 28, 0.95), rgba(10, 10, 18, 0.95));
  border: 1rpx solid rgba(212, 175, 55, 0.4);
  box-shadow:
    0 0 80rpx rgba(212, 175, 55, 0.3),
    0 0 200rpx rgba(200, 48, 42, 0.15);
  overflow: visible;
}

/* 外层 12 道光芒 */
.lm-rays {
  position: absolute;
  inset: -200rpx;
  pointer-events: none;
}
.ray {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2rpx;
  height: 200rpx;
  background: linear-gradient(180deg, transparent, rgba(212, 175, 55, 0.6), transparent);
  transform-origin: 50% 100%;
  pointer-events: none;
  animation: rayBreathe 2.4s ease-in-out infinite;
}
.ray-0 {
  transform: translate(-50%, -100%) rotate(0deg);
  animation-delay: 0s;
}
.ray-1 {
  transform: translate(-50%, -100%) rotate(30deg);
  animation-delay: 0.1s;
}
.ray-2 {
  transform: translate(-50%, -100%) rotate(60deg);
  animation-delay: 0.2s;
}
.ray-3 {
  transform: translate(-50%, -100%) rotate(90deg);
  animation-delay: 0.3s;
}
.ray-4 {
  transform: translate(-50%, -100%) rotate(120deg);
  animation-delay: 0.4s;
}
.ray-5 {
  transform: translate(-50%, -100%) rotate(150deg);
  animation-delay: 0.5s;
}
.ray-6 {
  transform: translate(-50%, -100%) rotate(180deg);
  animation-delay: 0.6s;
}
.ray-7 {
  transform: translate(-50%, -100%) rotate(210deg);
  animation-delay: 0.7s;
}
.ray-8 {
  transform: translate(-50%, -100%) rotate(240deg);
  animation-delay: 0.8s;
}
.ray-9 {
  transform: translate(-50%, -100%) rotate(270deg);
  animation-delay: 0.9s;
}
.ray-10 {
  transform: translate(-50%, -100%) rotate(300deg);
  animation-delay: 1s;
}
.ray-11 {
  transform: translate(-50%, -100%) rotate(330deg);
  animation-delay: 1.1s;
}
@keyframes rayBreathe {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.9;
  }
}

/* 中心太极 */
.lm-taiji {
  position: relative;
  width: 240rpx;
  height: 240rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}
.taiji-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2rpx solid rgba(212, 175, 55, 0.6);
  box-shadow:
    inset 0 0 24rpx rgba(212, 175, 55, 0.3),
    0 0 24rpx rgba(212, 175, 55, 0.4);
}
.lm-taiji.is-shaking .taiji-ring {
  animation: shakeHard 0.6s ease-in-out infinite;
}
.taiji-disc {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: #000;
  overflow: hidden;
  box-shadow:
    0 0 32rpx rgba(212, 175, 55, 0.4),
    inset 0 0 16rpx rgba(0, 0, 0, 0.6);
}
.taiji-yang {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  background: linear-gradient(180deg, #f5f1e8 0%, #b8b2a0 100%);
}
.taiji-yin {
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: #0a0a12;
}
.taiji-disc::before,
.taiji-disc::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 50%;
  border-radius: 50%;
  z-index: 2;
}
.taiji-disc::before {
  top: 0;
  background: #f5f1e8;
  box-shadow: inset 0 0 8rpx #b8b2a0;
}
.taiji-disc::after {
  top: 50%;
  background: #0a0a12;
  box-shadow: inset 0 0 8rpx rgba(245, 241, 232, 0.3);
}
.taiji-glyph {
  position: absolute;
  font-size: 96rpx;
  font-family: serif;
  font-weight: bold;
  color: var(--color-liu);
  z-index: 3;
  text-shadow: 0 0 16rpx var(--color-liu);
}

/* 8 卦轨道 */
.lm-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360rpx;
  height: 360rpx;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.orbit-item {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 32rpx;
  color: var(--color-liu);
  text-shadow: 0 0 12rpx var(--color-liu);
  animation: orbitItem 4.8s linear infinite;
  opacity: 0.7;
}
.orbit-0 {
  animation-delay: 0s;
}
.orbit-1 {
  animation-delay: 0.6s;
}
.orbit-2 {
  animation-delay: 1.2s;
}
.orbit-3 {
  animation-delay: 1.8s;
}
.orbit-4 {
  animation-delay: 2.4s;
}
.orbit-5 {
  animation-delay: 3s;
}
.orbit-6 {
  animation-delay: 3.6s;
}
.orbit-7 {
  animation-delay: 4.2s;
}
@keyframes orbitItem {
  0% {
    transform: rotate(0deg) translateX(180rpx) rotate(0deg) scale(0.8);
    opacity: 0;
  }
  10% {
    opacity: 0.9;
  }
  50% {
    transform: rotate(180deg) translateX(180rpx) rotate(-180deg) scale(1.2);
    opacity: 1;
  }
  90% {
    opacity: 0.9;
  }
  100% {
    transform: rotate(360deg) translateX(180rpx) rotate(-360deg) scale(0.8);
    opacity: 0;
  }
}

/* 文字 */
.lm-title {
  display: block;
  font-size: 44rpx;
  font-weight: bold;
  color: var(--color-liu);
  text-shadow: 0 0 16rpx var(--color-liu);
  letter-spacing: 0.4em;
  text-align: center;
  margin-bottom: 16rpx;
}
.lm-step {
  display: block;
  font-size: 28rpx;
  color: var(--color-bai-2);
  letter-spacing: 0.3em;
  text-align: center;
  margin-bottom: 40rpx;
  min-height: 40rpx;
  transition: color 0.4s var(--ease-mystic);
}
.lm-progress {
  width: 100%;
  max-width: 480rpx;
  margin-bottom: 16rpx;
}
.lm-pct {
  display: block;
  font-size: 32rpx;
  color: var(--color-liu);
  text-align: center;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  text-shadow: 0 0 8rpx var(--color-liu);
}
</style>
