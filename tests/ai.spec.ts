import { describe, expect, it } from 'vitest'
import { redactConfig } from '@/ai/client'
import { applyProviderPreset, DEFAULT_AI_CONFIG } from '@/ai/config'
import { parseAnswer, parseSections } from '@/ai/parse'
import { buildSystemPrompt } from '@/ai/prompt'
import { masterById } from '@/masters/registry'

describe('AI 透明边界', () => {
  it('prompt 包含输出协议与安全边界，但不接收 key', () => {
    const master = masterById('ziping')!
    const prompt = buildSystemPrompt(master, [], [])
    expect(prompt).toContain('不得编造书名')
    expect(prompt).toContain('## 盘')
    expect(prompt).not.toContain('sk-')
  })

  it('结构化回答能解析断语、引用和带日期断言', () => {
    const text = ['## 盘', '- 日主：丙火', '## 断', '先看事实。', '## 据', '> 《滴天髓》通神论：「行之始而進」', '## 验', '- [2026-12-31] 回看一次具体行动', '## 行', '本周完成一个小动作。'].join('\n')
    const answer = parseAnswer(text, 'ziping', [], 'ai', 'match-1', 100)
    expect(parseSections(text)).toHaveLength(5)
    expect(answer.citations).toHaveLength(1)
    expect(answer.claims[0]?.dueAt).toBe(new Date('2026-12-31T23:59:59').getTime())
  })

  it('协议切换应用官方 endpoint 与默认模型', () => {
    const next = applyProviderPreset({ ...DEFAULT_AI_CONFIG, apiKey: '' }, 'anthropic')
    expect(next.baseUrl).toBe('https://api.anthropic.com/v1')
    expect(next.model).toBe('claude-3-5-haiku-latest')
  })

  it('配置脱敏不返回原始 key', () => {
    const redacted = redactConfig({ provider: 'openai', baseUrl: 'https://example.test/v1', model: 'm', apiKey: 'sk-secret-value', persistKey: false, temperature: 0.7, maxTokens: 100 })
    expect(redacted.apiKey).toBe('[已隐藏]')
    expect(JSON.stringify(redacted)).not.toContain('sk-secret-value')
  })
})
