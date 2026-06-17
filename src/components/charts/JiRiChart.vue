<!--
  渡 DU · 吉日择时可视化
  - 30 天日历热图
  - Top 10 吉日列表
  - 黄道/黑道标识
-->
<template>
  <view class="jrc">
    <view class="jrc-head card-mystic">
      <text class="jh-event">{{ result.event }}</text>
      <text class="jh-period">查询区间：{{ result.period.start }} ~ {{ result.period.end }}</text>
    </view>

    <!-- 日历热图 -->
    <view class="jrc-cal card-mystic">
      <text class="b-title title-mystic">30 天 吉 日 热 图</text>
      <view class="cal-grid">
        <view
          v-for="d in calendar"
          :key="d.day"
          class="cal-cell"
          :style="{ background: d.bg, borderColor: d.border }"
          @tap="onTapDay(d)"
        >
          <text class="cc-d">{{ d.day }}</text>
          <text class="cc-z" :style="{ color: d.zColor }">{{ d.zhiXing }}</text>
          <text class="cc-s">{{ d.score }}</text>
        </view>
      </view>
    </view>

    <!-- Top 10 吉日 -->
    <view class="jrc-top card-mystic">
      <text class="b-title title-mystic">十 大 吉 日</text>
      <view v-for="(b, i) in result.bestDays" :key="b.day.date" class="top-row">
        <text class="tr-rank" :style="{ color: i < 3 ? THEME.liu : THEME.fg2 }">{{ i + 1 }}</text>
        <view class="tr-main">
          <text class="tr-date">{{ b.day.date }}</text>
          <text class="tr-meta">
            {{ b.day.ganzhi }} · {{ b.day.zhiShen
            }}{{ b.day.zhiShenType === '黄道' ? '·黄道' : '' }}
          </text>
        </view>
        <text class="tr-score" :style="{ color: scColor(b.score) }">{{ b.score }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { THEME, levelColor as _lColor } from '@/utils/chart-utils'
import type { JiriResult } from '@/utils/jiri'
import type { HuangliDay as _HuangliDay } from '@/utils/huangli'

const props = defineProps<{ result: JiriResult }>()

function scColor(s: number): string {
  if (s >= 85) return THEME.liu
  if (s >= 70) return THEME.ji
  if (s >= 55) return THEME.fg2
  if (s >= 40) return THEME.zhu2
  return THEME.xiong
}

const calendar = computed(() => {
  // 从 bestDays 找出每一天的分数（匹配日期）
  const map = new Map<string, number>()
  props.result.bestDays.forEach((b) => map.set(b.day.date, b.score))
  // 这里我们从 jiri 内部的 data 无法直接得到（但 result.bestDays 已有 Top10）
  // 简化：直接从 result.period 起始生成 30 天
  const start = new Date(props.result.period.start || new Date().toISOString().slice(0, 10))
  const days: Array<{
    day: number
    zhiXing: string
    score: number
    bg: string
    border: string
    zColor: string
    fullDate: string
  }> = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const day = d.getDate()
    const fullDate = d.toISOString().slice(0, 10)
    const score = map.get(fullDate) || 50
    // 找当天的 zhiShen
    const item = props.result.bestDays.find((b) => b.day.date === fullDate)
    const zhiXing = item?.day.zhiShen || '平日'
    const color = scColor(score)
    days.push({
      day,
      zhiXing,
      score,
      bg: `rgba(${parseInt(color.slice(1, 3), 16)},${parseInt(color.slice(3, 5), 16)},${parseInt(color.slice(5, 7), 16)},0.2)`,
      border: color,
      zColor: color,
      fullDate,
    })
  }
  return days
})

function onTapDay(_d: { fullDate: string }) {
  // 可扩展：弹出当日详情
}
</script>

<style scoped>
.jrc {
  padding: 8rpx;
}
.jrc-head {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
  margin-bottom: 16rpx;
}
.jh-event {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
.jh-period {
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.jrc-cal,
.jrc-top {
  margin-bottom: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
}
.b-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  margin-bottom: 12rpx;
  font-family: serif;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8rpx;
}
.cal-cell {
  padding: 12rpx 4rpx;
  border-radius: 8rpx;
  text-align: center;
  border: 1rpx solid;
}
.cc-d {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  font-family: serif;
}
.cc-z {
  display: block;
  font-size: 18rpx;
  margin-top: 2rpx;
}
.cc-s {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-top: 2rpx;
}
.top-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 10rpx 0;
  border-bottom: 1rpx dashed rgba(212, 175, 55, 0.15);
}
.top-row:last-child {
  border-bottom: none;
}
.tr-rank {
  width: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  font-family: serif;
  text-align: center;
}
.tr-main {
  flex: 1;
}
.tr-date {
  display: block;
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
  font-weight: bold;
}
.tr-meta {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-top: 2rpx;
}
.tr-score {
  font-size: 32rpx;
  font-weight: bold;
  font-family: serif;
}
</style>
