<template>
  <view class="interp-page">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar :title="title" :subtitle="subtitle" />

    <!-- 顶部：问事选择 -->
    <view v-if="!jiegua" class="topic-stage">
      <view class="topic-card card-mystic anim-fade-up">
        <text class="topic-title title-mystic">所 占 何 事</text>
        <text class="topic-tip">先定所问，再解卦象 · 用神各有所主</text>
        <view class="topic-grid">
          <view
            v-for="(t, i) in TOPICS"
            :key="t.key"
            class="topic-btn anim-fade-up"
            :class="{ active: topic === t.key }"
            :style="{ animationDelay: i * 0.05 + 's' }"
            @click="setTopic(t.key)"
          >
            <text class="topic-glyph">{{ t.glyph }}</text>
            <text class="topic-label">{{ t.label }}</text>
          </view>
        </view>
        <view class="topic-start btn-zhu" @click="doInterpret">
          <text>开 始 解 卦</text>
        </view>
      </view>
    </view>

    <!-- 解卦结果 -->
    <view v-else class="interp-result">
      <!-- 卦象展示 -->
      <view class="gua-show anim-fade-up">
        <view class="gua-block">
          <text class="gua-label">本 卦</text>
          <text class="gua-symbol-big">{{ jiegua.gua.symbol }}</text>
          <text class="gua-name-text title-mystic">{{ jiegua.gua.name }}</text>
          <text class="gua-judge-text">「{{ jiegua.gua.judgment }}」</text>
          <view class="gua-fortune" :class="'fortune-' + jiegua.gua.fortune">
            <text>{{ jiegua.gua.fortune }} · {{ jiegua.gua.tag }}</text>
          </view>
        </view>
        <view class="gua-arrow">
          <text>→</text>
        </view>
        <view class="gua-block">
          <text class="gua-label">变 卦</text>
          <text class="gua-symbol-big">{{ jiegua.biangua.symbol }}</text>
          <text class="gua-name-text title-mystic">{{ jiegua.biangua.name }}</text>
          <text class="gua-reason">{{ jiegua.biangua.reason }}</text>
        </view>
      </view>

      <!-- 世应爻位 -->
      <view class="card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="sec-title title-mystic">世 应 爻 位</text>
        <view class="yao-strip">
          <view
            v-for="i in 6"
            :key="i"
            class="yao-cell"
            :class="{
              'yao-shi': i === jiegua.shiying.shi,
              'yao-ying': i === jiegua.shiying.ying,
              'yao-yong': i === jiegua.yongshen.yaoPos,
            }"
          >
            <text class="yao-num">{{ ['初', '二', '三', '四', '五', '上'][i - 1] }}</text>
            <text class="yao-line"></text>
          </view>
        </view>
        <view class="legend">
          <view class="leg-item">
            <view class="leg-dot leg-shi" /><text>
              世爻（{{ jiegua.shiying.shi }} 爻·{{ jiegua.shiying.shiLiuqin }}）
            </text>
          </view>
          <view class="leg-item">
            <view class="leg-dot leg-ying" /><text>
              应爻（{{ jiegua.shiying.ying }} 爻·{{ jiegua.shiying.yingLiuqin }}）
            </text>
          </view>
          <view class="leg-item">
            <view class="leg-dot leg-yong" /><text>
              用神（{{ jiegua.yongshen.yaoPos }} 爻·{{ jiegua.yongshen.name }}）
            </text>
          </view>
        </view>
      </view>

      <!-- 互卦与变卦分析 -->
      <view class="card-mystic anim-fade-up" style="animation-delay: 0.2s">
        <text class="sec-title title-mystic">互 卦</text>
        <view class="sub-row">
          <text class="sub-symbol">{{ jiegua.hugua.symbol }}</text>
          <view class="sub-info">
            <text class="sub-name">{{ jiegua.hugua.name }}</text>
            <text class="sub-desc">{{ jiegua.hugua.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 用神分析 -->
      <view class="card-mystic anim-fade-up yong-card" style="animation-delay: 0.3s">
        <text class="sec-title title-mystic">用 神 分 析</text>
        <view class="yong-head">
          <text class="yong-name" :class="'yong-status-' + yongStatusLevel">
            {{ jiegua.yongshen.name }} · {{ jiegua.yongshen.status }}
          </text>
          <text class="yong-pos">
            第 {{ jiegua.yongshen.yaoPos }} 爻 · 五行属 {{ jiegua.yongshen.wuxing }}
          </text>
        </view>
        <text class="yong-reason">{{ jiegua.yongshen.reason }}</text>
        <text class="yong-status-desc">{{ jiegua.yongshen.statusDesc }}</text>
        <view v-if="jiegua.fushen" class="fushen-box">
          <text class="fushen-label">· 伏神 ·</text>
          <text class="fushen-text">{{ jiegua.fushen.reason }}</text>
        </view>
      </view>

      <!-- 五行生克 -->
      <view class="card-mystic anim-fade-up" style="animation-delay: 0.4s">
        <text class="sec-title title-mystic">五 行 流 转</text>
        <view class="flow-list">
          <view v-for="(line, i) in jiegua.wuxingFlow" :key="i" class="flow-row">
            <text class="flow-arrow">▸</text>
            <text class="flow-text">{{ line }}</text>
          </view>
        </view>
      </view>

      <!-- 分类运势 -->
      <view class="card-mystic anim-fade-up" style="animation-delay: 0.5s">
        <text class="sec-title title-mystic">分 项 运 势</text>
        <view class="fortune-grid">
          <view
            v-for="(f, i) in fortuneList"
            :key="i"
            class="fortune-cell"
            :class="'ft-' + levelClass(f.score)"
          >
            <text class="ft-label">{{ f.label }}</text>
            <text class="ft-score">{{ f.score }}</text>
            <text class="ft-text">{{ f.text }}</text>
          </view>
        </view>
      </view>

      <!-- 建议 -->
      <view class="card-mystic anim-fade-up" style="animation-delay: 0.6s">
        <text class="sec-title title-mystic">解 卦 箴 言</text>
        <view class="advice-list">
          <view
            v-for="(a, i) in jiegua.advice"
            :key="i"
            class="advice-item"
            :class="'adv-' + a.level"
          >
            <text class="adv-title">{{ a.title }}</text>
            <text class="adv-detail">{{ a.detail }}</text>
          </view>
        </view>
      </view>

      <!-- 幸运元素 -->
      <view class="card-mystic anim-fade-up" style="animation-delay: 0.7s">
        <text class="sec-title title-mystic">天 机 暗 示</text>
        <view class="lucky-row">
          <view class="lucky-cell">
            <text class="lucky-label">吉 色</text>
            <text class="lucky-text">{{ jiegua.lucky.color }}</text>
          </view>
          <view class="lucky-cell">
            <text class="lucky-label">吉 数</text>
            <text class="lucky-text">{{ jiegua.lucky.number }}</text>
          </view>
          <view class="lucky-cell">
            <text class="lucky-label">吉 方</text>
            <text class="lucky-text">{{ jiegua.lucky.direction }}方</text>
          </view>
        </view>
      </view>

      <!-- 综合解读 -->
      <view class="summary-card anim-fade-up" style="animation-delay: 0.8s">
        <text class="summary-title title-mystic">总 断</text>
        <text class="summary-text">{{ jiegua.summary }}</text>
      </view>

      <view class="actions">
        <view class="btn-zhu" @click="restart">
          <text>再 占 一 卦</text>
        </view>
        <view class="btn-ghost" @click="goBack">
          <text>返 回</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { gsap } from 'gsap'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import { GUA_LIST, type Gua as _Gua, type Trigram as _Trigram } from '@modules/zhanbu/logic/gua'
import {
  jiegua as jieguaFn,
  YONGSHEN_TOPICS,
  type JieguaResult,
} from '@modules/zhanbu/logic/jiegua'

const title = '解卦'
const subtitle = 'INTERPRETATION'

type YONGSHEN_MAP_FIX = {
  通用: string
  事业: string
  求财: string
  姻缘: string
  学业: string
  健康: string
}

const TOPICS = YONGSHEN_TOPICS

const topic = ref<keyof YONGSHEN_MAP_FIX>('通用')

const guaId = ref<number>(1)
const yaoPattern = ref<number[]>([1, 1, 1, 1, 1, 1])
const jiegua = ref<JieguaResult | null>(null)

onMounted(() => {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]!
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opt = ((cur as any)?.options || {}) as Record<string, string>
  guaId.value = parseInt(opt.id) || 1
  const yaoStr = opt.yao || '1,1,1,1,1,1'
  yaoPattern.value = yaoStr.split(',').map((s) => parseInt(s) || 0)
  try {
    const _sys = uni.getSystemInfoSync()
  } catch (_e) {}
  // 入场
  setTimeout(() => {
    try {
      gsap.fromTo(
        '.topic-card',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      )
    } catch (_e) {}
  }, 200)
})

const gua = computed(() => GUA_LIST.find((g) => g.id === guaId.value) || GUA_LIST[0]!)

function setTopic(k: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topic.value = k as any
}

function doInterpret() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jiegua.value = jieguaFn(gua.value, yaoPattern.value, topic.value as any)
  setTimeout(() => {
    try {
      gsap.fromTo(
        '.gua-show',
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'power2.out' },
      )
      gsap.fromTo(
        '.card-mystic',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.2 },
      )
    } catch (_e) {}
  }, 100)
}

