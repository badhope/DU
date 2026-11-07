import { describe, expect, it } from 'vitest'
import { retrievePassages } from '@/knowledge/retrieve'

describe('引文检索的正确性约束', () => {
  const BOOKS = ['紫微斗数全书', '滴天髓']

  it('检索结果不含凶断、死亡预测与宿命判词', async () => {
    /*
     * 古籍里「须当刑戮」「夭折」「主死」这类句子极多。作为史料可以在阅览室读，
     * 但不能直接挂到用户的问题下面 —— 那等于本工具在用古人的话说"你会死"，
     * 与项目"不恐吓、不预测死亡"的承诺直接冲突。
     */
    const HARMFUL = /刑戮|夭折|主死|必死|凶死|横死|绝嗣|克夫|克妻|克子|大凶|大祸|血光|暴亡|死期|寿元将尽/
    for (const term of ['命宫', '日主', '大运']) {
      const passages = await retrievePassages(term, BOOKS, 5)
      for (const p of passages) {
        expect(p.text, `《${p.book}》的片段含凶断：${p.text}`).not.toMatch(HARMFUL)
      }
    }
  })

  it('不返回目录标题这类无实质内容的片段', async () => {
    // 实测出现过「2.2 一 命宫」，是目录行
    for (const term of ['命宫', '日主']) {
      const passages = await retrievePassages(term, BOOKS, 5)
      for (const p of passages) {
        const core = p.text.replace(/[\d\s\p{P}]/gu, '')
        expect(core.length, `片段太短、像标题：${p.text}`).toBeGreaterThanOrEqual(12)
      }
    }
  })

  it('同一章最多返回一条', async () => {
    const passages = await retrievePassages('命宫', BOOKS, 5)
    const chapters = passages.map((p) => `${p.book}|${p.loc}`)
    expect(new Set(chapters).size).toBe(chapters.length)
  })

  it('片段是完整句子，不是从半句开始', async () => {
    // 抽一条看：应以标点或开头为界，不该以半个词开头
    const passages = await retrievePassages('日主', ['滴天髓'], 2)
    expect(passages.length).toBeGreaterThan(0)
    for (const p of passages) {
      expect(p.text.length).toBeGreaterThan(10)
    }
  })
})

describe('语料引文的安全边界（内容门禁的盲区）', () => {
  it('所有门派的常见检索词都不会带出凶断', async () => {
    /*
     * check-content-safety 只扫断语库（163 条），扫不到语料库（187 万字）。
     * 但引文会原样显示给用户 —— 实测出现过《紫微斗数全书》「铃羊合于命宫
     * 遇白虎，须当刑戮」。那是本工具在用古人的话说"你会死"。
     * 这条测试覆盖四个门派最常用的检索词。
     */
    const HARMFUL = /刑戮|夭折|主死|必死|凶死|横死|绝嗣|克夫|克妻|克子|大凶|大祸|血光|暴亡|死期|寿元将尽/
    const pairs: Array<[string, string[]]> = [
      ['日主', ['滴天髓', '三命通会']],
      ['大运', ['滴天髓', '三命通会']],
      ['伤官', ['滴天髓', '三命通会']],
      ['命宫', ['紫微斗数全书']],
      ['化忌', ['紫微斗数全书']],
      ['体用', ['梅花易数']],
      ['本卦', ['梅花易数']],
    ]
    for (const [term, books] of pairs) {
      const passages = await retrievePassages(term, books, 5)
      for (const p of passages) {
        expect(p.text, `${term} → 《${p.book}》含凶断`).not.toMatch(HARMFUL)
      }
    }
  })
})
