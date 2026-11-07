import { describe, expect, it } from 'vitest'
import { ask } from '@/runtime'
import type { ReadingDomain } from '@/contract/reading'
import { readQuestion } from '@/engine/understand'
import { adviceFor, ADVICE_DOMAINS, adviceCount } from '@/engine/advice'

const BIRTH = { date: '1990-06-15', time: '08:30', gender: 'female' as const }

async function answerOf(masterId: 'ziping' | 'meihua' | 'ziwei', question: string, domain: ReadingDomain = 'career') {
  const m = await ask({
    question,
    domain,
    birth: BIRTH,
    masterIds: [masterId, masterId === 'ziping' ? 'meihua' : 'ziping'],
    askedAt: 1_700_000_000_000,
  })
  return m.answers.find((a) => a.masterId === masterId)!
}

describe('门派各说各的系统语言', () => {
  it('三个门派在同一问题上给出完全不同的断语', async () => {
    const q = '我应该接受北京的工作还是留在成都'
    const bazi = await answerOf('ziping', q)
    const meihua = await answerOf('meihua', q)
    const ziwei = await answerOf('ziwei', q)

    const duanOf = (a: typeof bazi) => a.sections.find((s) => s.key === 'duan')!.lines.join('\n')
    const b = duanOf(bazi)
    const m = duanOf(meihua)
    const z = duanOf(ziwei)

    // 各自出现本门术语，且不出现别门的
    expect(b).toMatch(/日主|十神|大运|伤官|偏印|正官|七杀/)
    expect(b).not.toMatch(/本卦|互卦|变卦|动爻/)
    expect(b).not.toMatch(/命宫|身宫|大限|化禄|化忌/)

    expect(m).toMatch(/本卦|变卦|动爻|体|用/)
    expect(m).not.toMatch(/日主|十神|大运/)

    expect(z).toMatch(/命宫|身宫|大限|化禄|化权|化科|化忌/)
    expect(z).not.toMatch(/本卦|变卦|日主|十神/)

    // 三份内容互不相同
    expect(new Set([b, m, z]).size).toBe(3)
  })

  it('断语引用用户自己的选项，而不是泛泛而谈', async () => {
    const a = await answerOf('ziping', '我应该接受北京的工作还是留在成都')
    const text = a.sections.find((s) => s.key === 'duan')!.lines.join('\n')
    expect(text).toContain('北京')
    expect(text).toContain('成都')
  })
})

describe('不同问题得到不同内容', () => {
  it('城市选择 / 股权分配 / 考研就业 三者断语不相同', async () => {
    const qs = [
      '我应该接受北京的工作还是留在成都',
      '我和合伙人股权怎么分比较合理',
      '下个月考研还是直接工作',
    ]
    const texts: string[] = []
    for (const q of qs) {
      const a = await answerOf('ziping', q)
      texts.push(a.sections.find((s) => s.key === 'duan')!.lines.join('\n'))
    }
    expect(new Set(texts).size, '三个不同问题不该拿到同样的断语').toBe(3)
  })

  it('同一问题反复问，读象部分保持稳定（盘面没变，说法就不该变）', async () => {
    const q = '我应该接受北京的工作还是留在成都'
    const a = await answerOf('ziping', q)
    const b = await answerOf('ziping', q)
    expect(a.sections.find((s) => s.key === 'duan')!.lines).toEqual(
      b.sections.find((s) => s.key === 'duan')!.lines,
    )
  })
})

describe('领域化行动建议', () => {
  it('每个领域都有至少 3 条建议', () => {
    for (const d of ADVICE_DOMAINS) {
      expect(adviceCount(d), `${d} 建议不足`).toBeGreaterThanOrEqual(3)
    }
  })

  it('不同领域给出不同建议', () => {
    const q = readQuestion('我要不要换工作')
    const picks = new Set(ADVICE_DOMAINS.map((d) => adviceFor(d, q, 0)))
    // 7 个领域里至少要有 5 种不同建议，否则等于没分化
    expect(picks.size).toBeGreaterThanOrEqual(5)
  })

  it('建议内容属于该领域，不是放之四海皆准的套话', () => {
    const q = readQuestion('我要不要换工作')
    const career = adviceFor('career', q, 0)
    const love = adviceFor('love', q, 0)
    const health = adviceFor('health', q, 0)

    expect(career).not.toBe(love)
    expect(career).not.toBe(health)
    // 旧的通用句不该再作为主建议出现
    for (const t of [career, love, health]) {
      expect(t).not.toContain('把下一步缩成一个本周内可完成')
    }
  })

  it('二选一问题优先给带条件的建议', () => {
    const q = readQuestion('下个月考研还是直接工作')
    expect(q.kind).toBe('either-or')
    const t = adviceFor('study', q, 0)
    // study 领域的二选一专用建议讲的是"各做一个最小验证"
    expect(t).toContain('最小验证')
  })
})

