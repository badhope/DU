<template>
  <view class="liunian-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="流年大运" subtitle="LIFE CYCLES" />

    <view v-if="!bazi" class="form card-mystic anim-fade-up">
      <text class="form-title title-mystic">请 输 入 生 辰</text>
      <text class="form-sub">性 别 · 起 运 · 十 步 大 运 · 流 年 应 期</text>

      <view class="form-row">
        <text class="form-label">性 别</text>
        <view class="gender">
          <view
            v-for="g in ['男', '女']"
            :key="g"
            class="g-btn"
            :class="{ active: form.gender === g }"
            @click="form.gender = g as any"
          >
            {{ g }}
          </view>
        </view>
      </view>

      <view class="form-row">
        <text class="form-label">年</text>
        <picker
          mode="number"
          :value="form.year"
          :min="1900"
          :max="2010"
          @change="onPick('year', $event)"
        >
          <view class="form-picker">{{ form.year }} 年</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">月</text>
        <picker
          mode="selector"
          :value="form.month - 1"
          :range="monthRange"
          @change="onPick('month', $event)"
        >
          <view class="form-picker">{{ form.month }} 月</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">日</text>
        <picker mode="number" :value="form.day" :min="1" :max="31" @change="onPick('day', $event)">
          <view class="form-picker">{{ form.day }} 日</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">时</text>
        <picker
          mode="selector"
          :value="form.hour"
          :range="hourRange"
          @change="onPick('hour', $event)"
        >
          <view class="form-picker">{{ form.hour }}:00</view>
        </picker>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '推算中…' : '推 算 大 运' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <!-- 起运信息 -->
      <view class="qi-card card-mystic anim-fade-up">
        <text class="card-title title-mystic">起 运 信 息</text>
        <view class="qi-row">
          <view class="qi-cell">
            <text class="qi-label">起运年龄</text>
            <text class="qi-val">{{ dayun.qiyunAge }} 岁</text>
          </view>
          <view class="qi-cell">
            <text class="qi-label">起运年份</text>
            <text class="qi-val">{{ dayun.qiyunYear }} 年</text>
          </view>
          <view class="qi-cell">
            <text class="qi-label">排 运</text>
            <text class="qi-val" :class="dayun.direction === '顺' ? 'rel-good' : 'rel-bad'">
              {{ dayun.direction }} 排
            </text>
          </view>
        </view>
        <text class="qi-desc">{{ qiyunDesc }}</text>
      </view>

      <!-- 日主强弱 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.05s">
        <text class="card-title title-mystic">日 主 强 弱</text>
        <view class="ds-row">
          <text class="ds-score">{{ strength.score }}</text>
          <view class="ds-info">
            <text class="ds-level" :class="'lv-' + levelNum">{{ strength.level }}</text>
            <text class="ds-text">
              用神：{{ yongName }} · 喜：{{ xiNames }} · 忌：{{ jiNames }}
            </text>
          </view>
        </view>
        <view class="ds-bar">
          <view class="ds-fill" :style="{ width: strength.score + '%' }" />
          <view class="ds-mark" style="left: 30%">弱</view>
          <view class="ds-mark" style="left: 55%">中</view>
          <view class="ds-mark" style="left: 70%">旺</view>
        </view>
      </view>

      <!-- 十步大运 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="card-title title-mystic">十 步 大 运</text>
        <text class="card-tip">每 步 10 年 · 共 100 年流年</text>
        <view class="dy-list">
          <view
            v-for="(s, i) in dayun.steps"
            :key="i"
            class="dy-item"
            :class="{ current: isCurrent(s) }"
            :style="{ animationDelay: i * 0.05 + 's' }"
          >
            <view class="dy-age">
              <text class="dy-start">{{ s.startAge }}</text>
              <text class="dy-end">{{ s.endAge }} 岁</text>
            </view>
            <view class="dy-mid">
              <text class="dy-gan">{{ s.gan }}</text>
              <text class="dy-zhi">{{ s.zhi }}</text>
            </view>
            <view class="dy-right">
              <text class="dy-shishen">{{ s.shishen }}</text>
              <text class="dy-nayin">{{ s.nayin }}</text>
            </view>
            <view v-if="isCurrent(s)" class="dy-flag">今</view>
          </view>
        </view>
      </view>

      <!-- 流年 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">近 十 二 年 流 年</text>
        <text class="card-tip">自 起 运 年 起 · 每 年 干 支 + 十 神</text>
        <view class="ln-grid">
          <view
            v-for="(y, i) in liunian"
            :key="i"
            class="ln-cell"
            :class="{ current: y.year === curYear }"
          >
            <text class="ln-year">{{ y.year }}</text>
            <text class="ln-ganzhi">{{ y.gan }}{{ y.zhi }}</text>
            <text class="ln-ss">{{ y.shishen }}</text>
          </view>
        </view>
      </view>

      <view class="reset">
        <view class="btn-ghost" @click="reset">重 新 推 算</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import TopBar from '@/components/ui/TopBar.vue'