const fortuneList = computed(() => {
  if (!jiegua.value) return []
  const f = jiegua.value.fortunes
  return [
    { label: '事业', score: f.career.score, text: f.career.text },
    { label: '财运', score: f.wealth.score, text: f.wealth.text },
    { label: '姻缘', score: f.love.score, text: f.love.text },
    { label: '健康', score: f.health.score, text: f.health.text },
    { label: '学业', score: f.study.score, text: f.study.text },
  ]
})

function levelClass(s: number): string {
  if (s >= 85) return 'ji'
  if (s >= 70) return 'xi'
  if (s >= 55) return 'ping'
  if (s >= 40) return 'xiong'
  return 'dxiong'
}

const yongStatusLevel = computed(() => {
  if (!jiegua.value) return ''
  return jiegua.value.yongshen.status
})

function restart() {
  jiegua.value = null
  topic.value = '通用'
}
function goBack() {
  uni.navigateBack({ delta: 1 })
}
</script>

<style scoped>
.interp-page {
  position: relative;
  min-height: 100vh;
  padding: 0 24rpx 40rpx;
  overflow-x: hidden;
}

.taiji-bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg);
}

/* ===== 主题选择 ===== */
.topic-stage {
  position: relative;
  z-index: var(--z-content);
  margin-top: 24rpx;
}

