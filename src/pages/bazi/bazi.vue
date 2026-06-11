<template>
  <view class="bazi-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="八字排盘" subtitle="FOUR PILLARS OF DESTINY" />

    <!-- 输入区 -->
    <view v-if="!bazi" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">请输入生辰</text>
      <text class="form-sub">年月日时 · 天地人神四柱</text>

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
          <view class="form-picker">{{ form.hour }}:00 ({{ hourZhiName }})</view>
        </picker>
      </view>

      <view class="form-row">
        <text class="form-label">经度</text>
        <picker
          mode="number"
          :value="form.longitude"
          :min="73"
          :max="135"
          @change="onPick('longitude', $event)"
        >
          <view class="form-picker">{{ form.longitude }}°E · 真太阳时 {{ trueSolar.label }}</view>
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
        <text>· 输入经度可自动修正真太阳时 · 命理深度算法</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="calculate">
          <text>{{ loading ? '排盘中…' : '排 盘' }}</text>
        </view>
      </view>
    </view>

    <!-- 排盘结果 -->
    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.1">
        <view class="bazi-card card-mystic anim-fade-up card-hoverable">
          <text class="result-title title-mystic">命 盘</text>
          <text class="result-sub">
            {{ form.year }}年{{ form.month }}月{{ form.day }}日 · {{ hourZhiName }} · 真太阳时{{
              trueSolar.label
            }}
          </text>

          <!-- 四柱：横排 -->
          <view class="pillars">
            <view v-for="(p, i) in pillars" :key="i" class="pillar" @click="togglePillar(i)">
              <text class="pillar-pos">{{ p.label }}</text>
              <view
                class="pillar-gan"
                :style="{
                  borderColor: WUXING_META[p.wxGan].color,
                  color: WUXING_META[p.wxGan].color,
                }"
              >
                {{ p.gan }}
              </view>
              <view
                class="pillar-zhi"
                :style="{
                  borderColor: WUXING_META[p.wxZhi].color,
                  color: WUXING_META[p.wxZhi].color,
                }"
              >
                {{ p.zhi }}
              </view>
              <text class="pillar-ss">{{ p.shishen }}</text>
              <view v-if="openedPillar === i" class="pillar-cang anim-fade">
                <view v-for="(c, j) in p.canggan" :key="j" class="cang-row">
                  <text class="cang-level" :class="'lv-' + c.level">{{ c.level }}</text>
                  <text class="cang-gan" :style="{ color: WUXING_META[c.wuxing].color }">
                    {{ c.gan }}
                  </text>
                </view>
              </view>
            </view>
          </view>
          <text class="tap-tip">· 点击柱位查看藏干 ·</text>
        </view>

        <!-- 神煞 -->
        <view
          v-if="shenshaList.length"
          class="card card-mystic card-hoverable anim-fade-up"
          style="animation-delay: 0.1s"
        >
          <text class="card-title title-mystic">神 煞</text>
          <view class="ss-list">
            <view v-for="(s, i) in shenshaList" :key="i" class="ss-item" :class="'ss-' + s.type">
              <text class="ss-name">{{ s.name }}</text>
              <text class="ss-type" :class="'ss-tag-' + s.type">{{ s.type }}</text>
              <text class="ss-desc">{{ s.desc }}</text>
            </view>
          </view>
        </view>

        <!-- 胎元/命宫/身宫 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.12s">
          <text class="card-title title-mystic">胎 元 · 命 宫 · 身 宫</text>
          <view class="tms-row">
            <view class="tms-cell">
              <text class="tms-label">胎 元</text>
              <view class="tms-gz">
                <text class="tms-gan">{{ taiYuan.gan }}</text>
                <text class="tms-zhi">{{ taiYuan.zhi }}</text>
              </view>
              <text class="tms-desc">{{ taiYuanNayin }}</text>
            </view>
            <view class="tms-cell">
              <text class="tms-label">命 宫</text>
              <view class="tms-gz">
                <text class="tms-zhi tms-only">{{ mingGong.zhi }}</text>
              </view>
              <text class="tms-desc">{{ mingGongDesc }}</text>
            </view>
            <view class="tms-cell">
              <text class="tms-label">身 宫</text>
              <view class="tms-gz">
                <text class="tms-zhi tms-only">{{ shenGong.zhi }}</text>
              </view>
              <text class="tms-desc">{{ shenGongDesc }}</text>
            </view>
          </view>
        </view>

        <!-- 五行分布 -->
        <view
          class="wx-card card-mystic anim-fade-up card-hoverable"
          style="animation-delay: 0.15s"
        >
          <text class="result-title title-mystic">五行分布</text>
          <view class="wx-bars">
            <view v-for="wx in wuxingList" :key="wx.key" class="wx-bar">
              <text class="bar-name" :style="{ color: wx.color }">{{ wx.name }}</text>
              <view class="bar-track">
                <view
                  class="bar-fill"
                  :style="{
                    width: ((wxCount[wx.key] || 0) / 8) * 100 + '%',
                    background: wx.gradient,
                  }"
                />
              </view>
              <text class="bar-num">{{ wxCount[wx.key] || 0 }}</text>
            </view>
          </view>
        </view>

        <!-- 日主 -->
        <view
          class="rizhu-card card-mystic anim-fade-up card-hoverable"
          style="animation-delay: 0.2s"
        >
          <text class="result-title title-mystic">日主 · {{ bazi.day.gan }}</text>
          <text class="rizhu-desc">{{ dayMasterDesc }}</text>
          <view class="rizhu-grid">
            <view class="rizhu-cell">
              <text class="cell-label">五行</text>
              <text class="cell-val" :style="{ color: WUXING_META[dayWx].color }">
                {{ WUXING_META[dayWx].name }}
              </text>
            </view>
            <view class="rizhu-cell">
              <text class="cell-label">阴阳</text>
              <text class="cell-val">{{ dayYy }}</text>
            </view>
            <view class="rizhu-cell">
              <text class="cell-label">季节</text>
              <text class="cell-val">{{ WUXING_META[dayWx].season }}</text>
            </view>
            <view class="rizhu-cell">
              <text class="cell-label">德行</text>
              <text class="cell-val">{{ WUXING_META[dayWx].virtue }}</text>
            </view>
          </view>
        </view>

        <!-- 大运跳转 -->
        <view
          class="card card-mystic anim-fade-up go-dayun card-hoverable"
          style="animation-delay: 0.22s"
          @click="goDayun"
        >
          <text class="go-glyph">运</text>
          <view class="go-info">
            <text class="go-title title-mystic">查 看 流 年 大 运</text>
            <text class="go-desc">十 步 大 运 · 流 年 应 期 · 起 运 时 间</text>
          </view>
          <text class="go-arrow">›</text>
        </view>

        <!-- 重排 -->
        <view class="reset">
          <view class="btn-ghost" @click="reset">
            <text>重新排盘</text>
          </view>
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
import { ref, computed, nextTick } from 'vue'
import { gsap } from 'gsap'
import TaijiBg from '@/shared/components/effects/TaijiBg.vue'
import TopBar from '@/shared/components/ui/TopBar.vue'
import _BaziChart from '@/components/charts/BaziChart.vue'
import {
  calcBazi,
  TIANGAN_WUXING,
  DIZHI_WUXING,
  TIANGAN_YINYANG,
  TIANGAN_DESC,
  DIZHI_DESC as _DIZHI_DESC,
  HOUR_TO_DIZHI,
} from '@/utils/bazi'
import { WUXING_META, WUXING_LIST, type Wuxing } from '@/utils/wuxing'
import {
  DIZHI_CANGGAN,
  shishen,
  nayin,
  shensha,
  taiyuan,
  minggong,
  shengong,
  trueSolarTime,
} from '@/utils/bazi-deep'
import { useAppStore } from '@/stores'
import _UserSwitcher from '@/shared/components/ui/UserSwitcher.vue'
import ToolGuard from '@/shared/components/ui/ToolGuard.vue'
import { useCooldown } from '@/shared/composables/use-cooldown'
import LoadingSeal from '@/shared/components/ui/LoadingSeal.vue'
import ResultReveal from '@/shared/components/ui/ResultReveal.vue'

