<template>
  <view class="zhan-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="坐禅计时" subtitle="ZEN SITTING TIMER" />

    <!-- 设置（未开始时） -->
    <view v-if="!running && !finished" class="setup card-mystic anim-fade-up">
      <text class="setup-title title-mystic">调 身 调 息</text>
      <text class="setup-sub">选 择 时 长 · 选 择 方 式</text>

      <view class="dur-section">
        <text class="dur-label">· 时 长</text>
        <view class="dur-list">
          <view
            v-for="d in durations"
            :key="d"
            class="dur-btn"
            :class="{ active: duration === d }"
            @click="duration = d"
          >
            {{ d }} 分
          </view>
        </view>
        <view class="custom-dur">
          <text class="cd-label">自定义：</text>
          <input v-model.number="customDur" type="number" class="cd-inp" placeholder="分钟" />
        </view>
      </view>

      <view class="mode-section">
        <text class="dur-label">· 方 式</text>
        <view class="mode-list">
          <view
            v-for="m in modes"
            :key="m.key"
            class="mode-btn"
            :class="{ active: mode === m.key }"
            @click="mode = m.key as Mode"
          >
            <text class="mode-glyph">{{ m.glyph }}</text>
            <text class="mode-name">{{ m.name }}</text>
            <text class="mode-desc">{{ m.desc }}</text>
          </view>
        </view>
      </view>

      <view class="setup-tip">
        <text>· 念珠：每 10 息转一珠 · 呼吸圆：4-7-8 节律 · 念诵：6 字大明咒</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" @click="start">
          <text>入 坐</text>
        </view>
      </view>
    </view>

    <!-- 计时中 -->
    <view v-else-if="running" class="running anim-fade-up">
      <view class="run-card card-mystic">
        <text class="run-mode">{{ currentMode.name }} · {{ currentMode.glyph }}</text>

        <!-- 呼吸圆 -->
        <view class="breath-wrap">
          <view class="breath-ring" :class="breathState">
            <text class="breath-time">{{ breathCountdown }}</text>
            <text class="breath-label">{{ breathLabel }}</text>
          </view>
        </view>

        <!-- 念珠 -->
        <view class="beads">
          <text
            v-for="i in 18"
            :key="i"
            class="bead"
            :class="{ active: i === currentBead, passed: i < currentBead }"
          >
            <text class="bead-inner"></text>
          </text>
        </view>
        <text class="bead-text">念 珠 · {{ currentBead }} / 18</text>

        <!-- 念诵 -->
        <view v-if="mode === 'nian'" class="nian-card">
          <text class="nian-num">{{ nianCount }}</text>
          <text class="nian-text">{{ nianText }}</text>
        </view>

        <!-- 倒计时 -->
        <view class="countdown">
          <text class="cd-num">{{ formatTime(remaining) }}</text>
          <text class="cd-label">剩 余 时 间</text>
        </view>

        <view class="run-actions">
          <view class="btn-liu" @click="pause">{{ paused ? '继 续' : '暂 停' }}</view>
          <view class="btn-bad" @click="stop">结 束</view>
        </view>
      </view>
    </view>

    <!-- 完成 -->
    <view v-else class="done card-mystic anim-fade-up">
      <text class="done-glyph">ⵙ</text>
      <text class="done-title title-mystic">坐 禅 圆 满</text>
      <text class="done-sub">共 {{ formatTime(duration * 60) }}</text>
      <view class="done-stats">
        <view class="ds-cell">
          <text class="ds-num">{{ breathCount }}</text>
          <text class="ds-label">呼 吸 轮 次</text>
        </view>
        <view class="ds-cell">
          <text class="ds-num">{{ beadCount }}</text>
          <text class="ds-label">念 珠 圈 数</text>
        </view>
        <view v-if="mode === 'nian'" class="ds-cell">
          <text class="ds-num">{{ nianCount }}</text>
          <text class="ds-label">念 诵 次 数</text>
        </view>
      </view>
      <text class="done-msg">{{ doneMessage }}</text>
      <view class="form-actions">
        <view class="btn-zhu" @click="reset">再 坐 一 次</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import TopBar from '@/shared/components/ui/TopBar.vue'
import TaijiBg from '@/shared/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'

const app = useAppStore()

type Mode = 'huxi' | 'nianzhu' | 'nian'
const mode = ref<Mode>('huxi')
const durations = [5, 10, 15, 20, 30, 45, 60]
const duration = ref(15)
const customDur = ref(0)
const running = ref(false)
const paused = ref(false)
const finished = ref(false)
const remaining = ref(0)

