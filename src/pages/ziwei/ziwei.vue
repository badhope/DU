<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="紫微斗数" subtitle="PURPLE STAR ASTROLOGY" />

    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">请 输 入 生 辰</text>
      <text class="form-sub">十 四 主 星 · 十 二 宫 位 · 四 化 飞 星</text>

      <view class="form-row">
        <text class="form-label">年</text>
        <picker
          mode="number"
          :value="form.year"
          :min="1900"
          :max="2010"
          @change="onPick('year', $event)"
        >
          <view class="form-picker">{{ form.year }} 年</view>
        </picker>
      </view>
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
        <text class="form-label">性 别</text>
        <view class="gender">
          <view
            v-for="g in ['男', '女']"
            :key="g"
            class="g-btn"
            :class="{ active: form.gender === g }"
            @click="form.gender = g as any"
          >
            {{ g }}
          </view>
        </view>
      </view>

      <view class="form-tip">
        <text>· 14 主星 × 12 宫 × 四化飞星 · 流年大运 5 年推演</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '排盘中…' : '开 始 排 盘' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.1">
        <!-- 用户切换器 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="margin-bottom: 16rpx">
          <UserSwitcher tool="ziwei" @addUser="cd.onAddUser" @select="cd.switchUser" />
        </view>

        <!-- 命格总览 -->
        <view class="overview card-mystic card-hoverable anim-fade-up">
          <text class="card-title title-mystic">{{ result.mingGe }}</text>
          <text class="ov-sub">
            {{ result.wuju }} · 年干 {{ result.yearGan }} · 命宫 {{ result.mingGong.zhi }}
          </text>
          <text class="ov-summary">{{ result.summary }}</text>
          <view class="score-grid">
            <view v-for="(s, i) in scoreList" :key="i" class="s-cell">
              <text class="s-name">{{ s.name }}</text>
              <view class="s-bar">
                <view class="s-fill" :style="{ width: s.val + '%', background: s.color }" />
              </view>
              <text class="s-val" :style="{ color: s.color }">{{ s.val }}</text>
            </view>
          </view>
        </view>

        <!-- 紫微命盘可视化（核心） -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.08s">
          <text class="card-title title-mystic">紫 微 斗 数 · 命 盘 可 视 化</text>
          <ZiweiChart :result="result" />
        </view>

        <!-- 命宫详批 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">命 宫 详 批</text>
          <text class="interp-text">{{ result.mingGong.interpretation }}</text>
          <view v-if="result.mingGong.mainStars.length" class="star-info">
            <text class="si-title">{{ result.mingGong.mainStars[0] }} · 详细</text>
            <text class="si-line">{{ STAR_META[result.mingGong.mainStars[0]].desc }}</text>
            <text class="si-line">德性：{{ STAR_META[result.mingGong.mainStars[0]].virtue }}</text>
            <text class="si-line">缺陷：{{ STAR_META[result.mingGong.mainStars[0]].flaw }}</text>
          </view>
        </view>

        <!-- 流年大运 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.2s">
          <text class="card-title title-mystic">流 年 大 运 · 未 来 五 年</text>
          <view class="yl-list">
            <view v-for="(y, i) in result.yearly" :key="i" class="yl-row">
              <text class="yl-year">{{ y.year }}</text>
              <text class="yl-gz">{{ y.gan }}{{ y.zhi }}</text>
              <text class="yl-high">{{ y.highlight }}</text>
            </view>
          </view>
        </view>

        <view class="form-actions">
          <view class="btn-liu" @click="result = null">重 新 排 盘</view>
        </view>
      </ResultReveal>
    </view>

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
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import UserSwitcher from '@/components/ui/UserSwitcher.vue'
import ToolGuard from '@/components/ui/ToolGuard.vue'
import ZiweiChart from '@/components/charts/ZiweiChart.vue'
import { useAppStore } from '@/stores'
import { calcZiwei, STAR_META, GONG_NAMES as _GONG_NAMES, type ZiweiResult } from '@/utils/ziwei'
import { useCooldown } from '@/utils/use-cooldown'
import LoadingSeal from '@/components/ui/LoadingSeal.vue'
import ResultReveal from '@/components/ui/ResultReveal.vue'