const app = useAppStore()
const cd = useCooldown({ tool: 'bazi', toolName: '八字排盘', category: '命理' })
const _toolKey = 'bazi' as const

const form = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  hour: new Date().getHours(),
  longitude: 120,
  gender: '男' as '男' | '女',
})
const bazi = ref<ReturnType<typeof calcBazi> | null>(null)
const loading = ref(false)
const openedPillar = ref<number | null>(null)

const monthRange = Array.from({ length: 12 }, (_, i) => `${i + 1} 月`)
const hourRange = Array.from({ length: 24 }, (_, i) => `${i}:00`)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPick(field: 'year' | 'month' | 'day' | 'hour' | 'longitude', e: any) {
  form.value[field] = Number(e.detail.value)
}

const hourZhiName = computed(() => {
  const h = form.value.hour
  const zhi = HOUR_TO_DIZHI.find((z) => {
    if (z.start > z.end) return h >= z.start || h < z.end
    return h >= z.start && h < z.end
  })
  return zhi ? zhi.name : ''
})

const trueSolar = computed(() => {
  const t = trueSolarTime(form.value.hour, 0, form.value.longitude)
  return { label: `${t.hour}:00 · 差 ${t.diff} 分`, diff: t.diff }
})

function calculate() {
  if (!cd.guard()) return
  // 日期合法性校验
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
  const daysInMonth = new Date(y, m, 0).getDate()
  if (d < 1 || d > daysInMonth) {
    uni.showToast({ title: `${m}月只有${daysInMonth}天`, icon: 'none' })
    return
  }
  // 未来日期拦截（命理不测未发生）
  const today = new Date()
  const birth = new Date(y, m - 1, d)
  if (birth.getTime() > today.getTime()) {
    uni.showToast({ title: '日期不能晚于今日', icon: 'none' })
    return
  }
  loading.value = true
  setTimeout(() => {
    try {
      // 用真太阳时排盘
      const t = trueSolarTime(form.value.hour, 0, form.value.longitude)
      bazi.value = calcBazi(y, m, d, t.hour)
      // 记录
      app.addHistory({
        tool: 'bazi',
        toolName: '八字排盘',
        category: '命理',
        input: { ...form.value },
        output: { dayMaster: bazi.value.day.gan },
        brief: `${y}年${m}月${d}日 · 日主${bazi.value.day.gan}`,
      })
      nextTick(() => {
        try {
          const ps = document.querySelectorAll('.pillar')
          if (ps && ps.length) {
            gsap.fromTo(
              ps,
              { y: 40, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
            )
          }
          const fills = document.querySelectorAll('.bar-fill')
          if (fills && fills.length) {
            gsap.fromTo(
              fills,
              { width: '0%' },
              {
                width: (i, el) => el.style.width,
                duration: 0.9,
                stagger: 0.1,
                ease: 'power2.out',
                delay: 0.4,
              },
            )
          }
        } catch (_e) {}
      })
    } catch (_e) {
      uni.showModal({
        title: '排盘失败',
        content: '请检查输入的年月日时是否完整',
        showCancel: false,
      })
    } finally {
      loading.value = false
    }
  }, 2400)
}

function reset() {
  bazi.value = null
  openedPillar.value = null
}

function togglePillar(i: number) {
  openedPillar.value = openedPillar.value === i ? null : i
}

function goDayun() {
  uni.navigateTo({ url: '/pages/liunian/liunian' })
}

const wuxingList = WUXING_LIST.map((k) => WUXING_META[k])

const wxCount = computed(() => {
  if (!bazi.value) return {} as Record<Wuxing, number>
  const cnt: Record<Wuxing, number> = { jin: 0, mu: 0, shui: 0, huo: 0, tu: 0 }
  const ps = [bazi.value.year, bazi.value.month, bazi.value.day, bazi.value.hour]
  ps.forEach((p) => {
    cnt[TIANGAN_WUXING[p.gan]]++
    cnt[DIZHI_WUXING[p.zhi]]++
  })
  return cnt
})

const dayWx = computed<Wuxing>(() => (bazi.value ? TIANGAN_WUXING[bazi.value.day.gan] : 'mu'))
const dayYy = computed(() =>
  bazi.value ? (TIANGAN_YINYANG[bazi.value.day.gan] === 'yang' ? '阳' : '阴') : '',
)
const dayMasterDesc = computed(() => (bazi.value ? TIANGAN_DESC[bazi.value.day.gan] : ''))

const pillars = computed(() => {
  if (!bazi.value) return []
  return [
    {
      label: '年柱',
      gan: bazi.value.year.gan,
      zhi: bazi.value.year.zhi,
      wxGan: TIANGAN_WUXING[bazi.value.year.gan],
      wxZhi: DIZHI_WUXING[bazi.value.year.zhi],
      shishen: shishen(bazi.value.day.gan, bazi.value.year.gan),
      canggan: getCg(bazi.value.year.zhi),
    },
    {
      label: '月柱',
      gan: bazi.value.month.gan,
      zhi: bazi.value.month.zhi,
      wxGan: TIANGAN_WUXING[bazi.value.month.gan],
      wxZhi: DIZHI_WUXING[bazi.value.month.zhi],
      shishen: shishen(bazi.value.day.gan, bazi.value.month.gan),
      canggan: getCg(bazi.value.month.zhi),
    },
    {
      label: '日柱',
      gan: bazi.value.day.gan,
      zhi: bazi.value.day.zhi,
      wxGan: TIANGAN_WUXING[bazi.value.day.gan],
      wxZhi: DIZHI_WUXING[bazi.value.day.zhi],
      shishen: '日主',
      canggan: getCg(bazi.value.day.zhi),
    },
    {
      label: '时柱',
      gan: bazi.value.hour.gan,
      zhi: bazi.value.hour.zhi,
      wxGan: TIANGAN_WUXING[bazi.value.hour.gan],
      wxZhi: DIZHI_WUXING[bazi.value.hour.zhi],
      shishen: shishen(bazi.value.day.gan, bazi.value.hour.gan),
      canggan: getCg(bazi.value.hour.zhi),
    },
  ]
})

function getCg(zhi: string) {
  const gans = DIZHI_CANGGAN[zhi as keyof typeof DIZHI_CANGGAN] || []
  return gans.map((g, i) => ({
    gan: g,
    wuxing: TIANGAN_WUXING[g],
    level: (i === 0 ? '本' : i === 1 ? '中' : '余') as '本' | '中' | '余',
  }))
}

const shenshaList = computed(() => (bazi.value ? shensha(bazi.value) : []))

const taiYuan = computed(() => (bazi.value ? taiyuan(bazi.value) : { gan: '', zhi: '' }))
const mingGong = computed(() => (bazi.value ? minggong(bazi.value) : { zhi: '' }))
const shenGong = computed(() => (bazi.value ? shengong(bazi.value) : { zhi: '' }))
const taiYuanNayin = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bazi.value ? nayin(taiYuan.value.gan as any, taiYuan.value.zhi as any).name : '',
)

