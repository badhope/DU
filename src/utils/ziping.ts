/**
 * 子平真诠 · 高级子平命学
 *
 * 出处：沈孝瞻《子平真诠》—— 清代命学正宗
 *
 * 核心理论：
 *  1. 用神：调候、扶抑、通关、病药（核心）
 *  2. 格局：月令所藏 + 透干 + 会合
 *  3. 月令提纲：四柱之根
 *  4. 宾主：体（命主）与用（用神）的关系
 *  5. 格局成败：月令能否成格
 *  6. 神煞
 */

import type { TianGan, DiZhi } from './bazi'
import { calcBazi } from './bazi'

export type YongShenType = '扶抑' | '调候' | '通关' | '病药' | '专旺' | '从格'
export type GeJuType =
  | '正官格' | '七杀格' | '正印格' | '偏印格'
  | '正财格' | '偏财格' | '食神格' | '伤官格'
  | '从弱格' | '从强格' | '化气格' | '杂格'

const GAN_WUXING: Record<TianGan, '木' | '火' | '土' | '金' | '水'> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
}

const ZHI_WUXING: Record<DiZhi, '木' | '火' | '土' | '金' | '水'> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
}

const ZHI_CANGGAN: Record<DiZhi, TianGan[]> = {
  子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
  辰: ['戊', '乙', '癸'], 巳: ['丙', '戊', '庚'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲'],
}

const WUXING_SHENG: Record<'木' | '火' | '土' | '金' | '水', '木' | '火' | '土' | '金' | '水'> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
}
const WUXING_KE: Record<'木' | '火' | '土' | '金' | '水', '木' | '火' | '土' | '金' | '水'> = {
  木: '土', 火: '金', 土: '水', 金: '木', 水: '火',
}

// ============ 月令提纲 ============

/**
 * 子平真诠首重月令（提纲）
 * 月令旺衰决定四柱之根
 */
export interface YueLingInfo {
  month: number
  gan: TianGan
  zhi: DiZhi
  wuxing: '木' | '火' | '土' | '金' | '水'
  cangGan: TianGan[]
  /** 司令用神：月令当令之五行 */
  siling: '木' | '火' | '土' | '金' | '水'
  silingGan: TianGan
}

