/**
 * 玄枢 MISTVERSE · ResultReveal 工具函数
 *
 * 处理 hostRef 的多态性：
 * - 标准浏览器 / happy-dom：ref 直接绑定到 HTMLElement
 * - uni-app H5 编译后：<view> 编译为 <uni-view> 自定义元素，Vue 把 ref 绑定到
 *   自定义元素实例（带 $el 属性指向真实 DOM）
 *
 * 修复 ISSUE-001: `s.value.querySelectorAll is not a function`
 */

/** 任何带 $el 的对象（Vue 组件实例、Element 实例等） */
interface MaybeElInstance {
  $el?: HTMLElement | null
}

export function resolveHostEl(
  refValue: HTMLElement | MaybeElInstance | null | undefined,
): HTMLElement | null {
  if (!refValue) return null
  // 直接是 DOM 元素
  if (refValue instanceof HTMLElement) {
    return refValue
  }
  // 是组件实例，取 $el
  const el = (refValue as MaybeElInstance).$el
  if (el instanceof HTMLElement) {
    return el
  }
  return null
}
