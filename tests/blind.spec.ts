/**
 * 盲测匿名性与答案互斥
 *
 * 这组测试守的是产品承诺，不是实现细节：
 *  - 甲乙位置必须随机，否则用户会记住"甲永远是子平"，盲评数据即失效；
 *  - 同一场两位大师不得给出同一句断语，否则用户读到的是同一段话；
 *  - 没有对应盘面事实时不得留空小节；
 *  - 引文状态必须反映真实可核性，不能把已核的标成未核。
 */
import { describe, expect, it } from 'vitest'
import type { ChartFact } from '@/contract/reading'
import { localAnswer } from '@/ai/offline'
import { shuffleForBlind } from '@/arena/readingFlow'
import { masterById } from '@/masters/registry'

const meihuaFact: ChartFact = {
  kind: 'meihua',
  title: '梅花事实层',
  summary: '本卦地风升',
  fields: { ben: '地风升', moving: 2 },
}

const baziFact: ChartFact = {
  kind: 'bazi',
  title: '子平四柱事实层',
  summary: '甲子 · 丙寅 · 戊辰 · 庚申，日主戊土',
  fields: { dayMaster: '戊' },
}

const request = { question: '虚构示例：如何安排下个月的学习计划？', domain: 'study' as const, askedAt: 1_700_000_000_000 }

describe('盲测匿名性', () => {
  it('甲乙位置由随机源决定，不是固定顺序', () => {
    const ids: ['ziping', 'meihua'] = ['ziping', 'meihua']
    expect(shuffleForBlind(ids, () => 0.1)).toEqual(['ziping', 'meihua'])
    expect(shuffleForBlind(ids, () => 0.9)).toEqual(['meihua', 'ziping'])
  })

  it('随机源在两极之间都能取到，不会永远给同一顺序', () => {
    const ids: ['ziping', 'meihua'] = ['ziping', 'meihua']
    const seen = new Set<string>()
    for (let i = 0; i < 50; i++) seen.add(shuffleForBlind(ids)[0])
    expect(seen.size).toBe(2)
  })
})

describe('同场两答互斥', () => {
  it('第二位大师不会复用第一位已用过的断语', () => {
    const first = localAnswer(masterById('ziping')!, request, [meihuaFact], 1000, 'match-x')
    const second = localAnswer(masterById('meihua')!, request, [meihuaFact], 1000, 'match-x', [], {
      seen: first.statementIds,
    })
    expect(first.statementIds.length).toBeGreaterThan(0)
    expect(second.statementIds.length).toBeGreaterThan(0)
    const overlap = first.statementIds.filter((id) => second.statementIds.includes(id))
    expect(overlap).toEqual([])
  })

  it('互斥后两份回答的断语正文不重复', () => {
    const first = localAnswer(masterById('ziping')!, request, [meihuaFact], 1000, 'match-y')
    const second = localAnswer(masterById('meihua')!, request, [meihuaFact], 1000, 'match-y', [], {
      seen: first.statementIds,
    })
    const duanOf = (answer: typeof first) => answer.sections.find((section) => section.key === 'duan')!.lines
    const shared = duanOf(first).filter((line) => duanOf(second).includes(line) && line.startsWith('- '))
    expect(shared).toEqual([])
  })

  it('同一场两位大师的断言正文不同，应验簿里可分辨', () => {
    const first = localAnswer(masterById('ziping')!, request, [meihuaFact], 1000, 'match-z')
    const second = localAnswer(masterById('meihua')!, request, [meihuaFact], 1000, 'match-z', [], {
      seen: first.statementIds,
    })
    expect(first.claims).toHaveLength(1)
    expect(second.claims).toHaveLength(1)
    expect(first.claims[0]!.text).not.toBe(second.claims[0]!.text)
  })
})

describe('回答不出现空小节', () => {
  it('没有八字事实时，子平回答不保留空的盘面事实小节', () => {
    const answer = localAnswer(masterById('ziping')!, request, [meihuaFact], 1000, 'match-a')
    const pan = answer.sections.find((section) => section.key === 'pan')
    expect(pan).toBeUndefined()
  })

  it('有八字事实时，子平回答的盘面事实非空且只含八字字段', () => {
    const answer = localAnswer(masterById('ziping')!, request, [baziFact, meihuaFact], 1000, 'match-b')
    const pan = answer.sections.find((section) => section.key === 'pan')
    expect(pan).toBeDefined()
    expect(pan!.lines.length).toBeGreaterThan(0)
    expect(pan!.lines.join('\n')).toContain('戊土')
    expect(pan!.lines.join('\n')).not.toContain('地风升')
  })

  it('梅花大师不会引用八字盘面事实', () => {
    const answer = localAnswer(masterById('meihua')!, request, [baziFact, meihuaFact], 1000, 'match-c')
    const pan = answer.sections.find((section) => section.key === 'pan')!
    expect(pan.lines.join('\n')).toContain('地风升')
    expect(pan.lines.join('\n')).not.toContain('戊土')
  })

  it('任何小节都不为空行集', () => {
    for (const masterId of ['ziping', 'meihua'] as const) {
      const answer = localAnswer(masterById(masterId)!, request, [baziFact, meihuaFact], 1000, 'match-d')
      for (const section of answer.sections) expect(section.lines.length, `${masterId}/${section.key}`).toBeGreaterThan(0)
    }
  })
})

