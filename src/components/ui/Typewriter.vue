<template>
  <view class="tw-wrap">
    <text class="tw-text" :class="['tw-' + theme]">{{ shown }}<text v-if="showCursor" class="tw-cursor" /></text>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  /** 完整文字 */
  text: string
  /** 速度（ms/字） */
  speed?: number
  /** 开始延迟（ms） */
  delay?: number
  /** 完成后再保留光标 */
  showCursor?: boolean
  /** 主题：liu / zhu / bai */
  theme?: 'liu' | 'zhu' | 'bai'
  /** 完成后是否清除 */
  clearOnDone?: boolean
}>(), {
  speed: 60,
  delay: 0,
  showCursor: true,
  theme: 'bai',
  clearOnDone: false,
})

const shown = ref('')
let timer: any = null
let cursorTimer: any = null
const cursorOn = ref(true)

function start() {
  shown.value = ''
  if (cursorTimer) { clearInterval(cursorTimer); cursorTimer = null }
  if (timer) { clearTimeout(timer); timer = null }
  cursorOn.value = true
  cursorTimer = setInterval(() => { cursorOn.value = !cursorOn.value }, 480)
  timer = setTimeout(() => {
    let i = 0
    const next = () => {
      if (i >= props.text.length) {
        if (cursorTimer) { clearInterval(cursorTimer); cursorTimer = null }
        cursorOn.value = false
        if (props.clearOnDone) {
          setTimeout(() => { shown.value = '' }, 1500)
        }
        return
      }
      shown.value = props.text.slice(0, i + 1)
      i++
      timer = setTimeout(next, props.speed)
    }
    next()
  }, props.delay)
}

onMounted(() => { start() })
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  if (cursorTimer) clearInterval(cursorTimer)
})
watch(() => props.text, () => start())
</script>

<style scoped>
.tw-wrap { display: inline-block; }
.tw-text { display: inline-block; font-family: var(--font-mystic, 'KaiTi', serif); white-space: pre-wrap; }
.tw-liu { color: var(--color-liu); }
.tw-zhu { color: var(--color-zhu); }
.tw-bai { color: var(--color-bai); }
.tw-cursor {
  display: inline-block;
  width: 2rpx;
  height: 1em;
  background: currentColor;
  margin-left: 2rpx;
  vertical-align: text-bottom;
  animation: typeCursor 0.96s steps(2) infinite;
}
@keyframes typeCursor { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
</style>
