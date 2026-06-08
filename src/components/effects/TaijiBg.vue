<template>
  <view class="taiji-stage">
    <!-- 远景星云：径向渐变（去 blur 提升低端机性能） -->
    <view class="nebula" />
    <!-- 粒子：8 个光点漂浮（减半） -->
    <view
      v-for="(p, i) in particles"
      :key="i"
      class="particle"
      :style="{
        left: p.x + '%',
        top:  p.y + '%',
        width: p.size + 'rpx',
        height: p.size + 'rpx',
        animationDuration: p.dur + 's',
        animationDelay: p.delay + 's',
        background: p.color,
        boxShadow: '0 0 ' + (p.size * 2) + 'rpx ' + p.color,
      }"
    />
    <!-- 太极图：缓慢旋转 -->
    <view class="taiji anim-rotate">
      <view class="taiji-svg-wrap">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="taijiGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stop-color="#D4AF37" stop-opacity="0.6" />
              <stop offset="60%" stop-color="#0A0A12" stop-opacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="100" fill="url(#taijiGlow)" />
          <path d="M100,0 A100,100 0 0,1 100,200 A50,50 0 0,1 100,100 A50,50 0 0,0 100,0 Z" fill="#F5F1E8" />
          <path d="M100,0 A100,100 0 0,0 100,200 A50,50 0 0,0 100,100 A50,50 0 0,1 100,0 Z" fill="#0A0A12" />
          <circle cx="100" cy="50" r="8" fill="#0A0A12" />
          <circle cx="100" cy="150" r="8" fill="#F5F1E8" />
        </svg>
      </view>
    </view>
    <!-- 顶部光晕（用 opacity 替代 blur） -->
    <view class="halo" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const particles = ref<Array<{ x: number, y: number, size: number, dur: number, delay: number, color: string }>>([])

const COLORS = ['#D4AF37', '#C8302A', '#5B3A8E', '#1F4E4A', '#F5F1E8']

// 8 个粒子（原 12），分布更均匀减少热点
onMounted(() => {
  const COUNT = 8
  for (let i = 0; i < COUNT; i++) {
    // 用分布函数让粒子分散更均匀
    const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.5
    const radius = 0.15 + Math.random() * 0.7
    particles.value.push({
      x: 50 + Math.cos(angle) * radius * 50,
      y: 50 + Math.sin(angle) * radius * 50,
      size: 4 + Math.random() * 6,
      dur: 10 + Math.random() * 8,
      delay: Math.random() * 4,
      color: COLORS[i % COLORS.length],
    })
  }
})
</script>

<style scoped>
.taiji-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  /* 启用 GPU 合成层 */
  transform: translateZ(0);
  will-change: transform;
}

.nebula {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(ellipse 60% 50% at 30% 30%, rgba(91, 58, 142, 0.25) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 70% 70%, rgba(31, 78, 74, 0.20) 0%, transparent 60%),
    radial-gradient(ellipse 40% 30% at 50% 50%, rgba(200, 48, 42, 0.12) 0%, transparent 60%);
  /* 移除 blur：用径向渐变本身已足够柔和 */
  /* filter: blur(20rpx); */
}

.particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.6;
  animation: drift 12s ease-in-out infinite;
  /* GPU 加速 */
  will-change: transform, opacity;
  transform: translateZ(0);
}

@keyframes drift {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
  25%      { transform: translate(20rpx, -30rpx) scale(1.2); opacity: 0.8; }
  50%      { transform: translate(-15rpx, 25rpx) scale(0.9); opacity: 0.5; }
  75%      { transform: translate(30rpx, 15rpx) scale(1.1); opacity: 0.7; }
}

.taiji {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 600rpx;
  height: 600rpx;
  transform: translate(-50%, -50%);
  opacity: 0.35;
  /* GPU 加速 */
  will-change: transform;
}

.taiji-svg-wrap {
  width: 100%;
  height: 100%;
}

.halo {
  position: absolute;
  top: -100rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 800rpx;
  height: 600rpx;
  background: radial-gradient(ellipse, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
  /* blur 减半：性能更友好 */
  filter: blur(20rpx);
  will-change: transform;
}

/* 减少动效偏好：尊重系统设置 */
@media (prefers-reduced-motion: reduce) {
  .taiji, .particle, .halo {
    animation: none !important;
  }
}
</style>
