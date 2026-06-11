<template>
  <view class="bm-container">
    <!-- 视图切换：正/背 -->
    <view class="side-bar">
      <view class="side-btn" :class="{ active: side === 'front' }" @click="side = 'front'">
        <text class="side-glyph">正</text>
        <text class="side-label">正 面</text>
      </view>
      <view class="side-btn" :class="{ active: side === 'back' }" @click="side = 'back'">
        <text class="side-glyph">背</text>
        <text class="side-label">背 面</text>
      </view>
    </view>

    <!-- 经脉类型筛选 -->
    <view class="filter-bar">
      <view
        class="f-btn"
        :class="{ active: !showQi && !showYin && !showYang }"
        @click="resetFilter"
      >
        全 部
      </view>
      <view class="f-btn f-qi" :class="{ active: showQi }" @click="toggleQi">8 奇 经</view>
      <view class="f-btn f-yin" :class="{ active: showYin }" @click="toggleYin">阴 经</view>
      <view class="f-btn f-yang" :class="{ active: showYang }" @click="toggleYang">阳 经</view>
    </view>

    <!-- SVG 人体图 -->
    <view class="bm-svg-wrap">
      <svg
        class="bm-svg"
        :viewBox="`0 0 500 800`"
        preserveAspectRatio="xMidYMid meet"
        @click="onSvgClick"
      >
        <!-- 背景渐变 -->
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stop-color="rgba(212,175,55,0.18)" />
            <stop offset="80%" stop-color="rgba(10,10,18,0.7)" />
            <stop offset="100%" stop-color="rgba(0,0,0,0.9)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- 背景 -->
        <rect x="0" y="0" width="500" height="800" fill="url(#bodyGrad)" />

        <!-- 人体轮廓 -->
        <path
          :d="side === 'front' ? bodyOutlineFront : bodyOutlineBack"
          fill="rgba(91,58,142,0.15)"
          stroke="rgba(212,175,55,0.5)"
          stroke-width="1.5"
        />
        <!-- 四肢 -->
        <path
          :d="bodyLimbs"
          fill="rgba(91,58,142,0.15)"
          stroke="rgba(212,175,55,0.5)"
          stroke-width="1.5"
        />

        <!-- 头颈分隔线（中央十字） -->
        <line
          x1="190"
          y1="40"
          x2="190"
          y2="780"
          stroke="rgba(212,175,55,0.15)"
          stroke-width="0.5"
          stroke-dasharray="4 4"
        />
        <!-- 肩/腰线 -->
        <line
          x1="130"
          y1="230"
          x2="280"
          y2="230"
          stroke="rgba(212,175,55,0.1)"
          stroke-width="0.5"
        />
        <line
          x1="135"
          y1="500"
          x2="265"
          y2="500"
          stroke="rgba(212,175,55,0.1)"
          stroke-width="0.5"
        />

        <!-- 经络线 -->
        <g v-for="m in visibleMeridians" :key="m.id" class="meridian-group">
          <path
            :d="pointsToPathD(m.path)"
            :stroke="m.color"
            :stroke-width="isSelected(m.id) ? 4 : 1.8"
            :opacity="isSelected(m.id) ? 1 : selectedId ? 0.18 : 0.7"
            fill="none"
            :filter="isSelected(m.id) ? 'url(#strongGlow)' : 'url(#glow)'"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="cursor: pointer"
            @click.stop="onMeridianClick(m)"
          />
          <!-- 标签 -->
          <text
            v-if="isSelected(m.id) || !selectedId"
            :x="m.labelAt.x"
            :y="m.labelAt.y"
            :fill="m.color"
            font-size="14"
            font-family="KaiTi, STKaiti, serif"
            font-weight="700"
            :opacity="isSelected(m.id) ? 1 : 0.85"
            style="user-select: none; pointer-events: none"
            text-anchor="middle"
          >
            {{ m.name }}
          </text>

          <!-- 穴位点 -->
          <g v-if="isSelected(m.id) || showAllPoints">
            <circle
              v-for="(p, i) in m.acupoints"
              :key="i"
              :cx="p.x"
              :cy="p.y"
              :r="isSelected(m.id) ? 5 : 3"
              :fill="m.color"
              :stroke="'#FFF'"
              :stroke-width="isSelected(m.id) ? 1.5 : 0.8"
              :opacity="isSelected(m.id) ? 1 : 0.7"
              style="cursor: pointer"
              @click.stop="onAcupointClick(m, p)"
            />
            <template v-if="isSelected(m.id)">
              <text
                v-for="(p, i) in m.acupoints"
                :key="`t-${i}`"
                :x="p.x + 8"
                :y="p.y - 4"
                fill="#FFF"
                font-size="10"
                font-family="KaiTi, STKaiti, serif"
                style="user-select: none; pointer-events: none"
              >
                {{ p.acupoint }}
              </text>
            </template>
          </g>
        </g>
      </svg>

      <!-- 缩放控件 -->
      <view class="zoom-bar">
        <view class="z-btn" @click="zoom = Math.max(0.6, zoom - 0.1)">−</view>
        <text class="z-val">{{ Math.round(zoom * 100) }}%</text>
        <view class="z-btn" @click="zoom = Math.min(1.4, zoom + 0.1)">+</view>
        <view class="z-btn z-reset" @click="zoom = 1">重 置</view>
      </view>
    </view>

    <!-- 经络选择列表 -->
    <view class="meridian-list">
      <text class="ml-title">· {{ side === 'front' ? '正 面' : '背 面' }} 经 络 选 择</text>
      <view class="ml-grid">
        <view
          v-for="m in visibleMeridians"
          :key="m.id"
          class="ml-item"
          :class="{ active: isSelected(m.id) }"
          :style="{ borderColor: m.color, background: isSelected(m.id) ? m.color + '33' : '' }"
          @click="onMeridianClick(m)"
        >
          <view class="ml-dot" :style="{ background: m.color }"></view>
          <text class="ml-name">{{ m.name }}</text>
        </view>
      </view>
    </view>

    <!-- 详情弹窗 -->
    <view v-if="selectedMeridian" class="detail-mask" @click.self="closeDetail">
      <view class="detail-card card-mystic anim-fade-up">
        <view class="dc-header" :style="{ borderBottomColor: selectedMeridian.color }">
          <view
            class="dc-glyph"
            :style="{
              color: selectedMeridian.color,
              textShadow: `0 0 20rpx ${selectedMeridian.color}`,
            }"
          >
            ☯
          </view>
          <view class="dc-info">
            <text class="dc-name" :style="{ color: selectedMeridian.color }">
              {{ selectedMeridian.name }}
            </text>
            <text class="dc-side">
              {{ side === 'front' ? '正 面' : '背 面' }} ·
              {{
                selectedMeridian.category === 'yin'
                  ? '阴经'
                  : selectedMeridian.category === 'yang'
                    ? '阳经'
                    : '奇经'
              }}
            </text>
          </view>
        </view>

        <view class="dc-stats">
          <view class="dc-stat">
            <text class="dc-stat-num">{{ selectedMeridian.acupoints.length }}</text>
            <text class="dc-stat-label">主穴</text>
          </view>
          <view class="dc-stat">
            <text class="dc-stat-num">{{ selectedMeridian.path.length }}</text>
            <text class="dc-stat-label">路径点</text>
          </view>
        </view>

        <text class="dc-section">· 穴 位 列 表</text>
        <view class="acupoint-list">
          <view
            v-for="(p, i) in selectedMeridian.acupoints"
            :key="i"
            class="al-item"
            :class="{ hit: selectedAcupoint?.acupoint === p.acupoint }"
            :style="{ borderLeftColor: selectedMeridian.color }"
            @click="onAcupointClick(selectedMeridian!, p)"
          >
            <view class="al-dot" :style="{ background: selectedMeridian.color }"></view>
            <text class="al-name">{{ p.acupoint }}</text>
            <text class="al-coord">({{ p.x }}, {{ p.y }})</text>
          </view>
        </view>

        <!-- 穴位详情 -->
        <view v-if="acupointDetail" class="ac-detail">
          <text class="ad-title">· {{ acupointDetail.name }} · 详 情</text>
          <view class="ad-row">
            <text class="ad-label">所属经脉：</text
            ><text class="ad-val">{{ acupointDetail.jingluo }}</text>
          </view>
          <view class="ad-row">
            <text class="ad-label">位 置：</text
            ><text class="ad-val">{{ acupointDetail.location }}</text>
          </view>
          <view class="ad-row">
            <text class="ad-label">功 能：</text
            ><text class="ad-val">{{ acupointDetail.function }}</text>
          </view>
          <view class="ad-row">
            <text class="ad-label">主 治：</text
            ><text class="ad-val">{{ acupointDetail.indication.join(' · ') }}</text>
          </view>
          <view class="ad-row">
            <text class="ad-label">方 法：</text
            ><text class="ad-val">{{ acupointDetail.method }}</text>
          </view>
        </view>

        <view class="dc-actions">
          <view class="dc-btn dc-btn-primary" @click="closeDetail">关 闭</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  MERIDIAN_PATHS,
  QIJING_PATHS,
  BODY_OUTLINE_FRONT,
  BODY_OUTLINE_BACK,
  BODY_LIMBS_FRONT,
  BODY_LIMBS_BACK,
  pointsToPathD,
  type MeridianPath,
  type Point,
} from '@modules/jiankang/data/meridian-data'
import { getAcupoint, type Acupoint } from '@modules/jiankang/logic/jingluo'

