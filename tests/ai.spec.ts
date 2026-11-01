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
