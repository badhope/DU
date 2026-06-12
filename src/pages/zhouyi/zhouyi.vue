<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="周易本义" subtitle="ZHOUYI · BENYI · 64 HEXAGRAMS" />

    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">朱 熹 · 周 易 本 义</text>
      <text class="form-sub">六 十 四 卦 · 十 翼 详 批 · 朱 熹 断 占</text>

      <view class="form-row">
        <text class="form-label">所 问</text>
        <view class="topic-grid">
          <view
            v-for="(t, i) in topics"
            :key="i"
            class="t-btn"
            :class="{ active: form.topic === t }"
            @click="form.topic = t"
          >
            {{ t }}
          </view>
        </view>
      </view>

      <view class="form-row">
        <text class="form-label">起 卦 法</text>
        <view class="gender">
          <view
            v-for="(m, i) in ['时间起卦', '手动起卦']"
            :key="i"
            class="g-btn"
            :class="{ active: form.mode === m }"
            @click="form.mode = m as any"
          >
            {{ m }}
          </view>
        </view>
      </view>

      <view v-if="form.mode === '时间起卦'" class="form-tip">
        <text>· 以当前时间（年/月/日/时）起卦，朱熹《周易本义》法</text>
        <text>· 起卦时间 · {{ nowStr }}</text>
      </view>
      <view v-else class="form-tip">
        <text>· 手动报数 · 默念所问 · 取 1-9999 三个数</text>
        <text>· 上卦 = (a+b+c) % 8 · 下卦 = (a+b+c+d) % 8 · 动爻 = (a+b+c+d) % 6</text>
        <view class="num-row">
          <input v-model="form.n1" type="number" class="num-in" placeholder="数 1" />
          <input v-model="form.n2" type="number" class="num-in" placeholder="数 2" />
          <input v-model="form.n3" type="number" class="num-in" placeholder="数 3" />
          <input v-model="form.n4" type="number" class="num-in" placeholder="时辰数 0-23" />
        </view>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="onCalculate">
          <text>{{ loading ? '排 盘 中…' : '起 卦 · 占 断' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.08">
        <!-- 概览 -->
        <view class="card card-mystic card-hoverable anim-fade-up">
          <text class="card-title title-mystic">
            {{ result.benGuaName }} · 第 {{ result.ben }} 卦
          </text>
          <text class="ov-sub">
            {{ result.upper }} 上 · {{ result.lower }} 下 · 动爻 {{ result.moving }} 位
          </text>
          <view class="gua-row">
            <view class="gua-cell">
              <text class="gc-label">本 卦</text>
              <text class="gc-name">{{ result.benGuaName }}</text>
            </view>
            <view class="gua-arrow">→</view>
            <view class="gua-cell">
              <text class="gc-label">变 卦</text>
              <text class="gc-name">{{ result.bianGuaName }}</text>
            </view>
          </view>
          <view class="gua-row">
            <view class="gua-cell">
              <text class="gc-label">互 卦</text>
              <text class="gc-name-sm">{{ result.huGuaName }}</text>
            </view>
            <view class="gua-cell">
              <text class="gc-label">错 卦</text>
              <text class="gc-name-sm">{{ result.cuoGuaName }}</text>
            </view>
            <view class="gua-cell">
              <text class="gc-label">综 卦</text>
              <text class="gc-name-sm">{{ result.zongGuaName }}</text>
            </view>
          </view>
          <text class="judgement">{{ result.judgement }}</text>
        </view>

        <!-- 卦辞 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.08s">
          <text class="card-title title-mystic">卦 辞</text>
          <text class="ci-text">{{ result.guaCi }}</text>
        </view>

        <!-- 彖传 + 象传 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">彖 传 · 象 传</text>
          <view class="ten-yi">
            <view class="ty-row">
              <text class="ty-tag">彖</text>
              <text class="ty-text">{{ result.tuan }}</text>
            </view>
            <view class="ty-row">
              <text class="ty-tag">象</text>
              <text class="ty-text">{{ result.xiang }}</text>
            </view>
          </view>
        </view>

        <!-- 六爻辞 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.22s">
          <text class="card-title title-mystic">六 爻 辞</text>
          <view class="yao-list">
            <view
              v-for="(y, i) in result.yaoCi"
              :key="i"
              class="yao-item"
              :class="{ moving: i + 1 === result.moving }"
            >
              <text class="y-pos">{{ ['初', '二', '三', '四', '五', '上'][i] }}{{ i < 3 ? '内' : '外' }}</text>
              <text class="y-text">{{ y }}</text>
              <text v-if="i + 1 === result.moving" class="y-tag">动爻</text>
              <text v-else-if="i + 1 === result.shi" class="y-tag shi">世</text>
              <text v-else-if="i + 1 === result.ying" class="y-tag ying">应</text>
            </view>
          </view>
        </view>

        <!-- 用神/占断 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.3s">
          <text class="card-title title-mystic">用 神 · 占 断</text>
          <view class="ys-grid">
            <view class="ys-cell">
              <text class="ys-l">所 问</text>
              <text class="ys-v">{{ form.topic }}</text>
            </view>
            <view class="ys-cell">
              <text class="ys-l">用 神</text>
              <text class="ys-v">{{ result.yongShen.target }}</text>
            </view>
            <view class="ys-cell">
              <text class="ys-l">世 / 应</text>
              <text class="ys-v">世{{ result.shi }} · 应{{ result.ying }}</text>
            </view>
            <view class="ys-cell">
              <text class="ys-l">五 行</text>
              <text class="ys-v">{{ result.fiveEl }}</text>
            </view>
          </view>
          <text class="ys-advice">{{ result.yongShen.source }}：{{ result.yongShen.advice }}</text>
        </view>

        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.38s">
          <text class="card-title title-mystic">朱 熹 断 辞</text>
          <text class="duan-text">{{ duanCi }}</text>
        </view>

        <view class="form-actions" style="margin-top: 32rpx">
          <view class="btn-secondary" @click="reset">重 新 起 卦</view>
        </view>
      </ResultReveal>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import ResultReveal from '@/components/ui/ResultReveal.vue'
import { useAppStore } from '@/stores'
import {
  fullDivination,
  type ZhouyiResult,
  type Trigram,
  timeDivination,
  type HexIndex,
} from '@/utils/zhouyi'

const app = useAppStore()
const loading = ref(false)
const result = ref<ZhouyiResult | null>(null)
const topics: ('事业' | '财运' | '婚姻' | '健康' | '学业' | '家宅' | '诉讼' | '出行')[] = [
  '事业', '财运', '婚姻', '健康', '学业', '家宅', '诉讼', '出行',
]
const form = ref<{ topic: (typeof topics)[number]; mode: '时间起卦' | '手动起卦'; n1: string; n2: string; n3: string; n4: string }>({
  topic: '事业',
  mode: '时间起卦',
  n1: '',
  n2: '',
  n3: '',
  n4: '',
})

const nowStr = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})
function pad(n: number) {
  return String(n).padStart(2, '0')
}

