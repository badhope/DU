/**
 * 玄枢 MISTVERSE · Tab 切换 composable
 *
 * 管理 tab 切换状态 + 切换时的淡入淡出过渡。
 */

import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export function useTabSwitch(initialTab: string) {
  const activeTab = ref(initialTab)
  const transitioning = ref(false)
  const settings = useSettingsStore()

  function switchTab(tab: string) {
    if (tab === activeTab.value) return
    if (settings.reducedMotion) {
      activeTab.value = tab
      return
    }
    transitioning.value = true
    requestAnimationFrame(() => {
      activeTab.value = tab
      requestAnimationFrame(() => {
        transitioning.value = false
      })
    })
  }

  return { activeTab, transitioning, switchTab }
}
