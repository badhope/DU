<template>
  <view class="hhc">
    <view class="hhc-header card-mystic">
      <text class="b-title title-mystic">合 婚 总 评</text>
      <view class="score-block">
        <text class="sb-num" :style="{ color: scoreColor }">{{ result.score.total }}</text>
        <text class="sb-lvl" :style="{ color: scoreColor }">{{ result.score.level }}</text>
      </view>
      <text class="brief">{{ result.score.brief }}</text>
    </view>

    <!-- 双盘对比 -->
    <view class="hhc-pair card-mystic">
      <text class="b-title title-mystic">双 方 八 字 对 比</text>
      <view class="pair-row">
        <view class="p-side">
          <text class="ps-name">{{ result.man.name }}</text>
          <view class="ps-bz">
            <text class="psb-gan" :style="{ color: wuColor(ganWx(result.man.bazi.day.gan)) }">
              {{ result.man.bazi.day.gan }}
            </text>
            <text class="psb-zhi" :style="{ color: wuColor(zhiWx(result.man.bazi.day.zhi)) }">
              {{ result.man.bazi.day.zhi }}
            </text>
          </view>
          <text class="ps-meta">{{ result.man.dayMaster }}（{{ result.man.strength }}）</text>
          <text class="ps-ny">年命 {{ result.man.nayin }}</text>
        </view>
        <view class="p-vs">
          <text class="vs-icon">⚭</text>
          <text class="vs-text">合</text>
        </view>
        <view class="p-side">
          <text class="ps-name">{{ result.woman.name }}</text>
          <view class="ps-bz">
            <text class="psb-gan" :style="{ color: wuColor(ganWx(result.woman.bazi.day.gan)) }">
              {{ result.woman.bazi.day.gan }}
            </text>
            <text class="psb-zhi" :style="{ color: wuColor(zhiWx(result.woman.bazi.day.zhi)) }">
              {{ result.woman.bazi.day.zhi }}
            </text>
          </view>
          <text class="ps-meta">{{ result.woman.dayMaster }}（{{ result.woman.strength }}）</text>
          <text class="ps-ny">年命 {{ result.woman.nayin }}</text>
        </view>
      </view>
    </view>

    <!-- 各项打分 -->
    <view class="hhc-dim card-mystic">
      <text class="b-title title-mystic">四 维 配 对</text>
      <view class="dim-row">
        <view v-for="(d, i) in dimList" :key="i" class="dim-cell">
          <text class="dc-name">{{ d.name }}</text>
          <view class="dc-bar">
            <view class="dc-fill" :style="{ width: d.val + '%', background: d.color }" />
          </view>
          <text class="dc-val" :style="{ color: d.color }">{{ d.val }}</text>
        </view>
      </view>
    </view>

    <!-- 关系详情 -->
    <view class="hhc-rels card-mystic">
      <text class="b-title title-mystic">关 系 解 读</text>
      <view v-for="(r, i) in relList" :key="i" class="rel-row">
        <view class="rr-head">
          <text class="rrh-label">{{ r.label }}</text>
          <text class="rrh-type" :style="{ color: r.color }">{{ r.relation }}</text>
        </view>
        <text class="rr-desc">{{ r.desc }}</text>
      </view>
    </view>

    <!-- 五行互补 -->
    <view class="hhc-wx card-mystic">
      <text class="b-title title-mystic">五 行 共 振</text>
      <view v-for="(w, i) in wxList" :key="i" class="wx-row">
        <text class="wr-name" :style="{ color: w.color }">{{ w.name }}</text>
        <view class="wr-bars">
          <view class="wr-bar wr-bar-man">
            <view class="wr-fill" :style="{ width: w.manPct + '%', background: w.color }" />
            <text class="wr-val">{{ w.man }}</text>
          </view>
          <view class="wr-bar wr-bar-woman">
            <view class="wr-fill" :style="{ width: w.womanPct + '%', background: w.color }" />
            <text class="wr-val">{{ w.woman }}</text>
          </view>
        </view>
        <text class="wr-sum">{{ w.man + w.woman }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HehunResult } from '@mingli/logic/hehun'
import { TIANGAN_WUXING, DIZHI_WUXING, type TianGan, type DiZhi } from '@mingli/logic/bazi'
import { WUXING_META, type Wuxing } from '@mingli/logic/wuxing'
import { levelColor } from '@guanxiang/logic/chart-utils'

const props = defineProps<{ result: HehunResult }>()

const ganWx = (g: TianGan) => TIANGAN_WUXING[g]
const zhiWx = (z: DiZhi) => DIZHI_WUXING[z]
const wuColor = (wx: Wuxing) => WUXING_META[wx].color

const scoreColor = computed(() => levelColor(props.result.score.level))

const dimList = computed(() => [
  { name: '年命', val: props.result.score.year, color: '#D4AF37' },
  { name: '日柱', val: props.result.score.day, color: '#C8302A' },
  { name: '五行', val: props.result.score.wuxing, color: '#2F7D4F' },
  { name: '强弱', val: props.result.score.strength, color: '#5B3A8E' },
])

