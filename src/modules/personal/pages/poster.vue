<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <TopBar title="海报分享" subtitle="POSTER GENERATOR" />

    <!-- 设置区 -->
    <view v-if="!result" class="form card-mystic anim-fade-up">
      <text class="form-title title-mystic">海 报 工 坊</text>
      <text class="form-sub">5 套 玄 学 模 板 · Canvas 真 实 渲 染</text>

      <!-- 模板选择 -->
      <view class="form-section">
        <text class="form-label">· 模 板 选 择</text>
        <scroll-view scroll-x class="tpl-scroll">
          <view class="tpl-grid">
            <view
              v-for="t in TEMPLATES"
              :key="t.key"
              class="tpl-card"
              :class="{ active: form.template === t.key }"
              @click="form.template = t.key"
            >
              <view class="tpl-preview" :style="{ background: gradientCss(t.gradient) }">
                <text class="tpl-symbol">☯</text>
              </view>
              <text class="tpl-name">{{ t.name }}</text>
              <text class="tpl-desc">{{ t.desc }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 来源类型 -->
      <view class="form-section">
        <text class="form-label">· 内 容 来 源</text>
        <view class="type-grid">
          <view
            v-for="t in typeOptions"
            :key="t.key"
            class="t-btn"
            :class="{ active: form.type === t.key }"
            @click="setType(t.key)"
          >
            <text class="t-glyph">{{ t.glyph }}</text>
            <text class="t-label">{{ t.label }}</text>
          </view>
        </view>
      </view>

      <!-- 历史选择 -->
      <view v-if="availableHistories.length > 0" class="form-section">
        <text class="form-label">· 历 史 记 录（可 选）</text>
        <scroll-view scroll-y class="hist-scroll">
          <view
            v-for="h in availableHistories"
            :key="h.id"
            class="hist-item"
            :class="{ active: selectedHistoryId === h.id }"
            @click="selectHistory(h)"
          >
            <text class="hist-tool">{{ h.toolName }}</text>
            <text class="hist-brief">{{ h.brief }}</text>
            <text class="hist-time">{{ formatTime(h.time) }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 自定义标题 -->
      <view class="form-section">
        <text class="form-label">· 自 定 义</text>
        <view class="form-row">
          <text class="row-label">主 标 题</text>
          <input v-model="form.title" class="form-input" placeholder="如：命由天定" />
        </view>
        <view class="form-row">
          <text class="row-label">副 标 题</text>
          <input v-model="form.subtitle" class="form-input" placeholder="如：一日新启" />
        </view>
        <view class="form-row">
          <text class="row-label">中 心 字</text>
          <input
            v-model="form.glyph"
            class="form-input"
            maxlength="1"
            placeholder="卦/命/✦/爻/智"
          />
        </view>
      </view>

      <view class="form-tip">
        <text>· 海报以 750×1334 (3:4) PNG 真实渲染</text>
        <text class="tip-detail">· 可保存到相册 / 复制文字 / 重新生成</text>
      </view>

      <view class="form-actions">
        <view class="btn-zhu" @click="generate">生 成 海 报</view>
      </view>
    </view>

    <!-- 预览 / 保存 区 -->
    <view v-else class="result anim-fade-up">
      <text class="r-label">· 海 报 预 览</text>

      <!-- Canvas 画布（H5 用）/ 静态图（其他端） -->
      <view class="canvas-wrap">
        <!-- H5: CSS 渲染的预览层 (绕过 uni-app canvas id 被剥离的 bug) -->
        <!-- #ifdef H5 -->
        <view class="poster-css" :style="posterCssStyle">
          <view class="poster-css-glow1" :style="posterGlow1Style"></view>
          <view class="poster-css-glow2" :style="posterGlow2Style"></view>
          <view class="poster-css-clouds">
            <view class="poster-css-cloud tl"></view>
            <view class="poster-css-cloud tr"></view>
            <view class="poster-css-cloud bl"></view>
            <view class="poster-css-cloud br"></view>
          </view>
          <view v-if="form.badge" class="poster-css-badge" :style="posterBadgeStyle">
            <text class="poster-css-badge-text">{{ form.badge }}</text>
          </view>
          <view class="poster-css-taiji" :style="posterTaijiStyle">
            <view class="taiji-yang"></view>
            <view class="taiji-yin"></view>
            <view class="taiji-yang-dot"></view>
            <view class="taiji-yin-dot"></view>
          </view>
          <text class="poster-css-glyph" :style="posterGlyphStyle">{{ form.glyph }}</text>
          <text class="poster-css-title" :style="posterTitleStyle">{{ form.title }}</text>
          <text class="poster-css-subtitle" :style="posterSubtitleStyle">{{ form.subtitle }}</text>
          <view class="poster-css-divider" :style="posterDividerStyle"></view>
          <text
            v-for="(line, i) in form.content"
            :key="'c' + i"
            class="poster-css-content"
            :style="{ ...posterContentStyle, top: 68 + i * 5.5 + '%' }"
            >{{ line }}</text
          >
          <text v-if="form.signature" class="poster-css-sig" :style="posterSigStyle">{{
            form.signature
          }}</text>
          <text class="poster-css-date" :style="posterDateStyle">{{ form.dateStr }}</text>
          <view class="poster-css-footer" :style="posterFooterStyle">
            <text class="poster-css-footer-text">{{ form.footer }}</text>
            <text class="poster-css-footer-dots">· · ·</text>
          </view>
        </view>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <canvas
          v-if="useCanvas"
          ref="canvasEl"
          canvas-id="posterCanvas"
          class="poster-canvas"
          :style="{ width: canvasStyle.w, height: canvasStyle.h }"
          @error="onCanvasError"
        ></canvas>
        <image
          v-else
          :src="resultImage"
          class="poster-canvas"
          :style="{ width: canvasStyle.w, height: canvasStyle.h }"
          mode="aspectFill"
        />
        <!-- #endif -->
      </view>

      <view class="form-actions">
        <view class="btn-secondary" @click="copyText">复 制 文 字</view>
        <view class="btn-liu" @click="saveImage">保 存 长 图</view>
        <view class="btn-zhu" @click="share">分 享</view>
      </view>
      <view class="form-actions">
        <view class="btn-secondary" @click="result = false">返 回 修 改</view>
        <view class="btn-secondary" @click="regenerate">再 生 一 张</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import TopBar from '@shared/components/ui/TopBar.vue'
import TaijiBg from '@shared/components/effects/TaijiBg.vue'
import { useAppStore } from '@/stores'
import {
  TEMPLATES,
  renderPoster,
  buildPosterFromHistory,
  type PosterConfig,
  type PosterTemplate as _PosterTemplate,
} from '@shared/utils/poster-renderer'

const app = useAppStore()
const result = ref(false)
const resultImage = ref('')
const useCanvas = ref(true)
const selectedHistoryId = ref<string | null>(null)

const form = ref<PosterConfig>({
  template: 'xuanhei',
  type: 'gua',
  glyph: '卦',
  title: '卦象初明',
  subtitle: '天机指引',
  content: ['乾为天 · 元亨利贞', '天行健 · 君子自强'],
  badge: 'DAILY · 今日一卦',
  signature: app.profile?.nickname || '玄友',
  dateStr: '',
  footer: '玄枢 MISTVERSE · 你的玄学工具集',
})

const typeOptions = [
  { key: 'gua' as const, label: '卦象', glyph: '卦' },
  { key: 'bazi' as const, label: '八字', glyph: '命' },
  { key: 'tarot' as const, label: '塔罗', glyph: '✦' },
  { key: 'liuyao' as const, label: '六爻', glyph: '爻' },
  { key: 'ai' as const, label: 'AI', glyph: '智' },
  { key: 'custom' as const, label: '自定义', glyph: '自' },
]

const availableHistories = computed(() => {
  const map: Record<string, string> = {
    gua: 'gua',
    bazi: 'bazi',
    tarot: 'tarot',
    liuyao: 'liuyao',
  }
  const key = map[form.value.type] || ''
  return app.history.filter((h) => h.tool === key).slice(0, 20)
})

const canvasStyle = computed(() => ({ w: '500rpx', h: '889rpx' }))

// ============ CSS 渲染 (H5 端) ============
const tplMeta = computed(
  () => TEMPLATES.find((t) => t.key === form.value.template) || TEMPLATES[0]!,
)

function withAlpha(rgba: string, alpha: number): string {
  // 简单替换 / 追加 alpha（针对 rgba / hex 两种格式）
  if (rgba.startsWith('rgba')) return rgba.replace(/[\d.]+\)$/g, `${alpha})`)
  if (rgba.startsWith('#') && rgba.length === 7) {
    const r = parseInt(rgba.slice(1, 3), 16)
    const g = parseInt(rgba.slice(3, 5), 16)
    const b = parseInt(rgba.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return rgba
}

const posterCssStyle = computed(() => ({
  background: `linear-gradient(180deg, ${tplMeta.value.gradient[0]} 0%, ${tplMeta.value.gradient[1]} 50%, ${tplMeta.value.gradient[2]} 100%)`,
  color: tplMeta.value.text,
}))

const posterGlow1Style = computed(() => ({
  background: `radial-gradient(circle at 50% 85%, ${tplMeta.value.glow} 0%, rgba(0,0,0,0) 70%)`,
}))

const posterGlow2Style = computed(() => ({
  background: `radial-gradient(circle at 30% 15%, ${tplMeta.value.glow} 0%, rgba(0,0,0,0) 60%)`,
}))

const posterBadgeStyle = computed(() => ({
  borderColor: tplMeta.value.accent,
  color: tplMeta.value.text,
}))

const posterTaijiStyle = computed(() => ({
  borderColor: withAlpha(tplMeta.value.accent, 0.5),
}))

const posterGlyphStyle = computed(() => ({
  color: tplMeta.value.text,
  textShadow: `0 0 4rpx ${tplMeta.value.glow}`,
}))

const posterTitleStyle = computed(() => ({
  color: tplMeta.value.accent,
  textShadow: `0 0 2rpx ${tplMeta.value.glow}`,
}))

const posterSubtitleStyle = computed(() => ({
  color: tplMeta.value.text,
}))

const posterDividerStyle = computed(() => ({
  background: tplMeta.value.accent,
}))

const posterContentStyle = computed(() => ({
  color: tplMeta.value.text,
}))

const posterSigStyle = computed(() => ({
  color: tplMeta.value.accent,
}))

const posterDateStyle = computed(() => ({
  color: tplMeta.value.text,
}))

const posterFooterStyle = computed(() => ({
  borderColor: tplMeta.value.accent,
  color: tplMeta.value.text,
}))

function renderPosterCSS() {
  // H5 上: CSS 模板已通过响应式自动渲染，无需手动操作
}

function gradientCss(g: [string, string, string]): string {
  return `linear-gradient(180deg, ${g[0]!} 0%, ${g[1]!} 50%, ${g[2]!} 100%)`
}

function formatTime(t: number): string {
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function setType(k: typeof form.value.type) {
  form.value.type = k
  selectedHistoryId.value = null
  // 自动填默认
  if (k === 'gua') {
    form.value.glyph = '卦'
    form.value.title = '卦象初明'
    form.value.subtitle = '天机指引'
  }
  if (k === 'bazi') {
    form.value.glyph = '命'
    form.value.title = '命由天定'
    form.value.subtitle = '运由己造'
  }
  if (k === 'tarot') {
    form.value.glyph = '✦'
    form.value.title = '塔罗之心'
    form.value.subtitle = '神秘指引'
  }
  if (k === 'liuyao') {
    form.value.glyph = '爻'
    form.value.title = '玄枢易盘'
    form.value.subtitle = '六爻纳甲'
  }
  if (k === 'custom') {
    form.value.glyph = '自'
    form.value.title = '自定义海报'
    form.value.subtitle = '自由编辑'
  }
}

function selectHistory(h: (typeof app.history)[number]) {
  selectedHistoryId.value = h.id
  const built = buildPosterFromHistory(form.value.type, h, app.profile)
  form.value = {
    ...built,
    template: form.value.template,
    type: form.value.type,
    glyph: built.glyph,
    title: built.title,
    subtitle: built.subtitle,
    content: built.content,
    signature: built.signature,
    dateStr: built.dateStr,
    footer: built.footer,
    badge: built.badge,
  }
}

async function generate() {
  const now = new Date()
  form.value.dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
  if (!form.value.signature) form.value.signature = app.profile?.nickname || '玄友'
  result.value = true
  app._ach('share-1')
  app.addHistory({
    tool: 'poster',
    toolName: '海报分享',
    category: '生活',
    input: { template: form.value.template, type: form.value.type, title: form.value.title },
    output: { title: form.value.title, glyph: form.value.glyph },
    brief: `${form.value.type} · ${form.value.glyph} · ${form.value.title}`,
  })
  await nextTick()
  // H5 端：uni-app 编译后会延迟渲染 canvas，再等一帧确保 DOM 就位
  // #ifdef H5
  setTimeout(() => drawCanvas(), 50)
  // #endif
  // #ifndef H5
  drawCanvas()
  // #endif
}

function drawCanvas() {
  try {
    // H5 端：uni-app H5 编译后会丢 id + 时常重置 canvas，改用 CSS 渲染
    // #ifdef H5
    renderPosterCSS()
    // #endif
    // #ifndef H5
    const ctx = uni.createCanvasContext('posterCanvas')
    if (ctx) {
      // 在非 H5 端，用 dpr 缩放
      ctx.scale(750 / 500, 1334 / 889)
      renderPoster(null, ctx, form.value, 500, 889)
      ctx.draw(false, () => {
        uni.canvasToTempFilePath({
          canvasId: 'posterCanvas',
          success: (res) => {
            resultImage.value = res.tempFilePath
            useCanvas.value = false
          },
          fail: (err) => {
            // eslint-disable-next-line no-console
            console.warn('[poster] canvasToTempFilePath fail', err)
          },
        })
      })
    }
    // #endif
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[poster] drawCanvas error', e)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function onCanvasError(e: any) {
  // eslint-disable-next-line no-console
  console.error('[poster] canvas error', e)
}

function copyText() {
  const text = [
    form.value.badge,
    form.value.title,
    form.value.subtitle,
    ...form.value.content,
    form.value.signature,
    form.value.dateStr,
    form.value.footer,
  ]
    .filter(Boolean)
    .join('\n')
  // #ifdef H5
  navigator.clipboard
    ?.writeText(text)
    .then(() => {
      uni.showToast({ title: '已复制', icon: 'success' })
    })
    .catch(() => {
      uni.showToast({ title: '复制失败', icon: 'none' })
    })
  // #endif
  // #ifndef H5
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
  })
  // #endif
}

function saveImage() {
  // #ifdef H5
  const cv = document.querySelector('canvas.uni-canvas-canvas') as HTMLCanvasElement | null
  if (cv && typeof cv.toDataURL === 'function') {
    const url = cv.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `mistverse-poster-${form.value.template}-${Date.now()}.png`
    a.click()
    uni.showToast({ title: '已触发下载', icon: 'success' })
  } else {
    uni.showToast({ title: '请先生成海报', icon: 'none' })
  }
  // #endif
  // #ifndef H5
  if (resultImage.value) {
    uni.saveImageToPhotosAlbum({
      filePath: resultImage.value,
      success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
      fail: (_e) => uni.showToast({ title: '保存失败', icon: 'none' }),
    })
  } else {
    uni.showToast({ title: '请先生成海报', icon: 'none' })
  }
  // #endif
}

function share() {
  // #ifdef H5
  uni.showToast({ title: '可截图或保存后分享', icon: 'none' })
  // #endif
  // #ifndef H5
  if (resultImage.value) {
    uni.share({
      provider: 'weixin',
      scene: 'WXSceneSession',
      imageUrl: resultImage.value,
      success: () => uni.showToast({ title: '分享成功', icon: 'success' }),
      fail: (_e) => uni.showToast({ title: '分享已取消', icon: 'none' }),
    })
  } else {
    uni.showToast({ title: '请先生成海报', icon: 'none' })
  }
  // #endif
}

function regenerate() {
  // 重新选择模板 + 重新渲染
  const idx = TEMPLATES.findIndex((t) => t.key === form.value.template)
  const next = TEMPLATES[(idx + 1) % TEMPLATES.length]!
  form.value.template = next.key
  drawCanvas()
  uni.showToast({ title: `已切换 ${next.name}`, icon: 'none' })
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
.form-row {
  display: flex;
  align-items: center;
  padding: var(--sp-2) var(--sp-3);
  margin-bottom: var(--sp-1);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-md);
}
.row-label {
  width: 130rpx;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.1em;
  flex-shrink: 0;
}
.form-input {
  flex: 1;
  text-align: left;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  padding: var(--sp-1) 0;
  background: transparent;
}

.tpl-scroll {
  white-space: nowrap;
}
.tpl-grid {
  display: inline-flex;
  gap: var(--sp-2);
  padding: 4rpx 0;
}
.tpl-card {
  display: inline-block;
  width: 200rpx;
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
  text-align: center;
}
.tpl-card.active {
  border-color: var(--color-liu);
  background: rgba(212, 175, 55, 0.1);
}
.tpl-preview {
  width: 100%;
  height: 200rpx;
  border-radius: var(--r-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}
.tpl-symbol {
  font-size: 80rpx;
  opacity: 0.6;
  color: #fff;
}
.tpl-name {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai);
  margin-top: var(--sp-1);
}
.tpl-desc {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
  margin-top: 2rpx;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--sp-2);
}
.t-btn {
  text-align: center;
  padding: var(--sp-2) 0;
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-sm);
}
.t-btn.active {
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
  border-color: var(--color-liu);
}
.t-glyph {
  display: block;
  font-size: 32rpx;
  font-family: 'KaiTi', serif;
}
.t-label {
  display: block;
  font-size: var(--fs-xs);
  margin-top: 2rpx;
}

.hist-scroll {
  max-height: 320rpx;
}
.hist-item {
  padding: var(--sp-2);
  background: rgba(10, 10, 18, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-sm);
  margin-bottom: var(--sp-1);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.hist-item.active {
  border-color: var(--color-liu);
  background: rgba(212, 175, 55, 0.1);
}
.hist-tool {
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  min-width: 100rpx;
}
.hist-brief {
  flex: 1;
  font-size: var(--fs-xs);
  color: var(--color-bai);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hist-time {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}

.form-tip {
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin-top: var(--sp-2);
  line-height: 1.6;
  text-align: center;
}
.tip-detail {
  display: block;
  margin-top: 2rpx;
}
.form-actions {
  margin-top: var(--sp-4);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--sp-2);
}
.btn-zhu {
  padding: var(--sp-3) var(--sp-5);
  background: linear-gradient(135deg, #5b3a8e, #c8302a);
  color: var(--color-bai);
  font-size: var(--fs-md);
  border-radius: var(--r-md);
  letter-spacing: 0.2em;
  min-width: 220rpx;
  text-align: center;
}
.btn-liu {
  padding: var(--sp-3) var(--sp-5);
  background: linear-gradient(135deg, #d4af37, #8b6f47);
  color: #fff;
  font-size: var(--fs-sm);
  border-radius: var(--r-md);
  letter-spacing: 0.1em;
  min-width: 180rpx;
  text-align: center;
}
.btn-secondary {
  padding: var(--sp-2) var(--sp-4);
  background: rgba(212, 175, 55, 0.15);
  color: var(--color-liu);
  font-size: var(--fs-sm);
  border-radius: var(--r-sm);
  letter-spacing: 0.1em;
  min-width: 160rpx;
  text-align: center;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
}

.result {
  position: relative;
  z-index: var(--z-content);
  margin: var(--sp-3) var(--sp-2);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.r-label {
  display: block;
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  margin-bottom: var(--sp-2);
  letter-spacing: 0.1em;
}
.canvas-wrap {
  display: flex;
  justify-content: center;
}
.poster-canvas {
  border-radius: var(--r-md);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.5);
}

/* ============ CSS 海报 (H5 端) ============ */
.poster-css {
  position: relative;
  width: 500rpx;
  height: 889rpx;
  border-radius: var(--r-md);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.5);
  overflow: hidden;
  font-family: 'KaiTi', 'STKaiti', 'PingFang SC', 'Microsoft YaHei', serif;
  display: block;
}
.poster-css-glow1,
.poster-css-glow2 {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.poster-css-clouds {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.poster-css-cloud {
  position: absolute;
  width: 80rpx;
  height: 80rpx;
  border: 2rpx solid currentColor;
  border-right: none;
  border-bottom: none;
  border-top: none;
  border-left: none;
  opacity: 0.4;
}
.poster-css-cloud.tl {
  top: 30rpx;
  left: 30rpx;
  border-top: 2rpx solid currentColor;
  border-left: 2rpx solid currentColor;
  border-radius: 0 0 0 60rpx;
}
.poster-css-cloud.tr {
  top: 30rpx;
  right: 30rpx;
  border-top: 2rpx solid currentColor;
  border-right: 2rpx solid currentColor;
  border-radius: 0 0 60rpx 0;
}
.poster-css-cloud.bl {
  bottom: 30rpx;
  left: 30rpx;
  border-bottom: 2rpx solid currentColor;
  border-left: 2rpx solid currentColor;
  border-radius: 0 60rpx 0 0;
}
.poster-css-cloud.br {
  bottom: 30rpx;
  right: 30rpx;
  border-bottom: 2rpx solid currentColor;
  border-right: 2rpx solid currentColor;
  border-radius: 60rpx 0 0 0;
}
.poster-css-badge {
  position: absolute;
  top: 6%;
  left: 50%;
  transform: translateX(-50%);
  padding: 6rpx 24rpx;
  border: 1rpx solid;
  border-radius: 16rpx;
  background: rgba(0, 0, 0, 0.3);
  font-size: 20rpx;
  letter-spacing: 0.1em;
  white-space: nowrap;
}
.poster-css-taiji {
  position: absolute;
  top: 26%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 2rpx solid;
  overflow: hidden;
  background: #fff;
}
.poster-css-taiji .taiji-yang,
.poster-css-taiji .taiji-yin {
  position: absolute;
  width: 50%;
  height: 100%;
  top: 0;
}
.poster-css-taiji .taiji-yang {
  left: 0;
  background: #fff;
}
.poster-css-taiji .taiji-yin {
  right: 0;
  background: #000;
}
.poster-css-taiji .taiji-yang-dot,
.poster-css-taiji .taiji-yin-dot {
  position: absolute;
  width: 25%;
  height: 25%;
  border-radius: 50%;
  left: 50%;
  transform: translateX(-50%);
}
.poster-css-taiji .taiji-yang-dot {
  top: 12.5%;
  background: #000;
}
.poster-css-taiji .taiji-yin-dot {
  bottom: 12.5%;
  background: #fff;
}
.poster-css-glyph {
  position: absolute;
  top: 26%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 110rpx;
  font-weight: 700;
  z-index: 2;
}
.poster-css-title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 56rpx;
  font-weight: 700;
  letter-spacing: 0.2em;
  white-space: nowrap;
}
.poster-css-subtitle {
  position: absolute;
  top: 58%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28rpx;
  letter-spacing: 0.2em;
  white-space: nowrap;
}
.poster-css-divider {
  position: absolute;
  top: 63%;
  left: 50%;
  transform: translateX(-50%);
  width: 180rpx;
  height: 1rpx;
  opacity: 0.6;
}
.poster-css-content {
  position: absolute;
  top: 68%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24rpx;
  white-space: nowrap;
  letter-spacing: 0.1em;
}
.poster-css-sig {
  position: absolute;
  top: 80%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24rpx;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.poster-css-date {
  position: absolute;
  top: 84%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20rpx;
  opacity: 0.7;
  font-family: monospace;
}
.poster-css-footer {
  position: absolute;
  bottom: 3%;
  left: 8%;
  right: 8%;
  text-align: center;
  border-top: 1rpx solid;
  border-color: inherit;
  padding-top: 10rpx;
  opacity: 0.7;
}
.poster-css-footer-text {
  display: block;
  font-size: 16rpx;
  letter-spacing: 0.1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.poster-css-footer-dots {
  display: block;
  font-size: 16rpx;
  opacity: 0.6;
  margin-top: 2rpx;
}
</style>
