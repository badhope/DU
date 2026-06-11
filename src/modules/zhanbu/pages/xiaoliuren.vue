<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="小六壬" subtitle="MINOR LIU REN" />

    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">心 中 默 念</text>
      <text class="form-sub">月 将 加 时 · 大 安 留 连 · 速 喜 赤 口 · 小 吉 空 亡</text>

      <view class="form-row">
        <text class="form-label">月</text>
        <picker
          mode="selector"
          :value="form.month - 1"
          :range="monthRange"
          @change="onPick('month', $event)"
        >
          <view class="form-picker">{{ form.month }} 月</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">日</text>
        <picker mode="number" :value="form.day" :min="1" :max="31" @change="onPick('day', $event)">
          <view class="form-picker">{{ form.day }} 日</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">时</text>
        <picker
          mode="selector"
          :value="form.hour"
          :range="hourRange"
          @change="onPick('hour', $event)"
        >
          <view class="form-picker">{{ form.hour }}:00</view>
        </picker>
      </view>

      <view class="form-row">
        <text class="form-label">所 问</text>
        <view class="question-grid">
          <view
            v-for="q in questions"
            :key="q.key"
            class="q-btn"
            :class="{ active: form.question === q.key }"
            @click="form.question = q.key as any"
          >
            {{ q.label }}
          </view>
        </view>
      </view>

      <view class="form-tip">
        <text>· 心中默念所问之事 · 月 + 日 + 时 起六壬神将</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '起课中…' : '开 始 起 课' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.1">
        <view
          class="shen-card card-mystic anim-fade-up card-hoverable"
          :style="{ borderColor: levelColor }"
        >
          <text class="shen-glyph">{{ result.shen.name }}</text>
          <text class="shen-wx">五行 · {{ result.shen.wuxing }}</text>
          <text class="shen-body">{{ result.shen.bodyPart }}</text>
          <text class="shen-meaning">{{ result.shen.meaning }}</text>
          <view class="shen-stats">
            <text class="ss-label">总评</text>
            <text class="ss-num" :style="{ color: levelColor }">{{ result.shen.totalScore }}</text>
          </view>
        </view>

        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.1s">
          <text class="card-title title-mystic">起 课 信 息</text>
          <view class="info-row">
            <text class="ir-k">总数</text>
            <text class="ir-v">{{ result.total }}</text>
          </view>
          <view class="info-row">
            <text class="ir-k">神将序号</text>
            <text class="ir-v">第 {{ result.shenIndex + 1 }} 位</text>
          </view>
          <view class="info-row">
            <text class="ir-k">三余数</text>
            <text class="ir-v">{{ result.threeRemainder }}</text>
          </view>
          <view class="info-row">
            <text class="ir-k">所问</text>
            <text class="ir-v">{{ result.questionLabel }}</text>
          </view>
        </view>

        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">所 问 之 答</text>
          <text class="answer">{{ result.advice }}</text>
        </view>

        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.2s">
          <text class="card-title title-mystic">六 神 总 览</text>
          <view class="ls-list">
            <view
              v-for="(s, i) in allShen"
              :key="s.key"
              class="ls-row"
              :class="{ active: i === result.shenIndex }"
            >
              <text class="ls-num">{{ i + 1 }}</text>
              <text class="ls-name">{{ s.name }}</text>
              <text class="ls-wx">{{ s.wuxing }}</text>
              <text
                class="ls-score"
                :style="{
                  color:
                    s.totalScore >= 80 ? '#4FAE6F' : s.totalScore >= 60 ? '#D4AF37' : '#C8302A',
                }"
              >
                {{ s.totalScore }}
              </text>
            </view>
          </view>
        </view>

        <view class="form-actions">
          <view class="btn-liu" @click="result = null">重 起 一 课</view>
        </view>
      </ResultReveal>
    </view>
    <!-- 冷却提示 + 添加用户 -->
    <ToolGuard
      :show-cooldown="cd.showCooldown.value"
      :cooldown-record="cd.cooldownRecord.value"
      :show-add-user="cd.showAddUser.value"
      :new-user-name="cd.newUserName.value"
      :new-user-remark="cd.newUserRemark.value"
      @update:newUserName="(v: string) => (cd.newUserName.value = v)"
      @update:newUserRemark="(v: string) => (cd.newUserRemark.value = v)"
      @close="cd.onCooldownClose"
      @switchUser="cd.onCooldownSwitchUser"
      @switchTool="cd.onCooldownSwitchTool"
      @ignore="cd.onCooldownIgnore"
      @cancelAddUser="cd.showAddUser.value = false"
      @confirmAddUser="cd.confirmAddUser"
    />
    <!-- 占卜推演 Loading -->
    <LoadingSeal
      :visible="loading"
      :title="'玄 机 推 演 中'"
      :steps="['清 心 · 凝 神', '观 象 · 感 应', '起 卦 · 演 数', '排 盘 · 归 藏', '解 卦 · 断 事']"
      :duration="2400"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import _LiuRenChart from '@shared/components/charts/LiuRenChart.vue'
import { useAppStore } from '@/stores'
import {
  calcXiaoLiuRen,
  ALL_LIU_SHEN,
  type LiuShen as _LiuShen,
} from '@modules/zhanbu/logic/xiaoliuren'
import _UserSwitcher from '@shared/components/ui/UserSwitcher.vue'
import ToolGuard from '@shared/components/ui/ToolGuard.vue'
import { useCooldown } from '@shared/composables/use-cooldown'
import LoadingSeal from '@shared/components/ui/LoadingSeal.vue'
import ResultReveal from '@shared/components/ui/ResultReveal.vue'

