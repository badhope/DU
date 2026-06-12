<template>
  <view class="page" :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']">
    <TopBar title="地理五诀" subtitle="DILI · WUJUE · 赵九峰" />

    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">赵 九 峰 · 地 理 五 诀</text>
      <text class="form-sub">龙 穴 砂 水 向 · 五 诀 详 断</text>

      <view class="form-row">
        <text class="form-label">主事者五行</text>
        <view class="wx-grid">
          <view
            v-for="(w, i) in ['木', '火', '土', '金', '水']"
            :key="i"
            class="w-btn"
            :class="{ active: form.ownerElement === w }"
            @click="form.ownerElement = w as any"
          >{{ w }}</view>
        </view>
      </view>

      <view class="form-row">
        <text class="form-label">坐 向（房屋朝向）</text>
        <view class="dir-grid">
          <view
            v-for="(d, i) in dirs"
            :key="i"
            class="d-btn"
            :class="{ active: form.facing === d.angle }"
            @click="form.facing = d.angle"
          >{{ d.name }}</view>
        </view>
      </view>

      <view class="form-row">
        <text class="form-label">大 门 方 位</text>
        <view class="dir-grid">
          <view
            v-for="(d, i) in dirs"
            :key="i"
            class="d-btn"
            :class="{ active: form.gateDirection === d.angle }"
            @click="form.gateDirection = d.angle"
          >{{ d.name }}</view>
        </view>
      </view>

      <view class="form-row">
        <text class="form-label">峦 头 配 置</text>
        <view class="ly-grid">
          <view class="ly-cell">
            <text class="ly-l">后（玄武）</text>
            <view class="ly-pick">
              <view
                v-for="(t, i) in layoutTypes"
                :key="'b'+i"
                class="lp-btn"
                :class="{ active: form.layout.back === t }"
                @click="form.layout.back = t as any"
              >{{ t }}</view>
            </view>
          </view>
          <view class="ly-cell">
            <text class="ly-l">左（青龙）</text>
            <view class="ly-pick">
              <view
                v-for="(t, i) in layoutTypes"
                :key="'l'+i"
                class="lp-btn"
                :class="{ active: form.layout.left === t }"
                @click="form.layout.left = t as any"
              >{{ t }}</view>
            </view>
          </view>
          <view class="ly-cell">
            <text class="ly-l">右（白虎）</text>
            <view class="ly-pick">
              <view
                v-for="(t, i) in layoutTypes"
                :key="'r'+i"
                class="lp-btn"
                :class="{ active: form.layout.right === t }"
                @click="form.layout.right = t as any"
              >{{ t }}</view>
            </view>
          </view>
          <view class="ly-cell">
            <text class="ly-l">前（朱雀）</text>
            <view class="ly-pick">
              <view
                v-for="(t, i) in layoutTypes"
                :key="'f'+i"
                class="lp-btn"
                :class="{ active: form.layout.front === t }"
                @click="form.layout.front = t as any"
              >{{ t }}</view>
            </view>
          </view>
        </view>
      </view>

      <view class="form-tip">
        <text>· 山：远山或小山 · 楼：邻楼或大型建筑</text>
        <text>· 水：河道、湖、海、池 · 路：道路、车流</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="onCalculate">
          <text>{{ loading ? '断 局 中…' : '五 诀 · 详 断' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.08">
        <!-- 总评 -->
        <view class="card card-mystic card-hoverable anim-fade-up">
          <text class="card-title title-mystic">总 评</text>
          <view class="score-row">
            <text class="score-num">{{ result.score }}</text>
            <text class="score-grade" :class="['g-' + result.grade]">{{ result.grade }} 局</text>
          </view>
          <view class="bar-5">
            <view v-for="(v, k, i) in result.scores" :key="k" class="bar-cell">
              <text class="bar-l">{{ k === 'long' ? '龙' : k === 'xue' ? '穴' : k === 'sha' ? '砂' : k === 'shui' ? '水' : '向' }}</text>
              <view class="bar">
                <view class="fill" :style="{ width: v + '%' }" />
              </view>
              <text class="bar-v">{{ v }}</text>
            </view>
          </view>
        </view>

        <!-- 四神方位 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.08s">
          <text class="card-title title-mystic">四 神 · 峦 头</text>
          <view class="dir-list">
            <view v-for="(d, i) in result.directions" :key="i" class="dir-item">
              <view class="d-name">{{ d.name }}</view>
              <view class="d-mid">
                <text class="d-actual">实：{{ d.actual }}</text>
                <text class="d-ideal">· 宜：{{ d.ideal }}</text>
              </view>
              <text class="d-comment">{{ d.comment }}</text>
            </view>
          </view>
        </view>

        <!-- 24 山立向 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">二 十 四 山 · 立 向</text>
          <text class="xa-name">{{ result.xiangAnalysis.facingName }}</text>
          <view class="xa-row">
            <view class="xa-cell">
              <text class="xa-l">立 向</text>
              <text class="xa-v">{{ result.xiangAnalysis.facingName }}</text>
            </view>
            <view class="xa-cell">
              <text class="xa-l">五 行</text>
              <text class="xa-v">{{ result.xiangAnalysis.facingWuXing }}</text>
            </view>
            <view class="xa-cell">
              <text class="xa-l">旺衰</text>
              <text class="xa-v" :class="['w-' + (result.xiangAnalysis.isWang ? 'on' : 'off')]">{{ result.xiangAnalysis.isWang ? '旺' : '衰' }}</text>
            </view>
          </view>
          <text class="xa-desc">{{ result.xiangAnalysis.description }}</text>
        </view>

        <!-- 大门 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.22s">
          <text class="card-title title-mystic">大 门 · 纳 气</text>
          <view class="ga-row">
            <view class="ga-cell">
              <text class="ga-l">方 位</text>
              <text class="ga-v">{{ result.gateAnalysis.name }}</text>
            </view>
            <view class="ga-cell">
              <text class="ga-l">五 行</text>
              <text class="ga-v">{{ result.gateAnalysis.wuXing }}</text>
            </view>
          </view>
          <text class="ga-advice">{{ result.gateAnalysis.advice }}</text>
        </view>

        <!-- 五行补益 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.3s">
          <text class="card-title title-mystic">五 行 · 补 益</text>
          <view class="wa-row">
            <view class="wa-cell">
              <text class="wa-l">缺</text>
              <text class="wa-v wa-lack">{{ result.wuxingAdjust.lack.join(' / ') || '无' }}</text>
            </view>
            <view class="wa-cell">
              <text class="wa-l">旺</text>
              <text class="wa-v wa-excess">{{ result.wuxingAdjust.excess.join(' / ') || '无' }}</text>
            </view>
          </view>
          <view class="wa-advices">
            <text v-for="(a, i) in result.wuxingAdjust.advice" :key="i" class="wa-text">· {{ a }}</text>
          </view>
        </view>

        <!-- 建议 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.38s">
          <text class="card-title title-mystic">建 议 · 调 整</text>
          <view class="sug-list">
            <text v-for="(s, i) in result.suggestions" :key="i" class="sug-text">· {{ s }}</text>
          </view>
        </view>

        <view class="form-actions" style="margin-top: 32rpx">
          <view class="btn-secondary" @click="reset">重 新 断 局</view>
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
import { analyzeDili, type DiliAssessment, type DiliInput, type Direction } from '@/utils/dili'

const app = useAppStore()
const loading = ref(false)
const result = ref<DiliAssessment | null>(null)
const dirs = [
  { angle: 0 as Direction, name: '南' },
  { angle: 45 as Direction, name: '西南' },
  { angle: 90 as Direction, name: '西' },
  { angle: 135 as Direction, name: '西北' },
  { angle: 180 as Direction, name: '北' },
  { angle: 225 as Direction, name: '东北' },
  { angle: 270 as Direction, name: '东' },
  { angle: 315 as Direction, name: '东南' },
]
const layoutTypes: Array<'山' | '楼' | '水' | '路' | '空' | '宅'> = ['山', '楼', '水', '路', '空', '宅']
const form = ref<DiliInput>({
  facing: 180,
  gateDirection: 180,
  ownerElement: '木',
  layout: { back: '山', left: '山', right: '楼', front: '水' },
})

async function onCalculate() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 600))
  result.value = analyzeDili(form.value)
  loading.value = false
  app.addHistory({
    tool: 'dili',
    toolName: '地理五诀',
    category: '高阶典籍',
    input: { ...form.value },
    output: { score: result.value.score, grade: result.value.grade },
    brief: `坐向 ${form.value.facing} · 局 ${result.value.grade} · ${result.value.score} 分`,
  })
}

