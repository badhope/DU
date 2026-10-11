<script setup lang="ts">
/**
 * DU v2 · 首页
 *
 * 全部内容由注册表与语料 manifest 生成：加一个工具、下载一部书，
 * 首页自己长出来，不需要同步改文案——这是 v1 的 README 漂移反过来的做法。
 */
import { computed, onMounted, ref } from 'vue'
import { CATEGORIES, TOOLS } from '@/tools/registry'
import { getManifest, type Manifest } from '@/data/corpus'
import { STATEMENTS } from '@/engine/resonance'
import { SITUATION_LABEL, SITUATIONS } from '@/engine/features'
import type { ResultNode } from '@/contract/result'
import ResultView from '@/ui/ResultView.vue'

const manifest = ref<Manifest | null>(null)
onMounted(async () => {
  try {
    manifest.value = await getManifest()
  } catch {
    /* 语料没同步也不挡首页 */
  }
})

const canonCount = computed(() => STATEMENTS.filter((s) => s.source?.kind === 'canon').length)
const byCategory = computed(() =>
  CATEGORIES.map((c) => ({ ...c, tools: TOOLS.filter((t) => t.category === c.id) })),
)

/** 每日一签：日期本身作种子，全站当天同一条，可复现可分享 */
const daily = computed(() => {
  const d = new Date()
  const key = `${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`
  const i = [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % STATEMENTS.length
  return STATEMENTS[i]!
})

const sitChips = SITUATIONS.slice(0, 9).map((s) => SITUATION_LABEL[s])

/** 今日一签的出处也走同一个 quote 节点：能点开核对才算出处，不然只是排版 */
const dailySource = computed<ResultNode | null>(() => {
  const s = daily.value.source
  if (!s) return null
  if (s.kind === 'canon' && s.quote)
    return {
      kind: 'quote',
      book: s.book ?? '佚',
      text: s.quote,
      ...(s.loc ? { loc: s.loc } : {}),
      ...(s.gloss ? { gloss: s.gloss } : {}),
    }
  return { kind: 'text', lines: [s.gloss ?? '经验观察'] }
})
</script>

<template>
  <section class="hm-hero">
    <h1 class="hm-h">DU</h1>
    <p class="hm-sub">
      以经典为据的娱乐占卜站。断语出自公版典籍，每一条都能查到原文；
      命中靠的是你填的真实信息，不是话术。
    </p>
    <div class="hm-daily">
      <p class="hm-daily-k">今日一签</p>
      <p class="hm-daily-x">{{ daily.text }}</p>
      <ResultView v-if="dailySource" class="hm-daily-s" :node="dailySource" />
      <p class="hm-daily-b">人群适用约 {{ Math.round(daily.baseRate * 100) }}%</p>
    </div>
  </section>

  <section v-for="c in byCategory" :key="c.id" class="hm-cat">
    <h2 class="hm-cat-t" :style="{ color: c.accent }">
      {{ c.name }}<small>{{ c.latin }}</small>
    </h2>
    <p v-if="!c.tools.length" class="hm-soon">该类目在 0.0.1 尚未上线</p>
    <RouterLink v-for="t in c.tools" :key="t.id" :to="`/t/${t.id}`" class="hm-card">
      <strong>{{ t.name }}</strong>
      <span>{{ t.blurb }}</span>
    </RouterLink>
  </section>

  <section class="hm-stats">
    <div class="hm-st"><b>{{ TOOLS.length }}</b><span>个工具</span></div>
    <div class="hm-st"><b>{{ STATEMENTS.length }}</b><span>条断语</span></div>
    <div class="hm-st"><b>{{ canonCount }}</b><span>条有典籍出处</span></div>
    <div class="hm-st">
      <b>{{ manifest ? manifest.books.length : '—' }}</b><span>部可查原书</span>
    </div>
    <div class="hm-st">
      <b>{{ manifest ? (manifest.totalChars / 10000).toFixed(0) + '万' : '—' }}</b><span>字可检索</span>
    </div>
  </section>

  <p class="hm-note">
    引擎认得的处境：{{ sitChips.join('、') }} 等 {{ SITUATIONS.length }} 种。
    勾得越准，结果越贴；不勾就只给通用的那几条，并明说是通用的。
  </p>
  <RouterLink class="hm-link" to="/about">它凭什么看起来准 → 机制说明</RouterLink>
</template>

<style scoped>
.hm-hero {
  padding: 34px 0 20px;
}
.hm-h {
  margin: 0;
  font-size: 56px;
  letter-spacing: 0.24em;
  color: var(--accent);
}
.hm-sub {
  max-width: 46ch;
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.85;
  color: var(--ink-2);
}
.hm-daily {
  margin-top: 22px;
  padding: 16px;
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent-2);
  border-radius: var(--radius);
  background: var(--bg-1);
}
.hm-daily-b {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--ink-3);
}
.hm-daily-k {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--accent-2);
}
.hm-daily-x {
  margin: 0;
  font-size: 17px;
  line-height: 1.7;
}
.hm-daily-s {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--ink-3);
}
.hm-cat {
  margin-top: 26px;
}
.hm-cat-t {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 15px;
  letter-spacing: 0.2em;
}
.hm-cat-t small {
  font-size: 10px;
  letter-spacing: 0.16em;
  opacity: 0.6;
}
.hm-soon {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}
.hm-card {
  display: grid;
  gap: 4px;
  margin-bottom: 8px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-1);
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.hm-card:hover {
  border-color: var(--accent);
  transform: translateX(3px);
}
.hm-card strong {
  font-size: 16px;
}
.hm-card span {
  font-size: 12px;
  color: var(--ink-3);
}
.hm-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
  gap: 8px;
  margin: 30px 0 14px;
  padding: 14px;
  border: 1px dashed var(--line);
  border-radius: var(--radius);
}
.hm-st {
  display: grid;
  text-align: center;
}
.hm-st b {
  font-size: 22px;
  color: var(--accent);
}
.hm-st span {
  font-size: 10px;
  color: var(--ink-3);
}
.hm-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.8;
  color: var(--ink-3);
}
.hm-link {
  display: inline-block;
  margin-top: 12px;
  font-size: 13px;
  color: var(--accent);
}
</style>
