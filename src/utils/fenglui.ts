/**
 * 玄枢 MISTVERSE · 阳宅风水
 *
 *  - 八宅派：东四命/西四命 + 宅卦
 *  - 8 个方位吉凶
 *  - 大门/主卧/厨房/书房门位
 */

export const BA_ZHAI_GUA: Record<
  string,
  { name: string; element: '木' | '火' | '土' | '金' | '水'; description: string }
> = {
  dong: { name: '东四宅', element: '木', description: '坎/艮/震/巽 · 生旺方位以东/东南/南/北为主' },
  xi: {
    name: '西四宅',
    element: '金',
    description: '乾/兑/离/坤 · 生旺方位以西/西北/西南/东北为主',
  },
}

export const BA_GUA = [
  {
    key: 'kan',
    name: '坎',
    symbol: '☵',
    element: '水' as const,
    position: '北',
    fortune: 75,
    level: '中' as '吉' | '中' | '凶',
    meaning: '主事业 · 静思 · 水主智慧',
  },
  {
    key: 'gen',
    name: '艮',
    symbol: '☶',
    element: '土' as const,
    position: '东北',
    fortune: 80,
    level: '吉' as '吉' | '中' | '凶',
    meaning: '主止 · 安稳 · 慎行',
  },
  {
    key: 'zhen',
    name: '震',
    symbol: '☳',
    element: '木' as const,
    position: '东',
    fortune: 88,
    level: '吉' as '吉' | '中' | '凶',
    meaning: '主生发 · 行动 · 开创',
  },
  {
    key: 'xun',
    name: '巽',
    symbol: '☴',
    element: '木' as const,
    position: '东南',
    fortune: 82,
    level: '吉' as '吉' | '中' | '凶',
    meaning: '主入 · 顺 · 发展',
  },
  {
    key: 'li',
    name: '离',
    symbol: '☲',
    element: '火' as const,
    position: '南',
    fortune: 70,
    level: '中' as '吉' | '中' | '凶',
    meaning: '主文 · 礼 · 文明',
  },
  {
    key: 'kun',
    name: '坤',
    symbol: '☷',
    element: '土' as const,
    position: '西南',
    fortune: 65,
    level: '中' as '吉' | '中' | '凶',
    meaning: '主顺 · 厚德 · 包容',
  },
  {
    key: 'dui',
    name: '兑',
    symbol: '☱',
    element: '金' as const,
    position: '西',
    fortune: 55,
    level: '凶' as '吉' | '中' | '凶',
    meaning: '主悦 · 言语 · 慎言',
  },
  {
    key: 'qian',
    name: '乾',
    symbol: '☰',
    element: '金' as const,
    position: '西北',
    fortune: 50,
    level: '凶' as '吉' | '中' | '凶',
    meaning: '主健 · 严 · 领导',
  },
]

export const MEN_WEI: Array<{ key: string; name: string; recommended: string[] }> = [
  { key: 'dam', name: '大门', recommended: ['震', '巽', '艮', '离'] },
  { key: 'zhu', name: '主卧', recommended: ['坎', '震', '巽', '离'] },
  { key: 'chu', name: '厨房', recommended: ['巽', '离', '震'] },
  { key: 'shu', name: '书房', recommended: ['震', '巽', '离', '坎'] },
  { key: 'keting', name: '客厅', recommended: ['离', '震', '艮', '巽'] },
]

export interface FengluiResult {
  zhaiGua: 'dong' | 'xi'
  zhaiGuaName: string
  lifeMing: 'dong' | 'xi'
  lifeMingName: string
  baGua: typeof BA_GUA
  menWei: typeof MEN_WEI
  bestDirection: string
  totalScore: number
  level: '大吉' | '吉' | '平' | '凶'
  summary: string
  advice: string[]
  /** 24 山方位 */
  erShiSiShan: ErShiSiShanItem[]
  /** 玄空飞星（向盘+山盘） */
  xuanKong: XuanKongResult
  /** 当前元运（1-9） */
  currentYun: number
  /** 向星飞布 9 宫（含 1-9 飞星） */
  xiangPan: Array<{ gong: number; xing: number; level: '大吉' | '吉' | '中' | '凶' }>
}

