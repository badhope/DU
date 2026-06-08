/**
 * 玄枢 MISTVERSE · 五福测算
 *
 * 五福：
 *  1. 寿 (long life)        — 用神 + 大运 + 季节
 *  2. 富 (wealth)           — 财星 + 财库 + 流年
 *  3. 康 (health)           — 强弱 + 忌神 + 调候
 *  4. 攸好德 (virtue)       — 印星 + 用神 + 调候
 *  5. 考终命 (peaceful end) — 末运 + 用神 + 五行平衡
 */

import {
  calcBazi,
  TIANGAN,
  DIZHI,
  TIANGAN_WUXING,
  DIZHI_WUXING,
  TIANGAN_YINYANG,
  type TianGan,
  type DiZhi,
} from './bazi'
import { calcDayun, dayunStrength, nayin, shishen, liunians } from './bazi-deep'
import type { Wuxing } from './wuxing'
import { SHENG, KE } from './wuxing'

// 五福维度
export type FuKey = 'shou' | 'fu' | 'kang' | 'de' | 'zhong'

export interface FuScore {
  shou: { score: number; level: '上' | '中' | '下'; brief: string; points: string[] }
  fu: { score: number; level: '上' | '中' | '下'; brief: string; points: string[] }
  kang: { score: number; level: '上' | '中' | '下'; brief: string; points: string[] }
  de: { score: number; level: '上' | '中' | '下'; brief: string; points: string[] }
  zhong: { score: number; level: '上' | '中' | '下'; brief: string; points: string[] }
}

export interface WufuResult {
  year: number
  month: number
  day: number
  hour: number
  gender: '男' | '女'
  bazi: ReturnType<typeof calcBazi>
  dayMaster: TianGan
  nayin: { name: string; desc: string }
  strength: { score: number; level: string; xi: Wuxing[]; ji: Wuxing[]; yong: Wuxing }
  scores: FuScore
  total: number
  level: '上上福' | '上等福' | '中等福' | '下等福'
  summary: string
  lifetime: Array<{
    age: number
    shou: number
    fu: number
    kang: number
    de: number
    zhong: number
    total: number
  }>
  bestAges: { age: number; type: FuKey; desc: string }[]
  worstAges: { age: number; type: FuKey; desc: string }[]
}

/**
 * 五福综合测算
 */
