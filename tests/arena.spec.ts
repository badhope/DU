import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BlindMatch } from '@/contract/reading'
import { emptyStats } from '@/arena/rating'
import { getArenaState, importArena, recordVote, resetArena, saveMatch } from '@/arena/store'
import { runBlindMatch } from '@/arena/readingFlow'
import { DEFAULT_AI_CONFIG } from '@/ai/config'

const match = (): BlindMatch => ({ id: 'match-test-1', request: { question: '测试问题', domain: 'general', askedAt: 1 }, masterIds: ['ziping', 'meihua'], answers: [
  { id: 'a', masterId: 'ziping', mode: 'offline', text: 'a', sections: [], facts: [], citations: [], claims: [], generatedAt: 1 },
  { id: 'b', masterId: 'meihua', mode: 'offline', text: 'b', sections: [], facts: [], citations: [], claims: [], generatedAt: 1 },
], createdAt: 1 })

describe('盲测与台账存储', () => {
  beforeEach(() => { localStorage.clear(); resetArena() })

  it('同一 match id 重复投票只计一次', () => {
    saveMatch(match())
    expect(recordVote('match-test-1', 'a')).toBe(true)
    expect(recordVote('match-test-1', 'a')).toBe(false)
    const state = getArenaState()
    expect(state.stats.ziping.matches).toBe(1)
    expect(state.stats.meihua.matches).toBe(1)
  })

  it('清空后恢复 1500 初始分和空对局', () => {
    saveMatch(match())
    resetArena()
    const state = getArenaState()
    expect(state.matches).toHaveLength(0)
    expect(state.stats.ziping).toEqual(emptyStats('ziping'))
  })

  it('非法导入不会覆盖现有对局', () => {
    saveMatch(match())
    expect(importArena(JSON.stringify({ stats: {}, matches: [], claims: [] }))).toBe(false)
    expect(getArenaState().matches).toHaveLength(1)
  })

  it('无模型 Key 时完成两位 active 大师的离线盲测', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ books: [], totalChars: 0 }) })))
    const result = await runBlindMatch(
      { question: '我是否应该主动寻找新机会？', domain: 'career', askedAt: 1_735_689_600_000 },
      ['ziping', 'meihua'],
      { ...DEFAULT_AI_CONFIG, apiKey: '' },
    )
    expect(result.answers).toHaveLength(2)
    expect(result.answers.every((answer) => answer.mode === 'offline')).toBe(true)
    expect(getArenaState().matches).toHaveLength(1)
  })

  it('同一时刻的不同问题不会互相覆盖对局', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ books: [], totalChars: 0 }) })))
    const config = { ...DEFAULT_AI_CONFIG, apiKey: '' }
    const first = await runBlindMatch({ question: '我是否应该换工作？', domain: 'career', askedAt: 1_735_689_600_000 }, ['ziping', 'meihua'], config)
    const second = await runBlindMatch({ question: '这段关系是否需要暂缓？', domain: 'love', askedAt: 1_735_689_600_000 }, ['ziping', 'meihua'], config)
    expect(second.id).not.toBe(first.id)
    expect(getArenaState().matches).toHaveLength(2)
  })
})
