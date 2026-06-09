<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="个人档案" subtitle="USER PROFILE" />

    <view v-if="profile" class="form card-mystic anim-fade-up">
      <view class="form-avatar">
        <text class="ava-glyph">
          {{ profile.gender === 'female' ? '♀' : profile.gender === 'male' ? '♂' : '☉' }}
        </text>
      </view>
      <text class="form-name">{{ profile.nickname }}</text>
      <text class="form-time">建档于 {{ formatDate(profile.createdAt) }}</text>
      <view class="form-info">
        <text class="fi-row">
          📅 {{ profile.birthYear }}年{{ profile.birthMonth }}月{{ profile.birthDay }}日
          {{ profile.birthHour }}:00
        </text>
        <text class="fi-row">
          📍 {{ profile.birthplace || '未填' }} · 经度 {{ profile.longitude }}°E
        </text>
        <text class="fi-row">
          👤
          {{ profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : '其他' }}
        </text>
      </view>
      <view class="menu-item" @click="goTo('users')">
        <text class="mi-glyph">👥</text>
        <view class="mi-body">
          <text class="mi-title">占 卜 人 管 理</text>
          <text class="mi-desc">多用户档案 · 一日同人同工具不可重测</text>
        </view>
        <text class="mi-arrow">›</text>
      </view>

      <view class="form-actions">
        <view class="btn-liu" @click="edit">修 改 档 案</view>
        <view class="btn-zhu" @click="clear">清 除 档 案</view>
      </view>
    </view>

    <view v-else class="form card-mystic anim-fade-up">
      <text class="form-title title-mystic">建 立 命 盘</text>
      <text class="form-sub">一 次 输 入 · 全 工 具 复 用</text>

      <view class="form-row">
        <text class="form-label">昵 称</text>
        <input v-model="form.nickname" class="form-input" placeholder="如：玄一" />
      </view>
      <view class="form-row">
        <text class="form-label">性 别</text>
        <view class="gender">
          <view
            v-for="g in genderList"
            :key="g.value"
            class="g-btn"
            :class="{ active: form.gender === g.value }"
            @click="form.gender = g.value as any"
          >
            {{ g.label }}
          </view>
        </view>
      </view>
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
      <view class="form-row">
        <text class="form-label">出生地</text>
        <input v-model="form.birthplace" class="form-input" placeholder="如：北京" />
      </view>
      <view class="form-row">
        <text class="form-label">经 度</text>
        <picker
          mode="number"
          :value="form.longitude"
          :min="73"
          :max="135"
          @change="onPick('longitude', $event)"
        >
          <view class="form-picker">{{ form.longitude }}°E</view>
        </picker>
      </view>

      <view class="form-tip">
        <text>· 填写后将自动用于八字/紫微/星盘/AI 等所有工具</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" @click="save"><text>保 存 档 案</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import type { UserProfile } from '@/stores'

const app = useAppStore()
const profile = computed(() => app.profile)
const form = ref({
  nickname: '',
  gender: 'male' as 'male' | 'female' | 'other',
  year: 1990,
  month: 6,
  day: 15,
  hour: 12,
  birthplace: '',
  longitude: 120,
})
const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
const hourRange = Array.from({ length: 24 }, (_, i) => i + ':00')
const genderList = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
]

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