// ============ 24 山 ============
// 24 山 = 八天干(无戊)+ 12 地支 + 8 卦（乾/坤/艮/巽/坎/离/震/兑）
// 每卦管 3 山，共 24 山，每山 15°
export const ER_SHI_SI_SHAN: Array<{
  zhi: string
  jia: string
  position: string
  element: '金' | '木' | '水' | '火' | '土'
  level: '吉' | '中' | '凶'
}> = [
  // 壬子癸（北 337.5°~22.5°）
  { zhi: '壬', jia: '子', position: '北偏东', element: '水', level: '中' },
  { zhi: '子', jia: '子', position: '正北', element: '水', level: '中' },
  { zhi: '癸', jia: '子', position: '北偏西', element: '水', level: '中' },
  // 丑艮寅（东北 22.5°~67.5°）
  { zhi: '丑', jia: '艮', position: '东北偏北', element: '土', level: '中' },
  { zhi: '艮', jia: '艮', position: '东北', element: '土', level: '吉' },
  { zhi: '寅', jia: '艮', position: '东北偏东', element: '木', level: '吉' },
  // 甲卯乙（东 67.5°~112.5°）
  { zhi: '甲', jia: '卯', position: '东偏北', element: '木', level: '吉' },
  { zhi: '卯', jia: '卯', position: '正东', element: '木', level: '吉' },
  { zhi: '乙', jia: '卯', position: '东偏南', element: '木', level: '吉' },
  // 辰巽巳（东南 112.5°~157.5°）
  { zhi: '辰', jia: '巽', position: '东南偏东', element: '土', level: '中' },
  { zhi: '巽', jia: '巽', position: '东南', element: '木', level: '吉' },
  { zhi: '巳', jia: '巽', position: '东南偏南', element: '火', level: '中' },
  // 丙午丁（南 157.5°~202.5°）
  { zhi: '丙', jia: '午', position: '南偏东', element: '火', level: '中' },
  { zhi: '午', jia: '午', position: '正南', element: '火', level: '中' },
  { zhi: '丁', jia: '午', position: '南偏西', element: '火', level: '中' },
  // 未坤申（西南 202.5°~247.5°）
  { zhi: '未', jia: '坤', position: '西南偏南', element: '土', level: '中' },
  { zhi: '坤', jia: '坤', position: '西南', element: '土', level: '中' },
  { zhi: '申', jia: '坤', position: '西南偏西', element: '金', level: '中' },
  // 庚酉辛（西 247.5°~292.5°）
  { zhi: '庚', jia: '酉', position: '西偏南', element: '金', level: '中' },
  { zhi: '酉', jia: '酉', position: '正西', element: '金', level: '凶' },
  { zhi: '辛', jia: '酉', position: '西偏北', element: '金', level: '中' },
  // 戌乾亥（西北 292.5°~337.5°）
  { zhi: '戌', jia: '乾', position: '西北偏西', element: '土', level: '中' },
  { zhi: '乾', jia: '乾', position: '西北', element: '金', level: '凶' },
  { zhi: '亥', jia: '乾', position: '西北偏北', element: '水', level: '中' },
]

export interface ErShiSiShanItem {
  zhi: string
  jia: string
  position: string
  element: '金' | '木' | '水' | '火' | '土'
  level: '吉' | '中' | '凶'
  index: number
  baseLevel: '吉' | '中' | '凶'
}

// ============ 玄空飞星 ============
// 1-9 运分对应 2004-2023 七运；2024 进入八运（2004-2023 二十年）
// 七运（2004-2023）：天运为七（兑）；八运（2024-2043）：八（艮）
const YUN_MING_XING: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
}

export interface XuanKongResult {
  yun: number
  xiang: number // 向星 (向所临 1-9)
  shan: number // 山星 (山所临 1-9)
  /** 向盘中宫飞星 */
  xiangPan: Array<{ gong: number; xing: number; level: '大吉' | '吉' | '中' | '凶' }>
  /** 山盘飞星 */
  shanPan: Array<{ gong: number; xing: number; level: '大吉' | '吉' | '中' | '凶' }>
  /** 山星落宫与运盘的吉凶分布 */
  luShen: Array<{ gong: number; xing: number; kind: '当旺' | '退煞' | '上元' | '生气' | '煞' }>
  summary: string
}

