<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="家谱排辈" subtitle="FAMILY LINE" />

    <view v-if="!result" class="setup card-mystic anim-fade-up">
      <text class="form-title title-mystic">寻 根 问 祖</text>
      <text class="form-sub">姓 氏 · 字 辈 · 传 承</text>

      <view class="form-row">
        <text class="form-label">姓 氏</text>
        <picker mode="selector" :value="surnameIdx" :range="SURNAME_LIST" @change="onPickSurname">
          <view class="form-picker">{{ form.surname }} 氏</view>
        </picker>
      </view>

      <view class="form-row">
        <text class="form-label">生 年</text>
        <picker
          mode="number"
          :value="form.year"
          :min="1950"
          :max="2010"
          @change="onPick('year', $event)"
        >
          <view class="form-picker">{{ form.year }} 年</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">生 月</text>
        <picker
          mode="number"
          :value="form.month"
          :min="1"
          :max="12"
          @change="onPick('month', $event)"
        >
          <view class="form-picker">{{ form.month }} 月</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">生 日</text>
        <picker mode="number" :value="form.day" :min="1" :max="31" @change="onPick('day', $event)">
          <view class="form-picker">{{ form.day }} 日</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">生 时</text>
        <picker
          mode="number"
          :value="form.hour"
          :min="0"
          :max="23"
          @change="onPick('hour', $event)"
        >
          <view class="form-picker">{{ form.hour }} 时</view>
        </picker>
      </view>
      <view class="form-row">
        <text class="form-label">性 别</text>
        <picker
          mode="selector"
          :value="form.gender === '男' ? 0 : 1"
          :range="['男', '女']"
          @change="onPickGender"
        >
          <view class="form-picker">{{ form.gender }}</view>
        </picker>
      </view>

      <view class="form-tip">
        <text>· 内置 5 大家族字辈诗 · 5 世/10 世传承 · 取名建议</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '排辈中…' : '开 始 排 辈' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <!-- 家谱可视化（核心） -->
      <view class="card card-mystic anim-fade-up">
        <text class="card-title title-mystic">家 谱 · 世 代 树 状 图</text>
        <JiaPuChart :result="result" />
      </view>
      <view class="header card-mystic anim-fade-up">
        <text class="hd-sn">{{ result.surname }} 氏</text>
        <text class="hd-gen"
          >
第 {{ result.currentGen }} 世 · 字辈「{{ result.currentZibei }}」
</text
        >
        <text class="hd-poem">{{ result.poem }}</text>
      </view>

      <view class="tree card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="card-title title-mystic">· 世 系 流 传 ·</text>
        <view class="gen-list">
          <view
            v-for="g in result.generations"
            :key="g.gen"
            class="gen-cell"
            :class="{ 'is-current': g.gen === result.currentGen }"
          >
            <text class="g-zibei">{{ g.zibei }}</text>
            <view class="g-info">
              <text class="g-num">第 {{ g.gen }} 世</text>
              <text class="g-year">{{ g.startYear }} - {{ g.endYear }}</text>
              <text class="g-cnt">族丁 · {{ g.totalCount }} 人</text>
            </view>
          </view>
        </view>
      </view>

      <view class="names card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">· 当 代 取 名 ·</text>
        <text class="nm-sub">字辈「{{ result.currentZibei }}」+ 五行配字 · 6 个建议</text>
        <view v-for="(n, i) in result.suggested" :key="i" class="nm-cell">
          <text class="nm-name">{{ n.name }}</text>
          <view class="nm-meta">
            <text class="nm-wx">五行 · {{ n.wuXing }}</text>
            <text class="nm-meaning">{{ n.meaning }}</text>
          </view>
        </view>
      </view>

      <view class="form-actions">
        <view class="btn-liu" @click="result = null">重 新 排 辈</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import JiaPuChart from '@/components/charts/JiaPuChart.vue'
import { useAppStore } from '@/stores'
import { buildFamilyTree, ZIBEI_EXAMPLES, type FamilyTree } from '@/utils/jiazu'

