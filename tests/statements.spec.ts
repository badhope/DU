import { describe, expect, it } from 'vitest'
import { LIBRARY } from '../src/engine/statements.library'
import { SEED } from '../src/engine/statements'
import { SITUATIONS } from '../src/engine/features'

/* ── 合法特征键词表 ── */

const ALLOWED_DOMAINS = ['career', 'love', 'study', 'health', 'wealth', 'family', 'general']
const ALLOWED_STAGES = ['student', 'early', 'mid', 'settled', 'later']
const ALLOWED_AGES = ['teen', 'student', 'early', 'mid', 'settled', 'later']
const ALLOWED_SITS = [...SITUATIONS]
const ALLOWED_TIMES = ['late-night', 'morning', 'work-peak', 'midday', 'evening', 'night']
const ALLOWED_MOODS = ['reflective', 'wind-down']
const ALLOWED_SEASONS = ['spring', 'summer', 'autumn', 'winter']
const ALLOWED_LIFE = [
  'possible-graduation-or-early-career',
  'possible-partnership-decisions',
  'possible-career-plateau',
  'possible-parent-or-elder-care',
  'possible-health-awareness',
]
const ALLOWED_BEHAVIORS = ['repeat-visitor']

function isValidFeatureKey(key: string): boolean {
  if (ALLOWED_DOMAINS.some((d) => key === `domain:${d}`)) return true
  if (ALLOWED_STAGES.some((s) => key === `stage:${s}`)) return true
  if (ALLOWED_AGES.some((a) => key === `age:${a}`)) return true
  if (ALLOWED_SITS.some((s) => key === `sit:${s}`)) return true
  if (ALLOWED_TIMES.some((t) => key === `time:${t}`)) return true
  if (ALLOWED_MOODS.some((m) => key === `mood:${m}`)) return true
  if (ALLOWED_SEASONS.some((s) => key === `season:${s}`)) return true
  if (ALLOWED_LIFE.some((l) => key === `life:${l}`)) return true
  if (ALLOWED_BEHAVIORS.some((b) => key === `behavior:${b}`)) return true
  if (key.startsWith('resonated:')) return true
  if (key.startsWith('history:domain:')) return true
  return false
}

/* ── 合并 SEED + LIBRARY 用于唯一性检查 ── */
const ALL = [...SEED, ...LIBRARY]

