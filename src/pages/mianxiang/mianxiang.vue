<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <StarField :count="60" density="mid" colors="mixed" :shooting="true" />
    <TopBar title="面相分析" subtitle="FACE READING" />

    <view v-if="!result" class="setup card-mystic anim-fade-up">
      <!-- 装饰光效 -->
      <view class="form-glow" />
      
      <!-- 标题区 -->
      <view class="form-header">
        <view class="form-seal">
          <view class="form-seal-ring" />
          <text class="form-seal-char">相</text>
        </view>
        <text class="form-title title-mystic">三 停 五 官</text>
        <view class="form-divider">
          <view class="form-divider-line" />
          <text class="form-divider-dot">·</text>
          <view class="form-divider-line" />
        </view>
        <text class="form-sub">生 辰 输 入 · 推 算 面 相 之 运</text>
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
          <picker mode="number" :value="form.day" :min="1" :max="31" @change="onPick('day', $event)">
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
        <text>· 三停分格 · 五官相辅 · 12 宫位详批</text>
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
          <text class="card-title title-mystic">面 相 总 评</text>
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

      <!-- 三停之运 -->
      <view class="stanting card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <view class="card-header">
          <view class="card-header-line" />
          <text class="card-title title-mystic">三 停 之 运</text>
          <view class="card-header-line" />
        </view>
        <view class="st-list">
          <view v-for="(s, i) in result.sanTing" :key="i" class="st-row">
            <view class="st-label">
              <text class="st-name">{{ s.name }}</text>
              <text class="st-age">{{ s.age }}</text>
            </view>
            <view class="st-bar-wrap">
              <view class="st-bar"><view class="st-fill" :style="{ width: s.score + '%' }" /></view>
            </view>
            <text class="st-score">{{ s.score }}</text>
          </view>
        </view>
        <view class="st-descs">
          <view v-for="(s, i) in result.sanTing" :key="'d' + i" class="st-desc-item">
            <view class="st-desc-dot" />
            <text class="st-desc-text">{{ s.name }}（{{ s.age }}）：{{ s.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 五官之相 -->
      <view class="wuguan card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <view class="card-header">
          <view class="card-header-line" />
          <text class="card-title title-mystic">五 官 之 相</text>
          <view class="card-header-line" />
        </view>
        <view class="wg-list">
          <view v-for="(g, i) in result.wuGuan" :key="i" class="wg-card">
            <view class="wg-card-header">
              <text class="wg-name">{{ g.name }}</text>
              <view class="wg-wuxing-badge">{{ g.wuxing }}</view>
            </view>
            <text class="wg-desc">{{ g.desc }}</text>
            <view class="wg-bar-wrap">
              <view class="wg-bar"><view class="wg-fill" :style="{ width: g.fortune + '%' }" /></view>
              <text class="wg-score">{{ g.fortune }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 十二宫位 -->
      <view class="shier card-mystic anim-fade-up" style="animation-delay: 0.2s">
        <view class="card-header">
          <view class="card-header-line" />
          <text class="card-title title-mystic">十 二 宫 位</text>
          <view class="card-header-line" />
        </view>
        <view class="shier-grid">
          <view v-for="(g, i) in result.shiErGongDetail" :key="i" class="sh-cell">
            <view class="sh-cell-header">
              <text class="sh-name">{{ g.name }}</text>
              <text class="sh-pos">{{ g.pos }}</text>
            </view>
            <text class="sh-desc">{{ g.detail }}</text>
          </view>
        </view>
      </view>

      <!-- 综合建议 -->
      <view class="advice card-mystic anim-fade-up" style="animation-delay: 0.25s">
        <view class="card-header">
          <view class="card-header-line" />
          <text class="card-title title-mystic">综 合 建 议</text>
          <view class="card-header-line" />
        </view>
        <view class="ad-list">
          <view v-for="(a, i) in result.advice" :key="i" class="ad-item">
            <view class="ad-item-dot" />
            <text class="ad-text">{{ a }}</text>
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
import { useAppStore } from '@/stores'
import { calcMianxiang, type MianxiangResult } from '@/utils/mianxiang'

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    } catch (_e) {
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

/* 装饰光效 */
.form-glow {
  position: absolute;
  top: -100rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 400rpx;
  height: 400rpx;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
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
  border: 2rpx solid rgba(212, 175, 55, 0.4);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(200, 48, 42, 0.1));
  box-shadow: 0 0 30rpx rgba(212, 175, 55, 0.3);
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
  text-shadow: 0 0 20rpx rgba(212, 175, 55, 0.6);
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
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent);
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
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.15);
  transition: all 0.3s var(--ease-mystic);
}

.form-row:active {
  background: rgba(212, 175, 55, 0.05);
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
  text-shadow: 0 0 12rpx rgba(212, 175, 55, 0.5);
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
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  transition: all 0.3s var(--ease-mystic);
}

