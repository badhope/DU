/**
 * 玄枢 MISTVERSE · 手相分析（完整版）
 *
 *  - 八宫（坎/艮/震/巽/离/坤/兑/乾）
 *  - 十二丘（金/木/水/太阳/月/海/火/天狼/小腹/尾闾/少府/中府）
 *  - 三大主线（生命/智慧/感情）
 *  - 八种特殊掌纹（凤眼/通贯/断掌/十字/井字/星纹/三角/岛纹）
 *  - 12 流年（约 1-90 岁）
 */

export const BA_GONG = [
  {
    name: '乾宫',
    pos: '手腕上方（金星丘）',
    desc: '主祖业 · 父母 · 权威',
    element: '金' as const,
    score: 78,
  },
  {
    name: '兑宫',
    pos: '小指下方（太阴丘）',
    desc: '主艺术 · 才华 · 灵感',
    element: '金' as const,
    score: 75,
  },
  {
    name: '离宫',
    pos: '中指下方（太阳丘）',
    desc: '主财富 · 领导 · 自信',
    element: '火' as const,
    score: 82,
  },
  {
    name: '震宫',
    pos: '食指下方（木星丘）',
    desc: '主事业 · 进取 · 权威',
    element: '木' as const,
    score: 80,
  },
  {
    name: '巽宫',
    pos: '食指根（巽宫丘）',
    desc: '主交际 · 灵活 · 适应',
    element: '木' as const,
    score: 73,
  },
  {
    name: '坎宫',
    pos: '拇指球（金星丘）',
    desc: '主活力 · 健康 · 感情',
    element: '水' as const,
    score: 85,
  },
  {
    name: '艮宫',
    pos: '拇指根（艮宫丘）',
    desc: '主家宅 · 稳定 · 储蓄',
    element: '土' as const,
    score: 76,
  },
  {
    name: '坤宫',
    pos: '小指根（坤宫丘）',
    desc: '主情感 · 人缘 · 婚姻',
    element: '土' as const,
    score: 78,
  },
]

// ============ 12 丘 ============
export const SHI_ER_QIU: Array<{
  name: string
  pos: string
  desc: string
  element: '金' | '木' | '水' | '火' | '土'
  score: number
}> = [
  { name: '金星丘', pos: '拇指球', desc: '主活力·情爱·体力', element: '土', score: 80 },
  { name: '木星丘', pos: '食指根', desc: '主权力·野心·领导', element: '木', score: 78 },
  { name: '土星丘', pos: '中指根', desc: '主冷静·责任·孤独', element: '土', score: 70 },
  { name: '太阳丘', pos: '无名指根', desc: '主艺术·才学·财富', element: '火', score: 82 },
  { name: '水星丘', pos: '小指根', desc: '主商业·口才·机变', element: '水', score: 75 },
  { name: '太阴丘', pos: '小指下', desc: '主浪漫·灵性·才艺', element: '金', score: 73 },
  { name: '火星丘（正）', pos: '中指与木星间', desc: '主勇气·胆识', element: '火', score: 70 },
  { name: '火星丘（负）', pos: '拇指与木星间', desc: '主忍耐·坚持', element: '火', score: 68 },
  { name: '海王星丘', pos: '木星上方', desc: '主玄学·灵慧', element: '水', score: 76 },
  { name: '天狼星丘', pos: '中指下方', desc: '主神秘·直觉', element: '金', score: 74 },
  { name: '少府', pos: '手心', desc: '主德性·内养', element: '火', score: 78 },
  { name: '中府', pos: '手心中央', desc: '主气血·精气', element: '土', score: 80 },
]

export const SAN_ZHU = [
  {
    name: '生命线',
    desc: '主寿元 · 体能 · 抗压力 · 弧大则精力旺盛',
    quality: '佳' as '佳' | '中' | '弱',
    score: 80,
  },
  {
    name: '智慧线',
    desc: '主才智 · 思考 · 决断力 · 长而清晰则思维敏锐',
    quality: '佳' as '佳' | '中' | '弱',
    score: 78,
  },
  {
    name: '感情线',
    desc: '主情感 · 婚姻 · 人际 · 入木三分则情深义重',
    quality: '佳' as '佳' | '中' | '弱',
    score: 75,
  },
]

