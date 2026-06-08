<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="占卜人管理" subtitle="DIVINATOR PROFILES" />

    <!-- 顶部说明 -->
    <view class="intro card-mystic anim-fade-up">
      <text class="i-title">· 为 何 需 要 多 用 户</text>
      <text class="i-line">· 一日同人同工具不宜二占，恐心念不诚，反失灵验</text>
      <text class="i-line">· 多用户管理：家父 / 母亲 / 自己 / 孩子 各自独立</text>
      <text class="i-line">· 可查看每个人最近 7 天占卜记录</text>
    </view>

    <!-- 当前激活用户 -->
    <view class="active-card card-mystic anim-fade-up">
      <text class="ac-label">· 当 前 激 活</text>
      <view v-if="app.activeDivinator" class="ac-active">
        <text class="ac-name">{{ app.activeDivinator.name }}</text>
        <text v-if="app.activeDivinator.remark" class="ac-remark">
          {{ app.activeDivinator.remark }}
        </text>
        <view class="ac-stats">
          <text class="stat">总 测 {{ app.activeDivinator.totalCount }} 次</text>
          <text v-if="app.activeDivinator.lastDate" class="stat">
            最 近 {{ formatDate(app.activeDivinator.lastDate) }}
          </text>
        </view>
      </view>
      <text v-else class="ac-empty">未 激 活 · 请 添 加 占 卜 人</text>
    </view>

    <!-- 添加新用户 -->
    <view class="add-card card-mystic">
      <text class="f-title">· 添 加 占 卜 人</text>
      <view class="form-row">
        <text class="row-label">姓 名</text>
        <input v-model="newName" class="form-input" placeholder="如：张三 / 家父" maxlength="20" />
      </view>
      <view class="form-row">
        <text class="row-label">备 注</text>
        <input
          v-model="newRemark"
          class="form-input"
          placeholder="如：自己 / 父亲 / 母亲"
          maxlength="20"
        />
      </view>
      <view class="form-actions">
        <view class="btn-zhu" :class="{ disabled: !newName.trim() }" @click="onAdd">添 加</view>
      </view>
    </view>

    <!-- 用户列表 -->
    <view class="list card-mystic">
      <text class="f-title">· 所 有 占 卜 人（{{ divinators.length }}）</text>
      <view v-if="divinators.length === 0" class="empty">暂无用户</view>
      <view v-else class="list-inner">
        <view
          v-for="u in divinators"
          :key="u.key"
          class="u-card"
          :class="{ active: u.key === app.activeDivinatorKey }"
        >
          <view class="u-head" @click="onSwitch(u.key)">
            <view class="u-info">
              <text class="u-name">{{ u.name }}</text>
              <text v-if="u.remark" class="u-remark">· {{ u.remark }} ·</text>
            </view>
            <view class="u-tools">
              <text v-if="u.key === app.activeDivinatorKey" class="u-active-badge">激 活</text>
              <text class="u-stat">{{ u.totalCount }} 次</text>
            </view>
          </view>
          <!-- 工具冷却状态 -->
          <view v-if="Object.keys(u.toolCooldown).length > 0" class="u-cooldowns">
            <text class="cd-label">· 冷 却 中 ·</text>
            <view class="cd-list">
              <view v-for="(date, tool) in u.toolCooldown" :key="tool" class="cd-item">
                <text class="cd-tool">{{ toolName(tool) }}</text>
                <text class="cd-date">{{ formatDate(date as string) }} 解 锁</text>
              </view>
            </view>
          </view>
          <!-- 最近 7 天 -->
          <view v-if="recentByUser(u.key).length > 0" class="u-recent">
            <text class="re-label">· 最 近 7 天 ·</text>
            <view v-for="r in recentByUser(u.key)" :key="r.id" class="re-item">
              <text class="re-date">{{ formatDate(r.date) }}</text>
              <text class="re-tool">{{ r.toolName }}</text>
              <text class="re-brief">{{ r.brief }}</text>
              <text class="re-del" @click="onDeleteRecord(r.id)">✕</text>
            </view>
          </view>
          <!-- 操作 -->
          <view class="u-actions">
            <view
              v-if="u.key !== app.activeDivinatorKey"
              class="ua-btn ua-btn-li"
              @click="onSwitch(u.key)"
            >
              切 换 激 活
            </view>
            <view class="ua-btn ua-btn-secondary" @click="onEditRemark(u.key)">修 改 备 注</view>
            <view class="ua-btn ua-btn-danger" @click="onDelete(u.key)">删 除</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import { useAppStore, type ToolKey as _ToolKey } from '@/stores'
import { TOOLS } from '@/config/tools'

const app = useAppStore()
const newName = ref('')
const newRemark = ref('')
const divinators = computed(() => app.allDivinators)

function toolName(key: string): string {
  return TOOLS.find((t) => t.key === key)?.name || key
}

