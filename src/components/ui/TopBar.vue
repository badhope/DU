<template>
  <view class="topbar" :style="topbarStyle">
    <view class="back-btn" @click="goBack">‹</view>
    <view class="topbar-title">
      <text class="title-mystic title-md">{{ title }}</text>
      <text class="topbar-sub">{{ subtitle }}</text>
    </view>
    <view v-if="showSettings" class="setting-btn" @click="goSettings">⚙</view>
    <view v-else class="topbar-spacer" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

withDefaults(defineProps<{
  title: string
  subtitle: string
  showSettings?: boolean
}>(), {
  showSettings: true,
})

const statusBarHeight = ref(44)

const topbarStyle = computed(() => ({
  paddingTop: statusBarHeight.value + 'px',
}))

function goBack() {
  // 优先使用页面栈返回；栈底则跳首页
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
  } else {
    uni.reLaunch({ url: '/pages/index/index' })
  }
}

function goSettings() {
  uni.navigateTo({ url: '/pages/settings/settings' })
}

onMounted(() => {
  try {
    const sys: any = uni.getSystemInfoSync()
    statusBarHeight.value = sys.statusBarHeight ?? 0
  } catch (e) {
    statusBarHeight.value = 44
  }
})
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-toolbar);
  display: flex;
  align-items: center;
  padding: var(--sp-3) var(--sp-2);
  background: linear-gradient(180deg, rgba(10, 10, 18, 0.95) 0%, rgba(10, 10, 18, 0.7) 100%);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.15);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  line-height: 1;
  color: var(--color-liu);
  border-radius: 50%;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  background: rgba(20, 20, 28, 0.5);
  transition: all 0.2s var(--ease-mystic);
  flex-shrink: 0;
}

.back-btn:active {
  transform: scale(0.92);
  background: rgba(212, 175, 55, 0.15);
}

.topbar-title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 var(--sp-1);
}

.topbar-sub {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.3em;
  margin-top: 4rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.setting-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: var(--color-liu);
  border-radius: 50%;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  background: rgba(20, 20, 28, 0.5);
  transition: all 0.2s var(--ease-mystic);
  flex-shrink: 0;
}

.setting-btn:active {
  transform: scale(0.92);
  background: rgba(212, 175, 55, 0.15);
}

.topbar-spacer {
  width: 64rpx;
  height: 64rpx;
  flex-shrink: 0;
}

/* 减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .back-btn, .setting-btn { transition: none; }
}
</style>
