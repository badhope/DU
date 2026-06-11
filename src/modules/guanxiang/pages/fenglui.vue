<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="阳宅风水" subtitle="HOME FENG SHUI" />
    <TabBar
      v-model="activeTab"
      :tabs="[
        { key: 'analyze', label: '分 析' },
        { key: 'knowledge', label: '知 识 库' },
      ]"
    />

    <view v-if="activeTab === 'analyze'">
      <view v-if="!result" class="setup card-mystic anim-fade-up">
        <text class="form-title title-mystic">八 宅 派 风 水</text>
        <text class="form-sub">生 辰 · 性 别 · 推 算 命 卦</text>

        <view class="form-row">
          <text class="form-label">性别</text>
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

        <view class="form-tip">
          <text>· 八宅命卦 · 八方吉凶 · 门位/卧房/厨灶</text>
        </view>

        <view class="form-actions">
          <view class="btn-zhu" @click="analyze">开 始 推 算</view>
        </view>
      </view>

      <view v-else class="result">
        <!-- 阳宅风水可视化 -->
        <view class="card card-mystic anim-fade-up" style="animation-delay: 0.04s">
          <FengLuiChart :result="result" />
        </view>

        <view class="overall card-mystic anim-fade-up">
          <text class="card-title title-mystic">八 宅 总 评</text>
          <view class="ov-info">
            <text class="ov-line">
              <text class="ov-l">命 卦</text>
              <text class="ov-v">
                {{ result.lifeMingName }}（{{ BA_ZHAI_GUA[result.zhaiGua]?.name ?? '' }}）
              </text>
            </text>
            <text class="ov-line">
              <text class="ov-l">生旺方</text>
              <text class="ov-v">{{ result.bestDirection }}</text>
            </text>
            <text class="ov-line">
              <text class="ov-l">总 评</text>
              <text class="ov-v" :class="'lv-' + result.level">{{ result.level }}</text>
            </text>
          </view>
          <text class="ov-sum">{{ result.summary }}</text>
        </view>

        <view class="compass card-mystic anim-fade-up" style="animation-delay: 0.1s">
          <text class="card-title title-mystic">八 方 罗 盘</text>
          <view class="rosette">
            <view
              v-for="(b, i) in result.baGua"
              :key="i"
              class="rg-cell"
              :class="'rg-' + b.level"
              :style="positionStyle(i)"
            >
              <text class="rg-sym">{{ b.symbol }}</text>
              <text class="rg-name">{{ b.name }}</text>
              <text class="rg-pos">{{ b.position }}</text>
              <text class="rg-fortune">{{ b.fortune }}</text>
            </view>
            <view class="rg-center">
              <text class="rg-center-name">{{ result.lifeMingName }}</text>
              <text class="rg-center-sub">{{ BA_ZHAI_GUA[result.zhaiGua]?.name ?? '' }}</text>
            </view>
          </view>
          <view class="legend">
            <text class="leg-item"
              ><text class="leg-dot" style="background: #4fae6f"></text>吉</text
            >
            <text class="leg-item"
              ><text class="leg-dot" style="background: #1b3a5c"></text>中</text
            >
            <text class="leg-item"
              ><text class="leg-dot" style="background: #c8302a"></text>凶</text
            >
          </view>
        </view>

        <view class="menwei card-mystic anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">门 位 建 议</text>
          <view v-for="(m, i) in result.menWei" :key="i" class="mw-row">
            <text class="mw-name">· {{ m.name }}</text>
            <view class="mw-tags">
              <text
                v-for="(r, k) in m.recommended"
                :key="k"
                class="mw-tag"
                :class="{
                  good: result.baGua.find((x) => x.name === r)
                    ? result.baGua.find((x) => x.name === r)!.level === '吉'
                    : false,
                }"
              >
                {{ r }}
              </text>
            </view>
          </view>
        </view>

        <view class="advice card-mystic anim-fade-up" style="animation-delay: 0.2s">
          <text class="card-title title-mystic">建 议</text>
          <text v-for="(a, i) in result.advice" :key="i" class="adv-line">· {{ a }}</text>
        </view>

        <view class="form-actions">
          <view class="btn-liu" @click="result = null">重 新 推 算</view>
        </view>
      </view>
    </view>

    <view v-else class="knowledge">
      <view class="ov-card card-mystic anim-fade-up">
        <text class="card-title title-mystic">八 宅 总 览</text>
        <FengLuiChart :result="demoResult" />
      </view>
      <KnowledgeShell
        :items="FENGLUI_KNOWLEDGE"
        :summaries="FENGLUI_SUMMARIES"
        :details="FENGLUI_DETAILS"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import TabBar from '@shared/components/ui/TabBar.vue'
import KnowledgeShell from '@shared/components/ui/KnowledgeShell.vue'
import FengLuiChart from '@shared/components/charts/FengLuiChart.vue'
import { useAppStore } from '@/stores'
import { calcFenglui, BA_ZHAI_GUA, type FengluiResult } from '@modules/guanxiang/logic/fenglui'
import {
  FENGLUI_KNOWLEDGE,
  FENGLUI_SUMMARIES,
  FENGLUI_DETAILS,
} from '@modules/guanxiang/logic/knowledge-fenglui'