import _LiuNianChart from '@/components/charts/LiuNianChart.vue'
import { calcBazi } from '@/utils/bazi'
import { calcDayun, dayunStrength, liunians } from '@/utils/bazi-deep'
import { WUXING_META } from '@/utils/wuxing'
import { useAppStore } from '@/stores'

const app = useAppStore()

const form = ref({
  gender: '男' as '男' | '女',
  year: 1990,
  month: 5,
  day: 15,
  hour: 10,
})
const bazi = ref<ReturnType<typeof calcBazi> | null>(null)
const loading = ref(false)
const curYear = new Date().getFullYear()

const monthRange = Array.from({ length: 12 }, (_, i) => `${i + 1} 月`)
const hourRange = Array.from({ length: 24 }, (_, i) => `${i}:00`)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPick(field: 'year' | 'month' | 'day' | 'hour', e: any) {
  let v = Number(e.detail.value)
  if (field === 'month') v += 1
  form.value[field] = v
}

const dayun = computed(() =>
  bazi.value
    ? calcDayun(bazi.value, form.value.gender, form.value.year, form.value.month, form.value.day)
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (null as any),
)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const strength = computed(() => (bazi.value ? dayunStrength(bazi.value) : (null as any)))
const liunian = computed(() =>
  bazi.value && dayun.value ? liunians(bazi.value, dayun.value.qiyunYear, 12) : [],
)

const qiyunDesc = computed(() => {
  if (!dayun.value) return ''
  const dir = dayun.value.direction
  if (dir === '顺') return '阳男阴女 · 自出生日顺数至下一节气'
  return '阴男阳女 · 自出生日逆数至上一节气'
})

const levelNum = computed(() => {
  if (!strength.value) return 0
  const lv = strength.value.level
  if (lv === '极弱') return 1
  if (lv === '偏弱') return 2
  if (lv === '中和') return 3
  if (lv === '偏旺') return 4
  return 5
})

const xiNames = computed(() => {
  if (!strength.value) return ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (strength.value as any).xi
    .map((w: string) => WUXING_META[w as keyof typeof WUXING_META].name)
    .join(' ')
})

const jiNames = computed(() => {
  if (!strength.value) return ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (strength.value as any).ji
    .map((w: string) => WUXING_META[w as keyof typeof WUXING_META].name)
    .join(' ')
})

const yongName = computed(() => {
  if (!strength.value) return ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const y = (strength.value as any).yong
  return WUXING_META[y as keyof typeof WUXING_META]?.name || ''
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isCurrent(s: any) {
  if (!bazi.value) return false
  const age = curYear - form.value.year
  return age >= s.startAge && age <= s.endAge
}

function calculate() {
  const y = form.value.year,
    m = form.value.month,
    d = form.value.day
  if (y < 1900 || y > 2100) {
    uni.showToast({ title: '年份需 1900-2100', icon: 'none' })
    return
  }
  if (m < 1 || m > 12) {
    uni.showToast({ title: '月份需 1-12', icon: 'none' })
    return
  }
  const dim = new Date(y, m, 0).getDate()
  if (d < 1 || d > dim) {
    uni.showToast({ title: `${m}月只有${dim}天`, icon: 'none' })
    return
  }
  if (new Date(y, m - 1, d).getTime() > Date.now()) {
    uni.showToast({ title: '日期不能晚于今日', icon: 'none' })
    return
  }
  loading.value = true
  setTimeout(() => {
    try {
      bazi.value = calcBazi(y, m, d, form.value.hour)
      app.addHistory({
        tool: 'liunian',
        toolName: '流年大运',
        category: '命理',
        input: { ...form.value },
        output: { qiyun: dayun.value.qiyunAge, level: strength.value.level },
        brief: `${y}年 · ${form.value.gender} · 起运${dayun.value.qiyunAge}岁 · ${strength.value.level}`,
      })
    } catch (e) {
      uni.showModal({ title: '推算失败', content: '请检查输入', showCancel: false })
    } finally {
      loading.value = false
    }
  }, 600)
}

function reset() {
  bazi.value = null
}
</script>

<style scoped>
.liunian-page {
  position: relative;
  min-height: 100vh;
  padding: 0 var(--sp-3) var(--sp-8);
  overflow: hidden;
}

.taiji-bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg);
}

/* ===== 表单 ===== */
.form {
  position: relative;
  z-index: var(--z-content);
  margin: var(--sp-3) var(--sp-2);
  padding: var(--sp-4);
}

