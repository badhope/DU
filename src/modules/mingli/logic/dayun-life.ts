/**
 * 玄枢 MISTVERSE · 大运流转（90 年五维运势）
 *
 *  - 输入：生辰 + 性别
 *  - 输出：90 年逐年 5 维（事业/财运/感情/健康/精神）运势
 *  - 4 期划分：成长期(0-20)/立业期(20-40)/盛年期(40-60)/守成期(60-90)
 *  - 10 大转折点（关键年 + 触发事件）
 *  - 90 年 SVG 曲线数据
 */

import { calcBazi, TIANGAN_WUXING, DIZHI_WUXING as _DIZHI_WUXING } from './bazi'
import { calcDayun, liunians } from './bazi-deep'
import type { Wuxing } from './wuxing'
import { SHENG, KE } from './wuxing'

export type LifeStage = 'chengzhang' | 'liye' | 'shengya' | 'shoucheng'

export const LIFE_STAGES: Array<{
  key: LifeStage
  name: string
  range: [number, number]
  desc: string
  theme: string
  color: string
}> = [
  {
    key: 'chengzhang',
    name: '成长期',
    range: [0, 20],
    desc: '禀受家学 · 童蒙养正 · 身心奠基',
    theme: 'mu',
    color: '#4FAE6F',
  },
  {
    key: 'liye',
    name: '立业期',
    range: [20, 40],
    desc: '发奋图强 · 立身立业 · 婚嫁育子',
    theme: 'huo',
    color: '#C8302A',
  },
  {
    key: 'shengya',
    name: '盛年期',
    range: [40, 60],
    desc: '事业巅峰 · 厚积薄发 · 中流砥柱',
    theme: 'tu',
    color: '#D4AF37',
  },
  {
    key: 'shoucheng',
    name: '守成期',
    range: [60, 90],
    desc: '含饴弄孙 · 颐养天年 · 返璞归真',
    theme: 'shui',
    color: '#1B3A5C',
  },
]

export interface YearFortune {
  age: number
  year: number // 公历年
  gan: string // 流年天干
  zhi: string // 流年地支
  ganzhi: string // 干支
  wuxing: Wuxing // 流年五行
  dayunGan: string // 当年所属大运
  dayunZhi: string
  dayunName: string
  stage: LifeStage
  scores: {
    shiye: number // 事业 0-100
    caiyun: number // 财运
    ganqing: number // 感情
    jiankang: number // 健康
    jingshen: number // 精神
    total: number // 总分
  }
  level: '大吉' | '吉' | '平' | '小凶' | '凶'
  highlight: string // 一句
  advice: string // 建议
  event: string // 模拟事件
  lucky: { wuxing: Wuxing; color: string; direction: string; number: number }
}

export interface LifeTurningPoint {
  age: number
  year: number
  type: '事业' | '财运' | '婚恋' | '健康' | '精神'
  level: '大吉' | '吉' | '平' | '小凶' | '凶'
  title: string
  desc: string
  // 与运势关联
  ganzhi: string
  wuxing: Wuxing
  dayunName: string
}

export interface LifeResult {
  year: number
  month: number
  day: number
  hour: number
  gender: '男' | '女'
  birth: { gan: string; zhi: string } // 年柱
  dayMaster: string
  // 90 年逐年
  years: YearFortune[]
  // 4 期评分
  stages: Array<{
    stage: LifeStage
    name: string
    range: [number, number]
    avgScore: number
    bestYear: { age: number; score: number }
    worstYear: { age: number; score: number }
    color: string
    desc: string
  }>
  // 10 大转折点
  turningPoints: LifeTurningPoint[]
  // 整体评价
  overall: {
    avgScore: number
    bestStage: LifeStage
    worstStage: LifeStage
    peakAge: number
    valleyAge: number
    summary: string
  }
  // 曲线数据
  curve: Array<{
    age: number
    total: number
    shiye: number
    caiyun: number
    ganqing: number
    jiankang: number
    jingshen: number
  }>
}

/**
 * 流年五行与日主的关系
 */
