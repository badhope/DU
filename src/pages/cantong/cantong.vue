<template>
  <view class="page" :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']">
    <TopBar title="参同契" subtitle="CANTONG · 调身调息调心 · 禅修心法" />

    <view v-if="!session" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">参 同 契 · 魏 伯 阳</text>
      <text class="form-sub">调 身 · 调 息 · 调 心 · 三 阶 详 修</text>

      <view class="form-row">
        <text class="form-label">修 法</text>
        <view class="gf-grid">
          <view v-for="(g, i) in gongfa" :key="i" class="g-btn" :class="{ active: form.gongFa === g.key }" @click="form.gongFa = g.key as any">
            <text class="g-name">{{ g.name }}</text>
            <text class="g-desc">{{ g.desc }}</text>
          </view>
        </view>
      </view>

      <view v-if="form.gongFa === '参话'" class="form-row">
        <text class="form-label">公 案 / 话 头</text>
        <view class="ga-row">
          <view v-for="(g, i) in gongAnSamples" :key="i" class="ga-btn" :class="{ active: form.huaTou === g }" @click="form.huaTou = g">
            {{ g }}
          </view>
        </view>
        <input v-model="form.huaTou" class="input-custom" placeholder="或自定话头" />
      </view>

      <view class="form-row">
        <text class="form-label">时 长</text>
        <view class="dur-grid">
          <view v-for="d in [10, 25, 45, 60, 90]" :key="d" class="d-btn" :class="{ active: form.duration === d }" @click="form.duration = d">
            {{ d }} 分
          </view>
        </view>
      </view>

      <view class="form-tip">
        <text>· 静室端坐 · 七支坐法 · 调身调息调心</text>
        <text>· 数息摄心 · 参话起疑 · 观心识性</text>
        <text>· 行住坐卧皆可参 · 不离本心</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="onStart">
          <text>{{ loading ? '入 静…' : '入 座 · 开 始' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.08">
        <view class="card card-mystic card-hoverable anim-fade-up">
          <text class="card-title title-mystic">本 座 · 阶 位</text>
          <view class="st-row">
            <text class="st-num">{{ session.stage }}</text>
            <view class="st-mid">
              <text class="st-name">{{ session.stageName }}</text>
              <text class="st-tip">{{ session.tip }}</text>
            </view>
          </view>
          <text class="st-insight">{{ session.insight }}</text>
        </view>

        <view v-if="session.huaTou" class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.08s">
          <text class="card-title title-mystic">公 案 · 话 头</text>
          <text class="ha-text">「{{ session.huaTou }}」</text>
          <text class="ha-info">将此话头念在心头 · 时时参究 · 不可放舍</text>
        </view>

        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">禅 相 · 流 程</text>
          <view v-for="(q, i) in session.qiXiang" :key="i" class="q-item">
            <text class="q-time">第 {{ q.time }} 分</text>
            <text class="q-breath">息 {{ q.breath }} 次</text>
            <text class="q-pulse" :class="['p-' + q.pulse]">脉 {{ q.pulse }}</text>
            <text class="q-state" :class="['s-' + q.state]">{{ q.state }}</text>
          </view>
        </view>

        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.22s">
          <text class="card-title title-mystic">本 座 · 印 证</text>
          <text class="sum-text">{{ session.summary }}</text>
          <text class="adv-text">{{ session.advice }}</text>
        </view>

        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.3s">
          <text class="card-title title-mystic">修 法 · 阶 段</text>
          <view v-for="(s, i) in stages" :key="i" class="stg-item" :class="{ active: s.stage === session.stage }">
            <text class="stg-num">{{ s.stage }}</text>
            <view class="stg-mid">
              <text class="stg-name">{{ s.name }}</text>
              <text class="stg-desc">{{ s.desc }}</text>
            </view>
            <text class="stg-ins">{{ s.insight }}</text>
          </view>
        </view>

        <view class="form-actions" style="margin-top: 32rpx">
          <view class="btn-secondary" @click="reset">再 入 一 座</view>
        </view>
      </ResultReveal>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import ResultReveal from '@/components/ui/ResultReveal.vue'
import { useAppStore } from '@/stores'
import { startChanSession, getStages, randomGongAn, type FullChanSession, type GongFa } from '@/utils/cantong'

const app = useAppStore()
const loading = ref(false)
const session = ref<FullChanSession | null>(null)
const gongfa: Array<{ key: string; name: string; desc: string }> = [
  { key: '数息', name: '数息', desc: '默数出入息' },
  { key: '参话', name: '参话', desc: '提起话头' },
  { key: '观心', name: '观心', desc: '观照本心' },
  { key: '随息', name: '随息', desc: '心随息转' },
  { key: '持咒', name: '持咒', desc: '净念相继' },
  { key: '内观', name: '内观', desc: '观身不净' },
]
const gongAnSamples = ['念佛是谁', '万法归一 · 一归何处', '本来面目', '狗子无佛性']
const form = ref<{ gongFa: GongFa; duration: number; huaTou: string }>({
  gongFa: '数息',
  duration: 25,
  huaTou: '',
})
const stages = getStages()

async function onStart() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 800))
  const huaTou = form.value.gongFa === '参话' ? (form.value.huaTou || randomGongAn()) : undefined
  session.value = startChanSession(form.value.gongFa, form.value.duration, huaTou)
  loading.value = false
  app.addHistory({
    tool: 'cantong',
    toolName: '参同契',
    category: '高阶典籍',
    input: { gongFa: form.value.gongFa, duration: form.value.duration, huaTou },
    output: { stage: session.value.stageName, energy: session.value.energy },
    brief: `${form.value.gongFa} · ${form.value.duration} 分 · ${session.value.stageName}`,
  })
}

