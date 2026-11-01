import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BlindMatch } from '@/contract/reading'
import { emptyStats } from '@/arena/rating'
import { getArenaState, importArena, recordVote, resetArena, resolveClaim, saveClaims, saveMatch } from '@/arena/store'
import { runBlindMatch } from '@/arena/readingFlow'

const match = (): BlindMatch => ({ id: 'match-test-1', request: { question: '测试问题', domain: 'general', askedAt: 1 }, masterIds: ['ziping', 'meihua'], answers: [
  { id: 'a', masterId: 'ziping', mode: 'local', text: 'a', sections: [], facts: [], citations: [], claims: [], generatedAt: 1 },
  { id: 'b', masterId: 'meihua', mode: 'local', text: 'b', sections: [], facts: [], citations: [], claims: [], generatedAt: 1 },
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

  it('重复选择同一大师会被拒绝', async () => {
    await expect(runBlindMatch({ question: '测试问题', domain: 'general', askedAt: 1 }, ['ziping', 'ziping'])).rejects.toThrow('两位不同的大师')
  })

  it('未知应验不进入应验率分母，截止日前不能标记命中', () => {
    saveClaims([{ id: 'claim-test', masterId: 'ziping', text: '测试断言', dueAt: Date.now() + 86_400_000, createdAt: Date.now(), status: 'pending' }])
    expect(resolveClaim('claim-test', 'hit')).toBe(false)
    expect(resolveClaim('claim-test', 'unknown')).toBe(true)
    expect(getArenaState().stats.ziping.claimsResolved).toBe(0)
  })

  it('非法导入不会覆盖现有对局', () => {
    saveMatch(match())
    expect(importArena(JSON.stringify({ stats: {}, matches: [], claims: [] }))).toBe(false)
    expect(getArenaState().matches).toHaveLength(1)
  })

  it('网络不可用时仍完成两位 active 大师的本地盲测', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network disabled') }))
    const result = await runBlindMatch(
      { question: '我是否应该主动寻找新机会？', domain: 'career', askedAt: 1_735_689_600_000 },
      ['ziping', 'meihua'],
    )
    expect(result.answers).toHaveLength(2)
    expect(result.answers.every((answer) => answer.mode === 'local')).toBe(true)
    expect(getArenaState().matches).toHaveLength(1)
  })

  it('同一时刻的不同问题不会互相覆盖对局', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network disabled') }))
    const first = await runBlindMatch({ question: '我是否应该换工作？', domain: 'career', askedAt: 1_735_689_600_000 }, ['ziping', 'meihua'])
    const second = await runBlindMatch({ question: '这段关系是否需要暂缓？', domain: 'love', askedAt: 1_735_689_600_000 }, ['ziping', 'meihua'])
    expect(second.id).not.toBe(first.id)
    expect(second.id).not.toContain('换工作')
    expect(second.id).not.toContain('暂缓')
    expect(getArenaState().matches).toHaveLength(2)
  })
})