function save() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fv: any = form.value
  // 校验
  if (fv.nickname && fv.nickname.length > 20) {
    uni.showToast({ title: '昵称不超过 20 字', icon: 'none' })
    return
  }
  if (fv.birthplace && fv.birthplace.length > 30) {
    uni.showToast({ title: '出生地不超过 30 字', icon: 'none' })
    return
  }
  const year = Number(fv.year),
    month = Number(fv.month),
    day = Number(fv.day),
    hour = Number(fv.hour)
  const thisYear = new Date().getFullYear()
  if (year < 1900 || year > thisYear) {
    uni.showToast({ title: `年份需 1900-${thisYear}`, icon: 'none' })
    return
  }
  if (month < 1 || month > 12) {
    uni.showToast({ title: '月份需 1-12', icon: 'none' })
    return
  }
  const dim = new Date(year, month, 0).getDate()
  if (day < 1 || day > dim) {
    uni.showToast({ title: `${month}月只有${dim}天`, icon: 'none' })
    return
  }
  if (hour < 0 || hour > 23) {
    uni.showToast({ title: '时辰需 0-23', icon: 'none' })
    return
  }
  const lon = Number(fv.longitude) || 120
  if (lon < 73 || lon > 135) {
    uni.showToast({ title: '经度需 73-135°E', icon: 'none' })
    return
  }

  const p: UserProfile = {
    nickname: (fv.nickname || '玄友').trim() || '玄友',
    gender: fv.gender || 'other',
    birthYear: year,
    birthMonth: month,
    birthDay: day,
    birthHour: hour,
    birthplace: (fv.birthplace || '').trim(),
    longitude: lon,
    createdAt: Date.now(),
  }
  try {
    app.setProfile(p)
    uni.showToast({ title: '档案已保存', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  }
}

function goTo(key: string) {
  const map: Record<string, string> = {
    users: '/pages/users/users',
    history: '/pages/history/history',
    dashboard: '/pages/dashboard/dashboard',
  }
  if (map[key]) uni.navigateTo({ url: map[key] })
}

function edit() {
  if (profile.value) {
    form.value = {
      nickname: profile.value.nickname,
      gender: profile.value.gender,
      year: profile.value.birthYear,
      month: profile.value.birthMonth,
      day: profile.value.birthDay,
      hour: profile.value.birthHour,
      birthplace: profile.value.birthplace,
      longitude: profile.value.longitude,
    }
    app.clearProfile()
  }
}

function clear() {
  uni.showModal({
    title: '确认',
    content: '确定清除档案？',
    success: (res) => {
      if (res.confirm) {
        app.clearProfile()
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    },
  })
}

function formatDate(t: number) {
  return new Date(t).toLocaleDateString('zh-CN')
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
  width: 100rpx;
  text-align: left;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  flex-shrink: 0;
}
.form-picker {
  flex: 1;
  text-align: left;
  font-size: var(--fs-md);
  color: var(--color-bai);
  padding: var(--sp-1) 0;
}
.form-input {
  flex: 1;
  text-align: left;
  font-size: var(--fs-md);
  color: var(--color-bai);
  padding: var(--sp-1) 0;
  background: transparent;
}
.gender {
  flex: 1;
  display: flex;
  gap: var(--sp-2);
}
.g-btn {
  flex: 1;
  text-align: center;
  padding: var(--sp-2);
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.g-btn.active {
  background: var(--color-zhu);
  color: var(--color-bai);
  border-color: var(--color-zhu);
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
  gap: var(--sp-2);
  flex-wrap: wrap;
}
.form-avatar {
  width: 160rpx;
  height: 160rpx;
  margin: var(--sp-2) auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-zhu) 0%, #8b1f1a 100%);
  border-radius: 50%;
  box-shadow: 0 0 30rpx rgba(200, 48, 42, 0.5);
}
.ava-glyph {
  font-size: 80rpx;
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.form-name {
  display: block;
  font-size: var(--fs-2xl);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin: var(--sp-2) 0;
}
.form-time {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  margin-bottom: var(--sp-3);
}
.form-info {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  text-align: left;
  margin-bottom: var(--sp-3);
}
.fi-row {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 280rpx;
  text-align: center;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
  margin-bottom: var(--sp-2);
  cursor: pointer;
}
.mi-glyph {
  font-size: 36rpx;
}
.mi-body {
  flex: 1;
  min-width: 0;
}
.mi-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.1em;
}
.mi-desc {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-top: 2rpx;
}
.mi-arrow {
  font-size: 32rpx;
  color: var(--color-bai-2);
}
</style>
