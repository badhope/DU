<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="铁板神数" subtitle="IRON PLATE DIVINATION" />

    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">生 辰 报 数</text>
      <text class="form-sub">六 十 四 卦 · 母 数 推 演 · 六 亲 神 断</text>

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

      <view class="form-tip">
        <text>· 母数 = 年×12 + 月×8 + 日×6 + 时×4 · 六亲卦 × 流年 10 年</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '推算中…' : '开 始 推 算' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.1">
        <!-- 铁板神数可视化 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.04s">
          <TieBanChart :result="result" />
        </view>

        <view class="overview card-mystic card-hoverable anim-fade-up">
          <text class="ov-label">母 数</text>
          <text class="ov-num">{{ result.muShu }}</text>
          <text class="ov-gua">{{ result.benGua.trigram }} {{ result.benGua.name }}</text>
          <text class="ov-poem">{{ result.benGua.poem }}</text>
          <text class="ov-summary">{{ result.summary }}</text>
          <view class="score-row">
            <text class="sc-label">总评</text>
            <text class="sc-num" :style="{ color: scoreColor(result.score) }">
              {{ result.score }}
            </text>
            <text class="sc-max">/ 100</text>
          </view>
        </view>

        <view
          class="career card-mystic card anim-fade-up card-hoverable"
          style="animation-delay: 0.1s"
        >
          <text class="card-title title-mystic">五 维 详 批</text>
          <view class="dual">
            <view class="du-row">
              <text class="du-k">事业</text>
              <text class="du-v">{{ result.benGua.career }}</text>
            </view>
            <view class="du-row">
              <text class="du-k">财运</text>
              <text class="du-v">{{ result.benGua.wealth }}</text>
            </view>
            <view class="du-row">
              <text class="du-k">六亲</text>
              <text class="du-v">{{ result.benGua.relationship }}</text>
            </view>
            <view class="du-row">
              <text class="du-k">健康</text>
              <text class="du-v">{{ result.benGua.health }}</text>
            </view>
          </view>
        </view>

        <view
          class="liuqin card-mystic card anim-fade-up card-hoverable"
          style="animation-delay: 0.15s"
        >
          <text class="card-title title-mystic">六 亲 卦 推</text>
          <view class="lq-list">
            <view v-for="(q, i) in result.liuQin" :key="i" class="lq-row">
              <text class="lq-key">{{ q.label }}</text>
              <text class="lq-num">{{ q.num }}</text>
              <text class="lq-gua" :style="{ color: scoreColor(q.gua.score) }">
                {{ q.gua.trigram }} {{ q.gua.name }}
              </text>
              <text class="lq-poem">{{ q.gua.poem }}</text>
            </view>
          </view>
        </view>

        <view
          class="yearly card-mystic card anim-fade-up card-hoverable"
          style="animation-delay: 0.2s"
        >
          <text class="card-title title-mystic">流 年 · 未 来 10 年</text>
          <view class="y-list">
            <view v-for="(y, i) in result.yearly" :key="i" class="y-row" :class="'lv-' + y.level">
              <text class="y-age">{{ y.age }}岁</text>
              <text class="y-year">{{ y.year }}</text>
              <text class="y-gua">{{ y.gua.trigram }}</text>
              <text class="y-name">{{ y.gua.name }}</text>
              <text class="y-lv">{{ y.level }}</text>
            </view>
          </view>
        </view>

        <view class="form-actions">
          <view class="btn-liu" @click="result = null">重 新 推 算</view>
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
import { ref } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import TieBanChart from '@/components/charts/TieBanChart.vue'
import { useAppStore } from '@/stores'
import { calcTieban, type TiebanResult } from '@/utils/tieban'
import _UserSwitcher from '@/components/ui/UserSwitcher.vue'
import ToolGuard from '@/components/ui/ToolGuard.vue'
import { useCooldown } from '@/utils/use-cooldown'
import LoadingSeal from '@/components/ui/LoadingSeal.vue'
import ResultReveal from '@/components/ui/ResultReveal.vue'

const app = useAppStore()
const cd = useCooldown({ tool: 'tieban', toolName: '铁板神数', category: '占卜' })
const _toolKey = 'tieban' as const
const form = ref({ year: 1990, month: 6, day: 15, hour: 12 })
const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
const hourRange = Array.from({ length: 24 }, (_, i) => i + ':00')
const result = ref<TiebanResult | null>(null)
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
      result.value = calcTieban(y, m, d, form.value.hour)
      app.addHistory({
        tool: 'tieban',
        toolName: '铁板神数',
        category: '命理',
        input: { ...form.value },
        output: { muShu: result.value.muShu, benGua: result.value.benGua.name },
        brief: `母数${result.value.muShu} · ${result.value.benGua.name}`,
      })
    } catch (e) {
      uni.showModal({ title: '推算失败', content: '请检查日期输入', showCancel: false })
    } finally {
      loading.value = false
    }
  }, 2400)
}

function scoreColor(s: number) {
  if (s >= 90) return '#4FAE6F'
  if (s >= 75) return '#D4AF37'
  if (s >= 55) return '#E8E4D8'
  if (s >= 35) return '#C8302A'
  return '#8B1F1A'
}
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
.overview,
.card {
  padding: var(--sp-4);
  text-align: center;
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}
.ov-label {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}
.ov-num {
  display: block;
  font-size: 100rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  line-height: 1;
  margin: var(--sp-1) 0;
  text-shadow: 0 0 20rpx var(--color-liu);
}
.ov-gua {
  display: block;
  font-size: var(--fs-xl);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: var(--sp-1);
}
.ov-poem {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  font-style: italic;
  line-height: 1.7;
  margin-bottom: var(--sp-3);
}
.ov-summary {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.7;
  text-align: left;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}
.score-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--sp-1);
  margin-top: var(--sp-3);
}
.sc-label {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
}
.sc-num {
  font-size: 56rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.sc-max {
  font-size: var(--fs-md);
  color: var(--color-bai-3);
}
.dual {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  text-align: left;
}
.du-row {
  display: flex;
  gap: var(--sp-2);
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}
.du-k {
  width: 70rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  flex-shrink: 0;
}
.du-v {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.6;
}
.lq-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.lq-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  flex-wrap: wrap;
}
.lq-key {
  width: 70rpx;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.lq-num {
  width: 60rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  text-align: right;
  font-family: 'KaiTi', serif;
}
.lq-gua {
  width: 160rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.lq-poem {
  flex: 1;
  min-width: 200rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.y-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.y-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-1) var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
}
.y-row.lv-大吉,
.y-row.lv-吉 {
  border-color: rgba(79, 174, 111, 0.4);
}
.y-row.lv-凶,
.y-row.lv-大凶 {
  border-color: rgba(200, 48, 42, 0.4);
}
.y-age {
  width: 70rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}
.y-year {
  width: 80rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.y-gua {
  width: 70rpx;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.y-name {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.y-lv {
  width: 80rpx;
  font-size: 18rpx;
  text-align: right;
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
</style>