function formatDate(s: string): string {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function onAdd() {
  const name = newName.value.trim()
  if (!name) return
  app.addDivinator(name, newRemark.value.trim() || undefined)
  uni.showToast({ title: '已添加', icon: 'success' })
  newName.value = ''
  newRemark.value = ''
}

function onSwitch(key: string) {
  app.setActiveDivinator(key)
  uni.showToast({ title: '已切换', icon: 'success' })
}

function onEditRemark(key: string) {
  const p = app.divinatorProfiles[key]
  if (!p) return
  uni.showModal({
    title: '修改备注',
    editable: true,
    placeholderText: '新备注',
    content: p.remark || '',
    success: (res) => {
      if (res.confirm) {
        app.updateDivinatorRemark(key, (res.content || '').trim())
        uni.showToast({ title: '已更新', icon: 'success' })
      }
    },
  })
}

function onDelete(key: string) {
  const p = app.divinatorProfiles[key]
  if (!p) return
  uni.showModal({
    title: '确认删除',
    content: `删除「${p.name}」及其全部占卜记录？此操作不可恢复。`,
    confirmColor: '#C8302A',
    success: (res) => {
      if (res.confirm) {
        app.removeDivinator(key)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    },
  })
}

function onDeleteRecord(id: string) {
  uni.showModal({
    title: '删除该占卜记录',
    content: '删除后该工具的冷却将立即解除。',
    confirmColor: '#C8302A',
    success: (res) => {
      if (res.confirm) {
        app.removeDivinationRecord(id)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    },
  })
}

function recentByUser(key: string) {
  return app.getRecentRecords(key, 7)
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

.intro,
.active-card,
.add-card,
.list {
  position: relative;
  z-index: var(--z-content);
  margin: var(--sp-3) var(--sp-2) 0;
  padding: var(--sp-3);
}

.i-title,
.ac-label,
.f-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.15em;
  margin-bottom: var(--sp-2);
}

.i-line {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  line-height: 1.8;
  margin-bottom: 4rpx;
}

.ac-active {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  padding: var(--sp-3);
  background: linear-gradient(135deg, rgba(91, 58, 142, 0.3), rgba(200, 48, 42, 0.2));
  border-radius: var(--r-md);
}

.ac-name {
  font-size: var(--fs-xl);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-liu);
}

.ac-remark {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}

.ac-stats {
  display: flex;
  gap: var(--sp-2);
  margin-top: 4rpx;
}
.stat {
  font-size: var(--fs-xs);
  color: var(--color-bai);
}

.ac-empty {
  display: block;
  text-align: center;
  padding: var(--sp-3);
  font-family: 'KaiTi', serif;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  background: rgba(10, 10, 18, 0.4);
  border: 1rpx dashed rgba(212, 175, 55, 0.3);
  border-radius: var(--r-md);
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
.row-label {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}
.form-input {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  padding: var(--sp-1) 0;
  background: transparent;
}
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-3);
}
.btn-zhu {
  padding: var(--sp-2) var(--sp-5);
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 240rpx;
  text-align: center;
}
.btn-zhu.disabled {
  opacity: 0.5;
}

.list-inner {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.empty {
  padding: var(--sp-4);
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}

.u-card {
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
}
.u-card.active {
  border-color: var(--color-liu);
  background: rgba(212, 175, 55, 0.08);
}

.u-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}
.u-info {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}
.u-name {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.u-remark {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}
.u-tools {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
}
.u-active-badge {
  padding: 2rpx 12rpx;
  font-size: 18rpx;
  background: var(--color-zhu);
  color: var(--color-bai);
  border-radius: 4rpx;
  font-family: 'KaiTi', serif;
}
.u-stat {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  padding: 2rpx 8rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 4rpx;
}

.u-cooldowns,
.u-recent {
  padding: var(--sp-2);
  background: rgba(20, 20, 28, 0.4);
  border-radius: var(--r-sm);
  margin-bottom: var(--sp-1);
}
.cd-label,
.re-label {
  display: block;
  font-size: 18rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  margin-bottom: 4rpx;
  letter-spacing: 0.1em;
}
.cd-list,
.u-recent {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.cd-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4rpx 8rpx;
  background: rgba(200, 48, 42, 0.1);
  border-radius: 4rpx;
}
.cd-tool {
  font-size: var(--fs-xs);
  color: #f5c5c0;
  font-family: 'KaiTi', serif;
}
.cd-date {
  font-size: 18rpx;
  color: #f5c5c0;
}

.re-item {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 4rpx 8rpx;
  background: rgba(212, 175, 55, 0.05);
  border-radius: 4rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai);
}
.re-date {
  color: var(--color-bai-2);
  min-width: 60rpx;
}
.re-tool {
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  min-width: 80rpx;
}
.re-brief {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-del {
  padding: 0 8rpx;
  color: #c8302a;
  font-size: 20rpx;
  cursor: pointer;
}

.u-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
  margin-top: var(--sp-2);
}
.ua-btn {
  padding: 8rpx 16rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
  font-family: 'KaiTi', serif;
  cursor: pointer;
}
.ua-btn-li {
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
}
.ua-btn-secondary {
  background: rgba(212, 175, 55, 0.15);
  color: var(--color-liu);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}
.ua-btn-danger {
  background: rgba(200, 48, 42, 0.15);
  color: #f5c5c0;
  border: 1rpx solid rgba(200, 48, 42, 0.3);
}
</style>
