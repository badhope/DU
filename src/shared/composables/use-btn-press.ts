/**
 * 玄枢 MISTVERSE · 按钮按压反馈 composable
 *
 * 封装按钮 active 状态的 scale 反馈 + 可选涟漪效果。
 */

import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export function useBtnPress() {
  const pressed = ref(false)
  const settings = useSettingsStore()

  function onPressStart() {
    if (settings.reducedMotion) return
    pressed.value = true
  }

  function onPressEnd() {
    pressed.value = false
  }

  const pressStyle = {
    transform: pressed.value ? 'scale(0.96)' : 'scale(1)',
    transition: 'transform 0.15s var(--ease-power, cubic-bezier(0.16, 1, 0.3, 1))',
  }

  return { pressed, onPressStart, onPressEnd, pressStyle }
}
