<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

/** 把安全区/状态栏高度注入 CSS 变量，方便在 rpx 之外精确控制 */
function injectSafeAreaVars() {
  try {
    // 优先 uni-app 自带 API；H5 端没有则跳过
    // @ts-ignore
    const sys = typeof uni !== 'undefined' && uni.getSystemInfoSync ? uni.getSystemInfoSync() : null
    if (!sys) return
    const top =
      sys.statusBarHeight && Number.isFinite(sys.statusBarHeight)
        ? sys.statusBarHeight + 'px'
        : '0px'
    const bottom =
      sys.safeAreaInsets?.bottom && Number.isFinite(sys.safeAreaInsets.bottom)
        ? sys.safeAreaInsets.bottom + 'px'
        : sys.safeArea?.height && sys.screenHeight
          ? Math.max(0, sys.screenHeight - sys.safeArea.height - sys.safeArea.top) + 'px'
          : '0px'
    const left =
      sys.safeAreaInsets?.left && Number.isFinite(sys.safeAreaInsets.left)
        ? sys.safeAreaInsets.left + 'px'
        : '0px'
    const right =
      sys.safeAreaInsets?.right && Number.isFinite(sys.safeAreaInsets.right)
        ? sys.safeAreaInsets.right + 'px'
        : '0px'
    const style = `--safe-top:${top};--safe-bottom:${bottom};--safe-left:${left};--safe-right:${right};`
    if (typeof document !== 'undefined') {
      const prev = document.documentElement.getAttribute('data-safe') || ''
      const next = prev ? prev + ';' + style : style
      document.documentElement.setAttribute('data-safe', next)
    }
  } catch (e) {
    // 静默：H5/桌面端无此 API 不影响
  }
}

onLaunch(() => {
  injectSafeAreaVars()
})
onShow(() => {
  injectSafeAreaVars()
})
onHide(() => {
  // 静默
})
</script>

<style>
@import './designs/tokens.css';
@import './designs/animations.css';

/* ===== 全局 ===== */
page {
  background: var(--color-xuan);
  color: var(--color-bai);
  font-family: var(
    --font-mystic,
    -apple-system,
    BlinkMacSystemFont,
    'PingFang SC',
    'Microsoft YaHei',
    '思源黑体',
    sans-serif
  );
  font-size: var(--fs-base);
  line-height: 1.6;
  /* 安全区适配（H5/iOS/Android 通用） */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  box-sizing: border-box;
}

/* ===== 工具类 ===== */
.flex {
  display: flex;
}
.flex-col {
  display: flex;
  flex-direction: column;
}
.items-center {
  align-items: center;
}
.justify-center {
  justify-content: center;
}
.justify-between {
  justify-content: space-between;
}
.text-center {
  text-align: center;
}
.relative {
  position: relative;
}
.absolute {
  position: absolute;
}
.safe-pb {
  padding-bottom: env(safe-area-inset-bottom);
}
.safe-pt {
  padding-top: env(safe-area-inset-top);
}

/* ===== 文字色彩 ===== */
.text-xuan {
  color: var(--color-xuan);
}
.text-zhu {
  color: var(--color-zhu);
}
.text-liu {
  color: var(--color-liu);
}
.text-bai {
  color: var(--color-bai);
}
.text-bai-2 {
  color: var(--color-bai-2);
}
.text-bai-3 {
  color: var(--color-bai-3);
}
.text-jin {
  color: var(--color-jin);
}
.text-mu {
  color: var(--color-mu);
}
.text-shui {
  color: var(--color-shui);
}
.text-huo {
  color: var(--color-huo);
}
.text-tu {
  color: var(--color-tu);
}

/* ===== 背景 ===== */
.bg-xuan {
  background: var(--color-xuan);
}
.bg-xuan-2 {
  background: var(--color-xuan-2);
}
.bg-xuan-3 {
  background: var(--color-xuan-3);
}

/* ===== 古风标题 ===== */
.title-mystic {
  font-family: var(--font-mystic, '霞鹜文楷', 'STKaiti', 'KaiTi', '楷体', serif);
  letter-spacing: 0.2em;
  color: var(--color-liu);
  text-shadow: 0 0 12rpx rgba(212, 175, 55, 0.5);
}

.title-xl {
  font-size: var(--fs-3xl);
  font-weight: 700;
  line-height: 1.2;
}
.title-lg {
  font-size: var(--fs-2xl);
  font-weight: 600;
  line-height: 1.3;
}
.title-md {
  font-size: var(--fs-xl);
  font-weight: 600;
  line-height: 1.4;
}
.title-sm {
  font-size: var(--fs-lg);
  font-weight: 500;
}

/* ===== 朱砂按钮 ===== */
.btn-zhu {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-3) var(--sp-5);
  background: linear-gradient(135deg, var(--color-zhu) 0%, #8b1f1a 100%);
  color: var(--color-bai);
  border-radius: var(--r-full);
  font-size: var(--fs-md);
  letter-spacing: 0.1em;
  box-shadow: var(--sh-glow-zhu);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s var(--ease-mystic);
  overflow: hidden;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.btn-zhu::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 30%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.btn-zhu::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--r-full);
  opacity: 0;
  transition: opacity 0.3s var(--ease-mystic);
}

