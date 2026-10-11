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

const url = (...p: string[]) => [import.meta.env.BASE_URL, ...p].join('/').replace(/\/+/g, '/')

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
        book.files.map((f) =>
          fetch(url('corpus', 'books', f.file)).then((r) => r.json() as Promise<BookFilePayload>),
        ),
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
  manifestCache ??= fetch(url('corpus', 'manifest.json')).then((r) => r.json() as Promise<Manifest>)
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
        const from = Math.max(0, data.map[i]! - 30)
        const to = Math.min(data.display.length, data.map[i + q.length - 1]! + 30)
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
