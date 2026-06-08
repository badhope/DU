<template>
  <view class="page" :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']">
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="手相分析" subtitle="PALM READING" />

    <view v-if="!result" class="setup card-mystic anim-fade-up">
      <text class="form-title title-mystic">掌 纹 八 宫</text>
      <text class="form-sub">生 辰 输 入 · 推 算 掌 相</text>

      <view class="form-row">
        <text class="form-label">年</text>
        <picker mode="number" :value="form.year" :min="1900" :max="2010" @change="onPick('year', $event)">
          <view class="form-picker">{{ form.year }} 年</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">月</text>
        <picker mode="selector" :value="form.month - 1" :range="monthRange" @change="onPick('month', $event)">
          <view class="form-picker">{{ form.month }} 月</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">日</text>
        <picker mode="number" :value="form.day" :min="1" :max="31" @change="onPick('day', $event)">
          <view class="form-picker">{{ form.day }} 日</view>
        </picker>
      </view>

      <view class="form-tip">
        <text>· 八宫丘相 · 三线主纹 · 性格事业</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" @click="analyze">开 始 分 析</view>
      </view>
    </view>

    <view v-else class="result">
      <view class="overall card-mystic anim-fade-up">
        <text class="card-title title-mystic">掌 相 总 评</text>
        <view class="ov-row">
          <view class="ov-num"><text class="ov-val">{{ result.totalScore }}</text><text class="ov-unit">/ 100</text></view>
          <text class="ov-level" :class="'lv-' + result.level">{{ result.level }}</text>
        </view>
        <text class="ov-sum">{{ result.summary }}</text>
      </view>

      <view class="bagong card-mystic anim-fade-up" style="animation-delay: .1s">
        <text class="card-title title-mystic">八 宫 丘 相</text>
        <view v-for="(g, i) in result.baGong" :key="i" class="bg-row" :class="{'best': g.name === result.bestArea, 'worst': g.name === result.worstArea}">
          <text class="bg-name">{{ g.name }}</text>
          <text class="bg-pos">{{ g.pos }}</text>
          <text class="bg-el">（{{ g.element }}）</text>
          <view class="bg-bar"><view class="bg-fill" :style="{ width: g.score + '%' }" /></view>
          <text class="bg-score">{{ g.score }}</text>
        </view>
      </view>

      <view class="sanzhu card-mystic anim-fade-up" style="animation-delay: .15s">
        <text class="card-title title-mystic">三 大 主 纹</text>
        <view v-for="(s, i) in result.sanZhu" :key="i" class="sz-card">
          <text class="sz-name">{{ s.name }}</text>
          <text class="sz-q">· {{ s.quality }}</text>
          <text class="sz-desc">{{ s.desc }}</text>
          <view class="sz-bar"><view class="sz-fill" :style="{ width: s.score + '%' }" /></view>
        </view>
      </view>

      <view class="form-actions">
        <view class="btn-liu" @click="result = null">重 新 测 算</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import ShouXiangChart from '@/components/charts/ShouXiangChart.vue'
import { useAppStore } from '@/stores'
import { calcShouxiang, type ShouxiangResult } from '@/utils/shouxiang'

