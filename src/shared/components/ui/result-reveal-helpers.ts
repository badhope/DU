/**
 * 玄枢 MISTVERSE · 通用 DOM 工具
 *
 * Vue 3 setup 中的 ref 可能指向：
 * - 模板 ref → HTMLElement
 * - 组件实例 ref → { $el: HTMLElement, ... }
 * - 跨平台 uni-app 中：useTemplateRef 的值类型取决于渲染目标
 *
 * `resolveHostEl` 统一处理这两种情况，返回最终可操作的 DOM 元素。
 */

interface MaybeElInstance {
  $el?: HTMLElement | null
}

/**
 * 解析 ref 指向的最终 DOM 元素
 * @param refValue 模板 ref 或组件实例 ref
 * @returns HTMLElement 或 null
 */
export function resolveHostEl(
  refValue: HTMLElement | MaybeElInstance | null | undefined,
): HTMLElement | null {
  if (!refValue) return null
  if (refValue instanceof HTMLElement) return refValue
  const el = (refValue as MaybeElInstance).$el
  if (el instanceof HTMLElement) return el
  return null
}
