<template>
  <view class="dayun-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="大运流转" subtitle="LIFE FORTUNE FLOW" />

    <!-- 输入 -->
    <view v-if="!result" class="form card-mystic anim-fade-up">
      <text class="form-title title-mystic">九 十 年 流 转</text>
      <text class="form-sub">生 辰 输 入 · 推 演 一 生 轨 迹</text>

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
        <text>· 90 年逐年推演 · 4 期人生划分 · 10 大转折 · 高低曲线 · 最佳建议</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '流转推演中…' : '开 始 流 转' }}</text>
        </view>
      </view>
    </view>

    <!-- 结果 -->
    <view v-else class="result">
      <!-- 总评 -->
      <view class="overall card-mystic anim-fade-up">
        <text class="card-title title-mystic">九 十 年 总 评</text>
        <view class="overall-row">
          <view class="overall-num">
            <text class="num-val">{{ result.overall.avgScore }}</text>
            <text class="num-unit">/ 100</text>
          </view>
          <view class="overall-info">
            <text class="ov-best">巅峰：{{ result.overall.peakAge }} 岁</text>
            <text class="ov-worst">低谷：{{ result.overall.valleyAge }} 岁</text>
            <text class="ov-stage">盛期：{{ stageName(result.overall.bestStage) }}</text>
          </view>
        </view>
        <text class="overall-summary">{{ result.overall.summary }}</text>
        <view class="overall-tags">
          <text class="ov-tag">日主 · {{ result.dayMaster }}</text>
          <text class="ov-tag">年柱 · {{ result.birth.gan }}{{ result.birth.zhi }}</text>
          <text class="ov-tag">性别 · {{ form.gender }}</text>
        </view>
      </view>

      <!-- 90 年曲线图 -->
      <view class="curve card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="card-title title-mystic">九 十 年 曲 线</text>
        <text class="card-tip">点 击 曲 线 上 的 节 点 查 看 流 年</text>

        <view class="svg-wrap">
          <svg :viewBox="`0 0 ${svgW} ${svgH}`" class="curve-svg" preserveAspectRatio="none">
            <!-- 阶段底色 -->
            <rect x="0" y="0" :width="W * 20" :height="svgH" fill="rgba(79,174,111,0.06)" />
            <rect :x="W * 20" y="0" :width="W * 20" :height="svgH" fill="rgba(200,48,42,0.06)" />
            <rect :x="W * 40" y="0" :width="W * 20" :height="svgH" fill="rgba(212,175,55,0.06)" />
            <rect :x="W * 60" y="0" :width="W * 30" :height="svgH" fill="rgba(27,58,92,0.06)" />

            <!-- 网格 -->
            <line
              v-for="g in 5"
              :key="'g' + g"
              :x1="0"
              :y1="g * (svgH / 6)"
              :x2="svgW"
              :y2="g * (svgH / 6)"
              stroke="rgba(212,175,55,0.08)"
              stroke-width="1"
            />

            <!-- 阶段分界 -->
            <line
              :x1="W * 20"
              y1="0"
              :x2="W * 20"
              :y2="svgH"
              stroke="rgba(79,174,111,0.4)"
              stroke-width="1"
              stroke-dasharray="3 3"
            />
            <line
              :x1="W * 40"
              y1="0"
              :x2="W * 40"
              :y2="svgH"
              stroke="rgba(200,48,42,0.4)"
              stroke-width="1"
              stroke-dasharray="3 3"
            />
            <line
              :x1="W * 60"
              y1="0"
              :x2="W * 60"
              :y2="svgH"
              stroke="rgba(212,175,55,0.4)"
              stroke-width="1"
              stroke-dasharray="3 3"
            />

            <!-- 总分曲线 -->
            <polyline
              :points="curvePoints('total')"
              fill="none"
              stroke="#D4AF37"
              stroke-width="2.5"
            />

            <!-- 转折点标记 -->
            <circle
              v-for="(tp, i) in result.turningPoints"
              :key="'tp' + i"
              :cx="W * tp.age"
              :cy="scoreY(curveValueAt(tp.age, 'total'))"
              r="4"
              :fill="tp.level === '大吉' || tp.level === '吉' ? '#4FAE6F' : '#C8302A'"
            />

            <!-- 选中点 -->
            <circle
              v-if="selected"
              :cx="W * selected.age"
              :cy="scoreY(selected.scores.total)"
              r="6"
              fill="#D4AF37"
              stroke="#fff"
              stroke-width="2"
            />
          </svg>
          <view class="svg-axes">
            <text class="ax-l">高</text>
            <text class="ax-l">中</text>
            <text class="ax-l">低</text>
          </view>
          <view class="svg-x">
            <text class="ax-x">0</text>
            <text class="ax-x">20</text>
            <text class="ax-x">40</text>
            <text class="ax-x">60</text>
            <text class="ax-x">80</text>
          </view>
        </view>

        <view class="legend">
          <text class="leg-item">
            <text class="leg-dot" style="background: #d4af37"></text>总分
          </text>
          <text class="leg-item"><text class="leg-dot" style="background: #4fae6f"></text>吉</text>
          <text class="leg-item"><text class="leg-dot" style="background: #c8302a"></text>凶</text>
        </view>
      </view>

      <!-- 4 期划分 -->
      <view class="stages card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">四 期 人 生</text>
        <view v-for="(s, i) in result.stages" :key="i" class="stage-row">
          <view class="stage-line" :style="{ background: s.color }" />
          <view class="stage-info">
            <text class="stage-name">{{ s.name }}</text>
            <text class="stage-range">{{ s.range[0]! }}-{{ s.range[1]! }} 岁</text>
          </view>
          <view class="stage-score">
            <text class="stage-num">{{ s.avgScore }}</text>
            <text class="stage-desc">{{ s.desc }}</text>
            <text class="stage-best">
              最佳 {{ s.bestYear.age }} 岁 · 最弱 {{ s.worstYear.age }} 岁
            </text>
          </view>
        </view>
      </view>

      <!-- 10 大转折 -->
      <view class="tps card-mystic anim-fade-up" style="animation-delay: 0.2s">
        <text class="card-title title-mystic">十 大 转 折</text>
        <text class="card-tip">一 生 中 最 重 要 的 10 个 节 点</text>
        <view
          v-for="(tp, i) in result.turningPoints"
          :key="i"
          class="tp-row"
          :class="'tp-' + tp.level"
          @click="selectByAge(tp.age)"
        >
          <view class="tp-age">
            <text class="tp-age-num">{{ tp.age }}</text>
            <text class="tp-age-year">{{ tp.year }}</text>
          </view>
          <view class="tp-info">
            <view class="tp-head">
              <text class="tp-type">{{ tp.type }}</text>
              <text class="tp-level" :class="'lv-' + tp.level">{{ tp.level }}</text>
            </view>
            <text class="tp-gz">
              {{ tp.ganzhi }}（{{ WX_META[tp.wuxing].name }}） · 大运
              {{ tp.dayunName || '本运' }}
            </text>
            <text class="tp-desc">{{ tp.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 流年详情（选中后展示） -->
      <view v-if="selected" class="detail card-mystic anim-fade-up" style="animation-delay: 0.25s">
        <text class="card-title title-mystic">
          {{ selected.age }} 岁 · {{ selected.year }} {{ selected.ganzhi }}
        </text>
        <text class="card-tip">
          {{ WX_META[selected.wuxing].name }}年 · 大运 {{ selected.dayunName }}
        </text>

        <view class="d5">
          <view v-for="(item, idx) in d5List" :key="idx" class="d5-cell">
            <text class="d5-name">{{ item.name }}</text>
            <view class="d5-bar">
              <view class="d5-fill" :style="{ width: item.val + '%', background: item.color }" />
            </view>
            <text class="d5-val" :style="{ color: item.color }">{{ item.val }}</text>
          </view>
        </view>

        <view class="d-tags">
          <text class="d-tag level" :class="'lv-' + selected.level">{{ selected.level }}</text>
          <text class="d-tag stage" :style="{ borderColor: stageColor(selected.stage) }">
            {{ stageName(selected.stage) }}
          </text>
        </view>

        <view class="d-text">
          <text class="d-line">· 一句：{{ selected.highlight }}</text>
          <text class="d-line">· 建议：{{ selected.advice }}</text>
          <text class="d-line">· 事件：{{ selected.event }}</text>
        </view>

        <view class="d-lucky">
          <text class="lk-label">幸 运</text>
          <text class="lk-val">五行：{{ WX_META[selected.lucky.wuxing].name }}</text>
          <text class="lk-val">色：{{ selected.lucky.color }}</text>
          <text class="lk-val">方：{{ selected.lucky.direction }}</text>
          <text class="lk-val">数：{{ selected.lucky.number }}</text>
        </view>
      </view>

      <!-- 全部 90 年表（折叠） -->
      <view class="all-years card-mystic anim-fade-up" style="animation-delay: 0.3s">
        <text class="card-title title-mystic">九 十 年 明 细</text>
        <view class="year-tabs">
          <view
            v-for="d in decades"
            :key="d"
            class="year-tab"
            :class="{ active: decade === d }"
            @click="decade = d"
          >
            {{ d }}-{{ d + 9 }}
          </view>
        </view>
        <view class="y-list">
          <view
            v-for="y in decadeYears"
            :key="y.age"
            class="y-row"
            :class="{ active: selected?.age === y.age }"
            @click="select(y)"
          >
            <text class="y-age">{{ y.age }}</text>
            <text class="y-gz">{{ y.ganzhi }}</text>
            <text class="y-wx" :style="{ color: WX_META[y.wuxing].color }">
              {{ WX_META[y.wuxing].name }}
            </text>
            <text class="y-lv" :class="'lv-' + y.level">{{ y.level }}</text>
            <text class="y-total">{{ y.scores.total }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import {
  calcLifeFortune,
  LIFE_STAGES,
  type LifeResult,
  type LifeStage,
  type YearFortune,
} from '@/utils/dayun-life'
import { WUXING_META } from '@/utils/wuxing'

const app = useAppStore()

// 五行 meta
const WX_META = WUXING_META

const form = ref({
  year: 1990,
  month: 6,
  day: 15,
  hour: 12,
  gender: '男' as '男' | '女',
})

const monthRange = Array.from({ length: 12 }, (_, i) => i + 1 + '月')
const hourRange = Array.from({ length: 24 }, (_, i) => i + ':00')

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

const result = ref<LifeResult | null>(null)
const loading = ref(false)
const selected = ref<YearFortune | null>(null)
const decade = ref(0)

const calculate = async () => {
  // 校验
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
  if (new Date(y, m - 1, d).getTime() > Date.now()) {
    uni.showToast({ title: '日期不能晚于今日', icon: 'none' })
    return
  }
  loading.value = true
  await new Promise((r) => setTimeout(r, 600))
  try {
    result.value = calcLifeFortune(y, m, d, form.value.hour, form.value.gender)
    // 默认选中今年
    const cur = new Date().getFullYear()
    const nearest = result.value.years.find((y) => y.year === cur) || result.value.years[0]!
    selected.value = nearest
    decade.value = Math.floor(nearest.age / 10) * 10
    app.addHistory({
      tool: 'dayun',
      toolName: '大运流转',
      category: '修心',
      input: { ...form.value },
      output: { avgScore: result.value.overall.avgScore, peak: result.value.overall.peakAge },
      brief: `90年均分${result.value.overall.avgScore} · 巅峰${result.value.overall.peakAge}岁`,
    })
  } finally {
    loading.value = false
  }
}

// 曲线
const svgW = 900
const svgH = 280
const W = svgW / 90 // 1 岁占 10 像素

function scoreY(score: number): number {
  // 20-100 → svgH-0
  const ratio = (score - 20) / 80
  return svgH - ratio * (svgH - 20) - 10
}

function curvePoints(field: keyof YearFortune['scores']): string {
  if (!result.value) return ''
  return result.value.curve.map((c) => `${c.age * W},${scoreY(c[field] as number)}`).join(' ')
}

function curveValueAt(age: number, field: keyof YearFortune['scores']): number {
  if (!result.value) return 50
  const c = result.value.curve.find((c) => c.age === age)
  return c ? (c[field] as number) : 50
}

function selectByAge(age: number) {
  if (!result.value) return
  selected.value = result.value.years.find((y) => y.age === age) || null
}

function select(y: YearFortune) {
  selected.value = y
}

const decades = computed(() => {
  if (!result.value) return []
  const last = result.value.years[result.value.years.length - 1].age!
  const arr: number[] = []
  for (let d = 0; d <= last; d += 10) arr.push(d)
  return arr
})

const decadeYears = computed(() => {
  if (!result.value) return []
  return result.value.years.filter((y) => y.age >= decade.value && y.age < decade.value + 10)
})

const d5List = computed(() => {
  if (!selected.value) return []
  return [
    { name: '事业', val: selected.value.scores.shiye, color: '#C8302A' },
    { name: '财运', val: selected.value.scores.caiyun, color: '#D4AF37' },
    { name: '感情', val: selected.value.scores.ganqing, color: '#5B3A8E' },
    { name: '健康', val: selected.value.scores.jiankang, color: '#4FAE6F' },
    { name: '精神', val: selected.value.scores.jingshen, color: '#1B3A5C' },
  ]
})

function stageName(s: LifeStage): string {
  return LIFE_STAGES.find((x) => x.key === s)?.name || ''
}
function stageColor(s: LifeStage): string {
  return LIFE_STAGES.find((x) => x.key === s)?.color || '#D4AF37'
}
</script>

<style scoped>
.dayun-page {
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
  margin-bottom: var(--sp-2);
  letter-spacing: 0.2em;
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
.form-picker,
.form-input {
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
  background: linear-gradient(135deg, #c8302a, #d4af37);
  color: var(--color-bai);
  border-color: var(--color-liu);
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
  display: inline-block;
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #c8302a, #d4af37);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  text-align: center;
  min-width: 320rpx;
  box-shadow: 0 8rpx 24rpx rgba(200, 48, 42, 0.3);
}
.btn-zhu.is-loading {
  opacity: 0.6;
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
  text-align: center;
}
.card-tip {
  display: block;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-bottom: var(--sp-3);
  letter-spacing: 0.1em;
}

/* ===== 总评 ===== */
.overall {
  padding: var(--sp-4);
}
.overall-row {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin: var(--sp-3) 0;
}
.overall-num {
  display: flex;
  align-items: baseline;
  color: var(--color-liu);
}
.num-val {
  font-size: 96rpx;
  font-weight: 700;
  font-family: 'KaiTi', serif;
  text-shadow: 0 0 20rpx rgba(212, 175, 55, 0.5);
}
.num-unit {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  margin-left: 4rpx;
}
.overall-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.ov-best {
  color: #4fae6f;
}
.ov-worst {
  color: #c8302a;
}
.ov-stage {
  color: var(--color-liu);
}
.overall-summary {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin: var(--sp-2) 0;
  line-height: 1.6;
  font-family: 'KaiTi', serif;
}
.overall-tags {
  display: flex;
  justify-content: center;
  gap: var(--sp-2);
}
.ov-tag {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border: 1rpx solid rgba(212, 175, 55, 0.4);
  border-radius: var(--r-sm);
  color: var(--color-liu);
}

/* ===== 曲线 ===== */
.curve {
  padding: var(--sp-4);
}
.svg-wrap {
  position: relative;
  width: 100%;
  height: 320rpx;
  background: linear-gradient(180deg, rgba(10, 10, 18, 0.6), rgba(10, 10, 18, 0.3));
  border-radius: var(--r-md);
  padding: var(--sp-2);
}
.curve-svg {
  width: 100%;
  height: 100%;
}
.svg-axes {
  position: absolute;
  top: var(--sp-2);
  left: 8rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100% - var(--sp-4));
}
.ax-l {
  font-size: 18rpx;
  color: var(--color-bai-3);
}
.svg-x {
  display: flex;
  justify-content: space-between;
  padding: 0 4rpx;
  margin-top: 2rpx;
}
.ax-x {
  font-size: 18rpx;
  color: var(--color-bai-3);
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

/* ===== 四期 ===== */
.stages {
  padding: var(--sp-4);
}
.stage-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
}
.stage-line {
  width: 6rpx;
  height: 60rpx;
  border-radius: 3rpx;
}
.stage-info {
  display: flex;
  flex-direction: column;
  width: 140rpx;
}
.stage-name {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-weight: 600;
}
.stage-range {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.stage-score {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.stage-num {
  font-size: 40rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.stage-desc {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}
.stage-best {
  font-size: 20rpx;
  color: var(--color-bai-3);
}

/* ===== 转折点 ===== */
.tps {
  padding: var(--sp-4);
}
.tp-row {
  display: flex;
  gap: var(--sp-2);
  padding: var(--sp-3);
  margin-bottom: var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  border-left: 6rpx solid #4fae6f;
  cursor: pointer;
}
.tp-row.tp-凶,
.tp-row.tp-小凶 {
  border-left-color: #c8302a;
}
.tp-age {
  width: 100rpx;
  text-align: center;
}
.tp-age-num {
  display: block;
  font-size: 40rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-liu);
}
.tp-age-year {
  font-size: 20rpx;
  color: var(--color-bai-3);
}
.tp-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.tp-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.tp-type {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-weight: 600;
}
.tp-level {
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: var(--r-sm);
}
.tp-level.lv-大吉,
.tp-level.lv-吉 {
  background: #4fae6f;
  color: #fff;
}
.tp-level.lv-平 {
  background: #d4af37;
  color: #000;
}
.tp-level.lv-小凶,
.tp-level.lv-凶 {
  background: #c8302a;
  color: #fff;
}
.tp-gz {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}
.tp-desc {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  line-height: 1.5;
}

/* ===== 详情 ===== */
.detail {
  padding: var(--sp-4);
}
.d5 {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: var(--sp-3) 0;
}
.d5-cell {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.d5-name {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.d5-bar {
  flex: 1;
  height: 14rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 7rpx;
  overflow: hidden;
}
.d5-fill {
  height: 100%;
  border-radius: 7rpx;
  transition: width 0.6s ease;
}
.d5-val {
  width: 60rpx;
  text-align: right;
  font-size: var(--fs-sm);
  font-weight: 600;
}
.d-tags {
  display: flex;
  gap: var(--sp-2);
  margin: var(--sp-2) 0;
}
.d-tag {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
  border: 1rpx solid;
}
.d-tag.level.lv-大吉,
.d-tag.level.lv-吉 {
  background: #4fae6f;
  color: #fff;
  border-color: #4fae6f;
}
.d-tag.level.lv-平 {
  background: #d4af37;
  color: #000;
  border-color: #d4af37;
}
.d-tag.level.lv-小凶,
.d-tag.level.lv-凶 {
  background: #c8302a;
  color: #fff;
  border-color: #c8302a;
}
.d-tag.stage {
  color: var(--color-bai-2);
}
.d-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  margin: var(--sp-2) 0;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
}
.d-line {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.6;
}
.d-lucky {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-top: var(--sp-2);
}
.lk-label {
  color: var(--color-liu);
  font-weight: 600;
}
.lk-val {
  padding: 4rpx 8rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--r-sm);
}

/* ===== 90 年明细 ===== */
.all-years {
  padding: var(--sp-4);
}
.year-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
  margin-bottom: var(--sp-2);
}
.year-tab {
  padding: 6rpx 14rpx;
  font-size: var(--fs-xs);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  color: var(--color-bai-2);
}
.year-tab.active {
  background: var(--color-liu);
  color: var(--color-bai);
  border-color: var(--color-liu);
}
.y-list {
  display: flex;
  flex-direction: column;
  max-height: 600rpx;
  overflow-y: auto;
}
.y-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.08);
  cursor: pointer;
}
.y-row.active {
  background: rgba(212, 175, 55, 0.15);
}
.y-age {
  width: 60rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-weight: 600;
}
.y-gz {
  width: 80rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.y-wx {
  width: 60rpx;
  font-size: var(--fs-xs);
}
.y-lv {
  flex: 1;
  font-size: var(--fs-xs);
  padding: 2rpx 8rpx;
  border-radius: var(--r-sm);
  text-align: center;
}
.y-lv.lv-大吉,
.y-lv.lv-吉 {
  background: #4fae6f;
  color: #fff;
}
.y-lv.lv-平 {
  background: #d4af37;
  color: #000;
}
.y-lv.lv-小凶,
.y-lv.lv-凶 {
  background: #c8302a;
  color: #fff;
}
.y-total {
  width: 50rpx;
  text-align: right;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-weight: 600;
}
</style>