.btn-zhu:active {
  transform: scale(0.97);
  box-shadow: 0 0 16rpx rgba(200, 48, 42, 0.6);
}

.btn-zhu.is-loading {
  opacity: 0.7;
  pointer-events: none;
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-3) var(--sp-5);
  background: transparent;
  color: var(--color-liu);
  border: 1rpx solid rgba(212, 175, 55, 0.4);
  border-radius: var(--r-full);
  font-size: var(--fs-md);
  letter-spacing: 0.1em;
  transition: all 0.3s var(--ease-mystic);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.btn-ghost:active {
  background: rgba(212, 175, 55, 0.1);
  transform: scale(0.97);
}

/* ===== 玄学卡片 ===== */
.card-mystic {
  position: relative;
  background: linear-gradient(180deg, var(--color-xuan-2) 0%, var(--color-xuan) 100%);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-lg);
  padding: var(--sp-4);
  box-shadow: var(--sh-card);
  overflow: hidden;
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
}

/* ===== 卦爻 / 装饰 ===== */
.divider-liu {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin: var(--sp-4) 0;
  color: var(--color-bai-3);
  font-size: var(--fs-sm);
}

.divider-liu::before,
.divider-liu::after {
  content: '';
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
}

/* ===== 太极背景层 ===== */
.taiji-bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg);
  pointer-events: none;
  opacity: 0.15;
}

/* ===== 入场动画 ===== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes rotate360 {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 16rpx rgba(200, 48, 42, 0.3);
  }
  50% {
    box-shadow: 0 0 32rpx rgba(200, 48, 42, 0.7);
  }
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8rpx);
  }
}
@keyframes stamp {
  0% {
    transform: scale(2) rotate(-15deg);
    opacity: 0;
  }
  60% {
    transform: scale(0.95) rotate(2deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(60rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes pulse-soft {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

.anim-fade-up {
  animation: fadeInUp 0.6s var(--ease-mystic) both;
}
.anim-fade {
  animation: fadeIn 0.8s ease both;
}
.anim-rotate {
  animation: rotate360 60s linear infinite;
}
.anim-float {
  animation: float 4s ease-in-out infinite;
}
.anim-pulse {
  animation: pulse-glow 2.4s ease-in-out infinite;
}
.anim-pulse-soft {
  animation: pulse-soft 3s ease-in-out infinite;
}
.anim-stamp {
  animation: stamp 0.6s var(--ease-bounce) both;
}
.anim-slide-in {
  animation: slideInRight 0.5s var(--ease-mystic) both;
}

/* 减少动效偏好：尊重系统设置 */
@media (prefers-reduced-motion: reduce) {
  .anim-fade-up,
  .anim-fade,
  .anim-stamp,
  .anim-slide-in {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
  .anim-rotate,
  .anim-float,
  .anim-pulse,
  .anim-pulse-soft {
    animation: none !important;
  }
  * {
    transition-duration: 0.01ms !important;
  }
}

/* ===== 滚动条隐藏 ===== */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* ============================================================
   响应式断点 · 适配 iPad / 桌面 / 横屏
   ============================================================ */

/* iPad 竖屏及更宽 */
@media (min-width: 768px) {
  :root {
    /* 在大屏上 1rpx 仍按 750 设计稿计算，但视觉过大；
       用 max-width 限制内容宽度居中 */
    --content-max-width: 720px;
  }
  /* 主体内容容器居中（page-level 应用 .container 类） */
  .container {
    max-width: var(--content-max-width);
    margin-left: auto;
    margin-right: auto;
  }
  /* 卡片圆角放大 */
  .card-mystic {
    border-radius: calc(var(--r-lg) * 1.4);
  }
}

/* iPad 横屏 / 桌面 */
@media (min-width: 1024px) {
  :root {
    --content-max-width: 880px;
  }
  .card-mystic {
    border-radius: calc(var(--r-lg) * 1.6);
  }
  /* 字体适度放大 */
  .title-xl {
    font-size: calc(var(--fs-3xl) * 1.1);
  }
  .title-lg {
    font-size: calc(var(--fs-2xl) * 1.1);
  }
}

/* 超宽屏（>1440 桌面） */
@media (min-width: 1440px) {
  :root {
    --content-max-width: 1040px;
  }
  .card-mystic {
    border-radius: calc(var(--r-lg) * 1.8);
  }
}

/* 横屏适配 · 小屏幕 */
@media (max-height: 500px) and (orientation: landscape) {
  /* 横屏时状态栏高度变化 */
  page {
    padding-top: 0;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  /* 触屏：按钮加大命中区 */
  .btn-zhu,
  .btn-ghost {
    min-height: 88rpx;
  }
  /* 禁用悬停态（避免移动端卡顿） */
  .btn-zhu:hover,
  .btn-ghost:hover {
    transform: none;
  }
}
</style>