.form-title {
  display: block;
  text-align: center;
  font-size: var(--fs-2xl);
  margin-bottom: var(--sp-2);
}

.form-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-bottom: var(--sp-4);
}

.form-row {
  display: flex;
  align-items: center;
  padding: var(--sp-2) var(--sp-3);
  margin-bottom: var(--sp-1);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
}

.form-label {
  width: 80rpx;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
}

.form-picker {
  flex: 1;
  font-size: var(--fs-md);
  color: var(--color-bai);
}

.gender {
  flex: 1;
  display: flex;
  gap: var(--sp-2);
}

.g-btn {
  flex: 1;
  text-align: center;
  padding: var(--sp-2);
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}

.g-btn.active {
  background: var(--color-zhu);
  color: var(--color-bai);
  border-color: var(--color-zhu);
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}

/* ===== 通用卡 ===== */
.card,
.qi-card {
  position: relative;
  z-index: var(--z-content);
  margin: 0 var(--sp-2) var(--sp-3);
  padding: var(--sp-4);
}

.qi-card {
  margin-top: var(--sp-3);
}

.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}

.card-tip {
  display: block;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-bottom: var(--sp-3);
  letter-spacing: 0.1em;
}

/* ===== 起运 ===== */
.qi-row {
  display: flex;
  gap: var(--sp-2);
}

.qi-cell {
  flex: 1;
  text-align: center;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}

.qi-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}

.qi-val {
  display: block;
  font-size: var(--fs-lg);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-top: 4rpx;
}

.qi-val.rel-good {
  color: #4fae6f;
}
.qi-val.rel-bad {
  color: var(--color-zhu);
}

.qi-desc {
  display: block;
  margin-top: var(--sp-3);
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  text-align: center;
  font-style: italic;
}

/* ===== 强弱 ===== */
.ds-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.ds-score {
  font-size: 72rpx;
  font-weight: 700;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  line-height: 1;
}

.ds-info {
  flex: 1;
}

.ds-level {
  display: block;
  font-size: var(--fs-lg);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin-bottom: var(--sp-1);
}

.ds-level.lv-1,
.ds-level.lv-2 {
  color: #5b8cbe;
}
.ds-level.lv-3 {
  color: #4fae6f;
}
.ds-level.lv-4,
.ds-level.lv-5 {
  color: var(--color-zhu);
}

.ds-text {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}

.ds-bar {
  position: relative;
  height: 20rpx;
  background: rgba(10, 10, 18, 0.5);
  border-radius: 10rpx;
  margin-top: var(--sp-3);
  overflow: visible;
}

.ds-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #5b8cbe 0%, #4fae6f 50%, var(--color-zhu) 100%);
  border-radius: 10rpx;
  box-shadow: 0 0 8rpx currentColor;
  transition: width 0.8s var(--ease-bounce);
}

.ds-mark {
  position: absolute;
  top: -28rpx;
  transform: translateX(-50%);
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
}

/* ===== 大运 ===== */
.dy-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.dy-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
  transition: all 0.2s var(--ease-mystic);
}

.dy-item.current {
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.15) 0%, rgba(10, 10, 18, 0.4) 100%);
  border-color: var(--color-liu);
  box-shadow: 0 0 16rpx rgba(212, 175, 55, 0.3);
}

.dy-age {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60rpx;
}

.dy-start {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}

.dy-end {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}

.dy-mid {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dy-gan {
  font-size: 40rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  line-height: 1;
}

.dy-zhi {
  font-size: 28rpx;
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  margin-top: 4rpx;
}

.dy-right {
  text-align: right;
  min-width: 120rpx;
}

.dy-shishen {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-zhu);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.dy-nayin {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-top: 2rpx;
}

.dy-flag {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  background: var(--color-zhu);
  color: var(--color-bai);
  font-size: var(--fs-xs);
  padding: 2rpx 12rpx;
  border-radius: 10rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  box-shadow: 0 0 8rpx var(--color-zhu);
}

/* ===== 流年 ===== */
.ln-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-1);
}

.ln-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
  border-radius: var(--r-sm);
  transition: all 0.2s ease;
}

.ln-cell.current {
  background: linear-gradient(135deg, var(--color-zhu) 0%, #8b1f1a 100%);
  border-color: var(--color-zhu);
  box-shadow: 0 0 12rpx var(--color-zhu);
}

.ln-year {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
}

.ln-ganzhi {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-top: 2rpx;
}

.ln-cell.current .ln-ganzhi,
.ln-cell.current .ln-ss,
.ln-cell.current .ln-year {
  color: var(--color-bai);
}

.ln-ss {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-top: 2rpx;
}

.reset {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}
</style>
