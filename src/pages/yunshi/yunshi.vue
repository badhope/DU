<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="今日运势" subtitle="DAILY HOROSCOPE" />

    <view v-if="!result" class="setup card-mystic anim-fade-up">
      <text class="form-title title-mystic">今 日 问 运</text>
      <text class="form-sub">生 肖 · 五 维 · 宜 忌</text>

      <view class="form-row">
        <text class="form-label">生 肖</text>
        <picker mode="selector" :value="sxIdx" :range="SX_LIST" @change="onPickSX">
          <view class="form-picker">{{ form.shengxiao }}</view>
        </picker>
      </view>

      <view class="form-row">
        <text class="form-label">生 年</text>
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
        <text class="form-label">生 月</text>
        <picker
          mode="number"
          :value="form.month"
          :min="1"
          :max="12"
          @change="onPick('month', $event)"
        >
          <view class="form-picker">{{ form.month }} 月</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">生 日</text>
        <picker mode="number" :value="form.day" :min="1" :max="31" @change="onPick('day', $event)">
          <view class="form-picker">{{ form.day }} 日</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">生 时</text>
        <picker
          mode="number"
          :value="form.hour"
          :min="0"
          :max="23"
          @change="onPick('hour', $event)"
        >
          <view class="form-picker">{{ form.hour }} 时</view>
        </picker>
      </view>

      <view class="form-tip">
        <text>· 出生信息越详尽 · 五维评分越精准</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '推算中…' : '开 始 推 算' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <view class="header card-mystic anim-fade-up">
        <text class="hd-sx">{{ result.shengxiao }} · 今 日</text>
        <text class="hd-gz">{{ result.todayGanzhi }} 日</text>
        <text class="hd-level" :class="'lv-' + result.level">
          {{ result.level }} · 总分 {{ result.scores.total }}
        </text>
        <text class="hd-advice">· {{ result.advice }} ·</text>
      </view>

      <view class="scores card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="card-title title-mystic">五 维 评 分</text>
        <view v-for="(s, i) in scoreList" :key="i" class="s-cell">
          <text class="s-name">{{ s.name }}</text>
          <view class="s-bar">
            <view class="s-fill" :style="{ width: s.val + '%', background: s.color }" />
          </view>
          <text class="s-val" :style="{ color: s.color }">{{ s.val }}</text>
        </view>
      </view>

      <view class="yi-ji card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">今 日 宜 忌</text>
        <view class="yj-row">
          <text class="yj-t yi-t">宜</text>
          <text v-for="(y, i) in result.yi" :key="i" class="yj-tag yi">{{ y }}</text>
        </view>
        <view class="yj-row">
          <text class="yj-t ji-t">忌</text>
          <text v-for="(j, i) in result.ji" :key="i" class="yj-tag ji">{{ j }}</text>
        </view>
      </view>

      <view class="lucky card-mystic anim-fade-up" style="animation-delay: 0.2s">
        <text class="card-title title-mystic">· 幸 运 之 选 ·</text>
        <view class="lk-grid">
          <view class="lk-cell">
            <text class="lk-lab">颜 色</text>
            <text class="lk-val" :style="{ color: lkColor(result.lucky.wuxing) }">
              {{ result.lucky.color }}
            </text>
          </view>
          <view class="lk-cell">
            <text class="lk-lab">数 字</text>
            <text class="lk-val">{{ result.lucky.number }}</text>
          </view>
          <view class="lk-cell">
            <text class="lk-lab">五 行</text>
            <text class="lk-val">{{ WX_NAME[result.lucky.wuxing] }}</text>
          </view>
          <view class="lk-cell">
            <text class="lk-lab">方 位</text>
            <text class="lk-val">{{ result.lucky.direction }}</text>
          </view>
        </view>
      </view>

      <view class="form-actions">
        <view class="btn-liu" @click="result = null">重 新 推 算</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import { calcYunshi, YUNSHI_SX, type YunshiResult } from '@/utils/yunshi'
