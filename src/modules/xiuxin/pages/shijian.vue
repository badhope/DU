<template>
  <view class="shijian-page" :class="app.fontSizeClass">
    <view class="taiji-bg"><TaijiBg /></view>

    <TopBar title="拾句" subtitle="WORDS FOR THE HEART" />

    <!-- 输入：选择心境 -->
    <view v-if="!chosen" class="form card-mystic anim-fade-up">
      <text class="form-title title-mystic">今 日 心 境</text>
      <text class="form-sub">九 种 心 境 · 各 有 一 句 禅</text>

      <view class="xj-grid">
        <view
          v-for="(meta, key) in XINJING_META"
          :key="key"
          class="xj-card"
          :style="{ borderColor: meta.color }"
          @click="choose(key as Xinjing)"
        >
          <text class="xj-glyph" :style="{ color: meta.color }">{{ meta.glyph }}</text>
          <text class="xj-name">{{ meta.name }}</text>
          <text class="xj-desc">{{ meta.desc }}</text>
        </view>
      </view>

      <view class="form-tip">
        <text>· 或点击"{{ currentZhenju.text.length > 8 ? '…' : '' }}"按钮·随机一句</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" @click="randomPick">
          <text>随 机 一 句</text>
        </view>
        <view class="btn-liu" @click="dailyPick">
          <text>今 日 一 句</text>
        </view>
      </view>
    </view>

    <!-- 展示 -->
    <view v-else class="result">
      <!-- 当前心境 -->
      <view class="xj-now card-mystic anim-fade-up">
        <text class="xj-now-glyph" :style="{ color: chosenMeta.color }">
          {{ chosenMeta.glyph }}
        </text>
        <text class="xj-now-name">{{ chosenMeta.name }} · {{ chosenMeta.desc }}</text>
      </view>

      <!-- 拾句 -->
      <view class="zhenju card-mystic anim-fade-up" style="animation-delay: 0.05s">
        <text class="zhenju-text">{{ currentZhenju.text }}</text>
        <view class="zhenju-foot">
          <text class="zj-src">
            — {{ currentZhenju.source
            }}<text v-if="currentZhenju.author" class="zj-author">
              ·{{ currentZhenju.author }}
            </text>
          </text>
          <view class="zj-right">
            <text class="zj-cat">{{ currentZhenju.category }}</text>
            <view
              class="zj-fav"
              :class="{ on: favorited }"
              :title="favorited ? '已收藏' : '收藏'"
              @click="toggleFav"
            >
              {{ favorited ? '★' : '☆' }}
            </view>
          </view>
        </view>
      </view>

      <!-- 推荐 -->
      <view class="recommend card-mystic anim-fade-up" style="animation-delay: 0.1s">
        <text class="card-title title-mystic">同 心 境 推 荐</text>
        <view class="rec-list">
          <view v-for="(z, i) in recommend" :key="i" class="rec-item" @click="currentZhenju = z">
            <text class="rec-text">{{ z.text }}</text>
            <text class="rec-src">— {{ z.source }}</text>
          </view>
        </view>
      </view>

      <!-- 分类 -->
      <view class="cats card-mystic anim-fade-up" style="animation-delay: 0.15s">
        <text class="card-title title-mystic">分 类 浏 览</text>
        <view class="cat-tabs">
          <view
            v-for="c in CATS"
            :key="c"
            class="cat-tab"
            :class="{ active: cat === c }"
            @click="cat = c"
          >
            {{ c }}
          </view>
        </view>
        <view class="cat-list">
          <view v-for="(z, i) in catList" :key="i" class="cat-item" @click="currentZhenju = z">
            <text class="cat-text">{{ z.text }}</text>
            <text class="cat-src">
              — {{ z.source }}<text v-if="z.author">·{{ z.author }}</text>
            </text>
          </view>
        </view>
      </view>

      <view class="form-actions">
        <view class="btn-liu" @click="chosen = null">
          <text>重 选 心 境</text>
        </view>
        <view class="btn-zhu" @click="randomPick">
          <text>换 一 句</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import {
  XINJING_META,
  dailyZhenju,
  randomZhenju,
  recommendByXinjing,
  byCategory,
  type Xinjing,
  type Zhenju,
} from '@modules/jiankang/logic/zhenci'

const app = useAppStore()

const CATS = ['佛', '道', '儒', '医', '诗', '禅', '古语'] as const

const chosen = ref<Xinjing | null>(null)
const currentZhenju = ref<Zhenju>(dailyZhenju())
const cat = ref<Zhenju['category']>('诗')

const chosenMeta = computed(() => (chosen.value ? XINJING_META[chosen.value] : XINJING_META.kunkun))
const recommend = computed(() => (chosen.value ? recommendByXinjing(chosen.value, 6) : []))
const catList = computed(() => byCategory(cat.value).slice(0, 12))

// 收藏：根据文本+出处生成稳定 ID
const favId = computed(
  () => `zhenju:${currentZhenju.value.text}::${currentZhenju.value.source}`,
)
const favorited = computed(() => app.favorites.includes(favId.value))

function toggleFav() {
  app.toggleFavorite(favId.value)
  uni.showToast({
    title: favorited.value ? '已收入典藏' : '已取消收藏',
    icon: 'none',
    duration: 1200,
  })
}

