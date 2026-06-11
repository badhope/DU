<template>
  <view class="liuren-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="大六壬" subtitle="GREAT LIUREN" />

    <view v-if="!result" class="form card-mystic anim-fade-up">
      <text class="form-title title-mystic">天 盘 地 盘</text>
      <text class="form-sub">月 将 加 时 · 四 课 三 传</text>

      <UserSwitcher tool="liuren" />

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
        <text>· 简化大六壬：月将 + 占时 → 天盘地盘 → 四课三传</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '排课中…' : '起 六 壬 课' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <!-- 大六壬天地盘可视化 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.04s">
        <LiuRenDaChart :result="result" />
      </view>

      <!-- 课体总断 -->
      <view class="card card-mystic anim-fade-up" :class="'lv-' + judgeLevel">
        <text class="card-title title-mystic">课 体 总 断</text>
        <view class="sum-row">
          <text class="sum-judge" :class="'jd-' + result.judge">{{ result.judge }}</text>
          <text class="sum-keti">{{ result.keti }}</text>
        </view>
        <text class="sum-desc">{{ result.summary }}</text>
        <view class="sum-lucky">
          <view class="lucky-cell">
            <text class="lucky-label">吉 色</text>
            <text class="lucky-val">{{ result.lucky.color }}</text>
          </view>
          <view class="lucky-cell">
            <text class="lucky-label">吉 方</text>
            <text class="lucky-val">{{ result.lucky.direction }}</text>
          </view>
          <view class="lucky-cell">
            <text class="lucky-label">吉 数</text>
            <text class="lucky-val">{{ result.lucky.number }}</text>
          </view>
        </view>
      </view>

      <!-- 天地盘 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.05s">
        <text class="card-title title-mystic">天 盘 · 地 盘</text>
        <text class="card-tip">月 将 {{ result.monthJiang }} · 占 时 {{ result.hourZhi }}时</text>

        <view class="pan-tbl">
          <view class="pan-row pan-head">
            <text class="pan-th">地支</text>
            <text v-for="(t, i) in 12" :key="'h' + i" class="pan-th">{{ tianZhi[i] }}</text>
          </view>
          <view class="pan-row">
            <text class="pan-td-label">天盘</text>
            <text
              v-for="(p, i) in result.tianPan"
              :key="'t' + i"
              class="pan-td"
              :class="'gen-' + natureClass(p.general)"
            >
              {{ p.general }}
            </text>
          </view>
          <view class="pan-row">
            <text class="pan-td-label">地盘</text>
            <text
              v-for="(p, i) in result.diPan"
              :key="'d' + i"
              class="pan-td"
              :class="'gen-' + natureClass(p.general)"
            >
              {{ p.general }}
            </text>
          </view>
        </view>
      </view>

      <!-- 四课 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="card-title title-mystic">四 课</text>
        <text class="card-tip">日干 {{ result.dayGan }} · 日支 {{ result.dayZhi }}</text>
        <view class="ke-list">
          <view v-for="(k, i) in result.fourKe" :key="i" class="ke-item">
            <view class="ke-info">
              <text class="ke-name">{{ k.ke }}</text>
              <text class="ke-desc">{{ k.desc }}</text>
            </view>
            <view class="ke-pair">
              <text class="ke-zhi">{{ k.zhi }}</text>
              <text class="ke-arrow">→</text>
              <text class="ke-general" :class="'gen-' + natureClass(k.general)">
                {{ k.general }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 三传 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">三 传</text>
        <text class="card-tip">贼 克 法 · 初 中 末 传</text>
        <view class="sc-flow">
          <view class="sc-item">
            <text class="sc-label">初 传</text>
            <text class="sc-general" :class="'gen-' + natureClass(result.sanChuan.chu)">
              {{ result.sanChuan.chu }}
            </text>
          </view>
          <text class="sc-arrow">→</text>
          <view class="sc-item">
            <text class="sc-label">中 传</text>
            <text class="sc-general" :class="'gen-' + natureClass(result.sanChuan.zhong)">
              {{ result.sanChuan.zhong }}
            </text>
          </view>
          <text class="sc-arrow">→</text>
          <view class="sc-item">
            <text class="sc-label">末 传</text>
            <text class="sc-general" :class="'gen-' + natureClass(result.sanChuan.mo)">
              {{ result.sanChuan.mo }}
            </text>
          </view>
        </view>
        <text class="sc-desc">课体：{{ result.ketiDesc }}</text>
      </view>

      <view class="reset">
        <view class="btn-ghost" @click="reset">重 起 六 壬</view>
      </view>
    </view>

    <ToolGuard
      :show-cooldown="showCooldown"
      :show-add-user="showAddUser"
      :cooldown-record="cooldownRecord"
      :new-user-name="newUserName"
      :new-user-remark="newUserRemark"
      @close="cd.onCooldownClose"
      @switch-user="cd.onCooldownSwitchUser"
      @switch-tool="cd.onCooldownSwitchTool"
      @ignore="cd.onCooldownIgnore"
      @cancel-add-user="showAddUser = false"
      @confirm-add-user="cd.confirmAddUser"
      @update:new-user-name="(v: string) => (newUserName = v)"
      @update:new-user-remark="(v: string) => (newUserRemark = v)"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TaijiBg from '@/shared/components/effects/TaijiBg.vue'
import TopBar from '@/shared/components/ui/TopBar.vue'
import LiuRenDaChart from '@/modules/zhanbu/components/charts/LiuRenDaChart.vue'
import UserSwitcher from '@/shared/components/ui/UserSwitcher.vue'
import ToolGuard from '@/shared/components/ui/ToolGuard.vue'
import { calcLiuren, type LiurenResult } from '@/modules/zhanbu/logic/liuren'
import { useAppStore } from '@/stores'
import { useCooldown } from '@/shared/composables/use-cooldown'

const app = useAppStore()
const cd = useCooldown({ tool: 'liuren', toolName: '大六壬', category: '命理' })
// 解构 refs 方便模板使用
const { showCooldown, cooldownRecord, showAddUser, newUserName, newUserRemark } = cd

const form = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  hour: new Date().getHours(),
})
const result = ref<LiurenResult | null>(null)
const loading = ref(false)

