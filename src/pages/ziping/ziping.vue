<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <TopBar title="子平真诠" subtitle="ZIPING · ZHENQUAN · 沈孝瞻" />

    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">沈 孝 瞻 · 子 平 真 诠</text>
      <text class="form-sub">用 神 精 断 · 格 局 高 判 · 神 煞 详 注</text>

      <view class="form-row">
        <text class="form-label">生 辰</text>
        <view class="date-row">
          <picker mode="date" :value="form.date" @change="(e) => form.date = e.detail.value" class="dt-pkr">
            <view class="dt-btn">{{ form.date }}</view>
          </picker>
          <picker mode="time" :value="form.time" @change="(e) => form.time = e.detail.value" class="dt-pkr">
            <view class="dt-btn">{{ form.time }}</view>
          </picker>
        </view>
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
          >{{ g }}</view>
        </view>
      </view>

      <view class="form-tip">
        <text>· 月令以节气为准 · 暂用公历近似</text>
        <text>· 真诠用神四法：扶抑、调候、通关、病药</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" :class="{ 'is-loading': loading }" @click="onCalculate">
          <text>{{ loading ? '排 盘 中…' : '排 盘 · 详 批' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.08">
        <!-- 四柱 -->
        <view class="card card-mystic card-hoverable anim-fade-up">
          <text class="card-title title-mystic">四 柱 · 八 字</text>
          <view class="pillars">
            <view class="pl-col">
              <text class="pl-l">年柱</text>
              <text class="pl-gan">{{ r.bazi.year }}</text>
              <text class="pl-zhi">{{ r.bazi.yearZhi }}</text>
            </view>
            <view class="pl-col">
              <text class="pl-l">月柱</text>
              <text class="pl-gan">{{ r.bazi.month }}</text>
              <text class="pl-zhi">{{ r.bazi.monthZhi }}</text>
            </view>
            <view class="pl-col pl-day">
              <text class="pl-l">日柱</text>
              <text class="pl-gan">{{ r.bazi.day }}</text>
              <text class="pl-zhi">{{ r.bazi.dayZhi }}</text>
            </view>
            <view class="pl-col">
              <text class="pl-l">时柱</text>
              <text class="pl-gan">{{ r.bazi.hour }}</text>
              <text class="pl-zhi">{{ r.bazi.hourZhi }}</text>
            </view>
          </view>
        </view>

        <!-- 日主 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.08s">
          <text class="card-title title-mystic">日 主 旺 衰</text>
          <view class="dm-row">
            <view class="dm-cell">
              <text class="dm-l">日 主</text>
              <text class="dm-v">{{ r.dayMaster.gan }}（{{ r.dayMaster.wx }}）</text>
            </view>
            <view class="dm-cell">
              <text class="dm-l">状 态</text>
              <text class="dm-v" :class="['st-' + r.dayMaster.state]">{{ r.dayMaster.state }}</text>
            </view>
            <view class="dm-cell">
              <text class="dm-l">评 分</text>
              <text class="dm-v">{{ r.dayMaster.score }}</text>
            </view>
          </view>
          <text class="dm-reason">{{ r.dayMaster.reasons.join(' · ') }}</text>
        </view>

        <!-- 月令提纲 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">月 令 提 纲</text>
          <view class="yl-row">
            <text class="yl-text">{{ r.yueLing.zhi }} 月 · 司令 {{ r.yueLing.silingGan }}（{{ r.yueLing.siling }}）· 藏干：{{ r.yueLing.cangGan.join(' / ') }}</text>
          </view>
          <text class="yl-info">月令为四柱之根 · 子平真诠首重提纲</text>
        </view>

        <!-- 格局 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.22s">
          <text class="card-title title-mystic">格 局 判 定</text>
          <text class="gj-type">{{ r.geju.type }}</text>
          <text class="gj-main">{{ r.geju.main }}</text>
          <text class="gj-reason">{{ r.geju.reasoning }}</text>
        </view>

        <!-- 用神 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.3s">
          <text class="card-title title-mystic">用 神 · 真 诠</text>
          <view class="ys-row">
            <view class="ys-cell">
              <text class="ys-l">用 神 法</text>
              <text class="ys-v">{{ r.yongShen.type }}</text>
            </view>
            <view class="ys-cell">
              <text class="ys-l">用 神</text>
              <text class="ys-v ys-yong">{{ r.yongShen.yong }}</text>
            </view>
            <view class="ys-cell">
              <text class="ys-l">喜 神</text>
              <text class="ys-v ys-xi">{{ r.yongShen.xi }}</text>
            </view>
            <view class="ys-cell">
              <text class="ys-l">忌 神</text>
              <text class="ys-v ys-ji">{{ r.yongShen.ji }}</text>
            </view>
          </view>
          <text class="ys-reason">{{ r.yongShen.reasoning }}</text>
          <text v-if="r.yongShen.tiaohouInfo" class="ys-tiaohou">调候 · {{ r.yongShen.tiaohouInfo }}</text>
        </view>

        <!-- 五行分布 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.38s">
          <text class="card-title title-mystic">五 行 分 布</text>
          <view class="wx-grid">
            <view v-for="(c, k) in r.wuxingDist" :key="k" class="wx-cell">
              <text class="wx-k">{{ k }}</text>
              <view class="wx-bar">
                <view class="wx-fill" :style="{ width: (c * 12.5) + '%' }" />
              </view>
              <text class="wx-c">{{ c }}</text>
            </view>
          </view>
        </view>

        <!-- 神煞 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.45s">
          <text class="card-title title-mystic">神 煞</text>
          <view v-if="r.shenSha.length" class="ss-list">
            <view v-for="(s, i) in r.shenSha" :key="i" class="ss-item">
              <view class="ss-l" :class="['ss-' + s.level]">{{ s.level }}</view>
              <text class="ss-name">{{ s.name }}</text>
              <text class="ss-desc">{{ s.desc }}</text>
            </view>
          </view>
          <text v-else class="ss-empty">此四柱无明显神煞</text>
        </view>

        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.5s">
          <text class="card-title title-mystic">总 评</text>
          <text class="summary">{{ r.summary }}</text>
        </view>

        <view class="form-actions" style="margin-top: 32rpx">
          <view class="btn-secondary" @click="reset">重 新 排 盘</view>
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
import { analyzeZipingFromDate, type ZipingResult } from '@/utils/ziping'

const app = useAppStore()
const loading = ref(false)
const result = ref<ZipingResult | null>(null)
const form = ref<{ date: string; time: string; gender: '男' | '女' }>({
  date: '1990-01-01',
  time: '12:00',
  gender: '男',
})
const r = ref<ZipingResult | null>(null)

async function onCalculate() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 600))
  const rr = analyzeZipingFromDate(form.value.date, form.value.time)
  result.value = rr
  r.value = rr
  loading.value = false
  app.addHistory({
    tool: 'ziping',
    toolName: '子平真诠',
    category: '高阶典籍',
    input: { date: form.value.date, time: form.value.time, gender: form.value.gender },
    output: { dayMaster: rr.dayMaster.gan, geju: rr.geju.type, yongShen: rr.yongShen.yong },
    brief: `${rr.bazi.day}日 · ${rr.dayMaster.wx} · ${rr.geju.type} · 用 ${rr.yongShen.yong}`,
  })
}

