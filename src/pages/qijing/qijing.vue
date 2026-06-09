<template>
  <view class="qijing-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="奇经八脉" subtitle="EIGHT EXTRA MERIDIANS" />

    <!-- 模式选择 -->
    <view class="tab-bar anim-fade-up">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="tab-btn"
        :class="{ active: tab === t.key }"
        @click="tab = t.key as Mode"
      >
        <text class="tab-name">{{ t.name }}</text>
        <text class="tab-sub">{{ t.sub }}</text>
      </view>
    </view>

    <!-- 模式 1：八脉总览 -->
    <view v-if="tab === 'qijing'" class="result anim-fade-up">
      <view class="qij-list">
        <view
          v-for="(q, i) in QIJING_LIST"
          :key="i"
          class="qij-card"
          :class="{ open: openQijing === i }"
          :style="{ borderColor: q.yinyang === '阴' ? '#5B3A8E' : '#C8302A' }"
          @click="openQijing = openQijing === i ? -1 : i"
        >
          <view class="qij-head">
            <view class="qij-yy" :class="q.yinyang === '阴' ? 'yin' : 'yang'">{{ q.yinyang }}</view>
            <text class="qij-name">{{ q.name }}</text>
            <text class="qij-route">{{ q.route }}</text>
          </view>
          <view v-if="openQijing === i" class="qij-body anim-fade">
            <text class="qij-fn-title">· 功能</text>
            <view class="qij-fns">
              <text v-for="(f, k) in q.functions" :key="k" class="qij-fn">{{ f }}</text>
            </view>
            <text class="qij-fn-title">· 主治</text>
            <view class="qij-syms">
              <text v-for="(s, k) in q.symptoms" :key="k" class="qij-sym">{{ s }}</text>
            </view>
            <text class="qij-fn-title">· 主要穴位（{{ q.acupoints.length }} 穴）</text>
            <text class="qij-points">
              {{ q.acupoints.slice(0, 12).join(' · ')
              }}<text v-if="q.acupoints.length > 12"> · …</text>
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 模式 2：十二正经 -->
    <view v-else-if="tab === 'jingluo'" class="result anim-fade-up">
      <!-- 子午流注可视化（核心） -->
      <view class="card card-mystic anim-fade-up">
        <text class="card-title title-mystic">子 午 流 注 · 二 十 四 时 辰</text>
        <ZiWuLiuZhuChart />
      </view>
      <view class="jl-list">
        <view
          v-for="(j, i) in JINGLUO_LIST"
          :key="i"
          class="jl-card"
          :class="{ open: openJl === i }"
          :style="{ borderLeftColor: j.yinyang === '阴' ? '#5B3A8E' : '#C8302A' }"
          @click="openJl = openJl === i ? -1 : i"
        >
          <view class="jl-head">
            <view class="jl-info">
              <text class="jl-name">{{ j.name }}</text>
              <text class="jl-full">{{ j.fullName }}</text>
            </view>
            <view class="jl-meta">
              <text class="jl-flow">{{ j.flowTime }}</text>
              <text class="jl-shengxiao">{{ j.shengxiao }}</text>
            </view>
          </view>
          <view v-if="openJl === i" class="jl-body anim-fade">
            <view class="jl-line">
              <text class="jl-line-label">流注方向：</text>
              <text class="jl-line-val">{{ j.direction }}</text>
            </view>
            <view class="jl-line">
              <text class="jl-line-label">起止：</text>
              <text class="jl-line-val">{{ j.start }} → {{ j.end }}</text>
            </view>
            <text class="jl-fn-title">· 功能</text>
            <view class="jl-fns">
              <text v-for="(f, k) in j.functions" :key="k" class="jl-fn">{{ f }}</text>
            </view>
            <text class="jl-fn-title">· 主治</text>
            <view class="jl-syms">
              <text v-for="(s, k) in j.pathologies" :key="k" class="jl-sym">{{ s }}</text>
            </view>
            <text class="jl-fn-title">· 主要穴位（{{ j.acupoints.length }} 穴）</text>
            <text class="jl-points">
              {{ j.acupoints.slice(0, 8).join(' · ')
              }}<text v-if="j.acupoints.length > 8"> · …</text>
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 模式 4：人体经络图 -->
    <view v-else-if="tab === 'bodymap'" class="result anim-fade-up">
      <BodyMap :initial-side="bodyMapSide" :initial-meridians="highlightedMeridians" />
    </view>

    <!-- 模式 3：病症诊断 -->
    <view v-else class="result anim-fade-up">
      <view class="diag card-mystic">
        <text class="card-title title-mystic">症 状 诊 断</text>
        <text class="card-tip">输 入 症 状 · 推 荐 经 脉</text>
        <view class="diag-input">
          <input v-model="symptom" class="di-inp" placeholder="如：失眠 / 头痛 / 胃痛 …" />
          <view class="di-btn" @click="diagnose">查</view>
        </view>
        <view class="sym-quick">
          <text class="sym-q-title">· 常见症状：</text>
          <view class="sym-tags">
            <!-- prettier-ignore -->
            <text
              v-for="s in quickSymptoms"
              :key="s"
              class="sym-tag"
              @click="
                symptom = s;
                diagnose()
              "
            >
              {{ s }}
            </text>
          </view>
        </view>
      </view>

      <view v-if="diagResult.jingluoList.length" class="diag-result card-mystic anim-fade-up">
        <text class="card-title title-mystic">推 荐 经 脉</text>
        <text class="card-tip">匹配症状：{{ diagResult.matched.join(' · ') }}</text>
        <view v-for="(j, i) in diagResult.jingluoList" :key="i" class="dr-card">
          <view class="dr-head">
            <text class="dr-name">{{ j.name }}</text>
            <text class="dr-full">{{ j.fullName }}</text>
          </view>
          <text class="dr-time">开穴时间：{{ j.flowTime }}</text>
          <view class="dr-syms">
            <text v-for="(s, k) in j.pathologies" :key="k" class="dr-sym">{{ s }}</text>
          </view>
          <text class="dr-fn">{{ j.functions.join(' · ') }}</text>
        </view>
        <view class="dr-bodymap-btn" @click="goToBodyMap">
          <text class="bmb-glyph">🧘</text>
          <text class="bmb-text">在 人 体 经 络 图 上 查 看</text>
          <text class="bmb-arrow">›</text>
        </view>
      </view>

      <view v-else-if="searched" class="diag-empty card-mystic">
        <text class="empty-text">未找到匹配经脉，请尝试其他症状词</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed as _computed } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import BodyMap from '@/components/ui/BodyMap.vue'