const monthRange = Array.from({ length: 12 }, (_, i) => `${i + 1} 月`)
const hourRange = Array.from({ length: 24 }, (_, i) => `${i}:00`)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPick(field: 'year' | 'month' | 'day' | 'hour', e: any) {
  let v = Number(e.detail.value)
  if (field === 'month') v += 1
  form.value[field] = v
}

const tianZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const GOOD_G = ['贵人', '六合', '青龙', '太常', '太阴', '天后']
const BAD_G = ['白虎', '玄武', '勾陈', '螣蛇', '天空', '朱雀']

function natureClass(g: string): 'good' | 'bad' | 'mid' {
  if (GOOD_G.includes(g)) return 'good'
  if (BAD_G.includes(g)) return 'bad'
  return 'mid'
}

const judgeLevel = computed(() => {
  if (!result.value) return 'mid'
  const j = result.value.judge
  if (j === '大吉' || j === '吉') return 'good'
  if (j === '凶' || j === '大凶') return 'bad'
  return 'mid'
})

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
      result.value = calcLiuren(y, m, d, form.value.hour)
      loading.value = false
      cd.commit(
        `${result.value.keti} · ${result.value.judge} · 初传${result.value.sanChuan.chu}`,
        { ...form.value },
        { keti: result.value.keti, judge: result.value.judge, sanChuan: result.value.sanChuan },
      )
    } catch (_e) {
      loading.value = false
      uni.showModal({ title: '排盘失败', content: '请检查日期输入', showCancel: false })
    }
  }, 700)
}

function reset() {
  result.value = null
}
</script>

