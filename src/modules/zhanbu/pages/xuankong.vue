<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="玄空飞星" subtitle="XUAN KONG FLYING STARS" />

    <view v-if="!result" class="form card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">排 盘 入 门</text>
      <text class="form-sub">三 元 九 运 · 流 年 紫 白 · 八 方 飞 星</text>
      <view class="form-row">
        <text class="form-label">年</text>
        <picker
          mode="number"
          :value="form.year"
          :min="1864"
          :max="2073"
          @change="onPick('year', $event)"
        >
          <view class="form-picker">{{ form.year }} 年</view>
        </picker>
      </view>
      <view class="form-tip">
        <text>· 2024 后入下元 9 运 · 喜事主导 · 桃花科甲</text>
      </view>
      <view class="form-actions">
        <view class="btn-zhu" @click="calculate"><text>开 始 排 盘</text></view>
      </view>
    </view>

    <view v-else class="result">
      <ResultReveal :direction="'up'" :stagger="0.1">
        <!-- 玄空飞星可视化（核心） -->
        <view class="card card-mystic card-hoverable anim-fade-up">
          <text class="card-title title-mystic">玄 空 飞 星 · 九 宫 飞 星 图</text>
          <XuanKongChart :result="result" />
        </view>
        <!-- 元运 -->
        <view class="card-mystic card anim-fade-up card-hoverable">
          <text class="card-title title-mystic">当 运 推 算</text>
          <text class="yun-label">{{ result.yun.yuan }}元 {{ result.yun.num }} 运</text>
          <text class="yun-desc">{{ result.yun.desc }}</text>
          <text class="yun-summary">{{ result.summary }}</text>
        </view>

        <!-- 九宫运盘 -->
        <view class="card-mystic card anim-fade-up card-hoverable" style="animation-delay: 0.1s">
          <text class="card-title title-mystic">运 盘 · 九 宫 飞 星</text>
          <view class="nine-grid">
            <view
              v-for="(s, i) in yunGridList"
              :key="'y' + i"
              class="nine-cell"
              :style="{ borderColor: starColor(s) }"
            >
              <text class="n-pos">{{ posName(i) }}</text>
              <text class="n-num" :style="{ color: starColor(s) }">{{ s }}</text>
              <text class="n-name" :style="{ color: starColor(s) }">{{ GONG_NAMES_9[s - 1] }}</text>
            </view>
          </view>
        </view>

        <!-- 流年盘 -->
        <view class="card-mystic card anim-fade-up card-hoverable" style="animation-delay: 0.15s">
          <text class="card-title title-mystic">流 年 紫 白 盘</text>
          <view class="nine-grid">
            <view
              v-for="(s, i) in liuGridList"
              :key="'l' + i"
              class="nine-cell"
              :style="{ borderColor: starColor(s) }"
            >
              <text class="n-pos">{{ posName(i) }}</text>
              <text class="n-num" :style="{ color: starColor(s) }">{{ s }}</text>
              <text class="n-name" :style="{ color: starColor(s) }">{{ GONG_NAMES_9[s - 1] }}</text>
            </view>
          </view>
        </view>

        <!-- 八方位吉凶 -->
        <view class="card-mystic card anim-fade-up card-hoverable" style="animation-delay: 0.2s">
          <text class="card-title title-mystic">八 方 位 吉 凶</text>
          <view class="dir-list">
            <view
              v-for="(d, i) in result.directions"
              :key="i"
              class="dir-row"
              :class="'lv-' + levelKey(d.level)"
            >
              <text class="d-dir">{{ d.dir }}</text>
              <text class="d-star">{{ d.starName }}</text>
              <text class="d-level">{{ d.level }}</text>
              <text class="d-advice">{{ d.advice }}</text>
            </view>
          </view>
        </view>

        <!-- 12 月运势 -->
        <view class="card-mystic card anim-fade-up card-hoverable" style="animation-delay: 0.25s">
          <text class="card-title title-mystic">十 二 月 运 势</text>
          <view class="month-grid">
            <view
              v-for="(m, i) in result.monthly"
              :key="i"
              class="m-cell"
              :class="'lv-' + levelKey(m.level)"
            >
              <text class="m-num">{{ m.month }}</text>
              <text class="m-star">{{ m.star }}</text>
              <text class="m-lv">{{ m.level }}</text>
            </view>
          </view>
        </view>

        <!-- 5 事 -->
        <view class="card-mystic card anim-fade-up card-hoverable" style="animation-delay: 0.3s">
          <text class="card-title title-mystic">五 事 指 引</text>
          <view class="tips">
            <text v-for="(t, i) in result.fiveTips" :key="i" class="tip">{{ i + 1 }}. {{ t }}</text>
          </view>
        </view>

        <view class="form-actions">
          <view class="btn-liu" @click="result = null">重 新 排 盘</view>
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
import { ref, computed } from 'vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import {
  calcXuanKong,
  GONG_NAMES_9,
  GONG_DIR,
  type XuanKongResult,
  type GONG_NUM,
} from '@modules/zhanbu/logic/xuankong'
import ToolGuard from '@shared/components/ui/ToolGuard.vue'
import { useCooldown } from '@shared/composables/use-cooldown'
import LoadingSeal from '@shared/components/ui/LoadingSeal.vue'
import ResultReveal from '@shared/components/ui/ResultReveal.vue'