const ZHI_NAMES: Record<string, string> = {
  子: '子 · 鼠',
  丑: '丑 · 牛',
  寅: '寅 · 虎',
  卯: '卯 · 兔',
  辰: '辰 · 龙',
  巳: '巳 · 蛇',
  午: '午 · 马',
  未: '未 · 羊',
  申: '申 · 猴',
  酉: '酉 · 鸡',
  戌: '戌 · 狗',
  亥: '亥 · 猪',
}
const mingGongDesc = computed(() =>
  mingGong.value.zhi ? ZHI_NAMES[mingGong.value.zhi] || mingGong.value.zhi : '',
)
const shenGongDesc = computed(() =>
  shenGong.value.zhi ? ZHI_NAMES[shenGong.value.zhi] || shenGong.value.zhi : '',
)
</script>

<style scoped>
.bazi-page {
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
}

/* ===== 结果 ===== */
.result {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0 var(--sp-2);
}

.bazi-card,
.wx-card,
.rizhu-card,
.card {
  padding: var(--sp-4);
}

.result-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-2);
  letter-spacing: 0.2em;
}

.result-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-bottom: var(--sp-4);
  font-family: 'KaiTi', serif;
}

.tap-tip {
  display: block;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-top: var(--sp-2);
  letter-spacing: 0.1em;
}

