<template>
  <view class="page" :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']">
    <TopBar title="玉匣记" subtitle="YUXIA · 高阶命名 · 81 数详批" />

    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">玉 匣 记 · 八 十 一 数</text>
      <text class="form-sub">三 才 五 格 · 八 一 数 详 批 · 音 形 义 合</text>

      <view class="form-row">
        <text class="form-label">姓</text>
        <input v-model="form.surname" class="name-input" placeholder="单字姓 · 如 王" maxlength="2" />
      </view>

      <view class="form-row">
        <text class="form-label">名</text>
        <input v-model="form.given" class="name-input" placeholder="1-2 字名 · 如 浩然" maxlength="2" />
      </view>

      <view class="form-tip">
        <text>· 默认使用《康熙字典》笔画 · 81 数详批依熊崎氏源流</text>
        <text>· 三才 = 天格、人格、地格 · 五行配置论吉凶</text>
        <text>· 总格主导一生 · 人格主导 30-50 岁 · 地格主导 30 岁前</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading, disabled: !form.surname || !form.given }" @click="onCalculate">
          <text>{{ loading ? '排 算 中…' : '八 一 数 · 详 批' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.08">
        <!-- 总评 -->
        <view class="card card-mystic card-hoverable anim-fade-up">
          <text class="card-title title-mystic">{{ result.full }} · 总 评</text>
          <view class="score-row">
            <text class="score-num">{{ result.totalScore }}</text>
            <text class="score-grade" :class="['g-' + result.grade]">{{ result.grade }}</text>
          </view>
          <text class="summary-text">{{ result.summary }}</text>
        </view>

        <!-- 三才配置 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.08s">
          <text class="card-title title-mystic">三 才 配 置</text>
          <view class="sc-row">
            <view class="sc-cell">
              <text class="sc-l">天格</text>
              <text class="sc-v">{{ result.sanCai.tian }}</text>
            </view>
            <view class="sc-cell">
              <text class="sc-l">人格</text>
              <text class="sc-v">{{ result.sanCai.ren }}</text>
            </view>
            <view class="sc-cell">
              <text class="sc-l">地格</text>
              <text class="sc-v">{{ result.sanCai.di }}</text>
            </view>
            <view class="sc-cell">
              <text class="sc-l">吉凶</text>
              <text class="sc-v sc-luck" :class="['l-' + result.sanCai.luck]">{{ result.sanCai.luck }}</text>
            </view>
          </view>
          <text class="sc-reason">{{ result.sanCai.reason }}</text>
        </view>

        <!-- 81 数详批 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">八 十 一 数 · 详 批</text>
          <view v-for="(n, i) in result.numbers" :key="i" class="num-item">
            <view class="num-l">
              <text class="num-ge">{{ n.ge }}</text>
              <text class="num-n">{{ n.num }}</text>
            </view>
            <view class="num-r">
              <view class="num-tag-row">
                <text class="num-tag" :class="['t-' + n.level]">{{ n.yi }}{{ n.ji ? ' / ' + n.ji : '' }}</text>
                <text class="num-level" :class="['l-' + n.level]">{{ n.level === '上' ? '上等' : n.level === '中' ? '中等' : '下等' }}</text>
              </view>
              <text class="num-desc">{{ n.desc }}</text>
            </view>
          </view>
        </view>

        <!-- 音形义 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.22s">
          <text class="card-title title-mystic">音 · 形 · 义</text>
          <view class="yx-item">
            <text class="yx-l">音 律</text>
            <text class="yx-yi">宜 · {{ result.yiXingYi.yinLu.yi }}</text>
            <text class="yx-ji">忌 · {{ result.yiXingYi.yinLu.ji }}</text>
            <text class="yx-desc">{{ result.yiXingYi.yinLu.desc }}</text>
          </view>
          <view class="yx-item">
            <text class="yx-l">形 象</text>
            <text class="yx-yi">宜 · {{ result.yiXingYi.xingXiang.yi }}</text>
            <text class="yx-ji">忌 · {{ result.yiXingYi.xingXiang.ji }}</text>
            <text class="yx-desc">{{ result.yiXingYi.xingXiang.desc }}</text>
          </view>
          <view class="yx-item">
            <text class="yx-l">意 义</text>
            <text class="yx-yi">宜 · {{ result.yiXingYi.yiYi.yi }}</text>
            <text class="yx-ji">忌 · {{ result.yiXingYi.yiYi.ji }}</text>
            <text class="yx-desc">{{ result.yiXingYi.yiYi.desc }}</text>
          </view>
        </view>

        <view class="form-actions" style="margin-top: 32rpx">
          <view class="btn-secondary" @click="reset">重 新 详 批</view>
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
import { analyzeName, type NameAnalysis } from '@/utils/yuxia'

const app = useAppStore()
const loading = ref(false)
const result = ref<NameAnalysis | null>(null)
const form = ref({ surname: '', given: '' })

async function onCalculate() {
  if (!form.value.surname || !form.value.given) return
  loading.value = true
  await new Promise((r) => setTimeout(r, 600))
  result.value = analyzeName(form.value.surname, form.value.given)
  loading.value = false
  app.addHistory({
    tool: 'yuxia',
    toolName: '玉匣记',
    category: '高阶典籍',
    input: { surname: form.value.surname, given: form.value.given },
    output: { score: result.value.totalScore, grade: result.value.grade },
    brief: `${form.value.surname}${form.value.given} · 81 数详批 · ${result.value.grade}`,
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
.name-input {
  width: 100%;
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-size: var(--fs-md);
}
.form-tip { margin-bottom: var(--sp-3); padding: var(--sp-2); background: rgba(20, 20, 28, 0.3); border-left: 4rpx solid var(--color-liu); border-radius: var(--r-sm); }
.form-tip text { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; line-height: 1.6; }
.form-actions { margin-top: var(--sp-4); }
.btn-zhu {
  padding: var(--sp-3);
  text-align: center;
  background: linear-gradient(135deg, #D4AF37, #5B3A8E);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  font-size: var(--fs-md);
  border-radius: var(--r-md);
}
.btn-zhu.is-loading { opacity: 0.7; }
.btn-zhu.disabled { opacity: 0.4; pointer-events: none; }
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
.summary-text { display: block; font-size: var(--fs-sm); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.7; }

.sc-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: var(--sp-1); margin-bottom: var(--sp-2); }
.sc-cell { padding: var(--sp-2); background: rgba(212, 175, 55, 0.06); border-radius: var(--r-sm); text-align: center; }
.sc-l { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; }
.sc-v { display: block; font-size: var(--fs-md); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.sc-luck.l-大吉 { color: var(--color-liu); }
.sc-luck.l-吉 { color: #4FAE6F; }
.sc-luck.l-半吉 { color: var(--color-bai); }
.sc-luck.l-凶, .sc-luck.l-大凶 { color: var(--color-zhu); }
.sc-reason { display: block; font-size: var(--fs-sm); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.7; padding: var(--sp-2); background: rgba(10, 10, 18, 0.4); border-radius: var(--r-sm); }

.num-item { display: flex; gap: var(--sp-2); padding: var(--sp-2); margin-bottom: var(--sp-1); background: rgba(20, 20, 28, 0.4); border-radius: var(--r-sm); border-left: 4rpx solid var(--color-liu); }
.num-l { flex-shrink: 0; width: 100rpx; text-align: center; }
.num-ge { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; }
.num-n { display: block; font-size: var(--fs-xl); color: var(--color-liu); font-family: 'KaiTi', serif; font-weight: 700; }
.num-r { flex: 1; }
.num-tag-row { display: flex; gap: var(--sp-1); margin-bottom: 4rpx; }
.num-tag {
  font-size: var(--fs-xs);
  font-family: 'KaiTi', serif;
  padding: 2rpx 8rpx;
  border-radius: var(--r-sm);
}
.t-上, .num-tag.t-大吉, .num-tag.t-吉, .num-tag.t-半吉 { background: var(--color-liu); color: #1a1a2a; }
.t-中, .num-tag.t-半吉 { background: #1B3A5C; color: var(--color-bai); }
.t-下, .num-tag.t-凶 { background: var(--color-zhu); color: var(--color-bai); }
.num-level { font-size: var(--fs-xs); font-family: 'KaiTi', serif; padding: 2rpx 8rpx; border-radius: var(--r-sm); }
.l-上 { background: var(--color-liu); color: #1a1a2a; }
.l-中 { background: #1B3A5C; color: var(--color-bai); }
.l-下 { background: var(--color-zhu); color: var(--color-bai); }
.num-desc { display: block; font-size: var(--fs-xs); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.6; }

.yx-item { padding: var(--sp-2); margin-bottom: var(--sp-1); background: rgba(20, 20, 28, 0.4); border-radius: var(--r-sm); }
.yx-l { display: inline-block; font-size: var(--fs-sm); color: var(--color-liu); font-family: 'KaiTi', serif; font-weight: 700; margin-right: var(--sp-2); min-width: 80rpx; }
.yx-yi { display: inline-block; font-size: var(--fs-xs); color: #4FAE6F; font-family: 'KaiTi', serif; margin-right: var(--sp-2); }
.yx-ji { display: inline-block; font-size: var(--fs-xs); color: var(--color-zhu); font-family: 'KaiTi', serif; }
.yx-desc { display: block; font-size: var(--fs-xs); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.6; margin-top: 4rpx; }
</style>
