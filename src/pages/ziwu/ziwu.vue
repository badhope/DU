<template>
  <view class="ziwu-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="子午流注" subtitle="MIDNIGHT-NOON EBB" />

    <!-- 模式选择 -->
    <view class="tab-bar anim-fade-up">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="tab-btn"
        :class="{ active: tab === t.key }"
        @click="tab = t.key as Mode"
      >
        <text class="tab-name">{{ t.name }}</text>
        <text class="tab-sub">{{ t.sub }}</text>
      </view>
    </view>

    <!-- 当前时辰 -->
    <view v-if="tab === 'now'" class="now-card card-mystic anim-fade-up">
      <text class="now-time">{{ currentTime }}</text>
      <text class="now-zhi">· {{ currentJing.zhiName }}（{{ currentJing.shengxiao }}时）·</text>
      <text class="now-jing" :style="{ color: '#D4AF37' }"
        >
{{ currentJing.jingluoName }}（{{ currentJing.organ }}）
</text
      >
      <text class="now-state">{{ currentJing.qiState }}：{{ currentJing.principle }}</text>
      <view class="now-bests">
        <text class="nb-title">· 宜</text>
        <view class="nb-tags">
          <text v-for="(b, i) in currentJing.bestActivity" :key="i" class="nb-tag good">
{{
            b
          }}
</text>
        </view>
      </view>
      <view class="now-bests">
        <text class="nb-title bad">· 忌</text>
        <view class="nb-tags">
          <text v-for="(a, i) in currentJing.avoidActivity" :key="i" class="nb-tag bad">
{{
            a
          }}
</text>
        </view>
      </view>
      <view v-if="lgPoint.acupoint" class="linggui">
        <text class="lg-title">· 灵龟八法开穴</text>
        <text class="lg-pt">{{ lgPoint.acupoint }}（{{ lgPoint.function }}）</text>
        <view class="lg-ind">
          <text v-for="(s, i) in lgPoint.indications" :key="i" class="lg-ind-tag">{{ s }}</text>
        </view>
      </view>
    </view>

    <!-- 12 时辰 -->
    <view v-else-if="tab === 'table'" class="result anim-fade-up">
      <view class="card card-mystic" style="margin-bottom: 16rpx">
        <ZiWuLiuZhuChart :current-hour="new Date().getHours()" />
      </view>
      <text class="table-title">· 12 时辰经脉开阖表</text>
      <view class="zlist">
        <view
          v-for="(z, i) in HOURLY_JING"
          :key="i"
          class="z-card"
          :class="{ active: z.zhi === currentJing.zhi }"
          @click="selectZhi(z.zhi)"
        >
          <view class="z-head">
            <text class="z-sx">{{ z.shengxiao }}</text>
            <view class="z-zhi-wrap">
              <text class="z-zhi">{{ z.zhi }}</text>
              <text class="z-zname">{{ z.zhiName }}</text>
            </view>
            <text class="z-time">{{ z.hourRange }}</text>
          </view>
          <view class="z-body">
            <view class="z-info">
              <text
                class="z-jlname"
                :style="{ color: z.qiState === '旺' ? '#4FAE6F' : '#D4AF37' }"
                >
{{ z.jingluoName }}
</text
              >
              <text class="z-organ">（{{ z.organ }}）</text>
            </view>
            <text class="z-prin">{{ z.principle }}</text>
            <view class="z-act">
              <text class="act-label">宜</text>
              <text v-for="(b, k) in z.bestActivity" :key="'b' + k" class="act-tag good">
{{
                b
              }}
</text>
            </view>
            <view class="z-act">
              <text class="act-label">忌</text>
              <text v-for="(a, k) in z.avoidActivity" :key="'a' + k" class="act-tag bad">
{{
                a
              }}
</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 灵龟八法 -->
    <view v-else class="result anim-fade-up">
      <text class="table-title">· 灵龟八法 · 八脉交会</text>
      <view class="lg-intro card-mystic">
        <text class="lg-info-title">· 八法流注</text>
        <text class="lg-info-text"
          >