/* ===== 四柱 ===== */
.pillars {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-2);
}

.pillar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.pillar-pos {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
}

.pillar-gan,
.pillar-zhi {
  width: 100%;
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  background: rgba(10, 10, 18, 0.6);
  border: 2rpx solid;
  border-radius: var(--r-md);
  margin-bottom: 4rpx;
  text-shadow: 0 0 12rpx currentColor;
}

.pillar-gan {
  margin-bottom: 4rpx;
}
.pillar-zhi {
  font-size: 44rpx;
}

.pillar-ss {
  font-size: 20rpx;
  color: var(--color-zhu);
  font-family: 'KaiTi', serif;
  font-weight: 600;
  margin-top: 4rpx;
  letter-spacing: 0.1em;
}

.pillar-cang {
  margin-top: 6rpx;
  padding: 6rpx 8rpx;
  background: rgba(10, 10, 18, 0.7);
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  display: flex;
  flex-direction: column;
  gap: 2rpx;
  width: 100%;
}

.cang-row {
  display: flex;
  align-items: center;
  gap: 4rpx;
  justify-content: center;
}

.cang-level {
  font-size: 16rpx;
  padding: 0 4rpx;
  border-radius: 2rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-bai-3);
  background: rgba(255, 255, 255, 0.1);
}