import ZiWuLiuZhuChart from '@/components/charts/ZiWuLiuZhuChart.vue'
import { useAppStore } from '@/stores'
import { QIJING_LIST, JINGLUO_LIST, jingluoBySymptom, type Jingluo } from '@/utils/jingluo'

const app = useAppStore()

type Mode = 'qijing' | 'jingluo' | 'bodymap' | 'diag'
const tab = ref<Mode>('qijing')
const openQijing = ref(-1)
const openJl = ref(-1)
const symptom = ref('')
const searched = ref(false)
const bodyMapSide = ref<'front' | 'back'>('front')
const highlightedMeridians = ref<string[]>([])

const tabs = [
  { key: 'qijing', name: '八脉', sub: 'EXTRA' },
  { key: 'jingluo', name: '十二正经', sub: '12 MERID.' },
  { key: 'bodymap', name: '人体', sub: 'BODY MAP' },
  { key: 'diag', name: '病症', sub: 'DIAG.' },
]

const quickSymptoms = [
  '失眠',
  '头痛',
  '胃痛',
  '腰痛',
  '易怒',
  '耳鸣',
  '水肿',
  '皮肤瘙痒',
  '颈肩痛',
  '牙痛',
  '手脚冰凉',
  '焦虑',
  '眼干',
  '痛经',
]