export function calcWufu(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: '男' | '女',
): WufuResult {
  const bazi = calcBazi(year, month, day, hour)
  const dayGan = bazi.day.gan
  const dayWx = TIANGAN_WUXING[dayGan]
  const dayYinYang = TIANGAN_YINYANG[dayGan]
  const strength = dayunStrength(bazi)
  const dayun = calcDayun(bazi, gender, year, month, day)
  const liunian = liunians(bazi, dayun.qiyunYear, 90)
  const n = nayin(bazi.year.gan, bazi.year.zhi)

  // ========== 1. 寿元 ==========
  let shouScore = 60
  const shouPoints: string[] = []
  // 日主旺相
  if (strength.level === '中和') {
    shouScore += 15
    shouPoints.push('日主中和 · 寿元稳健')
  } else if (strength.level === '偏旺') {
    shouScore += 8
    shouPoints.push('日主偏旺 · 阳气充沛')
  } else if (strength.level === '极旺') {
    shouScore -= 8
    shouPoints.push('日主极旺 · 阳亢耗损')
  } else if (strength.level === '偏弱') {
    shouScore += 5
    shouPoints.push('日主偏弱 · 需扶')
  } else if (strength.level === '极弱') {
    shouScore -= 15
    shouPoints.push('日主极弱 · 寿元有险')
  }
  // 用神
  if (['mu', 'huo'].includes(dayWx)) {
    // 木火主阳 · 火主礼 · 热情
    shouScore += dayYinYang === 'yang' ? 8 : 5
    shouPoints.push(`日干${dayGan} · ${dayYinYang}气充沛`)
  }
  // 大运顺/逆 + 时令
  const monthWx = DIZHI_WUXING[bazi.month.zhi]
  if (SHENG[monthWx] === dayWx || monthWx === dayWx) {
    shouScore += 8
    shouPoints.push(`月令生扶 · 得天时之利`)
  }
  // 季节
  if (dayWx === 'mu' && (bazi.month.zhi === '寅' || bazi.month.zhi === '卯')) {
    shouScore += 5
    shouPoints.push('生当令 · 木旺春生')
  }
  if (dayWx === 'huo' && (bazi.month.zhi === '午' || bazi.month.zhi === '巳')) {
    shouScore += 5
    shouPoints.push('生当令 · 火旺夏长')
  }
  // 印星
  const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour]
  const hasYin =
    pillars.filter(
      (p) =>
        p.gan &&
        (shishen(dayGan, p.gan as TianGan) === '正印' ||
          shishen(dayGan, p.gan as TianGan) === '偏印'),
    ).length > 0
  if (hasYin) {
    shouScore += 6
    shouPoints.push('印星得力 · 长寿之征')
  }
  shouScore = Math.max(20, Math.min(100, shouScore))

  // ========== 2. 富贵 ==========
  let fuScore = 60
  const fuPoints: string[] = []
  // 财星
  let hasCai = 0
  for (const p of [bazi.year, bazi.month, bazi.day, bazi.hour]) {
    if (
      p.gan &&
      (shishen(dayGan, p.gan as TianGan) === '正财' || shishen(dayGan, p.gan as TianGan) === '偏财')
    )
      hasCai++
  }
  if (hasCai >= 2) {
    fuScore += 12
    fuPoints.push(`财星透出 · 富贵可期`)
  } else if (hasCai === 1) {
    fuScore += 6
    fuPoints.push('财星一位 · 平稳')
  } else {
    fuPoints.push('财星不透 · 需大运流年引发')
  }
  // 财库
  const CAIKU_MAP: Record<Wuxing, DiZhi> = { mu: '未', huo: '戌', tu: '戌', jin: '丑', shui: '辰' }
  const caiku = CAIKU_MAP[dayWx]
  if (bazi.year.zhi === caiku || bazi.day.zhi === caiku) {
    fuScore += 8
    fuPoints.push('财库得位 · 聚财之兆')
  }
  // 食伤生财
  const hasShiShang =
    pillars.filter(
      (p) =>
        p.gan &&
        (shishen(dayGan, p.gan as TianGan) === '食神' ||
          shishen(dayGan, p.gan as TianGan) === '伤官'),
    ).length > 0
  if (hasShiShang) {
    fuScore += 6
    fuPoints.push('食伤生财 · 技艺致富')
  }
  // 大运走财
  const daiCai = dayun.steps.filter((s) => {
    const w = TIANGAN_WUXING[s.gan as TianGan]
    return w === 'jin' || w === 'mu' // 财为日主所克
  }).length
  if (daiCai >= 2) {
    fuScore += 5
    fuPoints.push(`大运遇财 · ${daiCai}步财运`)
  }
  fuScore = Math.max(20, Math.min(100, fuScore))

  // ========== 3. 康健 ==========
  let kangScore = 60
  const kangPoints: string[] = []
  // 强弱
  if (strength.level === '中和') {
    kangScore += 18
    kangPoints.push('日主中和 · 气血调畅')
  } else if (strength.level === '偏弱') {
    kangScore += 5
    kangPoints.push('日主偏弱 · 易疲劳')
  } else if (strength.level === '极弱') {
    kangScore -= 12
    kangPoints.push('日主极弱 · 体弱多病')
  }
  // 调候（最简：以月令是否为寒暖湿热判断）
  if (dayWx === 'jin' && (bazi.month.zhi === '午' || bazi.month.zhi === '未')) {
    kangScore += 8
    kangPoints.push('金生夏月 · 调候得宜')
  }
  if (dayWx === 'shui' && (bazi.month.zhi === '巳' || bazi.month.zhi === '午')) {
    kangScore += 8
    kangPoints.push('水生夏月 · 调候得宜')
  }
  // 忌神在月令
  const jiWx = strength.ji
  if (jiWx.includes(monthWx as Wuxing)) {
    kangScore -= 6
    kangPoints.push('忌神在月令 · 需调养')
  }
  // 偏印多
  const pianYinCount = pillars.filter(
    (p) => p.gan && shishen(dayGan, p.gan as TianGan) === '偏印',
  ).length
  if (pianYinCount >= 2) {
    kangScore -= 6
    kangPoints.push('偏印重叠 · 需注意')
  }
  kangScore = Math.max(20, Math.min(100, kangScore))

  // ========== 4. 攸好德 ==========
  let deScore = 60
  const dePoints: string[] = []
  // 印星（权印 = 权柄 + 修养）
  if (hasYin) {
    deScore += 15
    dePoints.push('印星得力 · 涵养深厚')
  }
  // 用神为正神
  if (strength.yong === 'jin' || strength.yong === 'tu') {
    deScore += 6
    dePoints.push('用神端正 · 道德有常')
  }
  // 食神（仁德）
  const hasShiShen =
    pillars.filter((p) => p.gan && shishen(dayGan, p.gan as TianGan) === '食神').length > 0
  if (hasShiShen) {
    deScore += 8
    dePoints.push('食神秀气 · 仁德之质')
  }
  // 七杀有制
  const hasQisha =
    pillars.filter((p) => p.gan && shishen(dayGan, p.gan as TianGan) === '七杀').length > 0
  const hasShi =
    pillars.filter(
      (p) =>
        p.gan &&
        (shishen(dayGan, p.gan as TianGan) === '食神' ||
          shishen(dayGan, p.gan as TianGan) === '正印'),
    ).length > 0
  if (hasQisha && hasShi) {
    deScore += 6
    dePoints.push('杀印相生 · 权德兼具')
  }
  deScore = Math.max(20, Math.min(100, deScore))

  // ========== 5. 考终命 ==========
  let zhongScore = 60
  const zhongPoints: string[] = []
  // 末运（80-90 岁大运）
  const lastDayun = dayun.steps[dayun.steps.length - 1]
  if (lastDayun) {
    const lastWx = TIANGAN_WUXING[lastDayun.gan as TianGan]
    if (lastWx === dayWx) {
      zhongScore += 10
      zhongPoints.push('末运比和 · 善终')
    } else if (SHENG[lastWx] === dayWx) {
      zhongScore += 6
      zhongPoints.push('末运生扶 · 安享')
    } else if (KE[lastWx] === dayWx) {
      zhongScore -= 8
      zhongPoints.push('末运受克 · 需慎')
    }
  }
  // 五行平衡
  const allWx = new Set<Wuxing>()
  for (const p of [bazi.year, bazi.month, bazi.day, bazi.hour]) {
    allWx.add(TIANGAN_WUXING[p.gan as TianGan])
    allWx.add(DIZHI_WUXING[p.zhi as DiZhi])
  }
  if (allWx.size >= 4) {
    zhongScore += 8
    zhongPoints.push('五行流通 · 终有归着')
  } else if (allWx.size <= 2) {
    zhongScore -= 10
    zhongPoints.push('五行偏枯 · 终局不安')
  }
  // 调候有情
  if (bazi.hour.gan) {
    const hourGanShishen = shishen(dayGan, bazi.hour.gan as TianGan)
    if (['正印', '食神', '偏财'].includes(hourGanShishen)) {
      zhongScore += 6
      zhongPoints.push('时柱有情 · 归宿安定')
    }
  }
  zhongScore = Math.max(20, Math.min(100, zhongScore))

  // ========== 等级 ==========
  function levelOf(s: number): '上' | '中' | '下' {
    if (s >= 78) return '上'
    if (s >= 60) return '中'
    return '下'
  }
  const scores: FuScore = {
    shou: {
      score: shouScore,
      level: levelOf(shouScore),
      brief: shouPoints.join(' · '),
      points: shouPoints,
    },
    fu: { score: fuScore, level: levelOf(fuScore), brief: fuPoints.join(' · '), points: fuPoints },
    kang: {
      score: kangScore,
      level: levelOf(kangScore),
      brief: kangPoints.join(' · '),
      points: kangPoints,
    },
    de: { score: deScore, level: levelOf(deScore), brief: dePoints.join(' · '), points: dePoints },
    zhong: {
      score: zhongScore,
      level: levelOf(zhongScore),
      brief: zhongPoints.join(' · '),
      points: zhongPoints,
    },
  }

  const total = Math.round((shouScore + fuScore + kangScore + deScore + zhongScore) / 5)
  const flevel: WufuResult['level'] =
    total >= 85 ? '上上福' : total >= 72 ? '上等福' : total >= 60 ? '中等福' : '下等福'
  const summary = `五福合 ${total} 分 · ${flevel} · ${shouPoints[0] || ''} · ${fuPoints[0] || ''} · ${kangPoints[0] || ''} · ${dePoints[0] || ''} · ${zhongPoints[0] || ''}`

  // ========== 终身曲线（90 年） ==========
  const lifetime: WufuResult['lifetime'] = []
  for (let i = 0; i < liunian.length; i++) {
    const y = liunian[i]
    const step = dayun.steps.find((s) => y.age >= s.startAge && y.age <= s.endAge)
    const stepIdx = step ? dayun.steps.indexOf(step) : 0
    const dayunBoost = stepIdx <= 3 ? 5 : stepIdx <= 6 ? 3 : -2
    const sShou = Math.max(
      20,
      Math.min(
        100,
        shouScore +
          (i < 30 ? 5 : i < 60 ? 0 : -5) +
          (step && SHENG[step.nayinWx] === dayWx ? 3 : 0),
      ),
    )
    const sFu = Math.max(
      20,
      Math.min(
        100,
        fuScore +
          (i > 25 && i < 60 ? 6 : 0) +
          (step && (step.nayinWx === 'jin' || step.nayinWx === 'mu') ? 4 : 0),
      ),
    )
    const sKang = Math.max(
      20,
      Math.min(100, kangScore + (i < 50 ? 4 : -6) + (step && step.nayinWx === dayWx ? 3 : 0)),
    )
    const sDe = Math.max(
      20,
      Math.min(100, deScore + (i > 35 ? 4 : 0) + (step && step.nayinWx === 'tu' ? 3 : 0)),
    )
    const sZhong = Math.max(
      20,
      Math.min(100, zhongScore + (i > 70 ? -5 : 0) + (step && step.nayinWx === 'jin' ? 4 : 0)),
    )
    const total2 = Math.round((sShou + sFu + sKang + sDe + sZhong) / 5)
    lifetime.push({
      age: y.age,
      shou: sShou,
      fu: sFu,
      kang: sKang,
      de: sDe,
      zhong: sZhong,
      total: total2,
    })
  }

  // ========== 最佳/最差年龄 ==========
  const sorted = [...lifetime].sort((a, b) => b.total - a.total)
  const FU_LABEL: Record<FuKey, string> = {
    shou: '寿',
    fu: '富',
    kang: '康',
    de: '德',
    zhong: '终',
  }
  const bestAges: WufuResult['bestAges'] = sorted.slice(0, 5).map((s) => {
    const arr: Array<{ k: FuKey; v: number }> = [
      { k: 'shou', v: s.shou },
      { k: 'fu', v: s.fu },
      { k: 'kang', v: s.kang },
      { k: 'de', v: s.de },
      { k: 'zhong', v: s.zhong },
    ]
    arr.sort((a, b) => b.v - a.v)
    return {
      age: s.age,
      type: arr[0].k,
      desc: `${s.age}岁 · ${FU_LABEL[arr[0].k]}最盛 · 总分${s.total}`,
    }
  })
  const worstAges: WufuResult['worstAges'] = sorted
    .slice(-5)
    .reverse()
    .map((s) => {
      const arr: Array<{ k: FuKey; v: number }> = [
        { k: 'shou', v: s.shou },
        { k: 'fu', v: s.fu },
        { k: 'kang', v: s.kang },
        { k: 'de', v: s.de },
        { k: 'zhong', v: s.zhong },
      ]
      arr.sort((a, b) => a.v - b.v)
      return {
        age: s.age,
        type: arr[0].k,
        desc: `${s.age}岁 · ${FU_LABEL[arr[0].k]}最弱 · 总分${s.total}`,
      }
    })

  return {
    year,
    month,
    day,
    hour,
    gender,
    bazi,
    dayMaster: dayGan,
    nayin: { name: n.name, desc: n.desc },
    strength,
    scores,
    total,
    level: flevel,
    summary,
    lifetime,
    bestAges,
    worstAges,
  }
}