const breathCount = ref(0)
const beadCount = ref(0)
const nianCount = ref(0)
const currentBead = ref(1)
const breathState = ref<'inhale' | 'hold' | 'exhale' | 'pause'>('pause')
const breathCountdown = ref(0)
const breathLabel = ref('准 备')

const nianText = '南无阿弥陀佛'

const modes = [
  { key: 'huxi' as Mode, name: '调息', glyph: '息', desc: '4-7-8 呼吸法' },
  { key: 'nianzhu' as Mode, name: '念珠', glyph: '珠', desc: '108 念珠' },
  { key: 'nian' as Mode, name: '念诵', glyph: '佛', desc: '六字大明咒' },
]

const currentMode = computed(() => modes.find((m) => m.key === mode.value)!)

const doneMessages = [
  '心如止水 · 诸缘放下',
  '一念清明 · 万事从容',
  '万缘皆寂 · 自性圆明',
  '心安即是归处',
  '静观自在 · 无所从来',
  '不思过去 · 不忧未来',
]
const doneMessage = ref('')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mainTimer: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let breathTimer: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let beadTimer: any

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function start() {
  const d = customDur.value > 0 ? customDur.value : duration.value
  if (d <= 0) return
  duration.value = d
  running.value = true
  paused.value = false
  finished.value = false
  remaining.value = d * 60
  breathCount.value = 0
  beadCount.value = 0
  nianCount.value = 0
  currentBead.value = 1
  doneMessage.value = ''

  startMain()
  startBreathCycle()
  if (mode.value === 'nianzhu' || mode.value === 'nian') startBeadCycle()
}

function startMain() {
  mainTimer = setInterval(() => {
    if (paused.value) return
    remaining.value--
    if (remaining.value <= 0) {
      finish()
    }
  }, 1000)
}

function startBreathCycle() {
  // 4-7-8 呼吸
  const run = () => {
    breathState.value = 'inhale'
    breathLabel.value = '吸'
    breathCountdown.value = 4
    let phase: 'inhale' | 'hold' | 'exhale' = 'inhale'
    let remain = 4
    breathTimer = setInterval(() => {
      if (paused.value) return
      remain--
      breathCountdown.value = remain
      if (remain <= 0) {
        if (phase === 'inhale') {
          phase = 'hold'
          breathState.value = 'hold'
          breathLabel.value = '屏'
          remain = 7
          breathCountdown.value = 7
        } else if (phase === 'hold') {
          phase = 'exhale'
          breathState.value = 'exhale'
          breathLabel.value = '呼'
          remain = 8
          breathCountdown.value = 8
          breathCount.value++
        } else {
          phase = 'inhale'
          breathState.value = 'inhale'
          breathLabel.value = '吸'
          remain = 4
          breathCountdown.value = 4
        }
      }
    }, 1000)
  }
  run()
}

function startBeadCycle() {
  // 每 10 秒一珠
  beadTimer = setInterval(() => {
    if (paused.value) return
    currentBead.value++
    if (currentBead.value > 18) {
      currentBead.value = 1
      beadCount.value++
    }
    if (mode.value === 'nian') nianCount.value++
  }, 10000)
}

function pause() {
  paused.value = !paused.value
}

function stop() {
  clearInterval(mainTimer)
  clearInterval(breathTimer)
  clearInterval(beadTimer)
  running.value = false
  finished.value = true
  doneMessage.value = doneMessages[Math.floor(Math.random() * doneMessages.length)]
  app.addHistory({
    tool: 'zhan',
    toolName: '坐禅计时',
    category: '修心',
    input: { duration: duration.value, mode: mode.value },
    output: { breath: breathCount.value, beads: beadCount.value },
    brief: `${currentMode.value.name} ${duration.value}分 · 呼吸${breathCount.value}轮`,
  })
}

function finish() {
  clearInterval(mainTimer)
  clearInterval(breathTimer)
  clearInterval(beadTimer)
  running.value = false
  finished.value = true
  doneMessage.value = doneMessages[Math.floor(Math.random() * doneMessages.length)]
  app.addHistory({
    tool: 'zhan',
    toolName: '坐禅计时',
    category: '修心',
    input: { duration: duration.value, mode: mode.value },
    output: { breath: breathCount.value, beads: beadCount.value },
    brief: `${currentMode.value.name} ${duration.value}分圆满 · 呼吸${breathCount.value}轮`,
  })
}

function reset() {
  running.value = false
  finished.value = false
  remaining.value = 0
  breathCount.value = 0
  beadCount.value = 0
  nianCount.value = 0
}

