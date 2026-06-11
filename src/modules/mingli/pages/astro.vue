<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="西洋占星" subtitle="WESTERN ASTROLOGY" />

    <view v-if="!result" class="form card-mystic anim-fade-up">
      <text class="form-title title-mystic">星 盘 推 算</text>
      <text class="form-sub">十 二 宫 · 十 大 行 星 · 主 导 元 素</text>

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
        <text>· 太阳星座 / 月亮星座 / 上升星座 · 10 大行星位置 · 五维评分</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '推算中…' : '开 始 推 算' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <!-- 占星可视化（核心） -->
      <view class="card card-mystic anim-fade-up">
        <text class="card-title title-mystic">西 洋 占 星 · 星 盘 可 视 化</text>
        <AstroChart :result="result" />
      </view>

      <!-- Big Three -->
      <view class="big3 card-mystic anim-fade-up" style="animation-delay: 0.05s">
        <text class="card-title title-mystic">太 阳 · 月 亮 · 上 升</text>
        <view class="b3-grid">
          <view
            v-for="(b, i) in result.bigThree"
            :key="i"
            class="b3-cell"
            :style="{ borderColor: b.meta.color }"
          >
            <text class="b3-label">{{ b.label }}</text>
            <text
              class="b3-glyph"
              :style="{ color: b.meta.color, textShadow: `0 0 20rpx ${b.meta.color}` }"
            >
              {{ b.meta.glyph }}
            </text>
            <text class="b3-name" :style="{ color: b.meta.color }">{{ b.sign }}</text>
            <text class="b3-elem">{{ b.meta.element }} · {{ b.meta.quality }}</text>
            <text class="b3-ruler">守护 · {{ b.meta.ruler }}</text>
          </view>
        </view>
      </view>

      <!-- 主导元素 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="card-title title-mystic">元 素 与 性 质</text>
        <view class="elem-list">
          <view v-for="(c, k) in result.elementCounts" :key="k" class="elem-row">
            <text class="er-name">{{ k }}</text>
            <view class="er-bar">
              <view
                class="er-fill"
                :style="{
                  width: c * 18 + '%',
                  background:
                    k === '火'
                      ? '#C8302A'
                      : k === '土'
                        ? '#A87C4F'
                        : k === '风'
                          ? '#D4AF37'
                          : '#1B3A5C',
                }"
              />
            </view>
            <text class="er-num">{{ c }}</text>
          </view>
        </view>
        <text class="dominant">
          主导元素：{{ result.dominantElement }} · 主导性质：{{ result.dominantQuality }}
        </text>
      </view>

      <!-- 10 行星 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">十 大 行 星</text>
        <view class="pl-list">
          <view v-for="(p, i) in result.planets" :key="i" class="pl-row">
            <text class="pl-name">{{ p.name }}</text>
            <text class="pl-glyph" :style="{ color: ZODIAC_META[p.sign].color }">
              {{ ZODIAC_META[p.sign].glyph }}
            </text>
            <text class="pl-sign" :style="{ color: ZODIAC_META[p.sign].color }">{{ p.sign }}</text>
            <text v-if="p.retrograde" class="pl-rx">逆行</text>
            <text class="pl-mean">{{ p.meaning }}</text>
          </view>
        </view>
      </view>

      <!-- 五维评分 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.2s">
        <text class="card-title title-mystic">五 维 评 分</text>
        <view v-for="(s, i) in scoreList" :key="i" class="s-row">
          <text class="s-name">{{ s.name }}</text>
          <view class="s-bar">
            <view class="s-fill" :style="{ width: s.val + '%', background: s.color }" />
          </view>
          <text class="s-val" :style="{ color: s.color }">{{ s.val }}</text>
        </view>
      </view>

      <!-- 5 年流年 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.25s">
        <text class="card-title title-mystic">五 年 流 年 推 演</text>
        <view class="yf-list">
          <view
            v-for="(y, i) in result.yearlyForecast"
            :key="i"
            class="yf-row"
            :class="'lv-' + y.level"
          >
            <text class="yf-year">{{ y.year }}</text>
            <text class="yf-lv">{{ y.level }}</text>
            <text class="yf-hi">{{ y.highlight }}</text>
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
import { ref, computed } from 'vue'
import TopBar from '@/shared/components/ui/TopBar.vue'
import TaijiBg from '@/shared/components/effects/TaijiBg.vue'
import AstroChart from '@/modules/mingli/components/charts/AstroChart.vue'
import { useAppStore } from '@/stores'
import { calcAstro, ZODIAC_META, type AstroResult } from '@/modules/mingli/logic/astro'

