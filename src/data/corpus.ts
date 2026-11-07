/**
 * DU v2 · 典籍阅览室数据层
 *
 * 三层数据里最外一层：成书正文不进 bundle，按书目懒取。
 *
 * 检索为什么用"去标点 + 繁归简"的子串匹配，而不是倒排索引：
 * 语料预建的 MiniSearch 索引只收了每章前 1 万字（全库 31.7%），
 * 且默认按空格分词，中文整段成一个 token，实际上搜不到东西；
 * 自己重建 bigram 倒排要 10MB。而 150 万字全库扫一遍实测约 120ms，
 * 纯前端站里这是更好的交易。
 *
 * opencc 的 t2cn 包 1.1MB，绝不静态 import：只有用户真的检索或
 * 按下"转简体"时才动态载入，读原文不需要它。
 */
import aliasJson from './book-aliases.json'

type Converter = (s: string) => string
let converterPromise: Promise<Converter> | null = null

export function needSimplify(): Promise<Converter> {
  converterPromise ??= import('opencc-js/t2cn').then((m) => m.Converter({ from: 't', to: 'cn' }))
  return converterPromise
}

export interface ChapterMeta {
  id: string
  title: string
  chars: number
}
export interface BookFile {
  file: string
  chapters: ChapterMeta[]
}
export interface BookMeta {
  id: string
  title: string
  author: string
  dynasty: string
  license: string
  files: BookFile[]
  chapters: number
  chars: number
}
export interface Manifest {
  generatedFrom: string
  books: BookMeta[]
  totalChars: number
  derived: string[]
}

export interface Chapter extends ChapterMeta {
  text: string
}
interface BookFilePayload {
  id: string
  title: string
  chapters: Chapter[]
}

export interface Hit {
  book: string
  chapter: string
  chapterId: string
  file: string
  snippet: string
}

function url(...p: string[]): string {
  const candidate = [import.meta.env.BASE_URL, ...p].join('/').replace(/\/+/g, '/')
  if (typeof location === 'undefined') return candidate
  const resolved = new URL(candidate, location.href)
  if (resolved.origin !== location.origin || !resolved.pathname.includes('/corpus/')) throw new Error('语料资源必须来自当前站点的 /corpus/ 路径。')
  return candidate
}

/**
 * 读取一份 JSON 语料。
 *
 * 为什么不能只用 fetch：浏览器里有同源静态服务，fetch 成立；
 * 但 CLI 与 MCP 跑在 Node 里，既没有 location 也没有同源服务 ——
 * fetch('/corpus/...') 必然失败，于是所有检索静默降级成空。
 * 结果就是「引文可核」这条核心能力只在网页端成立，命令行和 MCP 拿不到任何原文。
 *
 * 三档回退：
 *   1. 浏览器：fetch（保持原有 CSP 与同源约束）
 *   2. Node + SEA：从内嵌资源取（exe 自带语料）
 *   3. Node + 源码目录：从 public/corpus 读文件
 *
 * 三档都失败才抛错，由调用方决定是否降级。
 */
/**
 * Node 宿主的语料读取器，由宿主自己注入。
 *
 * 为什么用注入而不是直接 import：`data/` 是被浏览器和 Node 共用的层，
 * 一旦它静态引用 `node/fs` 或 `node/sea`，浏览器构建就会尝试打包这些内置模块
 * 并直接失败（实测：vite build 报 "node:fs is not exported"）。
 * 宿主在启动时把自己的读取器交进来，data 层就永远不需要知道宿主是谁。
 */
export type CorpusReader = (relPath: string) => Promise<string | null>
let injectedReader: CorpusReader | null = null

/** 由 Node 宿主（CLI / server / MCP）在启动时调用 */
export function setCorpusReader(reader: CorpusReader | null): void {
  injectedReader = reader
}

async function loadJson<T>(...pathParts: string[]): Promise<T> {
  const rel = pathParts.join('/').replace(/\/+/g, '/')

  // 1. 宿主注入了读取器（Node / SEA）就先问它
  if (injectedReader) {
    const text = await injectedReader(rel)
    if (text !== null) return JSON.parse(text) as T
  }

  // 2. 浏览器：同源 fetch
  try {
    const res = await fetch(url(...pathParts))
    if (res.ok) return (await res.json()) as T
  } catch {
    /* 落到报错 */
  }

  throw new Error(`读取语料失败：${rel}（既没有宿主读取器，同源请求也失败）`)
}

/**
 * 引用书名 → 站内书目。
 *
 * 断语引《黄帝内经》，站内分发的是素问、灵枢两个本子（维基文库就是分开校排的）。
 * 没有这层别名，出处跳转和可核性检查都会指向一本不存在的书。
 * 别名表与 CI 门禁 scripts/verify-quotes.mjs 共用 src/data/book-aliases.json。
 */
const ALIASES: Record<string, string[]> = (aliasJson as { aliases: Record<string, string[]> }).aliases

/** 书名（含别名）→ 站内书目，可能多部；一律找不到时返回空数组，让调用方明说查不到 */
export function resolveBooks(manifest: Manifest, citedTitle: string): BookMeta[] {
  const titles = ALIASES[citedTitle] ?? [citedTitle]
  const byTitle = new Map(manifest.books.map((b) => [b.title, b]))
  return titles.map((t) => byTitle.get(t)).filter((b): b is BookMeta => !!b)
}

