<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="玄枢台" subtitle="MYSTVERSE DASHBOARD" />

    <!-- 概览 -->
    <view class="overview card-mystic anim-fade-up">
      <text class="ov-greet">{{ greet }} · {{ profile?.nickname || '玄友' }}</text>
      <view class="ov-grid">
        <view class="ov-stat">
          <text class="st-num">{{ app.history.length }}</text>
          <text class="st-lbl">总记录</text>
        </view>
        <view class="ov-stat">
          <text class="st-num">{{ app.favorites.length }}</text>
          <text class="st-lbl">收藏</text>
        </view>
        <view class="ov-stat">
          <text class="st-num">{{ app.notes.length }}</text>
          <text class="st-lbl">笔记</text>
        </view>
        <view class="ov-stat">
          <text class="st-num">{{ app.unlockedAchievements.length }}</text>
          <text class="st-lbl">成就</text>
        </view>
      </view>
    </view>

    <!-- 签到入口 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.1s" @click="goCheckin">
      <view class="ck-row">
        <view class="ck-info">
          <text class="ck-label">每 日 签 到</text>
          <text class="ck-sub">
            连续 {{ app.checkin.streak }} 天 · 累计 {{ app.checkin.totalDays }} 天 ·
            {{ app.checkin.points }} 积分
          </text>
        </view>
        <view class="ck-btn" :class="{ done: app.todayCheckedIn }">
          <text>{{ app.todayCheckedIn ? '✓ 已签' : '签到' }}</text>
        </view>
      </view>
    </view>

    <!-- 最近记录 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.15s">
      <text class="card-title title-mystic">最 近 记 录</text>
      <view v-if="app.history.length === 0" class="empty">
        <text class="empty-text">尚无记录 · 开启首次占卜</text>
      </view>
      <view v-else class="h-list">
        <view
          v-for="(h, _i) in app.history.slice(0, 6)"
          :key="h.id"
          class="h-row"
          @click="goTool(h.tool)"
        >
          <text class="h-tool">{{ h.toolName }}</text>
          <text class="h-brief">{{ h.brief }}</text>
          <text class="h-time">{{ formatTime(h.time) }}</text>
        </view>
      </view>
    </view>

    <!-- 收藏 -->
    <view
      v-if="app.favorites.length > 0"
      class="card card-mystic anim-fade-up"
      style="animation-delay: 0.2s"
    >
      <text class="card-title title-mystic">收 藏</text>
      <view class="fav-list">
        <view
          v-for="(id, _i) in app.favorites.slice(0, 4)"
          :key="id"
          class="fav-row"
          @click="openFav(id)"
        >
          <text class="fav-icon">⭐</text>
          <text class="fav-text">{{ getFavBrief(id) }}</text>
        </view>
      </view>
    </view>

    <!-- 笔记 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.25s">
      <view class="nt-head">
        <text class="card-title title-mystic">笔 记 · {{ app.notes.length }} 篇</text>
        <view class="nt-add" @click="addNote">+ 新建</view>
      </view>
      <view v-if="app.notes.length === 0" class="empty">
        <text class="empty-text">尚未记录 · 点击 + 创建第一篇</text>
      </view>
      <view v-else class="n-list">
        <view
          v-for="(n, _i) in app.notes.slice(0, 4)"
          :key="n.id"
          class="n-row"
          @click="openNote(n.id)"
        >
          <text class="n-title">{{ n.title || '无题' }}</text>
          <text class="n-time">{{ formatTime(n.updateTime) }}</text>
        </view>
      </view>
    </view>

    <!-- 成就 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.3s">
      <text class="card-title title-mystic">成 就 墙</text>
      <view class="ach-list">
        <view
          v-for="(a, _i) in app.achievements"
          :key="a.id"
          class="ach-cell"
          :class="{ unlocked: a.unlocked }"
        >
          <text class="ach-glyph">{{ a.icon }}</text>
          <text class="ach-name">{{ a.name }}</text>
        </view>
      </view>
    </view>

    <!-- 快捷工具 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.35s">
      <text class="card-title title-mystic">快 速 入 口</text>
      <view class="quick-grid">
        <view
          v-for="(q, i) in quickTools"
          :key="i"
          class="q-cell card-hoverable lift"
          :style="{ background: q.bg, animationDelay: i * 0.05 + 's' }"
          @click="goToolPath(q.path)"
        >
          <text class="q-glyph">{{ q.glyph }}</text>
          <text class="q-name">{{ q.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref as _ref, computed } from 'vue'
import TopBar from '@/shared/components/ui/TopBar.vue'
import TaijiBg from '@/shared/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'

const app = useAppStore()
const profile = computed(() => app.profile)

const quickTools = [
  {
    name: '八字',
    glyph: '四',
    path: '/modules/mingli/pages/bazi',
    bg: 'linear-gradient(135deg, #5B3A8E 0%, #D4AF37 100%)',
  },
  {
    name: '紫微',
    glyph: '紫',
    path: '/modules/mingli/pages/ziwei',
    bg: 'linear-gradient(135deg, #2A0A4A 0%, #D4AF37 100%)',
  },
  {
    name: '占卜',
    glyph: '卦',
    path: '/modules/zhanbu/pages/gua',
    bg: 'linear-gradient(135deg, #C8302A 0%, #1B3A5C 100%)',
  },
  {
    name: '健康',
    glyph: '健',
    path: '/modules/jian/pages/qijing',
    bg: 'linear-gradient(135deg, #4FAE6F 0%, #1B3A5C 100%)',
  },
  {
    name: '海报',
    glyph: '报',
    path: '/modules/shenghuo/pages/poster',
    bg: 'linear-gradient(135deg, #8B1F1A 0%, #D4AF37 100%)',
  },
]

const greet = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '子夜'
  if (h < 12) return '上午'
  if (h < 14) return '正午'
  if (h < 18) return '下午'
  if (h < 22) return '入夜'
  return '子时'
})

