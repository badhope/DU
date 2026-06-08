<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="面相分析" subtitle="FACE READING" />

    <view v-if="!result" class="setup card-mystic anim-fade-up">
      <text class="form-title title-mystic">三 停 五 官</text>
      <text class="form-sub">生 辰 输 入 · 推 算 面 相 之 运</text>

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

      <view class="form-tip">
        <text>· 三停分格 · 五官相辅 · 12 宫位详批</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" @click="analyze">开 始 分 析</view>
      </view>
    </view>

    <view v-else class="result">
      <view class="overall card-mystic anim-fade-up">
        <text class="card-title title-mystic">面 相 总 评</text>
        <view class="ov-row">
          <view class="ov-num">
            <text class="ov-val">{{ result.totalScore }}</text
            ><text class="ov-unit">/ 100</text>
          </view>
          <text class="ov-level" :class="'lv-' + result.level">{{ result.level }}</text>
        </view>
        <text class="ov-sum">{{ result.summary }}</text>
      </view>

      <view class="stanting card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="card-title title-mystic">三 停 之 运</text>
        <view v-for="(s, i) in result.sanTing" :key="i" class="st-row">
          <text class="st-name">{{ s.name }}</text>
          <view class="st-bar"><view class="st-fill" :style="{ width: s.score + '%' }" /></view>
          <text class="st-score">{{ s.score }}</text>
        </view>
        <view v-for="(s, i) in result.sanTing" :key="'d' + i" class="st-desc">
          <text class="std-l">· {{ s.name }}（{{ s.age }}）：{{ s.desc }}</text>
        </view>
      </view>

      <view class="wuguan card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">五 官 之 相</text>
        <view v-for="(g, i) in result.wuGuan" :key="i" class="wg-card">
          <text class="wg-name">{{ g.name }}（{{ g.wuxing }}）</text>
          <text class="wg-desc">{{ g.desc }}</text>
          <view class="wg-bar"><view class="wg-fill" :style="{ width: g.fortune + '%' }" /></view>
          <text class="wg-score">{{ g.fortune }}</text>
        </view>
      </view>

      <view class="shier card-mystic anim-fade-up" style="animation-delay: 0.2s">
        <text class="card-title title-mystic">十 二 宫 位</text>
        <view class="shier-grid">
          <view v-for="(g, i) in result.shiErGong" :key="i" class="sh-cell">
            <text class="sh-name">{{ g.name }}</text>
            <text class="sh-pos">{{ g.pos }}</text>
            <text class="sh-desc">{{ g.desc }}</text>
          </view>
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
import _MianXiangChart from '@/components/charts/MianXiangChart.vue'
import { useAppStore } from '@/stores'
import { calcMianxiang, type MianxiangResult } from '@/utils/mianxiang'

const app = useAppStore()
const form = ref({ year: 1990, month: 6, day: 15 })
const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
function onPick(k: string, e: any) {
  const v = e.detail.value
  if (k === 'month') (form.value as any).month = Number(v) + 1
  else (form.value as any)[k] = Number(v)
}
const result = ref<MianxiangResult | null>(null)
const loading = ref(false)
function analyze() {
  const y = form.value.year
  if (y < 1900 || y > new Date().getFullYear()) {
    uni.showToast({ title: '年份需 1900-今年', icon: 'none' })
    return
  }
  loading.value = true
  setTimeout(() => {
    try {
      result.value = calcMianxiang(y, (form.value as any).gender || '')
      loading.value = false
      app.addHistory({
        tool: 'mianxiang',
        toolName: '面相分析',
        category: '古物',
        input: { ...form.value },
        output: { score: result.value.totalScore, level: result.value.level },
        brief: `${result.value.level} · ${result.value.totalScore}分`,
      })
    } catch (e) {
      loading.value = false
      uni.showModal({ title: '分析失败', content: '请检查输入', showCancel: false })
    }
  }, 600)
}
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
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  text-align: center;
  margin: var(--sp-2) 0;
}
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}
.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #d4af37, #8b1f1a);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 320rpx;
  text-align: center;
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

.overall {
  padding: var(--sp-4);
}
.ov-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  justify-content: center;
}
.ov-num {
  display: flex;
  align-items: baseline;
}
.ov-val {
  font-size: 100rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 20rpx rgba(212, 175, 55, 0.5);
}
.ov-unit {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
}
.ov-level {
  padding: 6rpx 20rpx;
  font-size: var(--fs-md);
  border-radius: var(--r-sm);
  color: var(--color-bai);
}
.ov-level.lv-大吉 {
  background: linear-gradient(135deg, #d4af37, #c8302a);
}
.ov-level.lv-吉 {
  background: #4fae6f;
}
.ov-level.lv-平 {
  background: #1b3a5c;
}
.ov-level.lv-凶 {
  background: #c8302a;
}
.ov-sum {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin-top: var(--sp-2);
  font-family: 'KaiTi', serif;
}

.stanting {
  padding: var(--sp-4);
}
.st-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: var(--sp-2) 0;
}
.st-name {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.st-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 8rpx;
  overflow: hidden;
}
.st-fill {
  height: 100%;
  background: linear-gradient(90deg, #d4af37, #c8302a);
  border-radius: 8rpx;
}
.st-score {
  width: 60rpx;
  text-align: right;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-weight: 600;
}
.st-desc {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  line-height: 1.6;
  margin: 2rpx 0;
  padding-left: var(--sp-1);
}
.std-l {
  font-family: 'KaiTi', serif;
}

.wuguan {
  padding: var(--sp-4);
}
.wg-card {
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
  margin-bottom: var(--sp-2);
}
.wg-name {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.wg-desc {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  line-height: 1.6;
  margin: 4rpx 0;
}
.wg-bar {
  display: inline-block;
  width: 70%;
  height: 12rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 6rpx;
  overflow: hidden;
  vertical-align: middle;
}
.wg-fill {
  height: 100%;
  background: linear-gradient(90deg, #d4af37, #c8302a);
  border-radius: 6rpx;
}
.wg-score {
  display: inline-block;
  margin-left: 8rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-weight: 600;
}

.shier {
  padding: var(--sp-4);
}
.shier-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}
.sh-cell {
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
  border-left: 3rpx solid var(--color-liu);
}
.sh-name {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.sh-pos {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-3);
}
.sh-desc {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-2);
  margin-top: 2rpx;
}
</style>
