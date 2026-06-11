/**
 * 玄枢 MISTVERSE · 结果揭示 composable
 *
 * 占卜结果"揭封"动画控制。
 * 从 loading → reveal 两阶段过渡。
 */

import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export type RevealPhase = 'idle' | 'loading' | 'revealing' | 'done'

export function useResultReveal() {
  const phase = ref<RevealPhase>('idle')
  const settings = useSettingsStore()

  function startLoading() {
    phase.value = 'loading'
  }

  function reveal() {
    if (settings.reducedMotion) {
      phase.value = 'done'
      return
    }
    phase.value = 'revealing'
    // 揭示动画 800ms 后标记完成
    setTimeout(() => {
      phase.value = 'done'
    }, 800)
  }

  function reset() {
    phase.value = 'idle'
  }

  return { phase, startLoading, reveal, reset }
}
