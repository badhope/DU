<template>
  <view class="fangqi-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="放松冥想" subtitle="RELAX & MEDITATE" />

    <!-- 选择 -->
    <view v-if="!running && !finished" class="setup card-mystic anim-fade-up">
      <text class="setup-title title-mystic">放 松 · 归 真</text>
      <text class="setup-sub">七 节 引 导 · 五 种 声 境</text>

      <view class="sec">
        <text class="sec-label">· 步 骤</text>
        <view class="step-list">
          <view v-for="(s, i) in steps" :key="i" class="step-item">
            <text class="step-num">{{ i + 1 }}</text>
            <view class="step-info">
              <text class="step-name">{{ s.name }}</text>
              <text class="step-desc">{{ s.desc }}</text>
              <text class="step-sec">{{ s.duration }} 秒</text>
            </view>
          </view>
        </view>
      </view>

      <view class="sec">
        <text class="sec-label">· 声 境</text>
        <view class="bg-list">
          <view
            v-for="(b, i) in backgrounds"
            :key="i"
            class="bg-item"
            :class="{ active: bg === i }"
            @click="bg = i"
          >
            <text class="bg-glyph">{{ b.glyph }}</text>
            <text class="bg-name">{{ b.name }}</text>
            <text class="bg-freq">{{ b.freq }}Hz</text>
          </view>
        </view>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" @click="start">开 始 冥 想</view>
      </view>
    </view>

    <!-- 冥想中 -->
    <view v-else-if="running" class="running">
      <view class="wave-area">
        <!-- 声波 -->
        <view class="wave-bars">
          <view v-for="(b, i) in 16" :key="i" class="wave-bar" :style="barStyle(i)"></view>
        </view>
        <text class="bg-glyph-big">{{ currentBg.glyph }}</text>
        <text class="bg-label">{{ currentBg.name }} · {{ currentBg.desc }}</text>
      </view>

      <view class="step-card card-mystic">
        <text class="step-num-big">{{ currentStepIdx + 1 }} / {{ steps.length }}</text>
        <text class="step-name-big">{{ currentStep.name }}</text>
        <text class="step-desc-big">{{ currentStep.guide }}</text>
        <text class="step-timer">{{ stepRemaining }} 秒</text>
      </view>

      <view class="prog">
        <view class="prog-bar">
          <view class="prog-fill" :style="{ width: progress * 100 + '%' }"></view>
        </view>
      </view>

      <view class="run-actions">
        <view class="btn-liu" @click="pause">{{ paused ? '继 续' : '暂 停' }}</view>
        <view class="btn-bad" @click="stop">结 束</view>
      </view>
    </view>

    <!-- 完成 -->
    <view v-else class="done card-mystic anim-fade-up">
      <text class="done-glyph">◯</text>
      <text class="done-title title-mystic">冥 想 圆 满</text>
      <text class="done-sub">共 {{ formatTime(totalSec) }}</text>
      <text class="done-msg">{{ doneMessage }}</text>
      <view class="form-actions">
        <view class="btn-zhu" @click="reset">再 冥 想 一 次</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'

const app = useAppStore()

const steps = [
  { name: '闭目', desc: '轻轻合上双眼', guide: '感受眼睑的温度 · 让眼睛放松下来', duration: 30 },
  {
    name: '调息',
    desc: '4-7-8 呼吸法',
    guide: '吸气 4 秒 · 屏息 7 秒 · 呼气 8 秒 · 重复 4 轮',
    duration: 60,
  },
  {
    name: '放松',
    desc: '从头到脚',
    guide: '头皮舒展 · 眉心舒展 · 肩膀下沉 · 胸腹舒展 · 腿脚放松',
    duration: 60,
  },
  {
    name: '内观',
    desc: '观察呼吸',
    guide: '只是观察 · 不评判 · 不控制 · 让呼吸自然来去',
    duration: 90,
  },
  {
    name: '慈悲',
    desc: '送一份祝福',
    guide: '愿我平安 · 愿我健康 · 愿我自在 · 愿我喜乐',
    duration: 45,
  },
  {
    name: '感恩',
    desc: '感谢此刻',
    guide: '感谢这具身体 · 感谢这口气息 · 感谢这片刻安宁',
    duration: 45,
  },
  {
    name: '回归',
    desc: '慢慢回来',
    guide: '感受身体的重量 · 感受外界的声音 · 准备睁开眼睛',
    duration: 30,
  },
]