.topic-card {
  padding: 28rpx 24rpx;
  text-align: center;
}

.topic-title {
  display: block;
  font-size: var(--fs-lg);
  letter-spacing: 0.4em;
  color: var(--color-liu);
  margin-bottom: 8rpx;
}

.topic-tip {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  letter-spacing: 0.15em;
  margin-bottom: 24rpx;
}

.topic-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14rpx;
  margin-bottom: 24rpx;
}

.topic-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18rpx 8rpx;
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  transition: all 0.3s var(--ease-mystic);
  cursor: pointer;
}

.topic-btn:active {
  transform: scale(0.97);
}

.topic-btn.active {
  background: linear-gradient(135deg, var(--color-zhu) 0%, #8b1f1a 100%);
  border-color: var(--color-liu);
  box-shadow: 0 0 16rpx rgba(212, 175, 55, 0.5);
}

.topic-glyph {
  font-size: 40rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: 4rpx;
}

.topic-btn.active .topic-glyph {
  color: var(--color-bai);
  text-shadow: 0 0 12rpx rgba(255, 255, 255, 0.5);
}

.topic-label {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  letter-spacing: 0.1em;
}

.topic-start {
  margin-top: 8rpx;
  display: inline-block;
  padding: 14rpx 48rpx;
  background: linear-gradient(135deg, var(--color-zhu) 0%, #8b1f1a 100%);
  border-radius: 9999rpx;
  color: var(--color-bai);
  font-size: var(--fs-md);
  letter-spacing: 0.3em;
  box-shadow: 0 0 20rpx rgba(200, 48, 42, 0.4);
  cursor: pointer;
}

/* ===== 解卦结果 ===== */
.interp-result {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 16rpx;
}

/* ===== 卦象展示 ===== */
.gua-show {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 24rpx 16rpx;
  background: linear-gradient(180deg, var(--color-xuan-2) 0%, var(--color-xuan) 100%);
  border: 2rpx solid rgba(212, 175, 55, 0.4);
  border-radius: var(--r-lg);
}

.gua-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.gua-label {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.3em;
  margin-bottom: 6rpx;
}

.gua-symbol-big {
  font-size: 96rpx;
  color: var(--color-liu);
  text-shadow: 0 0 24rpx rgba(212, 175, 55, 0.6);
  line-height: 1;
  margin: 4rpx 0;
}

.gua-name-text {
  font-size: var(--fs-md);
  color: var(--color-bai);
  letter-spacing: 0.2em;
  margin-bottom: 4rpx;
}

.gua-judge-text {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  letter-spacing: 0.1em;
  font-family: 'KaiTi', serif;
  font-style: italic;
  text-align: center;
  margin-bottom: 4rpx;
}

.gua-reason {
  font-size: 18rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.05em;
  text-align: center;
  line-height: 1.4;
}

.gua-fortune {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 9999rpx;
  font-size: var(--fs-xs);
  letter-spacing: 0.2em;
  border: 1rpx solid;
  margin-top: 4rpx;
}

.gua-fortune.fortune-吉 {
  background: rgba(79, 174, 111, 0.15);
  color: #4fae6f;
  border-color: rgba(79, 174, 111, 0.5);
}
.gua-fortune.fortune-平 {
  background: rgba(212, 175, 55, 0.15);
  color: var(--color-liu);
  border-color: rgba(212, 175, 55, 0.5);
}
.gua-fortune.fortune-凶 {
  background: rgba(200, 48, 42, 0.15);
  color: var(--color-zhu);
  border-color: rgba(200, 48, 42, 0.5);
}

.gua-arrow {
  font-size: 48rpx;
  color: var(--color-liu);
  font-weight: 300;
  opacity: 0.6;
  margin: 0 12rpx;
}

/* ===== 世应爻位 ===== */
.yao-strip {
  display: flex;
  justify-content: space-between;
  margin: 12rpx 0;
  padding: 12rpx 8rpx;
  background: rgba(10, 10, 18, 0.3);
  border-radius: var(--r-md);
}

.yao-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 6rpx 4rpx;
  border-radius: var(--r-sm);
  position: relative;
}

.yao-cell.yao-shi {
  background: rgba(212, 175, 55, 0.15);
  border: 1rpx solid var(--color-liu);
}
.yao-cell.yao-ying {
  background: rgba(91, 58, 142, 0.15);
  border: 1rpx solid var(--color-zi);
}
.yao-cell.yao-yong {
  background: rgba(200, 48, 42, 0.15);
  border: 1rpx solid var(--color-zhu);
}

.yao-num {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.yao-line {
  width: 24rpx;
  height: 2rpx;
  background: var(--color-bai-3);
}

.yao-cell.yao-shi .yao-line {
  background: var(--color-liu);
  width: 32rpx;
}
.yao-cell.yao-ying .yao-line {
  background: var(--color-zi);
  width: 32rpx;
}
.yao-cell.yao-yong .yao-line {
  background: var(--color-zhu);
  width: 32rpx;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 4rpx;
}

.leg-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  letter-spacing: 0.05em;
}

.leg-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 9999rpx;
}
.leg-shi {
  background: var(--color-liu);
}
.leg-ying {
  background: var(--color-zi);
}
.leg-yong {
  background: var(--color-zhu);
}

