/**
 * 玄枢 MISTVERSE · 卡片入场 composable
 *
 * 列表卡片交错入场动画（stagger）。
 * 返回每张卡片的 style 对象，含 transition-delay。
 */

import { type Ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export interface UseCardEntranceOptions {
  /** 总卡片数 */
  count: Ref<number> | number
  /** 基础延迟 ms */
  baseDelay?: number
  /** 每张递增延迟 ms */
  stagger?: number
}

export function useCardEntrance(options: UseCardEntranceOptions) {
  const settings = useSettingsStore()
  const baseDelay = options.baseDelay ?? 80
  const stagger = options.stagger ?? 60

  function getDelay(index: number): string {
    if (settings.reducedMotion) return '0ms'
    return `${baseDelay + index * stagger}ms`
  }

  function getStyle(index: number): Record<string, string> {
    return {
      animationDelay: getDelay(index),
      transitionDelay: getDelay(index),
    }
  }

  return { getDelay, getStyle }
}
