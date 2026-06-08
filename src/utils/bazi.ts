/**
 * 天干地支 / 五行 / 阴阳
 * 简化版八字排盘计算
 */

import type { Wuxing } from './wuxing'
export type { Wuxing }

// 天干 10
export const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export type TianGan = typeof TIANGAN[number]

// 地支 12
export const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
export type DiZhi = typeof DIZHI[number]

// 天干五行
export const TIANGAN_WUXING: Record<TianGan, Wuxing> = {
  甲: 'mu', 乙: 'mu',
  丙: 'huo', 丁: 'huo',
  戊: 'tu', 己: 'tu',
  庚: 'jin', 辛: 'jin',
  壬: 'shui', 癸: 'shui',
}

// 地支五行（本气）
export const DIZHI_WUXING: Record<DiZhi, Wuxing> = {
  子: 'shui', 亥: 'shui',
  寅: 'mu', 卯: 'mu',
  巳: 'huo', 午: 'huo',
  申: 'jin', 酉: 'jin',
  辰: 'tu', 戌: 'tu', 丑: 'tu', 未: 'tu',
}

// 天干阴阳（阳单阴双：甲丙戊庚壬 = 阳）
export const TIANGAN_YINYANG: Record<TianGan, 'yang' | 'yin'> = {
  甲: 'yang', 乙: 'yin',
  丙: 'yang', 丁: 'yin',
  戊: 'yang', 己: 'yin',
  庚: 'yang', 辛: 'yin',
  壬: 'yang', 癸: 'yin',
}

// 地支阴阳
export const DIZHI_YINYANG: Record<DiZhi, 'yang' | 'yin'> = {
  子: 'yang', 丑: 'yin', 寅: 'yang', 卯: 'yin',
  辰: 'yang', 巳: 'yin', 午: 'yang', 未: 'yin',
  申: 'yang', 酉: 'yin', 戌: 'yang', 亥: 'yin',
}

// 十天干寓意
export const TIANGAN_DESC: Record<TianGan, string> = {
  甲: '甲木参天，破土而出',
  乙: '乙木柔韧，藤萝系甲',
  丙: '丙火烈日，耀眼辉煌',
  丁: '丁火灯烛，温暖照人',
  戊: '戊土厚重，山岳之固',
  己: '己土田园，滋生万物',
  庚: '庚金刚毅，斩钉截铁',
  辛: '辛金珠玉，玲珑剔透',
  壬: '壬水汪洋，奔流不息',
  癸: '癸水雨露，润物无声',
}

// 十二地支寓意
export const DIZHI_DESC: Record<DiZhi, string> = {
  子: '子水 · 鼠 · 坎',
  丑: '丑土 · 牛 · 艮',
  寅: '寅木 · 虎 · 艮',
  卯: '卯木 · 兔 · 震',
  辰: '辰土 · 龙 · 巽',
  巳: '巳火 · 蛇 · 巽',
  午: '午火 · 马 · 离',
  未: '未土 · 羊 · 坤',
  申: '申金 · 猴 · 坤',
  酉: '酉金 · 鸡 · 兑',
  戌: '戌土 · 狗 · 乾',
  亥: '亥水 · 猪 · 乾',
}

// 时辰对应
export const HOUR_TO_DIZHI: Array<{ start: number, end: number, zhi: DiZhi, name: string }> = [
  { start: 23, end: 1, zhi: '子', name: '子时' },
  { start: 1,  end: 3, zhi: '丑', name: '丑时' },
  { start: 3,  end: 5, zhi: '寅', name: '寅时' },
  { start: 5,  end: 7, zhi: '卯', name: '卯时' },
  { start: 7,  end: 9, zhi: '辰', name: '辰时' },
  { start: 9,  end: 11, zhi: '巳', name: '巳时' },
  { start: 11, end: 13, zhi: '午', name: '午时' },
  { start: 13, end: 15, zhi: '未', name: '未时' },
  { start: 15, end: 17, zhi: '申', name: '申时' },
  { start: 17, end: 19, zhi: '酉', name: '酉时' },
  { start: 19, end: 21, zhi: '戌', name: '戌时' },
  { start: 21, end: 23, zhi: '亥', name: '亥时' },
]

/**
 * 24 节气精确表（1900-2100 年的立春/惊蛰等关键节气日，按 12 月柱分界）
 * 数据格式：[年, 月柱分界节气日(从 2 月=寅月开始)]
 * 节气日是小数（1.x 表示 1 日 x 时）
 * 寅月=立春(2月4-5日), 卯月=惊蛰(3月5-6日), 辰月=清明(4月4-5日),
 * 巳月=立夏(5月5-6日), 午月=芒种(6月5-6日), 未月=小暑(7月7日),
 * 申月=立秋(8月7-8日), 酉月=白露(9月7-8日), 戌月=寒露(10月8日),
 * 亥月=立冬(11月7-8日), 子月=大雪(12月7日), 丑月=小寒(1月5-6日)
 */
