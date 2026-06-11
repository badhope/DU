<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="玄枢易盘" subtitle="LIU YAO" />

    <view v-if="!result" class="setup card-mystic anim-fade-up">
      <text class="form-title title-mystic">玄 枢 易 盘</text>
      <text class="form-sub">六 爻 纳 甲 · 蓍 草 起 卦</text>

      <!-- 今日为谁问 -->
      <UserSwitcher tool="liuyao" :compact="true" @addUser="onAddUser" />

      <!-- 当前用户冷却提示 -->
      <view v-if="currentUserLocked" class="cooldown-banner">
        <text class="cb-glyph">🔒</text>
        <text class="cb-text">{{ app.activeDivinator?.name }} 今日已起卦 · 换人 或 明日再来</text>
      </view>

      <!-- 所占之事 -->
      <view class="form-section">
        <text class="form-label">· 所 占 之 事</text>
        <view class="topic-grid">
          <view
            v-for="t in TOPICS"
            :key="t.key"
            class="t-btn"
            :class="{ active: topic === t.key }"
            @click="topic = t.key"
          >
            <text class="t-glyph">{{ t.glyph }}</text>
            <text class="t-name">{{ t.label }}</text>
          </view>
        </view>
      </view>

      <!-- 默念说明 -->
      <view class="form-tip">
        <text>· 默念所问之事 · 凝神静气 · 待时机成熟再点击起卦</text>
        <text class="tip-detail">蓍草起卦：6 爻每爻 6/7/8/9 之一 · 6 与 9 为动爻</text>
      </view>

      <!-- 起卦按钮 -->
      <view class="form-actions">
        <view
          class="btn-zhu"
          :class="{ disabled: casting || (currentUserLocked && !forceBypass) }"
          @click="cast"
        >
          {{ casting ? '起 卦 中 …' : currentUserLocked ? '不 听 劝 · 强 行 起 卦' : '起 卦' }}
        </view>
      </view>

      <!-- 八卦简介 -->
      <view class="bagua-intro">
        <text class="bi-title">· 八 卦 简 介</text>
        <view class="bi-grid">
          <view v-for="(info, k) in baguaList" :key="k" class="bi-item">
            <text class="bi-symbol">{{ info.symbol }}</text>
            <text class="bi-name">{{ info.name }} · {{ info.nature }}</text>
            <text class="bi-wx">{{ info.wxLabel }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <!-- 六爻卦象可视化 -->
      <view class="card card-mystic anim-fade-up" style="animation-delay: 0.04s">
        <HexChart :result="result" />
      </view>

      <!-- 起卦过程 -->
      <view class="card cast-card card-mystic anim-fade-up">
        <text class="ct-title">· 蓍 草 起 卦 过 程</text>
        <text class="ct-time">{{ result.divinationTimeStr }}</text>
        <view class="cp-grid">
          <view v-for="(p, i) in result.castProcess" :key="i" class="cp-step">
            <text class="cp-pos">第 {{ p.step }} 爻</text>
            <text class="cp-val">{{ p.rawNumber }}</text>
            <text class="cp-desc">{{ p.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 本卦 + 变卦 + 互卦 横向对照 -->
      <view class="gua-row">
        <!-- 本卦 -->
        <view class="card gua-card card-mystic anim-fade-up">
          <text class="gc-label">本 卦</text>
          <text class="gc-name">{{ result.benGua.name }}</text>
          <text class="gc-symbol">{{ result.benGua.symbol }}</text>
          <text class="gc-meta">
            {{ result.benGua.palaceName }} · 世在第{{ result.benGua.shiPos }}爻
          </text>
          <view class="yao-stack">
            <view v-for="(y, i) in result.benGua.yaoList" :key="i" class="yao-row">
              <text class="y-pos">{{ y.pos }}爻</text>
              <view
                class="y-line"
                :class="{
                  'y-yang': y.isYang,
                  'y-yin': !y.isYang,
                  'y-moving': y.isMoving,
                  'y-shi': y.isShi,
                  'y-ying': y.isYing,
                }"
              >
                <text v-if="y.isYang" class="y-mark">━━━━━</text>
                <text v-else class="y-mark">━ ━</text>
                <text v-if="y.isMoving" class="y-mov">· 动 ·</text>
              </view>
              <view class="y-meta">
                <text class="y-lq">{{ y.liuqin }}</text>
                <text class="y-dz">{{ y.dizhi }}</text>
              </view>
            </view>
          </view>
          <text class="gc-fortune">总评 · {{ overallFortune(result.fortunes) }}</text>
        </view>

        <!-- 变卦 -->
        <view v-if="hasMovingYao" class="card gua-card card-mystic anim-fade-up">
          <text class="gc-label">变 卦</text>
          <text class="gc-name">{{ result.bianGua.name }}</text>
          <text class="gc-symbol">{{ result.bianGua.symbol }}</text>
          <text class="gc-meta">{{ result.bianGua.reason }}</text>
          <view class="yao-stack">
            <view v-for="(y, i) in result.bianGua.yaoList" :key="i" class="yao-row">
              <text class="y-pos">{{ y.pos }}爻</text>
              <view class="y-line" :class="{ 'y-yang': y.isYang, 'y-yin': !y.isYang }">
                <text v-if="y.isYang" class="y-mark">━━━━━</text>
                <text v-else class="y-mark">━ ━</text>
              </view>
              <view class="y-meta">
                <text class="y-lq">{{ y.liuqin }}</text>
                <text class="y-dz">{{ y.dizhi }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 互卦 -->
        <view class="card gua-card card-mystic anim-fade-up">
          <text class="gc-label">互 卦</text>
          <text class="gc-name">{{ result.huGua.name }}</text>
          <text class="gc-symbol">{{ result.huGua.symbol }}</text>
          <text class="gc-meta">中段内情 · 隐微脉络</text>
          <view class="yao-stack">
            <view v-for="(y, i) in result.huGua.yaoList" :key="i" class="yao-row">
              <text class="y-pos">{{ y.pos }}爻</text>
              <view class="y-line" :class="{ 'y-yang': y.isYang, 'y-yin': !y.isYang }">
                <text v-if="y.isYang" class="y-mark">━━━━━</text>
                <text v-else class="y-mark">━ ━</text>
              </view>
              <view class="y-meta">
                <text class="y-lq">{{ y.liuqin }}</text>
                <text class="y-dz">{{ y.dizhi }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 用神 + 伏神 -->
      <view class="card yong-card card-mystic anim-fade-up">
        <text class="ct-title">· 用 神 与 伏 神</text>
        <view class="ys-block">
          <text class="ys-label">用神</text>
          <text class="ys-name">
            {{ result.yongshen.name
            }}{{
              result.yongshen.yaoPos
                ? ' · 立于第 ' + result.yongshen.yaoPos + ' 爻'
                : ' · 卦中无此用神'
            }}
          </text>
          <text class="ys-reason">{{ result.yongshen.reason }}</text>
          <view class="ys-status-row">
            <text class="ys-status" :class="`ys-status-${result.yongshen.status}`">
              {{ result.yongshen.status }}
            </text>
            <text class="ys-status-desc">{{ result.yongshen.statusDesc }}</text>
          </view>
        </view>
        <view v-if="result.fushen.length > 0" class="fs-block">
          <text class="ys-label">伏神</text>
          <view v-for="(f, i) in result.fushen" :key="i" class="fs-item">
            <text class="fs-name">{{ f.name }} · 伏于第 {{ f.yaoPos }} 爻下</text>
            <text class="fs-reason">{{ f.reason }}</text>
          </view>
        </view>
        <view v-if="!result.yongshen.found && result.fushen.length === 0" class="fs-block">
          <text class="ys-label">伏神</text>
          <text class="fs-reason">卦中虽有 {{ result.yongshen.name }}，无需借伏。</text>
        </view>
      </view>

      <!-- 流时 -->
      <view class="card liushi-card card-mystic anim-fade-up">
        <text class="ct-title">· 流 时 应 期</text>
        <view class="ls-grid">
          <view class="ls-item">
            <text class="ls-label">流 年</text>
            <text class="ls-zhi">{{ result.liushi.year.zhi }}</text>
            <text class="ls-yao">
              {{ result.liushi.year.yaoPos ? '第 ' + result.liushi.year.yaoPos + ' 爻' : '无' }}
            </text>
            <text class="ls-text">{{ result.liushi.year.text }}</text>
          </view>
          <view class="ls-item">
            <text class="ls-label">流 月</text>
            <text class="ls-zhi">{{ result.liushi.month.zhi }}</text>
            <text class="ls-yao">
              {{ result.liushi.month.yaoPos ? '第 ' + result.liushi.month.yaoPos + ' 爻' : '无' }}
            </text>
            <text class="ls-text">{{ result.liushi.month.text }}</text>
          </view>
          <view class="ls-item">
            <text class="ls-label">流 日</text>
            <text class="ls-zhi">{{ result.liushi.day.zhi }}</text>
            <text class="ls-yao">
              {{ result.liushi.day.yaoPos ? '第 ' + result.liushi.day.yaoPos + ' 爻' : '无' }}
            </text>
            <text class="ls-text">{{ result.liushi.day.text }}</text>
          </view>
          <view class="ls-item">
            <text class="ls-label">流 时</text>
            <text class="ls-zhi">{{ result.liushi.hour.zhi }}</text>
            <text class="ls-yao">
              {{ result.liushi.hour.yaoPos ? '第 ' + result.liushi.hour.yaoPos + ' 爻' : '无' }}
            </text>
            <text class="ls-text">{{ result.liushi.hour.text }}</text>
          </view>
        </view>
      </view>

      <!-- 神煞 -->
      <view class="card shensha-card card-mystic anim-fade-up">
        <text class="ct-title">· 神 煞</text>
        <view v-if="result.shensha.length === 0" class="ss-empty">本卦未触发四大主神煞</view>
        <view v-else class="ss-list">
          <view v-for="(s, i) in result.shensha" :key="i" class="ss-item">
            <text class="ss-name" :class="`ss-level-${s.level}`">{{ s.name }}</text>
            <text class="ss-yao">第 {{ s.yaoPos }} 爻</text>
            <text class="ss-desc">{{ s.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 5 维评分 -->
      <view class="card score-card card-mystic anim-fade-up">
        <text class="ct-title">· 五 维 评 分</text>
        <view class="sc-grid">
          <view v-for="(f, k) in fortuneEntries" :key="k" class="sc-item">
            <text class="sc-label">{{ f.label }}</text>
            <view class="sc-bar-bg">
              <view
                class="sc-bar"
                :class="scoreClass(f.score)"
                :style="{ width: f.score + '%' }"
              ></view>
            </view>
            <text class="sc-val" :class="scoreClass(f.score)">{{ f.score }} · {{ f.text }}</text>
          </view>
        </view>
      </view>

      <!-- 解卦建议 -->
      <view class="card advice-card card-mystic anim-fade-up">
        <text class="ct-title">· 解 卦 建 议</text>
        <view
          v-for="(a, i) in result.advice"
          :key="i"
          class="av-item"
          :class="`av-level-${a.level}`"
        >
          <text class="av-title">{{ a.title }}</text>
          <text class="av-detail">{{ a.detail }}</text>
        </view>
      </view>

      <!-- 综合解读 -->
      <view class="card summary-card card-mystic anim-fade-up">
        <text class="ct-title">· 综 合 解 读</text>
        <text class="sm-text">{{ result.summary }}</text>
        <view class="lucky-row">
          <text class="lk-item">· 吉色 · {{ result.lucky.color }}</text>
          <text class="lk-item">· 吉数 · {{ result.lucky.number }}</text>
          <text class="lk-item">· 吉方 · {{ result.lucky.direction }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="form-actions">
        <view class="btn-zhu" @click="result = null">再 起 一 卦</view>
      </view>
    </view>
    <!-- 今日已测 弹窗 -->
    <CooldownDialog
      :visible="showCooldown"
      :record="cooldownRecord"
      @close="onCooldownClose"
      @switchUser="onCooldownSwitchUser"
      @switchTool="onCooldownSwitchTool"
      @ignore="onCooldownIgnore"
    />

    <!-- 添加用户弹窗 -->
    <view v-if="showAddUser" class="add-mask" @click.self="showAddUser = false">
      <view class="add-card-mystic card-mystic anim-fade-up">
        <text class="ac-title">· 添 加 占 卜 人</text>
        <view class="ac-row">
          <text class="ac-label">姓 名</text>
          <input
            v-model="newUserName"
            class="ac-input"
            placeholder="如：张三 / 家父"
            maxlength="20"
          />
        </view>
        <view class="ac-row">
          <text class="ac-label">备 注</text>
          <input
            v-model="newUserRemark"
            class="ac-input"
            placeholder="如：自己 / 父亲 / 母亲"
            maxlength="20"
          />
        </view>
        <view class="ac-actions">
          <view class="ac-btn ac-btn-secondary" @click="showAddUser = false">取 消</view>
          <view
            class="ac-btn ac-btn-primary"
            :class="{ disabled: !newUserName.trim() }"
            @click="confirmAddUser"
          >
            添 加
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopBar from '@/shared/components/ui/TopBar.vue'
import TaijiBg from '@/shared/components/effects/TaijiBg.vue'
import CooldownDialog from '@/shared/components/ui/CooldownDialog.vue'
import UserSwitcher from '@/shared/components/ui/UserSwitcher.vue'
import HexChart from '@/components/charts/HexChart.vue'
import { useAppStore, type DivinationRecord } from '@/stores'
import { liuyaoDivinate, TOPICS, type Topic, type LiuyaoResult } from '@/utils/liuyao'

const app = useAppStore()
const topic = ref<Topic>('通用')
const result = ref<LiuyaoResult | null>(null)
const casting = ref(false)
const forceBypass = ref(false)

// 冷却相关
const showCooldown = ref(false)
const cooldownRecord = ref<DivinationRecord | null>(null)

// 添加用户
const showAddUser = ref(false)
const newUserName = ref('')
const newUserRemark = ref('')

/** 当前用户是否今日已测过 liuyao */
const currentUserLocked = computed(() => {
  if (!app.activeDivinatorKey) return false
  return !!app.checkTodayDivination(app.activeDivinatorKey, 'liuyao')
})

const hasMovingYao = computed(() => {
  if (!result.value) return false
  return result.value.castProcess.some((p) => p.rawNumber === 6 || p.rawNumber === 9)
})

const baguaList = [
  { name: '乾', nature: '天', wxLabel: '金', symbol: '☰' },
  { name: '兑', nature: '泽', wxLabel: '金', symbol: '☱' },
  { name: '离', nature: '火', wxLabel: '火', symbol: '☲' },
  { name: '震', nature: '雷', wxLabel: '木', symbol: '☳' },
  { name: '巽', nature: '风', wxLabel: '木', symbol: '☴' },
  { name: '坎', nature: '水', wxLabel: '水', symbol: '☵' },
  { name: '艮', nature: '山', wxLabel: '土', symbol: '☶' },
  { name: '坤', nature: '地', wxLabel: '土', symbol: '☷' },
]

const fortuneEntries = computed(() => {
  if (!result.value) return [] as Array<{ key: string; label: string; score: number; text: string }>
  return [
    {
      key: 'career',
      label: '事业',
      score: result.value.fortunes.career.score,
      text: result.value.fortunes.career.text,
    },
    {
      key: 'wealth',
      label: '求财',
      score: result.value.fortunes.wealth.score,
      text: result.value.fortunes.wealth.text,
    },
    {
      key: 'love',
      label: '姻缘',
      score: result.value.fortunes.love.score,
      text: result.value.fortunes.love.text,
    },
    {
      key: 'health',
      label: '健康',
      score: result.value.fortunes.health.score,
      text: result.value.fortunes.health.text,
    },
    {
      key: 'study',
      label: '学业',
      score: result.value.fortunes.study.score,
      text: result.value.fortunes.study.text,
    },
  ]
})

function overallFortune(f: LiuyaoResult['fortunes']): string {
  const scores = [f.career.score, f.wealth.score, f.love.score, f.health.score, f.study.score]
  const avg = scores.reduce((s, x) => s + x, 0) / scores.length
  if (avg >= 80) return '大吉 · 诸事顺遂'
  if (avg >= 65) return '吉 · 顺势而行'
  if (avg >= 50) return '平 · 守正待时'
  if (avg >= 35) return '小凶 · 谨言慎行'
  return '凶 · 静观其变'
}

function scoreClass(score: number): string {
  if (score >= 80) return 'sc-good'
  if (score >= 60) return 'sc-mid'
  if (score >= 40) return 'sc-warn'
  return 'sc-bad'
}

async function cast() {
  if (casting.value) return
  // 没有激活用户，先弹添加
  if (!app.activeDivinatorKey) {
    showAddUser.value = true
    return
  }
  // 检查冷却（已锁 + 没用强行的）
  if (currentUserLocked.value && !forceBypass.value) {
    cooldownRecord.value = app.checkTodayDivination(app.activeDivinatorKey, 'liuyao') || null
    showCooldown.value = true
    return
  }
  casting.value = true
  forceBypass.value = false
  // 模拟蓍草起卦过程
  await new Promise((r) => setTimeout(r, 1800))
  const r = liuyaoDivinate(topic.value, new Date())
  result.value = r
  // 提交占卜记录
  app.addDivinationRecord({
    id: `liuyao-${Date.now()}`,
    userKey: app.activeDivinatorKey,
    userName: app.activeDivinator?.name || '玄友',
    tool: 'liuyao',
    toolName: '玄枢易盘',
    brief: `${r.benGua.name}·变${r.bianGua.name}·${r.yongshen.name}${r.yongshen.status}`,
  })
  app.addHistory({
    tool: 'liuyao',
    toolName: '玄枢易盘',
    category: '占卜',
    input: { topic: topic.value, time: r.divinationTimeStr },
    output: {
      benGua: r.benGua.name,
      bianGua: r.bianGua.name,
      huGua: r.huGua.name,
      yongshen: r.yongshen.name,
      status: r.yongshen.status,
    },
    brief: `${r.benGua.name} · 变 ${r.bianGua.name} · 用神 ${r.yongshen.name}${r.yongshen.status}`,
  })
  casting.value = false
}

function onCooldownClose() {
  showCooldown.value = false
}
function onCooldownSwitchUser() {
  showCooldown.value = false
  // 弹添加用户弹窗
  showAddUser.value = true
}
function onCooldownSwitchTool() {
  showCooldown.value = false
  // 跳到首页或工具列表
  uni.reLaunch({ url: '/pages/index/index' })
}
function onCooldownIgnore() {
  showCooldown.value = false
  forceBypass.value = true
  // 直接进入
  setTimeout(() => cast(), 100)
}

function onAddUser() {
  showAddUser.value = true
}
function confirmAddUser() {
  const n = newUserName.value.trim()
  if (!n) return
  const p = app.addDivinator(n, newUserRemark.value.trim() || undefined)
  app.setActiveDivinator(p.key)
  showAddUser.value = false
  newUserName.value = ''
  newUserRemark.value = ''
  uni.showToast({ title: '已添加', icon: 'success' })
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
.topic-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--sp-2);
}
.t-btn {
  text-align: center;
  padding: var(--sp-2) 0;
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  cursor: pointer;
}
.t-btn.active {
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
  border-color: var(--color-liu);
}
.t-glyph {
  display: block;
  font-size: 36rpx;
  font-family: 'KaiTi', serif;
}
.t-name {
  display: block;
  font-size: var(--fs-xs);
  margin-top: 2rpx;
}
.form-tip {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  text-align: center;
  margin: var(--sp-3) 0;
  line-height: 1.7;
}
.tip-detail {
  display: block;
  margin-top: var(--sp-1);
  color: var(--color-bai-2);
}
.form-actions {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  align-items: center;
  margin-top: var(--sp-4);
}
.btn-zhu {
  padding: var(--sp-3) var(--sp-6);
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 320rpx;
  text-align: center;
}
.btn-zhu.disabled {
  opacity: 0.6;
}
.btn-secondary {
  padding: var(--sp-2) var(--sp-4);
  background: rgba(212, 175, 55, 0.15);
  color: var(--color-liu);
  font-size: var(--fs-sm);
  border-radius: var(--r-sm);
  letter-spacing: 0.2em;
  min-width: 240rpx;
  text-align: center;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}

.bagua-intro {
  margin-top: var(--sp-3);
  padding-top: var(--sp-3);
  border-top: 1rpx solid rgba(212, 175, 55, 0.2);
}
.bi-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-bottom: var(--sp-2);
}
.bi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-2);
}
.bi-item {
  text-align: center;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-sm);
}
.bi-symbol {
  display: block;
  font-size: 36rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
}
.bi-name {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai);
  margin-top: 2rpx;
}
.bi-wx {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}

.result {
  padding-bottom: var(--sp-4);
}
.card {
  padding: var(--sp-3);
}
.ct-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-bottom: var(--sp-2);
  letter-spacing: 0.1em;
}
.ct-time {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-bottom: var(--sp-2);
}

