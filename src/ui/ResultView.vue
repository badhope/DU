<script setup lang="ts">
/**
 * DU v2 · 通用结果渲染器
 *
 * 算法只产 ResultNode 语法树，界面由这一棵组件解释。
 * 新增工具不需要写新组件——这是 v2 与 v1（46 个巨型 .vue）的根本区别。
 */
import { computed } from 'vue'
import type { MatrixCell, ResultNode } from '@/contract/result'

const props = defineProps<{ node: ResultNode }>()

/**
 * 出处跳转：带引用书名 + 首段引文进阅览室，由阅览室做书名别名解析与检索。
 *
 * 这里不猜站内书目 id（那要 fetch manifest，渲染器不该有 IO），也不装 RouterLink
 * （ResultView 是递归组件，被单测和首页独立挂载时没有 router 实例）：
 * hash 路由下 `#/reading?...` 就是一个合法的相对链接，两个平台同一份产物。
 */
const quoteHref = computed(() => {
  if (props.node.kind !== 'quote') return null
  const seg = props.node.text.split(/…+/)[0]!.trim()
  const q = new URLSearchParams({ bk: props.node.book, q: seg })
  if (props.node.loc) q.set('loc', props.node.loc)
  return `#/reading?${q.toString()}`
})

/** 卦画：上爻显示在最上 */
const guaRows = computed(() =>
  props.node.kind === 'gua' ? [...props.node.lines].reverse() : [],
)

/** 九宫按洛书序展开 */
const LUOSHU = [4, 9, 2, 3, 5, 7, 8, 1, 6]
const matrixCells = computed<MatrixCell[]>(() => {
  if (props.node.kind !== 'matrix') return []
  const byPalace = new Map(props.node.cells.map((c) => [c.palace, c]))
  return LUOSHU.slice(0, 9).map(
    (p) => byPalace.get(p) ?? { palace: p, center: '' },
  )
})

const scoreDash = computed(() => {
  if (props.node.kind !== 'score') return '0 326.7'
  const pct = Math.max(0, Math.min(1, props.node.value / (props.node.max ?? 100)))
  return `${(pct * 326.7).toFixed(1)} 326.7`
})

function toneClass(tone?: string): string {
  return tone && tone !== 'default' ? `tone-${tone}` : ''
}

function widthOf(value: number, max?: number): string {
  const m = max && max > 0 ? max : 100
  return `${Math.max(0, Math.min(100, (value / m) * 100)).toFixed(1)}%`
}
</script>