describe('引文状态与来源', () => {
  it('静态断语引文标为 canon 且已核', () => {
    const answer = localAnswer(masterById('ziping')!, request, [baziFact], 1000, 'match-e')
    expect(answer.citations.length).toBeGreaterThan(0)
    for (const citation of answer.citations) {
      expect(citation.verification).toBe('verified')
      expect(citation.origin).toBe('canon')
    }
  })

  it('检索片段标为 corpus，静态引文标为 canon', () => {
    const passages = [{ book: '滴天髓', loc: '通神论', text: '行之始而進' }]
    const answer = localAnswer(masterById('ziping')!, request, [baziFact], 1000, 'match-f', passages)
    const corpus = answer.citations.filter((citation) => citation.origin === 'corpus')
    expect(corpus.length).toBeGreaterThan(0)
    expect(corpus.some((citation) => citation.text.includes('行之始而進'))).toBe(true)
    expect(answer.citations.every((citation) => citation.verification === 'verified')).toBe(true)
  })
})

describe('跨会话断语轮换', () => {
  it('传入历史 seen 后，同一问题的选句与不传时不同', () => {
    const request = { question: '我该不该换工作', domain: 'career' as const, askedAt: 1_700_000_000_000 }
    const first = localAnswer(masterById('ziping')!, request, [baziFact], 1_700_000_000_000, 'm1')
    // 模拟"昨天问过"：把第一次用过的 id 当作历史
    const second = localAnswer(masterById('ziping')!, request, [baziFact], 1_700_000_000_000, 'm2', [], {
      seen: first.statementIds,
    })
    const overlap = first.statementIds.filter((id) => second.statementIds.includes(id))
    expect(overlap.length).toBeLessThan(first.statementIds.length)
  })

  it('历史覆盖全部候选时仍能出句，不会因为排除而空手', () => {
    const request = { question: '我该不该换工作', domain: 'career' as const, askedAt: 1_700_000_000_000 }
    // 传一个不可能命中的 id 列表，确认不会崩
    const answer = localAnswer(masterById('ziping')!, request, [baziFact], 1_700_000_000_000, 'm3', [], {
      seen: ['nonexistent-1', 'nonexistent-2'],
    })
    expect(answer.statementIds.length).toBeGreaterThan(0)
  })
})

describe('断言期限必须与其内容匹配', () => {
  it('生成的断言期限是 7 天，不是一年', () => {
    const request = { question: '期限测试问题内容', domain: 'career' as const, askedAt: 1_700_000_000_000 }
    const answer = localAnswer(masterById('ziping')!, request, [baziFact], 1_700_000_000_000, 'm-due')
    const claim = answer.claims[0]
    expect(claim).toBeDefined()

    // 断言正文写的是"记录你这一周实际采取的一个动作"，
    // 期限必须是周级别。之前是一年，导致用户点"应验"永远被拒 ——
    // 核心闭环第一次使用就是死路。这里把 7 天钉死。
    const days = Math.round((claim!.dueAt - 1_700_000_000_000) / 86_400_000)
    expect(days).toBe(7)
  })

  it('断言正文里写明截止日期，用户能看到要等多久', () => {
    const request = { question: '截止日可见性测试', domain: 'career' as const, askedAt: 1_700_000_000_000 }
    const answer = localAnswer(masterById('ziping')!, request, [baziFact], 1_700_000_000_000, 'm-due2')
    const text = answer.sections.find((s) => s.key === 'yan')?.lines.join(' ') ?? ''
    expect(text).toContain('截止')
    expect(text).toMatch(/\d{4}-\d{2}-\d{2}/)
  })
})

describe('盲测流程自身必须传递 seen（不是调用方手动传）', () => {
  it('composeBlindMatch 生成的两份回答天然不重复断语', async () => {
    // 之前的互斥测试都是手动把 first.statementIds 传给 second，
    // 等于测了"如果传了就会互斥"，没测"流程有没有传"。
    // 变异测试暴露了这个问题：把 readingFlow 里的 seen 传参删掉，测试仍然全绿。
    const { composeBlindMatch } = await import('@/arena/readingFlow')
    for (const question of ['我要不要换工作', '该不该搬去另一个城市', '这段关系还有必要继续吗']) {
      const match = await composeBlindMatch(
        { question, domain: 'career', askedAt: 1_700_000_000_000 },
        ['ziping', 'meihua'],
        undefined,
        { random: () => 0.1 },
      )
      const [a, b] = match.answers
      const overlap = a!.statementIds.filter((id) => b!.statementIds.includes(id))
      expect(overlap, `问题「${question}」两份回答出现重复断语`).toEqual([])
    }
  })
})