const app = useAppStore()
const cd = useCooldown({ tool: 'xiaoliuren', toolName: '小六壬', category: '占卜' })
const _toolKey = 'xiaoliuren' as const
const form = ref({
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  hour: new Date().getHours(),
  question: 'job' as 'job' | 'wealth' | 'illness' | 'travel' | 'lawsuit' | 'marriage' | 'lost',
})
const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
const hourRange = Array.from({ length: 24 }, (_, i) => i + ':00')
const result = ref<ReturnType<typeof calcXiaoLiuRen> | null>(null)
const loading = ref(false)
const allShen = ALL_LIU_SHEN

const questions = [
  { key: 'job', label: '谋望' },
  { key: 'wealth', label: '求财' },
  { key: 'illness', label: '疾病' },
  { key: 'travel', label: '出行' },
  { key: 'lawsuit', label: '诉讼' },
  { key: 'marriage', label: '婚姻' },
  { key: 'lost', label: '失物' },
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPick(k: string, e: any) {
  const v = e.detail.value
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (k === 'month') (form.value as any).month = Number(v) + 1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else if (k === 'hour') (form.value as any).hour = Number(v.split(':')[0])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else (form.value as any)[k] = Number(v)
}

function calculate() {
  if (!cd.guard()) return
  const m = form.value.month,
    d = form.value.day
  if (m < 1 || m > 12) {
    uni.showToast({ title: '月份需 1-12', icon: 'none' })
    return
  }
  if (d < 1 || d > 31) {
    uni.showToast({ title: '日期需 1-31', icon: 'none' })
    return
  }
  loading.value = true
  setTimeout(() => {
    try {
      result.value = calcXiaoLiuRen(m, d, form.value.hour, form.value.question)
      loading.value = false
      cd.commit(
        `${m}月${d}日 · ${result.value.shen.name} · ${result.value.questionLabel}`,
        { ...form.value },
        { shen: result.value.shen.name, score: result.value.shen.totalScore },
      )
    } catch (_e) {
      loading.value = false
      uni.showModal({ title: '起课失败', content: '请检查日期输入', showCancel: false })
    }
  }, 2400)
}

const levelColor = computed(() => {
  if (!result.value) return '#D4AF37'
  return result.value.shen.totalScore >= 80
    ? '#4FAE6F'
    : result.value.shen.totalScore >= 60
      ? '#D4AF37'
      : result.value.shen.totalScore >= 40
        ? '#C8302A'
        : '#8B1F1A'
})
</script>

<style scoped>
.page {
  position: relative;
  min-height: 100vh;
  padding: 0 var(--sp-3) var(--sp-8);
  overflow: hidden;
}
.taiji-bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg);
}
.form {
  position: relative;
  z-index: var(--z-content);
  margin: var(--sp-3) var(--sp-2);
  padding: var(--sp-4);
  text-align: center;
}
.form-title {
  font-size: var(--fs-2xl);
  display: block;
  margin-bottom: var(--sp-2);
}
.form-sub {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  letter-spacing: 0.1em;
  margin-bottom: var(--sp-4);
}
.form-row {
  display: flex;
  align-items: center;
  padding: var(--sp-2) var(--sp-3);
  margin-bottom: var(--sp-1);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
}
.form-label {
  width: 80rpx;
  text-align: left;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
}
.form-picker {
  flex: 1;
  text-align: left;
  font-size: var(--fs-md);
  color: var(--color-bai);
  padding: var(--sp-1) 0;
}
.question-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6rpx;
}
.q-btn {
  text-align: center;
  padding: var(--sp-1);
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  font-size: var(--fs-sm);
}
.q-btn.active {
  background: var(--color-zhu);
  color: var(--color-bai);
  border-color: var(--color-zhu);
}
.form-tip {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-top: var(--sp-2);
  line-height: 1.6;
}
.form-actions {
  margin-top: var(--sp-4);
  display: flex;
  justify-content: center;
}
.result {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0 var(--sp-2);
}
.shen-card,
.card {
  padding: var(--sp-4);
  text-align: center;
}
.shen-card {
  border: 2rpx solid;
}
.shen-glyph {
  display: block;
  font-size: 100rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 0 20rpx currentColor;
  margin: var(--sp-2) 0;
}
.shen-wx {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-1);
}
.shen-body {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
}
.shen-meaning {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-style: italic;
  line-height: 1.7;
  margin: var(--sp-2) 0;
}
.shen-stats {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--sp-1);
  margin-top: var(--sp-2);
}
.ss-label {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
}
.ss-num {
  font-size: 56rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}
.info-row {
  display: flex;
  gap: var(--sp-2);
  padding: var(--sp-1) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
}
.info-row:last-child {
  border-bottom: 0;
}
.ir-k {
  width: 160rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  text-align: left;
}
.ir-v {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.answer {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.8;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}
.ls-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.ls-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-1) var(--sp-3);
  background: rgba(10, 10, 18, 0.3);
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
}
.ls-row.active {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--color-liu);
}
.ls-num {
  width: 40rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
  text-align: center;
}
.ls-name {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.ls-wx {
  width: 60rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.ls-score {
  flex: 1;
  text-align: right;
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
</style>
