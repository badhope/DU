<script setup lang="ts">
/**
 * DU v2 · 典籍阅览室
 *
 * 参考书要能公开浏览——断语的权威性只有回到原文才成立。
 * 正文不进 bundle：选定书目才 fetch，一部一部懒取。
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  getChapter,
  getManifest,
  resolveBooks,
  searchCorpus,
  simplifyAsync,
  type BookMeta,
  type Chapter,
  type Hit,
  type Manifest,
} from '@/data/corpus'

const props = defineProps<{ book?: string }>()

const route = useRoute()

const manifest = ref<Manifest | null>(null)
const error = ref('')
const query = ref('')
const hits = ref<Hit[] | null>(null)
const searching = ref(false)
const active = ref<BookMeta | null>(null)
const chapter = ref<Chapter | null>(null)
const reading = ref(false)
/** 原文为繁体；默认显示繁体，简体切换是阅读辅助，不改数据 */
const toSimplified = ref(false)

onMounted(async () => {
  try {
    manifest.value = await getManifest()
    const q = str(route.query.q)
    const bk = str(route.query.bk)
    if (q || bk) await openCitation(bk, q)
    else if (props.book) await openBook(props.book)
  } catch (e) {
    error.value = `语料未就绪：${(e as Error).message}。（部署前需跑 node scripts/sync-corpus.mjs）`
  }
})

const citation = ref('')

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** 由出处跳转写入 query 时，不要惊动输入框那个防抖检索 */
let suppressQueryWatch = false

/**
 * 从断语的"查原文"进来：带的是引用书名（可能是《黄帝内经》这种合称）与一段引文。
 * 先按别名解析站内书目，再在这些书里搜引文，命中就直达那一章。
 * 搜不到要如实说这本书里没这句话，不能悄悄全域乱搜出一个像样的结果。
 */
async function openCitation(citedTitle: string, quote: string) {
  const m = manifest.value
  if (!m) return
  if (!citedTitle) {
    if (quote) await runSearch(quote)
    return
  }
  const books = resolveBooks(m, citedTitle)
  if (!books.length) {
    error.value = `站内没有《${citedTitle}》——这条出处暂时无法核对（需要补书，或在 book-aliases.json 里给别名）。`
    return
  }
  citation.value = `${citedTitle} → ${books.map((b) => `《${b.title}》`).join('、')}`
  if (!quote) {
    await openBook(books[0]!.id)
    return
  }
  // 只列命中（含章节与高亮片段），点一下才进正文：
  // 一进来就跳章会把"这句话到底在不在"的判断权交给页面，读者看不到核的过程。
  await runSearch(quote, books.map((b) => b.id))
}

/** 程序化检索：写入输入框、限定书目、拿命中 */
async function runSearch(q: string, bookIds?: string[]) {
  clearTimeout(timer)
  suppressQueryWatch = true
  query.value = q
  hits.value = await searchCorpus(q, bookIds, 5)
  await nextTick()
  suppressQueryWatch = false
}

watch(
  () => [route.query.q, route.query.bk],
  async ([q, bk]) => {
    if (!manifest.value) return
    const quote = str(q)
    const title = str(bk)
    if (quote || title) {
      error.value = ''
      citation.value = ''
      await openCitation(title, quote)
    }
  },
)

watch(
  () => props.book,
  (id) => {
    if (id && active.value?.id !== id) void openBook(id)
  },
)

async function openBook(id: string) {
  const b = manifest.value?.books.find((x) => x.id === id)
  if (!b) return
  active.value = b
  hits.value = null
  chapter.value = null
  const first = b.files[0]?.chapters[0]
  if (first) await openChapter(first.id)
}