onUnmounted(() => {
  clearInterval(mainTimer)
  clearInterval(breathTimer)
  clearInterval(beadTimer)
})
</script>

<style scoped>
.zhan-page {
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
.dur-section,
.mode-section {
  margin: var(--sp-3) 0;
}
.dur-label {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-bottom: var(--sp-2);
}
.dur-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.dur-btn {
  flex: 1;
  min-width: 100rpx;
  text-align: center;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  color: var(--color-bai-2);
  font-size: var(--fs-sm);
}
.dur-btn.active {
  background: linear-gradient(135deg, #1b3a5c, #5b3a8e);
  color: var(--color-bai);
  border-color: var(--color-liu);
}
.custom-dur {
  display: flex;
  align-items: center;
  margin-top: var(--sp-2);
  gap: var(--sp-2);
}
.cd-label {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
}
.cd-inp {
  flex: 1;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.6);
  color: var(--color-bai);
  font-size: var(--fs-sm);
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.mode-btn {
  display: flex;
  align-items: center;
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  cursor: pointer;
  gap: var(--sp-2);
}
.mode-btn.active {
  border-color: var(--color-liu);
  background: rgba(91, 58, 142, 0.2);
}
.mode-glyph {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #1b3a5c, #5b3a8e);
  color: var(--color-bai);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.mode-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.mode-name {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.mode-desc {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}

.setup-tip {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  text-align: center;
  margin: var(--sp-3) 0;
}
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}
.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #1b3a5c, #5b3a8e);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 320rpx;
  text-align: center;
}

/* 计时中 */
.run-card {
  padding: var(--sp-5) var(--sp-4);
  text-align: center;
}
.run-mode {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  letter-spacing: 0.2em;
}

.breath-wrap {
  display: flex;
  justify-content: center;
  padding: var(--sp-5) 0;
}
.breath-ring {
  width: 380rpx;
  height: 380rpx;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba(91, 58, 142, 0.3), rgba(27, 58, 92, 0.6));
  border: 4rpx solid var(--color-liu);
  box-shadow: 0 0 60rpx rgba(91, 58, 142, 0.4);
  transition: all 1s ease;
}
.breath-ring.inhale {
  transform: scale(1.15);
  box-shadow: 0 0 100rpx rgba(91, 58, 142, 0.6);
}
.breath-ring.hold {
  transform: scale(1.1);
}
.breath-ring.exhale {
  transform: scale(0.85);
  box-shadow: 0 0 30rpx rgba(91, 58, 142, 0.3);
}
.breath-ring.pause {
  transform: scale(1);
}
.breath-time {
  font-size: 120rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-bai);
  font-weight: 700;
  text-shadow: 0 0 20rpx rgba(212, 175, 55, 0.5);
}
.breath-label {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  margin-top: var(--sp-2);
}

.beads {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: center;
  margin: var(--sp-4) 0;
  max-width: 600rpx;
  margin-left: auto;
  margin-right: auto;
}
.bead {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: rgba(212, 175, 55, 0.15);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.bead.passed .bead-inner {
  background: var(--color-liu);
}
.bead.active {
  background: linear-gradient(135deg, #c8302a, #d4af37);
  border-color: var(--color-liu);
  box-shadow: 0 0 16rpx rgba(212, 175, 55, 0.6);
  transform: scale(1.3);
}
.bead-inner {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: transparent;
}
.bead-text {
  display: block;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-top: var(--sp-2);
}

.nian-card {
  margin: var(--sp-4) auto;
  padding: var(--sp-4) var(--sp-3);
  background: rgba(91, 58, 142, 0.2);
  border: 1rpx dashed rgba(91, 58, 142, 0.5);
  border-radius: var(--r-md);
  max-width: 500rpx;
}
.nian-num {
  display: block;
  font-size: 60rpx;
  color: #c8b5e8;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.nian-text {
  display: block;
  font-size: var(--fs-md);
  color: #c8b5e8;
  font-family: 'KaiTi', serif;
  letter-spacing: 0.3em;
}

.countdown {
  margin: var(--sp-4) 0;
}
.cd-num {
  display: block;
  font-size: 60rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.cd-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}

.run-actions {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-4);
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

/* 完成 */
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
.done-stats {
  display: flex;
  justify-content: space-around;
  gap: var(--sp-3);
  margin: var(--sp-4) 0;
}
.ds-cell {
  display: flex;
  flex-direction: column;
}
.ds-num {
  font-size: 60rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.ds-label {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
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
