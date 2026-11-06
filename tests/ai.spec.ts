import { describe, expect, it, vi } from 'vitest'
import { localAnswer } from '@/ai/offline'
import { parseAnswer, parseSections } from '@/ai/parse'
import type { ChartFact } from '@/contract/reading'
import { masterById } from '@/masters/registry'

const fact: ChartFact = {
  kind: 'meihua',
  title: '本地事实',
  summary: '本卦泽火革',
  fields: { ben: '泽火革', moving: 1 },
}

describe('本地模式透明边界', () => {
  it('本地规则回答包含事实、依据、可验断言和不上传说明', () => {
    const answer = localAnswer(masterById('meihua')!, { question: '我是否应该主动寻找新机会？', domain: 'career', askedAt: 1_735_689_600_000 }, [fact], 1)
    expect(answer.mode).toBe('local')
    expect(answer.fallbackReason).toContain('本地规则模式')
    expect(answer.fallbackReason).toContain('不上传')
    expect(answer.sections.map((section) => section.key)).toEqual(['pan', 'duan', 'ju', 'yan', 'xing'])
    expect(answer.citations.every((citation) => citation.verification === 'verified')).toBe(true)
  })

  it('结构化回答能解析断语、引用和带日期断言', () => {
    const text = ['## 盘', '- 日主：丙火', '## 断', '先看事实。', '## 据', '> 《滴天髓》通神论：「行之始而進」', '## 验', '- [2026-12-31] 回看一次具体行动', '## 行', '本周完成一个小动作。'].join('\n')
    const answer = parseAnswer(text, 'ziping', [], 'local', 'match-1', 100)
    expect(parseSections(text)).toHaveLength(5)
    expect(answer.citations).toHaveLength(1)
    expect(answer.claims[0]?.dueAt).toBe(new Date('2026-12-31T23:59:59').getTime())
  })

  it('本地回答不依赖网络：fetch 失败仍可生成', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network disabled') }))
    const answer = localAnswer(masterById('ziping')!, { question: '测试问题', domain: 'general', askedAt: 1_735_689_600_000 }, [fact], 1)
    expect(answer.mode).toBe('local')
    expect(answer.fallbackReason).toContain('不上传')
  })
})

describe('盘面字段标签', () => {
  const ziweiFact: ChartFact = {
    kind: 'ziwei',
    title: '紫微斗数事实层',
    summary: '土五局，命宫在寅，12 宫',
    fields: {
      solarDate: '1990-06-15',
      lunarDate: '农历庚午年五月廿三',
      fiveElementsClass: '土五局',
      mutagen: ['巨门化禄', '太阳化权'],
      currentDecadal: '田宅宫 35–44 岁',
      palaces: ['命宫(寅)', '兄弟(丑)'],
    },
  }

  it('界面正文里不出现英文的字段键名', () => {
    const answer = localAnswer(
      masterById('ziwei')!,
      { question: '我是否应该主动寻找新机会？', domain: 'career', askedAt: 1_735_689_600_000 },
      [ziweiFact],
      1,
    )
    const pan = answer.sections.find((section) => section.key === 'pan')
    expect(pan).toBeDefined()
    const text = pan!.lines.join('\n')

    // 断言的是"具体中文标签出现了"，不是"大概没有英文"
    expect(text).toContain('当前大限：田宅宫 35–44 岁')
    expect(text).toContain('四化：巨门化禄、太阳化权')
    expect(text).toContain('五行局：土五局')
    // 已知的英文键一个都不能漏进正文
    for (const key of ['currentDecadal', 'solarDate', 'fiveElementsClass', 'mutagen', 'palaces']) {
      expect(text, `字段键 ${key} 不该出现在用户可见正文里`).not.toContain(key)
    }
  })

  it('新增内核的未登记字段保留原名，而不是被静默丢弃', () => {
    const futureFact: ChartFact = {
      kind: 'meihua',
      title: '测试',
      summary: '测试摘要',
      fields: { brandNewField: '某个值' },
    }
    const answer = localAnswer(
      masterById('meihua')!,
      { question: '测试问题', domain: 'general', askedAt: 1_735_689_600_000 },
      [futureFact],
      1,
    )
    // 宁可露出英文键让人发现，也不要吞掉一条盘面事实
    expect(answer.sections.find((s) => s.key === 'pan')!.lines.join('\n')).toContain('brandNewField：某个值')
  })
})
