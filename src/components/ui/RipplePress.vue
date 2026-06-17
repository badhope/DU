<!--
  渡 DU · 点击涟漪按钮
  - 包裹后点击产生金色涟漪扩散
  - 支持按下时 scale 缩放
  - 支持 disabled 状态
-->
<template>
  <view class="ripple-host" :class="['ripple-press', { 'is-disabled': disabled }]" @tap="onTap">
    <slot />
    <view
      v-for="r in ripples"
      :key="r.id"
      class="ripple"
      :style="{ left: r.x + 'px', top: r.y + 'px', width: r.size + 'px', height: r.size + 'px' }"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 涟漪颜色 */
    color?: string
    /** 禁用 */
    disabled?: boolean
    /** 缩放反馈 */
    scaleFeedback?: boolean
    /** 节流（ms） */
    throttle?: number
  }>(),
  {
    color: 'rgba(212, 175, 55, 0.5)',
    disabled: false,
    scaleFeedback: true,
    throttle: 200,
  },
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emit = defineEmits<{ (e: 'tap', evt: any): void }>()
const ripples = ref<Array<{ id: number; x: number; y: number; size: number }>>([])
let lastTap = 0
let rippleId = 0

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onTap(e: any) {
  if (props.disabled) return
  const now = Date.now()
  if (now - lastTap < props.throttle) return
  lastTap = now

  // 解析坐标
  const target = e.currentTarget
  let x = 0,
    y = 0
  if (target && target.getBoundingClientRect) {
    const rect = target.getBoundingClientRect()
    if (e.touches && e.touches.length) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else if (e.changedTouches && e.changedTouches.length) {
      x = e.changedTouches[0].clientX - rect.left
      y = e.changedTouches[0].clientY - rect.top
    } else if (e.detail && typeof e.detail.x === 'number') {
      x = e.detail.x - rect.left
      y = e.detail.y - rect.top
    } else {
      x = rect.width / 2
      y = rect.height / 2
    }
  } else {
    // 兜底：使用元素宽高
    x = (target?.offsetWidth || 0) / 2
    y = (target?.offsetHeight || 0) / 2
  }
  const size = Math.max(target?.offsetWidth || 0, target?.offsetHeight || 0) * 2
  const id = ++rippleId
  ripples.value.push({ id, x, y, size })
  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== id)
  }, 720)
  emit('tap', e)
}
</script>

<style scoped>
.ripple-host {
  position: relative;
  overflow: hidden;
}
.ripple-press {
  transition: transform 0.18s var(--ease-mystic);
}
.ripple-press:active {
  transform: scale(0.96);
}
.ripple-press.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}
.ripple {
  position: absolute;
  background: v-bind(color);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: ripple-expand 0.7s var(--ease-mystic) forwards;
  pointer-events: none;
  mix-blend-mode: screen;
}
@keyframes ripple-expand {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2.5);
    opacity: 0;
  }
}
</style>