async function openChapter(chapterId: string) {
  const b = active.value
  if (!b) return
  reading.value = true
  try {
    const got = await getChapter(b, chapterId)
    chapter.value = got?.chapter ?? null
  } finally {
    reading.value = false
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
watch(query, (q) => {
  clearTimeout(timer)
  // 出处跳转自己会把限定书目的命中算好，这里再跑一遍会退化成全域搜索
  if (suppressQueryWatch) return
  if (q.trim().length < 2) {
    hits.value = null
    return
  }
  timer = setTimeout(async () => {
    searching.value = true
    try {
      hits.value = await searchCorpus(q, active.value ? [active.value.id] : undefined, 30)
    } finally {
      searching.value = false
    }
  }, 220)
})

const simplifiedText = ref('')
const converting = ref(false)

watch(
  [() => chapter.value?.id, toSimplified],
  async ([id, wantSimp]) => {
    if (!id || !chapter.value || !wantSimp) {
      simplifiedText.value = ''
      return
    }
    // 只有真的要读简体，才付 opencc 那 1.1MB
    converting.value = true
    try {
      simplifiedText.value = await simplifyAsync(chapter.value.text)
    } finally {
      converting.value = false
    }
  },
)

const displayText = computed(() => {
  if (!chapter.value) return ''
  return toSimplified.value ? simplifiedText.value : chapter.value.text
})

const paragraphs = computed(() =>
  displayText.value
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 1),
)

const allChapters = computed(() => active.value?.files.flatMap((f) => f.chapters) ?? [])

/** 高亮命中段里的查询词（snippet 已是简体，这里只简查询串） */
function marked(hit: Hit) {
  const q = query.value.trim()
  const text = hit.snippet
  if (!q) return [{ t: text, on: false }]
  const parts: { t: string; on: boolean }[] = []
  let rest = text
  while (rest) {
    const i = rest.indexOf(q)
    if (i < 0) {
      parts.push({ t: rest, on: false })
      break
    }
    if (i) parts.push({ t: rest.slice(0, i), on: false })
    parts.push({ t: rest.slice(i, i + q.length), on: true })
    rest = rest.slice(i + q.length)
  }
  return parts
}

async function jumpTo(hit: Hit) {
  const b = manifest.value?.books.find((x) => x.title === hit.book)
  if (!b) return
  active.value = b
  await openChapter(hit.chapterId)
}
</script>

<template>
  <div class="rd">
    <div class="rd-head">
      <h1>典籍阅览室</h1>
      <p class="rd-sub">
        原文取自维基文库公版书。{{ manifest ? `${manifest.books.length} 部 · ${(manifest.totalChars / 10000).toFixed(0)} 万字` : '' }}
      </p>
    </div>

    <p v-if="error" class="rd-err">{{ error }}</p>

    <p v-if="citation" class="rd-cite">
      正在核对出处：{{ citation }}
      <span v-if="hits && !hits.length">—— 这句话在本段引文里没搜到，可手动改上面的检索词</span>
    </p>

    <input v-model="query" class="du-input rd-q" placeholder="跨全书检索，例如 恬淡虚无 / 体用 / 顺逆之机" />

    <nav v-if="manifest" class="rd-books">
      <button
        v-for="b in manifest.books"
        :key="b.id"
        class="rd-bk"
        :class="{ on: active?.id === b.id }"
        @click="openBook(b.id)"
      >
        {{ b.title }}<small>{{ (b.chars / 10000).toFixed(1) }}万</small>
      </button>
    </nav>

    <section v-if="hits" class="rd-hits">
      <p class="rd-hits-t">{{ searching ? '检索中…' : `命中 ${hits.length} 处` }}</p>
      <button v-for="(h, i) in hits" :key="i" class="rd-hit" @click="jumpTo(h)">
        <span class="rd-hit-l">{{ h.book }} · {{ h.chapter }}</span>
        <span class="rd-hit-x">
          <template v-for="(p, j) in marked(h)" :key="j">
            <b v-if="p.on" class="rd-on">{{ p.t }}</b>
            <span v-else>{{ p.t }}</span>
          </template>
        </span>
      </button>
      <p v-if="!hits.length && !searching" class="rd-hit">没查到。繁体简体都试过了——这句话可能不在已下载的书目里。</p>
    </section>

    <template v-else-if="active">
      <div class="rd-bar">
        <strong>{{ active.title }}</strong>
        <span>{{ active.dynasty }} · {{ active.author }} · {{ active.license }}</span>
        <label class="rd-sw">
          <input v-model="toSimplified" type="checkbox" />
          <span>{{ converting ? '转换中…' : '转简体' }}</span>
        </label>
      </div>

      <div class="rd-chs">
        <button
          v-for="c in allChapters"
          :key="c.id"
          class="rd-ch"
          :class="{ on: chapter?.id === c.id }"
          @click="openChapter(c.id)"
        >
          {{ c.title }}
        </button>
      </div>

      <article v-if="reading" class="rd-load">载入中…</article>
      <article v-else-if="toSimplified && !simplifiedText" class="rd-load">
        正在载入繁简转换（首次约 1.1MB，之后留在内存里）。
      </article>
      <article v-else-if="chapter" class="rd-text">
        <h2>{{ chapter.title }}</h2>
        <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
      </article>
    </template>

    <p v-else class="rd-tip">选一部书开始读，或直接检索。断语上的出处链接都会落在这里。</p>
  </div>
</template>

<style scoped>
.rd {
  display: grid;
  gap: 14px;
  padding-top: 22px;
}
.rd-head h1 {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0.16em;
}
.rd-sub {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--ink-3);
}
.rd-err {
  margin: 0;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--tone-bad);
  border: 1px dashed var(--tone-bad);
  border-radius: 6px;
}
.rd-cite {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--accent-2);
}
.rd-q {
  margin-top: 4px;
}
.rd-books {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.rd-bk {
  display: inline-flex;
  gap: 5px;
  align-items: baseline;
  padding: 4px 10px;
  font: inherit;
  font-size: 12px;
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-1);
  cursor: pointer;
}
.rd-bk small {
  font-size: 10px;
  color: var(--ink-3);
}
.rd-bk.on {
  border-color: var(--accent);
  color: var(--accent);
}
.rd-hits {
  display: grid;
  gap: 6px;
}
.rd-hits-t {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--ink-3);
}
.rd-hit {
  display: grid;
  gap: 3px;
  padding: 9px 11px;
  font: inherit;
  text-align: left;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--bg-1);
  color: var(--ink-1);
  cursor: pointer;
}
.rd-hit:hover {
  border-color: var(--accent);
}
.rd-hit-l {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--accent-2);
}
.rd-hit-x {
  font-size: 13px;
  line-height: 1.7;
}
.rd-on {
  background: color-mix(in srgb, var(--accent-2) 30%, transparent);
  color: inherit;
  font-weight: 600;
}
.rd-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}
.rd-bar strong {
  font-size: 17px;
}
.rd-bar span {
  font-size: 11px;
  color: var(--ink-3);
}
.rd-sw {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ink-2);
}
.rd-sw input {
  accent-color: var(--accent);
}
.rd-chs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-height: 116px;
  overflow: auto;
}
.rd-ch {
  padding: 3px 9px;
  font: inherit;
  font-size: 11px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--surface-1);
  color: var(--ink-2);
  cursor: pointer;
}
.rd-ch.on {
  border-color: var(--accent);
  color: var(--accent);
}
.rd-load {
  font-size: 12px;
  color: var(--ink-3);
}
.rd-text {
  display: grid;
  gap: 10px;
  font-size: 14px;
  line-height: 2;
  text-align: justify;
}
.rd-text h2 {
  margin: 0;
  font-size: 15px;
  letter-spacing: 0.14em;
  color: var(--ink-2);
}
.rd-text p {
  margin: 0;
  text-indent: 2em;
}
.rd-tip {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}
</style>