.cast-card .cp-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-2);
}
.cp-step {
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-sm);
  text-align: center;
}
.cp-pos {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}
.cp-val {
  display: block;
  font-size: 32rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-liu);
  font-weight: 700;
}
.cp-desc {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai);
  margin-top: 2rpx;
}

.gua-row {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.gua-card {
  padding: var(--sp-3);
}
.gc-label {
  display: block;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  letter-spacing: 0.3em;
}
.gc-name {
  display: block;
  text-align: center;
  font-size: 36rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin: var(--sp-1) 0;
}
.gc-symbol {
  display: block;
  text-align: center;
  font-size: 28rpx;
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.3;
  margin-bottom: var(--sp-2);
}
.gc-meta {
  display: block;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-bottom: var(--sp-2);
}
.gc-fortune {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-top: var(--sp-2);
  font-family: 'KaiTi', serif;
}

.yao-stack {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  margin-top: var(--sp-2);
}
.yao-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 4rpx var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: 4rpx;
}
.y-pos {
  width: 60rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}
.y-line {
  flex: 1;
  text-align: center;
  font-family: monospace;
  letter-spacing: 0.1em;
  position: relative;
}
.y-mark {
  font-size: var(--fs-md);
  color: var(--color-bai);
}
.y-mov {
  position: absolute;
  right: -10rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--fs-xs);
  color: #c8302a;
}
.y-yang {
  background: rgba(212, 175, 55, 0.05);
}
.y-yin {
  background: rgba(91, 58, 142, 0.08);
}
.y-moving {
  background: linear-gradient(90deg, rgba(200, 48, 42, 0.15), rgba(212, 175, 55, 0.1));
}
.y-shi {
  border-left: 4rpx solid #d4af37;
}
.y-ying {
  border-right: 4rpx solid #5b3a8e;
}
.y-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 80rpx;
}
.y-lq {
  font-size: var(--fs-xs);
  color: var(--color-liu);
}
.y-dz {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}

