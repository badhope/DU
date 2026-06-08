<template>
  <view class="qimen-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="奇门遁甲" subtitle="MYSTERIOUS GATE" />

    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">请 选 时 问 局</text>
      <text class="form-sub">时 家 奇 门 · 趋 吉 避 凶</text>

      <view class="form-row">
        <text class="form-label">年</text>
        <picker
          mode="number"
          :value="form.year"
          :min="1900"
          :max="2100"
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
        <text>· 阳遁：冬至 → 夏至（顺行）· 阴遁：夏至 → 冬至（逆行）</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '排盘中…' : '起 奇 门 局' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.1">
        <!-- 奇门遁甲可视化（核心） -->
        <view class="card card-mystic card-hoverable anim-fade-up">
          <text class="card-title title-mystic">奇 门 遁 甲 · 三 盘 九 宫</text>
          <QiMenChart :result="result" />
        </view>
        <!-- 局数信息 -->
        <view class="card card-mystic card-hoverable anim-fade-up">
          <text class="card-title title-mystic">奇 门 局 息</text>
          <view class="ju-row">
            <view class="ju-cell">
              <text class="ju-label">遁</text>
              <text class="ju-val" :class="result.dun === '阳遁' ? 'rel-good' : 'rel-bad'">
                {{ result.dun }}
              </text>
            </view>
            <view class="ju-cell">
              <text class="ju-label">局 数</text>
              <text class="ju-val">{{ result.ju }} 局</text>
            </view>
            <view class="ju-cell">
              <text class="ju-label">元</text>
              <text class="ju-val">{{ result.yuan }}</text>
            </view>
            <view class="ju-cell">
              <text class="ju-label">时 辰</text>
              <text class="ju-val">{{ result.shiGan }}{{ result.shiZhi }}</text>
            </view>
          </view>
          <text class="ju-jieqi">{{ result.jieqi }}</text>
          <view class="ju-zhifu">
            <text class="zhifu-label">
              值符星：<text class="zhifu-val">{{ result.zhiFuStar }}</text
              >　值使门：<text class="zhifu-val">{{ result.zhiShiMen }}</text>
            </text>
          </view>
        </view>

        <!-- 九宫盘 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.1s">
          <text class="card-title title-mystic">九 宫 三 盘</text>
          <text class="card-tip">地 盘 干 / 天 盘 星 / 人 盘 门 / 八 神</text>
          <view class="grid9">
            <view
              v-for="(p, i) in sortedPalace"
              :key="i"
              class="cell"
              :class="'judge-' + p.judge"
              :style="{ gridColumn: p.col + 1, gridRow: p.row + 1 }"
            >
              <view class="cell-gong">{{ p.gong }}宫</view>
              <view class="cell-di">{{ p.diPan }}</view>
              <view class="cell-tian">
                <text class="ct-star">{{ p.star }}</text>
              </view>
              <view class="cell-men" :class="'mn-' + p.menNature">
                <text>{{ p.men }}门</text>
              </view>
              <view class="cell-shen" :class="'sn-' + p.shenNature">
                <text>{{ p.shen }}</text>
              </view>
              <view class="cell-judge" :class="'jd-' + p.judge">{{ p.judge }}</view>
            </view>
          </view>
        </view>

        <!-- 吉凶宫位解读 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">宫 位 详 解</text>
          <view class="palace-list">
            <view v-for="(p, i) in sortedPalace" :key="i" class="pl-item" :class="'pl-' + p.judge">
              <view class="pl-head">
                <text class="pl-gong">{{ p.gong }}宫</text>
                <text class="pl-judge" :class="'jd-' + p.judge">{{ p.judge }}</text>
              </view>
              <view class="pl-mid">
                <text class="pl-key">
                  地盘干：<text class="pl-v">{{ p.diPan }}</text>
                </text>
                <text class="pl-key">
                  天盘干：<text class="pl-v">{{ p.tianPan }}</text>
                </text>
              </view>
              <view class="pl-mid">
                <text class="pl-key">
                  九星：<text class="pl-v" :class="'sn-' + p.starNature">{{ p.star }}</text>
                </text>
                <text class="pl-key">
                  八门：<text class="pl-v" :class="'mn-' + p.menNature">{{ p.men }}门</text>
                </text>
                <text class="pl-key">
                  八神：<text class="pl-v" :class="'sn-' + p.shenNature">{{ p.shen }}</text>
                </text>
              </view>
              <text class="pl-brief">{{ p.brief }}</text>
            </view>
          </view>
        </view>

        <view class="reset">
          <view class="btn-ghost" @click="reset">重 起 奇 门</view>
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
import TaijiBg from '@/components/effects/TaijiBg.vue'
import TopBar from '@/components/ui/TopBar.vue'
import QiMenChart from '@/components/charts/QiMenChart.vue'
import { calcQimen, type QimenResult } from '@/utils/qimen'
import { useAppStore } from '@/stores'
import UserSwitcher from '@/components/ui/UserSwitcher.vue'
import ToolGuard from '@/components/ui/ToolGuard.vue'
import { useCooldown } from '@/utils/use-cooldown'
import LoadingSeal from '@/components/ui/LoadingSeal.vue'
import ResultReveal from '@/components/ui/ResultReveal.vue'