const props = defineProps<{
  initialSide?: 'front' | 'back'
  initialShowAll?: boolean
  initialMeridians?: string[] // 初始要显示的经络 id 列表（空=全部）
}>()

const side = ref<'front' | 'back'>(props.initialSide || 'front')
const zoom = ref(1)
const selectedId = ref<string | null>(null)
const selectedAcupoint = ref<Point | null>(null)
const acupointDetail = ref<Acupoint | null>(null)

// 过滤器
const showQi = ref(false)
const showYin = ref(false)
const showYang = ref(false)
const showAllPoints = ref(true)

const bodyOutlineFront = BODY_OUTLINE_FRONT
const bodyOutlineBack = BODY_OUTLINE_BACK
const bodyLimbs = computed(() => (side.value === 'front' ? BODY_LIMBS_FRONT : BODY_LIMBS_BACK))

/** 当前视图下的所有经络 */
const currentMeridians = computed(() => {
  const all = [...MERIDIAN_PATHS, ...QIJING_PATHS]
  return all.filter((m) => m.side === side.value)
})

/** 经过滤显示的经络 */
const visibleMeridians = computed(() => {
  let list = currentMeridians.value
  // 初始只显示选中
  if (
    props.initialMeridians &&
    props.initialMeridians.length > 0 &&
    !showQi.value &&
    !showYin.value &&
    !showYang.value &&
    !selectedId.value
  ) {
    list = list.filter((m) => props.initialMeridians!.includes(m.id))
  }
  if (showQi.value) list = list.filter((m) => m.category === 'qi')
  if (showYin.value) list = list.filter((m) => m.category === 'yin')
  if (showYang.value) list = list.filter((m) => m.category === 'yang')
  return list
})

