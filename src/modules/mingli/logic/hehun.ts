/**
 * 玄枢 MISTVERSE · 八字合婚
 *
 *  - 年命纳音合/破
 *  - 日柱天干合
 *  - 日柱地支六合/三合/六冲/六害
 *  - 五行互补分析
 *  - 双方日主强弱
 *  - 综合评分
 */

import { calcBazi } from '@/modules/mingli/logic/bazi'
import {
  TIANGAN as _TIANGAN,
  DIZHI as _DIZHI,
  TIANGAN_WUXING,
  DIZHI_WUXING,
  type TianGan,
  type DiZhi,
} from '@/modules/mingli/logic/bazi'
import { nayin, calcDayun as _calcDayun, dayunStrength, shishen as _shishen } from '@/modules/mingli/logic/bazi-deep'
import type { Wuxing } from '@/modules/mingli/logic/wuxing'
import { SHENG, KE } from '@/modules/mingli/logic/wuxing'

// 六合：子丑、寅亥、卯戌、辰酉、巳申、午未
const LIUHE: Record<DiZhi, DiZhi> = {
  子: '丑',
  丑: '子',
  寅: '亥',
  亥: '寅',
  卯: '戌',
  戌: '卯',
  辰: '酉',
  酉: '辰',
  巳: '申',
  申: '巳',
  午: '未',
  未: '午',
}
// 六冲：子午、丑未、寅申、卯酉、辰戌、巳亥
const LIUCHONG: Record<DiZhi, DiZhi> = {
  子: '午',
  午: '子',
  丑: '未',
  未: '丑',
  寅: '申',
  申: '寅',
  卯: '酉',
  酉: '卯',
  辰: '戌',
  戌: '辰',
  巳: '亥',
  亥: '巳',
}
// 六害：子未、丑午、寅巳、卯辰、申亥、酉戌
const LIUHAI: Record<DiZhi, DiZhi> = {
  子: '未',
  未: '子',
  丑: '午',
  午: '丑',
  寅: '巳',
  巳: '寅',
  卯: '辰',
  辰: '卯',
  申: '亥',
  亥: '申',
  酉: '戌',
  戌: '酉',
}
// 三合：申子辰、寅午戌、亥卯未、巳酉丑
const SANHE_GROUPS: DiZhi[][] = [
  ['申', '子', '辰'],
  ['寅', '午', '戌'],
  ['亥', '卯', '未'],
  ['巳', '酉', '丑'],
]

// 天干合：甲己、乙庚、丙辛、丁壬、戊癸
const TIANGAN_HE: Record<TianGan, TianGan> = {
  甲: '己',
  己: '甲',
  乙: '庚',
  庚: '乙',
  丙: '辛',
  辛: '丙',
  丁: '壬',
  壬: '丁',
  戊: '癸',
  癸: '戊',
}

export interface HehunScore {
  total: number // 0-100
  level: '上等婚' | '中上等' | '中等' | '中下等' | '下等'
  year: number // 年命纳音
  day: number // 日柱合
  wuxing: number // 五行互补
  strength: number // 双方强弱
  brief: string
}

export interface HehunResult {
  man: {
    name: string
    bazi: ReturnType<typeof calcBazi>
    dayMaster: string
    strength: string
    nayin: string
  }
  woman: {
    name: string
    bazi: ReturnType<typeof calcBazi>
    dayMaster: string
    strength: string
    nayin: string
  }
  score: HehunScore
  yearNayin: { man: string; woman: string; relation: '合' | '比和' | '相生' | '相克'; desc: string }
  dayZhi: {
    man: DiZhi
    woman: DiZhi
    relation: '六合' | '六冲' | '六害' | '三合' | '比和' | '无特殊'
    desc: string
  }
  dayGan: {
    man: TianGan
    woman: TianGan
    relation: '天干合' | '比和' | '相生' | '相克'
    desc: string
  }
  wuxing: {
    man: Record<Wuxing, number>
    woman: Record<Wuxing, number>
    diff: Record<Wuxing, number>
    complement: { wo: Wuxing; her: Wuxing; desc: string }[]
  }
  suggestions: string[]
}

/**
 * 八字合婚核心算法
 */