const app = useAppStore()
const SURNAME_LIST = ZIBEI_EXAMPLES.map((e) => e.family.replace('氏', ''))
const form = reactive({
  surname: '李',
  year: 1990,
  month: 6,
  day: 15,
  hour: 12,
  gender: '男' as '男' | '女',
})
const surnameIdx = computed(() => SURNAME_LIST.indexOf(form.surname))
function onPickSurname(e: any) {
  form.surname = SURNAME_LIST[e.detail.value]
}
function onPick(k: string, e: any) {
  (form as any)[k] = Number(e.detail.value)
}
function onPickGender(e: any) {
  form.gender = e.detail.value === 0 ? '男' : '女'
}

const result = ref<FamilyTree | null>(null)
const loading = ref(false)
async function calculate() {
  const y = form.year,
    m = form.month,
    d = form.day
  if (y < 1900 || y > new Date().getFullYear()) {
    uni.showToast({ title: '年份需 1900-今年', icon: 'none' })
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
  await new Promise((r) => setTimeout(r, 600))
  try {
    result.value = buildFamilyTree(form.surname, y, m, d, form.hour, form.gender)
    app.addHistory({
      tool: 'jiazu',
      toolName: '家谱排辈',
      category: '生活',
      input: { ...form },
      output: { gen: result.value.currentGen, zibei: result.value.currentZibei },
      brief: `${result.value.surname}氏 第${result.value.currentGen}世 · 字辈「${result.value.currentZibei}」`,
    })
  } catch (e) {
    uni.showModal({ title: '排辈失败', content: '请检查输入', showCancel: false })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}
.setup,
.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0 var(--sp-2);
  margin-top: var(--sp-2);
}
.setup {
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
.form-tip {
  margin-top: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  text-align: center;
}
.form-actions {
  margin-top: var(--sp-4);
  display: flex;
  justify-content: center;
}

.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #8b1f1a, #1f4e4a);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 320rpx;
  text-align: center;
}
.btn-zhu.is-loading {
  opacity: 0.6;
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

.card-mystic {
  padding: var(--sp-3);
}
.card-title {
  display: block;
  font-size: var(--fs-sm);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
  text-align: center;
}

.header {
  padding: var(--sp-4);
  text-align: center;
}
.hd-sn {
  display: block;
  font-size: 80rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
  text-shadow: 0 0 20rpx rgba(212, 175, 55, 0.5);
}
.hd-gen {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  margin-top: var(--sp-2);
}
.hd-poem {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.8;
  font-family: 'KaiTi', serif;
  margin-top: var(--sp-2);
  letter-spacing: 0.1em;
}

.tree {
  padding: var(--sp-3);
}
.gen-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  justify-content: center;
}
.gen-cell {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 6rpx 10rpx;
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
  border-radius: var(--r-sm);
}
.gen-cell.is-current {
  border-color: var(--color-liu);
  background: rgba(212, 175, 55, 0.15);
}
.g-zibei {
  font-size: 28rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
  width: 32rpx;
  text-align: center;
}
.gen-cell.is-current .g-zibei {
  font-size: 32rpx;
  color: #ffd700;
}
.g-info {
  display: flex;
  flex-direction: column;
}
.g-num {
  font-size: 16rpx;
  color: var(--color-bai-3);
}
.g-year {
  font-size: 16rpx;
  color: var(--color-bai-2);
  font-family: monospace;
}
.g-cnt {
  font-size: 14rpx;
  color: var(--color-bai-3);
}

.names {
  padding: var(--sp-3);
}
.nm-sub {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-bottom: var(--sp-2);
  text-align: center;
}
.nm-cell {
  display: flex;
  align-items: center;
  padding: var(--sp-2);
  margin: var(--sp-1) 0;
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
}
.nm-name {
  width: 140rpx;
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
}
.nm-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.nm-wx {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.nm-meaning {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
</style>