const diagResult = ref<{ jingluoList: Jingluo[]; matched: string[] }>({
  jingluoList: [],
  matched: [],
})

function diagnose() {
  const s = symptom.value.trim()
  if (s.length < 2) {
    uni.showToast({ title: '请输入至少 2 个字的症状', icon: 'none' })
    return
  }
  searched.value = true
  try {
    diagResult.value = jingluoBySymptom(s)
    if (diagResult.value.jingluoList.length) {
      app.addHistory({
        tool: 'qijing',
        toolName: '奇经八脉',
        category: '健康',
        input: { symptom: s },
        output: { jingluo: diagResult.value.jingluoList.map((j) => j.name) },
        brief: `${s} · ${diagResult.value.jingluoList[0].name} 等`,
      })
    } else {
      uni.showToast({ title: '未匹配到经络，请换症状', icon: 'none' })
    }
  } catch (_e) {
    uni.showModal({ title: '诊断失败', content: '请重试', showCancel: false })
  }
}

const NAME_TO_MERIDIAN_ID: Record<string, string> = {
  肺: 'lu',
  大肠: 'dachang',
  胃: 'wei',
  脾: 'pi',
  心: 'xin',
  小肠: 'xiaochang',
  膀胱: 'pangguang',
  肾: 'shen',
  心包: 'xinbao',
  三焦: 'sanjiao',
  胆: 'dan',
  肝: 'gan',
}

function goToBodyMap() {
  // 根据诊断结果计算需要高亮的经络 id
  const ids: string[] = []
  for (const j of diagResult.value.jingluoList) {
    for (const k of Object.keys(NAME_TO_MERIDIAN_ID)) {
      if (j.name.includes(k)) {
        const id = NAME_TO_MERIDIAN_ID[k]
        if (id && !ids.includes(id)) ids.push(id)
      }
    }
  }
  highlightedMeridians.value = ids
  // 根据首个经络的 side 决定初始视图
  const first = diagResult.value.jingluoList[0]
  if (first) {
    const backList = ['膀胱', '肾', '胆', '三焦']
    bodyMapSide.value = backList.some((b) => first.name.includes(b)) ? 'back' : 'front'
  }
  tab.value = 'bodymap'
}
</script>

<style scoped>
.qijing-page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}
.tab-bar {
  display: flex;
  gap: var(--sp-2);
  margin: var(--sp-2) var(--sp-2) 0;
  padding: 4rpx;
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
}
.tab-btn {
  flex: 1;
  text-align: center;
  padding: var(--sp-2) 0;
  border-radius: var(--r-sm);
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.tab-btn.active {
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
}
.tab-name {
  font-size: var(--fs-sm);
  font-weight: 600;
}
.tab-sub {
  font-size: 18rpx;
  color: var(--color-bai-3);
}
.tab-btn.active .tab-sub {
  color: var(--color-bai);
  opacity: 0.8;
}

.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: 0 var(--sp-2);
  margin-top: var(--sp-2);
}

/* 八脉 */
.qij-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.qij-card {
  background: rgba(10, 10, 18, 0.6);
  border-radius: var(--r-md);
  border: 2rpx solid;
  overflow: hidden;
  cursor: pointer;
}
.qij-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
}
.qij-yy {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-weight: 700;
}
.qij-yy.yin {
  background: #5b3a8e;
}
.qij-yy.yang {
  background: #c8302a;
}
.qij-name {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.qij-route {
  flex: 1;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  text-align: right;
}
.qij-body {
  padding: var(--sp-3) var(--sp-4) var(--sp-4);
  border-top: 1rpx solid rgba(212, 175, 55, 0.15);
}
.qij-fn-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin: var(--sp-2) 0 4rpx;
}
.qij-fns,
.qij-syms {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  margin-bottom: var(--sp-2);
}
.qij-fn,
.qij-sym {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
  background: rgba(212, 175, 55, 0.1);
  color: var(--color-bai-2);
}
.qij-sym {
  background: rgba(200, 48, 42, 0.15);
  color: #f5c5c0;
}
.qij-points {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
}

