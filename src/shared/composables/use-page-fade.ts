/**
 * 玄枢 MISTVERSE · 页面淡入 composable
 *
 * 页面 onShow 时给根元素加 fadeInUp 动画类，
 * 支持 reducedMotion 时跳过动画。
 */

import { onMounted, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export function usePageFade() {
  const visible = ref(false)
  const settings = useSettingsStore()

  onMounted(() => {
    if (settings.reducedMotion) {
      visible.value = true
      return
    }
    // 下一帧加类，触发 CSS transition
    requestAnimationFrame(() => {
      visible.value = true
    })
  })

  return { visible }
}