describe('读象路径不能丢掉引文能力', () => {
  it('三个门派各自带出本门典籍原文，而不是"语料中没有匹配"', async () => {
    const q = '我应该接受北京的工作还是留在成都'
    for (const id of ['ziping', 'meihua', 'ziwei'] as const) {
      const a = await answerOf(id, q)
      const ju = a.sections.find((s) => s.key === 'ju')
      expect(ju, `${id} 缺少依据小节`).toBeDefined()
      const text = ju!.lines.join('\n')
      expect(text).not.toContain('没有与本次问题直接匹配的引文')
      expect(text).toMatch(/《.+?》/)
      // 引文必须是已核状态
      expect(a.citations.length).toBeGreaterThan(0)
      expect(a.citations.every((c) => c.verification === 'verified')).toBe(true)
    }
  })

  it('每个门派引用的是自己的书', async () => {
    const q = '我应该接受北京的工作还是留在成都'
    const bazi = await answerOf('ziping', q)
    const meihua = await answerOf('meihua', q)
    const ziwei = await answerOf('ziwei', q)

    /*
     * 不断言"第一条是哪本书"，而是断言"引用的书都属于本门"。
     *
     * 引文现在优先用检索到的相关片段（更贴这次的问题），门派总纲排在后面。
     * 子平的书目是滴天髓 / 三命通会，检索命中哪一本都可能；
     * 断言具体书名会让测试随语料检索结果漂移，那是在测实现而不是测约束。
     */
    const booksOf = (a: typeof bazi) => new Set(a.citations.map((c) => c.book))
    const baziBooks = booksOf(bazi)
    const meihuaBooks = booksOf(meihua)
    const ziweiBooks = booksOf(ziwei)

    // 每派至少引一本自己的书
    expect([...baziBooks].some((b) => b === '滴天髓' || b === '三命通会')).toBe(true)
    expect([...meihuaBooks].some((b) => b === '梅花易数' || b === '京氏易传' || b === '焦氏易林')).toBe(true)
    expect(ziweiBooks.has('紫微斗数全书')).toBe(true)

    // 不能串门：子平不引紫微的书，紫微不引八字书
    expect(ziweiBooks.has('滴天髓')).toBe(false)
    expect(baziBooks.has('紫微斗数全书')).toBe(false)
  })
})

describe('紫微也要回指具体问题', () => {
  it('两个不同问题，紫微的断语必须不同', async () => {
    const a = await answerOf('ziwei', '我和合伙人股权怎么分比较合理')
    const b = await answerOf('ziwei', '下个月考研还是直接工作')
    const t = (x: typeof a) => x.sections.find((s) => s.key === 'duan')!.lines.join('\n')
    expect(t(a), '紫微对不同问题给了同样的四条，说明没回指问题').not.toBe(t(b))
  })

  it('紫微断语里出现用户问的对象', async () => {
    const a = await answerOf('ziwei', '我和合伙人股权怎么分比较合理')
    const text = a.sections.find((s) => s.key === 'duan')!.lines.join('\n')
    expect(text).toMatch(/股权|合伙人/)
  })
})

describe('开放式问题也必须回指', () => {
  it('"男朋友不回消息"这类问题第一句要点名对象', async () => {
    const a = await answerOf('meihua', '我男朋友最近总是不回消息', 'love')
    const first = a.sections.find((s) => s.key === 'duan')!.lines[1]
    expect(first).toContain('男朋友')
  })

  it('"这个月适合买房吗"要点到买房', async () => {
    const a = await answerOf('ziping', '这个月适合买房吗', 'wealth')
    const first = a.sections.find((s) => s.key === 'duan')!.lines[1]
    expect(first).toContain('买房')
  })
})
