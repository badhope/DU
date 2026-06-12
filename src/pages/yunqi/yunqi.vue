<template>
  <view class="page" :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']">
    <TopBar title="运气七篇" subtitle="YUNQI · 黄帝内经 · 素问七篇" />

    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">黄 帝 内 经 · 素 问</text>
      <text class="form-sub">天 元 纪 · 五 运 六 气 · 客 主 加 临</text>

      <view class="form-row">
        <text class="form-label">公 历 年 份</text>
        <view class="year-row">
          <view class="y-btn" @click="form.year = (form.year - 1)">-</view>
          <view class="y-display">{{ form.year }}</view>
          <view class="y-btn" @click="form.year = (form.year + 1)">+</view>
        </view>
        <view class="quick-row">
          <view class="q-btn" @click="form.year = 2026">2026</view>
          <view class="q-btn" @click="form.year = 2025">2025</view>
          <view class="q-btn" @click="form.year = 2024">2024</view>
        </view>
      </view>

      <view class="form-tip">
        <text>· 五运六气 · 出自《素问》"天元纪"等七篇</text>
        <text>· 五运：甲己土、乙庚金、丙辛水、丁壬木、戊癸火</text>
        <text>· 六气：风木、君火、湿土、相火、燥金、寒水</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="onCalculate">
          <text>{{ loading ? '排 算 中…' : '五 运 · 六 气 · 详 断' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.08">
        <!-- 年份总论 -->
        <view class="card card-mystic card-hoverable anim-fade-up">
          <text class="card-title title-mystic">{{ result.year }} · {{ result.ganZhi }} 年</text>
          <view class="hz-row">
            <view class="hz-cell">
              <text class="hz-l">中 运</text>
              <text class="hz-v">{{ result.yunName }}</text>
            </view>
            <view class="hz-cell">
              <text class="hz-l">司 天</text>
              <text class="hz-v">{{ result.siTianName }}</text>
            </view>
            <view class="hz-cell">
              <text class="hz-l">在 泉</text>
              <text class="hz-v">{{ result.zaiQuanName }}</text>
            </view>
          </view>
          <text class="hz-summary">{{ result.summary }}</text>
        </view>

        <!-- 六步气 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.08s">
          <text class="card-title title-mystic">六 步 气 · 客 主 加 临</text>
          <view v-for="(s, i) in result.stepQi" :key="i" class="step-item">
            <view class="step-l">
              <text class="step-name">{{ s.name }}</text>
              <text class="step-jieqi">{{ s.jieqi }}</text>
            </view>
            <view class="step-r">
              <text class="step-main">{{ s.main }}</text>
            </view>
          </view>
        </view>

        <!-- 经方 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">经 方 推 荐</text>
          <view v-for="(p, i) in result.prescriptions" :key="i" class="pf-item">
            <text class="pf-qi">{{ p.qi }}</text>
            <text class="pf-name">{{ p.jingFang }}</text>
            <text class="pf-effect">{{ p.effect }}</text>
          </view>
        </view>

        <!-- 体质九分 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.22s">
          <text class="card-title title-mystic">体 质 九 分</text>
          <view v-for="(t, i) in result.tizhi" :key="i" class="tz-item">
            <view class="tz-h">
              <text class="tz-name">{{ t.name }}</text>
              <view class="tz-bar">
                <view class="tz-fill" :style="{ width: t.score + '%' }" />
              </view>
              <text class="tz-score">{{ t.score }}</text>
            </view>
            <text class="tz-desc">{{ t.desc }}</text>
            <text class="tz-yang">养 · {{ t.yangsheng }}</text>
          </view>
        </view>

        <!-- 饮食 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.3s">
          <text class="card-title title-mystic">饮 食 · 宜 忌</text>
          <view class="diet-row">
            <view class="diet-cell">
              <text class="diet-l diet-yi">宜</text>
              <view class="diet-list">
                <text v-for="(y, i) in result.diet.yi" :key="i" class="diet-y">· {{ y }}</text>
              </view>
            </view>
            <view class="diet-cell">
              <text class="diet-l diet-ji">忌</text>
              <view class="diet-list">
                <text v-for="(j, i) in result.diet.ji" :key="i" class="diet-j">· {{ j }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 强身要点 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.38s">
          <text class="card-title title-mystic">养 生 · 要 点</text>
          <view class="tips-list">
            <text v-for="(t, i) in result.healthTips" :key="i" class="tips-text">· {{ t }}</text>
          </view>
        </view>

        <view class="form-actions" style="margin-top: 32rpx">
          <view class="btn-secondary" @click="reset">重 新 排 算</view>
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
import { getYunQi, type YunQiResult } from '@/utils/yunqi'

const app = useAppStore()
const loading = ref(false)
const result = ref<YunQiResult | null>(null)
const form = ref({ year: 2026 })

async function onCalculate() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 600))
  result.value = getYunQi(form.value.year)
  loading.value = false
  app.addHistory({
    tool: 'yunqi',
    toolName: '运气七篇',
    category: '高阶典籍',
    input: { year: form.value.year },
    output: { yun: result.value.yunName, siTian: result.value.siTianName, zaiQuan: result.value.zaiQuanName },
    brief: `${form.value.year}年 ${result.value.ganZhi} · ${result.value.yunName} · 司天 ${result.value.siTianName}`,
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
.form-title { display: block; font-size: var(--fs-xl); font-family: 'KaiTi', serif; font-weight: 700; text-align: center; margin-bottom: var(--sp-1); }
.form-sub { display: block; text-align: center; font-size: var(--fs-sm); color: var(--color-bai-3); font-family: 'KaiTi', serif; margin-bottom: var(--sp-3); }
.form-row { margin-bottom: var(--sp-3); }
.form-label { display: block; font-size: var(--fs-sm); color: var(--color-bai-2); font-family: 'KaiTi', serif; margin-bottom: var(--sp-1); letter-spacing: 0.1em; }
.year-row { display: flex; align-items: center; gap: var(--sp-2); }
.y-btn { width: 80rpx; height: 80rpx; line-height: 80rpx; text-align: center; background: rgba(20, 20, 28, 0.6); border: 1rpx solid rgba(212, 175, 55, 0.3); border-radius: var(--r-sm); color: var(--color-liu); font-size: 40rpx; font-family: 'KaiTi', serif; }
.y-display { flex: 1; height: 80rpx; line-height: 80rpx; text-align: center; background: rgba(10, 10, 18, 0.6); border: 1rpx solid rgba(212, 175, 55, 0.2); border-radius: var(--r-sm); color: var(--color-bai); font-size: var(--fs-xl); font-family: 'KaiTi', serif; font-weight: 700; }
.quick-row { display: flex; gap: var(--sp-1); margin-top: var(--sp-1); }
.q-btn { flex: 1; padding: var(--sp-1) 0; text-align: center; background: rgba(20, 20, 28, 0.5); border: 1rpx solid rgba(212, 175, 55, 0.2); border-radius: var(--r-sm); color: var(--color-bai-2); font-size: var(--fs-xs); font-family: 'KaiTi', serif; }
.form-tip { margin-bottom: var(--sp-3); padding: var(--sp-2); background: rgba(20, 20, 28, 0.3); border-left: 4rpx solid var(--color-liu); border-radius: var(--r-sm); }
.form-tip text { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; line-height: 1.6; }
.form-actions { margin-top: var(--sp-4); }
.btn-zhu {
  padding: var(--sp-3);
  text-align: center;
  background: linear-gradient(135deg, #1B3A5C, #4FAE6F);
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

.hz-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--sp-1); margin-bottom: var(--sp-2); }
.hz-cell { padding: var(--sp-2); background: rgba(212, 175, 55, 0.06); border-radius: var(--r-sm); text-align: center; }
.hz-l { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; }
.hz-v { display: block; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.hz-summary { display: block; font-size: var(--fs-sm); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.8; text-indent: 2em; }

.step-item { display: flex; gap: var(--sp-2); padding: var(--sp-2); margin-bottom: var(--sp-1); background: rgba(20, 20, 28, 0.4); border-radius: var(--r-sm); border-left: 4rpx solid #4FAE6F; }
.step-l { flex-shrink: 0; width: 200rpx; }
.step-name { display: block; font-size: var(--fs-sm); color: var(--color-liu); font-family: 'KaiTi', serif; font-weight: 700; }
.step-jieqi { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; }
.step-r { flex: 1; }
.step-main { display: block; font-size: var(--fs-xs); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.6; }

.pf-item { padding: var(--sp-2); margin-bottom: var(--sp-1); background: rgba(20, 20, 28, 0.4); border-radius: var(--r-sm); }
.pf-qi { display: inline-block; width: 100rpx; font-size: var(--fs-xs); color: var(--color-liu); font-family: 'KaiTi', serif; font-weight: 700; margin-right: var(--sp-2); }
.pf-name { display: inline-block; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; margin-right: var(--sp-2); }
.pf-effect { display: inline; font-size: var(--fs-xs); color: var(--color-bai-2); font-family: 'KaiTi', serif; }

.tz-item { padding: var(--sp-2); margin-bottom: var(--sp-1); background: rgba(20, 20, 28, 0.4); border-radius: var(--r-sm); }
.tz-h { display: flex; align-items: center; gap: var(--sp-2); margin-bottom: 4rpx; }
.tz-name { width: 100rpx; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.tz-bar { flex: 1; height: 12rpx; background: rgba(255,255,255,0.1); border-radius: 6rpx; overflow: hidden; }
.tz-fill { height: 100%; background: linear-gradient(90deg, #1B3A5C, #4FAE6F); border-radius: 6rpx; }
.tz-score { width: 40rpx; text-align: right; font-size: var(--fs-xs); color: var(--color-bai); font-family: 'KaiTi', serif; }
.tz-desc { display: block; font-size: var(--fs-xs); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.5; margin-bottom: 2rpx; }
.tz-yang { display: block; font-size: var(--fs-xs); color: var(--color-liu); font-family: 'KaiTi', serif; line-height: 1.5; }

.diet-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-2); }
.diet-cell { padding: var(--sp-2); background: rgba(20, 20, 28, 0.4); border-radius: var(--r-sm); }
.diet-l { display: inline-block; font-size: var(--fs-md); font-family: 'KaiTi', serif; font-weight: 700; margin-bottom: var(--sp-1); }
.diet-yi { color: #4FAE6F; }
.diet-ji { color: var(--color-zhu); }
.diet-list { display: flex; flex-direction: column; gap: 4rpx; }
.diet-y, .diet-j { display: block; font-size: var(--fs-xs); font-family: 'KaiTi', serif; }
.diet-y { color: var(--color-bai); }
.diet-j { color: var(--color-bai-2); }

.tips-list { padding: var(--sp-2); background: rgba(10, 10, 18, 0.4); border-radius: var(--r-sm); }
.tips-text { display: block; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; line-height: 1.8; }
</style>