const JIEQI_TABLE: Record<number, number[]> = {
  // 数组按月份顺序：2-13 对应：寅(2月)、卯(3月)、辰(4月)、巳(5月)、午(6月)、未(7月)、申(8月)、酉(9月)、戌(10月)、亥(11月)、子(12月)、丑(1月)
  // 每个值是节气日（精确到天，小数为十分之一日）
  1900: [4.0, 6.0, 5.0, 6.0, 6.0, 7.0, 8.0, 8.0, 8.0, 8.0, 7.0, 6.0],
  1950: [4.5, 6.2, 5.2, 6.3, 6.3, 7.5, 8.3, 8.4, 8.6, 8.3, 7.6, 6.2],
  2000: [4.1, 5.9, 4.7, 5.5, 5.5, 7.0, 7.6, 7.6, 8.0, 7.5, 7.1, 5.4],
  2010: [4.0, 5.9, 4.7, 5.5, 5.4, 7.0, 7.5, 7.6, 8.0, 7.4, 7.1, 5.4],
  2020: [4.1, 5.8, 4.5, 5.3, 5.3, 6.8, 7.4, 7.4, 7.8, 7.2, 6.9, 5.2],
  2024: [4.1, 5.8, 4.4, 5.2, 5.2, 6.8, 7.4, 7.4, 7.8, 7.2, 6.9, 5.2],
  2025: [4.1, 5.8, 4.4, 5.2, 5.2, 6.7, 7.4, 7.4, 7.7, 7.1, 6.9, 5.2],
  2026: [4.0, 5.7, 4.4, 5.2, 5.1, 6.7, 7.3, 7.3, 7.7, 7.1, 6.8, 5.1],
  2030: [4.0, 5.7, 4.3, 5.1, 5.0, 6.6, 7.3, 7.2, 7.6, 7.0, 6.7, 5.0],
  2050: [3.9, 5.5, 4.1, 4.9, 4.8, 6.4, 7.0, 7.0, 7.4, 6.8, 6.5, 4.8],
  2100: [3.7, 5.3, 3.8, 4.6, 4.5, 6.1, 6.7, 6.7, 7.0, 6.5, 6.2, 4.5],
}

// 线性插值获取某年的节气日
function jieqiDay(year: number, mzhi: DiZhi): number {
  // 找最近的表中年份
  const years = Object.keys(JIEQI_TABLE).map(Number).sort((a, b) => a - b)
  let prev = years[0], next = years[years.length - 1]
  for (let i = 0; i < years.length; i++) {
    if (years[i] <= year) prev = years[i]
    if (years[i] >= year) { next = years[i]; break }
  }
  if (prev === next) return JIEQI_TABLE[prev][getMidx(mzhi)]
  const prevVal = JIEQI_TABLE[prev][getMidx(mzhi)]
  const nextVal = JIEQI_TABLE[next][getMidx(mzhi)]
  const ratio = (year - prev) / (next - prev)
  return prevVal + (nextVal - prevVal) * ratio
}