function reset() {
  session.value = null
}
</script>

<style scoped>
.page { min-height: 100vh; padding: 0 var(--sp-3) var(--sp-8); }
.form {
  background: rgba(15, 15, 24, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  padding: var(--sp-4) var(--sp-3);
  margin: var(--sp-3) var(--sp-2) 0;
}
.form-title { display: block; font-size: var(--fs-xl); font-family: 'KaiTi', serif; font-weight: 700; text-align: center; margin-bottom: var(--sp-1); }
.form-sub { display: block; text-align: center; font-size: var(--fs-sm); color: var(--color-bai-3); font-family: 'KaiTi', serif; margin-bottom: var(--sp-3); }
.form-row { margin-bottom: var(--sp-3); }
.form-label { display: block; font-size: var(--fs-sm); color: var(--color-bai-2); font-family: 'KaiTi', serif; margin-bottom: var(--sp-1); letter-spacing: 0.1em; }
.gf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-1); }
.g-btn { padding: var(--sp-2); background: rgba(20, 20, 28, 0.5); border: 1rpx solid rgba(212, 175, 55, 0.2); border-radius: var(--r-sm); text-align: center; }
.g-btn.active { background: var(--color-liu); color: #1a1a2a; border-color: var(--color-liu); }
.g-name { display: block; font-size: var(--fs-sm); font-family: 'KaiTi', serif; font-weight: 700; color: inherit; }
.g-desc { display: block; font-size: var(--fs-xs); font-family: 'KaiTi', serif; color: var(--color-bai-3); margin-top: 2rpx; }
.g-btn.active .g-desc { color: #1a1a2a; }
.ga-row { display: flex; flex-wrap: wrap; gap: var(--sp-1); margin-bottom: var(--sp-1); }
.ga-btn { padding: var(--sp-1) var(--sp-2); background: rgba(20, 20, 28, 0.5); border: 1rpx solid rgba(212, 175, 55, 0.2); border-radius: var(--r-sm); font-size: var(--fs-xs); font-family: 'KaiTi', serif; color: var(--color-bai-2); }
.ga-btn.active { background: var(--color-zhu); color: var(--color-bai); border-color: var(--color-zhu); }
.input-custom { width: 100%; padding: var(--sp-2) var(--sp-3); background: rgba(10, 10, 18, 0.6); border: 1rpx solid rgba(212, 175, 55, 0.2); border-radius: var(--r-sm); color: var(--color-bai); font-family: 'KaiTi', serif; font-size: var(--fs-sm); margin-top: var(--sp-1); }
.dur-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--sp-1); }
.d-btn { padding: var(--sp-2) 0; text-align: center; background: rgba(20, 20, 28, 0.5); border: 1rpx solid rgba(212, 175, 55, 0.2); border-radius: var(--r-sm); font-size: var(--fs-sm); font-family: 'KaiTi', serif; color: var(--color-bai-2); }
.d-btn.active { background: var(--color-liu); color: #1a1a2a; border-color: var(--color-liu); }
.form-tip { margin-bottom: var(--sp-3); padding: var(--sp-2); background: rgba(20, 20, 28, 0.3); border-left: 4rpx solid var(--color-liu); border-radius: var(--r-sm); }
.form-tip text { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; line-height: 1.6; }
.form-actions { margin-top: var(--sp-4); }
.btn-zhu {
  padding: var(--sp-3);
  text-align: center;
  background: linear-gradient(135deg, #1B3A5C, #5B3A8E);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  font-size: var(--fs-md);
  border-radius: var(--r-md);
}
.btn-zhu.is-loading { opacity: 0.7; }
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

.result { padding: var(--sp-2); }
.card {
  background: rgba(15, 15, 24, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  padding: var(--sp-3);
  margin-bottom: var(--sp-3);
}
.card-title { display: block; font-size: var(--fs-md); font-family: 'KaiTi', serif; font-weight: 700; color: var(--color-liu); margin-bottom: var(--sp-2); letter-spacing: 0.1em; }

.st-row { display: flex; align-items: center; gap: var(--sp-3); margin-bottom: var(--sp-2); }
.st-num { font-size: 96rpx; font-family: 'KaiTi', serif; font-weight: 700; color: var(--color-liu); line-height: 1; }
.st-mid { flex: 1; }
.st-name { display: block; font-size: var(--fs-lg); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.st-tip { display: block; font-size: var(--fs-sm); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.6; margin-top: 4rpx; }
.st-insight { display: block; font-size: var(--fs-md); color: var(--color-liu); font-family: 'KaiTi', serif; text-align: center; padding: var(--sp-2); background: rgba(10, 10, 18, 0.4); border-radius: var(--r-sm); font-style: italic; }

.ha-text { display: block; font-size: var(--fs-lg); color: var(--color-bai); font-family: 'KaiTi', serif; text-align: center; padding: var(--sp-3); background: rgba(212, 175, 55, 0.08); border-radius: var(--r-sm); font-weight: 700; letter-spacing: 0.2em; margin-bottom: var(--sp-1); }
.ha-info { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; text-align: center; font-style: italic; }

.q-item { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-1) var(--sp-2); margin-bottom: 4rpx; background: rgba(20, 20, 28, 0.3); border-radius: var(--r-sm); }
.q-time { flex-shrink: 0; width: 100rpx; font-size: var(--fs-xs); color: var(--color-bai); font-family: 'KaiTi', serif; }
.q-breath { flex: 1; font-size: var(--fs-xs); color: var(--color-bai-2); font-family: 'KaiTi', serif; }
.q-pulse { padding: 2rpx 12rpx; border-radius: var(--r-sm); font-size: var(--fs-xs); font-family: 'KaiTi', serif; }
.p-缓, .p-稳 { background: #4FAE6F; color: var(--color-bai); }
.p-急 { background: var(--color-zhu); color: var(--color-bai); }
.q-state { padding: 2rpx 12rpx; border-radius: var(--r-sm); font-size: var(--fs-xs); font-family: 'KaiTi', serif; }
.s-散 { background: var(--color-bai-3); color: #1a1a2a; }
.s-定 { background: #1B3A5C; color: var(--color-bai); }
.s-明 { background: var(--color-liu); color: #1a1a2a; }

.sum-text { display: block; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; line-height: 1.8; text-indent: 2em; margin-bottom: var(--sp-2); }
.adv-text { display: block; font-size: var(--fs-sm); color: var(--color-liu); font-family: 'KaiTi', serif; line-height: 1.8; text-indent: 2em; padding: var(--sp-2); background: rgba(212, 175, 55, 0.06); border-radius: var(--r-sm); }

.stg-item { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-2); margin-bottom: var(--sp-1); background: rgba(20, 20, 28, 0.3); border-radius: var(--r-sm); }
.stg-item.active { background: rgba(212, 175, 55, 0.1); border: 1rpx solid var(--color-liu); }
.stg-num { flex-shrink: 0; width: 50rpx; height: 50rpx; line-height: 50rpx; text-align: center; background: var(--color-liu); color: #1a1a2a; border-radius: 50%; font-size: var(--fs-md); font-family: 'KaiTi', serif; font-weight: 700; }
.stg-item:not(.active) .stg-num { background: rgba(20, 20, 28, 0.6); color: var(--color-bai-2); border: 1rpx solid rgba(212, 175, 55, 0.2); }
.stg-mid { flex: 1; }
.stg-name { display: block; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.stg-desc { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; }
.stg-ins { display: none; }
</style>
