<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="数字能量" subtitle="NUMBER ENERGY" />

    <view class="setup card-mystic anim-fade-up">
      <text class="form-title title-mystic">数 字 磁 场</text>
      <text class="form-sub">手 机 · 车 牌 · 任 意 数 字</text>

      <view class="form-section">
        <text class="form-label">· 输入数字串</text>
        <input
          v-model="input"
          class="form-inp"
          type="number"
          placeholder="如 13800138000"
          maxlength="16"
        />
      </view>

      <view class="form-tip">
        <text>· 8 大磁场：天医/延年/生气/伏位/绝命/五鬼/六煞/祸害</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" @click="analyze">分 析</view>
      </view>
    </view>

    <view v-if="result" class="result">
      <view class="overall card-mystic anim-fade-up">
        <text class="ov-label">· 综 合 评 分</text>
        <view class="ov-row">
          <view class="ov-num">
            <text class="ov-val">{{ result.scores.zonghe }}</text>
            <text class="ov-unit">/ 100</text>
          </view>
          <text class="ov-level" :class="'lv-' + result.level">{{ result.level }}</text>
        </view>
        <text class="ov-domi">主导五行 · {{ result.dominant }}</text>
        <text class="ov-sum">{{ result.summary }}</text>
        <text class="ov-advice">· 建议：{{ result.advice }}</text>
      </view>

      <view class="seq card-mystic anim-fade-up" style="animation-delay: 0.05s">
        <text class="card-title title-mystic">数 字 序 列</text>
        <view class="d-list">
          <text
            v-for="(d, i) in displayDigits"
            :key="i"
            class="d-cell"
            :style="{ color: WX_META[d.wx]?.color ?? '#D4AF37' }"
          >
            <text class="d-num">{{ d.d }}</text>
            <text class="d-wx">{{ WX_META[d.wx]?.name ?? '' }}</text>
          </text>
        </view>
      </view>

      <view class="scores card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="card-title title-mystic">三 维 评 分</text>
        <view v-for="(s, i) in scoreList" :key="i" class="s-cell">
          <text class="s-name">{{ s.name }}</text>
          <view class="s-bar">
            <view class="s-fill" :style="{ width: s.val + '%', background: s.color }" />
          </view>
          <text class="s-val" :style="{ color: s.color }">{{ s.val }}</text>
        </view>
      </view>

      <view class="pairs card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">磁 场 组 合</text>
        <view v-for="(p, i) in result.pairs" :key="i" class="p-row" :class="'p-' + p.combo.type">
          <text class="p-name">{{ p.combo.name }} · ×{{ p.count }}</text>
          <text class="p-desc">{{ p.combo.desc }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import { analyzeShuzhi, type ShuzhiAnalysis } from '@modules/mingming/logic/shuzhi'
import { WUXING_META, type Wuxing } from '@modules/mingli/logic/wuxing'

const app = useAppStore()
const WX_META = WUXING_META

const input = ref('13800138000')
const result = ref<ShuzhiAnalysis | null>(null)
const loading = ref(false)

const scoreList = computed(() => {
  if (!result.value) return []
  return [
    { name: '财运', val: result.value.scores.caiyun, color: '#D4AF37' },
    { name: '人缘', val: result.value.scores.renyuan, color: '#5B3A8E' },
    { name: '健康', val: result.value.scores.jiankang, color: '#4FAE6F' },
  ]
})

const displayDigits = computed(() => {
  if (!result.value) return []
  const WX_MAP: Record<string, Wuxing> = { 木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui' }
  const r = result.value
  return input.value
    .split('')
    .map((d, i) => ({ d, wx: WX_MAP[r.wuXingSeq[i] ?? '木'] ?? 'mu' }))
    .filter((x) => !isNaN(Number(x.d)))
})

function analyze() {
  // 校验：只允许数字，5-16 位
  const v = input.value.replace(/[^0-9]/g, '')
  if (v.length < 5) {
    uni.showToast({ title: '请输入 5-16 位数字', icon: 'none' })
    return
  }
  if (v.length > 16) {
    uni.showToast({ title: '数字不能超过 16 位', icon: 'none' })
    return
  }
  input.value = v
  loading.value = true
  setTimeout(() => {
    try {
      result.value = analyzeShuzhi(v)
      loading.value = false
      if (result.value) {
        app.addHistory({
          tool: 'shuzhi',
          toolName: '数字能量',
          category: '占卜',
          input: { number: v },
          output: { level: result.value.level, score: result.value.scores.zonghe },
          brief: `${result.value.level} · ${result.value.scores.zonghe}分 · ${result.value.dominant}`,
        })
      }
    } catch (_e) {
      loading.value = false
      uni.showModal({ title: '分析失败', content: '请检查数字格式', showCancel: false })
    }
  }, 600)
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
.form-section {
  margin: var(--sp-3) 0;
}
.form-label {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-bottom: var(--sp-2);
}
.form-inp {
  width: 100%;
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.6);
  color: var(--color-bai);
  font-size: 32rpx;
  font-family: monospace;
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  letter-spacing: 4rpx;
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
  margin-top: var(--sp-3);
}
.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #1b3a5c, #c8302a);
  color: var(--color-bai);
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
.ov-label {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  text-align: center;
}
.ov-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--sp-4);
  margin: var(--sp-3) 0;
}
.ov-num {
  display: flex;
  align-items: baseline;
}
.ov-val {
  font-size: 100rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
  text-shadow: 0 0 20rpx rgba(212, 175, 55, 0.5);
}
.ov-unit {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
}
.ov-level {
  padding: 6rpx 20rpx;
  font-size: var(--fs-md);
  border-radius: var(--r-sm);
}
.ov-level.lv-吉 {
  background: #4fae6f;
  color: #fff;
}
.ov-level.lv-平 {
  background: #d4af37;
  color: #000;
}
.ov-level.lv-凶 {
  background: #c8302a;
  color: #fff;
}
.ov-domi {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin: var(--sp-2) 0;
}
.ov-sum {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
}
.ov-advice {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-top: var(--sp-2);
  font-family: 'KaiTi', serif;
}

.seq {
  padding: var(--sp-4);
}
.d-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
}
.d-cell {
  width: 50rpx;
  text-align: center;
  padding: 4rpx 0;
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
}
.d-num {
  display: block;
  font-size: var(--fs-md);
  font-weight: 700;
  font-family: monospace;
}
.d-wx {
  display: block;
  font-size: 16rpx;
}

.scores {
  padding: var(--sp-4);
}
.s-cell {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: var(--sp-2) 0;
}
.s-name {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.s-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 8rpx;
  overflow: hidden;
}
.s-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.6s ease;
}
.s-val {
  width: 60rpx;
  text-align: right;
  font-size: var(--fs-sm);
  font-weight: 600;
}

.pairs {
  padding: var(--sp-4);
}
.p-row {
  padding: var(--sp-3);
  margin: var(--sp-2) 0;
  border-radius: var(--r-md);
  background: rgba(10, 10, 18, 0.5);
  border-left: 4rpx solid var(--color-liu);
}
.p-row.p-吉 {
  border-left-color: #4fae6f;
}
.p-row.p-凶 {
  border-left-color: #c8302a;
}
.p-name {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.p-desc {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  line-height: 1.6;
  margin-top: 2rpx;
}
</style>