/* 十二正经 */
.jl-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.jl-card {
  background: rgba(10, 10, 18, 0.6);
  border-radius: var(--r-md);
  border-left: 8rpx solid;
  overflow: hidden;
  cursor: pointer;
}
.jl-head {
  display: flex;
  align-items: center;
  padding: var(--sp-3) var(--sp-4);
  gap: var(--sp-2);
}
.jl-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.jl-name {
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.jl-full {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.jl-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.jl-flow {
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-weight: 600;
}
.jl-shengxiao {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.jl-body {
  padding: var(--sp-3) var(--sp-4) var(--sp-4);
  border-top: 1rpx solid rgba(212, 175, 55, 0.15);
}
.jl-line {
  display: flex;
  padding: 4rpx 0;
  font-size: var(--fs-sm);
}
.jl-line-label {
  color: var(--color-bai-3);
  width: 160rpx;
}
.jl-line-val {
  color: var(--color-bai);
}
.jl-fn-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin: var(--sp-2) 0 4rpx;
}
.jl-fns,
.jl-syms {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  margin-bottom: var(--sp-2);
}
.jl-fn,
.jl-sym {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
  background: rgba(212, 175, 55, 0.1);
  color: var(--color-bai-2);
}
.jl-sym {
  background: rgba(200, 48, 42, 0.15);
  color: #f5c5c0;
}
.jl-points {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
}

/* 诊断 */
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
}
.card-mystic {
  padding: var(--sp-4);
}
.diag-input {
  display: flex;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}
.di-inp {
  flex: 1;
  padding: var(--sp-2) var(--sp-3);
  font-size: var(--fs-sm);
  background: rgba(10, 10, 18, 0.6);
  color: var(--color-bai);
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}
.di-btn {
  padding: var(--sp-2) var(--sp-4);
  background: linear-gradient(135deg, #c8302a, #d4af37);
  color: var(--color-bai);
  font-size: var(--fs-sm);
  border-radius: var(--r-sm);
  font-weight: 600;
}
.sym-quick {
  margin-top: var(--sp-2);
}
.sym-q-title {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.sym-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  margin-top: 4rpx;
}
.sym-tag {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  background: rgba(91, 58, 142, 0.2);
  color: #c8b5e8;
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(91, 58, 142, 0.4);
}

.diag-result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.dr-card {
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
  border-left: 4rpx solid var(--color-liu);
}
.dr-head {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  margin-bottom: 4rpx;
}
.dr-name {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-weight: 600;
  font-family: 'KaiTi', serif;
}
.dr-full {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.dr-time {
  font-size: var(--fs-xs);
  color: #4fae6f;
  margin-bottom: 4rpx;
}
.dr-syms {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  margin: 4rpx 0;
}
.dr-sym {
  padding: 2rpx 8rpx;
  font-size: 20rpx;
  background: rgba(200, 48, 42, 0.15);
  color: #f5c5c0;
  border-radius: 6rpx;
}
.dr-fn {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  line-height: 1.7;
}
.dr-bodymap-btn {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  margin-top: var(--sp-3);
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
  border-radius: var(--r-md);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
}
.bmb-glyph {
  font-size: 32rpx;
}
.bmb-text {
  flex: 1;
  font-size: var(--fs-sm);
}
.bmb-arrow {
  font-size: 32rpx;
  opacity: 0.7;
}
.diag-empty {
  text-align: center;
  padding: var(--sp-5) var(--sp-4);
}
.empty-text {
  color: var(--color-bai-3);
  font-size: var(--fs-sm);
}
</style>
