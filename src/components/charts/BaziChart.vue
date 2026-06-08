<template>
  <view class="bzc">
    <!-- 四柱柱状 -->
    <view class="bzc-pillars card-mystic">
      <text class="p-title title-mystic">四 柱 八 字</text>
      <view class="pillars">
        <view
          v-for="(p, i) in pillars"
          :key="i"
          class="pillar-col"
          :class="{ active: activePillar === i }"
          @click="activePillar = i"
        >
          <text class="pcl">{{ p.label }}</text>
          <view class="pct">
            <text class="pct-gan" :style="{ color: wuxingColor(ganWx(p.gan)) }">{{ p.gan }}</text>
            <text class="pct-zhi" :style="{ color: wuxingColor(zhiWx(p.zhi)) }">{{ p.zhi }}</text>
          </view>
          <text class="pcn">{{ p.naYin }}</text>
          <view v-if="p.canggan.length" class="pcc">
            <text
              v-for="(c, j) in p.canggan"
              :key="j"
              class="pcc-gan"
              :style="{ color: wuxingColor(ganWx(c.gan)) }"
            >
              {{ c.gan }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 五行雷达 + 大运 -->
    <view class="bzc-row">
      <view class="bzc-radar card-mystic">
        <text class="b-title title-mystic">五 行 强 弱</text>
        <view class="radar-box">
          <svg :viewBox="`0 0 ${rs} ${rs}`" class="radar-svg">
            <defs>
              <radialGradient :id="uid('rbg')" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stop-color="rgba(212,175,55,0.18)" />
                <stop offset="100%" stop-color="rgba(10,10,18,0.4)" />
              </radialGradient>
              <filter :id="uid('rg')">
                <feGaussianBlur stdDeviation="2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle :cx="rcx" :cy="rcy" :r="rR" fill="url(#{{ uid('rbg') }})" />
            <!-- 五边形 -->
            <polygon
              v-for="i in 4"
              :key="i"
              :points="
                pentagonPoints((i / 4) * 100)
                  .map((p) => `${p.x},${p.y}`)
                  .join(' ')
              "
              fill="none"
              stroke="rgba(212,175,55,0.15)"
              stroke-width="0.5"
            />
            <!-- 五行轴 -->
            <line
              v-for="(p, i) in axes"
              :key="'a' + i"
              :x1="rcx"
              :y1="rcy"
              :x2="p.x"
              :y2="p.y"
              stroke="rgba(212,175,55,0.2)"
              stroke-width="0.5"
            />
            <!-- 数据多边形 -->
            <polygon
              :points="dataPolygon.map((p) => `${p.x},${p.y}`).join(' ')"
              fill="rgba(212,175,55,0.25)"
              stroke="#D4AF37"
              stroke-width="2"
              :filter="`url(#${uid('rg')})`"
            />
            <!-- 节点 -->
            <g v-for="(p, i) in dataPolygon" :key="'p' + i">
              <circle :cx="p.x" :cy="p.y" r="5" :fill="wxColors[i]" />
            </g>
            <!-- 标签 -->
            <text
              v-for="(p, i) in axes"
              :key="'l' + i"
              :x="p.x"
              :y="p.labelY"
              text-anchor="middle"
              font-size="16"
              :fill="wxColors[i]"
              font-weight="bold"
              font-family="serif"
            >
              {{ wxNames[i] }}
            </text>
          </svg>
        </view>
        <view class="r-info">
          <text class="ri-line">
            日主：<text :style="{ color: wuxingColor(dayMasterWx) }">{{ dayMaster }}</text
            >（{{ masterMeta.name }}）
          </text>
          <text class="ri-line">强弱：{{ strengthLevel }}（{{ strengthScore }}）</text>
          <text class="ri-line">
            用神：<text :style="{ color: wuxingColor(yongShen) }">{{ yongShenName }}</text>
          </text>
        </view>
      </view>

      <view class="bzc-dayun card-mystic">
        <text class="b-title title-mystic">大 运 流 转</text>
        <view class="dy-timeline">
          <view
            v-for="(s, i) in dayunSteps"
            :key="i"
            class="dy-step"
            :class="{ active: s.startAge <= currentAge && s.endAge >= currentAge }"
          >
            <text class="dys-age">{{ s.startAge }}-{{ s.endAge }}</text>
            <text class="dys-gz" :style="{ color: wuxingColor(ganWx(s.gan)) }">
              {{ s.gan }}{{ s.zhi }}
            </text>
            <text class="dys-ss">{{ s.shishen }}</text>
            <text class="dys-ny">{{ s.nayin }}</text>
          </view>
        </view>
        <view class="dy-now">
          <text class="dn-label">当前大运</text>
          <text
            v-if="currentStep"
            class="dn-gz"
            :style="{ color: wuxingColor(ganWx(currentStep.gan)) }"
          >
            {{ currentStep.gan }}{{ currentStep.zhi }} · {{ currentStep.shishen }}
          </text>
        </view>
      </view>
    </view>

    <!-- 十神 / 神煞 -->
    <view class="bzc-extras">
      <view class="bzc-shishen card-mystic">
        <text class="b-title title-mystic">十 神 分 布</text>
        <view class="ss-grid">
          <view v-for="(c, i) in shishenCounts" :key="i" class="ss-cell">
            <text class="ssc-name">{{ c.name }}</text>
            <text class="ssc-count">{{ c.count }}</text>
            <view class="ssc-bar">
              <view class="ssc-fill" :style="{ width: Math.min(100, c.count * 25) + '%' }" />
            </view>
          </view>
        </view>
      </view>

      <view class="bzc-shensha card-mystic">
        <text class="b-title title-mystic">神 煞</text>
        <view class="ss-list">
          <view v-for="(s, i) in shensha" :key="i" class="ss-item" :class="['type-' + s.type]">
            <text class="ssi-name">{{ s.name }}</text>
            <text class="ssi-type">{{ s.type }}</text>
            <text class="ssi-desc">{{ s.desc }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  TIANGAN,
  DIZHI,
  TIANGAN_WUXING,
  DIZHI_WUXING,
  calcBazi,
  type TianGan,
  type DiZhi,
} from '@/utils/bazi'
import {
  nayin,
  shensha as shenshaFn,
  shishen,
  calcDayun,
  dayunStrength,
  DIZHI_CANGGAN,
} from '@/utils/bazi-deep'
import { WUXING_META, type Wuxing } from '@/utils/wuxing'
import { polar, uid } from '@/utils/chart-utils'
import type { DayunResult } from '@/utils/bazi-deep'

const props = defineProps<{
  year: number
  month: number
  day: number
  hour: number
  gender: '男' | '女'
}>()

const wxOrder: Wuxing[] = ['mu', 'huo', 'tu', 'jin', 'shui']
const wxNames = ['木', '火', '土', '金', '水']
const wxColors = ['#2F7D4F', '#C8302A', '#A87C4F', '#E8E4D8', '#1B3A5C']

const wuxingColor = (wx: Wuxing) => WUXING_META[wx].color
const ganWx = (g: string) => TIANGAN_WUXING[g as TianGan]
const zhiWx = (z: string) => DIZHI_WUXING[z as DiZhi]

const bazi = computed(() => calcBazi(props.year, props.month, props.day, props.hour))
const dayun = computed<DayunResult>(() =>
  calcDayun(bazi.value, props.gender, props.year, props.month, props.day),
)
const strength = computed(() => dayunStrength(bazi.value))
const shenshaList = computed(() => shenshaFn(bazi.value))

const pillars = computed(() => [
  {
    label: '年柱',
    gan: bazi.value.year.gan,
    zhi: bazi.value.year.zhi,
    naYin: nayin(bazi.value.year.gan, bazi.value.year.zhi).name,
    canggan: DIZHI_CANGGAN[bazi.value.year.zhi].map((g) => ({
      gan: g as TianGan,
      level: '' as any,
    })),
  },
  {
    label: '月柱',
    gan: bazi.value.month.gan,
    zhi: bazi.value.month.zhi,
    naYin: nayin(bazi.value.month.gan, bazi.value.month.zhi).name,
    canggan: DIZHI_CANGGAN[bazi.value.month.zhi].map((g) => ({
      gan: g as TianGan,
      level: '' as any,
    })),
  },
  {
    label: '日柱',
    gan: bazi.value.day.gan,
    zhi: bazi.value.day.zhi,
    naYin: nayin(bazi.value.day.gan, bazi.value.day.zhi).name,
    canggan: DIZHI_CANGGAN[bazi.value.day.zhi].map((g) => ({
      gan: g as TianGan,
      level: '' as any,
    })),
  },
  {
    label: '时柱',
    gan: bazi.value.hour.gan,
    zhi: bazi.value.hour.zhi,
    naYin: nayin(bazi.value.hour.gan, bazi.value.hour.zhi).name,
    canggan: DIZHI_CANGGAN[bazi.value.hour.zhi].map((g) => ({
      gan: g as TianGan,
      level: '' as any,
    })),
  },
])

const activePillar = ref(2)
const dayMaster = computed(() => bazi.value.day.gan)
const dayMasterWx = computed(() => TIANGAN_WUXING[bazi.value.day.gan])
const masterMeta = computed(() => WUXING_META[dayMasterWx.value])
const strengthLevel = computed(() => strength.value.level)
const strengthScore = computed(() => strength.value.score)
const yongShen = computed(() => strength.value.yong)
const yongShenName = computed(() => WUXING_META[strength.value.yong].name)

// 五行统计
const wxCounts = computed(() => {
  const c: Record<Wuxing, number> = { mu: 0, huo: 0, tu: 0, jin: 0, shui: 0 }
  const all = [
    bazi.value.year.gan,
    bazi.value.month.gan,
    bazi.value.day.gan,
    bazi.value.hour.gan,
    bazi.value.year.zhi,
    bazi.value.month.zhi,
    bazi.value.day.zhi,
    bazi.value.hour.zhi,
  ]
  all.forEach((v) => {
    c[TIANGAN_WUXING[v as TianGan] || DIZHI_WUXING[v as DiZhi]]++
  })
  return c
})

// 雷达
const rs = 320
const rcx = rs / 2
const rcy = rs / 2
const rR = 130
const axes = computed(() =>
  wxOrder.map((_, i) => {
    const angle = (360 / 5) * i - 90
    const p = polar(rcx, rcy, rR + 8, angle)
    return {
      x: p.x,
      y: p.y,
      labelY: p.y + (angle === -90 || angle === 90 ? 0 : angle < 90 && angle > -90 ? 16 : -8),
    }
  }),
)

const pentagonPoints = (scale: number) =>
  wxOrder.map((_, i) => {
    const angle = (360 / 5) * i - 90
    return polar(rcx, rcy, rR * scale, angle)
  })

const dataPolygon = computed(() => {
  const max = Math.max(...Object.values(wxCounts.value), 1)
  return wxOrder.map((k, i) => {
    const v = wxCounts.value[k] / max
    const angle = (360 / 5) * i - 90
    return polar(rcx, rcy, rR * v, angle)
  })
})

// 十神
const shishenCounts = computed(() => {
  const dayGan = bazi.value.day.gan
  const allGan = [bazi.value.year.gan, bazi.value.month.gan, bazi.value.hour.gan]
  const counts: Record<string, number> = {}
  allGan.forEach((g) => {
    const ss = shishen(dayGan, g as TianGan)
    counts[ss] = (counts[ss] || 0) + 1
  })
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const shensha = computed(() => shenshaList.value)

const dayunSteps = computed(() => dayun.value.steps.slice(0, 8))
const currentAge = new Date().getFullYear() - props.year
const currentStep = computed(() =>
  dayun.value.steps.find((s) => currentAge >= s.startAge && currentAge <= s.endAge),
)
</script>

<style scoped>
.bzc {
  padding: 8rpx;
}
.bzc-pillars,
.bzc-radar,
.bzc-dayun,
.bzc-shishen,
.bzc-shensha {
  background: rgba(20, 20, 28, 0.5);
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  margin-bottom: 16rpx;
}
.p-title,
.b-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  margin-bottom: 16rpx;
  font-family: serif;
}
.pillars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}
.pillar-col {
  padding: 16rpx 8rpx;
  background: rgba(10, 10, 18, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: 12rpx;
  text-align: center;
  transition: all 0.2s;
}
.pillar-col.active {
  border-color: var(--color-liu, #d4af37);
  background: rgba(212, 175, 55, 0.1);
}
.pcl {
  display: block;
  font-size: 22rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.pct {
  padding: 12rpx 0;
}
.pct-gan,
.pct-zhi {
  display: block;
  font-size: 64rpx;
  font-weight: bold;
  font-family: serif;
  line-height: 1.1;
}
.pcn {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-3, #6b6655);
  margin-top: 4rpx;
}
.pcc {
  display: flex;
  justify-content: center;
  gap: 8rpx;
  margin-top: 8rpx;
}
.pcc-gan {
  font-size: 22rpx;
  font-weight: bold;
  font-family: serif;
}
.bzc-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}
@media (max-width: 600px) {
  .bzc-row {
    grid-template-columns: 1fr;
  }
}
.radar-box {
  display: flex;
  justify-content: center;
  padding: 8rpx 0;
}
.radar-svg {
  width: 100%;
  max-width: 480rpx;
  height: auto;
}
.r-info {
  padding: 8rpx 0;
}
.ri-line {
  display: block;
  font-size: 26rpx;
  color: var(--color-bai-2, #b8b2a0);
  padding: 4rpx 0;
}
.dy-timeline {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.dy-step {
  padding: 12rpx;
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: 8rpx;
  border-left: 4rpx solid transparent;
}
.dy-step.active {
  border-left-color: var(--color-liu, #d4af37);
  background: rgba(212, 175, 55, 0.1);
}
.dys-age {
  display: inline-block;
  font-size: 20rpx;
  color: var(--color-bai-3, #6b6655);
  width: 80rpx;
}
.dys-gz {
  display: inline-block;
  font-size: 32rpx;
  font-weight: bold;
  font-family: serif;
  margin-left: 12rpx;
}
.dys-ss {
  display: inline-block;
  font-size: 20rpx;
  color: var(--color-bai-2, #b8b2a0);
  margin-left: 12rpx;
}
.dys-ny {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-3, #6b6655);
  margin-top: 2rpx;
}
.dy-now {
  margin-top: 12rpx;
  padding: 12rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 8rpx;
}
.dn-label {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.dn-gz {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  font-family: serif;
  margin-top: 4rpx;
}
.bzc-extras {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}
@media (max-width: 600px) {
  .bzc-extras {
    grid-template-columns: 1fr;
  }
}
.ss-grid {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.ss-cell {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 6rpx 0;
}
.ssc-name {
  width: 90rpx;
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
}
.ssc-count {
  width: 50rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
.ssc-bar {
  flex: 1;
  height: 10rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 5rpx;
  overflow: hidden;
}
.ssc-fill {
  height: 100%;
  background: linear-gradient(90deg, #d4af37, #e04a3a);
  border-radius: 5rpx;
  transition: width 0.6s;
}
.ss-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.ss-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 10rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
}
.ss-item.type-吉 {
  background: rgba(212, 175, 55, 0.1);
}
.ss-item.type-凶 {
  background: rgba(200, 48, 42, 0.1);
}
.ss-item.type-中 {
  background: rgba(91, 58, 142, 0.1);
}
.ssi-name {
  font-weight: bold;
  min-width: 100rpx;
}
.ssi-type {
  padding: 0 8rpx;
  border-radius: 4rpx;
  font-size: 18rpx;
}
.ss-item.type-吉 .ssi-type {
  background: var(--color-liu, #d4af37);
  color: var(--color-xuan, #0a0a12);
}
.ss-item.type-凶 .ssi-type {
  background: var(--color-zhu, #c8302a);
  color: var(--color-bai, #f5f1e8);
}
.ss-item.type-中 .ssi-type {
  background: var(--color-zi, #5b3a8e);
  color: var(--color-bai, #f5f1e8);
}
.ssi-desc {
  flex: 1;
  color: var(--color-bai-2, #b8b2a0);
}
</style>