function wuXingRelation(
  dayWx: Wuxing,
  yearWx: Wuxing,
): {
  shiye: number
  caiyun: number
  ganqing: number
  jiankang: number
  jingshen: number
  baseDesc: string
} {
  if (dayWx === yearWx) {
    // 比和
    return {
      shiye: 50,
      caiyun: 50,
      ganqing: 65,
      jiankang: 60,
      jingshen: 55,
      baseDesc: '比和 · 平稳无波',
    }
  } else if (SHENG[dayWx] === yearWx) {
    // 流年生我 → 印星 → 利学业/贵人
    return {
      shiye: 60,
      caiyun: 55,
      ganqing: 60,
      jiankang: 60,
      jingshen: 75,
      baseDesc: '印星 · 利学业贵人',
    }
  } else if (SHENG[yearWx] === dayWx) {
    // 我生流年 → 食伤 → 利表达
    return {
      shiye: 70,
      caiyun: 65,
      ganqing: 55,
      jiankang: 60,
      jingshen: 65,
      baseDesc: '食伤 · 利表达技艺',
    }
  } else if (KE[dayWx] === yearWx) {
    // 我克流年 → 财星 → 利财运
    return {
      shiye: 65,
      caiyun: 75,
      ganqing: 50,
      jiankang: 55,
      jingshen: 55,
      baseDesc: '财星 · 利财运事业',
    }
  } else if (KE[yearWx] === dayWx) {
    // 流年克我 → 官杀 → 利事业但有压力
    return {
      shiye: 75,
      caiyun: 55,
      ganqing: 50,
      jiankang: 55,
      jingshen: 55,
      baseDesc: '官杀 · 利事业有压',
    }
  }
  return { shiye: 50, caiyun: 50, ganqing: 50, jiankang: 50, jingshen: 50, baseDesc: '平' }
}

/**
 * 大运五行加成
 */
function dayunBoost(dayunWx: Wuxing, dayWx: Wuxing): number {
  if (dayunWx === dayWx) return 8
  if (SHENG[dayunWx] === dayWx) return 6
  if (SHENG[dayWx] === dayunWx) return 4
  if (KE[dayunWx] === dayWx) return -6
  if (KE[dayWx] === dayunWx) return 3
  return 0
}

/**
 * 等级判定
 */
function levelOf(s: number): '大吉' | '吉' | '平' | '小凶' | '凶' {
  if (s >= 85) return '大吉'
  if (s >= 70) return '吉'
  if (s >= 55) return '平'
  if (s >= 40) return '小凶'
  return '凶'
}

/**
 * 一句 + 建议 + 模拟事件
 */
function generateYearText(
  age: number,
  stage: LifeStage,
  level: YearFortune['level'],
  dayunName: string,
  wuxing: Wuxing,
): { highlight: string; advice: string; event: string } {
  const HIGHLIGHT_MAP: Record<YearFortune['level'], string[]> = {
    大吉: ['天时地利 · 大展宏图', '贵人相助 · 万事亨通', '一飞冲天 · 势不可挡'],
    吉: ['稳中有进 · 小有所成', '风调雨顺 · 可进可取', '脚踏实地 · 渐入佳境'],
    平: ['平淡是真 · 守成为上', '平常心 · 安然度日', '不疾不徐 · 自有定数'],
    小凶: ['谨慎行事 · 防微杜渐', '退守为佳 · 静待时机', '小有波折 · 无伤大体'],
    凶: ['守正待时 · 不宜妄动', '低调隐忍 · 蓄势待发', '暂避锋芒 · 退一步海阔天空'],
  }
  const ADVICE_MAP: Record<LifeStage, string[]> = {
    chengzhang: ['专心学业 · 莫分心', '锻炼体魄 · 奠基根本', '培养德行 · 立志高远'],
    liye: ['勇于尝试 · 不怕失败', '慎择良友 · 谨慎婚恋', '积累经验 · 厚积薄发'],
    shengya: ['守成为主 · 不可冒进', '提携后进 · 广结善缘', '关注健康 · 调节身心'],
    shoucheng: ['颐养天年 · 恬淡虚无', '含饴弄孙 · 享受天伦', '修身养性 · 返璞归真'],
  }
  const EVENT_TEMPLATES: Record<Wuxing, string[]> = {
    mu: ['贵人引荐', '升学深造', '婚恋成婚', '乔迁之喜'],
    huo: ['事业腾飞', '社交活跃', '声名鹊起', '创意迸发'],
    tu: ['稳定守成', '置业添产', '家宅平安', '人脉广结'],
    jin: ['决断果敢', '变革创新', '权威树立', '技术精进'],
    shui: ['智慧深邃', '学习精进', '谋略深远', '内观自省'],
  }
  const hs = HIGHLIGHT_MAP[level]!
  const adv = ADVICE_MAP[stage]!
  const ev = EVENT_TEMPLATES[wuxing]!
  return {
    highlight: hs[age % hs.length],
    advice: adv[age % adv.length],
    event: `${dayunName} · ${ev[age % ev.length]}`,
  }
}

/**
 * 幸运五要素
 */
