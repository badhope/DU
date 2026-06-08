/**
 * 玄枢 MISTVERSE · 梅花易数
 *
 *  - 时间起卦（年月日时）
 *  - 先天数：年+月+日 / 年+月+日+时
 *  - 上卦 = (年+月+日) % 8，下卦 = (年+月+日+时) % 8
 *  - 动爻 = (年+月+日+时) % 6
 *  - 64 卦：体用关系、五行生克
 */

import type { Wuxing } from './bazi'
import { SHENG, KE } from './wuxing'

export const BAGUA_LIST = [
  { num: 1, name: '乾', symbol: '☰', nature: '天', wuxing: 'jin' as Wuxing, color: '#D4AF37' },
  { num: 2, name: '兑', symbol: '☱', nature: '泽', wuxing: 'jin' as Wuxing, color: '#E8E4D8' },
  { num: 3, name: '离', symbol: '☲', nature: '火', wuxing: 'huo' as Wuxing, color: '#C8302A' },
  { num: 4, name: '震', symbol: '☳', nature: '雷', wuxing: 'mu' as Wuxing, color: '#2F7D4F' },
  { num: 5, name: '巽', symbol: '☴', nature: '风', wuxing: 'mu' as Wuxing, color: '#2F7D4F' },
  { num: 6, name: '坎', symbol: '☵', nature: '水', wuxing: 'shui' as Wuxing, color: '#1B3A5C' },
  { num: 7, name: '艮', symbol: '☶', nature: '山', wuxing: 'tu' as Wuxing, color: '#A87C4F' },
  { num: 8, name: '坤', symbol: '☷', nature: '地', wuxing: 'tu' as Wuxing, color: '#A87C4F' },
]

// 后天八卦序：乾1 兑2 离3 震4 巽5 坎6 艮7 坤0
// 梅花易数起卦：上卦=（年+月+日）%8，下卦=（年+月+日+时）%8
// 时辰数：子1 丑2 寅3 ... 亥12
const HOUR_TO_NUM: Record<string, number> = {
  子: 1,
  丑: 2,
  寅: 3,
  卯: 4,
  辰: 5,
  巳: 6,
  午: 7,
  未: 8,
  申: 9,
  酉: 10,
  戌: 11,
  亥: 12,
}

// 64 卦象（卦象名 + 体用关系）
export interface MeihuaResult {
  upper: (typeof BAGUA_LIST)[number]
  lower: (typeof BAGUA_LIST)[number]
  hexName: string // 64 卦名
  upperTrigram: string // 上卦
  lowerTrigram: string // 下卦
  dongYao: number // 1-6
  ti: (typeof BAGUA_LIST)[number] // 体卦
  yong: (typeof BAGUA_LIST)[number] // 用卦
  bian: (typeof BAGUA_LIST)[number] // 变卦
  upperGua: number
  lowerGua: number
  dongGua: number
  interpretation: string
  // 5 维评分
  scores: { shiye: number; caiyun: number; ganqing: number; jiankang: number; jingshen: number }
  summary: string
  advice: string
}

/**
 * 由公历时间起卦（梅花易数）
 */
