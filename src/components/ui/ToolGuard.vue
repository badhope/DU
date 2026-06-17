<!--
  渡 DU · 通用重事类工具守卫组件
  - 包内：CooldownDialog + AddUser 对话框
  - UserSwitcher 是页面自己渲染的（与各页面布局融合）
-->
<template>
  <!-- 冷却提示 -->
  <CooldownDialog
    :visible="showCooldown"
    :record="cooldownRecord"
    @close="emit('close')"
    @switchUser="emit('switchUser')"
    @switchTool="emit('switchTool')"
    @ignore="emit('ignore')"
  />

  <!-- 添加用户弹窗 -->
  <view v-if="showAddUser" class="add-mask" @click.self="emit('cancelAddUser')">
    <view class="add-card-mystic card-mystic anim-fade-up">
      <text class="ac-title">· 添 加 占 卜 人</text>
      <view class="ac-row">
        <text class="ac-label">姓 名</text>
        <input
          :value="newUserName"
          class="ac-input"
          placeholder="如：张三 / 家父"
          maxlength="20"
          @input="onNameInput"
        />
      </view>
      <view class="ac-row">
        <text class="ac-label">备 注</text>
        <input
          :value="newUserRemark"
          class="ac-input"
          placeholder="如：自己 / 父亲 / 母亲"
          maxlength="20"
          @input="onRemarkInput"
        />
      </view>
      <view class="ac-actions">
        <view class="ac-btn ac-btn-secondary" @click="emit('cancelAddUser')">取 消</view>
        <view
          class="ac-btn ac-btn-primary"
          :class="{ disabled: !newUserName.trim() }"
          @click="emit('confirmAddUser')"
        >
          添 加
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import CooldownDialog from '@/components/ui/CooldownDialog.vue'
import type { DivinationRecord } from '@/stores'

defineProps<{
  showCooldown: boolean
  showAddUser: boolean
  cooldownRecord: DivinationRecord | null
  newUserName: string
  newUserRemark: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'switchUser'): void
  (e: 'switchTool'): void
  (e: 'ignore'): void
  (e: 'cancelAddUser'): void
  (e: 'confirmAddUser'): void
  (e: 'update:newUserName', v: string): void
  (e: 'update:newUserRemark', v: string): void
}>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onNameInput(e: any) {
  emit('update:newUserName', e.detail.value)
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onRemarkInput(e: any) {
  emit('update:newUserRemark', e.detail.value)
}
</script>

<style scoped>
.add-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}
.add-card-mystic {
  width: 100%;
  max-width: 600rpx;
  padding: 32rpx 28rpx;
  border-radius: 16rpx;
  background: linear-gradient(180deg, rgba(20, 20, 28, 0.95), rgba(10, 10, 18, 0.95));
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}
.ac-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  margin-bottom: 20rpx;
  font-family: serif;
  letter-spacing: 4rpx;
}
.ac-row {
  display: flex;
  align-items: center;
  padding: 8rpx 0;
}
.ac-label {
  width: 100rpx;
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.ac-input {
  flex: 1;
  padding: 12rpx 16rpx;
  background: rgba(10, 10, 18, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: 8rpx;
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
}
.ac-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}
.ac-btn {
  flex: 1;
  padding: 16rpx;
  text-align: center;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: bold;
  font-family: serif;
}
.ac-btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-bai-2, #b8b2a0);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}
.ac-btn-primary {
  background: linear-gradient(135deg, #d4af37, #b8941f);
  color: #0a0a12;
}
.ac-btn-primary.disabled {
  opacity: 0.4;
}
</style>