const app = useAppStore()
const form = ref({ year: 1990, month: 6, day: 15 })
const monthRange = Array.from({ length: 12 }, (_, i) => (i + 1) + '月')
function onPick(k: string, e: any) {
  const v = e.detail.value
  if (k === 'month') (form.value as any).month = Number(v) + 1
  else (form.value as any)[k] = Number(v)
}
const result = ref<ShouxiangResult | null>(null)
const loading = ref(false)
function analyze() {
  const y = form.value.year, m = form.value.month, d = form.value.day
  if (y < 1900 || y > 2100) { uni.showToast({ title: '年份需 1900-2100', icon: 'none' }); return }
  if (m < 1 || m > 12) { uni.showToast({ title: '月份需 1-12', icon: 'none' }); return }
  const dim = new Date(y, m, 0).getDate()
  if (d < 1 || d > dim) { uni.showToast({ title: `${m}月只有${dim}天`, icon: 'none' }); return }
  loading.value = true
  setTimeout(() => {
    try {
      result.value = calcShouxiang(y, m, d)
      app.addHistory({ tool: 'shouxiang', toolName: '手相分析', category: '古物', input: { ...form.value }, output: { score: result.value.totalScore, best: result.value.bestArea }, brief: `${result.value.level} · ${result.value.totalScore}分 · 最佳${result.value.bestArea}` })
    } catch (e) {
      uni.showModal({ title: '分析失败', content: '请检查日期输入', showCancel: false })
    } finally {
      loading.value = false
    }
  }, 400)
}
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: var(--sp-6); }
.form, .result { display: flex; flex-direction: column; gap: var(--sp-3); margin: 0 var(--sp-2); margin-top: var(--sp-2); }
.form { padding: var(--sp-4); }
.form-title { display: block; text-align: center; font-size: var(--fs-md); letter-spacing: 0.2em; margin-bottom: var(--sp-2); }
.form-sub { display: block; text-align: center; font-size: var(--fs-sm); color: var(--color-bai-2); margin-bottom: var(--sp-4); }
.form-row { display: flex; align-items: center; padding: var(--sp-2) 0; border-bottom: 1rpx solid rgba(212, 175, 55, 0.1); }
.form-label { width: 120rpx; font-size: var(--fs-sm); color: var(--color-bai-2); }
.form-picker { flex: 1; font-size: var(--fs-sm); color: var(--color-liu); padding: var(--sp-2); background: rgba(10, 10, 18, 0.5); border-radius: var(--r-sm); }
.form-tip { font-size: var(--fs-xs); color: var(--color-bai-3); text-align: center; margin: var(--sp-2) 0; }
.form-actions { display: flex; justify-content: center; margin-top: var(--sp-4); }
.btn-zhu { padding: var(--sp-3) var(--sp-6); background: linear-gradient(135deg, #8B6F47, #5B3A8E); color: var(--color-bai); font-size: var(--fs-md); border-radius: var(--r-md); letter-spacing: 0.2em; min-width: 320rpx; text-align: center; }
.btn-liu { padding: var(--sp-3) var(--sp-6); background: transparent; color: var(--color-liu); border: 1rpx solid var(--color-liu); font-size: var(--fs-md); border-radius: var(--r-md); letter-spacing: 0.2em; min-width: 320rpx; text-align: center; }
.card-title { display: block; font-size: var(--fs-md); letter-spacing: 0.2em; margin-bottom: var(--sp-3); text-align: center; }
.card-mystic { padding: var(--sp-4); }

.overall { padding: var(--sp-4); }
.ov-row { display: flex; align-items: center; gap: var(--sp-3); justify-content: center; }
.ov-num { display: flex; align-items: baseline; }
.ov-val { font-size: 100rpx; color: var(--color-liu); font-family: 'KaiTi', serif; font-weight: 700; text-shadow: 0 0 20rpx rgba(212, 175, 55, 0.5); }
.ov-unit { font-size: var(--fs-sm); color: var(--color-bai-3); }
.ov-level { padding: 6rpx 20rpx; font-size: var(--fs-md); border-radius: var(--r-sm); color: var(--color-bai); }
.ov-level.lv-大吉 { background: linear-gradient(135deg, #D4AF37, #C8302A); }
.ov-level.lv-吉 { background: #4FAE6F; }
.ov-level.lv-平 { background: #1B3A5C; }
.ov-level.lv-凶 { background: #C8302A; }
.ov-sum { display: block; text-align: center; font-size: var(--fs-sm); color: var(--color-bai); margin-top: var(--sp-2); font-family: 'KaiTi', serif; }

.bagong { padding: var(--sp-4); }
.bg-row { display: flex; align-items: center; gap: var(--sp-1); padding: var(--sp-2); border-radius: var(--r-sm); margin-bottom: 4rpx; }
.bg-row.best { background: rgba(79, 174, 111, 0.15); border-left: 4rpx solid #4FAE6F; }
.bg-row.worst { background: rgba(200, 48, 42, 0.15); border-left: 4rpx solid #C8302A; }
.bg-name { width: 100rpx; font-size: var(--fs-sm); color: var(--color-liu); font-family: 'KaiTi', serif; font-weight: 600; }
.bg-pos { flex: 0 0 180rpx; font-size: 20rpx; color: var(--color-bai-3); }
.bg-el { width: 60rpx; font-size: 20rpx; color: var(--color-bai-3); }
.bg-bar { flex: 1; height: 12rpx; background: rgba(212, 175, 55, 0.1); border-radius: 6rpx; overflow: hidden; }
.bg-fill { height: 100%; background: linear-gradient(90deg, #8B6F47, #5B3A8E); border-radius: 6rpx; }
.bg-score { width: 50rpx; text-align: right; font-size: var(--fs-sm); color: var(--color-liu); }

.sanzhu { padding: var(--sp-4); }
.sz-card { padding: var(--sp-3); background: rgba(10, 10, 18, 0.5); border-radius: var(--r-sm); margin-bottom: var(--sp-2); }
.sz-name { display: inline-block; font-size: var(--fs-md); color: var(--color-liu); font-family: 'KaiTi', serif; font-weight: 700; }
.sz-q { display: inline-block; margin-left: var(--sp-2); padding: 2rpx 8rpx; font-size: var(--fs-xs); border-radius: var(--r-sm); background: #4FAE6F; color: #fff; }
.sz-desc { display: block; font-size: var(--fs-xs); color: var(--color-bai-2); line-height: 1.6; margin: 4rpx 0; font-family: 'KaiTi', serif; }
.sz-bar { height: 14rpx; background: rgba(212, 175, 55, 0.1); border-radius: 7rpx; overflow: hidden; }
.sz-fill { height: 100%; background: linear-gradient(90deg, #8B6F47, #5B3A8E); border-radius: 7rpx; }
</style>
