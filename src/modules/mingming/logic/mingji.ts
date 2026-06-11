/**
 * 玄枢 MISTVERSE · 命名测字
 *
 *  - 拆字（偏旁部首 + 五行）
 *  - 笔画数（康熙字典）
 *  - 三才五格（天格/人格/地格/外格/总格）
 *  - 喜用神（基于生辰八字五行）
 */

import { calcBazi, TIANGAN_WUXING, DIZHI_WUXING, type Wuxing } from './bazi'
import { WUXING_META } from './wuxing'
import { kangxiStrokes, nameStrokes as _nameStrokes } from './kangxi-strokes'

// 简化的汉字五行表（部首→五行）— 去重后用程序化合并
const _CN_WX: Record<string, Wuxing> = { 木: 'mu', 火: 'huo', 土: 'tu', 金: 'jin', 水: 'shui' }
const _RAW_RADICAL: Array<[string, Wuxing]> = [
  ['木', 'mu'],
  ['林', 'mu'],
  ['森', 'mu'],
  ['桂', 'mu'],
  ['柏', 'mu'],
  ['柳', 'mu'],
  ['杨', 'mu'],
  ['松', 'mu'],
  ['梅', 'mu'],
  ['樱', 'mu'],
  ['荣', 'mu'],
  ['树', 'mu'],
  ['植', 'mu'],
  ['火', 'huo'],
  ['炎', 'huo'],
  ['焱', 'huo'],
  ['熙', 'huo'],
  ['光', 'huo'],
  ['辉', 'huo'],
  ['明', 'huo'],
  ['炅', 'huo'],
  ['烨', 'huo'],
  ['烁', 'huo'],
  ['炯', 'huo'],
  ['土', 'tu'],
  ['地', 'tu'],
  ['城', 'tu'],
  ['垚', 'tu'],
  ['培', 'tu'],
  ['坤', 'tu'],
  ['坦', 'tu'],
  ['埔', 'tu'],
  ['金', 'jin'],
  ['钢', 'jin'],
  ['铭', 'jin'],
  ['锋', 'jin'],
  ['银', 'jin'],
  ['鑫', 'jin'],
  ['钦', 'jin'],
  ['钰', 'jin'],
  ['铃', 'jin'],
  ['铖', 'jin'],
  ['锦', 'jin'],
  ['钊', 'jin'],
  ['水', 'shui'],
  ['海', 'shui'],
  ['江', 'shui'],
  ['河', 'shui'],
  ['湖', 'shui'],
  ['泉', 'shui'],
  ['洋', 'shui'],
  ['涛', 'shui'],
  ['波', 'shui'],
  ['溪', 'shui'],
  ['源', 'shui'],
  ['氵', 'shui'],
  ['亻', 'jin'],
  ['艹', 'mu'],
  ['宀', 'tu'],
  ['女', 'huo'],
  ['心', 'huo'],
  ['忄', 'huo'],
  ['日', 'huo'],
  ['月', 'shui'],
  ['纟', 'jin'],
  ['讠', 'jin'],
  ['刂', 'jin'],
  ['王', 'jin'],
  ['玉', 'jin'],
  ['钅', 'jin'],
  ['禾', 'mu'],
  ['疒', 'shui'],
  ['雨', 'shui'],
  ['阝', 'tu'],
]
// 用 Map 自动去重（后出现覆盖前出现）
const RADICAL_WUXING: Record<string, Wuxing> = Object.fromEntries(_RAW_RADICAL)

