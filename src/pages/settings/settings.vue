<template>
  <view class="settings-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="设置" subtitle="SETTINGS & HISTORY" :show-settings="false" />

    <!-- 顶栏概览 -->
    <view class="hero card-mystic anim-fade-up">
      <view class="hero-icon">⚙</view>
      <text class="hero-title title-mystic">渡</text>
      <text class="hero-sub">DU · {{ ver }}</text>
    </view>

    <!-- 字号 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.05s">
      <text class="card-title">字 体 大 小</text>
      <view class="seg">
        <view
          v-for="opt in FONT_OPTS"
          :key="opt.key"
          class="seg-item"
          :class="{ active: app.settings.fontSize === opt.key }"
          @click="app.setFontSize(opt.key)"
        >
          <text>{{ opt.label }}</text>
        </view>
      </view>
    </view>

    <!-- 字体类型 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.07s">
      <text class="card-title">字 体 类 型</text>
      <view class="seg seg-4">
        <view
          v-for="opt in FONT_FAM_OPTS"
          :key="opt.key"
          class="seg-item"
          :class="{ active: app.settings.font === opt.key }"
          @click="app.setFont(opt.key)"
        >
          <text>{{ opt.label }}</text>
        </view>
      </view>
    </view>

    <!-- 主题 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.08s">
      <text class="card-title">主 题 色 调</text>
      <view class="seg seg-3">
        <view
          v-for="opt in THEME_OPTS"
          :key="opt.key"
          class="seg-item"
          :class="{ active: app.settings.theme === opt.key }"
          @click="app.setTheme(opt.key)"
        >
          <view class="seg-dot" :style="{ background: opt.color }" />
          <text>{{ opt.label }}</text>
        </view>
      </view>
    </view>

    <!-- 模式 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.09s">
      <text class="card-title">明 暗 模 式</text>
      <view class="seg seg-2">
        <view
          v-for="opt in MODE_OPTS"
          :key="opt.key"
          class="seg-item"
          :class="{ active: app.settings.mode === opt.key }"
          @click="app.setMode(opt.key)"
        >
          <text>{{ opt.label }}</text>
        </view>
      </view>
    </view>

    <!-- 偏好开关 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.1s">
      <text class="card-title">偏 好 设 置</text>
      <view class="row">
        <text class="row-label">减 少 动 效</text>
        <switch
          :checked="app.settings.reducedMotion"
          color="#D4AF37"
          @change="onSwitch('reducedMotion', $event)"
        />
      </view>
      <view class="row">
        <text class="row-label">声 音 反 馈</text>
        <switch
          :checked="app.settings.soundEnabled"
          color="#D4AF37"
          @change="onSwitch('soundEnabled', $event)"
        />
      </view>
      <view class="row">
        <text class="row-label">触 觉 震 动</text>
        <switch
          :checked="app.settings.hapticsEnabled"
          color="#D4AF37"
          @change="onSwitch('hapticsEnabled', $event)"
        />
      </view>
      <view class="row">
        <text class="row-label">首 启 提 示</text>
        <switch
          :checked="app.settings.showGuide"
          color="#D4AF37"
          @change="onSwitch('showGuide', $event)"
        />
      </view>
    </view>

    <!-- 测试记录 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.15s">
      <view class="card-head">
        <text class="card-title">测 试 记 录</text>
        <text v-if="app.history.length" class="card-action" @click="confirmClear">清 空</text>
      </view>
      <text class="card-tip"
        >最近 {{ app.history.length }} / {{ maxHistory }} 条 · 各工具独立存储</text
      >

      <view v-if="!app.history.length" class="empty">
        <text class="empty-glyph">空</text>
        <text class="empty-text">尚无测试记录</text>
      </view>

      <view v-else class="hist-list">
        <view
          v-for="(h, i) in app.history"
          :key="h.id"
          class="hist-item"
          :style="{ animationDelay: i * 0.04 + 's' }"
          @click="openItem(h)"
        >
          <view class="hist-badge" :style="{ background: CATEGORY_COLOR[h.category] || '#5B3A8E' }">
            <text>{{ h.toolName.slice(0, 1) }}</text>
          </view>
          <view class="hist-body">
            <view class="hist-row1">
              <text class="hist-tool">{{ h.toolName }}</text>
              <text class="hist-time">{{ fmtTime(h.time) }}</text>
            </view>
            <text class="hist-brief">{{ h.brief }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.2s">
      <text class="card-title">数 据 管 理</text>
      <view class="action-row">
        <view class="action-btn" @click="onExport">
          <text>导 出 数 据</text>
        </view>
        <view class="action-btn" @click="onImport">
          <text>导 入 数 据</text>
        </view>
      </view>
      <view class="action-row" style="margin-top: 12rpx">
        <view class="action-btn warn" @click="onClearHistory">
          <text>清 除 历 史</text>
        </view>
        <view class="action-btn danger" @click="onResetAll">
          <text>重 置 全 部</text>
        </view>
      </view>
    </view>

    <!-- 关于 -->
    <view class="card card-mystic anim-fade-up" style="animation-delay: 0.25s">
      <text class="card-title">关 于</text>
      <view class="about-row">
        <text class="about-key">名 称</text>
        <text class="about-val">渡 DU · 渡己渡人</text>
      </view>
      <view class="about-row">
        <text class="about-key">版 本</text>
        <text class="about-val">{{ ver }}</text>
      </view>
      <view class="about-row">
        <text class="about-key">类 别</text>
        <text class="about-val">风水玄学工具</text>
      </view>
      <view class="about-row">
        <text class="about-key">术 数</text>
        <text class="about-val">五行 · 八字 · 卦象 · 六壬 · 奇门</text>
      </view>
      <view class="about-row">
        <text class="about-key">平 台</text>
        <text class="about-val">跨端 (Web / 小程序 / App)</text>
      </view>
      <text class="about-note">「易有太极，是生两仪；两仪生四象，四象生八卦。」 — 易 · 系辞</text>
    </view>

    <view class="footer-space" />
  </view>
</template>

<script setup lang="ts">
import { ref as _ref } from 'vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import TopBar from '@/components/ui/TopBar.vue'
import { useAppStore, MAX_HISTORY } from '@/stores'

const app = useAppStore()
const ver = __APP_VERSION__
const maxHistory = MAX_HISTORY

const FONT_OPTS = [
  { key: 'sm' as const, label: '小' },
  { key: 'md' as const, label: '中' },
  { key: 'lg' as const, label: '大' },
]

const FONT_FAM_OPTS = [
  { key: 'kaiti' as const, label: '楷体' },
  { key: 'songti' as const, label: '宋体' },
  { key: 'zhuanshu' as const, label: '篆书' },
  { key: 'heiti' as const, label: '黑体' },
]

const THEME_OPTS = [
  { key: 'xuanhuang' as const, label: '玄黄', color: '#D4AF37' },
  { key: 'xuanzi' as const, label: '玄紫', color: '#B49ED8' },
  { key: 'xuanqing' as const, label: '玄青', color: '#4DB6AC' },
]

const MODE_OPTS = [
  { key: 'dark' as const, label: '☾ 暗' },
  { key: 'light' as const, label: '☀ 亮' },
]

const CATEGORY_COLOR: Record<string, string> = {
  命理: '#C8302A',
  占卜: '#5B3A8E',
  古物: '#D4AF37',
  健康: '#4FAE6F',
  修心: '#1B3A5C',
  生活: '#8B6F47',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onSwitch(key: 'reducedMotion' | 'soundEnabled' | 'hapticsEnabled' | 'showGuide', e: any) {
  const v = e.detail.value
  if (key === 'reducedMotion') app.setReducedMotion(v)
  if (key === 'soundEnabled') app.setSoundEnabled(v)
  if (key === 'hapticsEnabled') app.setHapticsEnabled(v)
  if (key === 'showGuide') app.setShowGuide(v)
}

function fmtTime(t: number): string {
  const d = new Date(t)
  const now = new Date()
  const diff = (now.getTime() - t) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + ' 分前'
  if (diff < 86400) return Math.floor(diff / 3600) + ' 时前'
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function openItem(h: any) {
  uni.showModal({
    title: h.toolName + ' · 详情',
    content: h.brief,
    showCancel: false,
    confirmText: '关闭',
  })
}

function confirmClear() {
  uni.showModal({
    title: '清空记录',
    content: '此操作不可恢复，是否继续？',
    success: (res) => {
      if (res.confirm) {
        app.clearHistory()
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    },
  })
}

function onClearHistory() {
  uni.showModal({
    title: '清除历史',
    content: '将清空全部测试记录（不影响档案/笔记/签到），是否继续？',
    success: (res) => {
      if (res.confirm) {
        app.clearHistory()
        uni.showToast({ title: '已清除', icon: 'success' })
      }
    },
  })
}

function onExport() {
  try {
    const data = app.exportData()
    const json = JSON.stringify(data, null, 2)
    const stamp = new Date().toISOString().slice(0, 10)
    // H5 环境下载文件；其他环境复制到剪贴板
    // #ifdef H5
    try {
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `du-backup-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      uni.showToast({ title: '已导出', icon: 'success' })
      return
    } catch (_e) {}
    // #endif
    uni.setClipboardData({
      data: json,
      success: () =>
        uni.showModal({
          title: '已复制到剪贴板',
          content: '数据已复制，请粘贴到文本文件保存。',
          showCancel: false,
        }),
    })
  } catch (_e) {
    uni.showToast({ title: '导出失败', icon: 'none' })
  }
}

function onImport() {
  uni.showModal({
    title: '导入数据',
    content: '将从剪贴板读取备份数据并覆盖现有数据，是否继续？',
    success: (res) => {
      if (!res.confirm) return
      uni.getClipboardData({
        success: (c) => {
          try {
            const data = JSON.parse(c.data)
            const r = app.importData(data)
            uni.showToast({ title: r.message, icon: r.ok ? 'success' : 'none' })
          } catch (_e) {
            uni.showToast({ title: '剪贴板内容非有效 JSON', icon: 'none' })
          }
        },
        fail: () => uni.showToast({ title: '读取剪贴板失败', icon: 'none' }),
      })
    },
  })
}

function onResetAll() {
  uni.showModal({
    title: '重置全部',
    content: '将清空所有数据并恢复默认设置，是否继续？',
    success: (res) => {
      if (res.confirm) {
        app.resetAll()
        uni.showToast({ title: '已重置', icon: 'success' })
      }
    },
  })
}
</script>

<style scoped>
.settings-page {
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

.hero {
  margin: var(--sp-3) var(--sp-2);
  padding: var(--sp-5) var(--sp-4);
  text-align: center;
}

.hero-icon {
  font-size: 80rpx;
  color: var(--color-liu);
  text-shadow: 0 0 24rpx rgba(212, 175, 55, 0.6);
}

.hero-title {
  display: block;
  font-size: var(--fs-3xl);
  margin-top: var(--sp-2);
}

.hero-sub {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.3em;
  margin-top: var(--sp-1);
}

.card {
  position: relative;
  z-index: var(--z-content);
  margin: 0 var(--sp-2) var(--sp-3);
  padding: var(--sp-4);
}

.card-title {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-3);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sp-2);
}

.card-head .card-title {
  margin-bottom: 0;
}

.card-action {
  font-size: var(--fs-sm);
  color: var(--color-zhu);
  padding: 6rpx 16rpx;
  border: 1rpx solid var(--color-zhu);
  border-radius: var(--r-full);
}

.card-tip {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-bottom: var(--sp-3);
  letter-spacing: 0.1em;
}

/* ===== 字号 Seg ===== */
.seg {
  display: flex;
  gap: var(--sp-2);
}

.seg-item {
  flex: 1;
  padding: var(--sp-2) var(--sp-3);
  text-align: center;
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  font-size: var(--fs-md);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  transition: all 0.2s var(--ease-mystic);
}

.seg-item.active {
  background: linear-gradient(135deg, var(--color-liu) 0%, #8b6914 100%);
  color: var(--color-bai);
  border-color: var(--color-liu);
  box-shadow: 0 0 16rpx rgba(212, 175, 55, 0.4);
}

/* 主题色点 */
.seg-dot {
  display: inline-block;
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  margin-right: var(--sp-1);
  vertical-align: middle;
  box-shadow: 0 0 12rpx currentColor;
  transition: transform 0.2s var(--ease-mystic);
}
.seg-item.active .seg-dot {
  transform: scale(1.3);
}

/* ===== 偏好行 ===== */
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sp-2) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
}

.row:last-child {
  border-bottom: none;
}

.row-label {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.1em;
}

/* ===== 历史 ===== */
.hist-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.hist-item {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
  transition: all 0.2s ease;
}

.hist-item:active {
  background: rgba(212, 175, 55, 0.1);
  transform: scale(0.98);
}

.hist-badge {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-weight: 700;
  box-shadow: 0 0 12rpx currentColor;
  flex-shrink: 0;
}

.hist-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.hist-row1 {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hist-tool {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.hist-time {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}

.hist-brief {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.5;
  font-family: 'KaiTi', serif;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-6) var(--sp-2);
}

.empty-glyph {
  font-size: 80rpx;
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
  opacity: 0.4;
}

.empty-text {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  margin-top: var(--sp-2);
  letter-spacing: 0.2em;
}

/* ===== 行动按钮 ===== */
.action-row {
  display: flex;
  gap: var(--sp-2);
}

.action-btn {
  flex: 1;
  padding: var(--sp-3);
  text-align: center;
  background: rgba(212, 175, 55, 0.1);
  border: 1rpx solid var(--color-liu);
  border-radius: var(--r-md);
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.1em;
  transition: all 0.2s ease;
}

.action-btn:active {
  background: rgba(212, 175, 55, 0.2);
  transform: scale(0.97);
}

.action-btn.danger {
  border-color: var(--color-zhu);
  color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.1);
}

.action-btn.danger:active {
  background: rgba(200, 48, 42, 0.2);
}

.action-btn.warn {
  border-color: #d4af37;
  color: #d4af37;
  background: rgba(212, 175, 55, 0.08);
}

.action-btn.warn:active {
  background: rgba(212, 175, 55, 0.18);
}

/* ===== 关于 ===== */
.about-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sp-2) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
}

.about-row:last-of-type {
  border-bottom: none;
}

.about-key {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}

.about-val {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}

.about-note {
  display: block;
  margin-top: var(--sp-3);
  padding: var(--sp-3);
  font-size: var(--fs-sm);
  color: var(--color-liu);
  text-align: center;
  font-family: 'KaiTi', serif;
  font-style: italic;
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  letter-spacing: 0.1em;
  line-height: 1.7;
}

.footer-space {
  height: 60rpx;
}

/* ===== 字号影响 ===== */
.fs-sm .row-label,
.fs-sm .hist-brief,
.fs-sm .seg-item {
  font-size: 26rpx;
}
.fs-sm .card-title {
  font-size: 28rpx;
}
.fs-lg .row-label,
.fs-lg .hist-brief,
.fs-lg .seg-item {
  font-size: 34rpx;
}
.fs-lg .card-title {
  font-size: 36rpx;
}
</style>