import { WUXING_META } from '@/utils/wuxing'

const app = useAppStore()
const SX_LIST = YUNSHI_SX
const WX_NAME: Record<string, string> = { mu: '木', huo: '火', tu: '土', jin: '金', shui: '水' }
function lkColor(wx: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m: any = WUXING_META
  return m[wx]?.color || '#D4AF37'
}
const form = reactive({ shengxiao: '龙', year: 1990, month: 6, day: 15, hour: 12 })
const sxIdx = computed(() => SX_LIST.indexOf(form.shengxiao))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPickSX(e: any) {
  form.shengxiao = SX_LIST[e.detail.value]
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPick(k: string, e: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(form as any)[k] = Number(e.detail.value)
}

const result = ref<YunshiResult | null>(null)
const loading = ref(false)
async function calculate() {
  const y = form.year,
    m = form.month,
    d = form.day
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
    result.value = calcYunshi(form.shengxiao, y, m, d, form.hour)
    app.addHistory({
      tool: 'yunshi',
      toolName: '今日运势',
      category: '生活',
      input: { ...form },
      output: {
        gz: result.value.todayGanzhi,
        level: result.value.level,
        total: result.value.scores.total,
      },
      brief: `${result.value.shengxiao} · ${result.value.todayGanzhi}日 · ${result.value.level} ${result.value.scores.total}分`,
    })
  } catch (_e) {
    uni.showModal({ title: '运势推算失败', content: '请检查输入', showCancel: false })
  } finally {
    loading.value = false
  }
}

const scoreList = computed(() => {
  if (!result.value) return []
  return [
    { name: '事业', val: result.value.scores.shiye, color: '#C8302A' },
    { name: '财运', val: result.value.scores.caiyun, color: '#D4AF37' },
    { name: '感情', val: result.value.scores.ganqing, color: '#5B3A8E' },
    { name: '健康', val: result.value.scores.jiankang, color: '#4FAE6F' },
    { name: '人际', val: result.value.scores.renyuan, color: '#1B3A5C' },
  ]
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}
.setup,
.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0 var(--sp-2);
  margin-top: var(--sp-2);
}
.setup {
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
  background: linear-gradient(135deg, #c8302a, #4fae6f);
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

.card-mystic {
  padding: var(--sp-3);
}
.card-title {
  display: block;
  font-size: var(--fs-sm);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
  text-align: center;
}

.header {
  padding: var(--sp-5) var(--sp-4);
  text-align: center;
}
.hd-sx {
  display: block;
  font-size: 80rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
  text-shadow: 0 0 20rpx rgba(212, 175, 55, 0.5);
}
.hd-gz {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  margin-top: var(--sp-2);
}
.hd-level {
  display: inline-block;
  padding: 4rpx 20rpx;
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
  font-weight: 700;
  margin-top: var(--sp-2);
}
.hd-level.lv-大吉,
.hd-level.lv-吉 {
  background: #4fae6f;
  color: #fff;
}
.hd-level.lv-平 {
  background: #d4af37;
  color: #000;
}
.hd-level.lv-小凶,
.hd-level.lv-凶 {
  background: #c8302a;
  color: #fff;
}
.hd-advice {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
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

.yi-ji {
  padding: var(--sp-4);
}
.yj-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6rpx;
  margin: var(--sp-2) 0;
}
.yj-t {
  width: 50rpx;
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.yi-t {
  color: #4fae6f;
}
.ji-t {
  color: #c8302a;
}
.yj-tag {
  padding: 4rpx 14rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
}
.yj-tag.yi {
  background: rgba(79, 174, 111, 0.2);
  color: #8fd0a8;
}
.yj-tag.ji {
  background: rgba(200, 48, 42, 0.2);
  color: #f5c5c0;
}

.lucky {
  padding: var(--sp-4);
}
.lk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
  margin-top: var(--sp-3);
}
.lk-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
}
.lk-lab {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.lk-val {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-top: 4rpx;
}
</style>
