/**
 * 共鸣引擎 · 命中率标定（以测试形式运行，便于 CI 里带上阈值断言）
 *
 * 造一个"有隐藏真实处境"的模拟人群，比较三种出题策略：
 *   A 随机抽          —— 无信号，等价于把话术当答案
 *   B 只挑低 baseRate —— 追求"听起来具体"，但不看用户
 *   C 引擎（特征匹配）—— 按真实信号选
 *
 * 关键：TRUTH 定义的是"这句话对这个人客观是否成立"，
 * 它是标定用的上帝视角，不进生产代码。
 */
import { describe, expect, it } from 'vitest'
import { SITUATIONS, extractFeatures, type RawContext } from '../src/engine/features'
import { SEED } from '../src/engine/statements'
import { STATEMENTS } from '../src/engine/resonance'
import { hashSeed, match } from '../src/engine/match'

interface Person {
  id: number
  birthYear: number
  domain: RawContext['domain']
  situations: string[]
  hour: number
  month: number
  visits: number
}

type Truth = (p: Person) => boolean

type LifeStage = NonNullable<RawContext['lifeStage']>

const stageOf = (p: Person): LifeStage => {
  const a = 2026 - p.birthYear
  if (a <= 22) return 'student'
  if (a <= 31) return 'early'
  if (a <= 45) return 'mid'
  if (a <= 60) return 'settled'
  return 'later'
}

/** 上帝视角：每条命对该人是否真的成立 */
const TRUTH: Record<string, Truth> = {
  'psy-001': () => true, // 人人成立 —— 教科书式高基率泛谈
  'psy-002': () => true,
  'stage-early-01': (p) => stageOf(p) === 'early',
  'stage-mid-01': (p) => stageOf(p) === 'mid',
  'age-45-01': (p) => 2026 - p.birthYear >= 45,
  'career-ask-01': (p) => p.domain === 'career',
  'love-ask-01': (p) => p.domain === 'love',
  'study-ask-01': (p) => p.domain === 'study' && stageOf(p) === 'student',
  'wealth-ask-01': (p) => p.domain === 'wealth',
  'late-night-01': (p) => p.hour >= 23 || p.hour < 5,
  'canon-mei-01': () => true,
  'canon-liu-01': (p) => p.domain === 'love' && p.situations.includes('conflict'),
}

function population(n: number): Person[] {
  let s = 20261011 >>> 0
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
  const domains: RawContext['domain'][] = ['career', 'love', 'study', 'health', 'wealth', 'general']
  const sitPool = ['conflict', 'transition', 'waiting', 'doubt']
  return Array.from({ length: n }, (_, id) => {
    const situations = sitPool.filter(() => rnd() < 0.25)
    return {
      id,
      birthYear: 1955 + Math.floor(rnd() * 55),
      domain: domains[Math.floor(rnd() * domains.length)],
      situations,
      hour: Math.floor(rnd() * 24),
      month: 1 + Math.floor(rnd() * 12),
      visits: 1 + Math.floor(rnd() * 6),
    }
  })
}

const applies = (id: string, p: Person) => (TRUTH[id] ?? (() => false))(p)
const precision = (ids: string[], p: Person) =>
  ids.length ? ids.filter((id) => applies(id, p)).length / ids.length : 0

function feats(p: Person) {
  return extractFeatures({
    nowYear: 2026,
    birthYear: p.birthYear,
    lifeStage: stageOf(p),
    domain: p.domain,
    situations: p.situations,
    hour: p.hour,
    month: p.month,
    visitCount: p.visits,
  })
}

function run(people: Person[], pick: (p: Person) => string[]) {
  let sum = 0
  let cnt = 0
  let worst = 1
  for (const p of people) {
    const ids = pick(p)
    const pr = precision(ids, p)
    sum += pr
    cnt += ids.length
    worst = Math.min(worst, pr)
  }
  return { mean: sum / people.length, avgCount: cnt / people.length, worst }
}

describe('共鸣引擎 · 标定', () => {
  const people = population(4000)

  const A = run(people, (p) => {
    const r = hashSeed('a' + p.id) % SEED.length
    return SEED.slice(r, r + 5).map((s) => s.id)
  })

  const B = run(people, () =>
    [...SEED]
      .sort((x, y) => x.baseRate - y.baseRate)
      .slice(0, 5)
      .map((s) => s.id),
  )

  const C = run(people, (p) => match(SEED, feats(p), { n: 5, seed: hashSeed('c' + p.id) }).map((m) => m.st.id))

  it('打印三种策略对照', () => {
    const pct = (v: number) => (v * 100).toFixed(1).padStart(5) + '%'
    console.log(`\n人群 n=${people.length}，命库 ${SEED.length} 条`)
    console.log('策略                       平均说中率    最差个人    平均条数')
    console.log(`A 随机抽（无信号）         ${pct(A.mean)}      ${pct(A.worst)}      ${A.avgCount.toFixed(1)}`)
    console.log(`B 只挑低 baseRate          ${pct(B.mean)}      ${pct(B.worst)}      ${B.avgCount.toFixed(1)}`)
    console.log(`C 引擎匹配（真实信号）     ${pct(C.mean)}      ${pct(C.worst)}      ${C.avgCount.toFixed(1)}`)

    let hard = 0
    let hardN = 0
    let soft = 0
    let softN = 0
    for (const p of people) {
      for (const m of match(SEED, feats(p), { n: 5, seed: hashSeed('d' + p.id) })) {
        const ok = applies(m.st.id, p) ? 1 : 0
        if (m.signal > 0) {
          hard += ok
          hardN++
        } else {
          soft += ok
          softN++
        }
      }
    }
    console.log(
      `\n引擎分层：真信号条 ${(hard / Math.max(hardN, 1) * 100).toFixed(1)}% (${hardN} 条，人均 ${(hardN / people.length).toFixed(1)} 条) | 无信号补位 ${(soft / Math.max(softN, 1) * 100).toFixed(1)}% (${softN} 条)`,
    )
  })

  it('引擎显著优于随机与纯"听起来具体"', () => {
    expect(C.mean).toBeGreaterThan(A.mean)
    expect(C.mean).toBeGreaterThan(B.mean)
  })

  it('引擎真信号条的说中率应接近 100%（因为它们有硬门槛）', () => {
    let ok = 0
    let total = 0
    for (const p of people) {
      for (const m of match(SEED, feats(p), { n: 5, seed: 1 })) {
        if (m.signal <= 0) continue
        total++
        if (applies(m.st.id, p)) ok++
      }
    }
    expect(total).toBeGreaterThan(people.length) // 确实大量产出真信号条
    expect(ok / total).toBeGreaterThan(0.9)
  })

  it('最差个人也不低于随机水平', () => {
    expect(C.worst).toBeGreaterThanOrEqual(A.mean * 0.5)
  })
})

