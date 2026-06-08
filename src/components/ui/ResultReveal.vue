<!--
  玄枢 MISTVERSE · 卡片级联出场容器
  - 包裹子元素后，自动级联动画进场
  - 监听 visible 变化切换入场/出场
-->
<template>
  <view ref="hostRef" class="rr-host" :class="{ 'is-played': played }">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'

const props = withDefaults(
  defineProps<{
    /** 是否播放（数据更新时重放） */
    trigger?: number | string
    /** 子项选择器 */
    selector?: string
    /** 子项之间的延迟（秒） */
    stagger?: number
    /** 单项动画时长 */
    duration?: number
    /** 起始延迟 */
    delay?: number
    /** 入场方向 */
    from?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'
    /** 自动播放 */
    autoPlay?: boolean
  }>(),
  {
    selector: '> *',
    stagger: 0.08,
    duration: 0.6,
    delay: 0,
    from: 'up',
    autoPlay: true,
  },
)

const hostRef = ref<HTMLElement | null>(null)
const played = ref(false)

function fromVars(el: HTMLElement) {
  const offset = 40
  switch (props.from) {
    case 'up':
      return { opacity: 0, y: offset }
    case 'down':
      return { opacity: 0, y: -offset }
    case 'left':
      return { opacity: 0, x: -offset }
    case 'right':
      return { opacity: 0, x: offset }
    case 'scale':
      return { opacity: 0, scale: 0.6 }
    case 'fade':
    default:
      return { opacity: 0 }
  }
}

function play() {
  if (!hostRef.value || typeof gsap === 'undefined') return
  const items = hostRef.value.querySelectorAll(props.selector)
  if (items.length === 0) {
    gsap.fromTo(hostRef.value, fromVars(hostRef.value), {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: props.duration,
      delay: props.delay,
      ease: 'power3.out',
    })
    return
  }
  gsap.fromTo(items, fromVars(hostRef.value), {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    duration: props.duration,
    delay: props.delay,
    stagger: props.stagger,
    ease: 'power3.out',
    onStart: () => {
      played.value = true
    },
  })
}

onMounted(() => {
  if (props.autoPlay) {
    nextTick(() => setTimeout(play, 30))
  }
})

watch(
  () => props.trigger,
  () => {
    played.value = false
    nextTick(() => setTimeout(play, 30))
  },
)
</script>

<style scoped>
.rr-host {
  display: contents;
}
</style>
