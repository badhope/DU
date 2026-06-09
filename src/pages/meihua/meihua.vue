<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="梅花易数" subtitle="PLUM BLOSSOM" />

    <view v-if="!result" class="setup card-mystic anim-fade-up">
      <text class="form-title title-mystic">时 间 起 卦</text>
      <text class="form-sub">年 月 日 时 · 天 机 自 现</text>

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
        <text>· 心中默念所问之事 · 时间起卦 · 体用关系 · 五维评分</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '起卦中…' : '开 始 起 卦' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <view class="hex card-mystic anim-fade-up">
        <text class="hex-name">{{ result.hexName }}</text>
        <text class="hex-sub">第 {{ result.dongYao }} 爻 动</text>
        <view class="g-bars">
          <text v-for="i in 6" :key="i" class="g-bar" :class="i === result.dongYao ? 'dong' : ''">
            <text v-if="i % 2 === 1" class="g-yang"></text>
            <text v-else class="g-yin"></text>
          </text>
        </view>
      </view>

      <view class="tiyong card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="card-title title-mystic">体 用 之 辨</text>
        <view class="ty-grid">
          <view class="ty-cell" :style="{ borderColor: WX_META[result.ti.wuxing].color }">
            <text class="ty-name">体 卦</text>
            <text class="ty-sym" :style="{ color: WX_META[result.ti.wuxing].color }">
              {{ result.ti.symbol }}
            </text>
            <text class="ty-wx" :style="{ color: WX_META[result.ti.wuxing].color }">
              {{ result.ti.name }} ({{ WX_META[result.ti.wuxing].name }})
            </text>
          </view>
          <view class="ty-cell" :style="{ borderColor: WX_META[result.yong.wuxing].color }">
            <text class="ty-name">用 卦</text>
            <text class="ty-sym" :style="{ color: WX_META[result.yong.wuxing].color }">
              {{ result.yong.symbol }}
            </text>
            <text class="ty-wx" :style="{ color: WX_META[result.yong.wuxing].color }">
              {{ result.yong.name }} ({{ WX_META[result.yong.wuxing].name }})
            </text>
          </view>
          <view class="ty-cell" :style="{ borderColor: WX_META[result.bian.wuxing].color }">
            <text class="ty-name">变 卦</text>
            <text class="ty-sym" :style="{ color: WX_META[result.bian.wuxing].color }">
              {{ result.bian.symbol }}
            </text>
            <text class="ty-wx" :style="{ color: WX_META[result.bian.wuxing].color }">
              {{ result.bian.name }} ({{ WX_META[result.bian.wuxing].name }})
            </text>
          </view>
        </view>
        <text class="ty-inter">{{ result.interpretation }}</text>
        <text class="ty-sum">{{ result.summary }}</text>
        <text class="ty-advice">· 建议：{{ result.advice }}</text>
      </view>

      <view class="scores card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">五 维 评 分</text>
        <view v-for="(s, i) in scoreList" :key="i" class="s-cell">
          <text class="s-name">{{ s.name }}</text>
          <view class="s-bar">
            <view class="s-fill" :style="{ width: s.val + '%', background: s.color }" />
          </view>
          <text class="s-val" :style="{ color: s.color }">{{ s.val }}</text>
        </view>
      </view>

      <view class="form-actions">
        <view class="btn-liu" @click="result = null">重 起 一 卦</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import TopBar from '@/components/ui/TopBar.vue'
import _MeiHuaChart from '@/components/charts/MeiHuaChart.vue'
import { useAppStore } from '@/stores'
import { meihuaDivinate, type MeihuaResult } from '@/utils/meihua'
import { WUXING_META } from '@/utils/wuxing'

const app = useAppStore()
const WX_META = WUXING_META

