<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="玛雅历" subtitle="MAYA TZOLKIN" />

    <view v-if="!result" class="form card-mystic anim-fade-up">
      <text class="form-title title-mystic">玛 雅 卓 尔 金 历</text>
      <text class="form-sub">260 天 · 20 图 腾 · 13 调 性 · 13 天 波 符</text>

      <view class="form-row">
        <text class="form-label">年</text>
        <picker
          mode="number"
          :value="form.year"
          :min="1900"
          :max="2100"
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
        <text>· Kin 1-260 · 13 调性 × 20 太阳图腾 · 5 维评分 · 13 天波符</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '推算中…' : '开 始 推 算' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <view class="kin-card card-mystic anim-fade-up" :style="{ borderColor: result.sealColor }">
        <text class="kin-num">Kin {{ result.kin }}</text>
        <text class="kin-tone" :style="{ color: result.toneColor }"
          >
{{ result.tone }} · {{ result.toneName }}
</text
        >
        <text
          class="kin-glyph"
          :style="{ color: result.sealColor, textShadow: `0 0 20rpx ${result.sealColor}` }"
          >
{{ result.sealGlyph }}
</text
        >
        <text class="kin-seal" :style="{ color: result.sealColor }">{{ result.sealName }}</text>
        <text class="kin-meaning">{{ result.sealMeaning }} · {{ result.toneMeaning }}</text>
        <view class="kin-stats">
          <text class="ks-row"
            >
<text class="ks-k">力量</text><text class="ks-v">{{ result.sealPower }}</text>
</text
          >
          <text class="ks-row"
            >
<text class="ks-k">行动</text><text class="ks-v">{{ result.sealAction }}</text>
</text
          >
          <text class="ks-row"
            >
<text class="ks-k">本质</text><text class="ks-v">{{ result.sealEssence }}</text>
</text
          >
        </view>
      </view>

      <!-- 玛雅卓尔金轮可视化 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.05s">
        <MayaChart :result="result" />
      </view>

      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="card-title title-mystic">神 谕</text>
        <text class="oracle">{{ result.oracle }}</text>
      </view>

      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">五 维 评 分</text>
        <view v-for="(s, i) in scoreList" :key="i" class="s-row">
          <text class="s-name">{{ s.name }}</text>
          <view class="s-bar"
            >
<view class="s-fill" :style="{ width: s.val + '%', background: s.color }"
          />
</view>
          <text class="s-val" :style="{ color: s.color }">{{ s.val }}</text>
        </view>
      </view>

      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.2s">
        <text class="card-title title-mystic">13 天 波 符</text>
        <view class="wave-grid">
          <view
            v-for="(s, i) in result.wavespell"
            :key="i"
            class="wave-cell"
            :class="{ active: i + 1 === result.tone }"
          >
            <text class="wv-num">{{ i + 1 }}</text>
            <text
              class="wv-glyph"
              :style="{ color: MAYA_SEAL_META[s as keyof typeof MAYA_SEAL_META]?.color }"
              >
{{ MAYA_SEAL_META[s as keyof typeof MAYA_SEAL_META]?.glyph }}
</text
            >
            <text class="wv-name">{{ s }}</text>
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
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import MayaChart from '@/components/charts/MayaChart.vue'
import { useAppStore } from '@/stores'
import { calcMaya, MAYA_SEAL_META, type MayaTzolkin } from '@/utils/maya'

const app = useAppStore()
const form = ref({ year: 1990, month: 6, day: 15 })
const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
const result = ref<MayaTzolkin | null>(null)
const loading = ref(false)

function onPick(k: string, e: any) {
  const v = e.detail.value
  if (k === 'month') (form.value as any).month = Number(v) + 1
  else (form.value as any)[k] = Number(v)
}

function calculate() {
  loading.value = true
  setTimeout(() => {
    result.value = calcMaya(form.value.year, form.value.month, form.value.day)
    loading.value = false
    app.addHistory({
      tool: 'maya',
      toolName: '玛雅历',
      category: '命理',
      input: { ...form.value },
      output: { kin: result.value.kin, seal: result.value.seal, tone: result.value.tone },
      brief: `Kin ${result.value.kin} · ${result.value.tone} ${result.value.toneName} · ${result.value.seal}`,
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
.kin-card {
  text-align: center;
  border: 2rpx solid;
}
.kin-num {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
  margin-top: var(--sp-2);
}
.kin-tone {
  display: block;
  font-size: var(--fs-xl);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: var(--sp-2);
}
.kin-glyph {
  display: block;
  font-size: 120rpx;
  line-height: 1;
  margin: var(--sp-2) 0;
}
.kin-seal {
  display: block;
  font-size: var(--fs-2xl);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: var(--sp-2);
}
.kin-meaning {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-style: italic;
  line-height: 1.7;
  margin-bottom: var(--sp-3);
  padding: 0 var(--sp-2);
}
.kin-stats {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: 0 var(--sp-2);
}
.ks-row {
  display: flex;
  padding: var(--sp-1) var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-sm);
}
.ks-k {
  width: 80rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-align: left;
}
.ks-v {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}
.oracle {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.8;
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border-left: 4rpx solid var(--color-zhu);
  text-align: left;
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
.wave-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4rpx;
}
.wave-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-1);
  background: rgba(10, 10, 18, 0.3);
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
}
.wave-cell.active {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--color-liu);
}
.wv-num {
  font-size: 16rpx;
  color: var(--color-bai-3);
}
.wv-glyph {
  font-size: 28rpx;
  line-height: 1;
}
.wv-name {
  font-size: 16rpx;
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
</style>