function luckyOf(age: number, yearWx: Wuxing): YearFortune['lucky'] {
  const COLORS: Record<Wuxing, string> = {
    mu: '青/绿',
    huo: '红/紫',
    tu: '黄/棕',
    jin: '白/金',
    shui: '黑/蓝',
  }
  const DIRECTIONS: Record<Wuxing, string> = {
    mu: '东',
    huo: '南',
    tu: '中',
    jin: '西',
    shui: '北',
  }
  return {
    wuxing: SHENG[yearWx],
    color: COLORS[SHENG[yearWx]],
    direction: DIRECTIONS[yearWx],
    number: [1, 6, 8, 9][age % 4],
  }
}

/**
 * 阶段判定
 */
function stageOf(age: number): LifeStage {
  if (age < 20) return 'chengzhang'
  if (age < 40) return 'liye'
  if (age < 60) return 'shengya'
  return 'shoucheng'
}

/**
 * 主函数：90 年大运流转
 */
export function calcLifeFortune(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: '男' | '女',
): LifeResult {
  const bazi = calcBazi(year, month, day, hour)
  const dayGan = bazi.day.gan
  const dayWx = TIANGAN_WUXING[dayGan]!
  const dayun = calcDayun(bazi, gender, year, month, day)
  const liunian = liunians(bazi, dayun.qiyunYear, 90)

  // ========== 逐年运势 ==========
  const years: YearFortune[] = []
  for (let i = 0; i < liunian.length; i++) {
    const y = liunian[i]!
    const yearWx = TIANGAN_WUXING[y.gan as keyof typeof TIANGAN_WUXING]!
    const step = dayun.steps.find((s) => y.age >= s.startAge && y.age <= s.endAge)
    const dayunWx = step ? TIANGAN_WUXING[step.gan as keyof typeof TIANGAN_WUXING] : dayWx
    const stage = stageOf(y.age)

    const relation = wuXingRelation(dayWx, yearWx)
    const boost = dayunBoost(dayunWx, dayWx)

    // 阶段加成
    const stageBoost: Record<LifeStage, number> = {
      chengzhang: -5, // 成长期总体偏低
      liye: 5, // 立业期加分
      shengya: 8, // 盛年期最佳
      shoucheng: -3, // 守成期平稳
    }

    const shiye = Math.max(
      20,
      Math.min(100, relation.shiye + boost + stageBoost[stage] + (stage === 'shengya' ? 4 : 0)),
    )
    const caiyun = Math.max(
      20,
      Math.min(
        100,
        relation.caiyun + boost + stageBoost[stage] + (y.age >= 25 && y.age <= 55 ? 5 : 0),
      ),
    )
    const ganqing = Math.max(
      20,
      Math.min(
        100,
        relation.ganqing + boost + stageBoost[stage] + (y.age >= 20 && y.age <= 30 ? 6 : 0),
      ),
    )
    const jiankang = Math.max(
      20,
      Math.min(
        100,
        relation.jiankang +
          boost -
          (y.age >= 60 ? Math.floor((y.age - 60) / 5) * 4 : 0) +
          (stage === 'shengya' ? 3 : 0),
      ),
    )
    const jingshen = Math.max(
      20,
      Math.min(100, relation.jingshen + boost + stageBoost[stage] + (y.age >= 50 ? 4 : 0)),
    )
    const total = Math.round((shiye + caiyun + ganqing + jiankang + jingshen) / 5)
    const level = levelOf(total)

    const text = generateYearText(
      y.age,
      stage,
      level,
      step ? `${step.gan}${step.zhi}` : '本运',
      yearWx,
    )
    const lucky = luckyOf(y.age, yearWx)

    years.push({
      age: y.age,
      year: y.year,
      gan: y.gan,
      zhi: y.zhi,
      ganzhi: `${y.gan}${y.zhi}`,
      wuxing: yearWx,
      dayunGan: step?.gan || '',
      dayunZhi: step?.zhi || '',
      dayunName: step ? `${step.gan}${step.zhi}` : '',
      stage,
      scores: { shiye, caiyun, ganqing, jiankang, jingshen, total },
      level,
      highlight: text.highlight,
      advice: text.advice,
      event: text.event,
      lucky,
    })
  }

  // ========== 4 期评分 ==========
  const stages: LifeResult['stages'] = LIFE_STAGES.map((s) => {
    const yrs = years.filter((y) => y.age >= s.range[0]! && y.age < s.range[1]!)
    const avg = yrs.length
      ? Math.round(yrs.reduce((sum, y) => sum + y.scores.total, 0) / yrs.length)
      : 50
    const sorted = [...yrs].sort((a, b) => b.scores.total - a.scores.total)
    return {
      stage: s.key,
      name: s.name,
      range: s.range,
      avgScore: avg,
      bestYear: sorted[0]!
        ? { age: sorted[0]!.age, score: sorted[0]!.scores.total }
        : { age: 0, score: 0 },
      worstYear: sorted[sorted.length - 1]
        ? { age: sorted[sorted.length - 1].age, score: sorted[sorted.length - 1].scores.total }
        : { age: 0, score: 0 },
      color: s.color,
      desc: s.desc,
    }
  })

  // ========== 10 大转折点 ==========
  // 算法：找出总分变化最大的 10 个年份
  const turningPoints: LifeTurningPoint[] = []
  const TP_TYPES: Array<{ type: LifeTurningPoint['type']; calc: (y: YearFortune) => number }> = [
    { type: '事业', calc: (y) => y.scores.shiye },
    { type: '财运', calc: (y) => y.scores.caiyun },
    { type: '婚恋', calc: (y) => y.scores.ganqing },
    { type: '健康', calc: (y) => y.scores.jiankang },
    { type: '精神', calc: (y) => y.scores.jingshen },
  ]
  // 收集所有极值
  const candidates: Array<{ y: YearFortune; type: LifeTurningPoint['type']; delta: number }> = []
  for (let i = 1; i < years.length; i++) {
    for (const tp of TP_TYPES) {
      const delta = tp.calc(years[i]) - tp.calc(years[i - 1])
      if (Math.abs(delta) >= 12) {
        candidates.push({ y: years[i], type: tp.type, delta })
      }
    }
  }
  candidates.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  const seenAges = new Set<number>()
  for (const c of candidates) {
    if (turningPoints.length >= 10) break
    if (seenAges.has(c.y.age)) continue
    seenAges.add(c.y.age)
    const lvl = c.delta > 0 ? (c.delta > 20 ? '大吉' : '吉') : c.delta < -20 ? '凶' : '小凶'
    turningPoints.push({
      age: c.y.age,
      year: c.y.year,
      type: c.type,
      level: lvl,
      title: `${c.y.age}岁（${c.y.year} ${c.y.ganzhi}）${c.type}${lvl === '大吉' || lvl === '吉' ? '转折' : '调整'}`,
      desc:
        c.delta > 0
          ? `${c.type}明显上升 · ${c.y.event} · ${c.y.highlight}`
          : `${c.type}有所调整 · ${c.y.event} · 建议${c.y.advice}`,
      ganzhi: c.y.ganzhi,
      wuxing: c.y.wuxing,
      dayunName: c.y.dayunName,
    })
  }
  // 若不足 10 个，用最大/最小补足
  if (turningPoints.length < 10) {
    const sortedAll = [...years].sort((a, b) => b.scores.total - a.scores.total)
    for (const y of sortedAll) {
      if (turningPoints.length >= 10) break
      if (seenAges.has(y.age)) continue
      seenAges.add(y.age)
      turningPoints.push({
        age: y.age,
        year: y.year,
        type: '事业',
        level: '大吉',
        title: `${y.age}岁（${y.year} ${y.ganzhi}）人生巅峰`,
        desc: `总分 ${y.scores.total} · ${y.highlight} · ${y.event}`,
        ganzhi: y.ganzhi,
        wuxing: y.wuxing,
        dayunName: y.dayunName,
      })
    }
  }
  turningPoints.sort((a, b) => a.age - b.age)

  // ========== 整体评价 ==========
  const avgScore = Math.round(years.reduce((s, y) => s + y.scores.total, 0) / years.length)
  const sortedYears = [...years].sort((a, b) => b.scores.total - a.scores.total)
  const peakAge = sortedYears[0]?.age || 0
  const valleyAge = sortedYears[sortedYears.length - 1]?.age || 0
  const bestStage = stages.reduce((a, b) => (a.avgScore > b.avgScore ? a : b)).stage
  const worstStage = stages.reduce((a, b) => (a.avgScore < b.avgScore ? a : b)).stage
  const summary = `90 年均分 ${avgScore} · 巅峰 ${peakAge} 岁（${years.find((y) => y.age === peakAge)?.ganzhi}）· 低谷 ${valleyAge} 岁 · ${LIFE_STAGES.find((s) => s.key === bestStage)?.name}最盛`

  // ========== 曲线数据 ==========
  const curve = years.map((y) => ({
    age: y.age,
    total: y.scores.total,
    shiye: y.scores.shiye,
    caiyun: y.scores.caiyun,
    ganqing: y.scores.ganqing,
    jiankang: y.scores.jiankang,
    jingshen: y.scores.jingshen,
  }))

  return {
    year,
    month,
    day,
    hour,
    gender,
    birth: { gan: bazi.year.gan, zhi: bazi.year.zhi },
    dayMaster: dayGan,
    years,
    stages,
    turningPoints,
    overall: { avgScore, bestStage, worstStage, peakAge, valleyAge, summary },
    curve,
  }
}