const app = useAppStore()
const cd = useCooldown({ tool: 'xuankong', toolName: '玄空飞星', category: '风水' })
const _toolKey = 'xuankong' as const
const form = ref({ year: new Date().getFullYear() })
const result = ref<XuanKongResult | null>(null)
const loading = ref(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onPick(k: string, e: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(form.value as any)[k] = Number(e.detail.value)
}

function calculate() {
  if (!cd.guard()) return
  loading.value = true
  setTimeout(() => {
    result.value = calcXuanKong(form.value.year, 1, 1, 12)
    loading.value = false
    if (result.value) {
      cd.commit(
        `${form.value.year}年 · ${result.value.yun.yuan}元${result.value.yun.num}运`,
        { year: form.value.year },
        { yun: result.value.yun.num, level: result.value.yun.yuan },
      )
    }
  }, 2400)
}

// 九宫格顺序：巽 离 坤 / 震 中 兑 / 艮 坎 乾
const gridOrder = [4, 9, 2, 3, 5, 7, 8, 1, 6]
const yunGridList = computed(() =>
  result.value ? gridOrder.map((pos) => result.value!.yunPan[pos]) : [],
)
const liuGridList = computed(() =>
  result.value ? gridOrder.map((pos) => result.value!.liuNianPan[pos]) : [],
)

function posName(i: number) {
  const map = ['巽', '离', '坤', '震', '中', '兑', '艮', '坎', '乾']
  return map[i]
}

function starColor(s: GONG_NUM) {
  return GONG_DIR[s].wx === '水'
    ? '#1B3A5C'
    : GONG_DIR[s].wx === '火'
      ? '#C8302A'
      : GONG_DIR[s].wx === '木'
        ? '#2F7D4F'
        : GONG_DIR[s].wx === '金'
          ? '#E8E4D8'
          : '#A87C4F'
}

function levelKey(l: string): 'ji' | 'ping' | 'xiong' {
  if (l.includes('吉')) return 'ji'
  if (l.includes('凶')) return 'xiong'
  return 'ping'
}
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
.result {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0 var(--sp-2);
}
.card {
  padding: var(--sp-4);
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  text-align: center;
  margin-bottom: var(--sp-3);
  letter-spacing: 0.2em;
}
.yun-label {
  display: block;
  text-align: center;
  font-size: var(--fs-xl);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: var(--sp-1);
}
.yun-desc {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-2);
}
.yun-summary {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  line-height: 1.7;
}
.nine-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4rpx;
  aspect-ratio: 1;
}
.nine-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 18, 0.6);
  border: 2rpx solid;
  border-radius: var(--r-sm);
  padding: 4rpx;
}
.n-pos {
  font-size: 18rpx;
  color: var(--color-bai-3);
}
.n-num {
  font-size: 36rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.n-name {
  font-size: 16rpx;
  font-family: 'KaiTi', serif;
}
.dir-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.dir-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-md);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  flex-wrap: wrap;
}
.dir-row.lv-ji {
  border-color: rgba(79, 174, 111, 0.4);
}
.dir-row.lv-xiong {
  border-color: rgba(200, 48, 42, 0.4);
}
.d-dir {
  width: 80rpx;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.d-star {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.d-level {
  width: 80rpx;
  font-size: var(--fs-sm);
  text-align: center;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.lv-ji .d-level {
  color: #4fae6f;
  background: rgba(79, 174, 111, 0.15);
}
.lv-ping .d-level {
  color: var(--color-bai-2);
  background: rgba(100, 100, 120, 0.2);
}
.lv-xiong .d-level {
  color: var(--color-zhu);
  background: rgba(200, 48, 42, 0.15);
}
.d-advice {
  flex: 1;
  min-width: 200rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}
.month-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6rpx;
}
.m-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
}
.m-cell.lv-ji {
  border-color: rgba(79, 174, 111, 0.4);
}
.m-cell.lv-xiong {
  border-color: rgba(200, 48, 42, 0.4);
}
.m-num {
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.m-star {
  font-size: 18rpx;
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}
.m-lv {
  font-size: 18rpx;
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
}
.tips {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.tip {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
}
</style>