// ============ 八种特殊掌纹 ============
export const BA_ZHONG_ZHANG_WEN: Array<{
  name: string
  position: string
  desc: string
  rarity: '极罕' | '罕' | '少' | '常'
  omen: '吉' | '中' | '凶'
  meaning: string
}> = [
  {
    name: '凤眼纹',
    position: '中指第三节',
    desc: '中指中节有眼形纹',
    rarity: '极罕',
    omen: '吉',
    meaning: '主大贵 · 福泽绵长',
  },
  {
    name: '通贯掌',
    position: '智慧/感情一线连',
    desc: '智慧线与感情线合为一',
    rarity: '罕',
    omen: '中',
    meaning: '主才干独特 · 自立门户',
  },
  {
    name: '断掌',
    position: '手掌中央横断',
    desc: '主线中断或横纹明显',
    rarity: '少',
    omen: '中',
    meaning: '主性格刚毅 · 大起大落',
  },
  {
    name: '十字纹',
    position: '掌心任意部位',
    desc: '十字形纹',
    rarity: '常',
    omen: '吉',
    meaning: '主某事有定 · 平安吉祥',
  },
  {
    name: '井字纹',
    position: '掌心任意部位',
    desc: '井字形纹',
    rarity: '少',
    omen: '吉',
    meaning: '主财产稳固 · 守业有成',
  },
  {
    name: '星纹',
    position: '掌心任意部位',
    desc: '星形纹（多线辐射）',
    rarity: '罕',
    omen: '中',
    meaning: '主变动 · 某事显赫一时',
  },
  {
    name: '三角纹',
    position: '主线交汇处',
    desc: '三线相交成三角',
    rarity: '少',
    omen: '吉',
    meaning: '主才艺出众 · 智慧超人',
  },
  {
    name: '岛纹',
    position: '主线中',
    desc: '主线中有眼形闭合',
    rarity: '少',
    omen: '凶',
    meaning: '主某段虚耗 · 健康需防',
  },
]

// ============ 12 流年 ============
export const SHI_ER_LING: Array<{ name: string; pos: string; baseAge: number; desc: string }> = [
  { name: '坎宫少年', pos: '坎宫位', baseAge: 5, desc: '坎主幼年 · 体魄与亲情' },
  { name: '艮宫童蒙', pos: '艮宫位', baseAge: 13, desc: '艮主少年 · 学业与家业' },
  { name: '震宫志学', pos: '震宫位', baseAge: 21, desc: '震主青年 · 志业与立身' },
  { name: '巽宫立业', pos: '巽宫位', baseAge: 29, desc: '巽主立业 · 事业与交际' },
  { name: '离宫鼎盛', pos: '离宫位', baseAge: 37, desc: '离主鼎盛 · 权位与财禄' },
  { name: '坤宫中坚', pos: '坤宫位', baseAge: 45, desc: '坤主中坚 · 人际与情感' },
  { name: '兑宫成熟', pos: '兑宫位', baseAge: 53, desc: '兑主成熟 · 才艺与表达' },
  { name: '乾宫掌权', pos: '乾宫位', baseAge: 61, desc: '乾主掌权 · 威望与传承' },
  { name: '坎宫花甲', pos: '坎宫位', baseAge: 69, desc: '坎主花甲 · 修身与归藏' },
  { name: '艮宫古稀', pos: '艮宫位', baseAge: 77, desc: '艮主古稀 · 安养与子孙' },
  { name: '震宫伞寿', pos: '震宫位', baseAge: 85, desc: '震主伞寿 · 童心与精气' },
  { name: '巽宫乐天', pos: '巽宫位', baseAge: 93, desc: '巽主乐天 · 逍遥与福庆' },
]

export interface ShiErQiuItem {
  name: string
  pos: string
  desc: string
  element: '金' | '木' | '水' | '火' | '土'
  score: number
  level: '大吉' | '吉' | '平' | '凶'
  detail: string
}

export interface LiuNianItem {
  name: string
  pos: string
  baseAge: number
  userAge: number
  flow: '吉' | '平' | '凶'
  detail: string
}

export interface ShouxiangResult {
  baGong: typeof BA_GONG
  shiErQiu: ShiErQiuItem[]
  sanZhu: typeof SAN_ZHU
  baZhangWen: typeof BA_ZHONG_ZHANG_WEN
  liuNian: LiuNianItem[]
  totalScore: number
  level: '大吉' | '吉' | '平' | '凶'
  summary: string
  bestArea: string
  worstArea: string
  advice: string[]
}

