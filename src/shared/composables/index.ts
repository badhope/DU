/**
 * 玄枢 MISTVERSE · Composable 统一导出
 *
 * SP-4 新增 6 个 motion composable:
 *   - usePageFade      页面淡入
 *   - useCardEntrance  卡片交错入场
 *   - useTabSwitch     Tab 切换过渡
 *   - useResultReveal  结果揭封动画
 *   - useBtnPress      按钮按压反馈
 *   - useModalSlide    模态框滑入/滑出
 *
 * SP-2 已有:
 *   - useCooldown      冷却/用户切换
 */

export { usePageFade } from './use-page-fade'
export { useCardEntrance } from './use-card-entrance'
export type { UseCardEntranceOptions } from './use-card-entrance'
export { useTabSwitch } from './use-tab-switch'
export { useResultReveal } from './use-result-reveal'
export type { RevealPhase } from './use-result-reveal'
export { useBtnPress } from './use-btn-press'
export { useModalSlide } from './use-modal-slide'
export type { ModalPosition } from './use-modal-slide'
export { useCooldown } from './use-cooldown'
