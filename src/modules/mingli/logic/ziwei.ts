/**
 * 玄枢 MISTVERSE · 紫微斗数 · 完整排盘
 *
 * 核心要素：
 *  - 14 主星：紫微/天机/太阳/武曲/天同/廉贞/天府/太阴/贪狼/巨门/天相/天梁/七杀/破军
 *  - 6 助星：文昌/文曲/左辅/右弼/天魁/天钺
 *  - 12 宫：命/兄弟/夫妻/子女/财帛/疾厄/迁移/交友/官禄/田宅/福德/父母
 *  - 四化：化禄/化权/化科/化忌（按年干飞）
 *  - 五行局：水二/木三/金四/土五/火六（按命宫纳音决定）
 *  - 真算法：
 *    1) 命宫 = (寅 + (月-1) - 时辰序) mod 12
 *    2) 身宫 = (寅 + (月-1) + 时辰序) mod 12
 *    3) 五行局 = 命宫纳音（水/木/金/土/火）
 *    4) 紫微位 = 寅起，按五行局步长数（day-1）步
 *    5) 天府 = 与紫微同宫/对宫
 *    6) 余主星按紫微/天府固定偏移安星
 */

import { TIANGAN, DIZHI, calcBazi, type TianGan, type DiZhi } from './bazi'

// ============ 常量 ============
export type Wuju = '金四局' | '水二局' | '木三局' | '火六局' | '土五局'

export const GONG_NAMES = [
  '命宫',
  '兄弟',
  '夫妻',
  '子女',
  '财帛',
  '疾厄',
  '迁移',
  '交友',
  '官禄',
  '田宅',
  '福德',
  '父母',
] as const
export type GongKey = (typeof GONG_NAMES)[number]

export const MAIN_STARS = [
  '紫微',
  '天机',
  '太阳',
  '武曲',
  '天同',
  '廉贞',
  '天府',
  '太阴',
  '贪狼',
  '巨门',
  '天相',
  '天梁',
  '七杀',
  '破军',
  '文昌',
  '文曲',
  '左辅',
  '右弼',
  '天魁',
  '天钺',
] as const
export type MainStar = (typeof MAIN_STARS)[number]

export const STAR_META: Record<
  MainStar,
  {
    category: '帝' | '财' | '官' | '杀' | '辅' | '煞' | '吉' | '桃花'
    element: '金' | '木' | '水' | '火' | '土'
    color: string
    desc: string
    virtue: string
    flaw: string
    keyword: string[]
  }