function formatTime(t: number) {
  const d = new Date(t)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.getMonth() + 1}-${d.getDate()}`
}

function goCheckin() {
  uni.navigateTo({ url: '/modules/xiuxin/pages/checkin' })
}
function goTool(tool: string) {
  const path = toolPath(tool)
  if (path) uni.navigateTo({ url: path })
}
function goToolPath(path: string) {
  uni.navigateTo({ url: path })
}
function toolPath(tool: string): string {
  const map: Record<string, string> = {
    bazi: '/modules/mingli/pages/bazi',
    wuxing: '/modules/mingli/pages/wuxing',
    gua: '/modules/zhanbu/pages/gua',
    ziwei: '/modules/mingli/pages/ziwei',
    tarot: '/modules/zhanbu/pages/tarot',
    meihua: '/modules/zhanbu/pages/meihua',
  }
  return map[tool] || '/pages/index/index'
}
function openFav(id: string) {
  const h = app.history.find((x) => x.id === id)
  if (h) goTool(h.tool)
}
function getFavBrief(id: string) {
  const h = app.history.find((x) => x.id === id)
  return h ? h.brief : '已删除'
}
function addNote() {
  uni.showModal({
    title: '新建笔记',
    editable: true,
    placeholderText: '请输入标题',
    success: (res) => {
      if (res.confirm && res.content) {
        app.addNote({ title: res.content, content: '', tags: [] })
      }
    },
  })
}
function openNote(id: string) {
  uni.showActionSheet({
    itemList: ['查看', '删除'],
    success: (res) => {
      if (res.tapIndex === 1) app.removeNote(id)
    },
  })
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
.overview {
  padding: var(--sp-4);
}
.ov-greet {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-3);
}
.ov-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-2);
}
.ov-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-3) var(--sp-1);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
}
.st-num {
  font-size: var(--fs-2xl);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.st-lbl {
  font-size: 20rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}
.ck-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.ck-info {
  flex: 1;
}
.ck-label {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: 4rpx;
}
.ck-sub {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.ck-btn {
  padding: var(--sp-2) var(--sp-4);
  background: var(--color-zhu);
  color: var(--color-bai);
  border-radius: var(--r-full);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.ck-btn.done {
  background: var(--color-qing);
}
.empty {
  padding: var(--sp-3);
  text-align: center;
}
.empty-text {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
}
.h-list,
.fav-list,
.n-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.h-row,
.fav-row,
.n-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-sm);
}
.h-tool {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  flex-shrink: 0;
}
.h-brief {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.h-time {
  font-size: 20rpx;
  color: var(--color-bai-3);
}
.fav-icon {
  font-size: var(--fs-md);
  color: #d4af37;
}
.fav-text {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.n-title {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.n-time {
  font-size: 20rpx;
  color: var(--color-bai-3);
}
.nt-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-3);
}
.nt-add {
  padding: 4rpx 16rpx;
  background: var(--color-zhu);
  color: var(--color-bai);
  border-radius: var(--r-full);
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
}
.ach-list {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4rpx;
}
.ach-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-2) 4rpx;
  background: rgba(10, 10, 18, 0.3);
  border-radius: var(--r-sm);
  opacity: 0.35;
}
.ach-cell.unlocked {
  opacity: 1;
  background: rgba(212, 175, 55, 0.15);
}
.ach-glyph {
  font-size: var(--fs-md);
  color: var(--color-liu);
}
.ach-name {
  font-size: 16rpx;
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  margin-top: 2rpx;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-2);
}
.q-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-3) var(--sp-1);
  border-radius: var(--r-md);
}
.q-glyph {
  font-size: 56rpx;
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 12rpx rgba(0, 0, 0, 0.5);
}
.q-name {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  margin-top: 4rpx;
}
</style>