function choose(x: Xinjing) {
  chosen.value = x
  const recs = recommendByXinjing(x, 1)
  if (recs.length) currentZhenju.value = recs[0]!
  app.addHistory({
    tool: 'shijian',
    toolName: '拾句',
    category: '修心',
    input: { xinjing: x },
    output: { text: currentZhenju.value.text },
    brief: `${XINJING_META[x].name} · ${currentZhenju.value.text.slice(0, 12)}`,
  })
}

function randomPick() {
  currentZhenju.value = randomZhenju()
}

function dailyPick() {
  currentZhenju.value = dailyZhenju()
}
</script>

<style scoped>
.shijian-page {
  min-height: 100vh;
  padding-bottom: var(--sp-6);
}
.form,
.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0 var(--sp-2);
  margin-top: var(--sp-2);
}
.form {
  padding: var(--sp-4);
}
.form-title {
  display: block;
  text-align: center;
  font-size: var(--fs-md);
  margin-bottom: var(--sp-2);
  letter-spacing: 0.2em;
}
.form-sub {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-bottom: var(--sp-4);
}
.form-tip {
  margin-top: var(--sp-2);
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  text-align: center;
}
.form-actions {
  margin-top: var(--sp-3);
  display: flex;
  gap: var(--sp-2);
  justify-content: center;
}
.btn-zhu,
.btn-liu {
  flex: 1;
  text-align: center;
  padding: var(--sp-3) 0;
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
}
.btn-zhu {
  background: linear-gradient(135deg, #c8302a, #d4af37);
  color: var(--color-bai);
}
.btn-liu {
  background: transparent;
  color: var(--color-liu);
  border: 1rpx solid var(--color-liu);
}

.xj-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--sp-2);
}
.xj-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-3) var(--sp-2);
  border: 1rpx solid;
  border-radius: var(--r-md);
  background: rgba(10, 10, 18, 0.4);
  cursor: pointer;
  transition: all 0.3s;
}
.xj-card:active {
  background: rgba(212, 175, 55, 0.2);
  transform: scale(0.97);
}
.xj-glyph {
  font-size: 60rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  margin-bottom: var(--sp-1);
  text-shadow: 0 0 12rpx currentColor;
}
.xj-name {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-weight: 600;
}
.xj-desc {
  font-size: 20rpx;
  color: var(--color-bai-3);
  margin-top: 2rpx;
  text-align: center;
}

.xj-now {
  padding: var(--sp-3) var(--sp-4);
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}
.xj-now-glyph {
  font-size: 64rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  text-shadow: 0 0 16rpx currentColor;
}
.xj-now-name {
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.6;
}

.zhenju {
  padding: var(--sp-5) var(--sp-4);
  text-align: center;
  background: linear-gradient(180deg, rgba(91, 58, 142, 0.2), rgba(10, 10, 18, 0.6));
}
.zhenju-text {
  display: block;
  font-size: 44rpx;
  font-family: 'KaiTi', serif;
  color: var(--color-bai);
  line-height: 1.8;
  letter-spacing: 0.1em;
  margin-bottom: var(--sp-3);
  text-shadow: 0 0 16rpx rgba(212, 175, 55, 0.4);
}
.zhenju-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}
.zj-src {
  font-family: 'KaiTi', serif;
}
.zj-author {
  color: var(--color-bai-2);
}
.zj-cat {
  padding: 4rpx 12rpx;
  background: rgba(212, 175, 55, 0.2);
  color: var(--color-liu);
  border-radius: var(--r-sm);
}
.zj-right {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.zj-fav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  font-size: 36rpx;
  line-height: 1;
  color: var(--color-bai-3);
  border-radius: 50%;
  border: 1rpx solid rgba(212, 175, 55, 0.25);
  transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}
.zj-fav:active {
  transform: scale(0.88);
}
.zj-fav.on {
  color: var(--color-liu);
  background: rgba(212, 175, 55, 0.18);
  box-shadow: 0 0 16rpx rgba(212, 175, 55, 0.45);
  animation: zjFavPop 0.45s ease;
}
@keyframes zjFavPop {
  0% { transform: scale(0.6); }
  55% { transform: scale(1.25); }
  100% { transform: scale(1); }
}

.recommend,
.cats {
  padding: var(--sp-4);
}
.card-title {
  display: block;
  font-size: var(--fs-md);
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-3);
  text-align: center;
}
.rec-list,
.cat-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.rec-item,
.cat-item {
  padding: var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border-radius: var(--r-sm);
  border-left: 4rpx solid var(--color-liu);
  cursor: pointer;
}
.rec-text,
.cat-text {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  line-height: 1.7;
  font-family: 'KaiTi', serif;
  margin-bottom: 4rpx;
}
.rec-src,
.cat-src {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
}

.cat-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
  margin-bottom: var(--sp-2);
}
.cat-tab {
  padding: 6rpx 14rpx;
  font-size: var(--fs-xs);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  color: var(--color-bai-2);
}
.cat-tab.active {
  background: var(--color-liu);
  color: var(--color-bai);
  border-color: var(--color-liu);
}
</style>