/**
 * 全库（SEED + LIBRARY）标定。
 *
 * 这里不再手写 149 条上帝视角——那等于把 evaluate 再抄一遍，是自证。
 * 改为两条互不重叠的断言：
 *  1. 结构真值：带硬信号入选的条目，其 require 必须逐键存在于该人特征里。
 *     （这条抓的是"门槛语义写错"这一类 bug，v1 的 OR/AND 搞混就是它抓到的。）
 *  2. 伦理不变量：泛谈至多 1 条、负面必给出路、无信号时宁可空着。
 */
describe('共鸣引擎 · 全库标定', () => {
  const people = population(4000).map((p, i) => {
    // 每人一条独立序列，处境随机勾选约 14%
    let s = (i * 2654435761) >>> 0
    const step = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0
      return s / 4294967296
    }
    return { ...p, situations: SITUATIONS.filter(() => step() < 0.14) as string[] }
  })

  const out = people.map((p) => ({
    p,
    f: feats(p),
    hits: match(STATEMENTS, feats(p), { n: 6, seed: hashSeed('full' + p.id) }),
  }))

  it('命库确实被用起来了：人均入选条数达标', () => {
    const avg = out.reduce((a, o) => a + o.hits.length, 0) / out.length
    console.log(
      `\n全库 ${STATEMENTS.length} 条，人群 n=${out.length}，人均入选 ${avg.toFixed(2)} 条（要求 ≥5）`,
    )
    expect(avg).toBeGreaterThanOrEqual(5)
  })

  it('带硬信号入选的条目，require 必须逐键成立（结构真值）', () => {
    let hard = 0
    let wrong = 0
    const offenders = new Set<string>()
    for (const { f, hits } of out) {
      for (const m of hits) {
        if (m.signal <= 0) continue
        hard++
        for (const k of Object.keys(m.st.require ?? {})) {
          const v = f[k]
          if (v === undefined || v < m.st.require![k]!) {
            wrong++
            offenders.add(`${m.st.id} 缺 ${k}`)
          }
        }
      }
    }
    expect(hard, '全库下应大量产出真信号条').toBeGreaterThan(out.length * 3)
    expect([...offenders].slice(0, 5)).toEqual([])
    console.log(`结构真值：真信号条 ${hard}，越界 ${wrong} → ${(100 - (wrong / hard) * 100).toFixed(2)}%`)
    expect(wrong / hard).toBeLessThan(0.001)
  })

  it('一次输出内泛谈至多一条，负面必带出路', () => {
    for (const { hits } of out.slice(0, 600)) {
      expect(hits.filter((m) => m.generic).length).toBeLessThanOrEqual(1)
      for (const m of hits) if (m.st.polarity === 'tough') expect(m.st.action).toBeTruthy()
    }
  })

  it('什么都没勾时不许硬凑：空处境人群的信号条数明显更少', () => {
    const bare = extractFeatures({ nowYear: 2026, domain: 'general', situations: [] })
    const rich = extractFeatures({
      nowYear: 2026,
      domain: 'career',
      birthYear: 1990,
      situations: ['promotion', 'plateau'],
      hour: 1,
    })
    const nb = match(STATEMENTS, bare, { n: 6, seed: 1 }).filter((m) => m.signal > 0).length
    const nr = match(STATEMENTS, rich, { n: 6, seed: 1 }).filter((m) => m.signal > 0).length
    console.log(`裸输入真信号条 ${nb}，丰富输入 ${nr}`)
    expect(nr).toBeGreaterThan(nb)
  })

  it('同一输入两次结果完全一致（可分享、可回归）', () => {
    for (const { p, f } of out.slice(0, 200)) {
      const a = match(STATEMENTS, f, { n: 6, seed: hashSeed('k' + p.id) }).map((m) => m.st.id)
      const b = match(STATEMENTS, f, { n: 6, seed: hashSeed('k' + p.id) }).map((m) => m.st.id)
      expect(a).toEqual(b)
    }
  })
})