const selectedMeridian = computed<MeridianPath | null>(() => {
  if (!selectedId.value) return null
  return [...MERIDIAN_PATHS, ...QIJING_PATHS].find((m) => m.id === selectedId.value) || null
})

function isSelected(id: string) {
  return selectedId.value === id
}

function onMeridianClick(m: MeridianPath) {
  if (selectedId.value === m.id) {
    selectedId.value = null
    selectedAcupoint.value = null
    acupointDetail.value = null
  } else {
    selectedId.value = m.id
    selectedAcupoint.value = null
    acupointDetail.value = null
  }
}

function onAcupointClick(m: MeridianPath, p: Point) {
  selectedId.value = m.id
  selectedAcupoint.value = p
  acupointDetail.value = getAcupoint(p.acupoint || '')
}

function onSvgClick() {
  // 点击空白处不关闭（已选中可点空白看其他）
}

function closeDetail() {
  selectedId.value = null
  selectedAcupoint.value = null
  acupointDetail.value = null
}

function toggleQi() {
  showQi.value = !showQi.value
  showYin.value = false
  showYang.value = false
}
function toggleYin() {
  showYin.value = !showYin.value
  showQi.value = false
  showYang.value = false
}
function toggleYang() {
  showYang.value = !showYang.value
  showQi.value = false
  showYin.value = false
}
function resetFilter() {
  showQi.value = false
  showYin.value = false
  showYang.value = false
  selectedId.value = null
}
</script>

<style scoped>
.bm-container {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-2);
}

