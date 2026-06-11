<template>
  <view v-if="visible" class="cd-mask" @click.self="onCloseMask">
    <view class="cd-card card-mystic anim-fade-up">
      <view class="cd-header">
        <text class="cd-glyph">🔔</text>
        <text class="cd-title">{{ title || '今 日 已 测' }}</text>
      </view>

      <view class="cd-body">
        <view class="cd-msg">
          <text class="msg-line msg-name">「{{ record?.userName || '' }}」</text>
          <text class="msg-line msg-date">今日（{{ friendlyDate(record?.date || '') }}）</text>
          <text class="msg-line msg-tool">
            已测 <text class="hl">{{ record?.toolName }}</text>
          </text>
          <text class="msg-line msg-brief">
            结果：<text class="hl-brief">{{ record?.brief }}</text>
          </text>
        </view>

        <view class="cd-tip">
          <text class="tip-quote">· 一 日 同 人 同 工 具 不 宜 二 占 ·</text>
          <text class="tip-quote">· 恐 心 念 不 诚 · 反 失 灵 验 ·</text>
        </view>

        <view v-if="unlockDate" class="cd-unlock">
          <text>· {{ friendlyDate(unlockDate) }} 起可重测 ·</text>
        </view>
      </view>

      <view class="cd-actions">
        <view class="cd-btn cd-btn-secondary" @click="onSwitchUser">
          <text class="btn-glyph">👥</text>
          <text class="btn-label">换 人 占 卜</text>
        </view>
        <view class="cd-btn cd-btn-secondary" @click="onSwitchTool">
          <text class="btn-glyph">🔀</text>
          <text class="btn-label">换 工 具 测</text>
        </view>
        <view class="cd-btn cd-btn-primary" @click="onIgnore">
          <text class="btn-glyph">⚡</text>
          <text class="btn-label">不 听 劝 · 继 续</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { friendlyDate } from '@/utils/daily-cooldown'
import type { DivinationRecord } from '@/stores'

const props = defineProps<{
  visible: boolean
  record?: DivinationRecord | null
  unlockDate?: string
  title?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'switchUser'): void
  (e: 'switchTool'): void
  (e: 'ignore'): void
}>()

const _message = computed(() => {
  if (!props.record) return ''
  return `「${props.record.userName}」今日已测 ${props.record.toolName}，结果：${props.record.brief}`
})

function onCloseMask() {
  emit('close')
}
function onSwitchUser() {
  emit('switchUser')
}
function onSwitchTool() {
  emit('switchTool')
}
function onIgnore() {
  emit('ignore')
}
</script>

<style scoped>
.cd-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-4);
}

.cd-card {
  width: 100%;
  max-width: 700rpx;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--sp-5);
  background: linear-gradient(180deg, rgba(20, 12, 30, 0.95), rgba(40, 20, 50, 0.95));
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  border-radius: var(--r-lg);
  box-shadow: 0 8rpx 40rpx rgba(91, 58, 142, 0.4);
}

.cd-header {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
  padding-bottom: var(--sp-3);
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}

.cd-glyph {
  font-size: 48rpx;
}

.cd-title {
  flex: 1;
  font-size: var(--fs-lg);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-liu);
  letter-spacing: 0.15em;
}

.cd-body {
  margin-bottom: var(--sp-4);
}

.cd-msg {
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
  padding: var(--sp-3);
  margin-bottom: var(--sp-3);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.msg-line {
  font-family: 'KaiTi', serif;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.7;
}

.msg-name {
  color: var(--color-liu);
  font-weight: 700;
  font-size: var(--fs-md);
}

.msg-date {
  color: var(--color-bai-2);
  font-size: var(--fs-xs);
}

.msg-tool {
  font-size: var(--fs-sm);
}

.msg-brief {
  color: var(--color-bai);
}

.hl {
  color: var(--color-zhu);
  font-weight: 700;
  font-size: var(--fs-md);
}

.hl-brief {
  color: var(--color-bai);
  font-style: italic;
  background: rgba(212, 175, 55, 0.1);
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
}

.cd-tip {
  padding: var(--sp-3);
  background: rgba(200, 48, 42, 0.1);
  border-left: 4rpx solid #c8302a;
  border-radius: 4rpx;
  margin-bottom: var(--sp-3);
}

.tip-quote {
  display: block;
  font-family: 'KaiTi', serif;
  font-size: var(--fs-sm);
  color: #f5c5c0;
  line-height: 1.8;
  letter-spacing: 0.1em;
}

.cd-unlock {
  text-align: center;
  padding: var(--sp-2);
  background: rgba(79, 174, 111, 0.1);
  border-radius: var(--r-sm);
  font-family: 'KaiTi', serif;
  font-size: var(--fs-sm);
  color: #8fd0a8;
  letter-spacing: 0.1em;
}

.cd-actions {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.cd-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border-radius: var(--r-md);
  font-family: 'KaiTi', serif;
  font-size: var(--fs-md);
  font-weight: 700;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 88rpx;
}

.cd-btn-primary {
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
  box-shadow: 0 4rpx 16rpx rgba(200, 48, 42, 0.3);
}

.cd-btn-primary:active {
  transform: scale(0.98);
}

.cd-btn-secondary {
  background: rgba(212, 175, 55, 0.12);
  color: var(--color-liu);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}

.cd-btn-secondary:active {
  background: rgba(212, 175, 55, 0.2);
}

.btn-glyph {
  font-size: var(--fs-md);
}

.btn-label {
  font-size: var(--fs-sm);
}
</style>