const relList = computed(() => {
  const relMap: Record<string, string> = {
    合: '#D4AF37',
    比和: '#B8B2A0',
    相生: '#2F7D4F',
    相克: '#C8302A',
    六合: '#D4AF37',
    六冲: '#C8302A',
    六害: '#8B1F1A',
    三合: '#5B3A8E',
    天干合: '#D4AF37',
    无特殊: '#6B6655',
  }
  const getC = (r: string) => relMap[r] || '#B8B2A0'
  return [
    {
      label: '年命纳音',
      relation: props.result.yearNayin.relation,
      desc: props.result.yearNayin.desc,
      color: getC(props.result.yearNayin.relation),
    },
    {
      label: '日柱地支',
      relation: props.result.dayZhi.relation,
      desc: props.result.dayZhi.desc,
      color: getC(props.result.dayZhi.relation),
    },
    {
      label: '日柱天干',
      relation: props.result.dayGan.relation,
      desc: props.result.dayGan.desc,
      color: getC(props.result.dayGan.relation),
    },
  ]
})

const wxList = computed(() => {
  const WX_NAMES: Record<Wuxing, string> = { mu: '木', huo: '火', tu: '土', jin: '金', shui: '水' }
  const WX_KEYS: Wuxing[] = ['mu', 'huo', 'tu', 'jin', 'shui']
  const m = props.result.wuxing.man
  const w = props.result.wuxing.woman
  const mMax = Math.max(...Object.values(m), 1)
  const wMax = Math.max(...Object.values(w), 1)
  return WX_KEYS.map((k) => ({
    name: WX_NAMES[k],
    color: WUXING_META[k].color,
    man: m[k] || 0,
    woman: w[k] || 0,
    manPct: ((m[k] || 0) / mMax) * 100,
    womanPct: ((w[k] || 0) / wMax) * 100,
  }))
})
</script>

<style scoped>
.hhc {
  padding: 8rpx;
}
.hhc-header,
.hhc-pair,
.hhc-dim,
.hhc-rels,
.hhc-wx {
  margin-bottom: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
}
.b-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-bai, #f5f1e8);
  margin-bottom: 16rpx;
  font-family: serif;
}
.score-block {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  padding: 8rpx 0;
}
.sb-num {
  font-size: 80rpx;
  font-weight: bold;
  line-height: 1;
  font-family: serif;
}
.sb-lvl {
  font-size: 32rpx;
  font-weight: bold;
  font-family: serif;
}
.brief {
  display: block;
  padding-top: 8rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--color-bai-2, #b8b2a0);
}
.pair-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.p-side {
  flex: 1;
  padding: 16rpx;
  background: rgba(10, 10, 18, 0.5);
  border-radius: 12rpx;
  text-align: center;
}
.ps-name {
  display: block;
  font-size: 24rpx;
  color: var(--color-bai, #f5f1e8);
  font-weight: bold;
}
.ps-bz {
  padding: 12rpx 0;
}
.psb-gan,
.psb-zhi {
  display: block;
  font-size: 56rpx;
  font-weight: bold;
  font-family: serif;
  line-height: 1.1;
}
.ps-meta {
  display: block;
  font-size: 20rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.ps-ny {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-3, #6b6655);
  margin-top: 4rpx;
}
.p-vs {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.vs-icon {
  font-size: 60rpx;
  color: var(--color-liu, #d4af37);
}
.vs-text {
  font-size: 22rpx;
  color: var(--color-liu, #d4af37);
  margin-top: 4rpx;
}
.dim-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.dim-cell {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.dc-name {
  width: 100rpx;
  font-size: 26rpx;
  color: var(--color-bai, #f5f1e8);
}
.dc-bar {
  flex: 1;
  height: 14rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 7rpx;
  overflow: hidden;
}
.dc-fill {
  height: 100%;
  border-radius: 7rpx;
  transition: width 0.8s;
}
.dc-val {
  width: 60rpx;
  text-align: right;
  font-size: 26rpx;
  font-weight: bold;
  font-family: serif;
}
.rel-row {
  padding: 12rpx 0;
  border-bottom: 1rpx dashed rgba(212, 175, 55, 0.1);
}
.rel-row:last-child {
  border-bottom: none;
}
.rr-head {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 4rpx;
}
.rrh-label {
  font-size: 24rpx;
  color: var(--color-bai-2, #b8b2a0);
}
.rrh-type {
  font-size: 26rpx;
  font-weight: bold;
  font-family: serif;
}
.rr-desc {
  display: block;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--color-bai, #f5f1e8);
  padding-left: 4rpx;
}
.wx-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 6rpx 0;
}
.wr-name {
  width: 60rpx;
  font-size: 26rpx;
  font-weight: bold;
  font-family: serif;
}
.wr-bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.wr-bar {
  position: relative;
  height: 12rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6rpx;
}
.wr-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.6s;
}
.wr-val {
  position: absolute;
  right: 4rpx;
  top: -2rpx;
  font-size: 18rpx;
  color: var(--color-bai, #f5f1e8);
  font-weight: bold;
  font-family: serif;
}
.wr-sum {
  width: 60rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: bold;
  color: var(--color-liu, #d4af37);
  font-family: serif;
}
</style>