/* 视图切换 */
.side-bar {
  display: flex;
  gap: var(--sp-2);
}
.side-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  cursor: pointer;
}
.side-btn.active {
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  border-color: var(--color-liu);
  color: var(--color-bai);
}
.side-glyph {
  font-size: 28rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.side-label {
  font-size: var(--fs-sm);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.1em;
}

/* 过滤器 */
.filter-bar {
  display: flex;
  gap: 4rpx;
  padding: 4rpx;
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
}
.f-btn {
  flex: 1;
  text-align: center;
  padding: 8rpx 0;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  border-radius: 4rpx;
  cursor: pointer;
}
.f-btn.active {
  color: var(--color-bai);
}
.f-qi.active {
  background: linear-gradient(135deg, #9b59b6, #c8302a);
}
.f-yin.active {
  background: linear-gradient(135deg, #5b8ecc, #5b3a8e);
}
.f-yang.active {
  background: linear-gradient(135deg, #e8a03e, #c8302a);
}

/* SVG */
.bm-svg-wrap {
  position: relative;
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  padding: var(--sp-2);
  overflow: hidden;
}
.bm-svg {
  width: 100%;
  height: 1000rpx;
  display: block;
  transform: scale(v-bind(zoom));
  transform-origin: center top;
  transition: transform 0.2s;
}

.zoom-bar {
  display: flex;
  align-items: center;
  gap: 4rpx;
  margin-top: var(--sp-2);
  padding-top: var(--sp-2);
  border-top: 1rpx solid rgba(212, 175, 55, 0.15);
}
.z-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 175, 55, 0.15);
  color: var(--color-liu);
  font-size: 24rpx;
  border-radius: var(--r-sm);
  cursor: pointer;
}
.z-btn.z-reset {
  width: auto;
  padding: 0 16rpx;
  font-size: var(--fs-xs);
}
.z-val {
  flex: 1;
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}

/* 经络选择列表 */
.meridian-list {
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
}
.ml-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.15em;
  margin-bottom: var(--sp-2);
}
.ml-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
}
.ml-item {
  display: inline-flex;
  align-items: center;
  gap: 4rpx;
  padding: 4rpx 12rpx;
  background: rgba(20, 20, 28, 0.5);
  border: 1rpx solid;
  border-radius: 4rpx;
  cursor: pointer;
}
.ml-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
}
.ml-name {
  font-size: var(--fs-xs);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
}

/* 详情弹窗 */
.detail-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-4);
}
.detail-card {
  width: 100%;
  max-width: 700rpx;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--sp-4);
  background: linear-gradient(180deg, rgba(20, 12, 30, 0.95), rgba(40, 20, 50, 0.95));
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  border-radius: var(--r-lg);
}
.dc-header {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
  padding-bottom: var(--sp-3);
  border-bottom: 2rpx solid;
}
.dc-glyph {
  font-size: 60rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.dc-info {
  flex: 1;
}
.dc-name {
  display: block;
  font-size: var(--fs-xl);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.dc-side {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-top: 2rpx;
}

.dc-stats {
  display: flex;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}
.dc-stat {
  flex: 1;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-sm);
  text-align: center;
}
.dc-stat-num {
  display: block;
  font-size: 32rpx;
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.dc-stat-label {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}

.dc-section {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  margin: var(--sp-2) 0;
}
.acupoint-list {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  max-height: 400rpx;
  overflow-y: auto;
}
.al-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 8rpx var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border-left: 4rpx solid;
  border-radius: 4rpx;
  cursor: pointer;
}
.al-item.hit {
  background: rgba(212, 175, 55, 0.15);
}
.al-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
}
.al-name {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  min-width: 100rpx;
}
.al-coord {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-left: auto;
}

.ac-detail {
  padding: var(--sp-3);
  margin-top: var(--sp-2);
  background: linear-gradient(135deg, rgba(91, 58, 142, 0.15), rgba(200, 48, 42, 0.1));
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
}
.ad-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  margin-bottom: var(--sp-2);
}
.ad-row {
  display: flex;
  padding: 4rpx 0;
  font-size: var(--fs-xs);
  line-height: 1.7;
}
.ad-label {
  width: 140rpx;
  color: var(--color-bai-2);
  flex-shrink: 0;
}
.ad-val {
  flex: 1;
  color: var(--color-bai);
}

.dc-actions {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}
.dc-btn {
  flex: 1;
  padding: var(--sp-2);
  text-align: center;
  font-size: var(--fs-sm);
  border-radius: var(--r-md);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.1em;
}
.dc-btn-primary {
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
}
</style>