灵龟八法按八脉交会穴按时辰顺序开阖，每 2 小时轮换一穴，临床用于按时取穴。
</text
        >
      </view>
      <view class="lg-grid">
        <view
          v-for="(p, i) in LINGGUI_POINTS"
          :key="i"
          class="lg-card card-mystic"
          :class="{ open: openLg === i }"
          @click="openLg = openLg === i ? -1 : i"
        >
          <view class="lg-card-head">
            <view class="lg-sym">{{ p.gao.gan }}{{ p.gao.zhi }}</view>
            <view class="lg-card-info">
              <text class="lg-jl">{{ p.jingluo }}</text>
              <text class="lg-pt-name">{{ p.acupoint }}</text>
            </view>
          </view>
          <text class="lg-qj">奇经：{{ p.qijing }}</text>
          <text class="lg-fn">{{ p.function }}</text>
          <view v-if="openLg === i" class="lg-card-body anim-fade">
            <text class="lg-ind-title">· 主治</text>
            <view class="lg-ind-list">
              <text v-for="(s, k) in p.indications" :key="k" class="lg-ind-tag">{{ s }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import ZiWuLiuZhuChart from '@/components/charts/ZiWuLiuZhuChart.vue'
import { useAppStore } from '@/stores'
import { HOURLY_JING, LINGGUI_POINTS, currentHourlyJing, lingguiOpen } from '@/utils/jingluo'

const app = useAppStore()

type Mode = 'now' | 'table' | 'linggui'
const tab = ref<Mode>('now')
const openLg = ref(-1)

const tabs = [
  { key: 'now', name: '当前', sub: 'NOW' },
  { key: 'table', name: '时辰', sub: '12 HOURS' },
  { key: 'linggui', name: '灵龟', sub: 'LING GUI' },
]

const now = ref(new Date())
let timer: any

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 60000)
})
onUnmounted(() => {
  clearInterval(timer)
})

const currentJing = computed(() => currentHourlyJing(now.value.getHours()))
const currentTime = computed(
  () =>
    `${String(now.value.getHours()).padStart(2, '0')}:${String(now.value.getMinutes()).padStart(2, '0')}`,
)
const lgPoint = computed(() => lingguiOpen(now.value.getHours()))

function selectZhi(zhi: string) {
  const z = HOURLY_JING.find((h) => h.zhi === zhi)
  if (z) {
    app.addHistory({
      tool: 'ziwu',
      toolName: '子午流注',
      category: '健康',
      input: { zhi },
      output: { jingluo: z.jingluoName },
      brief: `${z.zhiName} · ${z.jingluoName}`,
    })
  }
}
</script>

