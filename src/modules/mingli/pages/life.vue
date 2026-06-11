<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="生命灵数" subtitle="LIFE PATH NUMBER" />

    <view v-if="!result" class="form card-mystic anim-fade-up">
      <text class="form-title title-mystic">生 日 输 入</text>
      <text class="form-sub">1-9 主 命 · 11/22/33 大 师 数 · 五 维 评 分</text>

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
        <text>· 生命数 = 年 + 月 + 日（保留 11/22/33 大师数）· 表现数 · 灵魂数 · 命运数</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '推算中…' : '开 始 推 算' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <!-- 4 大数字 -->
      <view class="grid-4 card-mystic anim-fade-up">
        <view class="g-cell" :style="{ borderColor: result.primary.color }">
          <text class="g-label">生 命 数</text>
          <text class="g-num" :style="{ color: result.primary.color }">
            {{ result.number.lifePath }}
          </text>
          <text class="g-name">{{ result.primary.name }}</text>
        </view>
        <view class="g-cell" :style="{ borderColor: result.expressionMeta.color }">
          <text class="g-label">表 现 数</text>
          <text class="g-num" :style="{ color: result.expressionMeta.color }">
            {{ result.number.expression }}
          </text>
          <text class="g-name">{{ result.expressionMeta.name }}</text>
        </view>
        <view class="g-cell" :style="{ borderColor: result.soulMeta.color }">
          <text class="g-label">灵 魂 数</text>
          <text class="g-num" :style="{ color: result.soulMeta.color }">
            {{ result.number.soulUrge }}
          </text>
          <text class="g-name">{{ result.soulMeta.name }}</text>
        </view>
        <view class="g-cell" :style="{ borderColor: result.destinyMeta.color }">
          <text class="g-label">命 运 数</text>
          <text class="g-num" :style="{ color: result.destinyMeta.color }">
            {{ result.number.destiny }}
          </text>
          <text class="g-name">{{ result.destinyMeta.name }}</text>
        </view>
      </view>

      <!-- 主导数详批 -->
      <view
        class="primary card-mystic card anim-fade-up"
        style="animation-delay: 0.1s"
        :style="{ borderColor: result.primary.color }"
      >
        <text
          class="pr-glyph"
          :style="{ color: result.primary.color, textShadow: `0 0 20rpx ${result.primary.color}` }"
        >
          {{ result.primary.glyph }}
        </text>
        <text class="pr-name" :style="{ color: result.primary.color }">
          {{ result.primary.num }} · {{ result.primary.name }}
        </text>
        <text class="pr-element">
          五行 · {{ result.primary.element }} · 守护 · {{ result.primary.planet }}
        </text>
        <text class="pr-desc">{{ result.primary.description }}</text>
        <view class="pr-tags">
          <text class="pr-tag virtue">德 · {{ result.primary.virtue }}</text>
          <text class="pr-tag flaw">缺 · {{ result.primary.flaw }}</text>
        </view>
      </view>

      <!-- 4 维建议 -->
      <view class="advice card-mystic card anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">四 维 建 议</text>
        <view class="ad-row">
          <text class="ad-k">事业</text><text class="ad-v">{{ result.advice.career }}</text>
        </view>
        <view class="ad-row">
          <text class="ad-k">爱情</text><text class="ad-v">{{ result.advice.love }}</text>
        </view>
        <view class="ad-row">
          <text class="ad-k">健康</text><text class="ad-v">{{ result.advice.health }}</text>
        </view>
        <view class="ad-row">
          <text class="ad-k">财富</text><text class="ad-v">{{ result.advice.wealth }}</text>
        </view>
      </view>

      <!-- 五维评分 -->
      <view class="scores card-mystic card anim-fade-up" style="animation-delay: 0.2s">
        <text class="card-title title-mystic">五 维 评 分</text>
        <view v-for="(s, i) in scoreList" :key="i" class="s-row">
          <text class="s-name">{{ s.name }}</text>
          <view class="s-bar">
            <view class="s-fill" :style="{ width: s.val + '%', background: s.color }" />
          </view>
          <text class="s-val" :style="{ color: s.color }">{{ s.val }}</text>
        </view>
      </view>

      <!-- 9 年周期 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.25s">
        <text class="card-title title-mystic">九 年 周 期</text>
        <view class="cyc-list">
          <view v-for="(c, i) in result.cycle" :key="i" class="cyc-row" :class="cycCls(c.cycle)">
            <text class="cy-year">{{ c.year }}</text>
            <text class="cy-phase">{{ c.cycle }}</text>
          </view>
        </view>
      </view>

      <view class="form-actions">
        <view class="btn-liu" @click="result = null">重 新 推 算</view>
      </view>
    </view>
    <!-- 占卜推演 Loading -->
    <LoadingSeal
      :visible="loading"
      :title="'玄 机 推 演 中'"
      :steps="['清 心 · 凝 神', '观 象 · 感 应', '起 卦 · 演 数', '排 盘 · 归 藏', '解 卦 · 断 事']"
      :duration="800"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import _LifeNumberChart from '@shared/components/charts/LifeNumberChart.vue'
import LoadingSeal from '@shared/components/ui/LoadingSeal.vue'
import { useAppStore } from '@/stores'
import { fullLifeResult, type LifeNumberResult } from '@modules/mingli/logic/life'

