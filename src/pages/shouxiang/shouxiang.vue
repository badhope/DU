<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <StarField :count="60" density="mid" colors="mixed" :shooting="true" />
    <TopBar title="手相分析" subtitle="PALM READING" />

    <view v-if="!result" class="setup card-mystic anim-fade-up">
      <!-- 装饰光效 -->
      <view class="form-glow" />

      <!-- 标题区 -->
      <view class="form-header">
        <view class="form-seal">
          <view class="form-seal-ring" />
          <text class="form-seal-char">掌</text>
        </view>
        <text class="form-title title-mystic">掌 纹 八 宫</text>
        <view class="form-divider">
          <view class="form-divider-line" />
          <text class="form-divider-dot">·</text>
          <view class="form-divider-line" />
        </view>
        <text class="form-sub">生 辰 输 入 · 推 算 掌 相 之 运</text>
      </view>

      <!-- 表单区 -->
      <view class="form-body">
        <view class="form-row">
          <view class="form-label-wrap">
            <text class="form-label-icon">年</text>
            <text class="form-label">年份</text>
          </view>
          <picker
            mode="number"
            :value="form.year"
            :min="1900"
            :max="2010"
            @change="onPick('year', $event)"
          >
            <view class="form-picker">
              <text class="form-picker-value">{{ form.year }}</text>
              <text class="form-picker-unit">年</text>
              <text class="form-picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="form-row">
          <view class="form-label-wrap">
            <text class="form-label-icon">月</text>
            <text class="form-label">月份</text>
          </view>
          <picker
            mode="selector"
            :value="form.month - 1"
            :range="monthRange"
            @change="onPick('month', $event)"
          >
            <view class="form-picker">
              <text class="form-picker-value">{{ form.month }}</text>
              <text class="form-picker-unit">月</text>
              <text class="form-picker-arrow">▼</text>
            </view>
          </picker>
        </view>
        <view class="form-row">
          <view class="form-label-wrap">
            <text class="form-label-icon">日</text>
            <text class="form-label">日期</text>
          </view>
          <picker
            mode="number"
            :value="form.day"
            :min="1"
            :max="31"
            @change="onPick('day', $event)"
          >
            <view class="form-picker">
              <text class="form-picker-value">{{ form.day }}</text>
              <text class="form-picker-unit">日</text>
              <text class="form-picker-arrow">▼</text>
            </view>
          </picker>
        </view>
      </view>

      <view class="form-tip">
        <text class="form-tip-icon">☯</text>
        <text>· 八宫丘相 · 三线主纹 · 性格事业</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu anim-pulse-soft" @click="analyze">
          <text class="btn-icon">启</text>
          <text>开 始 分 析</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <!-- 总评卡片 -->
      <view class="overall card-mystic anim-fade-up">
        <view class="card-header">
          <view class="card-header-line" />
          <text class="card-title title-mystic">掌 相 总 评</text>
          <view class="card-header-line" />
        </view>
        <view class="ov-score-wrap">
          <view class="ov-ring">
            <text class="ov-val">{{ result.totalScore }}</text>
            <text class="ov-unit">/ 100</text>
          </view>
          <text class="ov-level" :class="'lv-' + result.level">{{ result.level }}</text>
        </view>
        <text class="ov-sum">{{ result.summary }}</text>
      </view>

      <!-- 八宫丘相 -->
      <view class="bagong card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <view class="card-header">
          <view class="card-header-line" />
          <text class="card-title title-mystic">八 宫 丘 相</text>
          <view class="card-header-line" />
        </view>
        <view class="bg-list">
          <view
            v-for="(g, i) in result.baGong"
            :key="i"
            class="bg-row"
            :class="{ best: g.name === result.bestArea, worst: g.name === result.worstArea }"
          >
            <view class="bg-label">
              <text class="bg-name">{{ g.name }}</text>
              <text class="bg-pos">{{ g.pos }}</text>
              <view class="bg-el-badge">{{ g.element }}</view>
            </view>
            <view class="bg-bar-wrap">
              <view class="bg-bar"><view class="bg-fill" :style="{ width: g.score + '%' }" /></view>
              <text class="bg-score">{{ g.score }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 三大主纹 -->
      <view class="sanzhu card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <view class="card-header">
          <view class="card-header-line" />
          <text class="card-title title-mystic">三 大 主 纹</text>
          <view class="card-header-line" />
        </view>
        <view class="sz-list">
          <view v-for="(s, i) in result.sanZhu" :key="i" class="sz-card">
            <view class="sz-card-header">
              <text class="sz-name">{{ s.name }}</text>
              <view class="sz-quality-badge" :class="'q-' + s.quality">{{ s.quality }}</view>
            </view>
            <text class="sz-desc">{{ s.desc }}</text>
            <view class="sz-bar-wrap">
              <view class="sz-bar"><view class="sz-fill" :style="{ width: s.score + '%' }" /></view>
              <text class="sz-score">{{ s.score }}</text>
            </view>
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
import _ShouXiangChart from '@/components/charts/ShouXiangChart.vue'
import { useAppStore } from '@/stores'
import { calcShouxiang, type ShouxiangResult } from '@/utils/shouxiang'

const app = useAppStore()
const form = ref({ year: 1990, month: 6, day: 15 })
const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPick(k: string, e: any) {
  const v = e.detail.value
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (k === 'month') (form.value as any).month = Number(v) + 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else (form.value as any)[k] = Number(v)
}
const result = ref<ShouxiangResult | null>(null)
const loading = ref(false)
function analyze() {
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
  loading.value = true
  setTimeout(() => {
    try {
      result.value = calcShouxiang(y, m, d)
      app.addHistory({
        tool: 'shouxiang',
        toolName: '手相分析',
        category: '古物',
        input: { ...form.value },
        output: { score: result.value.totalScore, best: result.value.bestArea },
        brief: `${result.value.level} · ${result.value.totalScore}分 · 最佳${result.value.bestArea}`,
      })
    } catch (_e) {
      uni.showModal({ title: '分析失败', content: '请检查日期输入', showCancel: false })
    } finally {
      loading.value = false
    }
  }, 400)
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}

/* 装饰光效 */
.form-glow {
  position: absolute;
  top: -100rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 400rpx;
  height: 400rpx;
  background: radial-gradient(circle, rgba(139, 111, 71, 0.15) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* 表单头部 */
.form-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: var(--sp-5);
  z-index: 1;
}

.form-seal {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--sp-3);
}

.form-seal-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2rpx solid rgba(139, 111, 71, 0.4);
  background: linear-gradient(135deg, rgba(139, 111, 71, 0.1), rgba(91, 58, 142, 0.1));
  box-shadow: 0 0 30rpx rgba(139, 111, 71, 0.3);
}

