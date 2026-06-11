<!--
  玄枢 MISTVERSE · 星辰背景
  - 60 颗随机位置星辰，闪烁呼吸
  - 适用页面背景
-->
<template>
  <view class="sf-host" :class="`sf-${density}`" aria-hidden="true">
    <view
      v-for="s in stars"
      :key="s.id"
      class="sf-star"
      :class="['sf-' + s.size, 'sf-c-' + s.color]"
      :style="{
        top: s.top + '%',
        left: s.left + '%',
        animationDelay: s.delay + 's',
        animationDuration: s.dur + 's',
      }"
    />
    <view v-if="shooting" class="sf-meteor" :style="meteorStyle" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 数量 */
    count?: number
    /** 密度：low / mid / high */
    density?: 'low' | 'mid' | 'high'
    /** 颜色 */
    colors?: 'gold' | 'white' | 'mixed'
    /** 是否有流星 */
    shooting?: boolean
  }>(),
  {
    count: 50,
    density: 'mid',
    colors: 'mixed',
    shooting: true,
  },
)

const COLORS = {
  gold: ['#D4AF37', '#F5E6A8', '#B8941F'],
  white: ['#F5F1E8', '#B8B2A0', '#FFFFFF'],
  mixed: ['#D4AF37', '#F5F1E8', '#5B3A8E', '#2F7D4F', '#C8302A'],
}

const actualCount = computed(() => {
  const m = props.density === 'low' ? 0.5 : props.density === 'high' ? 1.6 : 1
  return Math.floor(props.count * m)
})

interface Star {
  id: number
  top: number
  left: number
  size: 'sm' | 'md' | 'lg'
  color: number
  delay: number
  dur: number
}
const stars = ref<Star[]>([])

function genStars() {
  const c = COLORS[props.colors]!
  const out: Star[] = []
  for (let i = 0; i < actualCount.value; i++) {
    out.push({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() < 0.7 ? 'sm' : Math.random() < 0.9 ? 'md' : 'lg',
      color: Math.floor(Math.random() * c.length),
      delay: Math.random() * 4,
      dur: 1.8 + Math.random() * 3.4,
    })
  }
  stars.value = out
}

const meteorStyle = ref({})
function genMeteor() {
  const startX = Math.random() * 60
  const startY = Math.random() * 30
  const endX = startX + 30 + Math.random() * 20
  const endY = startY + 50 + Math.random() * 30
  meteorStyle.value = {
    top: startY + '%',
    left: startX + '%',
    '--sx': endX + 'vw',
    '--sy': endY + 'vh',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let meteorTimer: any = null
onMounted(() => {
  genStars()
  if (props.shooting) {
    meteorTimer = setInterval(
      () => {
        genMeteor()
      },
      6000 + Math.random() * 6000,
    )
  }
})
onBeforeUnmount(() => {
  if (meteorTimer) clearInterval(meteorTimer)
})
</script>

<style scoped>
.sf-host {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.sf-star {
  position: absolute;
  border-radius: 50%;
  background: rgba(245, 241, 232, 0.8);
  box-shadow: 0 0 4rpx rgba(245, 241, 232, 0.6);
  animation: sfTwinkle infinite ease-in-out;
}
.sf-sm {
  width: 2rpx;
  height: 2rpx;
}
.sf-md {
  width: 4rpx;
  height: 4rpx;
}
.sf-lg {
  width: 6rpx;
  height: 6rpx;
  box-shadow: 0 0 8rpx currentColor;
}
.sf-c-0 {
  background: #d4af37;
  box-shadow: 0 0 6rpx #d4af37;
}
.sf-c-1 {
  background: #f5f1e8;
  box-shadow: 0 0 4rpx #f5f1e8;
}
.sf-c-2 {
  background: #b8941f;
  box-shadow: 0 0 6rpx #b8941f;
}
.sf-c-3 {
  background: #5b3a8e;
  box-shadow: 0 0 6rpx #5b3a8e;
}
.sf-c-4 {
  background: #c8302a;
  box-shadow: 0 0 6rpx #c8302a;
}
@keyframes sfTwinkle {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.6);
  }
  50% {
    opacity: 1;
    transform: scale(1.4);
  }
}

/* 流星 */
.sf-meteor {
  position: absolute;
  width: 4rpx;
  height: 4rpx;
  background: linear-gradient(45deg, #ffffff, #d4af37, transparent);
  border-radius: 50%;
  box-shadow:
    0 0 12rpx #d4af37,
    0 0 24rpx #ffffff;
  animation: meteorFly 1.4s ease-out forwards;
  transform: translate(0, 0) rotate(35deg);
}
@keyframes meteorFly {
  0% {
    transform: translate(0, 0) rotate(35deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translate(40vw, 60vh) rotate(35deg);
    opacity: 0;
  }
}
</style>