<template>
  <div v-if="node.kind === 'stack'" class="st" :class="node.gap && `gap-${node.gap}`">
    <ResultView v-for="(c, i) in node.children" :key="i" :node="c" />
  </div>

  <div v-else-if="node.kind === 'row'" class="rw">
    <ResultView v-for="(c, i) in node.children" :key="i" :node="c" />
  </div>

  <section v-else-if="node.kind === 'section'" class="sc">
    <h3 class="sc-t">{{ node.title }}<span v-if="node.hint" class="sc-h">{{ node.hint }}</span></h3>
    <ResultView v-for="(c, i) in node.children" :key="i" :node="c" />
  </section>

  <div v-else-if="node.kind === 'grid'" class="gr" :style="{ '--cols': node.columns }">
    <div v-for="(c, i) in node.cells" :key="i" class="gc" :class="toneClass(c.tone)">
      <span v-if="c.label" class="gc-l">{{ c.label }}</span>
      <span class="gc-v">{{ c.value }}</span>
      <span v-if="c.sub" class="gc-s">{{ c.sub }}</span>
    </div>
  </div>

  <dl v-else-if="node.kind === 'kv'" class="kv" :style="{ '--cols': node.columns ?? 2 }">
    <template v-for="(c, i) in node.items" :key="i">
      <dt>{{ c.label }}</dt>
      <dd :class="toneClass(c.tone)">{{ c.value }}<span v-if="c.sub" class="kv-s">{{ c.sub }}</span></dd>
    </template>
  </dl>

  <div v-else-if="node.kind === 'chips'" class="ch">
    <span v-for="(c, i) in node.items" :key="i" class="chip" :class="toneClass(c.tone)">{{ c.text }}</span>
  </div>

  <div v-else-if="node.kind === 'bars'" class="br">
    <div v-for="(b, i) in node.items" :key="i" class="br-r">
      <span class="br-l">{{ b.label }}</span>
      <span class="br-track"><span class="br-fill" :class="toneClass(b.tone)" :style="{ width: widthOf(b.value, b.max) }" /></span>
      <span class="br-n">{{ b.value }}</span>
    </div>
  </div>

  <div v-else-if="node.kind === 'score'" class="sco">
    <svg viewBox="0 0 120 120" class="sco-svg" aria-hidden="true">
      <circle class="sco-bg" cx="60" cy="60" r="52" />
      <circle
        class="sco-fg"
        cx="60"
        cy="60"
        r="52"
        :stroke-dasharray="scoreDash"
        transform="rotate(-90 60 60)"
      />
    </svg>
    <div class="sco-c">
      <strong>{{ node.value }}</strong>
      <small v-if="node.label">{{ node.label }}</small>
    </div>
    <p v-if="node.caption" class="sco-cap">{{ node.caption }}</p>
  </div>

  <table v-else-if="node.kind === 'table'" class="tb">
    <thead>
      <tr>
        <th v-for="(h, i) in node.headers" :key="i" :style="{ textAlign: node.align?.[i] ?? 'center' }">{{ h }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(r, i) in node.rows" :key="i">
        <td v-for="(cell, j) in r" :key="j" :style="{ textAlign: node.align?.[j] ?? 'center' }">{{ cell }}</td>
      </tr>
    </tbody>
  </table>

  <div v-else-if="node.kind === 'matrix'" class="mx">
    <div v-for="c in matrixCells" :key="c.palace" class="mx-c" :class="toneClass(c.tone)">
      <span v-for="(k, j) in c.corner ?? []" :key="j" class="mx-k" :class="`mx-k${j + 1}`">{{ k }}</span>
      <span class="mx-v">{{ c?.center }}</span>
    </div>
    <p v-if="node.caption" class="mx-cap">{{ node.caption }}</p>
  </div>

  <div v-else-if="node.kind === 'gua'" class="ga">
    <div v-if="node.title" class="ga-h">
      <strong>{{ node.title }}</strong>
      <span v-if="node.subtitle">{{ node.subtitle }}</span>
    </div>
    <div v-for="l in guaRows" :key="l.position" class="ga-r">
      <span class="ga-side">{{ l.left }}</span>
      <span class="ga-line" :class="[l.yang ? 'yang' : 'yin', { moving: l.moving }]" :aria-label="l.yang ? '阳爻' : '阴爻'">
        <template v-if="l.yang"><i /><i /></template>
        <template v-else><i class="full" /></template>
        <b v-if="l.moving" class="ga-mk">{{ l.yang ? '○' : '×' }}</b>
      </span>
      <span class="ga-side right">{{ l.right }}</span>
      <span class="ga-pos">{{ l.position }}{{ l.mark ? ' ' + l.mark : '' }}</span>
    </div>
  </div>

  <div v-else-if="node.kind === 'text'" class="tx" :class="{ lead: node.lead }">
    <p v-for="(l, i) in node.lines" :key="i">{{ l }}</p>
  </div>

  <div v-else-if="node.kind === 'quote'" class="qt">
    <p class="qt-x">「{{ node.text }}」</p>
    <p class="qt-s">
      <span class="qt-b">《{{ node.book }}》{{ node.loc ?? '' }}</span>
      <span v-if="node.gloss" class="qt-g">{{ node.gloss }}</span>
      <a v-if="quoteHref" class="qt-a" :href="quoteHref">查原文</a>
    </p>
  </div>

  <p v-else-if="node.kind === 'note'" class="nt" :class="toneClass(node.tone)">{{ node.text }}</p>
</template>

<style scoped>
.st {
  display: grid;
  gap: 18px;
}
.st.gap-tight {
  gap: 10px;
}
.st.gap-loose {
  gap: 28px;
}
.rw {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-start;
}
.rw > * {
  flex: 1 1 220px;
}
.sc {
  display: grid;
  gap: 12px;
}
.sc-t {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--ink-2);
  border-left: 2px solid var(--accent);
  padding-left: 9px;
}
.sc-h {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.06em;
  color: var(--ink-3);
}
.gr {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 8px;
}
.gc {
  display: grid;
  gap: 2px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-2);
}
.gc-l {
  font-size: 11px;
  color: var(--ink-3);
}
.gc-v {
  font-size: 16px;
  font-weight: 600;
}
.gc-s {
  font-size: 11px;
  color: var(--ink-3);
}
.kv {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  margin: 0;
  font-size: 13px;
}
.kv dt {
  color: var(--ink-3);
}
.kv dd {
  margin: 0;
}
.kv-s {
  margin-left: 6px;
  font-size: 11px;
  color: var(--ink-3);
}
.ch {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 3px 9px;
  font-size: 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-2);
}
.br {
  display: grid;
  gap: 8px;
}
.br-r {
  display: grid;
  grid-template-columns: 3.5em 1fr 3em;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.br-track {
  height: 6px;
  border-radius: 3px;
  background: var(--line);
  overflow: hidden;
}
.br-fill {
  display: block;
  height: 100%;
  background: var(--accent);
}
.br-n {
  text-align: right;
  color: var(--ink-3);
}
.sco {
  position: relative;
  width: 140px;
  height: 140px;
}
.sco-svg {
  width: 100%;
  height: 100%;
}
.sco-bg {
  fill: none;
  stroke: var(--line);
  stroke-width: 8;
}
.sco-fg {
  fill: none;
  stroke: var(--accent);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.6s ease;
}
.sco-c {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 2px;
  text-align: center;
}
.sco-c strong {
  font-size: 30px;
}
.sco-c small {
  color: var(--ink-3);
}
.sco-cap {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: 6px 0 0;
  font-size: 11px;
  text-align: center;
  color: var(--ink-3);
}
.tb {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.tb th,
.tb td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--line);
}
.tb th {
  color: var(--ink-3);
  font-weight: 500;
}
.mx {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  max-width: 340px;
}
.mx-c {
  position: relative;
  aspect-ratio: 1;
  display: grid;
  place-content: center;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface-2);
}
.mx-v {
  font-size: 20px;
  font-weight: 600;
}
.mx-k {
  position: absolute;
  font-size: 10px;
  color: var(--ink-3);
}
.mx-k1 {
  top: 3px;
  left: 4px;
}
.mx-k2 {
  top: 3px;
  right: 4px;
}
.mx-k3 {
  bottom: 3px;
  left: 4px;
}
.mx-k4 {
  bottom: 3px;
  right: 4px;
}
.mx-cap {
  grid-column: 1 / -1;
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--ink-3);
}
.ga {
  display: grid;
  gap: 6px;
}
.ga-h {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 15px;
}
.ga-h span {
  font-size: 12px;
  color: var(--ink-3);
}
.ga-r {
  display: grid;
  grid-template-columns: 5em 1fr 5em 3em;
  align-items: center;
  gap: 8px;
}
.ga-side {
  font-size: 11px;
  color: var(--ink-3);
  text-align: right;
}
.ga-side.right {
  text-align: left;
}
.ga-line {
  position: relative;
  display: flex;
  gap: 10%;
  height: 10px;
}
.ga-line i {
  flex: 1;
  background: var(--accent);
  border-radius: 2px;
  opacity: 0.85;
}
.ga-line i.full {
  width: 100%;
  flex: none;
}
.ga-line.moving i {
  opacity: 1;
  box-shadow: 0 0 0 1px var(--accent);
}
.ga-mk {
  position: absolute;
  right: -18px;
  top: -4px;
  font-size: 11px;
  color: var(--accent);
}
.ga-pos {
  font-size: 11px;
  color: var(--ink-3);
}
.tx {
  display: grid;
  gap: 6px;
  font-size: 14px;
  line-height: 1.75;
}
.tx.lead p:first-child {
  font-size: 17px;
  color: var(--ink-1);
}
.nt {
  margin: 0;
  padding: 8px 10px;
  font-size: 12px;
  border-radius: 6px;
  background: var(--surface-2);
  border: 1px dashed var(--line);
  color: var(--ink-3);
}
.qt {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-left: 2px solid var(--accent-2);
  background: var(--surface-2);
  border-radius: 0 6px 6px 0;
}
.qt-x {
  margin: 0;
  font-size: 13px;
  line-height: 1.9;
  color: var(--ink-1);
}
.qt-s {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  font-size: 11px;
  color: var(--ink-3);
}
.qt-a {
  margin-left: auto;
  padding: 2px 9px;
  border: 1px solid var(--accent-2);
  border-radius: 999px;
  color: var(--accent-2);
  text-decoration: none;
}
</style>