.form-seal-ring::after {
  content: '';
  position: absolute;
  inset: 8rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.form-seal-char {
  position: relative;
  font-size: 56rpx;
  font-weight: 700;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  text-shadow: 0 0 20rpx rgba(139, 111, 71, 0.6);
  z-index: 1;
}

.form-title {
  display: block;
  text-align: center;
  font-size: var(--fs-lg);
  letter-spacing: 0.3em;
  margin-bottom: var(--sp-2);
}

.form-divider {
  display: flex;
  align-items: center;
  gap: 12rpx;
  width: 240rpx;
  margin: var(--sp-2) 0;
}

.form-divider-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, rgba(139, 111, 71, 0.4), transparent);
}

.form-divider-dot {
  font-size: 20rpx;
  color: var(--color-liu);
}

.form-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  letter-spacing: 0.15em;
}

/* 表单主体 */
.form-body {
  position: relative;
  z-index: 1;
  margin-bottom: var(--sp-4);
}

.form-row {
  display: flex;
  align-items: center;
  padding: var(--sp-3) 0;
  border-bottom: 1rpx solid rgba(139, 111, 71, 0.15);
  transition: all 0.3s var(--ease-mystic);
}

.form-row:active {
  background: rgba(139, 111, 71, 0.05);
}

.form-label-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 140rpx;
  gap: 4rpx;
}

.form-label-icon {
  font-size: 32rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 12rpx rgba(139, 111, 71, 0.5);
}

.form-label {
  font-size: 20rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.1em;
}

