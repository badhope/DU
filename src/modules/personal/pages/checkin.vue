<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="每日签到" subtitle="DAILY CHECK-IN" />

    <view class="checkin-card card-mystic anim-fade-up" :class="{ done: checkedToday }">
      <view class="ci-glyph">{{ checkedToday ? '✓' : '签' }}</view>
      <text class="ci-title">{{ checkedToday ? '今日已签' : '今日签到' }}</text>
      <text class="ci-sub">
        连续 {{ app.checkin.streak }} 天 · 累计 {{ app.checkin.totalDays }} 天
      </text>
      <view class="ci-points">{{ app.checkin.points }} <text class="ci-unit">积分</text></view>
      <view class="ci-btn" :class="{ done: checkedToday }" @click="doCheck">
        <text>{{ checkedToday ? '已 完 成' : '点 击 签 到' }}</text>
      </view>
    </view>

    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.1s">
      <text class="card-title title-mystic">本 月 签 到</text>
      <view class="cal">
        <view
          v-for="(d, i) in calendar"
          :key="i"
          class="cal-day"
          :class="{ checked: d.checked, today: d.today }"
        >
          <text class="d-num">{{ d.day }}</text>
        </view>
      </view>
    </view>

    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.15s">
      <text class="card-title title-mystic">连 签 奖 励</text>
      <view class="reward-list">
        <view
          v-for="(r, i) in rewards"
          :key="i"
          class="r-row"
          :class="{ reached: app.checkin.streak >= r.days }"
        >
          <text class="r-days">{{ r.days }}天</text>
          <text class="r-icon">{{ r.icon }}</text>
          <text class="r-desc">{{ r.desc }}</text>
          <text v-if="app.checkin.streak >= r.days" class="r-tag">已达成</text>
        </view>
      </view>
    </view>

    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.2s">
      <text class="card-title title-mystic">签 到 规 则</text>
      <text class="rule">· 每日 0 点刷新，连续签到积分递增</text>
      <text class="rule">· 连续 7 天 解锁「七日一复」</text>
      <text class="rule">· 连续 30 天 解锁「月圆玄明」</text>
      <text class="rule">· 连续 100 天 解锁「百日筑基」</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref as _ref, computed } from 'vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'

const app = useAppStore()
const checkedToday = computed(() => app.todayCheckedIn)

function doCheck() {
  if (checkedToday.value) {
    uni.showToast({ title: '今日已签到', icon: 'none' })
    return
  }
  const r = app.doCheckin()
  if (r.ok) {
    uni.showToast({ title: `+${r.pointsGained} 积分 · 连续 ${r.streak} 天`, icon: 'success' })
  } else {
    uni.showToast({ title: r.message, icon: 'none' })
  }
}

const calendar = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const lastDate = app.checkin.lastDate
  const days = new Date(year, month + 1, 0).getDate()
  const checkedSet = new Set<string>()
  // 模拟过去 30 天的签到（按 streak 推算）
  if (app.checkin.streak > 0 && lastDate) {
    const last = new Date(lastDate)
    for (let i = 0; i < Math.min(app.checkin.streak, days); i++) {
      const d = new Date(last)
      d.setDate(d.getDate() - i)
      if (d.getMonth() === month) checkedSet.add(String(d.getDate()))
    }
  }
  return Array.from({ length: days }, (_, i) => {
    const day = i + 1
    return {
      day,
      checked: checkedSet.has(String(day)),
      today: day === today,
    }
  })
})

const rewards = [
  { days: 7, icon: '七', desc: '七日一复 · 入门' },
  { days: 14, icon: '卄', desc: '半月持恒 · 进阶' },
  { days: 30, icon: '月', desc: '月圆玄明 · 圆满' },
  { days: 60, icon: '双', desc: '双月通玄 · 通慧' },
  { days: 100, icon: '百', desc: '百日筑基 · 大成' },
  { days: 365, icon: '年', desc: '周天运转 · 至高' },
]
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
.card {
  padding: var(--sp-4);
  position: relative;
  z-index: var(--z-content);
  margin: var(--sp-3) var(--sp-2);
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}
.checkin-card {
  padding: var(--sp-6) var(--sp-4);
  text-align: center;
}
.ci-glyph {
  font-size: 100rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 30rpx var(--color-liu);
  margin-bottom: var(--sp-2);
}
.checkin-card.done .ci-glyph {
  color: #4fae6f;
  text-shadow: 0 0 30rpx #4fae6f;
}
.ci-title {
  display: block;
  font-size: var(--fs-xl);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: var(--sp-1);
}
.ci-sub {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.ci-points {
  font-size: 80rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin: var(--sp-3) 0;
  text-shadow: 0 0 20rpx var(--color-liu);
  line-height: 1;
}
.ci-unit {
  font-size: var(--fs-md);
  color: var(--color-bai-2);
}
.ci-btn {
  margin: var(--sp-2) auto 0;
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, var(--color-zhu) 0%, #8b1f1a 100%);
  color: var(--color-bai);
  border-radius: var(--r-full);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  font-size: var(--fs-md);
  box-shadow: var(--sh-glow-zhu);
}
.ci-btn.done {
  background: linear-gradient(135deg, #4fae6f 0%, #1f4e4a 100%);
  box-shadow: 0 0 20rpx rgba(79, 174, 111, 0.4);
}
.cal {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4rpx;
}
.cal-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 18, 0.3);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
  border-radius: var(--r-sm);
}
.cal-day.checked {
  background: var(--color-zhu);
  border-color: var(--color-zhu);
}
.cal-day.today {
  border-color: var(--color-liu);
  border-width: 2rpx;
}
.d-num {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.cal-day.checked .d-num {
  color: var(--color-bai);
  font-weight: 700;
}
.reward-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.r-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.3);
  border-radius: var(--r-md);
}
.r-row.reached {
  background: rgba(212, 175, 55, 0.1);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}
.r-days {
  width: 100rpx;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.r-icon {
  width: 60rpx;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  text-align: center;
}
.r-desc {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.r-tag {
  font-size: 18rpx;
  padding: 2rpx 10rpx;
  background: #4fae6f;
  color: var(--color-bai);
  border-radius: var(--r-full);
  font-family: 'KaiTi', serif;
}
.rule {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  line-height: 1.8;
}
</style>