/** 检索归一：去标点空白，只留文字与数字 */
const norm = (s: string) => s.replace(/[\s\u3000-〿＀-￯「」『』《》〈〉【】（）()。、，,；;：:！？!?"'’—…·\-_]+/g, '')

/** 原文（繁体带标点）→ 检索用（简体无标点），并保留下标回指显示串 */
/**
 * 以命中位置为中心，向两侧扩展到句子边界（。！？；），再各留一点余量。
 * 古籍没有空格，逗号切出来的片段常常太碎，所以只认句末标点。
 */
function sentenceWindow(
  text: string,
  hitStart: number,
  hitEnd: number,
  pad: number,
): { from: number; to: number } {
  const BREAK = /[。！？；\n]/
  // 向左找最近的句末标点（最多回退 pad*2 字，避免抓太远）
  let from = hitStart
  const leftLimit = Math.max(0, hitStart - pad * 2)
  while (from > leftLimit && !BREAK.test(text[from - 1] ?? '')) from--
  if (from > 0 && BREAK.test(text[from - 1] ?? '')) {
    /* 正好落在标点后，保留 */
  } else {
    from = Math.max(0, hitStart - pad)
  }
  // 向右找最近的句末标点
  let to = hitEnd + 1
  const rightLimit = Math.min(text.length, hitEnd + pad * 2)
  while (to < rightLimit && !BREAK.test(text[to] ?? '')) to++
  if (to < text.length && BREAK.test(text[to] ?? '')) to += 1
  else to = Math.min(text.length, hitEnd + pad)
  return { from, to }
}

function indexable(text: string, toCN: Converter) {
  const simplified = toCN(text)
  let key = ''
  const map: number[] = []
  for (let i = 0; i < simplified.length; i++) {
    if (norm(simplified[i])) {
      key += simplified[i]
      map.push(i)
    }
  }
  return { key, map, display: simplified }
}

type ChapterIndex = { meta: ChapterMeta; file: string; data: ReturnType<typeof indexable> }

/** 每部书只做一次 fetch + 一次繁简归一，之后检索即时 */
const bookCache = new Map<string, Promise<ChapterIndex[]>>()

async function chaptersOf(book: BookMeta): Promise<ChapterIndex[]> {
  const cached = bookCache.get(book.id)
  if (cached) return cached
  const task = (async () => {
    const [toCN, parts] = await Promise.all([
      needSimplify(),
      Promise.all(
        book.files.map((f) => loadJson<BookFilePayload>('corpus', 'books', f.file)),
      ),
    ])
    return parts.flatMap((p, i) =>
      p.chapters.map((c) => ({
        meta: c,
        file: book.files[i]!.file,
        data: indexable(`${c.title}\n${c.text}`, toCN),
      })),
    )
  })()
  bookCache.set(book.id, task)
  return task
}

let manifestCache: Promise<Manifest> | null = null
export function getManifest(): Promise<Manifest> {
  manifestCache ??= loadJson<Manifest>('corpus', 'manifest.json')
  return manifestCache
}

/** 全域或限定书目检索 */
export async function searchCorpus(query: string, bookIds?: string[], limit = 40): Promise<Hit[]> {
  const q = norm(await needSimplify().then((c) => c(query)))
  if (q.length < 2) return []
  const manifest = await getManifest()
  const targets = bookIds?.length
    ? manifest.books.filter((b) => bookIds.includes(b.id))
    : manifest.books

  const hits: Hit[] = []
  for (const book of targets) {
    if (hits.length >= limit) break
    const per = await chaptersOf(book)
    for (const { meta, file, data } of per) {
      let i = data.key.indexOf(q)
      while (i >= 0 && hits.length < limit) {
        /*
         * 取片段要在句子边界上收口。
         *
         * 原来固定前后各 30 字，结果引文常常从半句开始、到半句结束 ——
         * 像「此卦非金是石，断是破磁碟也。
泽火革互卦金木变艮卦
本卦得泽火革，为少女」，
         * 读者无法判断这句话到底在讲什么。古书没有空格，只能靠标点断句。
         */
        const hitStart = data.map[i]!
        const hitEnd = data.map[i + q.length - 1]!
        const { from, to } = sentenceWindow(data.display, hitStart, hitEnd, 28)
        hits.push({
          book: book.title,
          chapter: meta.title,
          chapterId: meta.id,
          file,
          snippet: data.display.slice(from, to).trim(),
        })
        i = data.key.indexOf(q, i + q.length)
      }
    }
  }
  return hits
}

/** 取单章正文，供阅览室渲染 */
export async function getChapter(
  book: BookMeta,
  chapterId: string,
): Promise<{ chapter: Chapter; title: string; file: string } | null> {
  const source = book.files.find((f) => f.chapters.some((c) => c.id === chapterId))
  if (!source) return null
  const payload = (await fetch(url('corpus', 'books', source.file)).then((r) =>
    r.json(),
  )) as BookFilePayload
  const chapter = payload.chapters.find((c) => c.id === chapterId)
  return chapter ? { chapter, title: payload.title, file: source.file } : null
}

/** 引文可核性：给一句原文，返回它出现在哪部书的哪一章（书名支持别名，如《黄帝内经》→ 素问/灵枢） */
export async function locateQuote(quote: string, bookTitle?: string): Promise<Hit[]> {
  if (!bookTitle) return searchCorpus(quote, undefined, 5)
  const manifest = await getManifest()
  const ids = resolveBooks(manifest, bookTitle).map((b) => b.id)
  // 别名指向的书一部都没分发时，宁可全域搜一遍并让调用方看 hits.book 对不对，也不要假装命中
  return searchCorpus(quote, ids.length ? ids : undefined, 5)
}

/** 显示用转换；未载入转换器时原样返回（原文本就是繁体，不转换也能读） */
export async function simplifyAsync(text: string): Promise<string> {
  return (await needSimplify())(text)
}
