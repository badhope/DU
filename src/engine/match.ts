/**
 * DU · 共鸣引擎 · 匹配层
 *
 * 目标函数不是"最准"，而是"在真实信号上尽量贴、并且让用户看得见为什么贴"。
 * 分数构成完全可解释：每条入选命都返回它被选中的理由（触发的特征）。
 *
 * 约束（写进代码，而非文档）：
 *  - 单条 require 未满足 → 淘汰，绝不靠文案蒙混；
 *  - 一次输出内 polarity 平衡：至多 1 条高基率泛谈（baseRate > 0.6）；
 *  - 负面条目必须带 action，否则不入选；
 *  - 每条附带 confidence = 信号强度，界面显示"这条有几成是我真看出来的"。
 */
import type { FeatureVector } from './features'
import type { Statement } from './statements'

export interface Matched {
  st: Statement
  /** 综合分 0–1 */
  score: number
  /** 信号分：来自用户真实输入/行为的强度 0–1 */
  signal: number
  /** 触发的特征键，用于"为什么这么说"展开 */
  reasons: string[]
  /** 是否为高基率泛谈 */
  generic: boolean
}

export interface MatchOptions {
  /** 输出条数 */
  n?: number
  /** 随机种子；同一输入同一种子 → 同一结果（可复现，可测试） */
  seed?: number
  /** 已看过的条目 id，降权避免重复 */
  seen?: string[]
}

/** 确定性随机（mulberry32），保证可复现 */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function overlaps(a: Record<string, number> | undefined, f: FeatureVector) {
  if (!a) return { hit: false, weight: 0, keys: [] as string[] }
  const keys: string[] = []
  let weight = 0
  let miss = 0
  for (const [k, min] of Object.entries(a)) {
    const v = f[k]
    if (v !== undefined && v >= min) {
      keys.push(k)
      weight += v
    } else miss++
  }
  return { hit: keys.length > 0 && miss === 0, weight, keys }
}

/** 单条评估：require 硬门槛，boost 加分，ban 淘汰 */
export function evaluate(st: Statement, f: FeatureVector): Omit<Matched, 'generic'> | null {
  if (st.ban?.some((b) => f[b] !== undefined)) return null
  if (st.polarity === 'tough' && !st.action) return null // 负面必须给路

  const req = overlaps(st.require, f)
  if (st.require && Object.keys(st.require).length > 0 && !req.hit) return null

  const bst = overlaps(st.boost, f)
  const reasons = [...req.keys, ...bst.keys]

  // 信号强度：require 命中 0.5 权重 + boost 命中累加，饱和到 1
  const raw = req.weight * 0.55 + bst.weight * 0.45
  const signal = Math.min(1, raw / 1.8)

  // 具体性奖励：baseRate 越低越"值钱"，因为它不是人人通用
  const specificity = 1 - st.baseRate

  // 无 require 的条目属于泛谈，只在补位时用
  const hasHardSignal = req.keys.length > 0
  const score = Math.max(
    0,
    Math.min(
      1,
      signal * 0.55 +
        specificity * 0.3 +
        (hasHardSignal ? 0.15 : 0) +
        (st.source?.kind === 'canon' ? 0.08 : 0),
    ),
  )

  return { st, score, signal: hasHardSignal ? signal : 0, reasons }
}

export function match(
  statements: Statement[],
  f: FeatureVector,
  opts: MatchOptions = {},
): Matched[] {
  const n = opts.n ?? 5
  const rand = rng(opts.seed ?? 0)
  const seen = new Set(opts.seen ?? [])

  const scored: Matched[] = []
  for (const st of statements) {
    const e = evaluate(st, f)
    if (!e) continue
    scored.push({ ...e, generic: st.baseRate > 0.6 })
  }

  // 稳定排序 + 微扰，避免同一输入永远给同一顺序导致单调
  const jittered = scored
    .map((m) => ({ m, k: m.score + rand() * 0.06 - (seen.has(m.st.id) ? 0.25 : 0) }))
    .sort((a, b) => b.k - a.k)

  const out: Matched[] = []
  let genericCount = 0
  const usedTag = new Set<string>()

  for (const { m } of jittered) {
    if (out.length >= n) break
    if (m.generic && genericCount >= 1) continue // 泛谈至多一条
    const tag = m.st.tags?.[0]
    if (tag && usedTag.has(tag) && out.length < n - 1) continue // 主题去重
    usedTag.add(tag ?? m.st.id)
    if (m.generic) genericCount++
    out.push(m)
  }
  return out
}

