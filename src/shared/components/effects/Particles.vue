<!--
  玄枢 MISTVERSE · 能量粒子
  - 30 颗金/紫/朱砂能量粒向上飘
  - 缓动 + 缩放 + 透明度
  - 适用按钮区背景
-->
<template>
  <view class="pt-host" aria-hidden="true">
    <view
      v-for="p in particles"
      :key="p.id"
      class="pt-particle"
      :class="`pt-${p.size} pt-c-${p.color}`"
      :style="{
        left: p.left + '%',
        animationDelay: p.delay + 's',
        animationDuration: p.dur + 's',
      }"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    count?: number
    colors?: 'gold' | 'purple' | 'red' | 'mixed'
  }>(),
  {
    count: 24,
    colors: 'mixed',
  },
)

const COLORS = {
  gold: [0, 1, 2],
  purple: [3, 3, 3],
  red: [4, 4, 4],
  mixed: [0, 1, 2, 3, 4],
}

// 仅在 setup 时生成一次（粒子位置无需响应式），用 ref 保持引用稳定
const particles = ref<
  Array<{
    id: number
    left: number
    size: 'sm' | 'md' | 'lg'
    color: number
    delay: number
    dur: number
  }>
>(
  Array.from({ length: props.count }, (_, i) => {
    const colors = COLORS[props.colors]!
    const sizeRand = Math.random()
    return {
      id: i,
      left: Math.random() * 100,
      size: sizeRand < 0.6 ? 'sm' : sizeRand < 0.9 ? 'md' : 'lg',
      color: colors[Math.floor(Math.random() * colors.length)]!,
      delay: Math.random() * 6,
      dur: 3 + Math.random() * 4,
    }
  }),
)
</script>

<style scoped>
.pt-host {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.pt-particle {
  position: absolute;
  bottom: -8rpx;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 12rpx currentColor;
  animation: ptRise infinite linear;
  opacity: 0;
}
.pt-sm {
  width: 4rpx;
  height: 4rpx;
}
.pt-md {
  width: 8rpx;
  height: 8rpx;
}
.pt-lg {
  width: 12rpx;
  height: 12rpx;
}
.pt-c-0 {
  color: #d4af37;
}
.pt-c-1 {
  color: #f5e6a8;
}
.pt-c-2 {
  color: #b8941f;
}
.pt-c-3 {
  color: #5b3a8e;
}
.pt-c-4 {
  color: #c8302a;
}
@keyframes ptRise {
  0% {
    transform: translateY(0) scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 0.8;
  }
  50% {
    transform: translateY(-50vh) scale(1);
    opacity: 1;
  }
  80% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) scale(0.3);
    opacity: 0;
  }
}
</style>