.form-picker {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: var(--fs-md);
  color: var(--color-liu);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.6);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(139, 111, 71, 0.2);
  transition: all 0.3s var(--ease-mystic);
}

.form-picker:active {
  border-color: rgba(139, 111, 71, 0.5);
  background: rgba(10, 10, 18, 0.8);
}

.form-picker-value {
  font-size: var(--fs-md);
  font-weight: 600;
  color: var(--color-liu);
}

.form-picker-unit {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}

.form-picker-arrow {
  margin-left: auto;
  font-size: 20rpx;
  color: var(--color-bai-3);
  opacity: 0.6;
}

.form-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  text-align: center;
  margin: var(--sp-3) 0;
  letter-spacing: 0.1em;
}

.form-tip-icon {
  font-size: var(--fs-md);
  color: var(--color-liu);
  opacity: 0.6;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-5);
}

.btn-zhu {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #8b6f47, #5b3a8e);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-full);
  letter-spacing: 0.2em;
  min-width: 360rpx;
  text-align: center;
  box-shadow: 0 0 30rpx rgba(139, 111, 71, 0.4);
  transition: all 0.3s var(--ease-mystic);
}

.btn-zhu:active {
  transform: scale(0.96);
  box-shadow: 0 0 40rpx rgba(139, 111, 71, 0.6);
}

.btn-icon {
  font-size: var(--fs-lg);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 12rpx rgba(255, 255, 255, 0.5);
}

.btn-liu {
  padding: var(--sp-3) var(--sp-6);
  background: transparent;
  color: var(--color-liu);
  border: 1rpx solid rgba(139, 111, 71, 0.4);
  font-size: var(--fs-md);
  border-radius: var(--r-full);
  letter-spacing: 0.2em;
  min-width: 360rpx;
  text-align: center;
  transition: all 0.3s var(--ease-mystic);
}

.btn-liu:active {
  background: rgba(139, 111, 71, 0.1);
  border-color: rgba(139, 111, 71, 0.6);
  transform: scale(0.96);
}

/* 结果卡片通用样式 */
.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  margin: 0 var(--sp-2);
  margin-top: var(--sp-3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: var(--sp-4);
}

.card-header-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, rgba(139, 111, 71, 0.3), transparent);
}

.card-title {
  font-size: var(--fs-md);
  letter-spacing: 0.3em;
  text-align: center;
  white-space: nowrap;
}

.card-mystic {
  padding: var(--sp-5);
}

/* 总评卡片 */
.overall {
  padding: var(--sp-5);
}

.ov-score-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  margin: var(--sp-4) 0;
}

