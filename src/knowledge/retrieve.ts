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
  /*
   * 过滤没有实质内容的片段。
   *
   * 实测出现过「2.2 一 命宫」这种 —— 它是目录标题，命中了检索词，
   * 但对读者毫无信息量。挂到回答里只会让人觉得在敷衍。
   * 判据：去掉数字、标点、空白后，正文是否够长。
   */
  const substantive = (text: string) => {
    const core = text.replace(/[\d\s\p{P}]/gu, '')
    return core.length >= 12
  }

  /*
   * 跳过带凶断、恐吓、宿命判词的片段。
   *
   * 古籍里这类句子极多（"须当刑戮""夭折""主死""大凶"）。它们作为史料可以
   * 在阅览室里读，但**不能**被直接挂到用户的问题下面 —— 那等于本工具在
   * 用古人的话说"你会死"。项目安全承诺明确禁止恐吓与死亡预测。
   *
   * 这是引文层的第一道过滤；check-content-safety 只扫断语库，扫不到语料。
   */
  const HARMFUL = /刑戮|夭折|主死|必死|凶死|横死|绝嗣|克夫|克妻|克子|大凶|大祸|灾祸临身|血光|暴亡|死期|寿元将尽/
  const filtered = (books.length ? hits.filter((hit) => books.includes(hit.book)) : hits)
    .filter((hit) => substantive(hit.snippet))
    .filter((hit) => !HARMFUL.test(hit.snippet))
  /*
   * 同一章最多取一条。
   *
   * 一个检索词可能在同章出现十几次，全取出来就是同一段话的十个窗口，
   * 挂在回答里显得啰嗦，也没有增加任何信息。
   */
  const seenChapter = new Set<string>()
  const unique: Hit[] = []
  for (const hit of filtered) {
    const key = `${hit.book}|${hit.chapter}`
    if (seenChapter.has(key)) continue
    seenChapter.add(key)
    unique.push(hit)
    if (unique.length >= limit) break
  }

  return unique.map((hit: Hit) => ({ book: hit.book, loc: hit.chapter, text: hit.snippet }))
}

export function passagesForPrompt(passages: Passage[]): string {
  if (!passages.length) return '本次未检索到可直接引用的站内原文；不得自行补写出处。'
  return passages.map((passage, index) => `${index + 1}. 《${passage.book}》${passage.loc}：${passage.text}`).join('\n')
}
