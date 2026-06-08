<!--
  玄枢 MISTVERSE · 数字滚动组件
  - 0 → target 平滑滚动（GSAP power2.out）
  - 配大字号、流金光、翻入动画
-->
<template>
  <text class="num-counter" :class="['num-' + size, 'num-' + theme]" :style="extraStyle">
    {{ display }}
    <text v-if="suffix" class="num-suffix">{{ suffix }}</text>
  </text>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'

const props = withDefaults(
  defineProps<{
    /** 目标数字 */
    value: number
    /** 缓动时长（秒） */
    duration?: number
    /** 延迟（秒） */
    delay?: number
    /** 小数位数 */
    decimals?: number
    /** 后缀 */
    suffix?: string
    /** 字号档：sm / md / lg / xl */
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** 主题：liu / zhu / bai */
    theme?: 'liu' | 'zhu' | 'bai'
    /** 额外样式 */
    extraStyle?: Record<string, string>
  }>(),
  {
    duration: 1.6,
    delay: 0,
    decimals: 0,
    size: 'md',
    theme: 'liu',
  },
)

const display = ref(0)
const obj = { v: 0 }
let tween: gsap.core.Tween | null = null

function play() {
  if (typeof window === 'undefined' || typeof gsap === 'undefined') {
    display.value = props.value
    return
  }
  // 复用 tween 句柄，避免快速变化时新 tween 覆盖旧 tween 造成抖动
  if (tween) {
    tween.kill()
    tween = null
  }
  obj.v = display.value
  tween = gsap.to(obj, {
    v: props.value,
    duration: props.duration,
    delay: props.delay,
    ease: 'power2.out',
    onUpdate: () => {
      display.value = Number(obj.v.toFixed(props.decimals))
    },
    onComplete: () => {
      tween = null
    },
  })
}

onMounted(() => {
  setTimeout(play, 100)
})
onBeforeUnmount(() => {
  if (tween) {
    tween.kill()
    tween = null
  }
})
watch(
  () => props.value,
  () => play(),
)
</script>

<style scoped>
.num-counter {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  font-family: 'Courier New', 'STZhongsong', serif;
  font-weight: 700;
}
.num-sm {
  font-size: var(--fs-md);
}
.num-md {
  font-size: var(--fs-lg);
}
.num-lg {
  font-size: var(--fs-2xl);
}
.num-xl {
  font-size: var(--fs-3xl);
}
.num-liu {
  color: var(--color-liu);
  text-shadow: 0 0 12rpx rgba(212, 175, 55, 0.6);
}
.num-zhu {
  color: var(--color-zhu);
  text-shadow: 0 0 12rpx rgba(200, 48, 42, 0.6);
}
.num-bai {
  color: var(--color-bai);
  text-shadow: 0 0 8rpx rgba(245, 241, 232, 0.4);
}
.num-suffix {
  font-size: 0.6em;
  opacity: 0.6;
  margin-left: 4rpx;
  font-weight: 400;
}
</style>
