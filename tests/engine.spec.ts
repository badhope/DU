import { describe, expect, it } from 'vitest'
import { extractFeatures, type RawContext } from '../src/engine/features'
import { SEED } from '../src/engine/statements'
import { evaluate, hashSeed, match } from '../src/engine/match'

const ctx = (over: Partial<RawContext>): RawContext => ({
  nowYear: 2026,
  domain: 'general',
  ...over,
})

describe('共鸣引擎', () => {
  it('require 未满足的条目必须被淘汰，不得靠文案蒙混', () => {
    const f = extractFeatures(ctx({ domain: 'love', nowYear: 2026 }))
    const study = SEED.find((s) => s.id === 'study-ask-01')!
    expect(evaluate(study, f)).toBeNull() // 学生向断语不能出现在非学生场景
  })

  it('真实信号进入 reasons，可解释', () => {
    const f = extractFeatures(ctx({ domain: 'love', birthYear: 1995, hour: 1 }))
    const hit = match(SEED, f, { n: 5, seed: hashSeed('x') })
    const trust = hit.find((m) => m.st.id === 'love-ask-01')
    expect(trust).toBeDefined()
    expect(trust!.reasons).toContain('domain:love')
    expect(trust!.signal).toBeGreaterThan(0)
  })

  it('一次输出里高基率泛谈至多一条', () => {
    for (const d of ['career', 'love', 'study', 'health', 'wealth', 'general'] as const) {
      for (let seed = 0; seed < 12; seed++) {
        const f = extractFeatures(ctx({ domain: d, birthYear: 1990, hour: 23 }))
        const out = match(SEED, f, { n: 6, seed })
        expect(out.filter((m) => m.generic).length).toBeLessThanOrEqual(1)
      }
    }
  })

  it('负面断语必须给出路（action），否则不入选', () => {
    const f = extractFeatures(ctx({ domain: 'general', birthYear: 1970 }))
    const out = match(SEED, f, { n: 10, seed: 7 })
    for (const m of out) {
      if (m.st.polarity === 'tough') expect(m.st.action).toBeTruthy()
    }
    // 库里存在无 action 的 tough 条目时，它永远不该出现
    const bad = {
      id: 'tough-no-action',
      text: '测试用：一句纯恐吓',
      domain: ['general'],
      baseRate: 0.2,
      polarity: 'tough' as const,
    }
    expect(match([...SEED, bad], f, { n: 10, seed: 7 }).some((m) => m.st.id === 'tough-no-action')).toBe(false)
  })

  it('同输入同种子结果可复现（便于测试与分享）', () => {
    const f = extractFeatures(ctx({ domain: 'career', birthYear: 1993, hour: 14 }))
    const s = hashSeed('a|career|1993')
    expect(match(SEED, f, { n: 4, seed: s }).map((m) => m.st.id)).toEqual(
      match(SEED, f, { n: 4, seed: s }).map((m) => m.st.id),
    )
  })

  it('年龄驱动的条目只出现在对应年龄段', () => {
    const fOld = extractFeatures(ctx({ domain: 'health', birthYear: 1965 }))
    const fYoung = extractFeatures(ctx({ domain: 'health', birthYear: 2005 }))
    const ageStmt = SEED.find((s) => s.id === 'age-45-01')!
    const old = evaluate(ageStmt, fOld)
    expect(old).not.toBeNull()
    expect(evaluate(ageStmt, fYoung)).toBeNull()
    expect(old!.signal).toBeGreaterThan(0.2)
  })

  it('已看过的条目被降权', () => {
    const f = extractFeatures(ctx({ domain: 'love', birthYear: 1995 }))
    const first = match(SEED, f, { n: 3, seed: 42 }).map((m) => m.st.id)
    const second = match(SEED, f, { n: 3, seed: 42, seen: first }).map((m) => m.st.id)
    expect(second.filter((id) => first.includes(id)).length).toBeLessThan(3)
  })

  it('深夜提问触发时段线索', () => {
    const f = extractFeatures(ctx({ domain: 'general', hour: 1 }))
    expect(f).toHaveProperty('time:late-night')
    const out = match(SEED, f, { n: 6, seed: 1 })
    expect(out.some((m) => m.st.id === 'late-night-01')).toBe(true)
  })

  it('每条命中都带出处', () => {
    const f = extractFeatures(ctx({ domain: 'career', birthYear: 1990 }))
    for (const m of match(SEED, f, { n: 10, seed: 3 })) {
      expect(m.st.source).toBeDefined()
      expect(m.st.source!.kind).toMatch(/canon|psych|observation/)
    }
  })
})