const app = useAppStore()
const cd = useCooldown({ tool: 'mingmen', toolName: '奇门遁甲', category: '占卜' })
const toolKey = 'mingmen' as const

const form = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  hour: new Date().getHours(),
})
const result = ref<QimenResult | null>(null)
const loading = ref(false)

const monthRange = Array.from({ length: 12 }, (_, i) => `${i + 1} 月`)
const hourRange = Array.from({ length: 24 }, (_, i) => `${i}:00`)

function onPick(field: 'year' | 'month' | 'day' | 'hour', e: any) {
  let v = Number(e.detail.value)
  if (field === 'month') v += 1
  form.value[field] = v
}

// 按 row/col 排序
const sortedPalace = computed(() => {
  if (!result.value) return []
  return [...result.value.palace].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.col - b.col
  })
})

function calculate() {
  if (!cd.guard()) return
  loading.value = true
  setTimeout(() => {
    result.value = calcQimen(form.value.year, form.value.month, form.value.day, form.value.hour)
    loading.value = false
    app.addHistory({
      tool: 'mingmen',
      toolName: '奇门遁甲',
      category: '命理',
      input: { ...form.value },
      output: { ju: result.value.ju, dun: result.value.dun },
      brief: `${result.value.dun}${result.value.ju}局 · ${result.value.yuan} · ${result.value.shiZhi}时`,
    })
  }, 700)
}

function reset() {
  result.value = null
}
</script>

<style scoped>
.qimen-page {
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
}

.form-title {
  display: block;
  text-align: center;
  font-size: var(--fs-2xl);
  margin-bottom: var(--sp-2);
}

.form-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-bottom: var(--sp-4);
}

.form-row {
  display: flex;
  align-items: center;
  padding: var(--sp-2) var(--sp-3);
  margin-bottom: var(--sp-1);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
}

.form-label {
  width: 80rpx;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
}

.form-picker {
  flex: 1;
  font-size: var(--fs-md);
  color: var(--color-bai);
}

.form-tip {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-top: var(--sp-2);
  text-align: center;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}

.card {
  position: relative;
  z-index: var(--z-content);
  margin: 0 var(--sp-2) var(--sp-3);
  padding: var(--sp-4);
}

.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}

.card-tip {
  display: block;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-bottom: var(--sp-3);
  letter-spacing: 0.1em;
}

/* ===== 局息 ===== */
.ju-row {
  display: flex;
  gap: var(--sp-2);
}

.ju-cell {
  flex: 1;
  text-align: center;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}

.ju-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}

.ju-val {
  display: block;
  font-size: var(--fs-lg);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-top: 4rpx;
}

.ju-val.rel-good {
  color: #4fae6f;
}
.ju-val.rel-bad {
  color: var(--color-zhu);
}

.ju-jieqi {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  margin-top: var(--sp-3);
  font-style: italic;
}

.ju-zhifu {
  margin-top: var(--sp-3);
  padding: var(--sp-2);
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--r-md);
  text-align: center;
}

.zhifu-label {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}

.zhifu-val {
  color: var(--color-liu);
  font-weight: 700;
}

/* ===== 九宫盘 ===== */
.grid9 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4rpx;
  aspect-ratio: 1;
  max-width: 100%;
  margin: 0 auto;
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--sp-1);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  position: relative;
  min-height: 100rpx;
}