<style scoped>
.liuren-page {
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

.card.lv-good {
  border-color: rgba(79, 174, 111, 0.4);
}
.card.lv-bad {
  border-color: rgba(200, 48, 42, 0.4);
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

/* ===== 课体总断 ===== */
.sum-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
}

.sum-judge {
  font-size: var(--fs-2xl);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  padding: 4rpx 24rpx;
  border: 2rpx solid;
  border-radius: var(--r-md);
  text-shadow: 0 0 12rpx currentColor;
}

.sum-judge.jd-大吉,
.sum-judge.jd-吉 {
  color: #4fae6f;
  border-color: #4fae6f;
  background: rgba(79, 174, 111, 0.1);
}
.sum-judge.jd-中 {
  color: var(--color-liu);
  border-color: var(--color-liu);
}
.sum-judge.jd-凶,
.sum-judge.jd-大凶 {
  color: var(--color-zhu);
  border-color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.1);
}

.sum-keti {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.1em;
}

.sum-desc {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-style: italic;
  line-height: 1.6;
  margin-bottom: var(--sp-3);
}

.sum-lucky {
  display: flex;
  gap: var(--sp-2);
}

.lucky-cell {
  flex: 1;
  text-align: center;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}

.lucky-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}

.lucky-val {
  display: block;
  font-size: var(--fs-lg);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-top: 4rpx;
}

/* ===== 天地盘 ===== */
.pan-tbl {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  padding: var(--sp-2);
  overflow-x: auto;
}

.pan-row {
  display: grid;
  grid-template-columns: 70rpx repeat(12, 1fr);
  align-items: center;
  gap: 2rpx;
  min-width: 100%;
}

.pan-row.pan-head {
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
  padding-bottom: var(--sp-1);
  margin-bottom: 4rpx;
}

.pan-th,
.pan-td {
  text-align: center;
  font-size: 22rpx;
  padding: 6rpx 2rpx;
  font-family: 'KaiTi', serif;
}

.pan-th {
  color: var(--color-bai-3);
  font-weight: 600;
}

.pan-td-label {
  font-size: 22rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-align: center;
  grid-column: 1;
}

.pan-td {
  color: var(--color-bai);
  border-radius: 4rpx;
}

.pan-td.gen-good {
  color: #4fae6f;
  background: rgba(79, 174, 111, 0.15);
}
.pan-td.gen-bad {
  color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.15);
}
.pan-td.gen-mid {
  color: var(--color-bai-2);
}

/* ===== 四课 ===== */
.ke-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.ke-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
}

.ke-info {
  display: flex;
  flex-direction: column;
}

.ke-name {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}

.ke-desc {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
  margin-top: 2rpx;
}

.ke-pair {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
}

.ke-zhi {
  font-size: 32rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  width: 48rpx;
  text-align: center;
}

.ke-arrow {
  color: var(--color-bai-3);
  font-size: var(--fs-md);
}

.ke-general {
  font-size: 28rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
  min-width: 80rpx;
  text-align: center;
}

.ke-general.gen-good {
  color: #4fae6f;
  background: rgba(79, 174, 111, 0.15);
}
.ke-general.gen-bad {
  color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.15);
}
.ke-general.gen-mid {
  color: var(--color-bai);
  background: rgba(100, 100, 120, 0.2);
}

/* ===== 三传 ===== */
.sc-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.sc-item {
  flex: 1;
  text-align: center;
  padding: var(--sp-3) var(--sp-1);
  background: rgba(10, 10, 18, 0.5);
  border: 2rpx solid var(--color-liu);
  border-radius: var(--r-md);
}

.sc-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-1);
}

.sc-general {
  display: block;
  font-size: 40rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 12rpx currentColor;
}

.sc-general.gen-good {
  color: #4fae6f;
}
.sc-general.gen-bad {
  color: var(--color-zhu);
}
.sc-general.gen-mid {
  color: var(--color-liu);
}

.sc-arrow {
  color: var(--color-liu);
  font-size: var(--fs-xl);
}

.sc-desc {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  font-style: italic;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.3);
  border-radius: var(--r-md);
}

.reset {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}
</style>