// 简化笔画数（常用字）
const _RAW_STROKE: Array<[string, number]> = [
  ['一', 1],
  ['二', 2],
  ['三', 3],
  ['四', 5],
  ['五', 4],
  ['六', 4],
  ['七', 2],
  ['八', 2],
  ['九', 2],
  ['十', 2],
  ['人', 2],
  ['入', 2],
  ['儿', 2],
  ['匕', 2],
  ['几', 2],
  ['凵', 2],
  ['刀', 2],
  ['力', 2],
  ['勹', 2],
  ['又', 2],
  ['口', 3],
  ['囗', 3],
  ['土', 3],
  ['士', 3],
  ['夂', 3],
  ['夊', 3],
  ['夕', 3],
  ['大', 3],
  ['女', 3],
  ['子', 3],
  ['宀', 3],
  ['寸', 3],
  ['小', 3],
  ['⺈', 3],
  ['尢', 3],
  ['尸', 3],
  ['屮', 3],
  ['山', 3],
  ['川', 3],
  ['工', 3],
  ['己', 3],
  ['巾', 3],
  ['干', 3],
  ['幺', 3],
  ['广', 3],
  ['廴', 3],
  ['廾', 3],
  ['弋', 3],
  ['弓', 3],
  ['心', 4],
  ['戈', 4],
  ['户', 4],
  ['手', 4],
  ['支', 4],
  ['攴', 4],
  ['文', 4],
  ['斗', 4],
  ['斤', 4],
  ['方', 4],
  ['无', 4],
  ['日', 4],
  ['月', 4],
  ['木', 4],
  ['欠', 4],
  ['止', 4],
  ['歹', 4],
  ['殳', 4],
  ['毋', 4],
  ['比', 4],
  ['毛', 4],
  ['气', 4],
  ['父', 4],
  ['爿', 4],
  ['片', 4],
  ['牙', 4],
  ['牛', 4],
  ['犬', 4],
  ['玄', 5],
  ['玉', 5],
]
const _STROKE_MAP: Record<string, number> = Object.fromEntries(_RAW_STROKE)

function strokeOf(c: string): number {
  // 用真康熙字典笔画，未命中时回退到部首近似（避免 charcode 假算法）
  return kangxiStrokes(c)
}

function wxOf(c: string): Wuxing {
  // 优先用部首表（部首 → 五行 是姓名学正统方法）
  for (const r of Object.keys(RADICAL_WUXING)) {
    if (c.includes(r)) return RADICAL_WUXING[r]
  }
  // 未匹配部首：返回中性"土"（不编造）
  return 'tu'
}

export interface NamingGe {
  tianGe: number // 天格
  renGe: number // 人格
  diGe: number // 地格
  waiGe: number // 外格
  zongGe: number // 总格
  sanCai: string // 三才
  jiXiong: '吉' | '半吉' | '凶'
  desc: string
}

function computeGe(strokes: number[]): NamingGe {
  // 单姓/复姓
  if (strokes.length === 2) {
    // 复姓
    return {
      tianGe: strokes[0]! + strokes[1]!,
      renGe: strokes[1]! + strokes[2]!,
      diGe: strokes[2]! + (strokes[3]! || 1),
      waiGe:
        strokes[0]! + strokes[1]! + strokes[2]! + (strokes[3]! || 1) - (strokes[1]! + strokes[2]!),
      zongGe: strokes[0]! + strokes[1]! + strokes[2]! + (strokes[3]! || 1),
      sanCai: '—',
      jiXiong: '吉',
      desc: '复姓之格',
    }
  }
  // 单姓 1 字 + 名 1-2 字
  if (strokes.length === 3) {
    const [s, n1, n2] = strokes
    const tian = s + 1
    const ren = s + n1
    const di = n1 + n2
    const wai = tian + di - ren
    const zong = s + n1 + n2
    return {
      tianGe: tian,
      renGe: ren,
      diGe: di,
      waiGe: wai,
      zongGe: zong,
      sanCai: `${wxByNum(ren)} > ${wxByNum(ren + n1)} > ${wxByNum(zong)}`,
      jiXiong: jiXiongOf(zong),
      desc: '三格配合',
    }
  }
  // 单姓 1 字 + 名 1 字
  if (strokes.length === 2) {
    const [s, n] = strokes
    return {
      tianGe: s + 1,
      renGe: s + n,
      diGe: n + 1,
      waiGe: s + 1 + n + 1 - (s + n),
      zongGe: s + n,
      sanCai: '—',
      jiXiong: jiXiongOf(s + n),
      desc: '单字名',
    }
  }
  return {
    tianGe: 0,
    renGe: 0,
    diGe: 0,
    waiGe: 0,
    zongGe: 0,
    sanCai: '—',
    jiXiong: '半吉',
    desc: '—',
  }
}