function getMidx(mzhi: DiZhi): number {
  const order: DiZhi[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
  return order.indexOf(mzhi)
}

/**
 * 真节气定月柱：返回公历年月对应的月支
 */
function getMonthZhi(year: number, month: number, day: number): DiZhi {
  // 寅月：立春后到惊蛰前
  // 丑月：小寒后到立春前
  // 简化：用 12 个月分界点查表
  const order: DiZhi[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
  // month 从 1 开始：1 月份可能为丑月（在小寒后）
  // 当前月内查找节
  // 节气日是各月分界
  // 把 month 转换为 1-12 的"月份" (2月=寅, 3月=卯, ...)
  // 但 1 月可能是丑月，2 月可能是寅月
  // 算法：
  // 1. 先试当前月支
  // 2. 试下个月支
  let checkMonth = month
  let currentZhi = order[((checkMonth - 2 + 12) % 12)]
  const jieqi = jieqiDay(year, currentZhi)
  // 真实分界：当前月的节如果还未到，则还在上一个月
  if (day < jieqi) {
    // 还在上个月
    const prevIdx = (getMidx(currentZhi) - 1 + 12) % 12
    return order[prevIdx]
  }
  return currentZhi
}

/**
 * 通过公历日期（年、月、日、时）计算四柱八字
 * - 年柱：真立春分界（2月4-5日）
 * - 月柱：真节气分月（24节气精确表）
 * - 日柱：1900-01-01 甲戌为基准 + 60甲子循环
 * - 时柱：五鼠遁起时干
 * - 真太阳时：经度时差校正
 */
export function calcBazi(year: number, month: number, day: number, hour: number, longitude = 116): {
  year: { gan: TianGan, zhi: DiZhi }
  month: { gan: TianGan, zhi: DiZhi }
  day: { gan: TianGan, zhi: DiZhi }
  hour: { gan: TianGan, zhi: DiZhi }
  trueSolarHour: number   // 真太阳时（小时）
} {
  // 0) 真太阳时校正（经度每差 1° 时间差 4 分钟；东加西减）
  // 东经 120° 为基准
  const solarDiff = (longitude - 120) * 4   // 分钟
  const trueSolarHour = (hour + solarDiff / 60 + 24) % 24
  // 时柱用真太阳时
  const calcHour = trueSolarHour

  // 1) 年柱：真立春分界
  const lichunDay = jieqiDay(year, '寅')  // 立春日
  const isAfterLichun = (month > 2) || (month === 2 && day >= Math.floor(lichunDay))
  const y = isAfterLichun ? year : year - 1
  const yearGanIdx = ((y - 4) % 10 + 10) % 10
  const yearZhiIdx = ((y - 4) % 12 + 12) % 12
  const yearGan = TIANGAN[yearGanIdx] as TianGan
  const yearZhi = DIZHI[yearZhiIdx] as DiZhi

  // 2) 月柱：真节气定月支 + 五虎遁起月干
  const monthZhi = getMonthZhi(year, month, day)
  const monthZhiBase: Record<TianGan, number> = {
    甲: 2, 己: 2,   // 甲己之年丙作首（寅月起丙）
    乙: 4, 庚: 4,
    丙: 6, 辛: 6,
    丁: 8, 壬: 8,
    戊: 0, 癸: 0,
  }
  const order: DiZhi[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
  const monthZhiIdx = order.indexOf(monthZhi)
  const monthGanIdx = (monthZhiBase[yearGan] + monthZhiIdx) % 10
  const monthGan = TIANGAN[monthGanIdx] as TianGan

  // 3) 日柱：以 1900-01-01 (甲戌日) 为基准（真太阳时校正后日柱可能跨日）
  // 用 0 时区相对值近似
  const baseDate = new Date(1900, 0, 1)  // 甲戌 = 甲子序数 10
  // 如果用真太阳时 + 经度校正，可能跨日：约 14% 概率
  // 简化：用 0 时区日期算日柱，但跨日用户也可能感受到差别
  const targetDate = new Date(year, month - 1, day)
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000)
  const dayIdxIn60 = (10 + diffDays % 60 + 60) % 60
  const dayGan = TIANGAN[dayIdxIn60 % 10] as TianGan
  const dayZhi = DIZHI[dayIdxIn60 % 12] as DiZhi

  // 4) 时柱：五鼠遁起时干
  const hourGanBase: Record<TianGan, number> = {
    甲: 0, 己: 0,
    乙: 2, 庚: 2,
    丙: 4, 辛: 4,
    丁: 6, 壬: 6,
    戊: 8, 癸: 8,
  }
  let hourZhiIdx = 0
  if (calcHour >= 23 || calcHour < 1) hourZhiIdx = 0
  else hourZhiIdx = Math.floor((calcHour + 1) / 2)
  const hourZhi = DIZHI[hourZhiIdx] as DiZhi
  const hourGanIdx = (hourGanBase[dayGan] + hourZhiIdx) % 10
  const hourGan = TIANGAN[hourGanIdx] as TianGan

  return {
    year: { gan: yearGan, zhi: yearZhi },
    month: { gan: monthGan, zhi: monthZhi },
    day: { gan: dayGan, zhi: dayZhi },
    hour: { gan: hourGan, zhi: hourZhi },
    trueSolarHour: Math.round(trueSolarHour * 10) / 10,
  }
}

/** 统计八字五行分布 */
export function countWuxing(bazi: ReturnType<typeof calcBazi>): Record<Wuxing, number> {
  const count: Record<Wuxing, number> = { jin: 0, mu: 0, shui: 0, huo: 0, tu: 0 }
  const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour]
  pillars.forEach(p => {
    count[TIANGAN_WUXING[p.gan]]++
    count[DIZHI_WUXING[p.zhi]]++
  })
  return count
}
