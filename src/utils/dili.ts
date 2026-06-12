/**
 * 地理五诀 · 高级地理风水
 *
 * 出处：清·赵九峰《地理五诀》—— 峦头派理气正宗
 *
 * 五诀：
 *  1. 龙：山脉来势、走势、止势
 *  2. 穴：穴位点力、明堂、水城
 *  3. 砂：四神砂（青龙白虎朱雀玄武）
 *  4. 水：来水去水、三叉水口
 *  5. 向：立向、旺山旺向
 */

export type Direction = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315 // 二十四山（8 大向）
export type Element = '木' | '火' | '土' | '金' | '水'

export const DIRECTION_NAMES: Record<Direction, string> = {
  0: '正南', 45: '西南', 90: '正西', 135: '西北',
  180: '正北', 225: '东北', 270: '正东', 315: '东南',
}

export const DIRECTION_FULL: Record<Direction, { jia: string; jian: string; wei: string; ji: string; fiveEl: Element; wang: boolean }> = {
  0: { jia: '壬', jian: '子', wei: '丙', ji: '午', fiveEl: '水', wang: true },
  45: { jia: '丁', jian: '未', wei: '乙', ji: '巳', fiveEl: '火', wang: false },
  90: { jia: '庚', jian: '酉', wei: '甲', ji: '卯', fiveEl: '金', wang: true },
  135: { jia: '辛', jian: '戌', wei: '甲', ji: '寅', fiveEl: '金', wang: false },
  180: { jia: '丙', jian: '午', wei: '壬', ji: '子', fiveEl: '火', wang: true },
  225: { jia: '癸', jian: '丑', wei: '辛', ji: '酉', fiveEl: '土', wang: false },
  270: { jia: '甲', jian: '卯', wei: '庚', ji: '酉', fiveEl: '木', wang: true },
  315: { jia: '乙', jian: '辰', wei: '壬', ji: '子', fiveEl: '木', wang: false },
}

// ============ 龙 砂 穴 水 向 综合判断 ============

export interface DiliInput {
  /** 坐向（向为建筑朝向） */
  facing: Direction
  /** 主体方位：东南西北地理布局 */
  layout: {
    /** 后方（靠山/玄武） */
    back: '山' | '楼' | '水' | '路' | '空' | '宅'
    /** 左侧（青龙） */
    left: '山' | '楼' | '水' | '路' | '空' | '宅'
    /** 右侧（白虎） */
    right: '山' | '楼' | '水' | '路' | '空' | '宅'
    /** 前方（朱雀/明堂） */
    front: '山' | '楼' | '水' | '路' | '空' | '宅'
  }
  /** 楼/层高（米） */
  floorHeight?: number
  /** 层数 */
  floorCount?: number
  /** 大门方位（与 facing 可不同） */
  gateDirection: Direction
  /** 主事者五行（用于辅卦） */
  ownerElement: Element
}

export interface DiliAssessment {
  /** 总评分 0-100 */
  score: number
  /** 等级 */
  grade: '上上' | '上' | '中上' | '中' | '中下' | '下'
  /** 五大要素评分 */
  scores: {
    long: number  // 龙
    xue: number   // 穴
    sha: number   // 砂
    shui: number  // 水
    xiang: number // 向
  }
  /** 各方位吉凶 */
  directions: Array<{
    dir: '玄武' | '青龙' | '白虎' | '朱雀' | '中央'
    name: string
    actual: string
    ideal: string
    score: number
    comment: string
  }>
  /** 二十四山立向分析 */
  xiangAnalysis: {
    facing: Direction
    facingName: string
    facingWuXing: Element
    weiName: string
    isWang: boolean
    description: string
  }
  /** 大门吉凶 */
  gateAnalysis: {
    direction: Direction
    name: string
    wuXing: Element
    suitable: Element[]
    unsuitable: Element[]
    advice: string
  }
  /** 五行补益 */
  wuxingAdjust: {
    lack: Element[]
    excess: Element[]
    advice: string[]
  }
  /** 主要建议 */
  suggestions: string[]
}

/** 五行相生 */
const SHENG: Record<Element, Element> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
}
/** 五行相克 */
const KE: Record<Element, Element> = {
  木: '土', 火: '金', 土: '水', 金: '木', 水: '火',
}