const app = useAppStore()
const form = ref({ year: 1990, month: 6, day: 15, hour: 12 })
const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
const hourRange = Array.from({ length: 24 }, (_, i) => i + ':00')
const result = ref<AstroResult | null>(null)
const loading = ref(false)

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

function calculate() {
  loading.value = true
  setTimeout(() => {
    result.value = calcAstro(form.value.year, form.value.month, form.value.day, form.value.hour)
    loading.value = false
    app.addHistory({
      tool: 'astro',
      toolName: '西洋占星',
      category: '命理',
      input: { ...form.value },
      output: { sun: result.value.sun, moon: result.value.moon, rising: result.value.rising },
      brief: `太阳 ${result.value.sun} · 上升 ${result.value.rising}`,
    })
  }, 600)
}

const scoreList = computed(() =>
  result.value
    ? [
        { name: '事业', val: result.value.scores.career, color: '#D4AF37' },
        { name: '财运', val: result.value.scores.wealth, color: '#C8302A' },
        { name: '婚姻', val: result.value.scores.relationship, color: '#5B3A8E' },
        { name: '健康', val: result.value.scores.health, color: '#4FAE6F' },
        { name: '人际', val: result.value.scores.social, color: '#1B3A5C' },
      ]
    : [],
)
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
.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}
.b3-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-2);
}
.b3-cell {
  padding: var(--sp-3) var(--sp-1);
  background: rgba(10, 10, 18, 0.5);
  border: 2rpx solid;
  border-radius: var(--r-md);
  text-align: center;
}
.b3-label {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}
.b3-glyph {
  display: block;
  font-size: 80rpx;
  line-height: 1;
  margin: 4rpx 0;
  font-family: 'KaiTi', serif;
}
.b3-name {
  display: block;
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.b3-elem {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-2);
}
.b3-ruler {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-3);
  margin-top: 2rpx;
}
.elem-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.elem-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.er-name {
  width: 60rpx;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.er-bar {
  flex: 1;
  height: 18rpx;
  background: rgba(10, 10, 18, 0.6);
  border-radius: var(--r-full);
  overflow: hidden;
}
.er-fill {
  height: 100%;
  transition: width 0.8s var(--ease-bounce);
}
.er-num {
  width: 40rpx;
  text-align: right;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.dominant {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  margin-top: var(--sp-3);
}
.pl-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.pl-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-1) var(--sp-2);
  background: rgba(10, 10, 18, 0.3);
  border-radius: var(--r-sm);
}
.pl-name {
  width: 80rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.pl-glyph {
  width: 50rpx;
  font-size: var(--fs-lg);
  text-align: center;
  font-family: 'KaiTi', serif;
}
.pl-sign {
  width: 80rpx;
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
}
.pl-rx {
  font-size: 18rpx;
  padding: 0 6rpx;
  border-radius: 4rpx;
  background: var(--color-zhu);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.pl-mean {
  flex: 1;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
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
.yf-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.yf-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-1) var(--sp-2);
  background: rgba(10, 10, 18, 0.3);
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
}
.yf-row.lv-大吉,
.yf-row.lv-吉 {
  border-color: rgba(79, 174, 111, 0.4);
}
.yf-row.lv-凶,
.yf-row.lv-大凶 {
  border-color: rgba(200, 48, 42, 0.4);
}
.yf-year {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}
.yf-lv {
  width: 80rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  text-align: center;
}
.yf-hi {
  flex: 1;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
</style>