export function hehun(
  manInput: { name: string; year: number; month: number; day: number; hour: number },
  womanInput: { name: string; year: number; month: number; day: number; hour: number },
): HehunResult {
  const manBazi = calcBazi(manInput.year, manInput.month, manInput.day, manInput.hour)
  const womanBazi = calcBazi(womanInput.year, womanInput.month, womanInput.day, womanInput.hour)

  // 年命纳音五行关系（双向判断）
  const manNayin = nayin(manBazi.year.gan, manBazi.year.zhi)
  const womanNayin = nayin(womanBazi.year.gan, womanBazi.year.zhi)
  const manYearWx = manNayin.wuxing
  const womanYearWx = womanNayin.wuxing
  let yearWxRel: '相生' | '被生' | '相克' | '被克' | '比和' | '其他'
  if (manYearWx === womanYearWx) yearWxRel = '比和'
  else if (SHENG[manYearWx] === womanYearWx)
    yearWxRel = '相生' // 男方生女方
  else if (SHENG[womanYearWx] === manYearWx)
    yearWxRel = '被生' // 男方被女方生
  else if (KE[manYearWx] === womanYearWx)
    yearWxRel = '相克' // 男方克女方
  else if (KE[womanYearWx] === manYearWx)
    yearWxRel = '被克' // 男方被女方克
  else yearWxRel = '其他'
  // 纳音有专合（仅同五行才算"年命同"），这里做五行简判
  const yearRel: '合' | '比和' | '相生' | '相克' =
    manNayin.name === womanNayin.name
      ? '合'
      : yearWxRel === '比和' || yearWxRel === '相生' || yearWxRel === '被生'
        ? '比和'
        : yearWxRel === '其他'
          ? '相生'
          : '相克'
  const yearDesc = {
    合: '年命相同，同气连枝，志趣相投',
    比和: '年命比和，性情相近，易共鸣',
    相生: '年命相生，相得益彰，互相成就',
    相克: '年命相克，需化解相冲',
  }[yearRel]

  // 日柱地支
  const mDz = manBazi.day.zhi
  const wDz = womanBazi.day.zhi
  let dayZhiRel: HehunResult['dayZhi']['relation'] = '无特殊'
  let dayZhiDesc = '日支无特殊关系，平淡相处'
  if (LIUHE[mDz] === wDz) {
    dayZhiRel = '六合'
    dayZhiDesc = '日支六合，天作之合，琴瑟和鸣'
  } else if (LIUCHONG[mDz] === wDz) {
    dayZhiRel = '六冲'
    dayZhiDesc = '日支六冲，性格碰撞，需要磨合'
  } else if (LIUHAI[mDz] === wDz) {
    dayZhiRel = '六害'
    dayZhiDesc = '日支六害，暗耗不合，宜多包容'
  } else if (SANHE_GROUPS.some((g) => g.includes(mDz) && g.includes(wDz))) {
    dayZhiRel = '三合'
    dayZhiDesc = '日支三合，气场相吸'
  } else if (mDz === wDz) {
    dayZhiRel = '比和'
    dayZhiDesc = '日支相同，步调一致'
  }

  // 日干
  const mDg = manBazi.day.gan
  const wDg = womanBazi.day.gan
  const mWx = TIANGAN_WUXING[mDg]
  const wWx = TIANGAN_WUXING[wDg]
  let dayGanRel: HehunResult['dayGan']['relation'] = '比和'
  let dayGanDesc = '日干比和，性情相合'
  if (TIANGAN_HE[mDg] === wDg) {
    dayGanRel = '天干合'
    dayGanDesc = '日干天干合，心意相通，情投意合'
  } else if (mDg === wDg) {
    dayGanRel = '比和'
    dayGanDesc = '日干相同，气质相近'
  } else if (SHENG[mWx] === wWx || SHENG[wWx] === mWx) {
    dayGanRel = '相生'
    dayGanDesc = '日干相生，互相滋养'
  } else if (KE[mWx] === wWx || KE[wWx] === mWx) {
    dayGanRel = '相克'
    dayGanDesc = '日干相克，需注意沟通'
  }

  // 五行统计
  const wxCount = (b: typeof manBazi): Record<Wuxing, number> => {
    const c: Record<Wuxing, number> = { mu: 0, huo: 0, tu: 0, jin: 0, shui: 0 }
    for (const p of [b.year, b.month, b.day, b.hour]) {
      c[TIANGAN_WUXING[p.gan]]++
      c[DIZHI_WUXING[p.zhi]]++
    }
    return c
  }
  const manWx = wxCount(manBazi)
  const womanWx = wxCount(womanBazi)
  const diff: Record<Wuxing, number> = { mu: 0, huo: 0, tu: 0, jin: 0, shui: 0 }
  ;(Object.keys(diff) as Wuxing[]).forEach((k) => (diff[k] = Math.abs(manWx[k] - womanWx[k])))

  // 五行互补分析
  const WX_LIST: Wuxing[] = ['mu', 'huo', 'tu', 'jin', 'shui']
  const complement: HehunResult['wuxing']['complement'] = []
  for (const k of WX_LIST) {
    if (manWx[k] >= 3 && womanWx[k] <= 1) {
      complement.push({ wo: k, her: SHENG[k], desc: `男方${k}旺，女方需${SHENG[k]}调和` })
    } else if (womanWx[k] >= 3 && manWx[k] <= 1) {
      complement.push({ wo: k, her: SHENG[k], desc: `女方${k}旺，男方需${SHENG[k]}调和` })
    }
  }

  // 双方日主强弱
  const manStr = dayunStrength(manBazi)
  const womanStr = dayunStrength(womanBazi)

  // 综合评分
  const yearScore = yearRel === '合' ? 95 : yearRel === '比和' ? 80 : yearRel === '相生' ? 85 : 50
  let dayScore =
    dayGanRel === '天干合' ? 95 : dayGanRel === '比和' ? 75 : dayGanRel === '相生' ? 80 : 50
  if (dayZhiRel === '六合') dayScore = Math.min(100, dayScore + 10)
  else if (dayZhiRel === '三合') dayScore = Math.min(100, dayScore + 8)
  else if (dayZhiRel === '六冲') dayScore -= 15
  else if (dayZhiRel === '六害') dayScore -= 10

  // 五行互补评分
  let wuxingScore = 70
  if (complement.length === 0) wuxingScore = 70
  else if (complement.length <= 2) wuxingScore = 85
  else wuxingScore = 60

  // 双方强度评分
  let strengthScore = 80
  if (manStr.level === '极旺' && womanStr.level === '极弱') strengthScore = 50
  if (manStr.level === '极弱' && womanStr.level === '极旺') strengthScore = 50
  if (
    (manStr.level === '偏旺' && womanStr.level === '偏弱') ||
    (manStr.level === '偏弱' && womanStr.level === '偏旺')
  )
    strengthScore = 75
  if (manStr.level === '中和' && womanStr.level === '中和') strengthScore = 90

  const total = Math.round(
    yearScore * 0.25 + dayScore * 0.4 + wuxingScore * 0.2 + strengthScore * 0.15,
  )
  const level: HehunScore['level'] =
    total >= 90
      ? '上等婚'
      : total >= 78
        ? '中上等'
        : total >= 65
          ? '中等'
          : total >= 50
            ? '中下等'
            : '下等'

  const brief = {
    上等婚: '天作之合，情投意合，宜室宜家',
    中上等: '佳偶天成，相辅相成，白头偕老',
    中等: '志趣相投，需包容磨合',
    中下等: '缘分尚可，多需化解',
    下等: '性格差异大，需深刻理解',
  }[level]

  // 建议
  const suggestions: string[] = []
  if (dayZhiRel === '六冲') suggestions.push('日支六冲，遇事多沟通，给彼此空间')
  if (dayZhiRel === '六合') suggestions.push('日支六合，珍惜缘分，遇事多商量')
  if (yearRel === '相克') suggestions.push('年命相克，可在合婚择日、婚房布置上做化解')
  if (complement.length > 0) suggestions.push('五行有所偏颇，日常饮食/穿着/饰品可互补')
  if (manStr.level === '极旺' && womanStr.level === '极弱')
    suggestions.push('男强女弱明显，女方宜培养独立自主')
  if (manStr.level === '极弱' && womanStr.level === '极旺')
    suggestions.push('女强男弱明显，男方需提升自信与担当')
  if (suggestions.length === 0) suggestions.push('双方八字相合，宜珍惜姻缘')

  return {
    man: {
      name: manInput.name,
      bazi: manBazi,
      dayMaster: manBazi.day.gan,
      strength: manStr.level,
      nayin: manNayin.name,
    },
    woman: {
      name: womanInput.name,
      bazi: womanBazi,
      dayMaster: womanBazi.day.gan,
      strength: womanStr.level,
      nayin: womanNayin.name,
    },
    score: {
      total,
      level,
      year: yearScore,
      day: dayScore,
      wuxing: wuxingScore,
      strength: strengthScore,
      brief,
    },
    yearNayin: { man: manNayin.name, woman: womanNayin.name, relation: yearRel, desc: yearDesc },
    dayZhi: { man: mDz, woman: wDz, relation: dayZhiRel, desc: dayZhiDesc },
    dayGan: { man: mDg, woman: wDg, relation: dayGanRel, desc: dayGanDesc },
    wuxing: { man: manWx, woman: womanWx, diff, complement },
    suggestions,
  }
}