/* ===== 用神卡 ===== */
.yong-card {
  padding: 20rpx 18rpx;
}

.yong-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.yong-name {
  font-size: var(--fs-md);
  font-weight: 700;
  font-family: 'KaiTi', serif;
  letter-spacing: 0.15em;
  padding: 2rpx 12rpx;
  border-radius: 9999rpx;
}

.yong-status-旺 {
  color: #4fae6f;
  background: rgba(79, 174, 111, 0.15);
}
.yong-status-相 {
  color: #4fae6f;
  background: rgba(79, 174, 111, 0.08);
}
.yong-status-休 {
  color: var(--color-liu);
  background: rgba(212, 175, 55, 0.1);
}
.yong-status-囚 {
  color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.1);
}
.yong-status-死 {
  color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.2);
}

.yong-pos {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.05em;
}

.yong-reason,
.yong-status-desc {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.7;
  letter-spacing: 0.05em;
  font-family: 'KaiTi', serif;
  margin-top: 6rpx;
}

.fushen-box {
  margin-top: 12rpx;
  padding: 10rpx 12rpx;
  background: rgba(91, 58, 142, 0.1);
  border: 1rpx dashed var(--color-zi);
  border-radius: var(--r-sm);
}

.fushen-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-zi);
  letter-spacing: 0.3em;
  margin-bottom: 4rpx;
}

.fushen-text {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.6;
  font-family: 'KaiTi', serif;
}

/* ===== 五行流 ===== */
.flow-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.flow-row {
  display: flex;
  align-items: flex-start;
  padding: 4rpx 0;
}

.flow-arrow {
  color: var(--color-liu);
  margin-right: 8rpx;
  flex-shrink: 0;
}

.flow-text {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
  letter-spacing: 0.05em;
}

/* ===== 分项运势 ===== */
.fortune-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10rpx;
}

.fortune-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 8rpx;
  background: rgba(10, 10, 18, 0.3);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
}

