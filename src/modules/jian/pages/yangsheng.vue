<template>
  <view class="yangsheng-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="节气养生" subtitle="24 SOLAR TERMS" />

    <!-- 模式 -->
    <view class="tab-bar anim-fade-up">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="tab-btn"
        :class="{ active: tab === t.key }"
        @click="tab = t.key as Mode"
      >
        <text class="tab-name">{{ t.name }}</text>
        <text class="tab-sub">{{ t.sub }}</text>
      </view>
    </view>

    <!-- 当前节气 -->
    <view v-if="tab === 'now'" class="result anim-fade-up">
      <view class="now-jieqi card-mystic">
        <text class="jq-sub">· {{ nowJieqi.season }} · 当令 ·</text>
        <text class="jq-name">{{ nowJieqi.name }}</text>
        <text class="jq-en">{{ nowJieqi.en }} · {{ nowJieqi.pinyin }}</text>
        <text class="jq-shengxiao">生肖 · {{ nowJieqi.shengxiao }}</text>
        <text class="jq-nat">{{ nowJieqi.nature }}</text>
        <view class="jq-row">
          <text class="jq-row-label">· 养生重点：</text>
          <text class="jq-row-val">{{ nowJieqi.health }}</text>
        </view>
        <view class="jq-row">
          <text class="jq-row-label">· 五行：</text>
          <text class="jq-row-val" :style="{ color: WX_META[nowJieqi.wuxing].color }">
            {{ WX_META[nowJieqi.wuxing].name }}
          </text>
        </view>
        <view class="jq-foods">
          <text class="jq-foods-label">· 宜食</text>
          <view class="jq-foods-tags">
            <text v-for="(d, i) in nowJieqi.diet" :key="i" class="food-tag good">{{ d }}</text>
          </view>
        </view>
        <view class="jq-foods">
          <text class="jq-foods-label bad">· 忌食</text>
          <view class="jq-foods-tags">
            <text v-for="(d, i) in nowJieqi.taboo" :key="i" class="food-tag bad">{{ d }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 24 节气 -->
    <view v-else-if="tab === 'jq'" class="result anim-fade-up">
      <view class="jq-list">
        <view
          v-for="(j, i) in JIEQI_24"
          :key="i"
          class="jq-row-card"
          :class="{ active: i === currentIdx, open: openJq === i }"
          :style="{ borderColor: WX_META[j.wuxing].color }"
          @click="openJq = openJq === i ? -1 : i"
        >
          <view class="jq-row-head">
            <view class="jq-row-mark" :style="{ background: WX_META[j.wuxing].color }">
              <text class="jq-mark-text">{{ j.name }}</text>
            </view>
            <view class="jq-row-info">
              <text class="jq-row-name">{{ j.name }}（{{ j.solarTerm }}）</text>
              <text class="jq-row-date">
                {{ j.month }}月{{ j.day }}日 · {{ j.season }} · {{ WX_META[j.wuxing].name }}
              </text>
            </view>
            <text class="jq-row-sx">{{ j.shengxiao }}</text>
          </view>
          <view v-if="openJq === i" class="jq-row-body anim-fade">
            <text class="jq-row-nat">· {{ j.nature }}</text>
            <text class="jq-row-h">· 养生：{{ j.health }}</text>
            <view class="jq-row-foods">
              <text class="jq-row-flabel">宜：</text>
              <text v-for="(d, k) in j.diet" :key="k" class="jq-row-ftag good">{{ d }}</text>
            </view>
            <view class="jq-row-foods">
              <text class="jq-row-flabel bad">忌：</text>
              <text v-for="(d, k) in j.taboo" :key="k" class="jq-row-ftag bad">{{ d }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 五运六气 -->
    <view v-else class="result anim-fade-up">
      <view class="wuyun card-mystic">
        <text class="wy-title">{{ wuyunInfo.year }} 年（{{ wuyunInfo.tianGan }}年）</text>
        <view class="wy-grid">
          <view class="wy-cell">
            <text class="wy-label">中 运</text>
            <text class="wy-val" :style="{ color: WX_META[wuyunInfo.zhongYun].color }">
              {{ WX_META[wuyunInfo.zhongYun].name }}
            </text>
          </view>
          <view class="wy-cell">
            <text class="wy-label">主 运</text>
            <text class="wy-val" :style="{ color: WX_META[wuyunInfo.dayun].color }">
              {{ WX_META[wuyunInfo.dayun].name }}
            </text>
          </view>
          <view class="wy-cell">
            <text class="wy-label">客 运</text>
            <text class="wy-val" :style="{ color: WX_META[wuyunInfo.keYun].color }">
              {{ WX_META[wuyunInfo.keYun].name }}
            </text>
          </view>
          <view class="wy-cell">
            <text class="wy-label">司 天</text>
            <text class="wy-val" :style="{ color: WX_META[wuyunInfo.sitian].color }">
              {{ WX_META[wuyunInfo.sitian].name }}
            </text>
          </view>
          <view class="wy-cell">
            <text class="wy-label">在 泉</text>
            <text class="wy-val" :style="{ color: WX_META[wuyunInfo.zaiquan].color }">
              {{ WX_META[wuyunInfo.zaiquan].name }}
            </text>
          </view>
        </view>
        <text class="wy-prin">{{ wuyunInfo.principle }}</text>
      </view>

      <view class="wy-jianqi card-mystic">
        <text class="wy-title">· 六气客主加临</text>
        <view v-for="(jq, i) in wuyunInfo.jianqi" :key="i" class="jq-item">
          <text class="jq-num">第{{ i + 1 }}气</text>
          <text class="jq-text">{{ jq }}</text>
        </view>
      </view>

      <view class="wy-main card-mystic">
        <text class="wy-title">· 当年主运</text>
        <view v-for="(m, i) in mainDayuns()" :key="i" class="m-item">
          <view class="m-mark" :style="{ background: WX_META[m.wx].color }">
            <text class="m-mark-t">{{ m.step }}</text>
          </view>
          <view class="m-info">
            <text class="m-name" :style="{ color: WX_META[m.wx].color }">
              {{ WX_META[m.wx].name }}运
            </text>
            <text class="m-prin">{{ m.principle }}</text>
            <text class="m-days">{{ m.days }} · 主病：{{ m.health }}</text>
          </view>
        </view>
      </view>

      <view class="wy-card card-mystic">
        <text class="wy-title">· 健 康 与 用 药</text>
        <view class="wy-info">
          <text class="wy-line">· 健康要点：{{ wuyunInfo.health }}</text>
          <text class="wy-line">· 易见疾病：{{ wuyunInfo.disease }}</text>
          <text class="wy-line">· 治疗原则：{{ wuyunInfo.treatment }}</text>
          <text class="wy-line">· 用药要点：{{ wuyunInfo.yongyao }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopBar from '@/shared/components/ui/TopBar.vue'
import TaijiBg from '@/shared/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import { JIEQI_24, currentJieqi, wuyun, mainDayuns } from '@/modules/jian/logic/jieqi'
import { WUXING_META } from '@/modules/mingli/logic/wuxing'

const app = useAppStore()
const WX_META = WUXING_META

type Mode = 'now' | 'jq' | 'wuyun'
const tab = ref<Mode>('now')
const openJq = ref(-1)

const tabs = [
  { key: 'now', name: '当前', sub: 'NOW' },
  { key: 'jq', name: '24 节气', sub: '24 TERMS' },
  { key: 'wuyun', name: '五运六气', sub: '5-6 QI' },
]

const nowJieqi = computed(() => currentJieqi())
const wuyunInfo = computed(() => wuyun(new Date().getFullYear()))
const currentIdx = computed(() => JIEQI_24.findIndex((j) => j.name === nowJieqi.value.name))
</script>

<style scoped>
.yangsheng-page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}
.tab-bar {
  display: flex;
  gap: var(--sp-2);
  margin: var(--sp-2) var(--sp-2) 0;
  padding: 4rpx;
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}
.tab-btn {
  flex: 1;
  text-align: center;
  padding: var(--sp-2) 0;
  border-radius: var(--r-sm);
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.tab-btn.active {
  background: linear-gradient(135deg, #4fae6f, #8b6f47);
  color: var(--color-bai);
}
.tab-name {
  font-size: var(--fs-sm);
  font-weight: 600;
}
.tab-sub {
  font-size: 18rpx;
  color: var(--color-bai-3);
}
.tab-btn.active .tab-sub {
  color: var(--color-bai);
  opacity: 0.8;
}

.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: 0 var(--sp-2);
  margin-top: var(--sp-2);
}
.card-mystic {
  padding: var(--sp-4);
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
  text-align: center;
}

/* 当前 */
.now-jieqi {
  padding: var(--sp-5) var(--sp-4);
}
.jq-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
}
.jq-name {
  display: block;
  text-align: center;
  font-size: 96rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
  text-shadow: 0 0 30rpx rgba(212, 175, 55, 0.5);
  margin: var(--sp-2) 0;
}
.jq-en {
  display: block;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}
.jq-shengxiao {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin: var(--sp-1) 0;
}
.jq-nat {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
  margin: var(--sp-3) 0;
}
.jq-row {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  padding: 4rpx 0;
  font-size: var(--fs-sm);
}
.jq-row-label {
  color: var(--color-bai-3);
}
.jq-row-val {
  color: var(--color-bai);
}
.jq-foods {
  margin: var(--sp-2) 0;
}
.jq-foods-label {
  display: inline-block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-right: 4rpx;
}
.jq-foods-label.bad {
  color: #c8302a;
}
.jq-foods-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  margin-top: 4rpx;
}
.food-tag {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
}
.food-tag.good {
  background: rgba(79, 174, 111, 0.2);
  color: #8fd0a8;
}
.food-tag.bad {
  background: rgba(200, 48, 42, 0.2);
  color: #f5c5c0;
}

/* 24 节气 */
.jq-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.jq-row-card {
  background: rgba(10, 10, 18, 0.6);
  border-radius: var(--r-md);
  border: 1rpx solid;
  border-left-width: 8rpx;
  overflow: hidden;
  cursor: pointer;
}
.jq-row-card.open {
  box-shadow: 0 0 16rpx rgba(212, 175, 55, 0.3);
}
.jq-row-card.active {
  background: rgba(212, 175, 55, 0.1);
}
.jq-row-head {
  display: flex;
  align-items: center;
  padding: var(--sp-3) var(--sp-4);
  gap: var(--sp-2);
}
.jq-row-mark {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.jq-mark-text {
  font-size: var(--fs-sm);
  text-shadow: 0 0 6rpx rgba(0, 0, 0, 0.4);
}
.jq-row-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.jq-row-name {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.jq-row-date {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.jq-row-sx {
  font-size: 28rpx;
}
.jq-row-body {
  padding: 0 var(--sp-4) var(--sp-3);
  border-top: 1rpx solid rgba(212, 175, 55, 0.1);
}
.jq-row-nat {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin: var(--sp-2) 0;
  font-family: 'KaiTi', serif;
}
.jq-row-h {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin: 4rpx 0;
}
.jq-row-foods {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  align-items: center;
  margin: 4rpx 0;
}
.jq-row-flabel {
  font-size: var(--fs-xs);
  color: var(--color-liu);
}
.jq-row-flabel.bad {
  color: #c8302a;
}
.jq-row-ftag {
  padding: 2rpx 8rpx;
  font-size: 20rpx;
  border-radius: 4rpx;
}
.jq-row-ftag.good {
  background: rgba(79, 174, 111, 0.15);
  color: #8fd0a8;
}
.jq-row-ftag.bad {
  background: rgba(200, 48, 42, 0.15);
  color: #f5c5c0;
}

/* 五运六气 */
.wy-title {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-liu);
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}
.wuyun {
  padding: var(--sp-4);
}
.wy-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}
.wy-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-sm);
}
.wy-label {
  font-size: 20rpx;
  color: var(--color-bai-3);
}
.wy-val {
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.wy-prin {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
  text-align: center;
}

.wy-jianqi {
  padding: var(--sp-4);
}
.jq-item {
  display: flex;
  padding: var(--sp-2) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
  font-size: var(--fs-sm);
}
.jq-num {
  width: 100rpx;
  color: var(--color-liu);
}
.jq-text {
  flex: 1;
  color: var(--color-bai);
}

.wy-main {
  padding: var(--sp-4);
}
.m-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
}
.m-item:last-child {
  border-bottom: 0;
}
.m-mark {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.m-mark-t {
  font-size: var(--fs-sm);
  text-shadow: 0 0 6rpx rgba(0, 0, 0, 0.4);
}
.m-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.m-name {
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.m-prin {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.m-days {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}

.wy-card {
  padding: var(--sp-4);
}
.wy-info {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.wy-line {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
}
</style>