const MONTH_ZHI_ORDER: DiZhi[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']

export function getMonthFromZhi(zhi: DiZhi): number {
  return MONTH_ZHI_ORDER.indexOf(zhi) + 1
}

export function getYueLing(month: number): YueLingInfo {
  const zhi = MONTH_ZHI_ORDER[(month - 1) % 12]
  const cang = ZHI_CANGGAN[zhi]
  const wuxing = ZHI_WUXING[zhi]
  // 月干：从月支推
  return {
    month,
    gan: cang[0],
    zhi,
    wuxing,
    cangGan: cang,
    siling: wuxing,
    silingGan: cang[0],
  }
}

// ============ 日主旺衰 ============

/**
 * 计算日主旺衰（简化版 · 12 月令）
 */
export type DayMasterState = '旺' | '相' | '休' | '囚' | '死'

export function getDayMasterState(
  dayGan: TianGan,
  bazi: { yearZhi: DiZhi; monthZhi: DiZhi; dayZhi: DiZhi; hourZhi: DiZhi },
): { state: DayMasterState; score: number; reasons: string[] } {
  const dayWx = GAN_WUXING[dayGan]
  const monthZhi = bazi.monthZhi
  const monthWx = ZHI_WUXING[monthZhi]
  let score = 0
  const reasons: string[] = []
  if (monthWx === dayWx) {
    score += 30
    reasons.push('月令当令（旺）')
  } else if (WUXING_SHENG[monthWx] === dayWx) {
    score += 25
    reasons.push('月令相生（相）')
  } else if (WUXING_KE[monthWx] === dayWx) {
    score += 5
    reasons.push('月令受克')
  } else if (WUXING_KE[dayWx] === monthWx) {
    score -= 10
    reasons.push('日主克月令（泄）')
  } else {
    score -= 5
    reasons.push('月令耗日主')
  }
  const supports = [bazi.yearZhi, bazi.monthZhi, bazi.dayZhi, bazi.hourZhi].filter((z) => {
    const zw = ZHI_WUXING[z]
    if (zw === dayWx) return true
    if (WUXING_SHENG[zw] === dayWx) return true
    return false
  }).length
  score += supports * 8
  reasons.push(`地根 ${supports} 处`)
  let state: DayMasterState
  if (score >= 50) state = '旺'
  else if (score >= 30) state = '相'
  else if (score >= 10) state = '休'
  else if (score >= 0) state = '囚'
  else state = '死'
  return { state, score, reasons }
}

// ============ 用神精断 ============

export interface YongShenResult {
  type: YongShenType
  yong: string
  xi: string
  ji: string
  reasoning: string
  tiaohouInfo?: string
}

/**
 * 子平真诠用神四法
 */
export function getYongShen(
  dayGan: TianGan,
  bazi: { yearZhi: DiZhi; monthZhi: DiZhi; dayZhi: DiZhi; hourZhi: DiZhi; month: number },
): YongShenResult {
  const dayWx = GAN_WUXING[dayGan]
  const state = getDayMasterState(dayGan, bazi)
  const tiaohou = getTiaoHou(dayGan, bazi.month)
  let type: YongShenType = '扶抑'
  let yong: '木' | '火' | '土' | '金' | '水'
  if (state.state === '旺' || state.state === '相') {
    yong = WUXING_KE[dayWx]
    type = '扶抑'
  } else if (state.state === '死' || state.state === '囚') {
    yong = WUXING_SHENG[dayWx]
    type = '扶抑'
  } else {
    yong = tiaohou.need
    type = '调候'
  }
  const xi: '木' | '火' | '土' | '金' | '水' = WUXING_SHENG[yong]
  const ji: '木' | '火' | '土' | '金' | '水' = (() => {
    if (type === '扶抑' && (state.state === '旺' || state.state === '相')) {
      return WUXING_SHENG[dayWx]
    } else if (type === '扶抑') {
      return WUXING_KE[dayWx]
    } else {
      return WUXING_KE[tiaohou.need]
    }
  })()
  const reasoning: string[] = []
  reasoning.push(`日主 ${dayGan}（${dayWx}）${state.state} · 评分 ${state.score}`)
  reasoning.push(`月令 ${bazi.monthZhi} · 调候需 ${tiaohou.need}`)
  if (type === '扶抑') {
    if (state.state === '旺' || state.state === '相') {
      reasoning.push(`身${state.state}取财官食伤为用 · 财 ${yong} 为用神`)
    } else {
      reasoning.push(`身${state.state}取印比为用 · 印 ${yong} 为用神`)
    }
  } else {
    reasoning.push(`月令 ${bazi.monthZhi} · 寒暖燥湿需 ${yong} 调候`)
  }
  return {
    type,
    yong,
    xi,
    ji,
    reasoning: reasoning.join(' · '),
    tiaohouInfo: tiaohou.info,
  }
}

// ============ 调候 ============

const TIAOHOU_TABLE: Record<TianGan, Record<number, { need: '木' | '火' | '土' | '金' | '水'; info: string }>> = {
  甲: {
    1: { need: '火', info: '甲木冬生 · 寒水凋零 · 先用庚金伐身 · 后用丁火调候' },
    2: { need: '火', info: '甲木初春 · 寒气未除 · 仍需丁火' },
    3: { need: '火', info: '甲木春令 · 专用庚金 · 丁火次之' },
    4: { need: '水', info: '甲木暮春 · 木旺 · 庚金为用 · 丁火佐之' },
    5: { need: '水', info: '甲木入夏 · 火旺木焦 · 专用癸水润之' },
    6: { need: '水', info: '甲木夏令 · 仍用癸水' },
    7: { need: '水', info: '甲木初秋 · 金旺 · 庚丁为用' },
    8: { need: '水', info: '甲木秋令 · 金神当权 · 庚金劈甲引丁' },
    9: { need: '水', info: '甲木深秋 · 木气渐衰 · 仍用庚丁' },
    10: { need: '火', info: '甲木初冬 · 寒水将至 · 急用丁火' },
    11: { need: '火', info: '甲木仲冬 · 寒极 · 庚丁并用' },
    12: { need: '火', info: '甲木季冬 · 丁火为先 · 庚金佐之' },
  },
  乙: {
    1: { need: '火', info: '乙木冬生 · 寒谷回春 · 用丙火解冻' },
    2: { need: '火', info: '乙木初春 · 寒气犹在 · 丙火为先' },
    3: { need: '火', info: '乙木春令 · 丙癸两用' },
    4: { need: '水', info: '乙木暮春 · 木旺 · 癸水泄秀' },
    5: { need: '水', info: '乙木夏令 · 癸水为主 · 丙火次之' },
    6: { need: '水', info: '乙木入夏 · 仍用癸水' },
    7: { need: '水', info: '乙木初秋 · 癸丙并用' },
    8: { need: '水', info: '乙木秋令 · 癸水为先' },
    9: { need: '水', info: '乙木深秋 · 庚癸为用' },
    10: { need: '火', info: '乙木初冬 · 急用丙火' },
    11: { need: '火', info: '乙木仲冬 · 丙火解冻' },
    12: { need: '火', info: '乙木季冬 · 丙火为用' },
  },
  丙: {
    1: { need: '水', info: '丙火冬令 · 壬水为用 · 戊土为佐' },
    2: { need: '水', info: '丙火初春 · 木旺 · 壬水为用 · 庚金佐之' },
    3: { need: '水', info: '丙火春令 · 用壬水 · 庚金劈甲引丁' },
    4: { need: '水', info: '丙火暮春 · 仍用壬水' },
    5: { need: '水', info: '丙火夏令 · 专用壬水 · 庚金佐之' },
    6: { need: '水', info: '丙火仲夏 · 壬水为先 · 庚丁为佐' },
    7: { need: '水', info: '丙火初秋 · 火气未除 · 壬水为用' },
    8: { need: '水', info: '丙火秋令 · 用壬水 · 戊土制之' },
    9: { need: '水', info: '丙火深秋 · 壬戊为用' },
    10: { need: '水', info: '丙火初冬 · 壬水为先 · 甲木为佐' },
    11: { need: '水', info: '丙火仲冬 · 壬甲为用' },
    12: { need: '水', info: '丙火季冬 · 壬水为用' },
  },
  丁: {
    1: { need: '木', info: '丁火冬令 · 甲木为用 · 庚金劈甲' },
    2: { need: '木', info: '丁火初春 · 甲木引丁 · 庚金劈之' },
    3: { need: '木', info: '丁火春令 · 甲庚为用' },
    4: { need: '木', info: '丁火暮春 · 甲木为用 · 壬水佐之' },
    5: { need: '木', info: '丁火夏令 · 壬水为用 · 甲木佐之' },
    6: { need: '水', info: '丁火仲夏 · 壬癸为用' },
    7: { need: '水', info: '丁火初秋 · 壬水为用' },
    8: { need: '木', info: '丁火秋令 · 甲木为用 · 庚金劈之' },
    9: { need: '木', info: '丁火深秋 · 甲木引丁' },
    10: { need: '木', info: '丁火初冬 · 甲木为用' },
    11: { need: '木', info: '丁火仲冬 · 甲木引丁 · 庚金为佐' },
    12: { need: '木', info: '丁火季冬 · 甲木为用' },
  },
  戊: {
    1: { need: '火', info: '戊土冬令 · 丙火为用 · 甲木为佐' },
    2: { need: '火', info: '戊土初春 · 丙火为先' },
    3: { need: '火', info: '戊土春令 · 丙火为用 · 甲木佐之' },
    4: { need: '火', info: '戊土暮春 · 丙甲为用' },
    5: { need: '水', info: '戊土夏令 · 癸水润之 · 丙火佐之' },
    6: { need: '水', info: '戊土仲夏 · 癸水为主' },
    7: { need: '水', info: '戊土初秋 · 癸丙为用' },
    8: { need: '火', info: '戊土秋令 · 丙火为用 · 甲木佐之' },
    9: { need: '火', info: '戊土深秋 · 丙甲为用' },
    10: { need: '火', info: '戊土初冬 · 丙火为用' },
    11: { need: '火', info: '戊土仲冬 · 丙火为用 · 甲木为佐' },
    12: { need: '火', info: '戊土季冬 · 丙火为用' },
  },
  己: {
    1: { need: '火', info: '己土冬令 · 丙火为用 · 甲木为佐' },
    2: { need: '火', info: '己土初春 · 丙火为用' },
    3: { need: '火', info: '己土春令 · 丙甲为用' },
    4: { need: '火', info: '己土暮春 · 丙甲为用' },
    5: { need: '水', info: '己土夏令 · 癸水为用 · 丙火佐之' },
    6: { need: '水', info: '己土仲夏 · 癸水为主' },
    7: { need: '水', info: '己土初秋 · 癸水为用' },
    8: { need: '火', info: '己土秋令 · 丙火为用 · 甲木佐之' },
    9: { need: '火', info: '己土深秋 · 丙甲为用' },
    10: { need: '火', info: '己土初冬 · 丙火为用' },
    11: { need: '火', info: '己土仲冬 · 丙甲为用' },
    12: { need: '火', info: '己土季冬 · 丙火为用' },
  },
  庚: {
    1: { need: '火', info: '庚金冬令 · 寒金 · 用丙火煅炼 · 甲木为佐' },
    2: { need: '火', info: '庚金初春 · 寒气未除 · 丙甲为用' },
    3: { need: '火', info: '庚金春令 · 丙火为用 · 甲木佐之' },
    4: { need: '水', info: '庚金暮春 · 金弱 · 丁火煅炼 · 壬水淘洗' },
    5: { need: '水', info: '庚金初夏 · 专用壬水 · 癸水佐之' },
    6: { need: '水', info: '庚金仲夏 · 壬癸为用 · 戊土为佐' },
    7: { need: '火', info: '庚金初秋 · 金神当权 · 专用丁火' },
    8: { need: '火', info: '庚金秋令 · 丁火为用 · 甲木为佐' },
    9: { need: '火', info: '庚金深秋 · 丁甲为用' },
    10: { need: '火', info: '庚金初冬 · 丙火为用 · 甲木佐之' },
    11: { need: '火', info: '庚金仲冬 · 丙甲为用' },
    12: { need: '火', info: '庚金季冬 · 丙火为用' },
  },
  辛: {
    1: { need: '火', info: '辛金冬令 · 寒金 · 丙火为用 · 壬水淘洗' },
    2: { need: '火', info: '辛金初春 · 丙火为用' },
    3: { need: '火', info: '辛金春令 · 丙火为先' },
    4: { need: '水', info: '辛金暮春 · 壬水为用 · 丙火佐之' },
    5: { need: '水', info: '辛金初夏 · 壬水为主' },
    6: { need: '水', info: '辛金仲夏 · 壬水为用 · 戊土为佐' },
    7: { need: '火', info: '辛金初秋 · 丁火为用' },
    8: { need: '火', info: '辛金秋令 · 丁火为用 · 壬水淘洗' },
    9: { need: '火', info: '辛金深秋 · 丁火为用' },
    10: { need: '火', info: '辛金初冬 · 丙火为用' },
    11: { need: '火', info: '辛金仲冬 · 丙火为用 · 壬水佐之' },
    12: { need: '火', info: '辛金季冬 · 丙火为用' },
  },
  壬: {
    1: { need: '火', info: '壬水冬令 · 金水旺相 · 专用丙火 · 戊土为佐' },
    2: { need: '火', info: '壬水初春 · 寒气未除 · 丙火为用' },
    3: { need: '火', info: '壬水春令 · 丙火为用 · 辛金为佐' },
    4: { need: '金', info: '壬水暮春 · 金神为用 · 丙火佐之' },
    5: { need: '金', info: '壬水初夏 · 庚辛为用 · 壬水旺则用比劫' },
    6: { need: '金', info: '壬水仲夏 · 戊土为用 · 庚金佐之' },
    7: { need: '火', info: '壬水初秋 · 丙火为用 · 辛金佐之' },
    8: { need: '火', info: '壬水秋令 · 丙火为用 · 辛金为佐' },
    9: { need: '火', info: '壬水深秋 · 辛金为先 · 丙火佐之' },
    10: { need: '火', info: '壬水初冬 · 丙火为用' },
    11: { need: '火', info: '壬水仲冬 · 丙火为用 · 戊土佐之' },
    12: { need: '火', info: '壬水季冬 · 丙火为用' },
  },
  癸: {
    1: { need: '火', info: '癸水冬令 · 丙火解冻 · 辛金为佐' },
    2: { need: '火', info: '癸水初春 · 丙火为用' },
    3: { need: '火', info: '癸水春令 · 丙火为用 · 辛金佐之' },
    4: { need: '金', info: '癸水暮春 · 辛金为用 · 丙火佐之' },
    5: { need: '金', info: '癸水初夏 · 庚辛为用' },
    6: { need: '金', info: '癸水仲夏 · 辛金为用 · 戊土佐之' },
    7: { need: '火', info: '癸水初秋 · 丙火为用' },
    8: { need: '火', info: '癸水秋令 · 丙火为用 · 辛金佐之' },
    9: { need: '火', info: '癸水深秋 · 辛金为先' },
    10: { need: '火', info: '癸水初冬 · 丙火为用' },
    11: { need: '火', info: '癸水仲冬 · 丙火为用 · 辛金佐之' },
    12: { need: '火', info: '癸水季冬 · 丙火为用' },
  },
}

export function getTiaoHou(dayGan: TianGan, month: number): { need: '木' | '火' | '土' | '金' | '水'; info: string } {
  return TIAOHOU_TABLE[dayGan][month] || { need: '水', info: '调候平和' }
}

// ============ 格局判定 ============

export function getGeJu(
  dayGan: TianGan,
  bazi: { year: TianGan; month: TianGan; hour: TianGan; monthZhi: DiZhi },
): { type: GeJuType; main: string; reasoning: string } {
  const monthZhi = bazi.monthZhi
  const cang = ZHI_CANGGAN[monthZhi]
  const allGan = [bazi.year, bazi.month, bazi.hour]
  const chuGan = allGan.find((g) => cang.includes(g))
  if (!chuGan) {
    return { type: '杂格', main: `${monthZhi}月令未透`, reasoning: '月令所藏未透干 · 需取年时为用' }
  }
  const tenGod = getTenGod(dayGan, chuGan)
  const geType = tenGodToGe(tenGod)
  return {
    type: geType,
    main: `${monthZhi}月 · 透 ${chuGan} · ${tenGod}`,
    reasoning: `月令 ${monthZhi} · 本气 ${cang[0]} · 透干 ${chuGan} · 取 ${tenGod} 局`,
  }
}

function getTenGod(dayGan: TianGan, other: TianGan): string {
  const dayWx = GAN_WUXING[dayGan]
  const otherWx = GAN_WUXING[other]
  const dayYin = ['甲', '丙', '戊', '庚', '壬'].includes(dayGan)
  const otherYin = ['甲', '丙', '戊', '庚', '壬'].includes(other)
  if (otherWx === dayWx) {
    if (dayYin === otherYin) return '比肩'
    return '劫财'
  }
  if (WUXING_KE[dayWx] === otherWx) {
    if (dayYin === otherYin) return '偏财'
    return '正财'
  }
  if (WUXING_KE[otherWx] === dayWx) {
    if (dayYin === otherYin) return '七杀'
    return '正官'
  }
  if (WUXING_SHENG[otherWx] === dayWx) {
    if (dayYin === otherYin) return '偏印'
    return '正印'
  }
  if (WUXING_SHENG[dayWx] === otherWx) {
    if (dayYin === otherYin) return '伤官'
    return '食神'
  }
  return '?'
}

function tenGodToGe(tenGod: string): GeJuType {
  const map: Record<string, GeJuType> = {
    正官: '正官格', 七杀: '七杀格', 正印: '正印格', 偏印: '偏印格',
    正财: '正财格', 偏财: '偏财格', 食神: '食神格', 伤官: '伤官格',
  }
  return map[tenGod] || '杂格'
}

// ============ 神煞 ============

export interface ShenSha {
  name: string
  pos: '年' | '月' | '日' | '时' | '多'
  desc: string
  level: '吉' | '中' | '凶'
}

const SHENSHA_LIST: Array<{
  name: string
  test: (bazi: any) => { pos: '年' | '月' | '日' | '时' | '多'; desc: string; level: '吉' | '中' | '凶' } | null
}> = [
  {
    name: '天乙贵人',
    test: (b) => {
      const map: Record<TianGan, DiZhi[]> = {
        甲: ['丑', '未'], 乙: ['子', '申'], 丙: ['亥', '酉'], 丁: ['亥', '酉'],
        戊: ['丑', '未'], 己: ['子', '申'], 庚: ['丑', '未'], 辛: ['寅', '午'],
        壬: ['卯', '巳'], 癸: ['卯', '巳'],
      }
      const list = map[b.dayGan]
      if (list.includes(b.yearZhi)) return { pos: '年', desc: '天乙贵人在年柱 · 主一生贵人相助', level: '吉' }
      if (list.includes(b.monthZhi)) return { pos: '月', desc: '天乙贵人在月柱 · 主事业顺遂', level: '吉' }
      if (list.includes(b.dayZhi)) return { pos: '日', desc: '天乙贵人在日柱 · 主本人聪慧', level: '吉' }
      if (list.includes(b.hourZhi)) return { pos: '时', desc: '天乙贵人在时柱 · 主子女贤达', level: '吉' }
      return null
    },
  },
  {
    name: '文昌贵人',
    test: (b) => {
      const map: Record<TianGan, DiZhi> = {
        甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申',
        己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯',
      }
      const w = map[b.dayGan]
      if (b.yearZhi === w) return { pos: '年', desc: '文昌在年 · 主家世书香', level: '吉' }
      if (b.monthZhi === w) return { pos: '月', desc: '文昌在月 · 主利学业', level: '吉' }
      if (b.dayZhi === w) return { pos: '日', desc: '文昌在日 · 主本人文雅', level: '吉' }
      if (b.hourZhi === w) return { pos: '时', desc: '文昌在时 · 主子女学业有成', level: '吉' }
      return null
    },
  },
  {
    name: '驿马',
    test: (b) => {
      const map: Record<DiZhi, DiZhi> = {
        申: '寅', 子: '寅', 辰: '寅', 寅: '申', 午: '申', 戌: '申',
        巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳',
      }
      const m = map[b.yearZhi] || map[b.dayZhi] || map[b.monthZhi]
      if (m === b.yearZhi || m === b.dayZhi || m === b.monthZhi || m === b.hourZhi) {
        return { pos: '多', desc: '驿马星动 · 主迁动、出行、远行', level: '中' }
      }
      return null
    },
  },
  {
    name: '桃花',
    test: (b) => {
      const map: Record<DiZhi, DiZhi> = {
        寅: '卯', 午: '卯', 戌: '卯', 巳: '酉', 酉: '酉', 丑: '酉',
        申: '子', 子: '子', 辰: '子', 亥: '卯', 卯: '子', 未: '午',
      }
      const t = map[b.yearZhi] || map[b.dayZhi]
      if (t === b.yearZhi || t === b.dayZhi || t === b.monthZhi || t === b.hourZhi) {
        return { pos: '多', desc: '桃花星动 · 主魅力、姻缘、艺术', level: '中' }
      }
      return null
    },
  },
  {
    name: '华盖',
    test: (b) => {
      const map: Record<DiZhi, DiZhi> = {
        寅: '戌', 午: '戌', 戌: '戌', 巳: '丑', 酉: '丑', 丑: '丑',
        申: '辰', 子: '辰', 辰: '辰', 亥: '未', 卯: '未', 未: '未',
      }
      const t = map[b.yearZhi] || map[b.dayZhi]
      if (t === b.yearZhi || t === b.dayZhi || t === b.monthZhi || t === b.hourZhi) {
        return { pos: '多', desc: '华盖星 · 主艺术、孤独、宗教、玄学', level: '中' }
      }
      return null
    },
  },
  {
    name: '将星',
    test: (b) => {
      const map: Record<DiZhi, DiZhi> = {
        寅: '午', 午: '午', 戌: '午', 巳: '酉', 酉: '酉', 丑: '酉',
        申: '子', 子: '子', 辰: '子', 亥: '卯', 卯: '卯', 未: '卯',
      }
      const t = map[b.yearZhi] || map[b.dayZhi]
      if (t === b.yearZhi || t === b.dayZhi || t === b.monthZhi || t === b.hourZhi) {
        return { pos: '多', desc: '将星 · 主权威、领导、决断', level: '吉' }
      }
      return null
    },
  },
]

export function getShenSha(bazi: any): ShenSha[] {
  return SHENSHA_LIST.map((s) => {
    const r = s.test(bazi)
    if (!r) return null
    return { name: s.name, ...r }
  }).filter((s): s is ShenSha => !!s)
}

// ============ 完整四柱详批 ============

export interface ZipingResult {
  bazi: { year: TianGan; month: TianGan; day: TianGan; hour: TianGan; yearZhi: DiZhi; monthZhi: DiZhi; dayZhi: DiZhi; hourZhi: DiZhi; month: number }
  dayMaster: { gan: TianGan; wx: '木' | '火' | '土' | '金' | '水'; state: DayMasterState; score: number; reasons: string[] }
  yueLing: YueLingInfo
  yongShen: YongShenResult
  geju: { type: GeJuType; main: string; reasoning: string }
  shenSha: ShenSha[]
  wuxingDist: Record<'木' | '火' | '土' | '金' | '水', number>
  summary: string
}

/** 从日期时间获取完整四柱详批 */
export function analyzeZipingFromDate(date: string, time: string): ZipingResult {
  const [y, m, d] = date.split('-').map(Number)
  const [hh] = time.split(':').map(Number)
  const b = calcBazi(y, m, d, hh)
  const monthIdx = getMonthFromZhi(b.month.zhi)
  const fullBazi = {
    year: b.year.gan, month: b.month.gan, day: b.day.gan, hour: b.hour.gan,
    yearZhi: b.year.zhi, monthZhi: b.month.zhi, dayZhi: b.day.zhi, hourZhi: b.hour.zhi,
    month: monthIdx,
  }
  return analyzeZiping(fullBazi)
}

export function analyzeZiping(bazi: { year: TianGan; month: TianGan; day: TianGan; hour: TianGan; yearZhi: DiZhi; monthZhi: DiZhi; dayZhi: DiZhi; hourZhi: DiZhi; month: number }): ZipingResult {
  const dayMaster = getDayMasterState(bazi.day, bazi)
  const yueLing = getYueLing(bazi.month)
  const yongShen = getYongShen(bazi.day, bazi)
  const geju = getGeJu(bazi.day, bazi)
  const shenSha = getShenSha({ ...bazi, dayGan: bazi.day })
  const allChars: { wx: '木' | '火' | '土' | '金' | '水' }[] = [
    { wx: GAN_WUXING[bazi.year] }, { wx: GAN_WUXING[bazi.month] },
    { wx: GAN_WUXING[bazi.day] }, { wx: GAN_WUXING[bazi.hour] },
    { wx: ZHI_WUXING[bazi.yearZhi] }, { wx: ZHI_WUXING[bazi.monthZhi] },
    { wx: ZHI_WUXING[bazi.dayZhi] }, { wx: ZHI_WUXING[bazi.hourZhi] },
  ]
  const wuxingDist: Record<'木' | '火' | '土' | '金' | '水', number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  allChars.forEach((c) => { wuxingDist[c.wx]++ })
  const summary = `${bazi.day}日主 · 属${GAN_WUXING[bazi.day]} · ${dayMaster.state} · 取${yongShen.type}用神 · 用 ${yongShen.yong} 喜 ${yongShen.xi} 忌 ${yongShen.ji}`
  return {
    bazi,
    dayMaster: { gan: bazi.day, wx: GAN_WUXING[bazi.day], state: dayMaster.state, score: dayMaster.score, reasons: dayMaster.reasons },
    yueLing,
    yongShen,
    geju,
    shenSha,
    wuxingDist,
    summary,
  }
}

export { WUXING_SHENG, WUXING_KE }
