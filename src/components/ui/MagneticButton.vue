<!--
  玄枢 MISTVERSE · 磁吸按钮
  - 鼠标 / 触摸靠近时位移
  - 离开回弹
-->
<template>
  <view ref="hostRef" class="mag-host" @touchmove.stop="onTouch" @touchend="onLeave" @touchcancel="onLeave">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'

const props = withDefaults(defineProps<{
  /** 强度 0-1 */
  strength?: number
  /** 弹性回弹 */
  elastic?: number
}>(), {
  strength: 0.3,
  elastic: 0.3,
})

const hostRef = ref<HTMLElement | null>(null)
// 用 gsap.quickTo 复用 tween 句柄，避免每次 touch 重新创建动画
let xTo: ((v: number) => void) | null = null
let yTo: ((v: number) => void) | null = null
let leaveTween: gsap.core.Tween | null = null
let lastX = 0
let lastY = 0

function ensureTweens() {
  if (!hostRef.value) return false
  if (!xTo) {
    xTo = gsap.quickTo(hostRef.value, 'x', { duration: 0.3, ease: 'power2.out' })
    yTo = gsap.quickTo(hostRef.value, 'y', { duration: 0.3, ease: 'power2.out' })
  }
  return true
}

function onTouch(e: any) {
  if (!hostRef.value || !e.touches?.length || typeof gsap === 'undefined') return
  if (!ensureTweens()) return
  // kill 回弹动画，避免冲突
  if (leaveTween) { leaveTween.kill(); leaveTween = null }
  const t = e.touches[0]
  lastX = t.clientX
  lastY = t.clientY
  const rect = hostRef.value.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  xTo!((t.clientX - cx) * props.strength)
  yTo!((t.clientY - cy) * props.strength)
}

function onLeave() {
  if (!hostRef.value || typeof gsap === 'undefined') return
  if (leaveTween) leaveTween.kill()
  leaveTween = gsap.to(hostRef.value, {
    x: 0, y: 0,
    duration: 0.7,
    ease: `elastic.out(1, ${props.elastic})`,
  })
}

onBeforeUnmount(() => {
  if (leaveTween) { leaveTween.kill(); leaveTween = null }
  xTo = null
  yTo = null
})
</script>

<style scoped>
.mag-host { display: inline-block; will-change: transform; }
</style>
