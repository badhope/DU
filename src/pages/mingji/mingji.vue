<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="命名测字" subtitle="NAME ANALYSIS" />

    <view class="setup card-mystic anim-fade-up card-hoverable">
      <text class="form-title title-mystic">三 才 五 格</text>
      <text class="form-sub">姓 名 之 学 · 五 行 配 合</text>

      <view class="form-row">
        <text class="form-label">姓名</text>
        <input v-model="form.name" class="form-inp" placeholder="如：李清照" />
      </view>
      <view class="form-row">
        <text class="form-label">性别</text>
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
        <text>· 拆字五行 · 三才五格 · 喜用神 · 命理综合</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" @click="analyze">开 始 测 字</view>
      </view>
    </view>

    <view v-if="result" class="result">
      <ResultReveal :direction="'up'" :stagger="0.1">
        <!-- 用户切换器 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="margin-bottom: 16rpx">
          <UserSwitcher :tool="toolKey" @addUser="cd.onAddUser" @select="cd.switchUser" />
        </view>

        <!-- 命名测字可视化 -->
        <view class="card card-mystic card-hoverable anim-fade-up" style="animation-delay: 0.02s">
          <MingJiChart :result="result" />
        </view>

        <view class="overall card-mystic card-hoverable anim-fade-up">
          <text class="ov-name">{{ result.name }}</text>
          <view class="ov-row">
            <view class="ov-num">
              <text class="ov-val">{{ result.score }}</text
              ><text class="ov-unit">/ 100</text>
            </view>
            <text class="ov-level" :class="'lv-' + result.level">{{ result.level }}</text>
          </view>
          <text class="ov-sum">{{ result.summary }}</text>
        </view>

        <view class="chars card-mystic anim-fade-up card-hoverable" style="animation-delay: 0.05s">
          <text class="card-title title-mystic">字 拆 五 行</text>
          <view class="char-row">
            <view v-for="(c, i) in charList" :key="i" class="char-cell">
              <text class="char-glyph">{{ c.ch }}</text>
              <text class="char-el" :style="{ color: WX_META[c.wx].color }">
                {{ WX_META[c.wx].name }}
              </text>
              <text class="char-type">{{ c.type }}</text>
            </view>
          </view>
        </view>

        <view class="wuge card-mystic anim-fade-up card-hoverable" style="animation-delay: 0.1s">
          <text class="card-title title-mystic">三 才 五 格</text>
          <view class="wg-grid">
            <view class="wg-cell">
              <text class="wg-name">天格</text>
              <text class="wg-num">{{ result.wuGe.tianGe }}</text>
            </view>
            <view class="wg-cell">
              <text class="wg-name">人格</text>
              <text class="wg-num">{{ result.wuGe.renGe }}</text>
            </view>
            <view class="wg-cell">
              <text class="wg-name">地格</text>
              <text class="wg-num">{{ result.wuGe.diGe }}</text>
            </view>
            <view class="wg-cell">
              <text class="wg-name">外格</text>
              <text class="wg-num">{{ result.wuGe.waiGe }}</text>
            </view>
            <view class="wg-cell" :style="{ background: 'rgba(212, 175, 55, 0.15)' }">
              <text class="wg-name">总格</text>
              <text class="wg-num">{{ result.wuGe.zongGe }}</text>
            </view>
          </view>
          <text class="wg-sancai">三 才 · {{ result.wuGe.sanCai }}</text>
          <text class="wg-jix" :class="'lv-' + result.wuGe.jiXiong">{{ result.wuGe.jiXiong }}</text>
        </view>

        <view
          class="balance card-mystic anim-fade-up card-hoverable"
          style="animation-delay: 0.15s"
        >
          <text class="card-title title-mystic">五 行 平 衡</text>
          <view v-for="(c, k) in balanceList" :key="k" class="bal-row">
            <text class="bal-name" :style="{ color: c.color }">{{ c.name }}</text>
            <view class="bal-bar">
              <view class="bal-fill" :style="{ width: c.percent + '%', background: c.color }" />
            </view>
            <text class="bal-val">{{ c.count }} / {{ result.totalStrokes }}</text>
          </view>
          <text class="bal-advice">· {{ result.advice }}</text>
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
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import MingJiChart from '@/components/charts/MingJiChart.vue'
import { useAppStore } from '@/stores'
import { analyzeMingji, type MingjiResult } from '@/utils/mingji'
import { WUXING_META, type Wuxing } from '@/utils/wuxing'
import UserSwitcher from '@/components/ui/UserSwitcher.vue'
import ToolGuard from '@/components/ui/ToolGuard.vue'
import { useCooldown } from '@/utils/use-cooldown'
import LoadingSeal from '@/components/ui/LoadingSeal.vue'
import ResultReveal from '@/components/ui/ResultReveal.vue'

const app = useAppStore()
const cd = useCooldown({ tool: 'mingji', toolName: '命名测字', category: '测字' })
const toolKey = 'mingji' as const
const WX_META = WUXING_META
const form = ref({ name: '李清照', gender: '女' as '男' | '女' })

// 若用户档案已存在，预填本人姓名与性别
if (app.profile) {
  const p = app.profile
  if (p.nickname) form.value.name = p.nickname
  if (p.gender === 'male') form.value.gender = '男'
  else if (p.gender === 'female') form.value.gender = '女'
}
const result = ref<MingjiResult | null>(null)
const loading = ref(false)

