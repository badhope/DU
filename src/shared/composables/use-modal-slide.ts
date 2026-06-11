/**
 * 玄枢 MISTVERSE · 模态框滑入 composable
 *
 * 底部/中央模态框的滑入/滑出动画控制。
 */

import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export type ModalPosition = 'bottom' | 'center'

export function useModalSlide(position: ModalPosition = 'bottom') {
  const visible = ref(false)
  const animating = ref(false)
  const settings = useSettingsStore()

  const slideClass = computed(() => {
    if (settings.reducedMotion) return ''
    return position === 'bottom' ? 'slide-up' : 'scale-in'
  })

  function open() {
    if (settings.reducedMotion) {
      visible.value = true
      return
    }
    animating.value = true
    visible.value = true
    requestAnimationFrame(() => {
      animating.value = false
    })
  }

  function close() {
    if (settings.reducedMotion) {
      visible.value = false
      return
    }
    animating.value = true
    // 等动画完成再隐藏
    setTimeout(() => {
      visible.value = false
      animating.value = false
    }, 300)
  }

  return { visible, animating, slideClass, open, close }
}