.cell.judge-大吉 {
  background: linear-gradient(135deg, rgba(79, 174, 111, 0.3) 0%, rgba(10, 10, 18, 0.5) 100%);
  border-color: #4fae6f;
  box-shadow: 0 0 12rpx rgba(79, 174, 111, 0.4);
}
.cell.judge-吉 {
  background: linear-gradient(135deg, rgba(79, 174, 111, 0.15) 0%, rgba(10, 10, 18, 0.5) 100%);
  border-color: rgba(79, 174, 111, 0.4);
}
.cell.judge-中 {
  background: rgba(10, 10, 18, 0.5);
}
.cell.judge-凶 {
  background: linear-gradient(135deg, rgba(200, 48, 42, 0.15) 0%, rgba(10, 10, 18, 0.5) 100%);
  border-color: rgba(200, 48, 42, 0.4);
}
.cell.judge-大凶 {
  background: linear-gradient(135deg, rgba(200, 48, 42, 0.3) 0%, rgba(10, 10, 18, 0.5) 100%);
  border-color: var(--color-zhu);
  box-shadow: 0 0 12rpx rgba(200, 48, 42, 0.4);
}

.cell-gong {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  font-size: 18rpx;
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
}

.cell-di {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  font-size: 22rpx;
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}

.cell-tian {
  margin-top: 20rpx;
  font-size: 26rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}

.ct-star {
  text-shadow: 0 0 6rpx currentColor;
}

.cell-men {
  font-size: 22rpx;
  font-family: 'KaiTi', serif;
  font-weight: 600;
  padding: 0 8rpx;
  border-radius: 4rpx;
  margin-top: 2rpx;
}

.cell-men.mn-吉 {
  color: #4fae6f;
  background: rgba(79, 174, 111, 0.15);
}
.cell-men.mn-中 {
  color: var(--color-liu);
  background: rgba(212, 175, 55, 0.15);
}
.cell-men.mn-凶 {
  color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.15);
}

.cell-shen {
  font-size: 20rpx;
  font-family: 'KaiTi', serif;
  padding: 0 6rpx;
  border-radius: 4rpx;
  margin-top: 2rpx;
}

.cell-shen.sn-吉 {
  color: #4fae6f;
  background: rgba(79, 174, 111, 0.1);
}
.cell-shen.sn-凶 {
  color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.1);
}
.cell-shen.sn-中 {
  color: var(--color-bai-2);
  background: rgba(100, 100, 120, 0.2);
}

.cell-judge {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  font-size: 16rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}

.cell-judge.jd-大吉,
.cell-judge.jd-吉 {
  color: #4fae6f;
}
.cell-judge.jd-中 {
  color: var(--color-liu);
}
.cell-judge.jd-凶,
.cell-judge.jd-大凶 {
  color: var(--color-zhu);
}

/* ===== 宫位列表 ===== */
.palace-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.pl-item {
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
}

.pl-item.pl-大吉,
.pl-item.pl-吉 {
  border-color: rgba(79, 174, 111, 0.4);
}
.pl-item.pl-凶,
.pl-item.pl-大凶 {
  border-color: rgba(200, 48, 42, 0.4);
}

.pl-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sp-2);
}

.pl-gong {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}

.pl-judge {
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  padding: 2rpx 12rpx;
  border-radius: var(--r-sm);
}

.pl-judge.jd-大吉,
.pl-judge.jd-吉 {
  background: rgba(79, 174, 111, 0.2);
  color: #4fae6f;
}
.pl-judge.jd-中 {
  background: rgba(212, 175, 55, 0.2);
  color: var(--color-liu);
}
.pl-judge.jd-凶,
.pl-judge.jd-大凶 {
  background: rgba(200, 48, 42, 0.2);
  color: var(--color-zhu);
}

.pl-mid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-bottom: var(--sp-1);
}

.pl-key {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
}

.pl-v {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.pl-v.sn-吉 {
  color: #4fae6f;
}
.pl-v.sn-凶 {
  color: var(--color-zhu);
}
.pl-v.mn-吉 {
  color: #4fae6f;
}
.pl-v.mn-凶 {
  color: var(--color-zhu);
}

.pl-brief {
  display: block;
  margin-top: var(--sp-2);
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  font-style: italic;
}

.reset {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}
</style>
