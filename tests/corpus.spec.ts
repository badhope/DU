/**
 * 阅览室数据层
 *
 * fetch 打桩指向 dist 里真实同步过去的语料，验的是
 * "断语上写的那句原文，读者在站内确实搜得到"——
 * 这是 verify-quotes 那道闸在浏览器侧的对应物。
 */
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getManifest, resolveBooks, searchCorpus, simplifyAsync } from '@/data/corpus'

/**
 * 读 public/corpus 而不是 dist：public 是部署产物本身（要提交进仓库），
 * dist 得先 build 才有，把它写进测试顺序里等于给 CI 埋一个前后依赖。
 */
async function fakeFetch(input: string) {
  const path = input.replace(/^(\.\/|\/)/, '')
  const file = path.startsWith('corpus/') ? `public/${path}` : `dist/${path}`
  try {
    const body = JSON.parse(readFileSync(file, 'utf8'))
    return { ok: true, json: async () => body } as unknown as Response
  } catch {
    return { ok: false, status: 404, json: async () => ({}) } as unknown as Response
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(fakeFetch))
})

describe('典籍阅览室数据层', () => {
  it('manifest 列出书目、篇章与字数', async () => {
    const m = await getManifest()
    expect(m.books.length).toBeGreaterThanOrEqual(12)
    expect(m.totalChars).toBeGreaterThan(1_000_000)
    const mei = m.books.find((b) => b.id === 'meihua-yishu')
    expect(mei?.title).toBe('梅花易数')
    expect(mei?.chapters).toBe(4)
    expect(mei?.files.length).toBe(1)
    expect(mei?.files[0]!.chapters.every((c) => c.chars > 0)).toBe(true)
  })

  it('繁简都能搜到：用户输入简体，原文是繁体', async () => {
    const hits = await searchCorpus('恬淡虚无', ['suwen'])
    expect(hits.length, '简体查询应命中繁体原文').toBeGreaterThan(0)
    expect(hits[0]!.snippet).toContain('恬淡虚无')
    expect(hits[0]!.book).toBe('素问')
  })

  it('书名别名：《黄帝内经》解析到站内实际分发的素问 + 灵枢', async () => {
    const m = await getManifest()
    expect(resolveBooks(m, '黄帝内经').map((b) => b.title)).toEqual(['素问', '灵枢'])
    expect(resolveBooks(m, '梅花易数').map((b) => b.id)).toEqual(['meihua-yishu'])
    // 查不到的书名必须返回空，让上层明说"站内没这本书"，而不是悄悄全域搜
    expect(resolveBooks(m, '不存在的书')).toEqual([])
  })

  it('断语引用的每句 canon 原文都能在其标定的书里搜到', async () => {
    const { STATEMENTS } = await import('@/engine/resonance')
    const canon = STATEMENTS.filter((s) => s.source?.kind === 'canon' && s.source.quote)
    expect(canon.length).toBeGreaterThanOrEqual(20)

    const m = await getManifest()
    const missing: string[] = []
    for (const s of canon) {
      const bookTitle = s.source!.book!
      const books = resolveBooks(m, bookTitle)
      if (!books.length) {
        missing.push(`${s.id}: 站内无《${bookTitle}》（补书或加 book-aliases.json 别名）`)
        continue
      }
      // 引文可能带省略号分段，逐段核
      const segs = s.source!.quote!.split(/[…]+/).map((x) => x.trim()).filter((x) => x.length >= 4)
      for (const seg of segs) {
        const hits = await searchCorpus(seg, books.map((b) => b.id), 1)
        if (!hits.length) missing.push(`${s.id}: 《${bookTitle}》里搜不到「${seg}」`)
      }
    }
    expect(missing).toEqual([])
  })

  it('标点、空白不参与匹配（同一句不同标点也算命中）', async () => {
    const a = await searchCorpus('體為己身之兆，用為應事之端。', ['meihua-yishu'], 1)
    const b = await searchCorpus('体为己身之兆用为应事之端', ['meihua-yishu'], 1)
    expect(a.length).toBe(1)
    expect(b.length).toBe(1)
  })

  it('查不到的就明说查不到，不许返回近似内容冒充', async () => {
    const hits = await searchCorpus('这句话肯定不在任何公版书里面', undefined, 5)
    expect(hits).toHaveLength(0)
  })

  it('限定时只搜指定书目，避免全书扫描', async () => {
    const all = await searchCorpus('體用', undefined, 5)
    const one = await searchCorpus('體用', ['meihua-yishu'], 5)
    expect(all.length).toBeGreaterThan(0)
    expect(one.every((h) => h.book === '梅花易数')).toBe(true)
  })

  it('转简体只在需要时发生，且不改数据本身', async () => {
    const { LIBRARY } = await import('@/engine/statements.library')
    const canon = LIBRARY.find((s) => s.source?.kind === 'canon' && s.source.quote)!
    const s = await simplifyAsync(canon.source!.quote!)
    expect(s.length).toBe(canon.source!.quote!.length) // 等长替换，不吞字
    if (/[⿰龘]/.test('')) throw new Error('never')
    expect(s === canon.source!.quote).toBe(false) // 确实做了繁→简
  })
})