export function meihuaDivinate(
  year: number,
  month: number,
  day: number,
  hour: number,
): MeihuaResult {
  // 时辰 → 数
  const hourZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][
    Math.floor((hour + 1) / 2) % 12
  ]
  const hourNum = HOUR_TO_NUM[hourZhi]

  // 上卦 = (年+月+日) % 8 = 0 → 坤
  const upperNum = (year + month + day) % 8 || 8
  const lowerNum = (year + month + day + hourNum) % 8 || 8
  const dongGua = (year + month + day + hourNum) % 6
  const dongYao = dongGua === 0 ? 6 : dongGua

  const upper = BAGUA_LIST[upperNum - 1]
  const lower = BAGUA_LIST[lowerNum - 1]
  const bianUpper = dongYao <= 3 ? upper : BAGUA_LIST[(upperNum === 1 ? 8 : upperNum - 1) - 1] // 简单变
  const bianLower = dongYao > 3 ? lower : BAGUA_LIST[(lowerNum === 1 ? 8 : lowerNum - 1) - 1]

  // 64 卦名
  const hexName = `${upper.name}${lower.name}`

  // 体用关系：上卦=体 / 下卦=用
  const ti = upper
  const yong = lower
  const bian = dongYao <= 3 ? bianLower : bianUpper

  // 五行关系
  const tiWx = ti.wuxing
  const yongWx = yong.wuxing
  const bianWx = bian.wuxing

  let shiye = 50,
    caiyun = 50,
    ganqing = 50,
    jiankang = 50,
    jingshen = 50
  let interpretation = ''
  let summary = ''

  if (tiWx === yongWx) {
    // 比和
    shiye = 55
    caiyun = 55
    ganqing = 60
    jiankang = 60
    jingshen = 55
    interpretation = '体用比和 · 诸事平稳'
    summary = '主卦体用五行相同 · 凡事可成 · 无大起伏'
  } else if (SHENG[tiWx] === yongWx) {
    // 体生用：泄气
    shiye = 45
    caiyun = 45
    ganqing = 55
    jiankang = 40
    jingshen = 50
    interpretation = '体生用 · 泄气耗力 · 不宜妄动'
    summary = '主卦为体 · 下卦为用 · 体生用为泄 · 进则耗散 · 退守为上'
  } else if (SHENG[yongWx] === tiWx) {
    // 用生体：进财
    shiye = 70
    caiyun = 75
    ganqing = 65
    jiankang = 65
    jingshen = 65
    interpretation = '用生体 · 大吉之象 · 进财进喜'
    summary = '用生体 · 利求谋 · 可进 · 大利'
  } else if (KE[tiWx] === yongWx) {
    // 体克用：可成
    shiye = 70
    caiyun = 65
    ganqing = 55
    jiankang = 65
    jingshen = 60
    interpretation = '体克用 · 可成 · 但需费力'
    summary = '体克用 · 事可成就 · 须经辛苦'
  } else if (KE[yongWx] === tiWx) {
    // 用克体：凶险
    shiye = 35
    caiyun = 30
    ganqing = 40
    jiankang = 35
    jingshen = 35
    interpretation = '用克体 · 凶险之象 · 守正待时'
    summary = '用克体 · 不可妄动 · 退守为上 · 防小人'
  } else {
    interpretation = '五行平和'
    summary = '诸事平顺'
  }

  // 变卦影响
  if (bianWx === tiWx) {
    shiye += 5
    caiyun += 5
    jingshen += 5
  } else if (SHENG[bianWx] === tiWx) {
    shiye += 5
    caiyun += 5
    ganqing += 3
  } else if (KE[bianWx] === tiWx) {
    shiye -= 5
    caiyun -= 5
    jiankang -= 5
  }

  shiye = Math.max(20, Math.min(100, shiye))
  caiyun = Math.max(20, Math.min(100, caiyun))
  ganqing = Math.max(20, Math.min(100, ganqing))
  jiankang = Math.max(20, Math.min(100, jiankang))
  jingshen = Math.max(20, Math.min(100, jingshen))

  const adviceMap: Record<string, string> = {
    体用比和: '顺势而为 · 无需多虑',
    体生用: '宜静守 · 不宜冒进',
    用生体: '可乘势而上 · 大利求谋',
    体克用: '事可图 · 但需加倍努力',
    用克体: '退守为上 · 谨防是非',
  }

  return {
    upper,
    lower,
    hexName,
    upperTrigram: upper.name,
    lowerTrigram: lower.name,
    dongYao,
    ti,
    yong,
    bian,
    upperGua: upperNum,
    lowerGua: lowerNum,
    dongGua,
    interpretation,
    scores: { shiye, caiyun, ganqing, jiankang, jingshen },
    summary,
    advice: adviceMap[interpretation.split(' · ')[0]] || '慎行',
  }
}
