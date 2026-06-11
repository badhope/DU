<template>
  <view class="hehun-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="八字合婚" subtitle="BAZI MARRIAGE" />

    <!-- 输入 -->
    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">双 方 生 辰</text>
      <text class="form-sub">男 阳 女 阴 · 日柱为合婚之本</text>

      <view class="form-section">
        <text class="section-title">男 方</text>
        <view class="form-row">
          <text class="form-label">姓名</text>
          <input v-model="form.man.name" class="form-input" placeholder="张三" />
        </view>
        <view class="form-row">
          <text class="form-label">年</text>
          <picker
            mode="number"
            :value="form.man.year"
            :min="1900"
            :max="2010"
            @change="onPick('man', 'year', $event)"
          >
            <view class="form-picker">{{ form.man.year }} 年</view>
          </picker>
        </view>
        <view class="form-row">
          <text class="form-label">月</text>
          <picker
            mode="selector"
            :value="form.man.month - 1"
            :range="monthRange"
            @change="onPick('man', 'month', $event)"
          >
            <view class="form-picker">{{ form.man.month }} 月</view>
          </picker>
        </view>
        <view class="form-row">
          <text class="form-label">日</text>
          <picker
            mode="number"
            :value="form.man.day"
            :min="1"
            :max="31"
            @change="onPick('man', 'day', $event)"
          >
            <view class="form-picker">{{ form.man.day }} 日</view>
          </picker>
        </view>
        <view class="form-row">
          <text class="form-label">时</text>
          <picker
            mode="selector"
            :value="form.man.hour"
            :range="hourRange"
            @change="onPick('man', 'hour', $event)"
          >
            <view class="form-picker">{{ form.man.hour }}:00</view>
          </picker>
        </view>
      </view>

      <view class="form-section">
        <text class="section-title">女 方</text>
        <view class="form-row">
          <text class="form-label">姓名</text>
          <input v-model="form.woman.name" class="form-input" placeholder="李四" />
        </view>
        <view class="form-row">
          <text class="form-label">年</text>
          <picker
            mode="number"
            :value="form.woman.year"
            :min="1900"
            :max="2010"
            @change="onPick('woman', 'year', $event)"
          >
            <view class="form-picker">{{ form.woman.year }} 年</view>
          </picker>
        </view>
        <view class="form-row">
          <text class="form-label">月</text>
          <picker
            mode="selector"
            :value="form.woman.month - 1"
            :range="monthRange"
            @change="onPick('woman', 'month', $event)"
          >
            <view class="form-picker">{{ form.woman.month }} 月</view>
          </picker>
        </view>
        <view class="form-row">
          <text class="form-label">日</text>
          <picker
            mode="number"
            :value="form.woman.day"
            :min="1"
            :max="31"
            @change="onPick('woman', 'day', $event)"
          >
            <view class="form-picker">{{ form.woman.day }} 日</view>
          </picker>
        </view>
        <view class="form-row">
          <text class="form-label">时</text>
          <picker
            mode="selector"
            :value="form.woman.hour"
            :range="hourRange"
            @change="onPick('woman', 'hour', $event)"
          >
            <view class="form-picker">{{ form.woman.hour }}:00</view>
          </picker>
        </view>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '合婚中…' : '开 始 合 婚' }}</text>
        </view>
      </view>
    </view>

    <!-- 结果 -->
    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.1">
        <!-- 总分卡 -->
        <view
          class="score-card card-mystic anim-fade-up card-hoverable"
          :class="'lv-' + scoreLevelClass"
        >
          <view class="score-circle">
            <text class="score-num">{{ result.score.total }}</text>
            <text class="score-unit">/ 100</text>
          </view>
          <text class="score-level title-mystic">{{ result.score.level }}</text>
          <text class="score-brief">{{ result.score.brief }}</text>
          <view class="score-bars">
            <view class="score-bar">
              <text class="bar-name">年 命</text>
              <view class="bar-track">
                <view class="bar-fill" :style="{ width: result.score.year + '%' }" />
              </view>
              <text class="bar-val">{{ result.score.year }}</text>
            </view>
            <view class="score-bar">
              <text class="bar-name">日 柱</text>
              <view class="bar-track">
                <view class="bar-fill" :style="{ width: result.score.day + '%' }" />
              </view>
              <text class="bar-val">{{ result.score.day }}</text>
            </view>
            <view class="score-bar">
              <text class="bar-name">五 行</text>
              <view class="bar-track">
                <view class="bar-fill" :style="{ width: result.score.wuxing + '%' }" />
              </view>
              <text class="bar-val">{{ result.score.wuxing }}</text>
            </view>
            <view class="score-bar">
              <text class="bar-name">强 弱</text>
              <view class="bar-track">
                <view class="bar-fill" :style="{ width: result.score.strength + '%' }" />
              </view>
              <text class="bar-val">{{ result.score.strength }}</text>
            </view>
          </view>
        </view>

        <!-- 双方四柱 -->
        <view class="duo card-mystic anim-fade-up card-hoverable" style="animation-delay: 0.1s">
          <text class="card-title title-mystic">双 方 命 盘</text>
          <view class="duo-row">
            <view class="duo-side">
              <text class="duo-name">{{ result.man.name || '男' }}</text>
              <text class="duo-tag" :style="{ background: '#C8302A' }">
                {{ result.man.dayMaster }} · {{ result.man.nayin }}
              </text>
              <text class="duo-strength">日主 {{ result.man.strength }}</text>
              <view class="duo-pillars">
                <view v-for="(p, i) in manPillars" :key="'m' + i" class="duo-pillar">
                  <text class="duo-pname">{{ p.label }}</text>
                  <text class="duo-pcell">{{ p.gan }}</text>
                  <text class="duo-pcell">{{ p.zhi }}</text>
                </view>
              </view>
            </view>
            <view class="duo-vs">
              <text>×</text>
            </view>
            <view class="duo-side">
              <text class="duo-name">{{ result.woman.name || '女' }}</text>
              <text class="duo-tag" :style="{ background: '#5B3A8E' }">
                {{ result.woman.dayMaster }} · {{ result.woman.nayin }}
              </text>
              <text class="duo-strength">日主 {{ result.woman.strength }}</text>
              <view class="duo-pillars">
                <view v-for="(p, i) in womanPillars" :key="'w' + i" class="duo-pillar">
                  <text class="duo-pname">{{ p.label }}</text>
                  <text class="duo-pcell">{{ p.gan }}</text>
                  <text class="duo-pcell">{{ p.zhi }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 年命 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">年 命 纳 音</text>
          <view class="yn-row">
            <view class="yn-block">
              <text class="yn-label">男 命</text>
              <text class="yn-val">{{ result.yearNayin.man }}</text>
            </view>
            <view class="yn-rel" :class="'rel-' + result.yearNayin.relation">
              <text>{{ REL_GLYPH[result.yearNayin.relation] }}</text>
            </view>
            <view class="yn-block">
              <text class="yn-label">女 命</text>
              <text class="yn-val">{{ result.yearNayin.woman }}</text>
            </view>
          </view>
          <text class="yn-desc">{{ result.yearNayin.desc }}</text>
        </view>

        <!-- 日柱 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.2s">
          <text class="card-title title-mystic">日 柱 合 婚</text>
          <view class="dz-row">
            <view class="dz-block">
              <text class="dz-label">日 干</text>
              <view class="dz-pair">
                <text class="dz-char">{{ result.dayGan.man }}</text>
                <text class="dz-rel" :class="'rel-' + result.dayGan.relation">
                  {{ REL_GLYPH[result.dayGan.relation] }}
                </text>
                <text class="dz-char">{{ result.dayGan.woman }}</text>
              </view>
              <text class="dz-desc">{{ result.dayGan.desc }}</text>
            </view>
            <view class="dz-divider" />
            <view class="dz-block">
              <text class="dz-label">日 支</text>
              <view class="dz-pair">
                <text class="dz-char">{{ result.dayZhi.man }}</text>
                <text class="dz-rel" :class="'rel-' + result.dayZhi.relation">
                  {{ REL_GLYPH[result.dayZhi.relation] }}
                </text>
                <text class="dz-char">{{ result.dayZhi.woman }}</text>
              </view>
              <text class="dz-desc">{{ result.dayZhi.desc }}</text>
            </view>
          </view>
        </view>

        <!-- 五行 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.25s">
          <text class="card-title title-mystic">五 行 分 布</text>
          <view class="wx-table">
            <view class="wx-thead">
              <text class="wx-th">五 行</text>
              <text class="wx-th">男</text>
              <text class="wx-th">女</text>
              <text class="wx-th">差</text>
            </view>
            <view v-for="wx in wuxingList" :key="wx.key" class="wx-trow">
              <text class="wx-td" :style="{ color: wx.color }">{{ wx.name }}</text>
              <text class="wx-td">{{ result.wuxing.man[wx.key] || 0 }}</text>
              <text class="wx-td">{{ result.wuxing.woman[wx.key] || 0 }}</text>
              <text class="wx-td" :class="{ diff: (result.wuxing.diff[wx.key] || 0) >= 2 }">
                {{ result.wuxing.diff[wx.key] || 0 }}
              </text>
            </view>
          </view>
          <view v-if="result.wuxing.complement.length" class="wx-comp">
            <text class="comp-title">五 行 互 补</text>
            <view v-for="(c, i) in result.wuxing.complement" :key="i" class="comp-item">
              <text class="comp-glyph">·</text>
              <text class="comp-text">{{ c.desc }}</text>
            </view>
          </view>
        </view>

        <!-- 建议 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.3s">
          <text class="card-title title-mystic">合 婚 建 议</text>
          <view v-for="(s, i) in result.suggestions" :key="i" class="sug-item">
            <text class="sug-num">{{ i + 1 }}</text>
            <text class="sug-text">{{ s }}</text>
          </view>
        </view>

        <view class="reset">
          <view class="btn-ghost" @click="reset">重 新 合 婚</view>
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
      v-if="loading"
      :visible="loading"
      :title="'玄 机 推 演 中'"
      :steps="['清 心 · 凝 神', '观 象 · 感 应', '起 卦 · 演 数', '排 盘 · 归 藏', '解 卦 · 断 事']"
      :duration="2400"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TaijiBg from '@/shared/components/effects/TaijiBg.vue'
import TopBar from '@/shared/components/ui/TopBar.vue'
import { hehun, type HehunResult } from '@/modules/mingli/logic/hehun'
import { WUXING_META, WUXING_LIST } from '@/modules/mingli/logic/wuxing'
import {
  TIANGAN_WUXING as _TIANGAN_WUXING,
  DIZHI_WUXING as _DIZHI_WUXING,
  DIZHI_DESC as _DIZHI_DESC,
  HOUR_TO_DIZHI as _HOUR_TO_DIZHI,
} from '@/modules/mingli/logic/bazi'
import _HeHunChart from '@/modules/mingli/components/charts/HeHunChart.vue'
import { useAppStore } from '@/stores'
import _UserSwitcher from '@/shared/components/ui/UserSwitcher.vue'
import ToolGuard from '@/shared/components/ui/ToolGuard.vue'
import { useCooldown } from '@/shared/composables/use-cooldown'
import LoadingSeal from '@/shared/components/ui/LoadingSeal.vue'
import ResultReveal from '@/shared/components/ui/ResultReveal.vue'

const app = useAppStore()
const cd = useCooldown({ tool: 'hehun', toolName: '八字合婚', category: '合婚' })
const _toolKey = 'hehun' as const

const REL_GLYPH: Record<string, string> = {
  天干合: '合',
  六合: '合',
  三合: '合',
  比和: '比',
  相生: '生',
  相克: '克',
  六冲: '冲',
  六害: '害',
  无特殊: '平',
  合: '合',
}

const form = ref({
  man: { name: '张三', year: 1990, month: 5, day: 15, hour: 10 },
  woman: { name: '李四', year: 1992, month: 8, day: 20, hour: 14 },
})

// 若用户档案已存在，自动预填对应方（按本人性别映射 男→man / 女→woman）
if (app.profile) {
  const p = app.profile
  const self: { name: string; year: number; month: number; day: number; hour: number } = {
    name: p.nickname || (p.gender === 'female' ? '李四' : '张三'),
    year: typeof p.birthYear === 'number' ? p.birthYear : 1990,
    month: typeof p.birthMonth === 'number' ? p.birthMonth : 1,
    day: typeof p.birthDay === 'number' ? p.birthDay : 1,
    hour: typeof p.birthHour === 'number' ? p.birthHour : 12,
  }
  if (p.gender === 'female') {
    form.value.woman = { ...form.value.woman, ...self }
  } else if (p.gender === 'male') {
    form.value.man = { ...form.value.man, ...self }
  }
}
const result = ref<HehunResult | null>(null)
const loading = ref(false)

const monthRange = Array.from({ length: 12 }, (_, i) => `${i + 1} 月`)
const hourRange = Array.from({ length: 24 }, (_, i) => `${i}:00`)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPick(side: 'man' | 'woman', field: 'year' | 'month' | 'day' | 'hour', e: any) {
  let v = Number(e.detail.value)
  if (field === 'month') v += 1
  form.value[side][field] = v
}

const wuxingList = WUXING_LIST.map((k) => WUXING_META[k])

const manPillars = computed(() => {
  if (!result.value) return []
  return [
    { label: '年', gan: result.value.man.bazi.year.gan, zhi: result.value.man.bazi.year.zhi },
    { label: '月', gan: result.value.man.bazi.month.gan, zhi: result.value.man.bazi.month.zhi },
    { label: '日', gan: result.value.man.bazi.day.gan, zhi: result.value.man.bazi.day.zhi },
    { label: '时', gan: result.value.man.bazi.hour.gan, zhi: result.value.man.bazi.hour.zhi },
  ]
})
const womanPillars = computed(() => {
  if (!result.value) return []
  return [
    { label: '年', gan: result.value.woman.bazi.year.gan, zhi: result.value.woman.bazi.year.zhi },
    { label: '月', gan: result.value.woman.bazi.month.gan, zhi: result.value.woman.bazi.month.zhi },
    { label: '日', gan: result.value.woman.bazi.day.gan, zhi: result.value.woman.bazi.day.zhi },
    { label: '时', gan: result.value.woman.bazi.hour.gan, zhi: result.value.woman.bazi.hour.zhi },
  ]
})

const scoreLevelClass = computed(() => {
  if (!result.value) return 'mid'
  const lv = result.value.score.level
  if (lv === '上等婚' || lv === '中上等') return 'good'
  if (lv === '中等') return 'mid'
  return 'bad'
})

function calculate() {
  if (!cd.guard()) return
  // 校验姓名
  if (!form.value.man.name.trim() || !form.value.woman.name.trim()) {
    uni.showToast({ title: '请填写双方姓名', icon: 'none' })
    return
  }
  // 校验日期合法性
  if (!isValidDate(form.value.man.year, form.value.man.month, form.value.man.day)) {
    uni.showToast({ title: '男方日期不合法', icon: 'none' })
    return
  }
  if (!isValidDate(form.value.woman.year, form.value.woman.month, form.value.woman.day)) {
    uni.showToast({ title: '女方日期不合法', icon: 'none' })
    return
  }
  loading.value = true
  setTimeout(() => {
    try {
      result.value = hehun(form.value.man, form.value.woman)
      // 记录到历史
      app.addHistory({
        tool: 'hehun',
        toolName: '八字合婚',
        category: '命理',
        input: { man: form.value.man, woman: form.value.woman },
        output: result.value,
        brief: `${form.value.man.name}×${form.value.woman.name} · ${result.value.score.level} · ${result.value.score.total}分`,
      })
    } catch (_e) {
      uni.showModal({ title: '合婚失败', content: '请检查生辰是否完整', showCancel: false })
    } finally {
      loading.value = false
    }
  }, 700)
}

function isValidDate(y: number, m: number, d: number): boolean {
  if (y < 1900 || y > 2100) return false
  if (m < 1 || m > 12) return false
  const daysInMonth = new Date(y, m, 0).getDate()
  return d >= 1 && d <= daysInMonth
}

function reset() {
  result.value = null
}
</script>

<style scoped>
.hehun-page {
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

/* ===== 表单 ===== */
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
  letter-spacing: 0.1em;
  margin-bottom: var(--sp-4);
}

.form-section {
  margin-bottom: var(--sp-4);
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
}

.section-title {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
  text-align: center;
}

.form-row {
  display: flex;
  align-items: center;
  padding: var(--sp-2) var(--sp-3);
  margin-bottom: var(--sp-1);
  background: rgba(20, 20, 28, 0.5);
  border-radius: var(--r-sm);
}

.form-label {
  width: 80rpx;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
}

.form-input,
.form-picker {
  flex: 1;
  font-size: var(--fs-md);
  color: var(--color-bai);
  padding: var(--sp-1) 0;
  background: transparent;
  border: none;
  outline: none;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}

/* ===== 通用卡 ===== */
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

/* ===== 总分卡 ===== */
.score-card {
  margin: var(--sp-3) var(--sp-2);
  padding: var(--sp-5) var(--sp-4);
  text-align: center;
}

.score-card.lv-good {
  border-color: rgba(79, 174, 111, 0.5);
}
.score-card.lv-mid {
  border-color: rgba(212, 175, 55, 0.5);
}
.score-card.lv-bad {
  border-color: rgba(200, 48, 42, 0.5);
}

.score-circle {
  width: 200rpx;
  height: 200rpx;
  margin: 0 auto var(--sp-3);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, rgba(10, 10, 18, 0.8) 70%);
  border: 2rpx solid var(--color-liu);
  box-shadow: 0 0 32rpx rgba(212, 175, 55, 0.4);
}

