/** * 玄枢 MISTVERSE · 错误边界组件 * * 捕获子组件渲染错误，显示降级 UI。 * 用法:
<ErrorBoundary><ChildComponent /></ErrorBoundary>
*/

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err) => {
  hasError.value = true
  errorMessage.value = err instanceof Error ? err.message : String(err)
  return false // 阻止错误继续传播
})

function retry() {
  hasError.value = false
  errorMessage.value = ''
}
</script>

<template>
  <view v-if="hasError" class="error-boundary" role="alert" aria-live="assertive">
    <text class="error-title">此区域加载异常</text>
    <text class="error-msg">{{ errorMessage }}</text>
    <view class="btn-liu" role="button" tabindex="0" aria-label="重试" @click="retry" @keydown.enter="retry">重 试</view>
  </view>
  <slot v-else />
</template>

<style scoped>
@layer components {
  .error-boundary {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48rpx 32rpx;
    background: var(--color-xuan-2, #14141c);
    border: 1rpx solid rgba(200, 48, 42, 0.3);
    border-radius: var(--r-lg, 16rpx);
    gap: 16rpx;
  }
  .error-title {
    font-size: var(--fs-md, 30rpx);
    color: var(--color-zhu, #c8302a);
    font-weight: 600;
  }
  .error-msg {
    font-size: var(--fs-sm, 26rpx);
    color: var(--color-bai-2, #b8b2a0);
    text-align: center;
  }
}
</style>