.ys-block,
.fs-block {
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-sm);
  margin-bottom: var(--sp-2);
}
.ys-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-bottom: 4rpx;
}
.ys-name {
  display: block;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: 4rpx;
}
.ys-reason {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai);
  margin-bottom: var(--sp-2);
}
.ys-status-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.ys-status {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
  font-family: 'KaiTi', serif;
}
.ys-status-旺 {
  background: rgba(79, 174, 111, 0.3);
  color: #8fd0a8;
}
.ys-status-相 {
  background: rgba(79, 174, 111, 0.2);
  color: #8fd0a8;
}
.ys-status-休 {
  background: rgba(212, 175, 55, 0.2);
  color: var(--color-liu);
}
.ys-status-囚 {
  background: rgba(200, 48, 42, 0.2);
  color: #f5c5c0;
}
.ys-status-死 {
  background: rgba(200, 48, 42, 0.3);
  color: #f5c5c0;
}
.ys-status-缺 {
  background: rgba(91, 58, 142, 0.3);
  color: #b8a8d8;
}
.ys-status-desc {
  font-size: var(--fs-xs);
  color: var(--color-bai);
  flex: 1;
}

.fs-name {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  margin-bottom: 4rpx;
}
.fs-reason {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}

.ls-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-2);
}
.ls-item {
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-sm);
}
.ls-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-bottom: 2rpx;
}
.ls-zhi {
  display: block;
  font-size: 36rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  line-height: 1.1;
}
.ls-yao {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai);
  margin-top: 2rpx;
}
.ls-text {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-top: 4rpx;
  line-height: 1.5;
}