<style scoped>
.ziwu-page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}
.tab-bar {
  display: flex;
  gap: var(--sp-2);
  margin: var(--sp-2) var(--sp-2) 0;
  padding: 4rpx;
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}
.tab-btn {
  flex: 1;
  text-align: center;
  padding: var(--sp-2) 0;
  border-radius: var(--r-sm);
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.tab-btn.active {
  background: linear-gradient(135deg, #1b3a5c, #4fae6f);
  color: var(--color-bai);
}
.tab-name {
  font-size: var(--fs-sm);
  font-weight: 600;
}
.tab-sub {
  font-size: 18rpx;
  color: var(--color-bai-3);
}
.tab-btn.active .tab-sub {
  color: var(--color-bai);
  opacity: 0.8;
}

.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: 0 var(--sp-2);
  margin-top: var(--sp-2);
}
.card-mystic {
  padding: var(--sp-4);
}

.now-card {
  padding: var(--sp-5) var(--sp-4);
}
.now-time {
  display: block;
  text-align: center;
  font-size: 100rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
  text-shadow: 0 0 30rpx rgba(212, 175, 55, 0.5);
}
.now-zhi {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-bai);
  margin: var(--sp-2) 0;
  font-family: 'KaiTi', serif;
}
.now-jing {
  display: block;
  text-align: center;
  font-size: var(--fs-lg);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.now-state {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin: var(--sp-2) 0;
  line-height: 1.7;
}
.now-bests {
  margin: var(--sp-3) 0;
}
.nb-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-bottom: 4rpx;
}
.nb-title.bad {
  color: #c8302a;
}
.nb-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
}
.nb-tag {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
}
.nb-tag.good {
  background: rgba(79, 174, 111, 0.2);
  color: #8fd0a8;
}
.nb-tag.bad {
  background: rgba(200, 48, 42, 0.2);
  color: #f5c5c0;
}
.linggui {
  margin-top: var(--sp-3);
  padding: var(--sp-3);
  background: rgba(91, 58, 142, 0.2);
  border-radius: var(--r-sm);
  border: 1rpx dashed rgba(91, 58, 142, 0.5);
}
.lg-title {
  display: block;
  font-size: var(--fs-sm);
  color: #c8b5e8;
  margin-bottom: 4rpx;
}
.lg-pt {
  display: block;
  font-size: var(--fs-md);
  color: #c8b5e8;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: 4rpx;
}
.lg-ind {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
}
.lg-ind-tag {
  padding: 2rpx 8rpx;
  font-size: 20rpx;
  background: rgba(91, 58, 142, 0.3);
  color: #c8b5e8;
  border-radius: 6rpx;
}

.table-title {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-liu);
  margin-bottom: var(--sp-2);
  letter-spacing: 0.2em;
}
.zlist {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.z-card {
  background: rgba(10, 10, 18, 0.6);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
  overflow: hidden;
  cursor: pointer;
}
.z-card.active {
  border-color: var(--color-liu);
  box-shadow: 0 0 16rpx rgba(212, 175, 55, 0.3);
}
.z-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  background: rgba(20, 20, 28, 0.5);
}
.z-sx {
  font-size: 32rpx;
}
.z-zhi-wrap {
  display: flex;
  flex-direction: column;
}
.z-zhi {
  font-size: 40rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
}
.z-zname {
  font-size: 20rpx;
  color: var(--color-bai-3);
}
.z-time {
  margin-left: auto;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.z-body {
  padding: var(--sp-3) var(--sp-4);
}
.z-info {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  margin-bottom: 4rpx;
}
.z-jlname {
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.z-organ {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.z-prin {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  line-height: 1.6;
  margin-bottom: 4rpx;
}
.z-act {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4rpx;
  margin: 2rpx 0;
}
.act-label {
  font-size: 20rpx;
  color: var(--color-liu);
}
.act-tag {
  padding: 2rpx 8rpx;
  font-size: 20rpx;
  border-radius: 4rpx;
}
.act-tag.good {
  background: rgba(79, 174, 111, 0.15);
  color: #8fd0a8;
}
.act-tag.bad {
  background: rgba(200, 48, 42, 0.15);
  color: #f5c5c0;
}

.lg-intro {
  padding: var(--sp-3);
  margin-bottom: var(--sp-2);
}
.lg-info-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-bottom: 4rpx;
}
.lg-info-text {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.6;
}
.lg-grid {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.lg-card {
  padding: var(--sp-3);
  cursor: pointer;
}
.lg-card.open {
  border-color: var(--color-liu);
}
.lg-card-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.lg-sym {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #5b3a8e, #1b3a5c);
  color: var(--color-bai);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 8rpx rgba(255, 255, 255, 0.4);
}
.lg-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.lg-jl {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.lg-pt-name {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.lg-qj {
  display: block;
  font-size: var(--fs-xs);
  color: #c8b5e8;
  margin-top: 4rpx;
}
.lg-fn {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin-top: 4rpx;
}
.lg-card-body {
  margin-top: var(--sp-2);
  padding-top: var(--sp-2);
  border-top: 1rpx solid rgba(212, 175, 55, 0.1);
}
.lg-ind-title {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-liu);
  margin-bottom: 4rpx;
}
.lg-ind-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
}
</style>
