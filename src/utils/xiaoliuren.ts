/**
 * 玄枢 MISTVERSE · 小六壬 · 神课
 *
 * 又称"诸葛马前课"/"李淳风六壬"/"袖中金"
 * 6 神将：大安 / 留连 / 速喜 / 赤口 / 小吉 / 空亡
 *
 * 传统起课法（正确）：
 *   1. "大安"起正月（正月→大安，二月→留连，三月→速喜，四月→赤口，五月→小吉，六月→空亡）
 *   2. 到了本月所在神后，从该神起"日数"到当日（正月 d 日 → 大安起 1 数到 d）
 *   3. 到了当日所在神后，从该神起"时辰地支序数"到占时
 *   4. 最后一落点即神将
 */

import { HOUR_TO_DIZHI, type DiZhi } from './bazi'

export interface LiuShen {
  key: '大安' | '留连' | '速喜' | '赤口' | '小吉' | '空亡'
  index: number // 0-5
  name: string
  wuxing: string
  bodyPart: string // 人体部位
  meaning: string
  job: string // 谋望
  wealth: string // 求财
  illness: string // 疾病
  travel: string // 出行
  lawsuit: string // 诉讼
  marriage: string // 婚姻
  lost: string // 失物
  totalScore: number // 总评
}

const LIU_SHEN: LiuShen[] = [
  {
    key: '大安',
    index: 0,
    name: '大安',
    wuxing: '木',
    bodyPart: '五官 · 肝',
    meaning: '身不动时 · 五行属木 · 颜色青色 · 方位东方',
    job: '求名 · 应试皆利',
    wealth: '求财 · 不出本方',
    illness: '病在肝胆 · 不日可安',
    travel: '行人不归 · 必有所因',
    lawsuit: '诉讼不成',
    marriage: '婚姻可成 · 但需稍待',
    lost: '失物不动 · 仍在本处',
    totalScore: 90,
  },
  {
    key: '留连',
    index: 1,
    name: '留连',
    wuxing: '土',
    bodyPart: '脾胃 · 肌肉',
    meaning: '卒然不动 · 五行属土 · 颜色黄色 · 方位中央',
    job: '求谋未成 · 守旧',
    wealth: '求财 · 必迟',
    illness: '病在脾胃 · 须慎饮食',
    travel: '行人未归',
    lawsuit: '纠缠难解',
    marriage: '迟疑不决',
    lost: '失物难寻',
    totalScore: 50,
  },
  {
    key: '速喜',
    index: 2,
    name: '速喜',
    wuxing: '火',
    bodyPart: '心脏 · 小肠',
    meaning: '人便至时 · 五行属火 · 颜色红色 · 方位南方',
    job: '求谋 · 喜庆',
    wealth: '求财 · 速至',
    illness: '病在心脉 · 无妨',
    travel: '行人即至',
    lawsuit: '诉状可撤',
    marriage: '速成可期',
    lost: '失物速归',
    totalScore: 85,
  },
  {
    key: '赤口',
    index: 3,
    name: '赤口',
    wuxing: '金',
    bodyPart: '肺脏 · 大肠',
    meaning: '官事凶时 · 五行属金 · 颜色白色 · 方位西方',
    job: '求名 · 防小人',
    wealth: '求财 · 难成',
    illness: '病在肺 · 速治',
    travel: '行人 · 有阻',
    lawsuit: '凶 · 不可进',
    marriage: '口舌之争',
    lost: '失物难寻',
    totalScore: 30,
  },
  {
    key: '小吉',
    index: 4,
    name: '小吉',
    wuxing: '木',
    bodyPart: '肝 · 筋',
    meaning: '人来喜时 · 五行属木 · 颜色青色 · 方位东方',
    job: '求名 · 吉',
    wealth: '求财 · 必到',
    illness: '病在肝 · 不凶',
    travel: '行人 · 即至',
    lawsuit: '宜和',
    marriage: '成',
    lost: '失物 · 可得',
    totalScore: 75,
  },
  {
    key: '空亡',
    index: 5,
    name: '空亡',
    wuxing: '水',
    bodyPart: '肾 · 膀胱',
    meaning: '不吉之时 · 五行属水 · 颜色黑色 · 方位北方',
    job: '求名 · 不成',
    wealth: '求财 · 落空',
    illness: '病在肾 · 需重治',
    travel: '行人 · 不至',
    lawsuit: '凶',
    marriage: '不成',
    lost: '难寻',
    totalScore: 20,
  },
]

/**
 * 起课
 */
export function calcXiaoLiuRen(
  month: number,
  day: number,
  hour: number,
  question: 'job' | 'wealth' | 'illness' | 'travel' | 'lawsuit' | 'marriage' | 'lost' = 'job',
): {
  question: string
  questionLabel: string
  shen: LiuShen
  total: number
  shenIndex: number
  threeRemainder: number
  advice: string
} {
  // 时辰 → 地支序号（子=0, 丑=1, ... 亥=11）
  const hourZhi = HOUR_TO_DIZHI.find((z) => {
    if (z.start > z.end) return hour >= z.start || hour < z.end
    return hour >= z.start && hour < z.end
  })
  const hourZhiName: DiZhi = (hourZhi?.zhi || '子') as DiZhi
  const DIZHI_ORDER: DiZhi[] = [
    '子',
    '丑',
    '寅',
    '卯',
    '辰',
    '巳',
    '午',
    '未',
    '申',
    '酉',
    '戌',
    '亥',
  ]
  const hourIdx = DIZHI_ORDER.indexOf(hourZhiName)

  // 传统起课法：
  // 1) 月份定位：从大安起正月
  //    正月(1)→大安, 二月→留连, ... (循环 6 神)
  // 2) 从该位起日：到当日
  // 3) 从该位起时辰：到占时
  // 总步数 = (月份位移 + 日数位移 + 时辰位移) % 6
  // 月份位移 0 = 大安；日数从 1 起（1→当前位不动）；时辰从 1 起
  const monthStep = (((month - 1) % 6) + 6) % 6 // 正月=0, 二月=1
  const dayStep = (((day - 1) % 6) + 6) % 6 // 初一=0
  const hourStep = ((hourIdx % 6) + 6) % 6 // 子时=0
  const shenIndex = (monthStep + dayStep + hourStep) % 6
  const shen = LIU_SHEN[shenIndex]
  const threeRemainder = (month + day + hourIdx) % 3

  const questionMap = {
    job: '谋望',
    wealth: '求财',
    illness: '疾病',
    travel: '出行',
    lawsuit: '诉讼',
    marriage: '婚姻',
    lost: '失物',
  }

  return {
    question,
    questionLabel: questionMap[question],
    shen,
    total: monthStep + dayStep + hourStep,
    shenIndex,
    threeRemainder,
    advice: _advice(shen, question),
  }
}

function _advice(
  s: LiuShen,
  q: 'job' | 'wealth' | 'illness' | 'travel' | 'lawsuit' | 'marriage' | 'lost',
): string {
  const m = {
    job: s.job,
    wealth: s.wealth,
    illness: s.illness,
    travel: s.travel,
    lawsuit: s.lawsuit,
    marriage: s.marriage,
    lost: s.lost,
  } as const
  return m[q]
}

export const ALL_LIU_SHEN = LIU_SHEN