onMounted(() => {})

async function onCalculate() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 600))
  let r: ZhouyiResult
  if (form.value.mode === '时间起卦') {
    r = fullDivination(new Date(), form.value.topic)
  } else {
    const n1 = Number(form.value.n1) || 0
    const n2 = Number(form.value.n2) || 0
    const n3 = Number(form.value.n3) || 0
    const n4 = Number(form.value.n4) || 0
    const upNum = ((n1 + n2 + n3) % 8) || 8
    const lowNum = ((n1 + n2 + n3 + n4) % 8) || 8
    const moving = (((n1 + n2 + n3 + n4) % 6) || 6) as 1 | 2 | 3 | 4 | 5 | 6
    r = manualDivination(upNum, lowNum, moving, form.value.topic)
  }
  result.value = r
  loading.value = false
  app.addHistory({
    tool: 'zhouyi',
    toolName: '周易本义',
    category: '高阶典籍',
    input: { topic: form.value.topic, mode: form.value.mode },
    output: {
      ben: r.benGuaName,
      bian: r.bianGuaName,
      hu: r.huGuaName,
      cuo: r.cuoGuaName,
      zong: r.zongGuaName,
      guaCi: r.guaCi,
    },
    brief: `${r.benGuaName} 之 ${r.bianGuaName} · 问 ${form.value.topic}`,
  })
}

function reset() {
  result.value = null
  form.value.n1 = ''
  form.value.n2 = ''
  form.value.n3 = ''
  form.value.n4 = ''
}

