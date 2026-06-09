<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="吉日择时" subtitle="AUSPICIOUS DAY" />

    <view v-if="!result" class="setup card-mystic anim-fade-up">
      <text class="form-title title-mystic">择 事 求 吉</text>
      <text class="form-sub">事 选 · 良 辰 自 现</text>

      <view class="event-grid">
        <view
          v-for="e in EVENTS"
          :key="e.key"
          class="ev-cell"
          :class="form.event === e.key ? 'active' : ''"
          @click="form.event = e.key"
        >
          <text class="ev-glyph">{{ e.glyph }}</text>
          <text class="ev-name">{{ e.name }}</text>
          <text class="ev-desc">{{ e.desc }}</text>
        </view>
      </view>

      <view class="form-tip">
        <text>· 选定事件，未来 30 日内最佳良辰 · 黄道优先 · 宜事匹配</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '择日中…' : '开 始 择 日' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <!-- 吉日日历热图 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.04s">
        <JiRiChart :result="result" />
      </view>

      <view class="header card-mystic anim-fade-up">
        <text class="hd-event">{{ result.event }} · 未来 30 日</text>
        <text class="hd-sub">· 已选最佳良辰 {{ result.bestDays.length }} 日 ·</text>
        <text class="hd-period">{{ result.period.start }} 至 {{ result.period.end }}</text>
      </view>

      <view
        v-for="(d, i) in result.bestDays"
        :key="i"
        class="day card-mystic anim-fade-up"
        :style="{ animationDelay: i * 0.05 + 's' }"
      >
        <view class="day-top">
          <view class="day-rank">
            <text class="rk-num">#{{ i + 1 }}</text>
            <text class="rk-score">{{ d.score }}</text>
          </view>
          <view class="day-info">
            <text class="day-date">{{ d.day.date }}</text>
            <text class="day-gz">{{ d.day.ganzhi }} 日 · {{ d.day.shengxiao }}年</text>
          </view>
          <view class="day-fortune" :class="'lv-' + d.day.fortune">
            <text>{{ d.day.fortune }}</text>
          </view>
        </view>
        <view class="day-tags">
          <text class="day-tag" :class="d.day.zhiShenType === '黄道' ? 'g' : 'b'">
            {{ d.day.zhiShen }}（{{ d.day.zhiShenType }}）
          </text>
          <text class="day-tag">建除 · {{ d.day.jianchu }}</text>
          <text class="day-tag">宿 · {{ d.day.xiu }}（{{ d.day.xiuFortune }}）</text>
          <text class="day-tag">{{ d.day.chong }}</text>
        </view>
        <view class="day-yi-ji">
          <view class="yj-block yi">
            <text class="yj-t">宜</text>
            <text v-for="(y, j) in d.day.yi" :key="j" class="yj-tag yi">{{ y }}</text>
          </view>
          <view class="yj-block ji">
            <text class="yj-t">忌</text>
            <text v-for="(j, k) in d.day.ji" :key="k" class="yj-tag ji">{{ j }}</text>
          </view>
        </view>
        <text v-if="d.reason" class="day-reason">· {{ d.reason }}</text>
      </view>

      <view class="form-actions">
        <view class="btn-liu" @click="result = null">重 新 择 事</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import JiRiChart from '@/components/charts/JiRiChart.vue'
import { useAppStore } from '@/stores'
import { findJiri, JIRI_EVENTS, type JiriResult } from '@/utils/jiri'

const app = useAppStore()
const EVENTS = JIRI_EVENTS
const form = reactive({ event: 'jiaqin' })
const result = ref<JiriResult | null>(null)
const loading = ref(false)
async function calculate() {
  if (!form.event) {
    uni.showToast({ title: '请选择事项', icon: 'none' })
    return
  }
  loading.value = true
  await new Promise((r) => setTimeout(r, 600))
  try {
    result.value = findJiri(form.event, 30)
    app.addHistory({
      tool: 'jiri',
      toolName: '吉日择时',
      category: '生活',
      input: { event: form.event },
      output: { bestCount: result.value.bestDays.length, top1: result.value.bestDays[0]?.day.date },
      brief: `${result.value.event} · 最佳 ${result.value.bestDays[0]?.day.date} (${result.value.bestDays[0]?.score}分)`,
    })
  } catch (_e) {
    uni.showModal({ title: '择日失败', content: '请重试', showCancel: false })
  } finally {
    loading.value = false
  }
}
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

.event-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--sp-2);
}
.ev-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-3) var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-sm);
}
.ev-cell.active {
  border-color: var(--color-liu);
  background: rgba(212, 175, 55, 0.1);
}
.ev-glyph {
  font-size: 56rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
}
.ev-name {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin-top: 4rpx;
}
.ev-desc {
  font-size: 18rpx;
  color: var(--color-bai-3);
  margin-top: 2rpx;
}

.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #d4af37, #4fae6f);
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
.header {
  padding: var(--sp-4);
  text-align: center;
}
.hd-event {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.hd-sub {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin-top: var(--sp-2);
}
.hd-period {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-top: 4rpx;
  font-family: monospace;
}

.day {
  padding: var(--sp-3);
}
.day-top {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.day-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90rpx;
}
.rk-num {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  font-family: monospace;
}
.rk-score {
  font-size: 40rpx;
  color: var(--color-liu);
  font-weight: 700;
  font-family: 'KaiTi', serif;
}
.day-info {
  flex: 1;
}
.day-date {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: monospace;
}
.day-gz {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}
.day-fortune {
  padding: 4rpx 12rpx;
  border-radius: var(--r-sm);
  font-size: var(--fs-xs);
}
.day-fortune.lv-吉 {
  background: #4fae6f;
  color: #fff;
}
.day-fortune.lv-平 {
  background: #d4af37;
  color: #000;
}
.day-fortune.lv-凶 {
  background: #c8302a;
  color: #fff;
}

.day-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  margin-top: var(--sp-2);
}
.day-tag {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
  background: rgba(212, 175, 55, 0.15);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}
.day-tag.g {
  background: #4fae6f;
  color: #fff;
}
.day-tag.b {
  background: #c8302a;
  color: #fff;
}

.day-yi-ji {
  margin-top: var(--sp-2);
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.yj-block {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4rpx;
}
.yj-t {
  width: 36rpx;
  font-size: var(--fs-xs);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.yi .yj-t {
  color: #4fae6f;
}
.ji .yj-t {
  color: #c8302a;
}
.yj-tag {
  padding: 2rpx 10rpx;
  font-size: 20rpx;
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

.day-reason {
  display: block;
  margin-top: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
}
</style>