const backgrounds = [
  { name: '禅院钟声', glyph: '钟', freq: 432, desc: '深沉悠远 · 警策精进' },
  { name: '林间雨声', glyph: '雨', freq: 528, desc: '淅沥绵绵 · 静心入定' },
  { name: '海边潮音', glyph: '潮', freq: 396, desc: '海浪反复 · 潮起潮落' },
  { name: '山间风声', glyph: '风', freq: 480, desc: '林海松涛 · 虚空无碍' },
  { name: '静夜虫鸣', glyph: '虫', freq: 285, desc: '夏夜低吟 · 万物同频' },
]

const bg = ref(0)
const running = ref(false)
const paused = ref(false)
const finished = ref(false)
const currentStepIdx = ref(0)
const stepRemaining = ref(0)
const totalSec = ref(0)
const doneMessage = ref('')
const waveSeed = ref(0)

const currentBg = computed(() => backgrounds[bg.value])
const currentStep = computed(() => steps[currentStepIdx.value])
const progress = computed(() => {
  const total = steps.reduce((s, x) => s + x.duration, 0)
  let elapsed = 0
  for (let i = 0; i < currentStepIdx.value; i++) elapsed += steps[i].duration
  elapsed += currentStep.value.duration - stepRemaining.value
  return Math.min(1, elapsed / total)
})

const doneMessages = [
  '心如止水 · 诸缘放下',
  '一念清明 · 万事从容',
  '万缘皆寂 · 自性圆明',
  '心静如水 · 自然无碍',
  '身心轻安 · 自在归真',
]