const form = ref({ year: 1990, month: 6, day: 15, hour: 12 })
const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
const hourRange = Array.from({ length: 24 }, (_, i) => i + ':00')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPick(k: string, e: any) {
  const v = e.detail.value
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (k === 'month') (form.value as any).month = Number(v) + 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else if (k === 'hour') (form.value as any).hour = Number(v.split(':')[0])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else (form.value as any)[k] = Number(v)
}
const result = ref<MeihuaResult | null>(null)
const loading = ref(false)
async function calculate() {
  const y = form.value.year,
    m = form.value.month,
    d = form.value.day
  if (y < 1900 || y > new Date().getFullYear()) {
    uni.showToast({ title: '年份需 1900-今年', icon: 'none' })
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
  loading.value = true
  await new Promise((r) => setTimeout(r, 600))
  try {
    result.value = meihuaDivinate(y, m, d, form.value.hour)
    loading.value = false
    app.addHistory({
      tool: 'meihua',
      toolName: '梅花易数',
      category: '占卜',
      input: { ...form.value },
      output: { hex: result.value.hexName },
      brief: `${result.value.hexName} · ${result.value.interpretation}`,
    })
  } catch (_e) {
    loading.value = false
    uni.showModal({ title: '起卦失败', content: '请检查日期', showCancel: false })
  }
}
const scoreList = computed(() => {
  if (!result.value) return []
  return [
    { name: '事业', val: result.value.scores.shiye, color: '#C8302A' },
    { name: '财运', val: result.value.scores.caiyun, color: '#D4AF37' },
    { name: '感情', val: result.value.scores.ganqing, color: '#5B3A8E' },
    { name: '健康', val: result.value.scores.jiankang, color: '#4FAE6F' },
    { name: '精神', val: result.value.scores.jingshen, color: '#1B3A5C' },
  ]
})
</script>

<style scoped>
.page {
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
  letter-spacing: 0.2em;
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
  background: linear-gradient(135deg, #d4af37, #5b3a8e);
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
.btn-liu {
  padding: var(--sp-3) var(--sp-6);
  background: transparent;
  color: var(--color-liu);
  border: 1rpx solid var(--color-liu);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 320rpx;
  text-align: center;
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-3);
  text-align: center;
}
.card-mystic {
  padding: var(--sp-4);
}

.hex {
  padding: var(--sp-5) var(--sp-4);
  text-align: center;
}
.hex-name {
  display: block;
  font-size: 80rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
  text-shadow: 0 0 20rpx rgba(212, 175, 55, 0.5);
}
.hex-sub {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  margin-top: var(--sp-2);
}
.g-bars {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  align-items: center;
  margin-top: var(--sp-3);
}
.g-bar {
  display: flex;
  align-items: center;
  width: 240rpx;
  height: 24rpx;
  position: relative;
}
.g-yang {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, var(--color-liu), #c8302a);
  border-radius: 4rpx;
}
.g-yin {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.g-yin::before,
.g-yin::after {
  content: '';
  width: 45%;
  height: 100%;
  background: linear-gradient(90deg, var(--color-liu), #c8302a);
  border-radius: 4rpx;
}
.g-bar.dong .g-yang,
.g-bar.dong .g-yin::before,
.g-bar.dong .g-yin::after {
  background: linear-gradient(90deg, #c8302a, #ffd700);
  box-shadow: 0 0 16rpx rgba(200, 48, 42, 0.6);
}

.tiyong {
  padding: var(--sp-4);
}
.ty-grid {
  display: flex;
  gap: var(--sp-2);
  margin: var(--sp-3) 0;
}
.ty-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid;
  border-radius: var(--r-sm);
}
.ty-name {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.ty-sym {
  font-size: 60rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.ty-wx {
  font-size: var(--fs-xs);
  font-family: 'KaiTi', serif;
}
.ty-inter {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  margin: var(--sp-2) 0;
}
.ty-sum {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
}
.ty-advice {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-top: var(--sp-2);
  font-family: 'KaiTi', serif;
}

.scores {
  padding: var(--sp-4);
}
.s-cell {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: var(--sp-2) 0;
}
.s-name {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.s-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 8rpx;
  overflow: hidden;
}
.s-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.6s ease;
}
.s-val {
  width: 60rpx;
  text-align: right;
  font-size: var(--fs-sm);
  font-weight: 600;
}
</style>