.cang-level.lv-本 {
  color: var(--color-liu);
  background: rgba(212, 175, 55, 0.15);
}
.cang-level.lv-中 {
  color: #5b8cbe;
  background: rgba(91, 140, 190, 0.15);
}
.cang-level.lv-余 {
  color: var(--color-bai-3);
}

.cang-gan {
  font-size: 24rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}

/* ===== 神煞 ===== */
.ss-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.ss-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
}

.ss-item.ss-吉 {
  border-color: rgba(79, 174, 111, 0.4);
}
.ss-item.ss-凶 {
  border-color: rgba(200, 48, 42, 0.4);
}

.ss-name {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  min-width: 100rpx;
}

.ss-type {
  font-size: var(--fs-xs);
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}

.ss-tag-吉 {
  color: #4fae6f;
  background: rgba(79, 174, 111, 0.15);
}
.ss-tag-凶 {
  color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.15);
}
.ss-tag-中 {
  color: var(--color-bai-2);
  background: rgba(100, 100, 120, 0.2);
}

.ss-desc {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}

/* ===== 胎元命宫 ===== */
.tms-row {
  display: flex;
  gap: var(--sp-2);
}

.tms-cell {
  flex: 1;
  text-align: center;
  padding: var(--sp-3) var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}

.tms-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
}

.tms-gz {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.tms-gan,
.tms-zhi {
  font-size: 36rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  line-height: 1;
}

.tms-only {
  font-size: 44rpx;
}

.tms-desc {
  display: block;
  margin-top: var(--sp-1);
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
}

/* ===== 五行条 ===== */
.wx-bars {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.wx-bar {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.bar-name {
  width: 40rpx;
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}

.bar-track {
  flex: 1;
  height: 24rpx;
  background: rgba(10, 10, 18, 0.6);
  border-radius: var(--r-full);
  overflow: hidden;
  border: 1rpx solid rgba(212, 175, 55, 0.15);
}

.bar-fill {
  height: 100%;
  border-radius: var(--r-full);
  transition: width 0.8s var(--ease-bounce);
  box-shadow: 0 0 8rpx currentColor;
}

.bar-num {
  width: 32rpx;
  text-align: right;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}

/* ===== 日主 ===== */
.rizhu-desc {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-style: italic;
  margin: var(--sp-3) 0;
  line-height: 1.6;
  letter-spacing: 0.1em;
}

.rizhu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}

.rizhu-cell {
  display: flex;
  flex-direction: column;
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
}

.cell-label {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.2em;
}

.cell-val {
  font-size: var(--fs-md);
  color: var(--color-liu);
  margin-top: 4rpx;
  font-family: 'KaiTi', serif;
}

/* ===== 跳转大运 ===== */
.go-dayun {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  cursor: pointer;
}

.go-glyph {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-bai);
  background: linear-gradient(135deg, var(--color-zhu) 0%, #8b1f1a 100%);
  border-radius: 50%;
  box-shadow: 0 0 16rpx rgba(200, 48, 42, 0.4);
}

.go-info {
  flex: 1;
}

.go-title {
  display: block;
  font-size: var(--fs-md);
  margin-bottom: 4rpx;
}

.go-desc {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  letter-spacing: 0.1em;
}

.go-arrow {
  font-size: 56rpx;
  color: var(--color-liu);
}

.reset {
  margin-top: var(--sp-3);
  display: flex;
  justify-content: center;
}

.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}
</style>