.ss-empty {
  padding: var(--sp-3);
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}
.ss-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.ss-item {
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-sm);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--sp-2);
}
.ss-name {
  padding: 4rpx 12rpx;
  font-size: var(--fs-xs);
  border-radius: var(--r-sm);
  font-family: 'KaiTi', serif;
}
.ss-level-吉 {
  background: rgba(79, 174, 111, 0.3);
  color: #8fd0a8;
}
.ss-level-平 {
  background: rgba(212, 175, 55, 0.2);
  color: var(--color-liu);
}
.ss-level-凶 {
  background: rgba(200, 48, 42, 0.2);
  color: #f5c5c0;
}
.ss-yao {
  font-size: var(--fs-xs);
  color: var(--color-bai);
}
.ss-desc {
  flex: 1 1 100%;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  line-height: 1.6;
  margin-top: 4rpx;
}

.sc-grid {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.sc-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.sc-label {
  width: 80rpx;
  font-size: var(--fs-xs);
  color: var(--color-bai);
}
.sc-bar-bg {
  flex: 1;
  height: 12rpx;
  background: rgba(10, 10, 18, 0.6);
  border-radius: 6rpx;
  overflow: hidden;
}
.sc-bar {
  height: 100%;
  transition: width 0.5s ease;
}
.sc-good {
  background: linear-gradient(90deg, #4fae6f, #8fd0a8);
}
.sc-mid {
  background: linear-gradient(90deg, #d4af37, #e8c870);
}
.sc-warn {
  background: linear-gradient(90deg, #c8302a, #e8b870);
}
.sc-bad {
  background: linear-gradient(90deg, #8b1f1a, #c8302a);
}
.sc-val {
  width: 160rpx;
  font-size: var(--fs-xs);
  text-align: right;
  font-family: 'KaiTi', serif;
}
.sc-val.sc-good {
  color: #8fd0a8;
}
.sc-val.sc-mid {
  color: var(--color-liu);
}
.sc-val.sc-warn {
  color: #f5c5c0;
}
.sc-val.sc-bad {
  color: #f5a0a0;
}

.av-item {
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-radius: var(--r-sm);
  margin-bottom: var(--sp-2);
  border-left: 4rpx solid;
}
.av-level-high {
  border-left-color: #d4af37;
}
.av-level-mid {
  border-left-color: #5b3a8e;
}
.av-level-low {
  border-left-color: #4fae6f;
}
.av-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: 4rpx;
}
.av-detail {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai);
  line-height: 1.7;
}

.summary-card .sm-text {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.9;
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-3);
}
.lucky-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  padding-top: var(--sp-2);
  border-top: 1rpx solid rgba(212, 175, 55, 0.2);
}
.lk-item {
  font-size: var(--fs-xs);
  color: var(--color-liu);
  padding: 4rpx 12rpx;
  background: rgba(212, 175, 55, 0.1);
  border-radius: var(--r-sm);
}

.cooldown-banner {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  margin: var(--sp-2) 0;
  background: rgba(200, 48, 42, 0.1);
  border: 1rpx solid rgba(200, 48, 42, 0.3);
  border-left: 6rpx solid #c8302a;
  border-radius: var(--r-sm);
}
.cb-glyph {
  font-size: 32rpx;
}
.cb-text {
  font-size: var(--fs-sm);
  color: #f5c5c0;
  font-family: 'KaiTi', serif;
  letter-spacing: 0.05em;
}

.add-mask {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-4);
}
.add-card-mystic {
  width: 100%;
  max-width: 600rpx;
  padding: var(--sp-4);
  background: linear-gradient(180deg, rgba(20, 12, 30, 0.95), rgba(40, 20, 50, 0.95));
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  border-radius: var(--r-lg);
}
.ac-title {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-3);
}
.ac-row {
  display: flex;
  align-items: center;
  padding: var(--sp-2) var(--sp-3);
  margin-bottom: var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
}
.ac-label {
  width: 100rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}
.ac-input {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  padding: var(--sp-1) 0;
  background: transparent;
}
.ac-actions {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}
.ac-btn {
  flex: 1;
  padding: var(--sp-2);
  text-align: center;
  font-size: var(--fs-sm);
  border-radius: var(--r-md);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.1em;
}
.ac-btn-secondary {
  background: rgba(212, 175, 55, 0.15);
  color: var(--color-liu);
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}
.ac-btn-primary {
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
}
.ac-btn-primary.disabled {
  opacity: 0.5;
}
</style>