// 手动起卦 - 简化：直接复用 fullDivination 的字段
import { HEXAGRAM_NAMES, HEXAGRAM_TEXTS, findShi, findYing, naJia, transformHex, makeHu, makeCuo, makeZong, numToTrigram, lookupHex, TRIGRAMS } from '@/utils/zhouyi'
function manualDivination(upNum: number, lowNum: number, moving: 1 | 2 | 3 | 4 | 5 | 6, topic: '事业' | '财运' | '婚姻' | '健康' | '学业' | '家宅' | '诉讼' | '出行'): ZhouyiResult {
  const upper = numToTrigram(upNum)
  const lower = numToTrigram(lowNum)
  const ben = lookupHex(upper, lower)
  const bian = transformHex(upper, lower, moving)
  const hu = makeHu(upper, lower)
  const cuo = makeCuo(upper, lower)
  const zong = makeZong(upper, lower)
  const shi = findShi(ben)
  const ying = findYing(shi)
  const t = HEXAGRAM_TEXTS[ben]
  const yaoGanZhi = naJia(upper, lower)
  const yongMap: Record<string, { target: string; source: string; advice: string }> = {
    事业: { target: '世爻', source: '动爻所变之爻', advice: '世爻得日月生扶为吉，休囚为凶' },
    财运: { target: '财爻', source: '妻财爻', advice: '财爻持世或生世可求，财爻空破难成' },
    婚姻: { target: '财/官', source: '男看财爻女看官', advice: '用神旺相主婚可成，休囚空破难成' },
    健康: { target: '世爻', source: '世爻为命主', advice: '世爻安静无伤为吉，受克有灾' },
    学业: { target: '父母爻', source: '文昌父母', advice: '父母爻旺相主考可成，休囚不利' },
    家宅: { target: '世爻/宅', source: '世爻与宅爻', advice: '世宅皆安为吉，一伤一破有忧' },
    诉讼: { target: '官鬼爻', source: '官鬼为讼', advice: '官鬼生世利我，仇世则凶' },
    出行: { target: '世爻', source: '世爻为行人', advice: '世爻旺相可动，休囚守旧' },
  }
  return {
    time: { y: new Date().getFullYear(), m: new Date().getMonth() + 1, d: new Date().getDate(), h: new Date().getHours(), min: new Date().getMinutes() },
    upper, lower, moving, ben, bian, hu, cuo, zong, shi, ying,
    fiveEl: t.fiveEl,
    benGuaName: HEXAGRAM_NAMES[ben - 1],
    bianGuaName: HEXAGRAM_NAMES[bian - 1],
    huGuaName: HEXAGRAM_NAMES[hu - 1],
    cuoGuaName: HEXAGRAM_NAMES[cuo - 1],
    zongGuaName: HEXAGRAM_NAMES[zong - 1],
    guaCi: t.guaCi,
    tuan: t.tuan,
    xiang: t.xiang,
    yaoCi: t.yaoCi,
    yaoGanZhi,
    judgement: t.judgement,
    yongShen: yongMap[topic],
  }
}