/** 计算龙、砂、穴、水、向综合评分 */
export function analyzeDili(input: DiliInput): DiliAssessment {
  // 1. 龙（玄武）= 后方必须有山/楼
  const backMap: Record<string, number> = { 山: 30, 楼: 25, 宅: 20, 路: 10, 水: 5, 空: 0 }
  const longScore = backMap[input.layout.back] || 0

  // 2. 砂（青龙白虎）= 左右护卫
  const leftMap: Record<string, number> = { 山: 15, 楼: 13, 宅: 10, 路: 6, 水: 3, 空: 0 }
  const rightMap: Record<string, number> = { 山: 15, 楼: 13, 宅: 10, 路: 6, 水: 3, 空: 0 }
  const shaScore = (leftMap[input.layout.left] || 0) + (rightMap[input.layout.right] || 0)
  // 青龙宜高过白虎
  const dragonHigher = input.layout.left === '山' && input.layout.right !== '山' ? 5 : 0

  // 3. 穴（中央穴位）- 主位稳
  const xueScore = 20 // 默认稳
  let xueComment = '中央穴位端正'
  if (input.layout.back === '山' && (input.layout.left === '山' || input.layout.right === '山')) {
    xueScore + 5
    xueComment = '背山面水局 · 三面环护'
  }

  // 4. 水（前朱雀）= 收水吉
  const frontMap: Record<string, number> = { 水: 30, 路: 20, 空: 15, 宅: 10, 楼: 5, 山: 0 }
  const shuiScore = frontMap[input.layout.front] || 0

  // 5. 向 = 立向与五行配合
  const facingInfo = DIRECTION_FULL[input.facing]
  const xiangMatch = facingInfo.fiveEl === input.ownerElement
  const xiangSheng = SHENG[facingInfo.fiveEl] === input.ownerElement
  const xiangScore = xiangMatch ? 25 : xiangSheng ? 20 : 10

  const total = Math.min(100, longScore + shaScore + dragonHigher + shuiScore + xiangScore + 5)
  const grade: DiliAssessment['grade'] = total >= 90 ? '上上' : total >= 75 ? '上' : total >= 60 ? '中上' : total >= 45 ? '中' : total >= 30 ? '中下' : '下'

  // 方位分析
  const directions: DiliAssessment['directions'] = [
    {
      dir: '玄武', name: '后（玄武）', actual: input.layout.back, ideal: '山 / 楼', score: backMap[input.layout.back] || 0,
      comment: input.layout.back === '山' ? '玄武得位 · 靠山有力 · 主家业稳固' : input.layout.back === '楼' ? '楼宇为靠 · 亦主贵人扶持' : input.layout.back === '水' ? '后见水为「玄武水」· 反局 · 泄气' : '后方空缺 · 无靠 · 主孤立无援',
    },
    {
      dir: '青龙', name: '左（青龙）', actual: input.layout.left, ideal: '山 / 楼（高于白虎）', score: leftMap[input.layout.left] || 0,
      comment: input.layout.left === '山' ? '青龙得位 · 主阳刚、贵气、长子' : input.layout.left === '楼' ? '高楼为砂 · 阳气充沛' : '青龙低伏 · 阳气不足',
    },
    {
      dir: '白虎', name: '右（白虎）', actual: input.layout.right, ideal: '山 / 楼（低于青龙）', score: rightMap[input.layout.right] || 0,
      comment: input.layout.right === '山' ? '白虎得位 · 但宜低 · 不宜高于青龙' : '白虎空缺 · 主阴盛阳衰',
    },
    {
      dir: '朱雀', name: '前（朱雀）', actual: input.layout.front, ideal: '水 / 路（弯曲环抱）', score: frontMap[input.layout.front] || 0,
      comment: input.layout.front === '水' ? '朱雀水得位 · 收水聚财 · 主财源广进' : input.layout.front === '路' ? '前有道路 · 主远行、事业' : input.layout.front === '山' ? '前有山堵 · 朱雀受压 · 主事业阻滞' : '前明堂空旷 · 气散',
    },
    {
      dir: '中央', name: '中（穴位）', actual: '宅', ideal: '稳', score: 20, comment: '中央穴位 · 宜稳',
    },
  ]

  // 24 山立向分析
  const facingName = `${facingInfo.jia}${facingInfo.jian}山 · ${DIRECTION_NAMES[input.facing]}`
  const xiangAnalysis: DiliAssessment['xiangAnalysis'] = {
    facing: input.facing,
    facingName,
    facingWuXing: facingInfo.fiveEl,
    weiName: `${facingInfo.wei}${facingInfo.ji}向`,
    isWang: facingInfo.wang,
    description: facingInfo.wang
      ? `${facingName} 属${facingInfo.fiveEl} · 旺山旺向 · 三元不败 · 主发福绵长`
      : `${facingName} 属${facingInfo.fiveEl} · 衰山衰向 · 需依主事者五行催旺`,
  }

  // 大门分析
  const gateInfo = DIRECTION_FULL[input.gateDirection]
  const gateSuit: Element[] = []
  const gateAvoid: Element[] = []
  ;(Object.keys(SHENG) as Element[]).forEach((e) => {
    if (e === gateInfo.fiveEl) return
    if (SHENG[e] === gateInfo.fiveEl) gateSuit.push(e) // 克门五行（宅命门向阳）
    if (KE[e] === gateInfo.fiveEl) gateAvoid.push(e) // 被门五行所克
  })
  // 简化：与主事者五行相生者为宜
  const realSuit: Element[] = (Object.keys(SHENG) as Element[]).filter((e) => {
    if (e === input.ownerElement) return true
    if (SHENG[input.ownerElement] === e) return true
    if (SHENG[e] === input.ownerElement) return true
    return false
  })
  const realAvoid: Element[] = (Object.keys(SHENG) as Element[]).filter((e) => {
    if (KE[input.ownerElement] === e) return true
    if (KE[e] === input.ownerElement) return true
    return false
  })
  const gateAnalysis: DiliAssessment['gateAnalysis'] = {
    direction: input.gateDirection,
    name: `${gateInfo.jia}${gateInfo.jian}方`,
    wuXing: gateInfo.fiveEl,
    suitable: realSuit,
    unsuitable: realAvoid,
    advice: (() => {
      const ownerLine = `主事者属${input.ownerElement} · 门向 ${gateInfo.jian} 属${gateInfo.fiveEl}`
      if (realSuit.includes(gateInfo.fiveEl)) {
        return `${ownerLine} · 五行相生 · 大门纳气吉`
      }
      const remedy = realAvoid.includes(gateInfo.fiveEl) ? '五行通关' : '调整布局'
      return `${ownerLine} · 五行不和 · 可用${remedy}化解`
    })(),
  }

  // 五行补益
  const wuxingCount: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  wuxingCount[facingInfo.fiveEl]++
  wuxingCount[gateInfo.fiveEl]++
  Object.entries(input.layout).forEach(([k, v]) => {
    if (v === '山') {
      if (k === 'back') wuxingCount['土']++
      if (k === 'left') wuxingCount['木']++
      if (k === 'right') wuxingCount['金']++
      if (k === 'front') wuxingCount['火']++
    } else if (v === '水') {
      wuxingCount['水']++
    } else if (v === '楼') {
      wuxingCount['土']++
    }
  })
  const lack: Element[] = []
  const excess: Element[] = []
  ;(Object.keys(wuxingCount) as Element[]).forEach((e) => {
    if (wuxingCount[e] === 0) lack.push(e)
    if (wuxingCount[e] >= 3) excess.push(e)
  })
  const wuxingAdjust: DiliAssessment['wuxingAdjust'] = {
    lack,
    excess,
    advice: [],
  }
  if (lack.length) wuxingAdjust.advice.push(`缺 ${lack.join('、')} · 宜在家中东南方置木色绿植/青龙位木质家具`)
  if (excess.length) wuxingAdjust.advice.push(`${excess.join('、')}过旺 · 可在 ${SHENG[excess[0]]} 位摆放水景/水种以泄`)
  wuxingAdjust.advice.push(`主事者 ${input.ownerElement} · 助色：木→绿 · 火→红 · 土→黄 · 金→白 · 水→黑蓝`)

  // 总体建议
  const suggestions: string[] = []
  if (longScore < 20) suggestions.push('【龙】后方空虚无靠 · 建议在后方摆放高大实木书柜或屏风为靠')
  if (shaScore < 20) suggestions.push('【砂】左右护卫不足 · 可在青龙位（左侧）置高大木制家具，白虎位（右侧）置较低矮柜')
  if (shuiScore < 20) suggestions.push('【水】前无水 · 建议在前方（客厅）摆放鱼缸或流水摆件')
  if (xiangScore < 20) suggestions.push('【向】立向与主事者五行不和 · 调整大门朝向或主卧/书房位置')
  if (input.layout.left === input.layout.right && input.layout.left === '山') suggestions.push('【砂】青龙白虎等高 · 宜在青龙位加砂或白虎位降高以分阴阳')
  if (input.layout.back === '水') suggestions.push('【龙】后见水为反局 · 建议在后墙挂大型山水画或后院堆石为山')
  if (suggestions.length === 0) suggestions.push('峦头格局良好 · 建议以所缺五行之饰物微调')
  suggestions.push('【理气】三元九运（2024-2043 下元九运）· 离（火）方当旺 · 东（木）次旺 · 西（金）退气')
  suggestions.push('【大运】2026 丙午流年 · 火旺 · 五行属水者慎防过燥 · 属金者利')

  return {
    score: total,
    grade,
    scores: {
      long: longScore,
      xue: xueScore,
      sha: shaScore + dragonHigher,
      shui: shuiScore,
      xiang: xiangScore,
    },
    directions,
    xiangAnalysis,
    gateAnalysis,
    wuxingAdjust,
    suggestions,
  }
}