/** 当前元运（按公历年份） */
export function currentYun(year: number = new Date().getFullYear()): number {
  // 1996-2003 = 七运；2004-2023 = 八运；2024-2043 = 九运
  if (year < 2004) return 7
  if (year < 2024) return 8
  if (year < 2044) return 9
  if (year < 2064) return 1
  return 2
}

/** 玄空飞星：按运数 + 山/向起宫，旋转排列 9 宫 */
export function calcXuanKong(
  xiangIndex: number,
  shanIndex: number,
  yun: number = currentYun(),
): XuanKongResult {
  // 向盘：1 居中宫，向在的宫位起 yun，依次顺/逆
  // 简化：向星 1-9 直接填入向所临宫
  const xiangPan: XuanKongResult['xiangPan'] = []
  for (let g = 1; g <= 9; g++) {
    // 向星 落在 g 宫 = (g - xiangIndex + 9) % 9 + 1
    const xing = ((g - xiangIndex + 9) % 9) + 1
    const level = _xingLevel(xing, yun)
    xiangPan.push({ gong: g, xing, level })
  }
  // 山盘：与向盘算法相同，但起点不同
  const shanPan: XuanKongResult['shanPan'] = []
  for (let g = 1; g <= 9; g++) {
    const xing = ((g - shanIndex + 9) % 9) + 1
    const level = _xingLevel(xing, yun)
    shanPan.push({ gong: g, xing, level })
  }
  // 煞/旺
  const luShen = xiangPan.map((p) => {
    const isWang = p.xing === yun
    const isTuiWang = p.xing + yun === 10 // 合十为旺
    let kind: XuanKongResult['luShen'][0]['kind']
    if (isWang) kind = '当旺'
    else if (isTuiWang) kind = '退煞'
    else if ([1, 3, 7, 9].includes(p.xing)) kind = '生气'
    else if ([2, 4, 5, 6, 8].includes(p.xing)) kind = '煞'
    else kind = '上元'
    return { gong: p.gong, xing: p.xing, kind }
  })
  const summary = `${yun}运 · 向${xiangIndex}宫 · 山${shanIndex}宫 · 当旺星${xiangPan.find((p) => p.xing === yun)?.gong}宫`
  return { yun, xiang: xiangIndex, shan: shanIndex, xiangPan, shanPan, luShen, summary }
}

function _xingLevel(xing: number, yun: number): '大吉' | '吉' | '中' | '凶' {
  if (xing === yun) return '大吉' // 当旺
  if (xing + yun === 10) return '吉' // 合十旺
  if (Math.abs(xing - yun) === 1 || Math.abs(xing - yun) === 8) return '中' // 挨星相生
  return '凶'
}

/**
 * 基于出生年确定命卦
 * 男命：(100 - 出生年末两位) / 9
 * 女命：(出生年末两位 + 5) / 9
 * 余数对应卦
 */