.form-picker:active {
  border-color: rgba(212, 175, 55, 0.5);
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
  background: linear-gradient(135deg, #d4af37, #8b1f1a);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-full);
  letter-spacing: 0.2em;
  min-width: 360rpx;
  text-align: center;
  box-shadow: 0 0 30rpx rgba(212, 175, 55, 0.4);
  transition: all 0.3s var(--ease-mystic);
}

.btn-zhu:active {
  transform: scale(0.96);
  box-shadow: 0 0 40rpx rgba(212, 175, 55, 0.6);
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
  border: 1rpx solid rgba(212, 175, 55, 0.4);
  font-size: var(--fs-md);
  border-radius: var(--r-full);
  letter-spacing: 0.2em;
  min-width: 360rpx;
  text-align: center;
  transition: all 0.3s var(--ease-mystic);
}

.btn-liu:active {
  background: rgba(212, 175, 55, 0.1);
  border-color: rgba(212, 175, 55, 0.6);
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
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
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
  background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
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
  border: 2rpx solid rgba(212, 175, 55, 0.3);
  box-shadow: 0 0 40rpx rgba(212, 175, 55, 0.2);
}

.ov-val {
  font-size: 120rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 30rpx rgba(212, 175, 55, 0.6);
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

/* 三停之运 */
.st-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-bottom: var(--sp-4);
}

.st-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.st-label {
  display: flex;
  flex-direction: column;
  width: 120rpx;
  gap: 4rpx;
}

.st-name {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.st-age {
  font-size: 20rpx;
  color: var(--color-bai-3);
}

.st-bar-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.st-bar {
  flex: 1;
  height: 20rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 10rpx;
  overflow: hidden;
  position: relative;
}

.st-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.st-fill {
  height: 100%;
  background: linear-gradient(90deg, #d4af37, #c8302a);
  border-radius: 10rpx;
  box-shadow: 0 0 12rpx rgba(212, 175, 55, 0.5);
  transition: width 0.8s var(--ease-power);
}

.st-score {
  width: 70rpx;
  text-align: right;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-weight: 700;
  font-family: 'KaiTi', serif;
}

.st-descs {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border-left: 3rpx solid rgba(212, 175, 55, 0.3);
}

.st-desc-item {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
}

.st-desc-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: var(--color-liu);
  margin-top: 12rpx;
  flex-shrink: 0;
  box-shadow: 0 0 8rpx rgba(212, 175, 55, 0.6);
}

.st-desc-text {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
}

/* 五官之相 */
.wg-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.wg-card {
  padding: var(--sp-4);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  transition: all 0.3s var(--ease-mystic);
}

.wg-card:active {
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(10, 10, 18, 0.7);
}

.wg-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-2);
}

.wg-name {
  font-size: var(--fs-lg);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.wg-wuxing-badge {
  padding: 4rpx 16rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.3), rgba(200, 48, 42, 0.3));
  border-radius: var(--r-full);
  border: 1rpx solid rgba(212, 175, 55, 0.4);
  letter-spacing: 0.1em;
}

.wg-desc {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.7;
  margin: var(--sp-2) 0;
  font-family: 'KaiTi', serif;
}

.wg-bar-wrap {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.wg-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 8rpx;
  overflow: hidden;
  position: relative;
}

.wg-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 2s infinite;
}

.wg-fill {
  height: 100%;
  background: linear-gradient(90deg, #d4af37, #c8302a);
  border-radius: 8rpx;
  box-shadow: 0 0 12rpx rgba(212, 175, 55, 0.5);
  transition: width 0.8s var(--ease-power);
}

.wg-score {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-weight: 700;
  font-family: 'KaiTi', serif;
  min-width: 60rpx;
  text-align: right;
}

/* 十二宫位 */
.shier-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}

.sh-cell {
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  transition: all 0.3s var(--ease-mystic);
}

.sh-cell:active {
  border-color: rgba(212, 175, 55, 0.4);
  background: rgba(10, 10, 18, 0.7);
}

.sh-cell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-2);
  padding-bottom: var(--sp-2);
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
}

.sh-name {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.sh-pos {
  font-size: var(--fs-xs);
  color: var(--color-liu);
  opacity: 0.8;
}

.sh-desc {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  line-height: 1.6;
  font-family: 'KaiTi', serif;
}

/* 综合建议 */
.ad-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.ad-item {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border-left: 3rpx solid rgba(212, 175, 55, 0.4);
  transition: all 0.3s var(--ease-mystic);
}

.ad-item:active {
  background: rgba(10, 10, 18, 0.6);
  border-left-color: rgba(212, 175, 55, 0.6);
}

.ad-item-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: var(--color-liu);
  margin-top: 12rpx;
  flex-shrink: 0;
  box-shadow: 0 0 10rpx rgba(212, 175, 55, 0.6);
}

.ad-text {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
  letter-spacing: 0.05em;
}
</style>