const app = useAppStore()
const activeTab = ref<'analyze' | 'knowledge'>('analyze')
const demoResult = calcFenglui(1990, '男') as FengluiResult
const form = ref({ year: 1990, gender: '男' as '男' | '女' })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPick(k: string, e: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(form.value as any)[k] = Number(e.detail.value)
}
const result = ref<FengluiResult | null>(null)
const loading = ref(false)
function analyze() {
  const y = form.value.year
  if (y < 1900 || y > 2100) {
    uni.showToast({ title: '年份需 1900-2100', icon: 'none' })
    return
  }
  if (new Date(y, 0, 1).getTime() > Date.now()) {
    uni.showToast({ title: '年份不能晚于今年', icon: 'none' })
    return
  }
  loading.value = true
  setTimeout(() => {
    try {
      result.value = calcFenglui(y, form.value.gender)
      app.addHistory({
        tool: 'fenglui',
        toolName: '阳宅风水',
        category: '古物',
        input: { ...form.value },
        output: { gua: result.value.lifeMingName, best: result.value.bestDirection },
        brief: `命卦${result.value.lifeMingName} · 生旺${result.value.bestDirection}`,
      })
    } catch (_e) {
      uni.showModal({ title: '风水分析失败', content: '请检查生年输入', showCancel: false })
    } finally {
      loading.value = false
    }
  }, 400)
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function positionStyle(i: number): any {
  // 8 个方位按 8 边布局
  const positions = [
    { top: '0%', left: '50%' }, // 北
    { top: '15%', left: '85%' }, // 东北
    { top: '50%', left: '100%' }, // 东
    { top: '85%', left: '85%' }, // 东南
    { top: '100%', left: '50%' }, // 南
    { top: '85%', left: '15%' }, // 西南
    { top: '50%', left: '0%' }, // 西
    { top: '15%', left: '15%' }, // 西北
  ]
  return {
    top: positions[i]?.top ?? '50%',
    left: positions[i]?.left ?? '50%',
    transform: 'translate(-50%, -50%)',
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}
.form,
.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0 var(--sp-2);
  margin-top: var(--sp-2);
}
.form {
  padding: var(--sp-4);
}
.form-title {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  letter-spacing: 0.2em;
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
  padding: var(--sp-2) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
}
.form-label {
  width: 120rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.form-picker {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
}
.gender {
  flex: 1;
  display: flex;
  gap: var(--sp-2);
}
.g-btn {
  flex: 1;
  text-align: center;
  padding: var(--sp-2) 0;
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.g-btn.active {
  background: linear-gradient(135deg, #5b3a8e, #1f4e4a);
  color: var(--color-bai);
  border-color: var(--color-liu);
}
.form-tip {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  text-align: center;
  margin: var(--sp-2) 0;
}
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}
.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #5b3a8e, #1f4e4a);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 320rpx;
  text-align: center;
}
.btn-liu {
  padding: var(--sp-3) var(--sp-6);
  background: transparent;
  color: var(--color-liu);
  border: 1rpx solid var(--color-liu);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 320rpx;
  text-align: center;
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-3);
  text-align: center;
}
.card-mystic {
  padding: var(--sp-4);
}

.overall {
  padding: var(--sp-4);
}
.ov-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  margin: var(--sp-2) 0;
}
.ov-line {
  display: flex;
  font-size: var(--fs-sm);
}
.ov-l {
  width: 140rpx;
  color: var(--color-bai-3);
}
.ov-v {
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.ov-v.lv-大吉 {
  color: #ffd700;
}
.ov-v.lv-吉 {
  color: #4fae6f;
}
.ov-v.lv-平 {
  color: var(--color-bai-2);
}
.ov-v.lv-凶 {
  color: #c8302a;
}
.ov-sum {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin-top: var(--sp-2);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
}

.compass {
  padding: var(--sp-4);
}
.rosette {
  position: relative;
  width: 600rpx;
  height: 600rpx;
  max-width: 100%;
  margin: 0 auto;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(91, 58, 142, 0.2), rgba(10, 10, 18, 0.6));
  border: 4rpx solid var(--color-liu);
  aspect-ratio: 1;
}
.rg-cell {
  position: absolute;
  width: 140rpx;
  height: 100rpx;
  padding: 6rpx;
  background: rgba(10, 10, 18, 0.7);
  border-radius: var(--r-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.rg-cell.rg-吉 {
  border: 2rpx solid #4fae6f;
  box-shadow: 0 0 12rpx rgba(79, 174, 111, 0.3);
}
.rg-cell.rg-中 {
  border: 2rpx solid var(--color-liu);
}
.rg-cell.rg-凶 {
  border: 2rpx solid #c8302a;
  opacity: 0.7;
}
.rg-sym {
  font-size: 24rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}
.rg-name {
  font-size: 20rpx;
  color: var(--color-bai);
  font-weight: 600;
}
.rg-pos {
  font-size: 16rpx;
  color: var(--color-bai-3);
}
.rg-fortune {
  font-size: 16rpx;
  color: var(--color-bai-2);
}
.rg-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.4), rgba(10, 10, 18, 0.6));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3rpx solid var(--color-liu);
}
.rg-center-name {
  font-size: 40rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
}
.rg-center-sub {
  font-size: 18rpx;
  color: var(--color-bai);
}
.legend {
  display: flex;
  justify-content: center;
  gap: var(--sp-3);
  margin-top: var(--sp-2);
}
.leg-item {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
}
.leg-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  display: inline-block;
}

.menwei {
  padding: var(--sp-4);
}
.mw-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
}
.mw-name {
  width: 120rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}
.mw-tags {
  display: flex;
  gap: 4rpx;
  flex-wrap: wrap;
}
.mw-tag {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  background: rgba(212, 175, 55, 0.1);
  color: var(--color-bai-2);
  border-radius: var(--r-sm);
}
.mw-tag.good {
  background: rgba(79, 174, 111, 0.2);
  color: #8fd0a8;
}

.advice {
  padding: var(--sp-4);
}
.adv-line {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.8;
  font-family: 'KaiTi', serif;
}
</style>