export function calcFenglui(year: number, gender: '男' | '女'): FengluiResult {
  const lastTwo = year % 100
  let num = gender === '男' ? (100 - lastTwo) % 9 : (lastTwo + 5) % 9
  if (num === 0) num = 9

  // 1=坎 2=坤 3=震 4=巽 5=中(男坤女艮) 6=乾 7=兑 8=艮 9=离
  const map: Record<number, { gua: 'dong' | 'xi'; guaName: string }> = {
    1: { gua: 'dong', guaName: '坎' },
    2: { gua: 'xi', guaName: '坤' },
    3: { gua: 'dong', guaName: '震' },
    4: { gua: 'dong', guaName: '巽' },
    5: { gua: gender === '男' ? 'xi' : 'dong', guaName: gender === '男' ? '坤' : '艮' },
    6: { gua: 'xi', guaName: '乾' },
    7: { gua: 'xi', guaName: '兑' },
    8: { gua: 'dong', guaName: '艮' },
    9: { gua: 'dong', guaName: '离' },
  }

  const life = map[num]
  const zhaiGua = life.gua

  // 调整 8 宫吉凶（同属则吉，异属则凶）
  const adjustedBaGua = BA_GUA.map((b) => {
    const sameDong = ['坎', '艮', '震', '巽'].includes(b.name)
    const match = (zhaiGua === 'dong' && sameDong) || (zhaiGua === 'xi' && !sameDong)
    return {
      ...b,
      level: (match ? '吉' : '凶') as '吉' | '中' | '凶',
      fortune: match ? Math.min(95, b.fortune + 12) : Math.max(40, b.fortune - 12),
    }
  })

  const bestDirection =
    adjustedBaGua.sort((a, b) => b.fortune - a.fortune)[0].name +
    '（' +
    adjustedBaGua[0].position +
    '）'
  const avgScore = Math.round(adjustedBaGua.reduce((s, b) => s + b.fortune, 0) / 8)
  let level: '大吉' | '吉' | '平' | '凶' = '平'
  if (avgScore >= 85) level = '大吉'
  else if (avgScore >= 70) level = '吉'
  else if (avgScore < 55) level = '凶'

  // 24 山扩展（带命卦吉凶调整）
  const lifeLevel: '吉' | '中' | '凶' = ['坎', '艮', '震', '巽'].includes(life.guaName)
    ? zhaiGua === 'dong'
      ? '吉'
      : '凶'
    : zhaiGua === 'xi'
      ? '吉'
      : '凶'
  const erShiSiShan: ErShiSiShanItem[] = ER_SHI_SI_SHAN.map((s, idx) => {
    // 命卦同方为吉
    const sameQun = ['坎', '艮', '震', '巽'].some((g) => s.jia === g)
    const sameMing =
      (['坎', '艮', '震', '巽'].includes(life.guaName) && sameQun) ||
      (!['坎', '艮', '震', '巽'].includes(life.guaName) && !sameQun)
    const level: '吉' | '中' | '凶' = sameMing ? '吉' : s.level === '中' ? '中' : '凶'
    return { ...s, level, baseLevel: s.level, index: idx }
  })

  // 玄空飞星
  const yun = currentYun()
  const guaToNum: Record<string, number> = {
    坎: 1,
    坤: 2,
    震: 3,
    巽: 4,
    乾: 6,
    兑: 7,
    艮: 8,
    离: 9,
  }
  const xiangIndex = guaToNum[life.guaName] || 1
  const shanIndex = ((xiangIndex + 6 - 1) % 9) + 1 // 山对向
  const xuanKong = calcXuanKong(xiangIndex, shanIndex, yun)
  const xiangPan = xuanKong.xiangPan.map((p) => ({ gong: p.gong, xing: p.xing, level: p.level }))

  return {
    zhaiGua,
    zhaiGuaName: life.guaName,
    lifeMing: zhaiGua,
    lifeMingName: life.guaName,
    baGua: adjustedBaGua,
    menWei: MEN_WEI,
    bestDirection,
    totalScore: avgScore,
    level,
    summary: `命卦${life.guaName}（${BA_ZHAI_GUA[zhaiGua].name}） · ${yun}运 · 生旺方位：${bestDirection} · 宅运总评 ${level}`,
    advice: [
      `大门宜开在生旺方位：${bestDirection.split('（')[0]}`,
      `主卧宜在生气/延年位`,
      `厨房忌设在财位`,
      `书房宜向文昌（巽/离）`,
      `${yun}运当旺星${xiangPan.find((p) => p.level === '大吉')?.gong || '—'}宫，宜此方开门/立向`,
      '24 山向建议：',
      ...erShiSiShan
        .filter((s) => s.level === '吉')
        .slice(0, 5)
        .map((s) => `· ${s.zhi}${s.jia}（${s.position}）· ${s.element} · 吉`),
      lifeLevel === '吉' ? '命卦与宅卦同属，生气聚合' : '命卦与宅卦异属，宜借门/路化解',
    ],
    erShiSiShan,
    xuanKong,
    currentYun: yun,
    xiangPan,
  }
}
