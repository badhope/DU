<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="诸葛神数" subtitle="ZHUGE 384 SIGNS" />

    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">默 念 · 报 数</text>
      <text class="form-sub">三 数 报 签 · 384 签 · 吉 凶 立 断</text>

      <view class="form-row">
        <text class="form-label">首 数</text>
        <picker mode="number" :value="form.n1" :min="1" :max="9" @change="onPick('n1', $event)">
          <view class="form-picker">{{ form.n1 }}</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">次 数</text>
        <picker mode="number" :value="form.n2" :min="1" :max="9" @change="onPick('n2', $event)">
          <view class="form-picker">{{ form.n2 }}</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">末 数</text>
        <picker mode="number" :value="form.n3" :min="1" :max="9" @change="onPick('n3', $event)">
          <view class="form-picker">{{ form.n3 }}</view>
        </picker>
      </view>

      <view class="form-tip">
        <text>· 默念所问 · 报 3 个 1-9 的数字 · 随即生成签号 · 不报则系统自动生成</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '抽签中…' : '开 始 抽 签' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.1">
        <!-- 诸葛神数可视化 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.04s">
          <ZhugeChart :qian="result" />
        </view>

        <view class="qian-card card-mystic card-hoverable anim-fade-up">
          <view class="qian-head">
            <text class="qh-num">第 {{ result.num }} 签</text>
            <text class="qh-level" :style="{ color: levelColor(result.score) }">
              {{ result.level }}
            </text>
          </view>
          <text class="qh-gua">{{ result.gua }} · {{ result.title }}</text>
          <text class="qh-poem">{{ result.poem }}</text>
          <text class="qh-jie">解：{{ result.jie }}</text>
          <view class="qh-stats">
            <text class="qs-label">总评</text>
            <text class="qs-num" :style="{ color: levelColor(result.score) }">
              {{ result.score }}
            </text>
            <text class="qs-max">/ 100</text>
          </view>
        </view>

        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.1s">
          <text class="card-title title-mystic">五 维 评 分</text>
          <view class="score-list">
            <view v-for="(s, i) in scoreList" :key="i" class="s-row">
              <text class="s-name">{{ s.name }}</text>
              <view class="s-bar">
                <view class="s-fill" :style="{ width: s.val + '%', background: s.color }" />
              </view>
              <text class="s-val" :style="{ color: s.color }">{{ s.val }}</text>
            </view>
          </view>
        </view>

        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">详 细 推 演</text>
          <view class="du-row">
            <text class="du-k">事业</text>
            <text class="du-v">{{ result.career }}</text>
          </view>
          <view class="du-row">
            <text class="du-k">求财</text>
            <text class="du-v">{{ result.wealth }}</text>
          </view>
          <view class="du-row">
            <text class="du-k">婚姻</text>
            <text class="du-v">{{ result.marriage }}</text>
          </view>
          <view class="du-row">
            <text class="du-k">疾病</text>
            <text class="du-v">{{ result.health }}</text>
          </view>
          <view class="du-row">
            <text class="du-k">出行</text>
            <text class="du-v">{{ result.travel }}</text>
          </view>
        </view>

        <view class="form-actions">
          <view class="btn-liu" @click="result = null">再 抽 一 签</view>
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
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import ZhugeChart from '@/components/charts/ZhugeChart.vue'
import { useAppStore } from '@/stores'
import { drawZhuge, type ZhugeQian } from '@/utils/zhuge'
import UserSwitcher from '@/components/ui/UserSwitcher.vue'
import ToolGuard from '@/components/ui/ToolGuard.vue'
import { useCooldown } from '@/utils/use-cooldown'
import LoadingSeal from '@/components/ui/LoadingSeal.vue'
import ResultReveal from '@/components/ui/ResultReveal.vue'

const app = useAppStore()
const cd = useCooldown({ tool: 'zhuge', toolName: '诸葛神数', category: '占卜' })
const toolKey = 'zhuge' as const
const form = ref({ n1: 1, n2: 1, n3: 1 })
const result = ref<ZhugeQian | null>(null)
const loading = ref(false)

function onPick(k: string, e: any) {
  ;(form.value as any)[k] = Number(e.detail.value)
}

function calculate() {
  loading.value = true
  setTimeout(() => {
    result.value = drawZhuge(form.value.n1, form.value.n2, form.value.n3)
    loading.value = false
    app.addHistory({
      tool: 'zhuge',
      toolName: '诸葛神数',
      category: '命理',
      input: { ...form.value },
      output: { num: result.value.num, level: result.value.level },
      brief: `第${result.value.num}签 · ${result.value.gua} · ${result.value.level}`,
    })
  }, 2400)
}

function levelColor(s: number) {
  if (s >= 90) return '#4FAE6F'
  if (s >= 75) return '#D4AF37'
  if (s >= 55) return '#E8E4D8'
  if (s >= 35) return '#C8302A'
  return '#8B1F1A'
}

const scoreList = computed(() =>
  result.value
    ? [
        { name: '事业', val: result.value.scores.career, color: '#D4AF37' },
        { name: '财运', val: result.value.scores.wealth, color: '#C8302A' },
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
  width: 100rpx;
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
.qian-card,
.card {
  padding: var(--sp-4);
  text-align: center;
}
.qian-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--sp-2);
}
.qh-num {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}
.qh-level {
  font-size: var(--fs-2xl);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 20rpx currentColor;
}
.qh-gua {
  display: block;
  font-size: var(--fs-xl);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: var(--sp-2);
}
.qh-poem {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-style: italic;
  line-height: 1.7;
  margin-bottom: var(--sp-2);
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border-left: 4rpx solid var(--color-zhu);
}
.qh-jie {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  line-height: 1.6;
}
.qh-stats {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--sp-1);
  margin-top: var(--sp-3);
}
.qs-label {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
}
.qs-num {
  font-size: 56rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.qs-max {
  font-size: var(--fs-md);
  color: var(--color-bai-3);
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}
.score-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.s-row {
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
.du-row {
  display: flex;
  gap: var(--sp-2);
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  margin-bottom: var(--sp-1);
  text-align: left;
}
.du-k {
  width: 80rpx;
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
</style>
