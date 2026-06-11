<template>
  <view v-if="visible" class="mystic-scan">
    <view class="ms-mask"></view>

    <!-- 中央扫描框 -->
    <view class="ms-stage">
      <!-- 太极旋转环 -->
      <view class="ms-ring">
        <view class="ms-ring-outer"></view>
        <view class="ms-ring-mid"></view>
        <view class="ms-ring-inner"></view>
        <view class="ms-glyph">{{ glyph }}</view>
      </view>

      <!-- 横向扫描线 -->
      <view class="ms-scanline"></view>

      <!-- 阶段提示 -->
      <view :key="phase" class="ms-hint">
        <text class="ms-hint-text">{{ hintText }}</text>
        <text class="ms-hint-sub">{{ hintSub }}</text>
      </view>

      <!-- 进度条 -->
      <view class="ms-progress">
        <view class="ms-progress-fill" :style="{ width: progress + '%' }"></view>
      </view>

      <!-- 阶段指示点 -->
      <view class="ms-steps">
        <view
          v-for="(s, i) in steps"
          :key="i"
          class="ms-step"
          :class="{ active: i === phase, done: i < phase }"
        >
          <text class="ms-step-num">{{ i + 1 }}</text>
          <text class="ms-step-label">{{ s }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    /** 大师字形（玄/命/卦/宅/名/养） */
    glyph?: string
    /** 主题色（HSL/HEX 皆可） */
    color?: string
    /** 三个阶段标题 */
    steps?: string[]
    /** 三个阶段副标题（每阶段显示一行） */
    hintSubs?: string[]
    /** 扫描完成回调（务必在 props.visible 由 true→false 切换前被父组件决定） */
  }>(),
  {
    glyph: '玄',
    color: '#D4AF37',
    steps: () => ['扫描', '感应', '解析'],
    hintSubs: () => [
      '请保持脸在屏幕前 · 聚气勿动',
      '请保持手在屏幕前 · 静候感应',
      '正在解析命盘 · 即将揭晓',
    ],
  },
)

const emit = defineEmits<{
  (e: 'done'): void
}>()

const phase = ref(0)
const progress = ref(0)
const hintText = ref('')
const hintSub = ref('')

let timers: number[] = []

function clearTimers() {
  timers.forEach((t) => clearTimeout(t))
  timers = []
}

function playPhases() {
  clearTimers()
  phase.value = 0
  progress.value = 0
  // 阶段 1: 2.4s "请保持脸在屏幕前"
  hintText.value = '请保持脸在屏幕前'
  hintSub.value = props.hintSubs[0]
  const t1a = setTimeout(() => {
    progress.value = 33
  }, 50)
  const t1b = setTimeout(() => {
    phase.value = 1
    hintText.value = '请保持手在屏幕前'
    hintSub.value = props.hintSubs[1]
    progress.value = 66
  }, 2400)
  // 阶段 2: 1.8s "感应气场"
  const t2a = setTimeout(() => {
    phase.value = 2
    hintText.value = '正在解析命盘'
    hintSub.value = props.hintSubs[2]
    progress.value = 100
  }, 4200)
  // 完成
  const tDone = setTimeout(() => {
    emit('done')
  }, 5000)
  timers.push(t1a, t1b, t2a, tDone)
}

watch(
  () => props.visible,
  (v) => {
    if (v) playPhases()
    else clearTimers()
  },
)

onUnmounted(clearTimers)
</script>

<style scoped>
.mystic-scan {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  pointer-events: all;
}
.ms-mask {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 50%, rgba(20, 20, 28, 0.6) 0%, rgba(5, 5, 10, 0.96) 70%),
    rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8rpx);
}
.ms-stage {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx;
  padding: 60rpx 80rpx;
}

/* ── 旋转环 ── */
.ms-ring {
  position: relative;
  width: 320rpx;
  height: 320rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ms-ring-outer,
.ms-ring-mid,
.ms-ring-inner {
  position: absolute;
  border-radius: 50%;
  border: 2rpx solid;
  border-color: v-bind('props.color') transparent v-bind('props.color') transparent;
}
.ms-ring-outer {
  width: 320rpx;
  height: 320rpx;
  border-width: 4rpx;
  animation: ring-spin 3s linear infinite;
  opacity: 0.6;
}
.ms-ring-mid {
  width: 240rpx;
  height: 240rpx;
  border-width: 3rpx;
  animation: ring-spin 2s linear infinite reverse;
  opacity: 0.8;
}
.ms-ring-inner {
  width: 160rpx;
  height: 160rpx;
  border-width: 2rpx;
  animation: ring-spin 1.5s linear infinite;
  opacity: 1;
  box-shadow: 0 0 30rpx v-bind('props.color');
}

.ms-glyph {
  position: relative;
  font-size: 100rpx;
  font-family: 'KaiTi', 'STKaiti', serif;
  font-weight: 700;
  color: v-bind('props.color');
  text-shadow:
    0 0 30rpx v-bind('props.color'),
    0 0 60rpx v-bind('props.color');
  animation: glyph-pulse 2s ease-in-out infinite;
  z-index: 2;
}

@keyframes ring-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes glyph-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.85;
  }
}

/* ── 横向扫描线 ── */
.ms-scanline {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 4rpx;
  background: linear-gradient(90deg, transparent, v-bind('props.color'), transparent);
  box-shadow: 0 0 20rpx v-bind('props.color');
  animation: scan-move 2.4s ease-in-out infinite;
  z-index: 0;
}
@keyframes scan-move {
  0% {
    transform: translateY(-200rpx);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateY(200rpx);
    opacity: 0;
  }
}

/* ── 阶段提示 ── */
.ms-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  min-height: 100rpx;
  animation: hint-in 0.5s ease-out;
}
@keyframes hint-in {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.ms-hint-text {
  font-size: 44rpx;
  color: v-bind('props.color');
  font-family: 'KaiTi', 'STKaiti', serif;
  font-weight: 700;
  text-shadow: 0 0 20rpx v-bind('props.color');
  letter-spacing: 0.1em;
}
.ms-hint-sub {
  font-size: 24rpx;
  color: var(--color-bai-2, #ccc);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.15em;
}

/* ── 进度条 ── */
.ms-progress {
  width: 480rpx;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4rpx;
  overflow: hidden;
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}
.ms-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, v-bind('props.color'), #fff, v-bind('props.color'));
  box-shadow: 0 0 20rpx v-bind('props.color');
  transition: width 0.4s ease-out;
}

/* ── 阶段指示点 ── */
.ms-steps {
  display: flex;
  gap: 32rpx;
  align-items: center;
}
.ms-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  opacity: 0.4;
  transition:
    opacity 0.3s,
    transform 0.3s;
}
.ms-step.active {
  opacity: 1;
  transform: scale(1.1);
}
.ms-step.done {
  opacity: 0.7;
}
.ms-step-num {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: rgba(20, 20, 28, 0.8);
  border: 2rpx solid v-bind('props.color');
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: v-bind('props.color');
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.ms-step.active .ms-step-num {
  background: v-bind('props.color');
  color: #0a0a12;
  box-shadow: 0 0 20rpx v-bind('props.color');
}
.ms-step-label {
  font-size: 22rpx;
  color: var(--color-bai-2, #ccc);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
}
.ms-step.active .ms-step-label {
  color: v-bind('props.color');
  font-weight: 700;
}
</style>