> = {
  紫微: {
    category: '帝',
    element: '土',
    color: '#D4AF37',
    desc: '紫微帝星，五行属己土，乃众星之枢纽',
    virtue: '尊贵 · 领导 · 自律',
    flaw: '孤高 · 刚愎',
    keyword: ['帝星', '紫微', '尊贵', '中正'],
  },
  天机: {
    category: '辅',
    element: '木',
    color: '#2F7D4F',
    desc: '智慧之星，五行属乙木，主谋略思考',
    virtue: '机敏 · 变通 · 善谋',
    flaw: '多虑 · 劳心',
    keyword: ['机谋', '变化', '思考'],
  },
  太阳: {
    category: '官',
    element: '火',
    color: '#C8302A',
    desc: '阳贵之星，五行属丙火，主名声照耀',
    virtue: '博爱 · 光明 · 名声',
    flaw: '劳心 · 操心',
    keyword: ['光明', '博爱', '名望'],
  },
  武曲: {
    category: '财',
    element: '金',
    color: '#E8E4D8',
    desc: '财星之主，五行属辛金，主财帛决断',
    virtue: '刚毅 · 决断 · 理财',
    flaw: '孤克 · 刚硬',
    keyword: ['财星', '决断', '金属'],
  },
  天同: {
    category: '吉',
    element: '水',
    color: '#5B3A8E',
    desc: '福星，五行属壬水，主温顺享受',
    virtue: '温润 · 福气 · 协调',
    flaw: '依赖 · 懒散',
    keyword: ['福星', '和顺', '协调'],
  },
  廉贞: {
    category: '杀',
    element: '火',
    color: '#8B1F1A',
    desc: '次桃花 / 偏官星，五行属丁火，主血光亦主精明',
    virtue: '精明 · 干练 · 灵活',
    flaw: '血光 · 官非',
    keyword: ['偏官', '血光', '精明'],
  },
  天府: {
    category: '帝',
    element: '土',
    color: '#A87C4F',
    desc: '贤相之星，五行属戊土，主稳重包容',
    virtue: '稳重 · 包容 · 财务',
    flaw: '保守 · 迟疑',
    keyword: ['贤相', '稳重', '库藏'],
  },
  太阴: {
    category: '财',
    element: '水',
    color: '#1B3A5C',
    desc: '阴富之星，五行属癸水，主财母田宅',
    virtue: '细腻 · 财母 · 内敛',
    flaw: '多忧 · 善感',
    keyword: ['财母', '内敛', '田宅'],
  },
  贪狼: {
    category: '桃花',
    element: '木',
    color: '#C8302A',
    desc: '桃花 / 欲望之星，五行属甲木，主欲望才艺',
    virtue: '才艺 · 人缘 · 进取',
    flaw: '贪欲 · 多欲',
    keyword: ['桃花', '才艺', '欲望'],
  },
  巨门: {
    category: '辅',
    element: '水',
    color: '#1B3A5C',
    desc: '暗星 / 口舌星，五行属癸水，主口舌是非',
    virtue: '口才 · 思辨 · 洞察',
    flaw: '口舌 · 暗昧',
    keyword: ['口舌', '暗星', '思辨'],
  },
  天相: {
    category: '辅',
    element: '水',
    color: '#5B3A8E',
    desc: '印星 / 衣食之星，五行属壬水，主辅佐协调',
    virtue: '协调 · 文雅 · 印绶',
    flaw: '依附 · 优柔',
    keyword: ['印星', '协调', '衣食'],
  },
  天梁: {
    category: '吉',
    element: '土',
    color: '#A87C4F',
    desc: '寿星 / 荫星，五行属己土，主长辈庇荫',
    virtue: '荫庇 · 寿考 · 化险',
    flaw: '固执 · 老大',
    keyword: ['寿星', '荫庇', '长辈'],
  },
  七杀: {
    category: '杀',
    element: '金',
    color: '#E8E4D8',
    desc: '将星 / 战星，五行属庚金，主将军之格',
    virtue: '刚毅 · 突破 · 独立',
    flaw: '孤克 · 漂泊',
    keyword: ['将星', '突破', '独立'],
  },
  破军: {
    category: '煞',
    element: '水',
    color: '#5B3A8E',
    desc: '耗星 / 先锋，五行属壬水，主破旧立新',
    virtue: '开创 · 改革 · 先锋',
    flaw: '耗破 · 漂泊',
    keyword: ['耗星', '开创', '先锋'],
  },
  文昌: {
    category: '辅',
    element: '金',
    color: '#E8E4D8',
    desc: '文贵之星，五行属辛金，主文章才学',
    virtue: '文思 · 才学 · 考运',
    flaw: '浮华 · 虚名',
    keyword: ['文昌', '才学', '考试'],
  },
  文曲: {
    category: '桃花',
    element: '水',
    color: '#1B3A5C',
    desc: '文艺之星，五行属癸水，主浪漫才艺',
    virtue: '才艺 · 表达 · 浪漫',
    flaw: '多情 · 虚浮',
    keyword: ['文曲', '才艺', '桃花'],
  },
  左辅: {
    category: '辅',
    element: '土',
    color: '#A87C4F',
    desc: '贵人之星，五行属戊土，主辅助提携',
    virtue: '助力 · 贵人 · 稳重',
    flaw: '依赖 · 保守',
    keyword: ['左辅', '贵人', '辅助'],
  },
  右弼: {
    category: '辅',
    element: '水',
    color: '#5B3A8E',
    desc: '智星 / 副星，五行属壬水，主谋略辅佐',
    virtue: '谋略 · 灵活 · 协调',
    flaw: '心多 · 多虑',
    keyword: ['右弼', '谋略', '协调'],
  },
  天魁: {
    category: '吉',
    element: '火',
    color: '#C8302A',
    desc: '阳贵星 / 太极贵人，主男性贵人',
    virtue: '阳贵 · 男性助力',
    flaw: '过助 · 依赖',
    keyword: ['天魁', '阳贵', '贵人'],
  },
  天钺: {
    category: '吉',
    element: '水',
    color: '#1B3A5C',
    desc: '阴贵星 / 太极贵人，主女性贵人',
    virtue: '阴贵 · 女性助力',
    flaw: '过助 · 依赖',
    keyword: ['天钺', '阴贵', '贵人'],
  },
}

