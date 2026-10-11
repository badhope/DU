/**
 * DU v2 · 梅花易数起卦内核
 *
 * 只负责"由数得卦"这一步：起例照《梅花易数·卷一》年月日時起例，
 * 体用照《卷二·體用總訣》，旺衰照《卷一·卦氣旺/卦氣衰》。
 * 这里不断吉凶——吉凶的"势"来自 core/gua 的体用关系，断语来自共鸣引擎。
 */
import {
  changed,
  hexagram,
  mutual,
  relate,
  trigramByXiantian,
  type Hexagram,
  type TiYong,
  type Trigram,
} from './gua'

/** 除八取余：整除作 8（原文"如得八數整，即坤卦，更不必除也"） */
export const mod8 = (n: number): number => {
  const r = n % 8
  return r === 0 ? 8 : r
}

/** 除六取余：整除作 6 */
export const mod6 = (n: number): number => {
  const r = n % 6
  return r === 0 ? 6 : r
}

export interface Cast {
  upper: Trigram
  lower: Trigram
  /** 动爻 1–6，自下而上 */
  moving: number
  lines: Array<0 | 1>
  ben: Hexagram
  hu: Hexagram
  bian: Hexagram
  /** 动爻所在之卦为用，不动者为体 */
  ti: Trigram
  yong: Trigram
  relation: TiYong
  /** 参与计算的数，界面须原样列出以便复核 */
  numbers: number[]
  total: number
}

function build(upperN: number, lowerN: number, moving: number, numbers: number[]): Cast {
  const upper = trigramByXiantian(upperN)
  const lower = trigramByXiantian(lowerN)
  // bin 串自下而上，第 0 位是初爻
  const lines = [...lower.bin, ...upper.bin].map((c) => (c === '1' ? 1 : 0)) as Array<0 | 1>
  const ben = hexagram(lines)
  const ti = moving <= 3 ? upper : lower
  const yong = moving <= 3 ? lower : upper
  return {
    upper,
    lower,
    moving,
    lines,
    ben,
    hu: mutual(lines),
    bian: changed(lines, moving),
    ti,
    yong,
    relation: relate(ti.wuxing, yong.wuxing),
    numbers,
    total: numbers.reduce((a, b) => a + b, 0),
  }
}

/**
 * 年月日时占：年支序数 + 农历月数 + 农历日数 为上卦，
 * 再加时支序数为下卦，总数取动爻。
 */
export function castByTime(yearZhi: number, month: number, day: number, hourZhi: number): Cast {
  const sd = yearZhi + month + day
  return build(mod8(sd), mod8(sd + hourZhi), mod6(sd + hourZhi), [yearZhi, month, day, hourZhi])
}

/** 报数占：一数Upper、二数Lower，两数之和取动爻 */
export function castByNumbers(a: number, b: number): Cast {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a <= 0 || b <= 0)
    throw new Error('报数须为正整数')
  return build(mod8(a), mod8(b), mod6(a + b), [a, b])
}

/** 单字/单物起卦：一数为上，加时数取下 */
export function castByOneNumber(n: number, hourZhi: number): Cast {
  return build(mod8(n), mod8(n + hourZhi), mod6(n + hourZhi), [n, hourZhi])
}

/** 四时与四季月：原文"坤、艮土旺於辰戌丑未月"，故辰戌丑未抽离为土令 */
export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter' | 'earth'

/** 地支序数 1=子 … 12=亥；辰戌丑未 = 5、11、2、8 */
const SIJI = new Set([5, 11, 2, 8])

export function monthSeason(monthZhi: number): SeasonKey {
  if (SIJI.has(monthZhi)) return 'earth'
  if (monthZhi === 3 || monthZhi === 4) return 'spring' // 寅卯
  if (monthZhi === 6 || monthZhi === 7) return 'summer' // 巳午
  if (monthZhi === 9 || monthZhi === 10) return 'autumn' // 申酉
  return 'winter' // 亥子
}

const WANG: Record<SeasonKey, Trigram['name'][]> = {
  spring: ['震', '巽'],
  summer: ['离'],
  autumn: ['乾', '兑'],
  winter: ['坎'],
  earth: ['坤', '艮'],
}

const SHUAI: Record<SeasonKey, Trigram['name'][]> = {
  spring: ['坤', '艮'],
  summer: ['乾', '兑'],
  autumn: ['震', '巽'],
  winter: ['离'],
  earth: ['坎'],
}

export type Strength = 'wang' | 'shuai' | 'ping'

/** 体卦得令则盛，失令则衰——原文"體盛則吉，體衰則凶"，只论势不论事 */
export function tiStrength(ti: Trigram, season: SeasonKey): Strength {
  if (WANG[season].includes(ti.name)) return 'wang'
  if (SHUAI[season].includes(ti.name)) return 'shuai'
  return 'ping'
}

export const STRENGTH_TEXT: Record<Strength, string> = {
  wang: '体卦当令，气势正盛',
  shuai: '体卦失令，宜借力不宜硬扛',
  ping: '体卦不得令也不受克，平稳',
}

/** 供界面展示起例出处 */
export const MEIHUA_SOURCE = {
  book: '梅花易数',
  qili: '卷一 · 年月日時起例 / 卦以八除 / 爻以六除',
  tiyong: '卷二 · 體用總訣',
  wangshuai: '卷一 · 卦氣旺 / 卦氣衰',
}