.fortune-cell.ft-ji {
  border-color: rgba(79, 174, 111, 0.5);
  background: rgba(79, 174, 111, 0.08);
}
.fortune-cell.ft-xi {
  border-color: rgba(79, 174, 111, 0.3);
  background: rgba(79, 174, 111, 0.04);
}
.fortune-cell.ft-xiong {
  border-color: rgba(200, 48, 42, 0.3);
  background: rgba(200, 48, 42, 0.05);
}
.fortune-cell.ft-dxiong {
  border-color: rgba(200, 48, 42, 0.5);
  background: rgba(200, 48, 42, 0.1);
}

.ft-label {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.1em;
  margin-bottom: 4rpx;
}

.ft-score {
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  line-height: 1;
}

.ft-ji .ft-score,
.ft-xi .ft-score {
  color: #4fae6f;
}
.ft-xiong .ft-score,
.ft-dxiong .ft-score {
  color: var(--color-zhu);
}

.ft-text {
  font-size: 18rpx;
  color: var(--color-bai-2);
  margin-top: 2rpx;
  letter-spacing: 0.1em;
}

/* ===== 建议 ===== */
.advice-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.advice-item {
  padding: 12rpx 14rpx;
  background: rgba(10, 10, 18, 0.3);
  border-left: 3rpx solid var(--color-liu);
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
}

.advice-item.adv-high {
  border-left-color: var(--color-zhu);
}
.advice-item.adv-mid {
  border-left-color: var(--color-liu);
}
.advice-item.adv-low {
  border-left-color: var(--color-zi);
}

.adv-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-weight: 600;
  letter-spacing: 0.2em;
  margin-bottom: 4rpx;
}

.adv-high .adv-title {
  color: var(--color-zhu);
}

.adv-detail {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
  letter-spacing: 0.05em;
}

/* ===== 天机暗示 ===== */
.lucky-row {
  display: flex;
  justify-content: space-around;
  margin-top: 8rpx;
}

.lucky-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding: 8rpx 0;
  border-right: 1rpx dashed rgba(212, 175, 55, 0.2);
}

.lucky-cell:last-child {
  border-right: none;
}

.lucky-label {
  font-size: 18rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.15em;
  margin-bottom: 4rpx;
}

.lucky-text {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 600;
  letter-spacing: 0.15em;
}

/* ===== 总断 ===== */
.summary-card {
  margin-top: 12rpx;
  padding: 24rpx 22rpx;
  background: linear-gradient(180deg, rgba(200, 48, 42, 0.15) 0%, rgba(20, 20, 28, 0.9) 100%);
  border: 2rpx solid rgba(212, 175, 55, 0.5);
  border-radius: var(--r-lg);
  text-align: center;
  box-shadow: 0 0 32rpx rgba(212, 175, 55, 0.3);
}

.summary-title {
  display: block;
  font-size: var(--fs-lg);
  color: var(--color-liu);
  letter-spacing: 0.4em;
  margin-bottom: 12rpx;
  text-shadow: 0 0 16rpx rgba(212, 175, 55, 0.6);
}

.summary-text {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  line-height: 1.9;
  font-family: 'KaiTi', serif;
  letter-spacing: 0.05em;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 16rpx;
  margin-top: 20rpx;
  margin-bottom: 20rpx;
}

.btn-zhu,
.btn-ghost {
  padding: 14rpx 36rpx;
  border-radius: 9999rpx;
  font-size: var(--fs-md);
  letter-spacing: 0.3em;
  cursor: pointer;
  text-align: center;
}

.btn-zhu {
  background: linear-gradient(135deg, var(--color-zhu) 0%, #8b1f1a 100%);
  color: var(--color-bai);
  box-shadow: 0 0 16rpx rgba(200, 48, 42, 0.4);
}

.btn-ghost {
  background: transparent;
  color: var(--color-liu);
  border: 1rpx solid var(--color-liu);
}

/* ===== 公共卡 ===== */
.card-mystic {
  position: relative;
  padding: 20rpx 18rpx;
  background: linear-gradient(180deg, var(--color-xuan-2) 0%, var(--color-xuan) 100%);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
}

.card-mystic::before {
  content: '';
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  right: 8rpx;
  bottom: 8rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.1);
  border-radius: var(--r-sm);
  pointer-events: none;
}

.sec-title {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-liu);
  letter-spacing: 0.4em;
  margin-bottom: 12rpx;
  font-weight: 600;
}

.sub-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.sub-symbol {
  font-size: 56rpx;
  color: var(--color-liu);
  text-shadow: 0 0 12rpx rgba(212, 175, 55, 0.5);
  line-height: 1;
}

.sub-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sub-name {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-weight: 600;
  letter-spacing: 0.15em;
  margin-bottom: 2rpx;
}

.sub-desc {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  line-height: 1.6;
  font-family: 'KaiTi', serif;
}
</style>