const app = useAppStore()
const form = ref({ year: 1990, month: 6, day: 15 })
const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
const result = ref<LifeNumberResult | null>(null)
const loading = ref(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPick(k: string, e: any) {
  const v = e.detail.value
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (k === 'month') (form.value as any).month = Number(v) + 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else (form.value as any)[k] = Number(v)
}

function calculate() {
  const y = form.value.year,
    m = form.value.month,
    d = form.value.day
  if (y < 1900 || y > new Date().getFullYear()) {
    uni.showToast({ title: `年份需 1900-${new Date().getFullYear()}`, icon: 'none' })
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
      result.value = fullLifeResult(y, m, d)
      loading.value = false
      app.addHistory({
        tool: 'life',
        toolName: '生命灵数',
        category: '命理',
        input: { ...form.value },
        output: { lifePath: result.value.number.lifePath, name: result.value.primary.name },
        brief: `生命数 ${result.value.number.lifePath} · ${result.value.primary.name}`,
      })
    } catch (_e) {
      loading.value = false
      uni.showModal({ title: '推算失败', content: '请检查日期输入', showCancel: false })
    }
  }, 600)
}

const scoreList = computed(() =>
  result.value
    ? [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { name: '事业', val: (result.value as any).scores?.career ?? 60, color: '#D4AF37' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { name: '财运', val: (result.value as any).scores?.wealth ?? 60, color: '#C8302A' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { name: '婚姻', val: (result.value as any).scores?.relationship ?? 60, color: '#5B3A8E' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { name: '健康', val: (result.value as any).scores?.health ?? 60, color: '#4FAE6F' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { name: '人际', val: (result.value as any).scores?.social ?? 60, color: '#1B3A5C' },
      ]
    : [],
)

function cycCls(p: string) {
  return p === '播种'
    ? 'cyc-sow'
    : p === '生长'
      ? 'cyc-grow'
      : p === '收获'
        ? 'cyc-harv'
        : 'cyc-end'
}
</script>

<style scoped>
.page {
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
.form {
  position: relative;
  z-index: var(--z-content);
  margin: var(--sp-3) var(--sp-2);
  padding: var(--sp-4);
  text-align: center;
}
.form-title {
  font-size: var(--fs-2xl);
  display: block;
  margin-bottom: var(--sp-2);
}
.form-sub {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  letter-spacing: 0.1em;
  margin-bottom: var(--sp-4);
}
.form-row {
  display: flex;
  align-items: center;
  padding: var(--sp-2) var(--sp-3);
  margin-bottom: var(--sp-1);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
}
.form-label {
  width: 80rpx;
  text-align: left;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
}
.form-picker {
  flex: 1;
  text-align: left;
  font-size: var(--fs-md);
  color: var(--color-bai);
  padding: var(--sp-1) 0;
}
.form-tip {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-top: var(--sp-2);
  line-height: 1.6;
}
.form-actions {
  margin-top: var(--sp-4);
  display: flex;
  justify-content: center;
}
.result {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0 var(--sp-2);
}
.card {
  padding: var(--sp-4);
}
.grid-4 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-2);
  padding: var(--sp-3);
}
.g-cell {
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border: 2rpx solid;
  border-radius: var(--r-md);
  text-align: center;
}
.g-label {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}
.g-num {
  display: block;
  font-size: 80rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  line-height: 1;
  margin: 4rpx 0;
  text-shadow: 0 0 20rpx currentColor;
}
.g-name {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.primary {
  text-align: center;
  border: 2rpx solid;
}
.pr-glyph {
  display: block;
  font-size: 100rpx;
  line-height: 1;
  margin: var(--sp-2) 0;
}
.pr-name {
  display: block;
  font-size: var(--fs-xl);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: var(--sp-1);
}
.pr-element {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-bottom: var(--sp-2);
}
.pr-desc {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
  margin-bottom: var(--sp-3);
  padding: 0 var(--sp-3);
}
.pr-tags {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: 0 var(--sp-3);
}
.pr-tag {
  display: block;
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
  padding: var(--sp-1) var(--sp-2);
  border-radius: var(--r-sm);
}
.pr-tag.virtue {
  color: #4fae6f;
  background: rgba(79, 174, 111, 0.1);
}
.pr-tag.flaw {
  color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.1);
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}
.ad-row {
  display: flex;
  gap: var(--sp-2);
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  margin-bottom: 6rpx;
}
.ad-k {
  width: 80rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  flex-shrink: 0;
}
.ad-v {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.6;
}
.s-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: 6rpx;
}
.s-name {
  width: 70rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.s-bar {
  flex: 1;
  height: 18rpx;
  background: rgba(10, 10, 18, 0.6);
  border-radius: var(--r-full);
  overflow: hidden;
}
.s-fill {
  height: 100%;
  transition: width 0.8s var(--ease-bounce);
  box-shadow: 0 0 6rpx currentColor;
}
.s-val {
  width: 50rpx;
  text-align: right;
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.cyc-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6rpx;
}
.cyc-row {
  padding: var(--sp-2);
  border-radius: var(--r-sm);
  text-align: center;
}
.cyc-sow {
  background: rgba(212, 175, 55, 0.1);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}
.cyc-grow {
  background: rgba(47, 125, 79, 0.1);
  border: 1rpx solid rgba(47, 125, 79, 0.3);
}
.cyc-harv {
  background: rgba(200, 48, 42, 0.1);
  border: 1rpx solid rgba(200, 48, 42, 0.3);
}
.cyc-end {
  background: rgba(91, 58, 142, 0.1);
  border: 1rpx solid rgba(91, 58, 142, 0.3);
}
.cy-year {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.cy-phase {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
</style>