const charList = computed(() => {
  if (!result.value) return []
  return result.value.name.split('').map((c, i) => ({
    ch: c,
    wx: result.value!.charWx[i],
    type: i === 0 ? '姓' : '名',
  }))
})

const balanceList = computed(() => {
  if (!result.value) return []
  const WX_KEYS: Wuxing[] = ['mu', 'huo', 'tu', 'jin', 'shui']
  const WX_NAMES: Record<Wuxing, string> = { mu: '木', huo: '火', tu: '土', jin: '金', shui: '水' }
  return WX_KEYS.map((k) => {
    const count = result.value!.fiveElBalance[k]
    return {
      name: WX_NAMES[k],
      count,
      color: WX_META[k].color,
      percent: result.value!.totalStrokes
        ? Math.round(((count * 10) / result.value!.totalStrokes) * 100)
        : 0,
    }
  })
})

function analyze() {
  if (!cd.guard()) return
  const name = (form.value.name || '').trim()
  if (name.length < 2) {
    uni.showToast({ title: '请输入完整姓名（姓 + 名）', icon: 'none' })
    return
  }
  if (!/^[\u4e00-\u9fa5·]+$/.test(name)) {
    uni.showToast({ title: '请输入纯汉字姓名', icon: 'none' })
    return
  }
  loading.value = true
  setTimeout(() => {
    try {
      result.value = analyzeMingji(name)
      loading.value = false
      if (result.value) {
        cd.commit(
          `${result.value.name} · ${result.value.level} · ${result.value.score}分`,
          { name },
          { score: result.value.score, level: result.value.level },
        )
      }
    } catch (e) {
      loading.value = false
      uni.showModal({ title: '分析失败', content: '请检查姓名输入', showCancel: false })
    }
  }, 2400)
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
.form-row {
  display: flex;
  align-items: center;
  padding: var(--sp-2) 0;
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.1);
}
.form-label {
  width: 120rpx;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.form-inp {
  flex: 1;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  color: var(--color-bai);
  font-size: var(--fs-sm);
  border-radius: var(--r-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
}
.gender {
  flex: 1;
  display: flex;
  gap: var(--sp-2);
}
.g-btn {
  flex: 1;
  text-align: center;
  padding: var(--sp-2) 0;
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
}
.g-btn.active {
  background: linear-gradient(135deg, #d4af37, #1b3a5c);
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
  margin-top: var(--sp-3);
}
.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #d4af37, #1b3a5c);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 320rpx;
  text-align: center;
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-3);
  text-align: center;
}
.card-mystic {
  padding: var(--sp-4);
}

.overall {
  padding: var(--sp-4);
}
.ov-name {
  display: block;
  text-align: center;
  font-size: 60rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 16rpx rgba(212, 175, 55, 0.5);
  margin-bottom: var(--sp-2);
}
.ov-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  justify-content: center;
}
.ov-num {
  display: flex;
  align-items: baseline;
}
.ov-val {
  font-size: 80rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.ov-unit {
  font-size: var(--fs-sm);
  color: var(--color-bai-3);
}
.ov-level {
  padding: 6rpx 20rpx;
  font-size: var(--fs-md);
  border-radius: var(--r-sm);
  color: var(--color-bai);
}
.ov-level.lv-大吉 {
  background: linear-gradient(135deg, #d4af37, #c8302a);
}
.ov-level.lv-吉 {
  background: #4fae6f;
}
.ov-level.lv-平 {
  background: #1b3a5c;
}
.ov-level.lv-凶 {
  background: #c8302a;
}
.ov-sum {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin-top: var(--sp-2);
  font-family: 'KaiTi', serif;
}

.chars {
  padding: var(--sp-4);
}
.char-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  justify-content: center;
}
.char-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-md);
  min-width: 100rpx;
}
.char-glyph {
  font-size: 60rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.char-el {
  font-size: var(--fs-md);
  font-weight: 600;
}
.char-type {
  font-size: 20rpx;
  color: var(--color-bai-3);
}

.wuge {
  padding: var(--sp-4);
}
.wg-grid {
  display: flex;
  gap: var(--sp-2);
}
.wg-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
}
.wg-name {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.wg-num {
  font-size: 36rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.wg-sancai {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-top: var(--sp-3);
  font-family: 'KaiTi', serif;
}
.wg-jix {
  display: block;
  text-align: center;
  font-size: var(--fs-lg);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-top: var(--sp-2);
}
.wg-jix.lv-吉 {
  color: #4fae6f;
}
.wg-jix.lv-半吉 {
  color: #d4af37;
}
.wg-jix.lv-凶 {
  color: #c8302a;
}

.balance {
  padding: var(--sp-4);
}
.bal-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: var(--sp-2) 0;
}
.bal-name {
  width: 60rpx;
  font-size: var(--fs-md);
  font-family: 'KaiTi', serif;
  font-weight: 600;
}
.bal-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 8rpx;
  overflow: hidden;
}
.bal-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.6s ease;
}
.bal-val {
  width: 100rpx;
  text-align: right;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.bal-advice {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-top: var(--sp-2);
  font-family: 'KaiTi', serif;
}
</style>
