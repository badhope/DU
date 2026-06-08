<template>
  <view class="page" :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']">
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="灵签抽签" subtitle="DIVINE LOT" />

    <view v-if="!qian" class="setup card-mystic anim-fade-up">
      <text class="form-title title-mystic">神 前 求 签</text>
      <text class="form-sub">心 诚 则 灵 · 求 签 之 道</text>

      <view class="form-section">
        <text class="form-label">· 默念所求</text>
        <input v-model="wish" class="form-inp" placeholder="如：求事业 / 求姻缘 / 求健康" />
      </view>

      <view class="form-section">
        <text class="form-label">· 摇签方式</text>
        <view class="shake-mode">
          <view v-for="m in modes" :key="m.key" class="m-btn" :class="{ active: mode === m.key }" @click="mode = m.key as Mode">
            <text class="m-glyph">{{ m.glyph }}</text>
            <text class="m-name">{{ m.name }}</text>
          </view>
        </view>
      </view>

      <view class="form-tip">
        <text>· 30 签典 · 上上/上/中上/中/中下/下/下下 · 摇签动画</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" @click="draw">求 签</view>
      </view>

      <view class="levels">
        <text class="lv-title">· 签级分布</text>
        <view class="lv-grid">
          <text v-for="lv in levels" :key="lv.name" class="lv-tag" :style="{ background: lv.color }">
            {{ lv.name }} {{ countByLevel[lv.name] || 0 }}
          </text>
        </view>
      </view>
    </view>

    <view v-else class="result">
      <!-- 签筒摇签动画 -->
      <view v-if="drawing" class="shaking card-mystic anim-fade-up">
        <view class="barrel">
          <text v-for="i in 8" :key="i" class="barrel-strip" :style="{ transform: `rotate(${i * 45}deg)` }"></text>
          <text class="barrel-qian" :class="{ spin: true }">{{ qianLevelIcon(qian) }}</text>
        </view>
        <text class="shaking-text">摇 签 中 …</text>
      </view>

      <view v-else class="qian-card card-mystic anim-fade-up">
        <view class="qian-head" :style="{ background: levelColor(qian.level) }">
          <text class="qian-num">第 {{ qian.num }} 签</text>
          <text class="qian-level" :style="{ borderColor: levelTextColor(qian.level) }">{{ qian.level }}</text>
        </view>
        <view class="qian-body">
          <text class="qian-title">{{ qian.title }}</text>
          <view class="qian-poem">
            <text v-for="(line, i) in qian.poem.split(/[，。]/)" :key="i" v-show="line" class="poem-line">{{ line.trim() }}{{ i < qian.poem.split(/[，。]/).length - 1 ? (i % 2 === 0 ? '，' : '。') : '' }}</text>
          </view>
          <text class="qian-inter">· 解：{{ qian.interpretation }}</text>

          <view class="qian-tags">
            <text class="qian-tag wx">五行 · {{ qian.fiveEl }}</text>
            <text class="qian-tag cat">类 · {{ qian.category }}</text>
          </view>

          <view class="qian-yiji">
            <view class="yj-col">
              <text class="yj-label good">· 宜</text>
              <view class="yj-tags">
                <text v-for="(g, i) in qian.good" :key="i" class="yj-tag good">{{ g }}</text>
              </view>
            </view>
            <view class="yj-col">
              <text class="yj-label bad">· 忌</text>
              <view class="yj-tags">
                <text v-for="(b, i) in qian.bad" :key="i" class="yj-tag bad">{{ b }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!drawing" class="form-actions">
        <view class="btn-zhu" @click="qian = null">再 求 一 签</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import { drawQian, QIAN_DB, type Qian, type QianLevel } from '@/utils/lingqian'

const app = useAppStore()

type Mode = 'shouy' | 'yao' | 'qiuqian'
const mode = ref<Mode>('yao')
const wish = ref('')
const qian = ref<Qian | null>(null)
const drawing = ref(false)

const modes = [
  { key: 'shouy', name: '手摇', glyph: '摇' },
  { key: 'yao', name: '摇动', glyph: '动' },
  { key: 'qiuqian', name: '求签', glyph: '签' },
]

const levels: Array<{ name: QianLevel, color: string }> = [
  { name: '上上', color: 'linear-gradient(135deg, #FFD700, #C8302A)' },
  { name: '上',   color: 'linear-gradient(135deg, #D4AF37, #8B6F47)' },
  { name: '中上', color: 'linear-gradient(135deg, #5B3A8E, #1B3A5C)' },
  { name: '中',   color: 'linear-gradient(135deg, #1B3A5C, #4FAE6F)' },
  { name: '中下', color: 'linear-gradient(135deg, #4FAE6F, #1F4E4A)' },
  { name: '下',   color: 'linear-gradient(135deg, #8B6F47, #5B3A8E)' },
  { name: '下下', color: 'linear-gradient(135deg, #1B3A5C, #000)' },
]

const countByLevel = computed(() => {
  const m: Record<string, number> = {}
  QIAN_DB.forEach(q => { m[q.level] = (m[q.level] || 0) + 1 })
  return m
})

function levelColor(l: QianLevel) {
  return levels.find(x => x.name === l)?.color || '#1B3A5C'
}

const ICON_MAP: Record<string, string> = {
  '上上': '☀', '上': '☂', '中上': '✦', '中': '☁', '中下': '☂', '下': '☃', '下下': '✕',
  '金': '⚝', '木': '☘', '水': '☵', '火': '☲', '土': '☷',
}
function qianLevelIcon(q: Qian) {
  return ICON_MAP[q.level] || ICON_MAP[q.fiveEl] || '卦'
}
function levelTextColor(l: QianLevel) {
  return l === '中' ? '#000' : '#fff'
}

async function draw() {
  // 引导：心诚则灵。所求 1-30 字
  const w = wish.value.trim()
  if (w.length === 0) { uni.showToast({ title: '请默念所求之事', icon: 'none' }); return }
  if (w.length > 30) { uni.showToast({ title: '所求文字不超过 30 字', icon: 'none' }); return }
  drawing.value = true
  await new Promise(r => setTimeout(r, 2000))
  try {
    qian.value = drawQian(w + Date.now())
    drawing.value = false
    app.addHistory({ tool: 'lingqian', toolName: '灵签抽签', category: '占卜', input: { wish: w, mode: mode.value }, output: { num: qian.value.num, level: qian.value.level }, brief: `第${qian.value.num}签 · ${qian.value.level} · ${qian.value.title}` })
  } catch (e) {
    drawing.value = false
    uni.showModal({ title: '抽签失败', content: '请重新抽签', showCancel: false })
  }
}
</script>

<style scoped>
.page { min-height: 100vh; padding-bottom: var(--sp-6); }
.setup, .result { display: flex; flex-direction: column; gap: var(--sp-3); margin: 0 var(--sp-2); margin-top: var(--sp-2); }
.setup { padding: var(--sp-4); }
.form-title { display: block; text-align: center; font-size: var(--fs-md); letter-spacing: 0.2em; margin-bottom: var(--sp-2); }
.form-sub { display: block; text-align: center; font-size: var(--fs-sm); color: var(--color-bai-2); margin-bottom: var(--sp-4); }
.form-section { margin: var(--sp-3) 0; }
.form-label { display: block; font-size: var(--fs-sm); color: var(--color-liu); margin-bottom: var(--sp-2); }
.form-inp { width: 100%; padding: var(--sp-2) var(--sp-3); background: rgba(10, 10, 18, 0.6); color: var(--color-bai); font-size: var(--fs-sm); border-radius: var(--r-sm); border: 1rpx solid rgba(212, 175, 55, 0.2); }
.shake-mode { display: flex; gap: var(--sp-2); }
.m-btn { flex: 1; text-align: center; padding: var(--sp-3) 0; background: rgba(10, 10, 18, 0.5); border: 1rpx solid rgba(212, 175, 55, 0.2); border-radius: var(--r-sm); cursor: pointer; }
.m-btn.active { background: linear-gradient(135deg, #8B1F1A, #D4AF37); color: var(--color-bai); border-color: var(--color-liu); }
.m-glyph { display: block; font-size: 40rpx; font-family: 'KaiTi', serif; }
.m-name { display: block; font-size: var(--fs-xs); margin-top: 2rpx; }
.form-tip { font-size: var(--fs-xs); color: var(--color-bai-3); text-align: center; margin: var(--sp-2) 0; }
.form-actions { display: flex; justify-content: center; margin-top: var(--sp-4); }
.btn-zhu { padding: var(--sp-3) var(--sp-6); background: linear-gradient(135deg, #8B1F1A, #D4AF37); color: var(--color-bai); font-size: var(--fs-md); border-radius: var(--r-md); letter-spacing: 0.2em; min-width: 320rpx; text-align: center; }

.levels { margin-top: var(--sp-3); padding-top: var(--sp-3); border-top: 1rpx solid rgba(212, 175, 55, 0.2); }
.lv-title { display: block; font-size: var(--fs-sm); color: var(--color-liu); margin-bottom: var(--sp-2); }
.lv-grid { display: flex; flex-wrap: wrap; gap: 6rpx; }
.lv-tag { padding: 4rpx 12rpx; font-size: var(--fs-xs); color: var(--color-bai); border-radius: var(--r-sm); }

.shaking { padding: var(--sp-5); text-align: center; }
.barrel { width: 240rpx; height: 240rpx; margin: 0 auto; position: relative; border-radius: 50%; background: linear-gradient(135deg, #8B6F47, #5B3A8E); box-shadow: 0 0 60rpx rgba(212, 175, 55, 0.4); animation: spin 1.5s linear infinite; }
.barrel-strip { position: absolute; top: 50%; left: 50%; width: 4rpx; height: 100rpx; margin-left: -2rpx; margin-top: -50rpx; background: var(--color-liu); transform-origin: 50% 50%; }
.barrel-qian { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 80rpx; font-family: 'KaiTi', serif; color: var(--color-liu); }
.barrel-qian.spin { animation: counter-spin 1.5s linear infinite; }
@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
@keyframes counter-spin { from { transform: translate(-50%, -50%) rotate(0); } to { transform: translate(-50%, -50%) rotate(-360deg); } }
.shaking-text { display: block; text-align: center; font-size: var(--fs-md); color: var(--color-liu); margin-top: var(--sp-4); font-family: 'KaiTi', serif; letter-spacing: 0.3em; }

.qian-card { padding: 0; overflow: hidden; }
.qian-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-3) var(--sp-4);
  color: var(--color-bai);
}
.qian-num { font-size: var(--fs-md); font-family: 'KaiTi', serif; font-weight: 700; text-shadow: 0 0 8rpx rgba(0, 0, 0, 0.4); }
.qian-level { padding: 6rpx 16rpx; border: 1rpx solid; border-radius: var(--r-sm); font-size: var(--fs-sm); }
.qian-body { padding: var(--sp-4); }
.qian-title { display: block; text-align: center; font-size: 60rpx; color: var(--color-liu); font-family: 'KaiTi', serif; font-weight: 700; margin-bottom: var(--sp-3); }
.qian-poem { display: flex; flex-direction: column; align-items: center; margin: var(--sp-3) 0; padding: var(--sp-3); background: rgba(10, 10, 18, 0.5); border-radius: var(--r-sm); }
.poem-line { display: block; font-size: var(--fs-md); color: var(--color-bai); font-family: 'KaiTi', serif; line-height: 1.7; letter-spacing: 0.15em; }
.qian-inter { display: block; text-align: center; font-size: var(--fs-sm); color: var(--color-bai); margin: var(--sp-3) 0; line-height: 1.7; font-family: 'KaiTi', serif; }
.qian-tags { display: flex; justify-content: center; gap: var(--sp-2); margin: var(--sp-3) 0; }
.qian-tag { padding: 4rpx 12rpx; font-size: var(--fs-xs); border-radius: var(--r-sm); background: rgba(212, 175, 55, 0.2); color: var(--color-liu); }
.qian-yiji { margin: var(--sp-3) 0; }
.yj-col { display: flex; flex-direction: column; gap: 4rpx; margin: var(--sp-2) 0; }
.yj-label { font-size: var(--fs-sm); font-weight: 600; }
.yj-label.good { color: #4FAE6F; }
.yj-label.bad { color: #C8302A; }
.yj-tags { display: flex; flex-wrap: wrap; gap: 4rpx; }
.yj-tag { padding: 4rpx 12rpx; font-size: var(--fs-xs); border-radius: var(--r-sm); }
.yj-tag.good { background: rgba(79, 174, 111, 0.2); color: #8FD0A8; }
.yj-tag.bad { background: rgba(200, 48, 42, 0.2); color: #F5C5C0; }
</style>