export function calcShouxiang(year: number, month: number, day: number): ShouxiangResult {
  const base = 70 + ((year + month + day) % 7) - 3
  const baGong = BA_GONG.map((g, i) => ({
    ...g,
    score: Math.max(50, Math.min(95, base + i + (year % 5) - 2)),
  }))
  const sanZhu = SAN_ZHU.map((s, i) => ({
    ...s,
    score: Math.max(55, Math.min(95, base + i * 2 + (month % 3) - 1)),
    quality:
      base + i * 2 + (month % 3) - 1 > 80
        ? ('佳' as const)
        : base + i * 2 + (month % 3) - 1 > 65
          ? ('佳' as const)
          : ('中' as const),
  }))

  // 12 丘
  const shiErQiu: ShiErQiuItem[] = SHI_ER_QIU.map((q, i) => {
    const score = Math.max(50, Math.min(98, q.score + (i % 3) + (year % 5) - 4 + (month % 2)))
    let level: '大吉' | '吉' | '平' | '凶'
    if (score >= 88) level = '大吉'
    else if (score >= 75) level = '吉'
    else if (score >= 60) level = '平'
    else level = '凶'
    return {
      name: q.name,
      pos: q.pos,
      desc: q.desc,
      element: q.element,
      score,
      level,
      detail: `${q.name}（${q.pos}）${level} · 主${q.desc} · 宜${level === '大吉' || level === '吉' ? '生旺' : '节制'}`,
    }
  })

  // 12 流年
  const ageNow = new Date().getFullYear() - year
  const liuNian: LiuNianItem[] = SHI_ER_LING.map((b, i) => {
    const userAge = ageNow - b.baseAge
    const seed = (i * 7 + (year % 5) + (month % 3)) % 7
    let flow: '吉' | '平' | '凶'
    if (seed <= 2) flow = '吉'
    else if (seed <= 4) flow = '平'
    else flow = '凶'
    return {
      name: b.name,
      pos: b.pos,
      baseAge: b.baseAge,
      userAge,
      flow,
      detail: `${b.pos}流年${flow} · ${b.desc} · ${flow === '吉' ? '事可图' : flow === '平' ? '守中' : '慎行'}`,
    }
  })

  const sorted = [...baGong].sort((a, b) => b.score - a.score)
  const avgBg = baGong.reduce((s, g) => s + g.score, 0) / baGong.length
  const avgSz = sanZhu.reduce((s, g) => s + g.score, 0) / sanZhu.length
  const totalScore = Math.round(avgBg * 0.5 + avgSz * 0.5)

  let level: '大吉' | '吉' | '平' | '凶' = '平'
  if (totalScore >= 85) level = '大吉'
  else if (totalScore >= 70) level = '吉'
  else if (totalScore < 55) level = '凶'

  // 实用建议
  const advice: string[] = []
  const bestQ = shiErQiu.reduce((a, b) => (a.score > b.score ? a : b))
  const worstQ = shiErQiu.reduce((a, b) => (a.score < b.score ? a : b))
  advice.push(`主运宫位：${sorted[0]!.name}（${sorted[0]!.desc}）`)
  advice.push(`最强丘：${bestQ.name} · ${bestQ.detail}`)
  if (worstQ.level === '凶') advice.push(`慎防：${worstQ.name} · ${worstQ.detail}`)
  advice.push(
    `流年关注：${
      liuNian
        .filter((x) => x.flow === '吉')
        .slice(0, 2)
        .map((x) => x.name)
        .join('、') || '守中'
    }`,
  )
  advice.push('宜佩戴：玉/水晶/金器为常，或水晶阵以养气')

  return {
    baGong,
    shiErQiu,
    sanZhu,
    baZhangWen: BA_ZHONG_ZHANG_WEN,
    liuNian,
    totalScore,
    level,
    summary: `掌相总评 ${level} · 八宫${totalScore >= 70 ? '饱满' : '待养'} · 三线${avgSz > 75 ? '明朗' : '尚可'} · 12 丘${bestQ.level}`,
    bestArea: sorted[0]!.name,
    worstArea: sorted[sorted.length - 1]!.name,
    advice,
  }
}
