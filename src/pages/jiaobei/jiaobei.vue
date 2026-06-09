<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="杯筊问事" subtitle="DIVINE BLOCK" />

    <view v-if="!result" class="setup card-mystic anim-fade-up">
      <text class="form-title title-mystic">圣 杯 问 事</text>
      <text class="form-sub">心 诚 则 灵 · 三 次 连 掷</text>

      <view class="form-section">
        <text class="form-label">· 默念所问之事</text>
        <textarea
          v-model="question"
          class="form-text"
          placeholder="如：问今年是否适合换工作..."
          maxlength="200"
        />
      </view>

      <view class="form-section">
        <text class="form-label">· 掷筊次数</text>
        <view class="times-row">
          <view
            v-for="t in [1, 3, 5, 7]"
            :key="t"
            class="t-btn"
            :class="{ active: times === t }"
            @click="times = t"
          >
            {{ t }} 次
          </view>
        </view>
      </view>

      <view class="form-tip">
        <text>· 圣筊(一阴一阳)：神明允诺 · 笑筊(两阳)：笑而不答 · 阴筊(两阴)：神明不允</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" @click="cast">掷 筊</view>
      </view>
    </view>

    <view v-else class="result">
      <view v-if="casting" class="casting card-mystic anim-fade-up">
        <text class="cast-jiao">{{ result.results[currentCast].icon }}</text>
        <text class="cast-text">掷 筊 中 …</text>
      </view>

      <view v-else class="result-card card-mystic anim-fade-up">
        <text class="r-title">三 次 连 掷</text>
        <view class="jiao-row">
          <view v-for="(r, i) in result.results" :key="i" class="jiao-box" :class="'jb-' + r.type">
            <text class="jb-num">第 {{ i + 1 }} 掷</text>
            <text class="jb-icon">{{ r.icon }}</text>
            <text class="jb-mean">{{ r.meaning }}</text>
            <text class="jb-advice">{{ r.advice }}</text>
          </view>
        </view>

        <view class="final">
          <text class="f-label">· 最终结果</text>
          <text class="f-icon">{{ result.finalResult.icon }}</text>
          <text class="f-mean" :class="'f-' + result.final">{{ result.finalResult.meaning }}</text>
        </view>

        <text class="r-summary">{{ result.summary }}</text>
      </view>

      <view v-if="!casting" class="form-actions">
        <view class="btn-zhu" @click="result = null">再 问 一 卦</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import { castJiao, type JiaoResult as _JiaoResult } from '@/utils/jiaobei'

const app = useAppStore()

const question = ref('')
const times = ref(3)
const result = ref<ReturnType<typeof castJiao> | null>(null)
const casting = ref(false)
const currentCast = ref(0)

async function cast() {
  const q = question.value.trim()
  if (q.length === 0) {
    uni.showToast({ title: '请先输入所问之事', icon: 'none' })
    return
  }
  if (q.length > 50) {
    uni.showToast({ title: '所问之事不超过 50 字', icon: 'none' })
    return
  }
  casting.value = true
  try {
    result.value = castJiao(q, times.value)
    // 逐次动画
    for (let i = 0; i < result.value.results.length; i++) {
      currentCast.value = i
      await new Promise((r) => setTimeout(r, 800))
    }
    casting.value = false
    app.addHistory({
      tool: 'jiaobei',
      toolName: '杯筊问事',
      category: '占卜',
      input: { question: q },
      output: { final: result.value.final },
      brief: `${result.value.finalResult.meaning} · ${q.slice(0, 12)}`,
    })
  } catch (_e) {
    casting.value = false
    uni.showModal({ title: '问筊失败', content: '请重试', showCancel: false })
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}
.setup,
.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0 var(--sp-2);
  margin-top: var(--sp-2);
}
.setup {
  padding: var(--sp-4);
}
.form-title {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
}
.form-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-bottom: var(--sp-4);
}
.form-section {
  margin: var(--sp-3) 0;
}
.form-label {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-bottom: var(--sp-2);
}
.form-text {
  width: 100%;
  min-height: 160rpx;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.6);
  color: var(--color-bai);
  font-size: var(--fs-sm);
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  line-height: 1.6;
}
.times-row {
  display: flex;
  gap: var(--sp-2);
}
.t-btn {
  flex: 1;
  text-align: center;
  padding: var(--sp-2) 0;
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.t-btn.active {
  background: linear-gradient(135deg, #8b6f47, #c8302a);
  color: var(--color-bai);
  border-color: var(--color-liu);
}
.form-tip {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  text-align: center;
  margin: var(--sp-2) 0;
}
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-4);
}
.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #8b6f47, #c8302a);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 320rpx;
  text-align: center;
}

.casting {
  padding: var(--sp-6);
  text-align: center;
}
.cast-jiao {
  display: block;
  font-size: 200rpx;
  color: var(--color-liu);
  text-shadow: 0 0 30rpx rgba(212, 175, 55, 0.5);
  animation: shake 0.5s ease infinite;
}
.cast-text {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-liu);
  margin-top: var(--sp-3);
  letter-spacing: 0.3em;
}
@keyframes shake {
  0%,
  100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}

.result-card {
  padding: var(--sp-4);
}
.r-title {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-liu);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-3);
}
.jiao-row {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.jiao-box {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  border-left: 6rpx solid var(--color-liu);
}
.jiao-box.jb-sheng {
  border-left-color: #4fae6f;
}
.jiao-box.jb-xiao {
  border-left-color: #d4af37;
}
.jiao-box.jb-yin {
  border-left-color: #c8302a;
}
.jb-num {
  width: 80rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.jb-icon {
  width: 120rpx;
  font-size: 40rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-align: center;
}
.jb-mean {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.jb-advice {
  flex: 1;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}

.final {
  margin: var(--sp-4) 0;
  padding: var(--sp-4);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(200, 48, 42, 0.1));
  border-radius: var(--r-md);
  text-align: center;
}
.f-label {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  margin-bottom: var(--sp-2);
}
.f-icon {
  display: block;
  font-size: 100rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.f-mean {
  display: block;
  font-size: var(--fs-lg);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-top: var(--sp-2);
}
.f-sheng {
  color: #4fae6f;
}
.f-xiao {
  color: #d4af37;
}
.f-yin {
  color: #c8302a;
}
.r-summary {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
  margin-top: var(--sp-3);
}
</style>