function reset() {
  result.value = null
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
.form-title {
  display: block;
  font-size: var(--fs-xl);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--sp-1);
}
.form-sub { display: block; text-align: center; font-size: var(--fs-sm); color: var(--color-bai-3); font-family: 'KaiTi', serif; margin-bottom: var(--sp-3); }
.form-row { margin-bottom: var(--sp-3); }
.form-label { display: block; font-size: var(--fs-sm); color: var(--color-bai-2); font-family: 'KaiTi', serif; margin-bottom: var(--sp-1); letter-spacing: 0.1em; }
.wx-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--sp-1); }
.w-btn, .d-btn, .lp-btn {
  padding: var(--sp-2) 0;
  text-align: center;
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
  color: var(--color-bai-2);
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
}
.w-btn.active, .d-btn.active, .lp-btn.active {
  background: var(--color-liu);
  color: #1a1a2a;
  border-color: var(--color-liu);
}
.dir-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: var(--sp-1); }
.ly-grid { display: flex; flex-direction: column; gap: var(--sp-2); }
.ly-cell {
  padding: var(--sp-2);
  background: rgba(20, 20, 28, 0.3);
  border-radius: var(--r-sm);
}
.ly-l { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; margin-bottom: var(--sp-1); }
.ly-pick { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4rpx; }
.form-tip { margin-bottom: var(--sp-3); padding: var(--sp-2); background: rgba(20, 20, 28, 0.3); border-left: 4rpx solid var(--color-liu); border-radius: var(--r-sm); }
.form-tip text { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; line-height: 1.6; }
.form-actions { margin-top: var(--sp-4); }
.btn-zhu {
  padding: var(--sp-3);
  text-align: center;
  background: linear-gradient(135deg, #1F4E4A, #5C3A1B);
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
.score-row { display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2); }
.score-num { font-size: 72rpx; font-family: 'KaiTi', serif; font-weight: 700; color: var(--color-liu); }
.score-grade {
  font-size: var(--fs-xl);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  padding: var(--sp-1) var(--sp-3);
  border-radius: var(--r-sm);
}
.g-上上, .g-上 { background: linear-gradient(135deg, #D4AF37, #C8302A); color: var(--color-bai); }
.g-中上 { background: linear-gradient(135deg, #4FAE6F, #1B3A5C); color: var(--color-bai); }
.g-中 { background: var(--color-liu); color: #1a1a2a; }
.g-中下, .g-下 { background: var(--color-zhu); color: var(--color-bai); }
.bar-5 { display: flex; flex-direction: column; gap: var(--sp-1); }
.bar-cell { display: flex; align-items: center; gap: var(--sp-2); }
.bar-l { width: 60rpx; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.bar { flex: 1; height: 14rpx; background: rgba(255,255,255,0.1); border-radius: 7rpx; overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, #1F4E4A, #D4AF37); border-radius: 7rpx; transition: width 0.6s ease; }
.bar-v { width: 40rpx; text-align: right; font-size: var(--fs-xs); color: var(--color-bai); font-family: 'KaiTi', serif; }

.dir-list { display: flex; flex-direction: column; gap: var(--sp-1); }
.dir-item { padding: var(--sp-2); background: rgba(20, 20, 28, 0.4); border-radius: var(--r-sm); }
.d-name { display: block; font-size: var(--fs-sm); color: var(--color-liu); font-family: 'KaiTi', serif; font-weight: 700; margin-bottom: 4rpx; }
.d-mid { display: flex; gap: var(--sp-1); margin-bottom: 4rpx; }
.d-actual { font-size: var(--fs-xs); color: var(--color-bai); font-family: 'KaiTi', serif; }
.d-ideal { font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; }
.d-comment { display: block; font-size: var(--fs-xs); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.5; }

.xa-name { display: block; font-size: var(--fs-xl); color: var(--color-liu); font-family: 'KaiTi', serif; font-weight: 700; text-align: center; margin-bottom: var(--sp-2); letter-spacing: 0.2em; }
.xa-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--sp-1); margin-bottom: var(--sp-2); }
.xa-cell { padding: var(--sp-2); background: rgba(212, 175, 55, 0.06); border-radius: var(--r-sm); text-align: center; }
.xa-l { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; }
.xa-v { display: block; font-size: var(--fs-md); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.w-on { color: var(--color-liu); }
.w-off { color: var(--color-zhu); }
.xa-desc { display: block; font-size: var(--fs-sm); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.7; }

.ga-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-1); margin-bottom: var(--sp-2); }
.ga-cell { padding: var(--sp-2); background: rgba(212, 175, 55, 0.06); border-radius: var(--r-sm); }
.ga-l { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; }
.ga-v { display: block; font-size: var(--fs-md); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.ga-advice { display: block; font-size: var(--fs-sm); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.7; }

.wa-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-1); margin-bottom: var(--sp-2); }
.wa-cell { padding: var(--sp-2); background: rgba(212, 175, 55, 0.06); border-radius: var(--r-sm); }
.wa-l { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; }
.wa-v { display: block; font-size: var(--fs-md); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.wa-lack { color: var(--color-zhu); }
.wa-excess { color: var(--color-liu); }
.wa-advices { padding: var(--sp-2); background: rgba(10, 10, 18, 0.4); border-radius: var(--r-sm); }
.wa-text { display: block; font-size: var(--fs-xs); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.7; }

.sug-list { padding: var(--sp-2); background: rgba(10, 10, 18, 0.4); border-radius: var(--r-sm); }
.sug-text { display: block; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; line-height: 1.8; }
</style>