function reset() {
  result.value = null
  r.value = null
}
</script>

<style scoped>
.page { position: relative; min-height: 100vh; padding: 0 var(--sp-3) var(--sp-8); }
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
.form-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-3);
}
.form-row { margin-bottom: var(--sp-3); }
.form-label {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-1);
  letter-spacing: 0.1em;
}
.date-row { display: flex; gap: var(--sp-2); }
.dt-pkr { flex: 1; }
.dt-btn {
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.6);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-size: var(--fs-sm);
  text-align: center;
}
.gender { display: flex; gap: var(--sp-2); }
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
.g-btn.active { background: var(--color-zhu); color: var(--color-bai); border-color: var(--color-zhu); }
.form-tip {
  margin-bottom: var(--sp-3);
  padding: var(--sp-2);
  background: rgba(20, 20, 28, 0.3);
  border-left: 4rpx solid var(--color-liu);
  border-radius: var(--r-sm);
}
.form-tip text { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; line-height: 1.6; }
.form-actions { margin-top: var(--sp-4); }
.btn-zhu {
  padding: var(--sp-3);
  text-align: center;
  background: linear-gradient(135deg, #5C1B1B, #1B3A5C);
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
.card-title {
  display: block;
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  color: var(--color-liu);
  margin-bottom: var(--sp-2);
  letter-spacing: 0.1em;
}

.pillars { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: var(--sp-1); }
.pl-col {
  text-align: center;
  padding: var(--sp-2);
  background: rgba(212, 175, 55, 0.06);
  border-radius: var(--r-sm);
}
.pl-day { background: rgba(200, 48, 42, 0.15); border: 1rpx solid var(--color-zhu); }
.pl-l { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; margin-bottom: 2rpx; }
.pl-gan { display: block; font-size: var(--fs-md); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.pl-zhi { display: block; font-size: var(--fs-sm); color: var(--color-liu); font-family: 'KaiTi', serif; }

.dm-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--sp-1); margin-bottom: var(--sp-2); }
.dm-cell { padding: var(--sp-2); background: rgba(212, 175, 55, 0.06); border-radius: var(--r-sm); }
.dm-l { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; margin-bottom: 2rpx; }
.dm-v { display: block; font-size: var(--fs-md); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.st-旺, .st-相 { color: var(--color-liu); }
.st-死, .st-囚 { color: var(--color-zhu); }
.st-休 { color: var(--color-bai); }
.dm-reason { display: block; font-size: var(--fs-sm); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.7; }

.yl-row { margin-bottom: var(--sp-1); }
.yl-text { display: block; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; }
.yl-info { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; font-style: italic; }

.gj-type {
  display: block;
  font-size: var(--fs-xl);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--sp-2);
  letter-spacing: 0.2em;
}
.gj-main { display: block; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; text-align: center; margin-bottom: var(--sp-1); }
.gj-reason { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; text-align: center; }

.ys-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: var(--sp-1); margin-bottom: var(--sp-2); }
.ys-cell { padding: var(--sp-2); background: rgba(212, 175, 55, 0.06); border-radius: var(--r-sm); text-align: center; }
.ys-l { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; margin-bottom: 2rpx; }
.ys-v { display: block; font-size: var(--fs-md); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.ys-yong { color: var(--color-liu); }
.ys-xi { color: #4FAE6F; }
.ys-ji { color: var(--color-zhu); }
.ys-reason { display: block; font-size: var(--fs-sm); color: var(--color-bai-2); font-family: 'KaiTi', serif; line-height: 1.7; margin-bottom: var(--sp-2); }
.ys-tiaohou { display: block; font-size: var(--fs-xs); color: var(--color-bai-3); font-family: 'KaiTi', serif; line-height: 1.7; padding: var(--sp-2); background: rgba(10, 10, 18, 0.4); border-radius: var(--r-sm); }

.wx-grid { display: flex; flex-direction: column; gap: var(--sp-2); }
.wx-cell { display: flex; align-items: center; gap: var(--sp-2); }
.wx-k { width: 60rpx; font-size: var(--fs-md); color: var(--color-liu); font-family: 'KaiTi', serif; font-weight: 700; }
.wx-bar { flex: 1; height: 16rpx; background: rgba(255, 255, 255, 0.1); border-radius: 8rpx; overflow: hidden; }
.wx-fill { height: 100%; background: linear-gradient(90deg, #5B3A8E, #D4AF37); border-radius: 8rpx; transition: width 0.6s ease; }
.wx-c { width: 60rpx; text-align: right; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; }

.ss-list { display: flex; flex-direction: column; gap: var(--sp-1); }
.ss-item { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-2); background: rgba(20, 20, 28, 0.4); border-radius: var(--r-sm); }
.ss-l { flex-shrink: 0; width: 40rpx; height: 40rpx; line-height: 40rpx; text-align: center; border-radius: 50%; font-size: var(--fs-xs); font-family: 'KaiTi', serif; }
.ss-吉 { background: #4FAE6F; color: var(--color-bai); }
.ss-中 { background: var(--color-liu); color: #1a1a2a; }
.ss-凶 { background: var(--color-zhu); color: var(--color-bai); }
.ss-name { flex-shrink: 0; width: 140rpx; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; font-weight: 700; }
.ss-desc { flex: 1; font-size: var(--fs-xs); color: var(--color-bai-2); font-family: 'KaiTi', serif; }
.ss-empty { display: block; font-size: var(--fs-sm); color: var(--color-bai-3); font-family: 'KaiTi', serif; text-align: center; padding: var(--sp-2); }

.summary { display: block; font-size: var(--fs-sm); color: var(--color-bai); font-family: 'KaiTi', serif; line-height: 1.9; text-indent: 2em; }
</style>
