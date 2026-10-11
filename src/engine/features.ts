/**
 * DU · 共鸣引擎 · 特征层
 *
 * 命中的前提是先有真实信号。这里把"用户输入 + 行为"归一成一串特征向量,
 * 后续打分全部基于这些可解释特征——不做任何未经声明的后台推测。
 */

export type FeatureVector = Record<string, number>

/** 用户可自述的处境；界面按领域分组呈现，命库以 `sit:<key>` 引用 */
export const SITUATIONS = [
  'conflict',
  'transition',
  'waiting',
  'doubt',
  'single',
  'breakup',
  'trust',
  'job-hunt',
  'job-loss',
  'promotion',
  'plateau',
  'exam',
  'moving',
  'illness',
  'debt',
  'family-tension',
  'elder-health',
  'new-born',
  'stuck',
] as const

export type Situation = (typeof SITUATIONS)[number]

/** 处境的中文名以这里为唯一来源：表单选项与"为什么选中我"共用，避免两处漂移 */
export const SITUATION_LABEL: Record<Situation, string> = {
  conflict: '正在争执',
  transition: '正在换档',
  waiting: '在等一个结果',
  doubt: '自己也不确定',
  single: '单身',
  breakup: '面临分离',
  trust: '信任动摇',
  'job-hunt': '在找工作',
  'job-loss': '刚失去工作',
  promotion: '面临升迁',
  plateau: '卡住了',
  exam: '要考试',
  moving: '要搬迁',
  illness: '身体抱恙',
  debt: '有债务压力',
  'family-tension': '家里不平静',
  'elder-health': '长辈健康',
  'new-born': '家有新生儿',
  stuck: '进退两难',
}

/** 领域是引擎唯一"必须"的信号，也是界面主分组，故在此穷举 */
export type Domain = 'career' | 'love' | 'study' | 'health' | 'wealth' | 'family' | 'general'

export interface RawContext {
  /** 出生年 → 年龄,由站方本地推算,不上传 */
  birthYear?: number
  nowYear: number
  /** 用户主动选择的人生阶段,是最强信号 */
  lifeStage?: 'student' | 'early' | 'mid' | 'settled' | 'later'
  /** 本次提问的领域 */
  domain: Domain
  /** 用户自述处境,可多选 */
  situations?: string[]
  /** 提问时段、节气等环境线索 */
  hour?: number
  month?: number
  /** 历史:第几次来访、上次点了什么 */
  visitCount?: number
  lastDomains?: string[]
  /** 上次反馈:哪些说中了 */
  resonatedTags?: string[]
}

const AGE_BANDS: [string, number, number][] = [
  ['age:teen', 0, 17],
  ['age:student', 16, 24],
  ['age:early', 23, 31],
  ['age:mid', 30, 43],
  ['age:settled', 42, 58],
  ['age:later', 57, 120],
]

const SEASON: Record<number, string> = {
  3: 'season:spring',
  4: 'season:spring',
  5: 'season:spring',
  6: 'season:summer',
  7: 'season:summer',
  8: 'season:summer',
  9: 'season:autumn',
  10: 'season:autumn',
  11: 'season:autumn',
  12: 'season:winter',
  1: 'season:winter',
  2: 'season:winter',
}

/** 一天里的心理状态先验(调研:高基率线索) */
function daypart(h?: number): string[] {
  if (h == null) return []
  if (h >= 23 || h < 5) return ['time:late-night', 'mood:reflective']
  if (h < 9) return ['time:morning']
  if (h < 12) return ['time:work-peak']
  if (h < 14) return ['time:midday']
  if (h < 18) return ['time:work-peak']
  if (h < 22) return ['time:evening', 'mood:wind-down']
  return ['time:night', 'mood:reflective']
}

export function extractFeatures(ctx: RawContext): FeatureVector {
  const f: FeatureVector = {}
  const on = (k: string, v = 1) => (f[k] = v)

  on(`domain:${ctx.domain}`)
  if (ctx.lifeStage) on(`stage:${ctx.lifeStage}`)

  if (ctx.birthYear) {
    const age = ctx.nowYear - ctx.birthYear
    for (const [k, lo, hi] of AGE_BANDS) if (age >= lo && age <= hi) on(k, 0.9)
    if (age >= 22 && age <= 29) on('life:possible-graduation-or-early-career', 0.8)
    if (age >= 27 && age <= 38) on('life:possible-partnership-decisions', 0.8)
    if (age >= 30 && age <= 50) on('life:possible-career-plateau', 0.7)
    if (age >= 35 && age <= 55) on('life:possible-parent-or-elder-care', 0.6)
    if (age >= 45) on('life:possible-health-awareness', 0.7)
  }

  for (const s of ctx.situations ?? []) on(`sit:${s}`, 1.4)
  for (const k of daypart(ctx.hour)) on(k, 0.6)
  if (ctx.month) on(SEASON[ctx.month], 0.5)

  const visits = ctx.visitCount ?? 1
  if (visits > 1) on('behavior:repeat-visitor', 0.6)
  for (const d of ctx.lastDomains ?? []) on(`history:domain:${d}`, 0.35)
  for (const t of ctx.resonatedTags ?? []) on(`resonated:${t}`, 1.2)

  return f
}
