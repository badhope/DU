<template>
  <view class="us-bar" :class="{ 'us-bar-compact': compact }">
    <text class="us-label">· 今 日 为 谁 问 ·</text>
    <scroll-view v-if="divinators.length > 0" scroll-x class="us-scroll">
      <view class="us-list">
        <view
          v-for="u in divinators"
          :key="u.key"
          class="us-item"
          :class="{ active: u.key === activeKey, locked: isLocked(u.key) }"
          @click="onSelect(u.key)"
        >
          <text class="us-name">{{ u.name }}</text>
          <text v-if="u.remark" class="us-remark">{{ u.remark }}</text>
          <text v-if="isLocked(u.key)" class="us-lock">🔒</text>
        </view>
      </view>
    </scroll-view>
    <view v-else class="us-empty" @click="onAdd">
      <text class="empty-glyph">👤</text>
      <text class="empty-text">点 此 添 加 占 卜 人</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import { COOLDOWN_TYPE } from '@/utils/daily-cooldown'
import type { ToolKey } from '@/stores'

const props = defineProps<{
  tool?: ToolKey
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'addUser'): void
  (e: 'select', key: string): void
}>()

const app = useAppStore()
const divinators = computed(() => app.allDivinators)
const activeKey = computed(() => app.activeDivinatorKey)

/** 当前工具的冷却状态：true=有锁（不可重测） */
function isLocked(key: string): boolean {
  if (!props.tool) return false
  const t = COOLDOWN_TYPE[props.tool]!
  if (t === 'free' || t === undefined) return false
  return !!app.checkTodayDivination(key, props.tool)
}

function onSelect(key: string) {
  app.setActiveDivinator(key)
  emit('select', key)
}

function onAdd() {
  emit('addUser')
}
</script>

<style scoped>
.us-bar {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
  margin: var(--sp-2) var(--sp-2) 0;
}

.us-bar-compact {
  padding: var(--sp-1) var(--sp-2);
  margin: 0;
}

.us-label {
  flex-shrink: 0;
  font-size: var(--fs-xs);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

.us-scroll {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
}

.us-list {
  display: inline-flex;
  gap: var(--sp-1);
  padding: 4rpx 0;
}

.us-item {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  padding: 8rpx 16rpx;
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  font-family: 'KaiTi', serif;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
}

.us-item.active {
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
  border-color: var(--color-liu);
  box-shadow: 0 0 12rpx rgba(212, 175, 55, 0.3);
}

.us-item.locked:not(.active) {
  border-color: rgba(200, 48, 42, 0.4);
  background: rgba(200, 48, 42, 0.08);
}

.us-name {
  font-size: var(--fs-sm);
  color: inherit;
}

.us-remark {
  font-size: 18rpx;
  color: var(--color-bai-2);
  opacity: 0.8;
}

.us-item.active .us-remark {
  color: rgba(255, 255, 255, 0.8);
}

.us-lock {
  font-size: 18rpx;
  margin-left: 2rpx;
}

.us-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 12rpx 0;
  border: 1rpx dashed rgba(212, 175, 55, 0.3);
  border-radius: var(--r-sm);
  cursor: pointer;
}

.empty-glyph {
  font-size: var(--fs-md);
}

.empty-text {
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}
</style>