const app = useAppStore()
const cd = useCooldown({ tool: 'ziwei', toolName: '紫微斗数', category: '命理' })
const form = ref({ year: 1990, month: 6, day: 15, hour: 12, gender: '男' as '男' | '女' })
const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
const hourRange = Array.from({ length: 24 }, (_, i) => i + ':00')
const result = ref<ZiweiResult | null>(null)
const loading = ref(false)

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
  const y = form.value.year,
    m = form.value.month,
    d = form.value.day
  if (y < 1900 || y > 2100) {
    uni.showToast({ title: '年份需 1900-2100', icon: 'none' })
    return
  }
  if (m < 1 || m > 12) {
    uni.showToast({ title: '月份需 1-12', icon: 'none' })
    return
  }
  const dim = new Date(y, m, 0).getDate()
  if (d < 1 || d > dim) {
    uni.showToast({ title: `${m}月只有${dim}天`, icon: 'none' })
    return
  }
  loading.value = true
  setTimeout(() => {
    try {
      const r = calcZiwei(y, m, d, form.value.hour, form.value.gender)
      result.value = r
      cd.commit(
        `${y}年 · ${r.mingGe} · ${r.wuju}`,
        { ...form.value },
        { mingGe: r.mingGe, wuju: r.wuju, mingGong: r.mingGong.zhi },
      )
    } catch (e) {
      uni.showModal({ title: '紫微排盘失败', content: '请检查生辰', showCancel: false })
    } finally {
      loading.value = false
    }
  }, 2400)
}

const scoreList = computed(() =>
  result.value
    ? [
        { name: '事业', val: result.value.scores.career, color: '#D4AF37' },
        { name: '财帛', val: result.value.scores.wealth, color: '#C8302A' },
        { name: '婚姻', val: result.value.scores.relationship, color: '#5B3A8E' },
        { name: '健康', val: result.value.scores.health, color: '#4FAE6F' },
        { name: '人际', val: result.value.scores.social, color: '#1B3A5C' },
      ]
    : [],
)
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
.gender {
  flex: 1;
  display: flex;
  gap: var(--sp-2);
}
.g-btn {
  flex: 1;
  text-align: center;
  padding: var(--sp-2);
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.g-btn.active {
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
  gap: var(--sp-3);
  flex-wrap: wrap;
}
.result {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0 var(--sp-2);
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}
.ov-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-bottom: var(--sp-2);
}
.ov-summary {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.6;
  text-align: center;
  margin-bottom: var(--sp-3);
}
.score-grid {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.s-cell {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.s-name {
  width: 70rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.s-bar {
  flex: 1;
  height: 18rpx;
  background: rgba(10, 10, 18, 0.6);
  border-radius: var(--r-full);
  overflow: hidden;
}
.s-fill {
  height: 100%;
  transition: width 0.8s var(--ease-bounce);
  box-shadow: 0 0 6rpx currentColor;
}
.s-val {
  width: 50rpx;
  text-align: right;
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.palace-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6rpx;
}
.palace {
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-sm);
  text-align: center;
  min-height: 100rpx;
}
.palace.is-ming {
  background: rgba(212, 175, 55, 0.18);
  border-color: var(--color-liu);
  box-shadow: var(--sh-glow-liu);
}
.palace.is-shen {
  background: rgba(91, 58, 142, 0.18);
  border-color: var(--color-zi);
}
.p-name {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-3);
  letter-spacing: 0.1em;
}
.p-zhi {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin: 2rpx 0;
}
.p-star {
  display: block;
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.p-sihua {
  color: var(--color-zhu-2);
  font-size: 18rpx;
  margin-left: 2rpx;
}
.p-empty {
  font-size: 18rpx;
  color: var(--color-bai-3);
}
.interp-text {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.8;
  text-align: center;
  padding: var(--sp-2);
}
.star-info {
  margin-top: var(--sp-3);
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}
.si-title {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: var(--sp-1);
}
.si-line {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
}
.yl-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.yl-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
}
.yl-year {
  width: 100rpx;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.yl-gz {
  width: 80rpx;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-align: center;
}
.yl-high {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
</style>