function wxByNum(n: number): string {
  return WUXING_META[(['mu', 'huo', 'tu', 'jin', 'shui'] as Wuxing[])[(n - 1) % 5]].name
}

function jiXiongOf(ge: number): '吉' | '半吉' | '凶' {
  if (
    [
      1, 3, 5, 7, 8, 11, 13, 15, 16, 21, 23, 24, 25, 31, 32, 33, 35, 37, 39, 41, 45, 47, 48, 52, 57,
      63, 65, 67, 68, 81,
    ].includes(ge)
  )
    return '吉'
  if (ge < 10) return '吉'
  return '半吉'
}

export interface MingjiResult {
  name: string
  surname: string
  given: string
  charWx: Wuxing[]
  totalStrokes: number
  wuGe: NamingGe
  score: number
  level: '大吉' | '吉' | '平' | '凶'
  summary: string
  fiveElBalance: Record<Wuxing, number>
  advice: string
}

/**
 * 测字起名分析
 */
export function analyzeMingji(
  name: string,
  year?: number,
  month?: number,
  day?: number,
  hour?: number,
): MingjiResult {
  // 拆分姓 + 名（简单按 1+1 或 1+2）
  let surname = name.charAt(0)
  let given = name.slice(1)
  if (name.length > 2 && '赵钱孙李周吴郑王'.includes(surname)) {
    surname = name.slice(0, 1)
    given = name.slice(1)
  }

  const all = name.split('')
  const strokes = all.map(strokeOf)
  const charWx = all.map(wxOf)
  const wuGe = computeGe(strokes)

  // 五行平衡
  const balance: Record<Wuxing, number> = { mu: 0, huo: 0, tu: 0, jin: 0, shui: 0 }
  charWx.forEach((w) => balance[w]++)

  // 基于生辰八字判定喜用神
  let xiYong: Wuxing = 'mu'
  if (year && month && day !== undefined && hour !== undefined) {
    const bazi = calcBazi(year, month, day, hour)
    const counts: Record<Wuxing, number> = { mu: 0, huo: 0, tu: 0, jin: 0, shui: 0 }
    if (bazi.year) {
      counts[TIANGAN_WUXING[bazi.year.gan]]++
      counts[DIZHI_WUXING[bazi.year.zhi]]++
    }
    if (bazi.month) {
      counts[TIANGAN_WUXING[bazi.month.gan]]++
      counts[DIZHI_WUXING[bazi.month.zhi]]++
    }
    if (bazi.day) {
      counts[TIANGAN_WUXING[bazi.day.gan]]++
      counts[DIZHI_WUXING[bazi.day.zhi]]++
    }
    // 简化为取最少
    const sorted = (Object.entries(counts) as [Wuxing, number][]).sort((a, b) => a[1]! - b[1]!)
    xiYong = sorted[0]?.[0] || 'mu'
  }

  // 评分：名字中喜用神越多越高分
  let score = 60 + balance[xiYong] * 8
  if (wuGe.jiXiong === '吉') score += 12
  if (wuGe.jiXiong === '凶') score -= 12
  score = Math.max(20, Math.min(100, score))

  let level: '大吉' | '吉' | '平' | '凶' = '平'
  if (score >= 85) level = '大吉'
  else if (score >= 70) level = '吉'
  else if (score < 55) level = '凶'

  return {
    name,
    surname,
    given,
    charWx,
    totalStrokes: strokes.reduce((a, b) => a + b, 0),
    wuGe,
    score,
    level,
    summary: `${name} · ${level} · 总格 ${wuGe.zongGe} · 三才 ${wuGe.sanCai}`,
    fiveElBalance: balance,
    advice: `姓名喜用神为 ${WUXING_META[xiYong].name} · 当前姓名含 ${WUXING_META[xiYong].name} ${balance[xiYong]} 个 · ${balance[xiYong] >= 1 ? '已含喜用神之字' : '可考虑补足'}`,
  }
}