let mainTimer: any
let waveTimer: any

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m} 分 ${s} 秒`
}

function start() {
  running.value = true
  paused.value = false
  finished.value = false
  totalSec.value = steps.reduce((s, x) => s + x.duration, 0)
  currentStepIdx.value = 0
  stepRemaining.value = steps[0].duration
  startMain()
  startWave()
}

function startMain() {
  mainTimer = setInterval(() => {
    if (paused.value) return
    stepRemaining.value--
    if (stepRemaining.value <= 0) {
      currentStepIdx.value++
      if (currentStepIdx.value >= steps.length) {
        finish()
      } else {
        stepRemaining.value = steps[currentStepIdx.value].duration
      }
    }
  }, 1000)
}

function startWave() {
  waveTimer = setInterval(() => {
    if (paused.value) return
    waveSeed.value = (waveSeed.value + 1) % 100
  }, 150)
}

function barStyle(i: number) {
  const seed = waveSeed.value
  const h = 30 + Math.abs(Math.sin((seed + i) * 0.4)) * 80
  return { height: h + 'rpx' }
}

function pause() {
  paused.value = !paused.value
}
function stop() {
  clearInterval(mainTimer)
  clearInterval(waveTimer)
  running.value = false
  finished.value = true
  doneMessage.value = doneMessages[Math.floor(Math.random() * doneMessages.length)]
  const elapsed =
    totalSec.value -
    (steps.slice(currentStepIdx.value).reduce((s, x) => s + x.duration, 0) - stepRemaining.value)
  app.addHistory({
    tool: 'fangqi',
    toolName: '放松冥想',
    category: '修心',
    input: { bg: bg.value },
    output: { elapsed },
    brief: `${currentBg.value.name} ${formatTime(elapsed)}`,
  })
}
function finish() {
  clearInterval(mainTimer)
  clearInterval(waveTimer)
  running.value = false
  finished.value = true
  doneMessage.value = doneMessages[Math.floor(Math.random() * doneMessages.length)]
  app.addHistory({
    tool: 'fangqi',
    toolName: '放松冥想',
    category: '修心',
    input: { bg: bg.value },
    output: { total: totalSec.value },
    brief: `${currentBg.value.name} 圆满 ${formatTime(totalSec.value)}`,
  })
}
function reset() {
  running.value = false
  finished.value = false
  currentStepIdx.value = 0
  stepRemaining.value = 0
}

onUnmounted(() => {
  clearInterval(mainTimer)
  clearInterval(waveTimer)
})
</script>

<style scoped>
.fangqi-page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}
.setup,
.running,
.done {
  margin: var(--sp-2);
}
.card-mystic {
  padding: var(--sp-4);
}
.setup-title {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
}
.setup-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-bottom: var(--sp-4);
}
.sec {
  margin: var(--sp-3) 0;
}
.sec-label {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-bottom: var(--sp-2);
}
.step-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.step-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  border-left: 4rpx solid var(--color-liu);
}
.step-num {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b3a8e, #4fae6f);
  color: var(--color-bai);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.step-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.step-name {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.step-desc {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}
.step-sec {
  font-size: 20rpx;
  color: var(--color-bai-3);
}

.bg-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.bg-item {
  flex: 1;
  min-width: 140rpx;
  text-align: center;
  padding: var(--sp-3) var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  cursor: pointer;
}
.bg-item.active {
  background: linear-gradient(135deg, #5b3a8e, #4fae6f);
  color: var(--color-bai);
  border-color: var(--color-liu);
}
.bg-glyph {
  font-size: 50rpx;
  display: block;
  font-family: 'KaiTi', serif;
}
.bg-name {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-weight: 600;
  display: block;
  margin-top: 4rpx;
}
.bg-freq {
  font-size: 20rpx;
  color: var(--color-bai-3);
  display: block;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}
.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #5b3a8e, #4fae6f);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 320rpx;
  text-align: center;
}

/* 冥想中 */
.running {
  padding: 0 var(--sp-2);
}
.wave-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-5) var(--sp-3);
  background: linear-gradient(180deg, rgba(91, 58, 142, 0.3), rgba(10, 10, 18, 0.6));
  border-radius: var(--r-md);
  margin-bottom: var(--sp-2);
}
.wave-bars {
  display: flex;
  align-items: center;
  gap: 4rpx;
  height: 100rpx;
  margin-bottom: var(--sp-3);
}
.wave-bar {
  width: 6rpx;
  background: linear-gradient(180deg, var(--color-liu), rgba(212, 175, 55, 0.3));
  border-radius: 3rpx;
  transition: height 0.15s ease;
}
.bg-glyph-big {
  font-size: 120rpx;
  color: var(--color-liu);
  text-shadow: 0 0 30rpx rgba(212, 175, 55, 0.5);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.bg-label {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-top: var(--sp-2);
}

.step-card {
  padding: var(--sp-5) var(--sp-4);
  text-align: center;
  margin-bottom: var(--sp-2);
}
.step-num-big {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}
.step-name-big {
  display: block;
  font-size: 60rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 16rpx rgba(212, 175, 55, 0.4);
  margin: var(--sp-2) 0;
}
.step-desc-big {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
  margin: var(--sp-3) 0;
}
.step-timer {
  display: block;
  font-size: 80rpx;
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-top: var(--sp-3);
}

.prog {
  padding: 0 var(--sp-2);
  margin-bottom: var(--sp-2);
}
.prog-bar {
  height: 8rpx;
  background: rgba(212, 175, 55, 0.2);
  border-radius: 4rpx;
  overflow: hidden;
}
.prog-fill {
  height: 100%;
  background: linear-gradient(90deg, #5b3a8e, #4fae6f);
  transition: width 1s linear;
}

.run-actions {
  display: flex;
  gap: var(--sp-2);
  padding: 0 var(--sp-2);
}
.btn-liu,
.btn-bad {
  flex: 1;
  text-align: center;
  padding: var(--sp-3) 0;
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
}
.btn-liu {
  background: transparent;
  color: var(--color-liu);
  border: 1rpx solid var(--color-liu);
}
.btn-bad {
  background: rgba(200, 48, 42, 0.2);
  color: #f5c5c0;
  border: 1rpx solid #c8302a;
}

.done {
  padding: var(--sp-6) var(--sp-4);
  text-align: center;
}
.done-glyph {
  display: block;
  font-size: 140rpx;
  color: var(--color-liu);
  text-shadow: 0 0 30rpx rgba(212, 175, 55, 0.5);
  margin-bottom: var(--sp-3);
}
.done-title {
  display: block;
  font-size: var(--fs-lg);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
}
.done-sub {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  margin-bottom: var(--sp-4);
}
.done-msg {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  margin: var(--sp-4) 0;
  line-height: 1.7;
  letter-spacing: 0.1em;
}
</style>