.lv-good .score-circle {
  border-color: #4fae6f;
  box-shadow: 0 0 32rpx rgba(79, 174, 111, 0.4);
}
.lv-bad .score-circle {
  border-color: var(--color-zhu);
  box-shadow: 0 0 32rpx rgba(200, 48, 42, 0.4);
}

.score-num {
  font-size: 72rpx;
  font-weight: 700;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  line-height: 1;
}

.lv-good .score-num {
  color: #4fae6f;
}
.lv-bad .score-num {
  color: var(--color-zhu);
}

.score-unit {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  margin-top: 4rpx;
}

.score-level {
  display: block;
  font-size: var(--fs-xl);
  margin-bottom: var(--sp-2);
}

.score-brief {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-4);
  letter-spacing: 0.1em;
}

.score-bars {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.score-bar {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.bar-name {
  width: 80rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}

.bar-track {
  flex: 1;
  height: 12rpx;
  background: rgba(10, 10, 18, 0.6);
  border-radius: 6rpx;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-liu), #ffd700);
  box-shadow: 0 0 8rpx var(--color-liu);
  transition: width 0.8s var(--ease-bounce);
}

.lv-good .bar-fill {
  background: linear-gradient(90deg, #4fae6f, #7fe0a0);
  box-shadow: 0 0 8rpx #4fae6f;
}
.lv-bad .bar-fill {
  background: linear-gradient(90deg, var(--color-zhu), #e04a3a);
  box-shadow: 0 0 8rpx var(--color-zhu);
}

.bar-val {
  width: 40rpx;
  text-align: right;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}

/* ===== 双方命盘 ===== */
.duo-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.duo-side {
  flex: 1;
  text-align: center;
}

.duo-name {
  display: block;
  font-size: var(--fs-lg);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.duo-tag {
  display: inline-block;
  margin-top: var(--sp-1);
  padding: 4rpx 12rpx;
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}

.duo-strength {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-top: var(--sp-1);
}

.duo-pillars {
  display: flex;
  justify-content: center;
  gap: 4rpx;
  margin-top: var(--sp-2);
}

.duo-pillar {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.duo-pname {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}

.duo-pcell {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-liu);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: 4rpx;
  margin-top: 2rpx;
}

.duo-vs {
  font-size: 40rpx;
  color: var(--color-zhu);
  font-family: 'KaiTi', serif;
  padding: 0 var(--sp-2);
}

/* ===== 年命 / 日柱 ===== */
.yn-row,
.dz-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
}

.yn-block {
  flex: 1;
  text-align: center;
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}

.yn-label {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}

.yn-val {
  display: block;
  font-size: var(--fs-lg);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-top: 4rpx;
}

.yn-rel,
.dz-rel {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-bai);
  background: rgba(10, 10, 18, 0.8);
  border: 2rpx solid var(--color-liu);
}

.yn-desc,
.dz-desc {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  margin-top: var(--sp-2);
  font-style: italic;
}

.dz-block {
  flex: 1;
  text-align: center;
}

.dz-label {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
}

.dz-pair {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
}

.dz-char {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-liu);
  background: rgba(10, 10, 18, 0.5);
  border: 2rpx solid var(--color-liu);
  border-radius: var(--r-md);
}

.dz-rel {
  width: 60rpx;
  height: 60rpx;
}

.dz-divider {
  width: 1rpx;
  height: 100rpx;
  background: rgba(212, 175, 55, 0.2);
}

.rel-合,
.rel-天干合,
.rel-六合,
.rel-三合 {
  background: #4fae6f;
  border-color: #4fae6f;
  color: var(--color-bai);
}
.rel-比和 {
  background: var(--color-liu);
  border-color: var(--color-liu);
}
.rel-相生 {
  background: #5b8cbe;
  border-color: #5b8cbe;
}
.rel-相克,
.rel-六冲,
.rel-六害 {
  background: var(--color-zhu);
  border-color: var(--color-zhu);
}
.rel-无特殊,
.rel-平 {
  background: rgba(100, 100, 120, 0.5);
  border-color: rgba(150, 150, 170, 0.5);
}

/* ===== 五行表 ===== */
.wx-table {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  padding: var(--sp-2);
}

.wx-thead,
.wx-trow {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  align-items: center;
  padding: var(--sp-1) var(--sp-2);
}

.wx-thead {
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.2);
}

.wx-th {
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.1em;
}

.wx-td {
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.wx-td:first-child {
  text-align: left;
}

.wx-td.diff {
  color: var(--color-zhu);
}

.wx-comp {
  margin-top: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.3);
  border-radius: var(--r-md);
  border-left: 4rpx solid var(--color-liu);
}

.comp-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-1);
}

.comp-item {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-1);
  padding: 2rpx 0;
}

.comp-glyph {
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}

.comp-text {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  line-height: 1.6;
}

/* ===== 建议 ===== */
.sug-item {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-2) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
}

.sug-item:last-child {
  border-bottom: none;
}

.sug-num {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  background: var(--color-liu);
  color: #0a0a12;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  flex-shrink: 0;
}

.sug-text {
  flex: 1;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
}

.reset {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}
</style>