const duanCi = computed(() => {
  if (!result.value) return ''
  const r = result.value
  const movingIdx = r.moving - 1
  return `朱熹断：${r.benGuaName}（${r.fiveEl}）之 ${r.bianGuaName}，动爻在 ${r.moving} 位。${r.yaoCi[movingIdx]}。所问「${form.value.topic}」，用神为「${r.yongShen.target}」，${r.yongShen.advice}。本卦表当前之势，变卦示终之应，互卦述事之因，错卦反其相，综卦旁其照。君子观象玩辞，当慎思明辨。`
})
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
  padding: var(--sp-4) var(--sp-3);
  margin: var(--sp-3) var(--sp-2) 0;
}
.form-title {
  display: block;
  font-size: var(--fs-xl);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--sp-1);
}
.form-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-3);
}
.form-row {
  margin-bottom: var(--sp-3);
}
.form-label {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-1);
  letter-spacing: 0.1em;
}
.topic-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-1);
}
.t-btn {
  padding: var(--sp-2) 0;
  text-align: center;
  font-size: var(--fs-xs);
  font-family: 'KaiTi', serif;
  color: var(--color-bai-2);
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
}
.t-btn.active {
  background: var(--color-zhu);
  color: var(--color-bai);
  border-color: var(--color-zhu);
}
.gender {
  display: flex;
  gap: var(--sp-2);
}
.g-btn {
  flex: 1;
  padding: var(--sp-2) 0;
  text-align: center;
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
  color: var(--color-bai-2);
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
}
.g-btn.active {
  background: var(--color-zhu);
  color: var(--color-bai);
  border-color: var(--color-zhu);
}
.form-tip {
  margin-bottom: var(--sp-3);
  padding: var(--sp-2);
  background: rgba(20, 20, 28, 0.3);
  border-left: 4rpx solid var(--color-liu);
  border-radius: var(--r-sm);
}
.form-tip text {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
  line-height: 1.6;
}
.num-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-1);
  margin-top: var(--sp-1);
}
.num-in {
  padding: var(--sp-1) var(--sp-2);
  background: rgba(10, 10, 18, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-size: var(--fs-sm);
  text-align: center;
}
.form-actions {
  margin-top: var(--sp-4);
}
.btn-zhu {
  padding: var(--sp-3);
  text-align: center;
  background: linear-gradient(135deg, #5B3A8E, #C8302A);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  box-shadow: 0 4rpx 16rpx rgba(200, 48, 42, 0.4);
}
.btn-zhu.is-loading {
  opacity: 0.7;
}
.btn-secondary {
  padding: var(--sp-3);
  text-align: center;
  background: rgba(20, 20, 28, 0.6);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-size: var(--fs-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  border-radius: var(--r-md);
}

.result {
  position: relative;
  z-index: var(--z-content);
  padding: var(--sp-2);
}
.card {
  background: rgba(15, 15, 24, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  padding: var(--sp-3);
  margin-bottom: var(--sp-3);
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-liu);
  margin-bottom: var(--sp-2);
  letter-spacing: 0.1em;
}
.ov-sub {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-2);
}
.gua-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}
.gua-cell {
  flex: 1;
  text-align: center;
  padding: var(--sp-2);
  background: rgba(212, 175, 55, 0.08);
  border-radius: var(--r-sm);
}
.gc-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
  margin-bottom: 4rpx;
}
.gc-name {
  display: block;
  font-size: var(--fs-lg);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-bai);
}
.gc-name-sm {
  display: block;
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-bai);
}
.gua-arrow {
  font-size: 32rpx;
  color: var(--color-liu);
}
.judgement {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-style: italic;
  margin-top: var(--sp-2);
  padding-top: var(--sp-2);
  border-top: 1rpx dashed rgba(212, 175, 55, 0.2);
}
.ci-text {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.8;
  text-align: center;
  padding: var(--sp-2);
  background: rgba(212, 175, 55, 0.06);
  border-radius: var(--r-sm);
}
.ten-yi {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.ty-row {
  display: flex;
  gap: var(--sp-2);
  align-items: flex-start;
}
.ty-tag {
  flex-shrink: 0;
  width: 80rpx;
  padding: 6rpx 0;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai);
  background: var(--color-zhu);
  border-radius: var(--r-sm);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.ty-text {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
}
.yao-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}
.yao-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2);
  background: rgba(20, 20, 28, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-sm);
}
.yao-item.moving {
  background: rgba(200, 48, 42, 0.15);
  border-color: var(--color-zhu);
}
.y-pos {
  flex-shrink: 0;
  width: 80rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-align: center;
}
.y-text {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.6;
}
.y-tag {
  flex-shrink: 0;
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  font-family: 'KaiTi', serif;
  background: var(--color-zhu);
  color: var(--color-bai);
  border-radius: var(--r-sm);
}
.y-tag.shi {
  background: var(--color-liu);
  color: #1a1a2a;
}
.y-tag.ying {
  background: #1B3A5C;
  color: var(--color-bai);
}
.ys-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-1);
  margin-bottom: var(--sp-2);
}
.ys-cell {
  padding: var(--sp-2);
  background: rgba(212, 175, 55, 0.06);
  border-radius: var(--r-sm);
}
.ys-l {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
  margin-bottom: 2rpx;
}
.ys-v {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.ys-advice {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-sm);
}
.duan-text {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.9;
  text-indent: 2em;
}
</style>