describe('命库扩展不变量', () => {
  it('LIBRARY.length >= 110', () => {
    expect(LIBRARY.length).toBeGreaterThanOrEqual(110)
  })

  it('ID 在 LIBRARY 内部唯一，且不与 SEED 重复', () => {
    const libIds = LIBRARY.map((s) => s.id)
    const seedIds = new Set(SEED.map((s) => s.id))
    // 内部无重复
    expect(new Set(libIds).size).toBe(libIds.length)
    // 与 SEED 无交叉
    for (const id of libIds) {
      expect(seedIds.has(id), `LIBRARY id "${id}" 与 SEED 重复`).toBe(false)
    }
  })

  it('text 长度在 14–48 字符之间', () => {
    const bad = LIBRARY.filter((s) => {
      const len = [...s.text].length // 按 Unicode 码点计
      return len < 14 || len > 48
    })
    expect(
      bad.map((s) => `${s.id}(${[...s.text].length}字): "${s.text}"`),
    ).toEqual([])
  })

  it('polarity=tough 的条目必须有非空 action', () => {
    const bad = LIBRARY.filter(
      (s) => s.polarity === 'tough' && (!s.action || s.action.trim().length === 0),
    )
    expect(bad.map((s) => s.id)).toEqual([])
  })

  it('baseRate 在 (0, 1) 开区间', () => {
    const bad = LIBRARY.filter((s) => s.baseRate <= 0 || s.baseRate >= 1)
    expect(bad.map((s) => `${s.id}: ${s.baseRate}`)).toEqual([])
  })

  it('每条必须有 source，且 kind ∈ {canon, psych, observation}', () => {
    const bad = LIBRARY.filter(
      (s) => !s.source || !['canon', 'psych', 'observation'].includes(s.source.kind),
    )
    expect(bad.map((s) => s.id)).toEqual([])
  })

  it('require / boost / ban 的特征键必须来自合法词表', () => {
    const bad: string[] = []
    for (const s of LIBRARY) {
      const keys = [
        ...Object.keys(s.require ?? {}),
        ...Object.keys(s.boost ?? {}),
        ...(s.ban ?? []),
      ]
      for (const k of keys) {
        if (!isValidFeatureKey(k)) {
          bad.push(`${s.id}: "${k}"`)
        }
      }
    }
    expect(bad).toEqual([])
  })

  it('canon 条目必须有 book 且 quote 非空', () => {
    const bad = LIBRARY.filter((s) => {
      if (s.source?.kind !== 'canon') return false
      return !s.source.book || !s.source.quote || s.source.quote.trim().length === 0
    })
    expect(bad.map((s) => s.id)).toEqual([])
  })

  it('每个 domain 至少有 8 条条目覆盖', () => {
    for (const d of ALLOWED_DOMAINS) {
      const count = LIBRARY.filter((s) => s.domain.includes(d)).length
      expect(count, `domain "${d}" 仅 ${count} 条`).toBeGreaterThanOrEqual(8)
    }
  })

  it('每个 SITUATIONS 值至少被 3 条条目的 require/boost 引用', () => {
    for (const sit of SITUATIONS) {
      const key = `sit:${sit}`
      const count = LIBRARY.filter((s) => {
        const reqKeys = Object.keys(s.require ?? {})
        const boostKeys = Object.keys(s.boost ?? {})
        return reqKeys.includes(key) || boostKeys.includes(key)
      }).length
      expect(count, `sit:${sit} 仅被 ${count} 条引用`).toBeGreaterThanOrEqual(3)
    }
  })

  it('time:late-night 至少被 3 条引用', () => {
    const count = LIBRARY.filter((s) => {
      const keys = [
        ...Object.keys(s.require ?? {}),
        ...Object.keys(s.boost ?? {}),
      ]
      return keys.includes('time:late-night')
    }).length
    expect(count).toBeGreaterThanOrEqual(3)
  })

  it('至少 15 条同时引用了 domain:* 和 sit:* 特征', () => {
    const count = LIBRARY.filter((s) => {
      const allKeys = [
        ...Object.keys(s.require ?? {}),
        ...Object.keys(s.boost ?? {}),
      ]
      const hasDomain = allKeys.some((k) => k.startsWith('domain:'))
      const hasSit = allKeys.some((k) => k.startsWith('sit:'))
      return hasDomain && hasSit
    }).length
    expect(count).toBeGreaterThanOrEqual(15)
  })

  it('年龄覆盖：至少有条目引用 age:teen / age:student / age:early / age:mid / age:settled / age:later', () => {
    for (const a of ALLOWED_AGES) {
      const key = `age:${a}`
      const count = LIBRARY.filter((s) => {
        const allKeys = [
          ...Object.keys(s.require ?? {}),
          ...Object.keys(s.boost ?? {}),
        ]
        return allKeys.includes(key)
      }).length
      expect(count, `age:${a} 未被引用`).toBeGreaterThanOrEqual(1)
    }
  })

  it('季节覆盖：至少有条目引用 season:spring / summer / autumn / winter', () => {
    for (const s of ALLOWED_SEASONS) {
      const key = `season:${s}`
      const count = LIBRARY.filter((st) => {
        const allKeys = [
          ...Object.keys(st.require ?? {}),
          ...Object.keys(st.boost ?? {}),
        ]
        return allKeys.includes(key)
      }).length
      expect(count, `season:${s} 未被引用`).toBeGreaterThanOrEqual(1)
    }
  })

  it('SEED + LIBRARY 合计 >= 122', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(122)
  })
})
