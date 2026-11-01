import { getManifest, resolveBooks, searchCorpus, type Hit } from '@/data/corpus'

export interface Passage {
  book: string
  loc: string
  text: string
}

export async function retrievePassages(query: string, books: string[], limit = 5): Promise<Passage[]> {
  const clean = query.trim()
  if (clean.length < 2) return []
  const manifest = await getManifest()
  const bookIds = books.flatMap((title) => resolveBooks(manifest, title).map((book) => book.id))
  const hits = await searchCorpus(clean, bookIds.length ? bookIds : undefined, Math.max(limit * 3, 12))
  const filtered = books.length ? hits.filter((hit) => books.includes(hit.book)) : hits
  return filtered.slice(0, limit).map((hit: Hit) => ({ book: hit.book, loc: hit.chapter, text: hit.snippet }))
}

export function passagesForPrompt(passages: Passage[]): string {
  if (!passages.length) return '本次未检索到可直接引用的站内原文；不得自行补写出处。'
  return passages.map((passage, index) => `${index + 1}. 《${passage.book}》${passage.loc}：${passage.text}`).join('\n')
}