.ov-ring {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  padding: var(--sp-4) var(--sp-5);
  background: radial-gradient(circle, rgba(139, 111, 71, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  width: 240rpx;
  height: 240rpx;
  justify-content: center;
  align-items: center;
}

.ov-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2rpx solid rgba(139, 111, 71, 0.3);
  box-shadow: 0 0 40rpx rgba(139, 111, 71, 0.2);
}

.ov-val {
  font-size: 120rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 30rpx rgba(139, 111, 71, 0.6);
  line-height: 1;
}

.ov-unit {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
}

.ov-level {
  padding: 8rpx 32rpx;
  font-size: var(--fs-lg);
  border-radius: var(--r-full);
  color: var(--color-bai);
  font-weight: 700;
  letter-spacing: 0.2em;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
}

.ov-level.lv-大吉 {
  background: linear-gradient(135deg, #d4af37, #c8302a);
  box-shadow: 0 0 30rpx rgba(212, 175, 55, 0.5);
}

.ov-level.lv-吉 {
  background: linear-gradient(135deg, #4fae6f, #2f7d4f);
  box-shadow: 0 0 30rpx rgba(79, 174, 111, 0.5);
}

.ov-level.lv-平 {
  background: linear-gradient(135deg, #1b3a5c, #0f2440);
  box-shadow: 0 0 30rpx rgba(27, 58, 92, 0.5);
}

.ov-level.lv-凶 {
  background: linear-gradient(135deg, #c8302a, #8b1f1a);
  box-shadow: 0 0 30rpx rgba(200, 48, 42, 0.5);
}

.ov-sum {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin-top: var(--sp-3);
  font-family: 'KaiTi', serif;
  line-height: 1.8;
  letter-spacing: 0.05em;
}

/* 八宫丘相 */
.bg-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.bg-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(139, 111, 71, 0.15);
  transition: all 0.3s var(--ease-mystic);
}

.bg-row:active {
  background: rgba(10, 10, 18, 0.7);
  border-color: rgba(139, 111, 71, 0.4);
}

.bg-row.best {
  background: rgba(79, 174, 111, 0.1);
  border-left: 4rpx solid #4fae6f;
  box-shadow: 0 0 20rpx rgba(79, 174, 111, 0.2);
}

.bg-row.worst {
  background: rgba(200, 48, 42, 0.1);
  border-left: 4rpx solid #c8302a;
  box-shadow: 0 0 20rpx rgba(200, 48, 42, 0.2);
}

.bg-label {
  display: flex;
  flex-direction: column;
  width: 140rpx;
  gap: 4rpx;
}

.bg-name {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.bg-pos {
  font-size: 20rpx;
  color: var(--color-bai-3);
}

.bg-el-badge {
  display: inline-block;
  padding: 2rpx 12rpx;
  font-size: 18rpx;
  color: var(--color-bai);
  background: linear-gradient(135deg, rgba(139, 111, 71, 0.3), rgba(91, 58, 142, 0.3));
  border-radius: var(--r-full);
  border: 1rpx solid rgba(139, 111, 71, 0.4);
  letter-spacing: 0.1em;
  width: fit-content;
  margin-top: 4rpx;
}

.bg-bar-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.bg-bar {
  flex: 1;
  height: 20rpx;
  background: rgba(139, 111, 71, 0.1);
  border-radius: 10rpx;
  overflow: hidden;
  position: relative;
}

.bg-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.bg-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b6f47, #5b3a8e);
  border-radius: 10rpx;
  box-shadow: 0 0 12rpx rgba(139, 111, 71, 0.5);
  transition: width 0.8s var(--ease-power);
}

.bg-score {
  width: 70rpx;
  text-align: right;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-weight: 700;
  font-family: 'KaiTi', serif;
}

/* 三大主纹 */
.sz-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.sz-card {
  padding: var(--sp-4);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(139, 111, 71, 0.15);
  transition: all 0.3s var(--ease-mystic);
}

.sz-card:active {
  border-color: rgba(139, 111, 71, 0.4);
  background: rgba(10, 10, 18, 0.7);
}

.sz-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-2);
}

.sz-name {
  font-size: var(--fs-lg);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.sz-quality-badge {
  padding: 4rpx 16rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai);
  border-radius: var(--r-full);
  border: 1rpx solid;
  letter-spacing: 0.1em;
  font-weight: 600;
}

.sz-quality-badge.q-佳 {
  background: linear-gradient(135deg, rgba(79, 174, 111, 0.3), rgba(47, 125, 79, 0.3));
  border-color: rgba(79, 174, 111, 0.5);
  box-shadow: 0 0 12rpx rgba(79, 174, 111, 0.3);
}

.sz-quality-badge.q-中 {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(184, 148, 31, 0.3));
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 12rpx rgba(212, 175, 55, 0.3);
}

.sz-quality-badge.q-弱 {
  background: linear-gradient(135deg, rgba(200, 48, 42, 0.3), rgba(139, 31, 26, 0.3));
  border-color: rgba(200, 48, 42, 0.5);
  box-shadow: 0 0 12rpx rgba(200, 48, 42, 0.3);
}

.sz-desc {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.7;
  margin: var(--sp-2) 0;
  font-family: 'KaiTi', serif;
}

.sz-bar-wrap {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.sz-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(139, 111, 71, 0.1);
  border-radius: 8rpx;
  overflow: hidden;
  position: relative;
}

.sz-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 2s infinite;
}

.sz-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b6f47, #5b3a8e);
  border-radius: 8rpx;
  box-shadow: 0 0 12rpx rgba(139, 111, 71, 0.5);
  transition: width 0.8s var(--ease-power);
}

.sz-score {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-weight: 700;
  font-family: 'KaiTi', serif;
  min-width: 60rpx;
  text-align: right;
}
</style>