// 四化表：年干 → [化禄, 化权, 化科, 化忌]
export const SIHUA_TABLE: Record<TianGan, [MainStar, MainStar, MainStar, MainStar]> = {
  甲: ['廉贞', '破军', '武曲', '贪狼'],
  乙: ['天机', '天梁', '紫微', '太阴'],
  丙: ['天同', '天机', '文昌', '廉贞'],
  丁: ['太阴', '天同', '天机', '巨门'],
  戊: ['贪狼', '太阴', '右弼', '天机'],
  己: ['武曲', '贪狼', '天梁', '文曲'],
  庚: ['太阳', '武曲', '太阴', '天同'],
  辛: ['巨门', '太阳', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左辅', '武曲'],
  癸: ['破军', '巨门', '太阴', '贪狼'],
}

// ============ 五行局纳音表 ============
// 60 甲子纳音五行（按 60 甲子序）
// 海中金(1-2) 炉中火(3-4) 大林木(5-6) ... 按甲子
// 简化版：每 30 对纳音映射 5 行局

// 纳音五行表（60 甲子 → 5 行）
const NAYIN_NAYIN: Array<'金' | '木' | '水' | '火' | '土'> = [
  // 0:甲子-海中金
  '金',
  '金',
  // 2:丙寅-炉中火
  '火',
  '火',
  // 4:戊辰-大林木
  '木',
  '木',
  // 6:庚午-路旁土
  '土',
  '土',
  // 8:壬申-剑锋金
  '金',
  '金',
  // 10:甲戌-山头火
  '火',
  '火',
  // 12:丙子-涧下水
  '水',
  '水',
  // 14:戊寅-城头土
  '土',
  '土',
  // 16:庚辰-白蜡金
  '金',
  '金',
  // 18:壬午-杨柳木
  '木',
  '木',
  // 20:甲申-泉中水
  '水',
  '水',
  // 22:丙戌-屋上土
  '土',
  '土',
  // 24:戊子-霹雳火
  '火',
  '火',
  // 26:庚寅-松柏木
  '木',
  '木',
  // 28:壬辰-长流水
  '水',
  '水',
  // 30:甲午-沙中金
  '金',
  '金',
  // 32:丙申-山下火
  '火',
  '火',
  // 34:戊戌-平地木
  '木',
  '木',
  // 36:庚子-壁上土
  '土',
  '土',
  // 38:壬寅-金箔金
  '金',
  '金',
  // 40:甲辰-覆灯火
  '火',
  '火',
  // 42:丙午-天河水
  '水',
  '水',
  // 44:戊申-大驿土
  '土',
  '土',
  // 46:庚戌-钗钏金
  '金',
  '金',
  // 48:壬子-桑柘木
  '木',
  '木',
  // 50:甲寅-大溪水
  '水',
  '水',
  // 52:丙辰-沙中土
  '土',
  '土',
  // 54:戊午-天上火
  '火',
  '火',
  // 56:庚申-石榴木
  '木',
  '木',
  // 58:壬戌-大海水
  '水',
  '水',
]

// 五行局：木三/金四/水二/火六/土五
const WUXING_JU_MAP: Record<'金' | '木' | '水' | '火' | '土', Wuju> = {
  木: '木三局',
  金: '金四局',
  水: '水二局',
  火: '火六局',
  土: '土五局',
}

function nayinToWuju(gan: TianGan, zhi: DiZhi): Wuju {
  // 计算 60 甲子序号
  let idx = -1
  for (let i = 0; i < 60; i++) {
    if (JIAZI[i]?.gan === gan && JIAZI[i]?.zhi === zhi) {
      idx = i
      break
    }
  }
  if (idx < 0) return '水二局'
  return WUXING_JU_MAP[NAYIN_NAYIN[idx]!]
}

const JIAZI: Array<{ gan: TianGan; zhi: DiZhi }> = []
for (let i = 0; i < 60; i++) {
  JIAZI.push({ gan: TIANGAN[i % 10] as TianGan, zhi: DIZHI[i % 12] as DiZhi })
}

function jiaziIndex(gan: TianGan, zhi: DiZhi): number {
  for (let i = 0; i < 60; i++) {
    if (JIAZI[i]?.gan === gan && JIAZI[i]?.zhi === zhi) return i
  }
  return 0
}

// ============ 真紫微算法 ============

/** 紫微 14 主星相对位置表（紫微所在宫位 → 其他主星偏移） */
// 紫微系：紫微+天机+太阳+武曲+天同+廉贞
// 天府系：天府+太阴+贪狼+巨门+天相+天梁+七杀+破军
// 紫微系：紫微+1 天机；-3 太阳；-4 武曲；-5 天同；-8 廉贞
// 天府系：天府-1 太阴；-2 贪狼；-3 巨门；-4 天相；-5 天梁；-6 七杀；-8 破军
// 与"紫微在寅/午/戌" → 天府同宫；其他 → 天府对宫
const ZIWEI_STAR_OFFSETS: Array<{ star: MainStar; offset: number }> = [
  { star: '天机', offset: 1 },
  { star: '太阳', offset: 3 },
  { star: '武曲', offset: 4 },
  { star: '天同', offset: 5 },
  { star: '廉贞', offset: 8 },
]
const TIANFU_STAR_OFFSETS: Array<{ star: MainStar; offset: number }> = [
  { star: '太阴', offset: 1 },
  { star: '贪狼', offset: 2 },
  { star: '巨门', offset: 3 },
  { star: '天相', offset: 4 },
  { star: '天梁', offset: 5 },
  { star: '七杀', offset: 6 },
  { star: '破军', offset: 8 },
]

/** 命宫地支 */
function calcMingGongZhi(month: number, birthHour: number): DiZhi {
  // 子时 23:00-1:00 = 0；丑时 1-3 = 1；...；亥时 21-23 = 11
  const hourZhiIndex = Math.floor(((birthHour + 1) % 24) / 2)
  // 月序：寅(2)=正月。命宫 = (寅 + (月-1) - 时辰序) mod 12
  const zhiIndex = (2 + (month - 1) - hourZhiIndex + 12 * 4) % 12
  return DIZHI[zhiIndex] as DiZhi
}

/** 身宫地支 */
function calcShenGongZhi(month: number, birthHour: number): DiZhi {
  const hourZhiIndex = Math.floor(((birthHour + 1) % 24) / 2)
  // 身宫 = (寅 + (月-1) + 时辰序) mod 12
  const zhiIndex = (2 + (month - 1) + hourZhiIndex + 12 * 4) % 12
  return DIZHI[zhiIndex] as DiZhi
}

/** 紫微位置 */
function calcZiweiPos(day: number, wuju: Wuju): number {
  // 紫微起寅（index=2），按局数步长数 (day-1) 步
  const step = Number(wuju.replace(/[^\d]/g, ''))
  let pos = 2 // 寅
  for (let i = 1; i < day; i++) {
    pos = (pos + step) % 12
  }
  return pos
}

/** 天府位置 */
function calcTianfuPos(ziweiPos: number): { pos: number; samePalace: boolean } {
  // 紫微在寅午戌 → 天府同宫；其他 → 天府对宫（+6）
  // 寅(2) 午(8) 戌(10)
  if ([2, 8, 10].includes(ziweiPos)) {
    return { pos: ziweiPos, samePalace: true }
  }
  return { pos: (ziweiPos + 6) % 12, samePalace: false }
}

// ============ 助星安星 ============
/** 文昌：戌宫起子时，顺数至生时  (戌=10) */
function calcWenChangPos(birthHour: number): number {
  const hourZhiIndex = Math.floor(((birthHour + 1) % 24) / 2)
  return (10 + hourZhiIndex) % 12
}
/** 文曲：辰宫起子时，顺数至生时  (辰=4) */
function calcWenQuPos(birthHour: number): number {
  const hourZhiIndex = Math.floor(((birthHour + 1) % 24) / 2)
  return (4 + hourZhiIndex) % 12
}
/** 左辅：辰宫起正月，顺数至生月  (辰=4) */
function calcZuoFuPos(month: number): number {
  return (4 + (month - 1)) % 12
}
/** 右弼：戌宫起正月，逆数至生月  (戌=10) */
function calcYouBiPos(month: number): number {
  return (10 - (month - 1) + 12 * 4) % 12
}
/** 天魁天钺：年干定贵人  */
function calcGuiRenPos(yearGan: TianGan): { kui: number; yue: number } {
  // 阳干顺行 阴干逆行
  const guiRen: Record<TianGan, { kui: string; yue: string; dir: 1 | -1 }> = {
    甲: { kui: '丑', yue: '未', dir: 1 }, // 顺
    乙: { kui: '子', yue: '申', dir: -1 }, // 逆
    丙: { kui: '亥', yue: '酉', dir: 1 },
    丁: { kui: '亥', yue: '酉', dir: -1 },
    戊: { kui: '丑', yue: '未', dir: 1 },
    己: { kui: '子', yue: '申', dir: -1 },
    庚: { kui: '午', yue: '寅', dir: 1 },
    辛: { kui: '午', yue: '寅', dir: -1 },
    壬: { kui: '卯', yue: '巳', dir: 1 },
    癸: { kui: '卯', yue: '巳', dir: -1 },
  }
  const g = guiRen[yearGan]!
  return {
    kui: DIZHI.indexOf(g.kui as DiZhi),
    yue: DIZHI.indexOf(g.yue as DiZhi),
  }
}

// ============ 排盘输出 ============
export interface ZiweiGong {
  zhi: DiZhi
  zhiIndex: number
  gongName: GongKey
  mainStars: MainStar[]
  sihua: Array<'禄' | '权' | '科' | '忌'>
  isMingGong: boolean
  isShenGong: boolean
  /** 该宫的简短解读 */
  interpretation: string
}

export interface ZiweiResult {
  mingGong: ZiweiGong
  shenGong: ZiweiGong
  palaces: ZiweiGong[]
  wuju: Wuju
  yearGan: TianGan
  /** 命宫纳音五行 */
  mingNayin: '金' | '木' | '水' | '火' | '土'
  /** 五维评估：0-100 */
  scores: {
    career: number
    wealth: number
    relationship: number
    health: number
    social: number
  }
  /** 主命格类型 */
  mingGe: string
  /** 整体解读 */
  summary: string
  /** 流年大运（未来 5 年） */
  yearly: Array<{ year: number; gan: TianGan; zhi: DiZhi; highlight: string }>
  /** 四化飞星 */
  sihua: { lu: MainStar; quan: MainStar; ke: MainStar; ji: MainStar }
  /** 紫微所在 */
  ziweiAt: { zhi: DiZhi; zhiIndex: number; palace: string }
  /** 天府所在 */
  tianfuAt: { zhi: DiZhi; zhiIndex: number; samePalace: boolean }
  /** 助星定位 */
  assists: {
    文昌: number
    文曲: number
    左辅: number
    右弼: number
    天魁: number
    天钺: number
  }
}

/**
 * 完整排盘
 */
export function calcZiwei(
  year: number,
  month: number,
  day: number,
  hour: number,
  _gender: '男' | '女' = '男',
  longitude: number = 120,
): ZiweiResult {
  // 1) 年干（用 bazi 真算法）
  const bz = calcBazi(year, month, day, hour, longitude)
  const yearGan = bz.year.gan
  const _dayGan = bz.day.gan
  const _hourZhi = bz.hour.zhi

  // 2) 命宫 / 身宫
  const mingGongZhi = calcMingGongZhi(month, hour)
  const shenGongZhi = calcShenGongZhi(month, hour)
  const mingGongIdx = DIZHI.indexOf(mingGongZhi)
  const shenGongIdx = DIZHI.indexOf(shenGongZhi)

  // 3) 五行局 = 命宫纳音
  const wuju = nayinToWuju(yearGan, mingGongZhi)
  const mingNayin = NAYIN_NAYIN[jiaziIndex(yearGan, mingGongZhi)]!

  // 4) 紫微 / 天府
  const ziweiPos = calcZiweiPos(day, wuju)
  const tianfu = calcTianfuPos(ziweiPos)

  // 5) 主星排布
  const starPositions: Record<number, MainStar[]> = {}
  starPositions[ziweiPos] = ['紫微']
  ZIWEI_STAR_OFFSETS.forEach(({ star, offset }) => {
    // 紫微 + offset（按逆数索引减）
    const idx = (ziweiPos - offset + 12 * 4) % 12
    if (!starPositions[idx]) starPositions[idx] = []
    starPositions[idx].push(star)
  })
  starPositions[tianfu.pos] = starPositions[tianfu.pos]
    ? [...starPositions[tianfu.pos]!, '天府']
    : ['天府']
  TIANFU_STAR_OFFSETS.forEach(({ star, offset }) => {
    // 天府 + offset（按逆数索引减）
    const idx = (tianfu.pos - offset + 12 * 4) % 12
    if (!starPositions[idx]) starPositions[idx] = []
    starPositions[idx].push(star)
  })

  // 6) 助星
  const wenChangPos = calcWenChangPos(hour)
  const wenQuPos = calcWenQuPos(hour)
  const zuoFuPos = calcZuoFuPos(month)
  const youBiPos = calcYouBiPos(month)
  const { kui, yue } = calcGuiRenPos(yearGan)

  const addStar = (idx: number, star: MainStar) => {
    if (!starPositions[idx]) starPositions[idx] = []
    if (!starPositions[idx]?.includes(star)) starPositions[idx]?.push(star)
  }
  addStar(wenChangPos, '文昌')
  addStar(wenQuPos, '文曲')
  addStar(zuoFuPos, '左辅')
  addStar(youBiPos, '右弼')
  addStar(kui, '天魁')
  addStar(yue, '天钺')

  // 7) 四化
  const [huaLu, huaQuan, huaKe, huaJi] = SIHUA_TABLE[yearGan]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sihuaMap: Record<MainStar, Array<'禄' | '权' | '科' | '忌'>> = {} as any
  sihuaMap[huaLu] = ['禄']
  sihuaMap[huaQuan] = ['权']
  sihuaMap[huaKe] = ['科']
  sihuaMap[huaJi] = ['忌']

  // 8) 12 宫
  const palaces: ZiweiGong[] = []
  for (let i = 0; i < 12; i++) {
    const zhiIdx = (mingGongIdx + i) % 12
    const zhi = DIZHI[zhiIdx]! as DiZhi
    const mainStars = (starPositions[zhiIdx] || []).slice()
    const sihua: Array<'禄' | '权' | '科' | '忌'> = []
    mainStars.forEach((s) => {
      if (sihuaMap[s]) sihua.push(...sihuaMap[s])
    })
    const gongName = GONG_NAMES[i]!
    palaces.push({
      zhi,
      zhiIndex: zhiIdx,
      gongName,
      mainStars,
      sihua,
      isMingGong: i === 0,
      isShenGong: zhiIdx === shenGongIdx,
      interpretation: _interpretGong(gongName, mainStars, sihua),
    })
  }

  // 9) 命格
  const mingStars = palaces[0]!.mainStars!
  const mingGe = _judgeMingGe(mingStars, wuju)

  // 10) 评分
  const scores = _calcScores(palaces, yearGan)

  // 11) 流年
  const currentYear = new Date().getFullYear()
  const yearly: ZiweiResult['yearly'] = []
  for (let y = 0; y < 5; y++) {
    const yr = currentYear + y
    const gan = TIANGAN[(((yr - 4) % 10) + 10) % 10]! as TianGan
    const zhi = DIZHI[(((yr - 4) % 12) + 12) % 12]! as DiZhi
    yearly.push({
      year: yr,
      gan,
      zhi,
      highlight: _yearlyHighlight(gan, zhi, yearGan),
    })
  }

  return {
    mingGong: palaces[0]!,
    shenGong: palaces[(shenGongIdx - mingGongIdx + 12) % 12]!,
    palaces,
    wuju,
    yearGan,
    mingNayin,
    scores,
    mingGe,
    summary: _summary(mingGe, scores, yearGan, wuju),
    yearly,
    sihua: { lu: huaLu, quan: huaQuan, ke: huaKe, ji: huaJi },
    ziweiAt: {
      zhi: DIZHI[ziweiPos] as DiZhi,
      zhiIndex: ziweiPos,
      palace: palaces[(ziweiPos - mingGongIdx + 12) % 12]!.gongName,
    },
    tianfuAt: {
      zhi: DIZHI[tianfu.pos] as DiZhi,
      zhiIndex: tianfu.pos,
      samePalace: tianfu.samePalace,
    },
    assists: {
      文昌: wenChangPos,
      文曲: wenQuPos,
      左辅: zuoFuPos,
      右弼: youBiPos,
      天魁: kui,
      天钺: yue,
    },
  }
}

function _interpretGong(
  gong: GongKey,
  stars: MainStar[],
  sihua: Array<'禄' | '权' | '科' | '忌'>,
): string {
  if (stars.length === 0) return `${gong}宫空无主星，需借对宫同论。`
  const main = stars[0]!
  const meta = STAR_META[main]!
  const sihuaText = sihua.length > 0 ? `带${sihua.join('·')}` : '无四化'
  return `${gong}宫坐${main}（${meta.virtue}），${sihuaText}。${meta.desc}`
}

function _judgeMingGe(stars: MainStar[], wuju: Wuju): string {
  if (stars.length === 0) return '无主星命格'
  const main = stars[0]!
  const grp: Record<MainStar, string> = {
    紫微: '紫微同格 · 帝星入命',
    天府: '天府同格 · 贤相之格',
    太阳: '太阳同格 · 阳贵照耀',
    太阴: '太阴同格 · 阴富丰盈',
    贪狼: '贪狼同格 · 才艺多能',
    巨门: '巨门同格 · 口舌思辨',
    廉贞: '廉贞同格 · 精明干练',
    武曲: '武曲同格 · 财星之格',
    天同: '天同同格 · 福寿双全',
    天相: '天相同格 · 印绶之格',
    天梁: '天梁同格 · 荫庇之格',
    天机: '天机同格 · 智慧谋略',
    七杀: '七杀朝斗格 · 将军之命',
    破军: '破军同格 · 开创先锋',
    文昌: '文昌入命 · 文贵之格',
    文曲: '文曲入命 · 才艺之格',
    左辅: '左辅入命 · 贵人助力',
    右弼: '右弼入命 · 谋略协调',
    天魁: '天魁入命 · 阳贵扶持',
    天钺: '天钺入命 · 阴贵暗助',
  }
  return `${grp[main]}（${wuju}）`
}

function _calcScores(palaces: ZiweiGong[], _yearGan: TianGan): ZiweiResult['scores'] {
  const getStar = (g: GongKey) => palaces.find((p) => p.gongName === g)?.mainStars[0]
  const scoreStar = (s?: MainStar): number => {
    if (!s) return 60
    if (['紫微', '天府', '天梁', '天同'].includes(s)) return 85
    if (['太阳', '太阴', '武曲', '天相'].includes(s)) return 80
    if (['天机', '巨门', '贪狼', '文昌', '文曲'].includes(s)) return 72
    if (['七杀', '破军', '廉贞', '左辅', '右弼'].includes(s)) return 68
    if (['天魁', '天钺'].includes(s)) return 78
    return 70
  }
  return {
    career: scoreStar(getStar('官禄')),
    wealth: scoreStar(getStar('财帛')),
    relationship: scoreStar(getStar('夫妻')),
    health: scoreStar(getStar('疾厄')),
    social: scoreStar(getStar('交友')),
  }
}

function _yearlyHighlight(gan: TianGan, zhi: DiZhi, _yearGan: TianGan): string {
  const [huaLu] = SIHUA_TABLE[gan]
  return `${gan}${zhi}年 · 流年${huaLu}化禄主事`
}

function _summary(
  mingGe: string,
  scores: ZiweiResult['scores'],
  yearGan: TianGan,
  wuju: Wuju,
): string {
  const avg = Math.round(
    (scores.career + scores.wealth + scores.relationship + scores.health + scores.social) / 5,
  )
  return (
    `${mingGe} · 五维均分${avg} · 年干${yearGan}四化主导 · ${wuju}。` +
    `事业${scores.career} · 财帛${scores.wealth} · 婚姻${scores.relationship} · 健康${scores.health} · 人际${scores.social}。`
  )
}

/**
 * 飞星四化到宫位
 */
export function getSihuaStar(yearGan: TianGan): {
  lu: MainStar
  quan: MainStar
  ke: MainStar
  ji: MainStar
} {
  const [lu, quan, ke, ji] = SIHUA_TABLE[yearGan]
  return { lu, quan, ke, ji }
}
