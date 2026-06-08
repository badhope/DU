<template>
  <view class="wufu-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="五福测算" subtitle="FIVE FORTUNES" />

    <!-- 输入 -->
    <view v-if="!result" class="form card-mystic anim-fade-up">
      <text class="form-title title-mystic">寿 富 康 德 考 终</text>
      <text class="form-sub">五 福 临 门 · 百 年 之 修</text>

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

      <view class="form-tip">
        <text>· 综合八字 · 5 维评分 · 90 年曲线 · 最佳/最弱年龄</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '测算中…' : '开 始 测 算' }}</text>
        </view>
      </view>
    </view>

    <!-- 结果 -->
    <view v-else class="result">
      <!-- 总评 -->
      <view class="overall card-mystic anim-fade-up">
        <text class="card-title title-mystic">五 福 总 评</text>
        <view class="ov-row">
          <view class="ov-circle">
            <text class="ov-num">{{ result.total }}</text>
            <text class="ov-unit">/ 100</text>
          </view>
          <view class="ov-info">
            <text class="ov-level title-mystic">{{ result.level }}</text>
            <text class="ov-nayin">{{ result.nayin.name }} · {{ result.nayin.desc }}</text>
            <text class="ov-strength">
              日主 {{ WX_META[result.strength.yong].name }}（{{ result.strength.level }}）
            </text>
          </view>
        </view>
        <text class="ov-summary">{{ result.summary }}</text>
      </view>

      <!-- 5 福分卡 -->
      <view class="fu-list">
        <view
          v-for="(item, idx) in fuItems"
          :key="idx"
          class="fu-card card-mystic anim-fade-up"
          :style="{ animationDelay: 0.05 + idx * 0.05 + 's' }"
        >
          <view class="fu-head" :style="{ background: item.color }">
            <text class="fu-key">{{ item.label }}</text>
            <text class="fu-score">{{ item.score }}</text>
          </view>
          <view class="fu-body">
            <text class="fu-level" :class="'lv-' + item.level">{{ item.level }}</text>
            <text class="fu-points">{{ item.points.join(' · ') }}</text>
          </view>
        </view>
      </view>

      <!-- 90 年曲线 -->
      <view class="curve card-mystic anim-fade-up" style="animation-delay: 0.35s">
        <text class="card-title title-mystic">九 十 年 曲 线</text>
        <view class="svg-wrap">
          <svg :viewBox="`0 0 ${svgW} ${svgH}`" class="curve-svg" preserveAspectRatio="none">
            <line
              v-for="g in 4"
              :key="'g' + g"
              :x1="0"
              :y1="g * (svgH / 5)"
              :x2="svgW"
              :y2="g * (svgH / 5)"
              stroke="rgba(212,175,55,0.08)"
              stroke-width="1"
            />
            <polyline
              v-for="(item, idx) in fuItems"
              :key="'p' + idx"
              :points="item.poly"
              fill="none"
              :stroke="item.color"
              stroke-width="2"
              :stroke-dasharray="idx === 0 ? '0' : '4 2'"
            />
          </svg>
        </view>
        <view class="legend">
          <text v-for="(item, idx) in fuItems" :key="'l' + idx" class="leg-item">
            <text class="leg-dot" :style="{ background: item.color }"></text>{{ item.label }}
          </text>
        </view>
      </view>

      <!-- 最佳/最差年龄 -->
      <view class="peaks card-mystic anim-fade-up" style="animation-delay: 0.4s">
        <text class="card-title title-mystic">最佳/最弱年龄</text>
        <view class="pk-section">
          <text class="pk-title">· 最佳五年</text>
          <view v-for="(b, i) in result.bestAges" :key="'b' + i" class="pk-row">
            <text class="pk-age">{{ b.age }} 岁</text>
            <text class="pk-key" :style="{ color: fuColor(b.type) }">
              {{ FU_LABEL[b.type] }}最盛
            </text>
            <text class="pk-desc">{{ b.desc }}</text>
          </view>
        </view>
        <view class="pk-section">
          <text class="pk-title">· 最弱五年</text>
          <view v-for="(w, i) in result.worstAges" :key="'w' + i" class="pk-row worst">
            <text class="pk-age">{{ w.age }} 岁</text>
            <text class="pk-key" :style="{ color: fuColor(w.type) }">
              {{ FU_LABEL[w.type] }}最弱
            </text>
            <text class="pk-desc">{{ w.desc }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import { calcWufu, type WufuResult, type FuKey } from '@/utils/wufu'
import { WUXING_META } from '@/utils/wuxing'

const app = useAppStore()
const WX_META = WUXING_META

const FU_LABEL: Record<FuKey, string> = { shou: '寿', fu: '富', kang: '康', de: '德', zhong: '终' }
const FU_COLOR: Record<FuKey, string> = {
  shou: '#4FAE6F',
  fu: '#D4AF37',
  kang: '#4FAE6F',
  de: '#5B3A8E',
  zhong: '#1B3A5C',
}
const FU_KEY: Record<FuKey, string> = { shou: '寿', fu: '富', kang: '康', de: '德', zhong: '终' }
function fuColor(k: FuKey) {
  return FU_COLOR[k]
}

const form = ref({ year: 1990, month: 6, day: 15, hour: 12, gender: '男' as '男' | '女' })
const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
const hourRange = Array.from({ length: 24 }, (_, i) => i + ':00')

// 若用户档案已存在，预填本人八字（避免 1990-6-15 默认值的误导）
if (app.profile) {
  const p = app.profile
  if (typeof p.birthYear === 'number') form.value.year = p.birthYear
  if (typeof p.birthMonth === 'number') form.value.month = p.birthMonth
  if (typeof p.birthDay === 'number') form.value.day = p.birthDay
  if (typeof p.birthHour === 'number' && p.birthHour >= 0 && p.birthHour <= 23)
    form.value.hour = p.birthHour
  if (p.gender === 'female') form.value.gender = '女'
  else if (p.gender === 'male') form.value.gender = '男'
}

function onPick(k: string, e: any) {
  const v = e.detail.value
  if (k === 'month') (form.value as any).month = Number(v) + 1
  else if (k === 'hour') (form.value as any).hour = Number(v.split(':')[0])
  else (form.value as any)[k] = Number(v)
}

const result = ref<WufuResult | null>(null)
const loading = ref(false)

const calculate = async () => {
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
  await new Promise((r) => setTimeout(r, 600))
  try {
    result.value = calcWufu(y, m, d, form.value.hour, form.value.gender)
    app.addHistory({
      tool: 'wufu',
      toolName: '五福测算',
      category: '健康',
      input: { ...form.value },
      output: { total: result.value.total, level: result.value.level },
      brief: `${result.value.level} · ${result.value.total}分`,
    })
  } finally {
    loading.value = false
  }
}

// 曲线
const svgW = 900
const svgH = 280
const W = svgW / 90

function scoreY(score: number): number {
  const ratio = (score - 20) / 80
  return svgH - ratio * (svgH - 20) - 10
}

const fuItems = computed(() => {
  if (!result.value) return []
  const lifetime = result.value.lifetime
  const TYPES: FuKey[] = ['shou', 'fu', 'kang', 'de', 'zhong']
  return TYPES.map((t, _idx) => {
    const sc = result.value!.scores[t]
    return {
      key: t,
      label: FU_KEY[t],
      score: sc.score,
      level: sc.level,
      points: sc.points,
      color: FU_COLOR[t],
      poly: lifetime.map((l) => `${l.age * W},${scoreY((l as any)[t])}`).join(' '),
    }
  })
})
</script>

<style scoped>
.wufu-page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}
.form,
.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0 var(--sp-2);
  margin-top: var(--sp-2);
}
.form {
  padding: var(--sp-4);
}
.form-title {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  margin-bottom: var(--sp-2);
  letter-spacing: 0.2em;
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
  padding: var(--sp-2) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
}
.form-label {
  width: 120rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.form-picker {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
}
.gender {
  flex: 1;
  display: flex;
  gap: var(--sp-2);
}
.g-btn {
  flex: 1;
  text-align: center;
  padding: var(--sp-2) 0;
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.g-btn.active {
  background: linear-gradient(135deg, #c8302a, #d4af37);
  color: var(--color-bai);
  border-color: var(--color-liu);
}
.form-tip {
  margin-top: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  text-align: center;
}
.form-actions {
  margin-top: var(--sp-4);
  display: flex;
  justify-content: center;
}
.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #c8302a, #d4af37);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 320rpx;
  text-align: center;
}
.btn-zhu.is-loading {
  opacity: 0.6;
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-3);
  text-align: center;
}

.overall {
  padding: var(--sp-4);
}
.ov-row {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin: var(--sp-3) 0;
}
.ov-circle {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.4), rgba(10, 10, 18, 0.6));
  border: 4rpx solid var(--color-liu);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30rpx rgba(212, 175, 55, 0.4);
}
.ov-num {
  font-size: 80rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-liu);
}
.ov-unit {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.ov-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.ov-level {
  font-size: var(--fs-lg);
}
.ov-nayin {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.ov-strength {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.ov-summary {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin-top: var(--sp-2);
  line-height: 1.6;
  font-family: 'KaiTi', serif;
}

.fu-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.fu-card {
  padding: 0;
  overflow: hidden;
}
.fu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-3) var(--sp-4);
  color: var(--color-bai);
}
.fu-key {
  font-size: 60rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 12rpx rgba(0, 0, 0, 0.4);
}
.fu-score {
  font-size: 48rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.fu-body {
  padding: var(--sp-3) var(--sp-4);
}
.fu-level {
  display: inline-block;
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
  margin-bottom: var(--sp-2);
}
.fu-level.lv-上 {
  background: #4fae6f;
  color: #fff;
}
.fu-level.lv-中 {
  background: #d4af37;
  color: #000;
}
.fu-level.lv-下 {
  background: #c8302a;
  color: #fff;
}
.fu-points {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
}

.curve {
  padding: var(--sp-4);
}
.svg-wrap {
  width: 100%;
  height: 320rpx;
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  padding: var(--sp-2);
}
.curve-svg {
  width: 100%;
  height: 100%;
}
.legend {
  display: flex;
  justify-content: center;
  gap: var(--sp-3);
  margin-top: var(--sp-2);
  flex-wrap: wrap;
}
.leg-item {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
}
.leg-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  display: inline-block;
}

.peaks {
  padding: var(--sp-4);
}
.pk-section {
  margin-bottom: var(--sp-3);
}
.pk-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-weight: 600;
  margin-bottom: var(--sp-2);
}
.pk-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(79, 174, 111, 0.1);
  border-radius: var(--r-sm);
  border-left: 4rpx solid #4fae6f;
  margin-bottom: 6rpx;
  font-size: var(--fs-xs);
}
.pk-row.worst {
  background: rgba(200, 48, 42, 0.1);
  border-left-color: #c8302a;
}
.pk-age {
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-weight: 600;
  font-family: 'KaiTi', serif;
}
.pk-key {
  font-size: var(--fs-sm);
  font-weight: 600;
}
.pk-desc {
  color: var(--color-bai-2);
  flex: 1;
}
</style>
