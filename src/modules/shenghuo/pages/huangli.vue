<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="老黄历" subtitle="ALMANAC" />

    <view class="header card-mystic anim-fade-up">
      <text class="hd-sub">今 日 · {{ today.date }}</text>
      <text class="hd-gz">
        {{ today.ganzhi }} 日 · {{ today.zhiShen }}（{{ today.zhiShenType }}日）
      </text>
      <text class="hd-lunar">
        {{ today.lunarMonth }}{{ today.lunarDay }} · {{ today.shengxiao }}年
      </text>
      <view class="hd-tags">
        <text class="hd-tag" :class="'lv-' + today.fortune">{{ today.fortune }}</text>
        <text class="hd-tag">建除 · {{ today.jianchu }}</text>
        <text class="hd-tag">宿 · {{ today.xiu }}（{{ today.xiuFortune }}）</text>
        <text class="hd-tag">{{ today.chong }}</text>
      </view>
    </view>

    <view class="grid">
      <view class="col">
        <view class="yi card-mystic anim-fade-up">
          <text class="card-title title-mystic yi-t">· 宜</text>
          <view class="tag-list">
            <text v-for="(y, i) in today.yi" :key="i" class="yi-tag">{{ y }}</text>
          </view>
        </view>
        <view class="ji card-mystic anim-fade-up" style="animation-delay: 0.1s">
          <text class="card-title title-mystic ji-t">· 忌</text>
          <view class="tag-list">
            <text v-for="(j, i) in today.ji" :key="i" class="ji-tag">{{ j }}</text>
          </view>
        </view>
        <view class="peng card-mystic anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">· 彭 祖 百 忌</text>
          <text class="peng-line">{{ today.pengZu.tian }}</text>
          <text class="peng-line">{{ today.pengZu.di }}</text>
        </view>
      </view>

      <view class="col">
        <view class="zhishen card-mystic anim-fade-up">
          <text class="card-title title-mystic">· 12 值 神</text>
          <view
            v-for="(z, i) in ZHI_SHEN_EXPORT"
            :key="i"
            class="zs-row"
            :class="z.name === today.zhiShen ? 'active' : ''"
          >
            <text class="zs-name">{{ z.name }}</text>
            <text class="zs-type" :class="'type-' + z.type">{{ z.type }}</text>
            <text class="zs-desc">{{ z.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="day5 card-mystic anim-fade-up" style="animation-delay: 0.2s">
      <text class="card-title title-mystic">· 5 日 预 览</text>
      <view
        v-for="(d, i) in day5"
        :key="i"
        class="d5-row"
        :class="{ active: d.date === today.date }"
      >
        <text class="d5-date">{{ d.date.slice(5) }}</text>
        <text class="d5-gz">{{ d.ganzhi }}</text>
        <text class="d5-zs" :class="d.zhiShenType === '黄道' ? 'g' : 'b'">{{ d.zhiShen }}</text>
        <text class="d5-jc">{{ d.jianchu }}</text>
        <text class="d5-fortune" :class="'lv-' + d.fortune">{{ d.fortune }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import { getHuangliDay, getHuangli5Days, ZHI_SHEN_EXPORT, type HuangliDay } from '@modules/shenghuo/logic/huangli'

const app = useAppStore()
const today = ref<HuangliDay>(getHuangliDay(new Date()))
const day5 = ref<HuangliDay[]>(getHuangli5Days(new Date()))

onMounted(() => {
  app.addHistory({
    tool: 'huangli',
    toolName: '老黄历',
    category: '生活',
    input: { date: today.value.date },
    output: { gz: today.value.ganzhi, zhiShen: today.value.zhiShen },
    brief: `${today.value.ganzhi}日 · ${today.value.zhiShen}`,
  })
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}
.header,
.grid,
.day5 {
  margin: 0 var(--sp-2);
  margin-top: var(--sp-2);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.header {
  padding: var(--sp-4);
}
.hd-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.hd-gz {
  display: block;
  text-align: center;
  font-size: var(--fs-lg);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin: var(--sp-2) 0;
  text-shadow: 0 0 16rpx rgba(212, 175, 55, 0.5);
}
.hd-lunar {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.hd-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4rpx;
  margin-top: var(--sp-3);
}
.hd-tag {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
  background: rgba(212, 175, 55, 0.15);
  color: var(--color-liu);
}
.hd-tag.lv-吉 {
  background: #4fae6f;
  color: #fff;
}
.hd-tag.lv-平 {
  background: #d4af37;
  color: #000;
}
.hd-tag.lv-凶 {
  background: #c8302a;
  color: #fff;
}

.grid {
  display: flex;
  gap: var(--sp-2);
}
.col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
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
.yi-t {
  color: #4fae6f;
}
.ji-t {
  color: #c8302a;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
}
.yi-tag {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
  background: rgba(79, 174, 111, 0.2);
  color: #8fd0a8;
}
.ji-tag {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
  background: rgba(200, 48, 42, 0.2);
  color: #f5c5c0;
}

.peng-line {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
}

.zhishen {
  padding: var(--sp-3);
}
.zs-row {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 4rpx 0;
  font-size: var(--fs-xs);
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.05);
}
.zs-row.active {
  background: rgba(212, 175, 55, 0.15);
}
.zs-name {
  width: 60rpx;
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.zs-type {
  width: 50rpx;
  padding: 2rpx 4rpx;
  border-radius: 4rpx;
  text-align: center;
  font-size: 16rpx;
}
.zs-type.type-黄道 {
  background: #4fae6f;
  color: #fff;
}
.zs-type.type-黑道 {
  background: #c8302a;
  color: #fff;
}
.zs-desc {
  flex: 1;
  color: var(--color-bai-2);
}

.day5 {
  padding: var(--sp-3);
}
.d5-row {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 6rpx 0;
  font-size: var(--fs-xs);
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.05);
}
.d5-row.active {
  background: rgba(212, 175, 55, 0.15);
}
.d5-date {
  width: 80rpx;
  color: var(--color-bai);
  font-family: monospace;
}
.d5-gz {
  width: 60rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.d5-zs {
  width: 60rpx;
  padding: 2rpx 4rpx;
  border-radius: 4rpx;
  text-align: center;
  font-size: 18rpx;
}
.d5-zs.g {
  background: #4fae6f;
  color: #fff;
}
.d5-zs.b {
  background: #c8302a;
  color: #fff;
}
.d5-jc {
  flex: 1;
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.d5-fortune {
  width: 40rpx;
  text-align: center;
  font-size: 16rpx;
  padding: 2rpx;
  border-radius: 4rpx;
}
.d5-fortune.lv-吉 {
  background: #4fae6f;
  color: #fff;
}
.d5-fortune.lv-平 {
  background: #d4af37;
  color: #000;
}
.d5-fortune.lv-凶 {
  background: #c8302a;
  color: #fff;
}
</style>
