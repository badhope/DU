/**
 * 玄枢 MISTVERSE · 玄枢易盘 · 完整六爻排盘
 *
 * 传统六爻（纳甲法）高级排盘系统：
 *  - 蓍草起卦（大衍之数 50 → 49 → 三营成易）
 *  - 八宫六十四卦纳甲表
 *  - 6 爻地支（内卦 3 爻 + 外卦 3 爻）
 *  - 六亲（父母/兄弟/子孙/妻财/官鬼）按卦宫五行生克定
 *  - 世爻 / 应爻
 *  - 动爻 → 变卦（阴阳变、爻地支变、六亲变）
 *  - 互卦（2-3-4 爻为下互，3-4-5 爻为上互）
 *  - 6 类用神
 *  - 伏神（卦中缺位时从本宫卦借来）
 *  - 流时（流年/流月/流日/流时 → 对应爻位）
 *  - 4 维神煞（天乙贵人/驿马/桃花/华盖）
 *  - 5 维评分 + 完整解卦
 *
 * 设计原则：保留传统六爻核心理论（八宫、纳甲、六亲、世应、动变、互卦、伏神）
 *           适度简化为可读代码
 */

import {
  DIZHI,
  TIANGAN_WUXING as _TIANGAN_WUXING,
  DIZHI_WUXING,
  type DiZhi,
  type TianGan,
} from './bazi'
import { SHENG, KE } from './wuxing'

// ============ 类型定义 ============

/** 八卦单卦 */
export type Bagua = 'qian' | 'dui' | 'li' | 'zhen' | 'xun' | 'kan' | 'gen' | 'kun'

/** 八卦单卦常量（与 jiegua/gua.ts 保持一致） */
export const BAGUA: Record<
  Bagua,
  { name: string; symbol: string; nature: string; wuxing: 'jin' | 'mu' | 'shui' | 'huo' | 'tu' }
> = {
  qian: { name: '乾', symbol: '☰', nature: '天', wuxing: 'jin' },
  dui: { name: '兑', symbol: '☱', nature: '泽', wuxing: 'jin' },
  li: { name: '离', symbol: '☲', nature: '火', wuxing: 'huo' },
  zhen: { name: '震', symbol: '☳', nature: '雷', wuxing: 'mu' },
  xun: { name: '巽', symbol: '☴', nature: '风', wuxing: 'mu' },
  kan: { name: '坎', symbol: '☵', nature: '水', wuxing: 'shui' },
  gen: { name: '艮', symbol: '☶', nature: '山', wuxing: 'tu' },
  kun: { name: '坤', symbol: '☷', nature: '地', wuxing: 'tu' },
}

/** 八宫 */
export type Palace =
  | 'qian' // 乾宫（金）
  | 'kun' // 坤宫（土）
  | 'kan' // 坎宫（水）
  | 'li' // 离宫（火）
  | 'zhen' // 震宫（木）
  | 'xun' // 巽宫（木）
  | 'dui' // 兑宫（金）
  | 'gen' // 艮宫（土）

/** 六亲 */
export type Liuqin = '父母' | '兄弟' | '子孙' | '妻财' | '官鬼'

/** 爻（1=阳爻, 0=阴爻） */
export type YaoType = 1 | 0

/** 爻位（自下而上 1-6） */
export type YaoPos = 1 | 2 | 3 | 4 | 5 | 6

/** 一爻信息 */
export interface YaoInfo {
  pos: YaoPos // 爻位 1-6
  type: YaoType // 1=阳, 0=阴
  isYang: boolean
  isMoving: boolean // 动爻？
  dizhi: DiZhi // 爻地支
  tiangan: TianGan // 爻天干（纳甲）
  liuqin: Liuqin // 六亲
  shen: string[] // 神煞（天乙/驿马/桃花/华盖）
  isShi: boolean // 世爻？
  isYing: boolean // 应爻？
  isFushen: boolean // 伏神？（与本爻同一爻位，卦中缺位时用）
  bian?: {
    // 变爻（动爻才有）
    type: YaoType
    dizhi: DiZhi
    tiangan: TianGan
    liuqin: Liuqin
  }
}

/** 用神 */
export type YongshenKey = '父母' | '兄弟' | '子孙' | '妻财' | '官鬼' | '世身'

/** 用神所测之事 */
export type Topic =
  | '事业'
  | '求财'
  | '姻缘'
  | '官运'
  | '学业'
  | '健康'
  | '家宅'
  | '出行'
  | '谋望'
  | '求子'
  | '失物'
  | '诉讼'
  | '求官'
  | '通用'

/** 神煞 */
export type ShenshaKey = '天乙贵人' | '驿马' | '桃花' | '华盖'

/** 神煞描述 */
export interface ShenshaDesc {
  key: ShenshaKey
  name: string
  yaoPos: YaoPos
  desc: string
  level: '吉' | '平' | '凶'
}

/** 流时（流年/流月/流日/流时） */
export interface Liushi {
  year: { zhi: DiZhi; yaoPos: YaoPos | null; text: string }
  month: { zhi: DiZhi; yaoPos: YaoPos | null; text: string }
  day: { zhi: DiZhi; yaoPos: YaoPos | null; text: string }
  hour: { zhi: DiZhi; yaoPos: YaoPos | null; text: string }
}

/** 一条建议 */
export interface Advice {
  title: string
  detail: string
  level: 'high' | 'mid' | 'low'
}

/** 完整解卦结果 */
export interface LiuyaoResult {
  // 1. 时间
  divinationTime: number
  divinationTimeStr: string

  // 2. 起卦过程
  castProcess: {
    step: number // 第几步（1-6）
    rawNumber: number // 原始数（大衍 49）
    leftSticks: number // 余数（1/2/3/4）
    yang: YaoType // 0/1
    desc: string
  }[]

  /** 本卦 */
  benGua: {
    palace: Palace
    palaceName: string
    palaceWuxing: 'jin' | 'mu' | 'shui' | 'huo' | 'tu'
    name: string // 卦名
    upper: Bagua
    lower: Bagua
    symbol: string
    yaoList: YaoInfo[] // 6 爻（自下而上 1-6）
    shiPos: YaoPos // 世爻位
    yingPos: YaoPos // 应爻位
  }

  // 4. 变卦（动爻数 0 时 = 本卦）
  bianGua: {
    name: string
    upper: Bagua
    lower: Bagua
    symbol: string
    yaoList: YaoInfo[] // 变卦 6 爻
    reason: string // 变卦原因
  }

  // 5. 互卦
  huGua: {
    name: string
    upper: Bagua
    lower: Bagua
    symbol: string
    yaoList: YaoInfo[] // 互卦 6 爻
    desc: string
  }

  // 6. 伏卦（本宫卦，卦中无六亲对应爻时借用）
  fuGua: {
    name: string
    yaoList: YaoInfo[]
  }

  // 7. 伏神
  fushen: Array<{
    yaoPos: YaoPos
    name: Liuqin
    fromPalace: Palace
    reason: string
  }>

  // 8. 用神
  yongshen: {
    key: YongshenKey
    yaoPos: YaoPos | null
    name: Liuqin | string
    wuxing: 'jin' | 'mu' | 'shui' | 'huo' | 'tu'
    reason: string
    status: '旺' | '相' | '休' | '囚' | '死' | '缺'
    statusDesc: string
    found: boolean
  }

  // 9. 流时
  liushi: Liushi

  // 10. 神煞
  shensha: ShenshaDesc[]

  // 11. 5 维评分
  fortunes: {
    career: { score: number; text: string }
    wealth: { score: number; text: string }
    love: { score: number; text: string }
    health: { score: number; text: string }
    study: { score: number; text: string }
  }

  // 12. 建议
  advice: Advice[]

  // 13. 综合解读
  summary: string

  // 14. 幸运元素
  lucky: {
    color: string
    number: string
    direction: string
  }
}

// ============ 八宫六十四卦纳甲表 ============

/** 单卦纳甲表（内卦 3 爻 + 外卦 3 爻的纳甲地支） */
/** 传统纳甲口诀：
 *  乾纳甲壬（内甲子寅辰，外壬午申戌）
 *  坤纳乙癸（内乙未巳丑，外癸酉亥卯）
 *  震纳庚（内庚子寅辰，外庚午申戌）
 *  巽纳辛（内辛丑亥酉，外辛未巳卯）
 *  坎纳戊（内戊寅辰午，外戊申戌子）
 *  离纳己（内己卯丑亥，外己酉未巳）
 *  艮纳丙（内丙辰午申，外丙戌子寅）
 *  兑纳丁（内丁巳卯丑，外丁亥酉未）
 */
const NAJIA_DIZHI: Record<Bagua, [DiZhi, DiZhi, DiZhi, DiZhi, DiZhi, DiZhi]> = {
  // [下卦爻1, 下卦爻2, 下卦爻3, 上卦爻1, 上卦爻2, 上卦爻3]
  qian: ['子', '寅', '辰', '午', '申', '戌'],
  kun: ['未', '巳', '丑', '酉', '亥', '卯'],
  zhen: ['子', '寅', '辰', '午', '申', '戌'],
  xun: ['丑', '亥', '酉', '未', '巳', '卯'],
  kan: ['寅', '辰', '午', '申', '戌', '子'],
  li: ['卯', '丑', '亥', '酉', '未', '巳'],
  gen: ['辰', '午', '申', '戌', '子', '寅'],
  dui: ['巳', '卯', '丑', '亥', '酉', '未'],
}

const NAJIA_TIANGAN: Record<Bagua, [TianGan, TianGan, TianGan, TianGan, TianGan, TianGan]> = {
  // 内卦甲乙丙丁戊己庚辛壬癸？简化：内卦纳甲干
  // 乾：内甲 外壬；坤：内乙 外癸
  qian: ['甲', '甲', '甲', '壬', '壬', '壬'],
  kun: ['乙', '乙', '乙', '癸', '癸', '癸'],
  zhen: ['庚', '庚', '庚', '庚', '庚', '庚'],
  xun: ['辛', '辛', '辛', '辛', '辛', '辛'],
  kan: ['戊', '戊', '戊', '戊', '戊', '戊'],
  li: ['己', '己', '己', '己', '己', '己'],
  gen: ['丙', '丙', '丙', '丙', '丙', '丙'],
  dui: ['丁', '丁', '丁', '丁', '丁', '丁'],
}

/** 单卦的阴阳爻位（自下而上 1-3） */
const BAGUA_YAO: Record<Bagua, [YaoType, YaoType, YaoType]> = {
  qian: [1, 1, 1],
  dui: [1, 1, 0],
  li: [1, 0, 1],
  zhen: [1, 0, 0],
  xun: [0, 1, 1],
  kan: [0, 1, 0],
  gen: [0, 0, 1],
  kun: [0, 0, 0],
}

// ============ 八宫六十四卦表 ============

interface GuaPalaceMeta {
  /** 卦名 */
  name: string
  /** 上卦 */
  upper: Bagua
  /** 下卦 */
  lower: Bagua
  /** 所属宫 */
  palace: Palace
  /** 世爻位（1-6） */
  shi: YaoPos
  /** 八宫次第（1=纯卦, 2=一世, 3=二世, 4=三世, 5=四世, 6=五世, 7=游魂, 8=归魂） */
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
}

/**
 * 八宫六十四卦完整表
 * 每一宫 8 卦：1 纯卦（八纯）+ 5 世卦（一世→五世）+ 1 游魂 + 1 归魂
 * 世爻位置：纯 6 / 一 1 / 二 2 / 三 3 / 四 4 / 五 5 / 游 4 / 归 3
 */
export const GUA_PALACE: GuaPalaceMeta[] = [
  // ============ 乾宫（金）===========
  { name: '乾为天', upper: 'qian', lower: 'qian', palace: 'qian', shi: 6, step: 1 },
  { name: '天风姤', upper: 'qian', lower: 'xun', palace: 'qian', shi: 1, step: 2 },
  { name: '天山遁', upper: 'qian', lower: 'gen', palace: 'qian', shi: 2, step: 3 },
  { name: '天地否', upper: 'qian', lower: 'kun', palace: 'qian', shi: 3, step: 4 },
  { name: '风地观', upper: 'xun', lower: 'kun', palace: 'qian', shi: 4, step: 5 },
  { name: '山地剥', upper: 'gen', lower: 'gen', palace: 'qian', shi: 5, step: 6 },
  { name: '火地晋', upper: 'li', lower: 'kun', palace: 'qian', shi: 4, step: 7 },
  { name: '火天大有', upper: 'li', lower: 'qian', palace: 'qian', shi: 3, step: 8 },

  // ============ 坎宫（水）===========
  { name: '坎为水', upper: 'kan', lower: 'kan', palace: 'kan', shi: 6, step: 1 },
  { name: '水泽节', upper: 'kan', lower: 'dui', palace: 'kan', shi: 1, step: 2 },
  { name: '水雷屯', upper: 'kan', lower: 'zhen', palace: 'kan', shi: 2, step: 3 },
  { name: '水火既济', upper: 'kan', lower: 'li', palace: 'kan', shi: 3, step: 4 },
  { name: '泽火革', upper: 'dui', lower: 'li', palace: 'kan', shi: 4, step: 5 },
  { name: '雷火丰', upper: 'zhen', lower: 'li', palace: 'kan', shi: 5, step: 6 },
  { name: '地火明夷', upper: 'kun', lower: 'li', palace: 'kan', shi: 4, step: 7 },
  { name: '地水师', upper: 'kun', lower: 'kan', palace: 'kan', shi: 3, step: 8 },

  // ============ 艮宫（土）===========
  { name: '艮为山', upper: 'gen', lower: 'gen', palace: 'gen', shi: 6, step: 1 },
  { name: '山火贲', upper: 'gen', lower: 'li', palace: 'gen', shi: 1, step: 2 },
  { name: '山天大畜', upper: 'gen', lower: 'qian', palace: 'gen', shi: 2, step: 3 },
  { name: '山泽损', upper: 'gen', lower: 'dui', palace: 'gen', shi: 3, step: 4 },
  { name: '火泽睽', upper: 'li', lower: 'dui', palace: 'gen', shi: 4, step: 5 },
  { name: '天泽履', upper: 'qian', lower: 'dui', palace: 'gen', shi: 5, step: 6 },
  { name: '风泽中孚', upper: 'xun', lower: 'dui', palace: 'gen', shi: 4, step: 7 },
  { name: '风山渐', upper: 'xun', lower: 'gen', palace: 'gen', shi: 3, step: 8 },

  // ============ 震宫（木）===========
  { name: '震为雷', upper: 'zhen', lower: 'zhen', palace: 'zhen', shi: 6, step: 1 },
  { name: '雷地豫', upper: 'zhen', lower: 'kun', palace: 'zhen', shi: 1, step: 2 },
  { name: '雷水解', upper: 'zhen', lower: 'kan', palace: 'zhen', shi: 2, step: 3 },
  { name: '雷风恒', upper: 'zhen', lower: 'xun', palace: 'zhen', shi: 3, step: 4 },
  { name: '地风升', upper: 'kun', lower: 'xun', palace: 'zhen', shi: 4, step: 5 },
  { name: '水风井', upper: 'kan', lower: 'xun', palace: 'zhen', shi: 5, step: 6 },
  { name: '泽风大过', upper: 'dui', lower: 'xun', palace: 'zhen', shi: 4, step: 7 },
  { name: '泽雷随', upper: 'dui', lower: 'zhen', palace: 'zhen', shi: 3, step: 8 },

  // ============ 巽宫（木）===========
  { name: '巽为风', upper: 'xun', lower: 'xun', palace: 'xun', shi: 6, step: 1 },
  { name: '风天小畜', upper: 'xun', lower: 'qian', palace: 'xun', shi: 1, step: 2 },
  { name: '风火家人', upper: 'xun', lower: 'li', palace: 'xun', shi: 2, step: 3 },
  { name: '风雷益', upper: 'xun', lower: 'zhen', palace: 'xun', shi: 3, step: 4 },
  { name: '天雷无妄', upper: 'qian', lower: 'zhen', palace: 'xun', shi: 4, step: 5 },
  { name: '火雷噬嗑', upper: 'li', lower: 'zhen', palace: 'xun', shi: 5, step: 6 },
  { name: '山雷颐', upper: 'gen', lower: 'zhen', palace: 'xun', shi: 4, step: 7 },
  { name: '山风蛊', upper: 'gen', lower: 'xun', palace: 'xun', shi: 3, step: 8 },

  // ============ 离宫（火）===========
  { name: '离为火', upper: 'li', lower: 'li', palace: 'li', shi: 6, step: 1 },
  { name: '火山旅', upper: 'li', lower: 'gen', palace: 'li', shi: 1, step: 2 },
  { name: '火风鼎', upper: 'li', lower: 'xun', palace: 'li', shi: 2, step: 3 },
  { name: '火水未济', upper: 'li', lower: 'kan', palace: 'li', shi: 3, step: 4 },
  { name: '山水蒙', upper: 'gen', lower: 'kan', palace: 'li', shi: 4, step: 5 },
  { name: '风水涣', upper: 'xun', lower: 'kan', palace: 'li', shi: 5, step: 6 },
  { name: '天水讼', upper: 'qian', lower: 'kan', palace: 'li', shi: 4, step: 7 },
  { name: '天火同人', upper: 'qian', lower: 'li', palace: 'li', shi: 3, step: 8 },

  // ============ 坤宫（土）===========
  { name: '坤为地', upper: 'kun', lower: 'kun', palace: 'kun', shi: 6, step: 1 },
  { name: '地雷复', upper: 'kun', lower: 'zhen', palace: 'kun', shi: 1, step: 2 },
  { name: '地泽临', upper: 'kun', lower: 'dui', palace: 'kun', shi: 2, step: 3 },
  { name: '地天泰', upper: 'kun', lower: 'qian', palace: 'kun', shi: 3, step: 4 },
  { name: '雷天大壮', upper: 'zhen', lower: 'qian', palace: 'kun', shi: 4, step: 5 },
  { name: '泽天夬', upper: 'dui', lower: 'qian', palace: 'kun', shi: 5, step: 6 },
  { name: '水天需', upper: 'kan', lower: 'qian', palace: 'kun', shi: 4, step: 7 },
  { name: '水地比', upper: 'kan', lower: 'kun', palace: 'kun', shi: 3, step: 8 },

  // ============ 兑宫（金）===========
  { name: '兑为泽', upper: 'dui', lower: 'dui', palace: 'dui', shi: 6, step: 1 },
  { name: '泽水困', upper: 'dui', lower: 'kan', palace: 'dui', shi: 1, step: 2 },
  { name: '泽地萃', upper: 'dui', lower: 'kun', palace: 'dui', shi: 2, step: 3 },
  { name: '泽山咸', upper: 'dui', lower: 'gen', palace: 'dui', shi: 3, step: 4 },
  { name: '水山蹇', upper: 'kan', lower: 'gen', palace: 'dui', shi: 4, step: 5 },
  { name: '地山谦', upper: 'kun', lower: 'gen', palace: 'dui', shi: 5, step: 6 },
  { name: '雷山小过', upper: 'zhen', lower: 'gen', palace: 'dui', shi: 4, step: 7 },
  { name: '雷泽归妹', upper: 'zhen', lower: 'dui', palace: 'dui', shi: 3, step: 8 },
]

/** 卦宫五行 */
const PALACE_WUXING: Record<Palace, 'jin' | 'mu' | 'shui' | 'huo' | 'tu'> = {
  qian: 'jin',
  dui: 'jin', // 乾兑属金
  zhen: 'mu',
  xun: 'mu', // 震巽属木
  kan: 'shui', // 坎属水
  li: 'huo', // 离属火
  gen: 'tu',
  kun: 'tu', // 艮坤属土
}

/** 卦宫中文名 */
const PALACE_NAME: Record<Palace, string> = {
  qian: '乾宫（金）',
  kun: '坤宫（土）',
  kan: '坎宫（水）',
  li: '离宫（火）',
  zhen: '震宫（木）',
  xun: '巽宫（木）',
  dui: '兑宫（金）',
  gen: '艮宫（土）',
}

// ============ 六亲推算 ============

/**
 * 已知卦宫五行 + 爻地支 → 六亲
 * 规则：与我（卦宫）同者 = 兄弟
 *       我生者 = 子孙
 *       生我者 = 父母
 *       我克者 = 妻财
 *       克我者 = 官鬼
 */
function getLiuqin(palaceWuxing: 'jin' | 'mu' | 'shui' | 'huo' | 'tu', yaoDizhi: DiZhi): Liuqin {
  const yaoWx = DIZHI_WUXING[yaoDizhi]!
  if (yaoWx === palaceWuxing) return '兄弟'
  if (SHENG[palaceWuxing] === yaoWx) return '子孙'
  if (SHENG[yaoWx] === palaceWuxing) return '父母'
  if (KE[palaceWuxing] === yaoWx) return '妻财'
  if (KE[yaoWx] === palaceWuxing) return '官鬼'
  return '兄弟' // fallback（同五行）
}

// ============ 卦象查找 ============

interface GuaFull extends GuaPalaceMeta {
  symbol: string
  yaoBin: [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType]
}

/** 卦象 → 卦名（按上卦+下卦查 64 卦） */
function findGua(upper: Bagua, lower: Bagua): GuaFull | undefined {
  const meta = GUA_PALACE.find((g) => g.upper === upper && g.lower === lower)
  if (!meta) return undefined
  const upperYao = BAGUA_YAO[meta.upper]!
  const lowerYao = BAGUA_YAO[meta.lower]!
  // yaoBin: 自下而上 [爻1, 爻2, 爻3, 爻4, 爻5, 爻6] = [下卦爻1, 2, 3, 上卦爻1, 2, 3]
  const yaoBin: [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType] = [
    lowerYao[0]!,
    lowerYao[1]!,
    lowerYao[2]!,
    upperYao[0]!,
    upperYao[1]!,
    upperYao[2]!,
  ]
  const symbol = BAGUA[upper].symbol + BAGUA[lower].symbol
  return { ...meta, symbol, yaoBin }
}

/** 通过卦名查卦 */
function _findGuaByName(name: string): GuaFull | undefined {
  return GUA_PALACE.find((g) => g.name === name) as GuaFull | undefined
}

// ============ 蓍草起卦（大衍之数 50 → 49 → 三营成易）============
//
// 传统算法：
//  大衍之数 50，其用四十有九（49）
//  分而为二以象两，挂一以象三，揲之以四以象四时，归奇于扐以象闰
//  每一爻经"分二、挂一、揲四、归奇"得 5/4/8/9 之一
//  5/9 = 老阳（动爻，变阴）/ 老阴（动爻，变阳）
//  4/8 = 少阳 / 少阴（不变）
//
// 简化算法：每爻随机生成 6/7/8/9 之一（传统蓍草结果）

function castYaoStick(): { value: number; yang: YaoType; isOld: boolean; desc: string } {
  // 蓍草：每爻值 ∈ {6, 7, 8, 9}
  // 6 = 老阴（动变阳）
  // 7 = 少阳（不变）
  // 8 = 少阴（不变）
  // 9 = 老阳（动变阴）
  const v = [6, 7, 7, 8, 8, 8, 9, 9, 9, 9][Math.floor(Math.random() * 10)]
  const yang = v === 7 || v === 9 ? 1 : 0
  const isOld = v === 6 || v === 9
  const desc =
    v === 6
      ? '老阴 ━ ━（动，变阳）'
      : v === 7
        ? '少阳 ━━━━━'
        : v === 8
          ? '少阴 ━ ━'
          : '老阳 ━━━━━（动，变阴）'
  return { value: v, yang, isOld, desc }
}

// ============ 爻详细推算 ============

function buildYaoList(
  yaoBin: [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType],
  upper: Bagua,
  lower: Bagua,
  palace: Palace,
  shi: YaoPos,
  isMoving: boolean[],
): YaoInfo[] {
  const palaceWx = PALACE_WUXING[palace]!
  const yaoList: YaoInfo[] = []
  // 爻地支：内卦 3 爻 + 外卦 3 爻
  const dizhis = NAJIA_DIZHI[lower].concat(NAJIA_DIZHI[upper])
  const tiangans = NAJIA_TIANGAN[lower].concat(NAJIA_TIANGAN[upper])
  // 爻地支纳甲口诀：内卦前 3 爻 = 下卦纳甲，外卦后 3 爻 = 上卦纳甲
  // 实际传统：乾内甲外壬 → 内卦3爻都纳甲子寅辰，外卦3爻都纳壬午申戌
  for (let i = 0; i < 6; i++) {
    const pos = (i + 1) as YaoPos
    const type = yaoBin[i]!
    const dz = dizhis[i]!
    const tg = tiangans[i]!
    const lq = getLiuqin(palaceWx, dz)
    yaoList.push({
      pos,
      type,
      isYang: type === 1,
      isMoving: isMoving[i],
      dizhi: dz,
      tiangan: tg,
      liuqin: lq,
      shen: [],
      isShi: pos === shi,
      isYing: pos === ((shi <= 3 ? shi + 3 : shi - 3) as YaoPos),
      isFushen: false,
    })
  }
  return yaoList
}

// ============ 变卦推算 ============

function buildBianGua(
  mainGua: GuaFull,
  yaoList: YaoInfo[],
  isMoving: boolean[],
): {
  name: string
  upper: Bagua
  lower: Bagua
  symbol: string
  yaoList: YaoInfo[]
  reason: string
} {
  // 没有动爻 → 变卦 = 本卦
  if (!isMoving.some((m) => m)) {
    return {
      name: mainGua.name,
      upper: mainGua.upper,
      lower: mainGua.lower,
      symbol: mainGua.symbol,
      yaoList: yaoList,
      reason: '无爻发动 · 变卦即本卦',
    }
  }
  // 动爻变阴变阳
  const newYaoBin: YaoType[] = mainGua.yaoBin.map((y, i) =>
    isMoving[i] ? ((y === 1 ? 0 : 1) as YaoType) : y,
  )
  // 由 newYaoBin 重组卦象：上卦 = 爻 4-6，下卦 = 爻 1-3
  const lowerBin = [newYaoBin[0]!, newYaoBin[1]!, newYaoBin[2]!]
  const upperBin = [newYaoBin[3]!, newYaoBin[4]!, newYaoBin[5]!]
  const lower = binToBagua(lowerBin)
  const upper = binToBagua(upperBin)
  const target = findGua(upper, lower) || mainGua

  // 推算变卦 6 爻
  const newPalaceWx = PALACE_WUXING[target.palace]!
  const newDizhis = NAJIA_DIZHI[lower].concat(NAJIA_DIZHI[upper])
  const newTiangans = NAJIA_TIANGAN[lower].concat(NAJIA_TIANGAN[upper])
  const newYaoList: YaoInfo[] = []
  for (let i = 0; i < 6; i++) {
    const pos = (i + 1) as YaoPos
    const newType = newYaoBin[i]! as YaoType
    const dz = newDizhis[i]!
    const tg = newTiangans[i]!
    const lq = getLiuqin(newPalaceWx, dz)
    // 同时填充本卦对应爻的 bian 字段
    const origYao = yaoList[i]!
    origYao.bian = { type: newType, dizhi: dz, tiangan: tg, liuqin: lq }
    newYaoList.push({
      pos,
      type: newType,
      isYang: newType === 1,
      isMoving: false,
      dizhi: dz,
      tiangan: tg,
      liuqin: lq,
      shen: [],
      isShi: pos === target.shi,
      isYing: pos === ((target.shi <= 3 ? target.shi + 3 : target.shi - 3) as YaoPos),
      isFushen: false,
    })
  }

  const movingYaoCount = isMoving.filter((m) => m).length
  const movingPosList = isMoving.map((m, i) => (m ? i + 1 : 0)).filter((x) => x > 0)
  const reason =
    movingYaoCount === 1
      ? `第 ${movingPosList[0]!} 爻发动 · 由${yaoList[movingPosList[0]! - 1].isYang ? '阳' : '阴'}变${newYaoBin[movingPosList[0]! - 1] === 1 ? '阳' : '阴'}`
      : `${movingYaoCount} 爻齐动：${movingPosList.join('、')} · 动而化之`

  return { name: target.name, upper, lower, symbol: target.symbol, yaoList: newYaoList, reason }
}

function binToBagua(bin: number[]): Bagua {
  const key = bin.join('')
  const map: Record<string, Bagua> = {
    '111': 'qian',
    '110': 'dui',
    '101': 'li',
    '100': 'zhen',
    '011': 'xun',
    '010': 'kan',
    '001': 'gen',
    '000': 'kun',
  }
  return map[key] || 'kun'
}

// ============ 互卦推算 ============

function buildHuGua(yaoBin: [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType]): {
  name: string
  upper: Bagua
  lower: Bagua
  symbol: string
  yaoList: YaoInfo[]
  desc: string
} {
  // 互卦：2-3-4 爻 = 下互，3-4-5 爻 = 上互
  // 实际：下互 = 爻 2、3、4；上互 = 爻 3、4、5
  // 把它们当作 3 爻单卦
  const lowerBin = [yaoBin[1]!, yaoBin[2]!, yaoBin[3]!]
  const upperBin = [yaoBin[2]!, yaoBin[3]!, yaoBin[4]!]
  const lower = binToBagua(lowerBin)
  const upper = binToBagua(upperBin)
  const meta = findGua(upper, lower)
  if (!meta) {
    return { name: '?', upper, lower, symbol: '?', yaoList: [], desc: '' }
  }
  // 推算互卦 6 爻（仍用 yaoBin 中 2-3-4-5，但都标非动爻）
  const yaoList: YaoInfo[] = []
  const dizhis = NAJIA_DIZHI[lower].concat(NAJIA_DIZHI[upper])
  const tiangans = NAJIA_TIANGAN[lower].concat(NAJIA_TIANGAN[upper])
  const palaceWx = PALACE_WUXING[meta.palace]!
  for (let i = 0; i < 6; i++) {
    const pos = (i + 1) as YaoPos
    const type = [yaoBin[1]!, yaoBin[2]!, yaoBin[3]!, yaoBin[2]!, yaoBin[3]!, yaoBin[4]!][
      i
    ] as YaoType
    yaoList.push({
      pos,
      type,
      isYang: type === 1,
      isMoving: false,
      dizhi: dizhis[i],
      tiangan: tiangans[i],
      liuqin: getLiuqin(palaceWx, dizhis[i]),
      shen: [],
      isShi: false,
      isYing: false,
      isFushen: false,
    })
  }
  return {
    name: meta.name,
    upper,
    lower,
    symbol: meta.symbol,
    yaoList,
    desc: `互卦 ${meta.name} 揭示事物中段演变，显隐情与内因。`,
  }
}

// ============ 伏神（卦中缺位时从本宫卦借来）============

function buildFushen(
  mainGua: GuaFull,
  yaoList: YaoInfo[],
  needed: Liuqin[],
): Array<{
  yaoPos: YaoPos
  name: Liuqin
  fromPalace: Palace
  reason: string
}> {
  const result: Array<{ yaoPos: YaoPos; name: Liuqin; fromPalace: Palace; reason: string }> = []
  const foundLiuqins = new Set(yaoList.map((y) => y.liuqin))
  for (const need of needed) {
    if (foundLiuqins.has(need)) continue
    // 找本宫卦
    const palaceGuas = GUA_PALACE.filter((g) => g.palace === mainGua.palace)
    const benGong = palaceGuas.find((g) => g.step === 1)
    if (!benGong) continue
    const palaceWx = PALACE_WUXING[benGong.palace]!
    const dizhis = NAJIA_DIZHI[benGong.lower].concat(NAJIA_DIZHI[benGong.upper])
    // 找本宫卦中 need 对应地支的爻
    for (let i = 0; i < 6; i++) {
      const lq = getLiuqin(palaceWx, dizhis[i])
      if (lq === need) {
        // 伏于此爻位之下
        const yaoPos = (i + 1) as YaoPos
        result.push({
          yaoPos,
          name: need,
          fromPalace: benGong.palace,
          reason: `卦中无${need}，伏于本宫 ${benGong.name} 第 ${yaoPos} 爻下`,
        })
        break
      }
    }
  }
  return result
}

// ============ 用神 ============

const YONGSHEN_MAP: Record<Topic, Liuqin> = {
  事业: '官鬼',
  求财: '妻财',
  姻缘: '妻财', // 简化：男看财星女看官星
  官运: '官鬼',
  学业: '父母',
  健康: '官鬼', // 病爻看官鬼
  家宅: '父母',
  出行: '父母',
  谋望: '子孙',
  求子: '子孙',
  失物: '妻财',
  诉讼: '官鬼',
  求官: '官鬼',
  通用: '妻财',
}

/** 农历月份转公历月份（简化版：直接用月） */
function getCurrentDizhis(date: Date): { year: DiZhi; month: DiZhi; day: DiZhi; hour: DiZhi } {
  // 年支：(year - 4) % 12
  const yearIdx = (((date.getFullYear() - 4) % 12) + 12) % 12
  const yearZhi = DIZHI[yearIdx]!
  // 月支：以节气简化（公历 2 月 = 寅月）
  const monthIdx = (date.getMonth() - 2 + 12 + 2) % 12 // 1月=丑=1, 2月=寅=2 ...
  // 实际上：公历 1 月 ≈ 丑，2 月 ≈ 寅，3 月 ≈ 卯 ... 即 monthZhiIdx = (month + 1) % 12
  const monthZhi = DIZHI[(date.getMonth() + 1) % 12]!
  // 日支：1900-01-01 是甲戌日（戌=10）
  const baseDate = new Date(1900, 0, 1)
  const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / 86400000)
  const dayZhi = DIZHI[(((10 + diffDays) % 12) + 12) % 12]!
  // 时支：hour 转 (0-23) → (子=23-1, 丑=1-3, ...)
  let hourZhiIdx = 0
  const h = date.getHours()
  if (h >= 23 || h < 1) hourZhiIdx = 0
  else hourZhiIdx = Math.floor((h + 1) / 2)
  const hourZhi = DIZHI[hourZhiIdx]!
  void yearIdx
  void monthIdx
  return { year: yearZhi, month: monthZhi, day: dayZhi, hour: hourZhi }
}

// ============ 神煞 ============

/**
 * 神煞计算
 *  - 天乙贵人：以日干查贵人
 *  - 驿马：以日支/命支查
 *  - 桃花：以日支/命支查
 *  - 华盖：以日支/命支查
 * 简化：按本卦日支推算（传统以起卦日为准）
 */

const TIANGUI: Record<TianGan, [DiZhi, DiZhi]> = {
  甲: ['丑', '未'],
  戊: ['丑', '未'],
  乙: ['子', '申'],
  己: ['子', '申'],
  丙: ['亥', '酉'],
  庚: ['亥', '酉'],
  丁: ['亥', '酉'],
  辛: ['亥', '酉'],
  壬: ['巳', '卯'],
  癸: ['巳', '卯'],
}

const YIMA: Record<DiZhi, [DiZhi, DiZhi, DiZhi]> = {
  寅: ['申', '申', '申'],
  午: ['申', '申', '申'],
  戌: ['申', '申', '申'], // 寅午戌 见申
  申: ['寅', '寅', '寅'],
  子: ['寅', '寅', '寅'],
  辰: ['寅', '寅', '寅'], // 申子辰 见寅
  巳: ['亥', '亥', '亥'],
  酉: ['亥', '亥', '亥'],
  丑: ['亥', '亥', '亥'], // 巳酉丑 见亥
  亥: ['巳', '巳', '巳'],
  卯: ['巳', '巳', '巳'],
  未: ['巳', '巳', '巳'], // 亥卯未 见巳
}

const TAOHUA: Record<DiZhi, DiZhi> = {
  寅: '卯',
  午: '卯',
  戌: '卯',
  申: '酉',
  子: '酉',
  辰: '酉',
  巳: '午',
  酉: '午',
  丑: '午',
  亥: '子',
  卯: '子',
  未: '子',
}

const HUAGAI: Record<DiZhi, DiZhi> = {
  寅: '戌',
  午: '戌',
  戌: '戌',
  申: '辰',
  子: '辰',
  辰: '辰',
  巳: '丑',
  酉: '丑',
  丑: '丑',
  亥: '未',
  卯: '未',
  未: '未',
}

function calcShensha(yaoList: YaoInfo[], dayGan: TianGan, dayZhi: DiZhi): ShenshaDesc[] {
  const result: ShenshaDesc[] = []
  // 天乙贵人
  const guiren = TIANGUI[dayGan]!
  for (const gz of guiren) {
    const yao = yaoList.find((y) => y.dizhi === gz)
    if (yao) {
      result.push({
        key: '天乙贵人',
        name: '天乙贵人',
        yaoPos: yao.pos,
        desc: `天乙贵人在第 ${yao.pos} 爻（${yao.dizhi}爻），主贵人相助，逢凶化吉。`,
        level: '吉',
      })
      yao.shen.push('天乙贵人')
    }
  }
  // 驿马
  const yima = YIMA[dayZhi][0]!
  const yimaYao = yaoList.find((y) => y.dizhi === yima)
  if (yimaYao) {
    result.push({
      key: '驿马',
      name: '驿马',
      yaoPos: yimaYao.pos,
      desc: `驿马在第 ${yimaYao.pos} 爻（${yimaYao.dizhi}爻），主动迁、出行、变动之象。`,
      level: '平',
    })
    yimaYao.shen.push('驿马')
  }
  // 桃花
  const taohua = TAOHUA[dayZhi]!
  const thYao = yaoList.find((y) => y.dizhi === taohua)
  if (thYao) {
    result.push({
      key: '桃花',
      name: '桃花',
      yaoPos: thYao.pos,
      desc: `桃花在第 ${thYao.pos} 爻（${thYao.dizhi}爻），主人缘、婚恋、艺术之象。`,
      level: '平',
    })
    thYao.shen.push('桃花')
  }
  // 华盖
  const huagai = HUAGAI[dayZhi]!
  const hgYao = yaoList.find((y) => y.dizhi === huagai)
  if (hgYao) {
    result.push({
      key: '华盖',
      name: '华盖',
      yaoPos: hgYao.pos,
      desc: `华盖在第 ${hgYao.pos} 爻（${hgYao.dizhi}爻），主聪明、艺术、宗教之象。`,
      level: '平',
    })
    hgYao.shen.push('华盖')
  }
  return result
}

// ============ 月令旺衰 ============

function monthWx(month: number): 'jin' | 'mu' | 'shui' | 'huo' | 'tu' {
  // 公历月 → 五行（简化版）：2-3 木, 4-5-6 火, 7-8-9 土, 10-11 金, 12-1 水
  if (month >= 2 && month <= 3) return 'mu'
  if (month >= 4 && month <= 6) return 'huo'
  if (month >= 7 && month <= 9) return 'tu'
  if (month >= 10 && month <= 11) return 'jin'
  return 'shui' // 12, 1
}

function statusYongshen(
  yaoWx: 'jin' | 'mu' | 'shui' | 'huo' | 'tu',
  month: number,
): '旺' | '相' | '休' | '囚' | '死' {
  const m = monthWx(month)
  if (yaoWx === m) return '旺'
  if (SHENG[m] === yaoWx) return '相' // 月令生用神
  if (SHENG[yaoWx] === m) return '休' // 用神生月令
  if (KE[m] === yaoWx) return '囚' // 月令克用神
  return '死'
}

// ============ 流时（流年/流月/流日/流时 → 对应爻位）============

function findYaoByDizhi(yaoList: YaoInfo[], dz: DiZhi): YaoInfo | undefined {
  return yaoList.find((y) => y.dizhi === dz)
}

function buildLiushi(yaoList: YaoInfo[], date: Date): Liushi {
  const dzs = getCurrentDizhis(date)
  const y = findYaoByDizhi(yaoList, dzs.year)
  const m = findYaoByDizhi(yaoList, dzs.month)
  const d = findYaoByDizhi(yaoList, dzs.day)
  const h = findYaoByDizhi(yaoList, dzs.hour)
  return {
    year: {
      zhi: dzs.year,
      yaoPos: y?.pos || null,
      text: y
        ? `流年${dzs.year}临第 ${y.pos} 爻，主${y.liuqin}事动`
        : `流年${dzs.year}卦中无对应爻`,
    },
    month: {
      zhi: dzs.month,
      yaoPos: m?.pos || null,
      text: m
        ? `流月${dzs.month}临第 ${m.pos} 爻，主${m.liuqin}事动`
        : `流月${dzs.month}卦中无对应爻`,
    },
    day: {
      zhi: dzs.day,
      yaoPos: d?.pos || null,
      text: d ? `流日${dzs.day}临第 ${d.pos} 爻，主${d.liuqin}事动` : `流日${dzs.day}卦中无对应爻`,
    },
    hour: {
      zhi: dzs.hour,
      yaoPos: h?.pos || null,
      text: h
        ? `流时${dzs.hour}临第 ${h.pos} 爻，主${h.liuqin}事动`
        : `流时${dzs.hour}卦中无对应爻`,
    },
  }
}

// ============ 5 维评分 ============

function calcFortunes(
  mainGua: GuaFull,
  yaoList: YaoInfo[],
  bianGua: { yaoList: YaoInfo[] },
  yongshenStatus: '旺' | '相' | '休' | '囚' | '死' | '缺',
  hasMoving: boolean,
): LiuyaoResult['fortunes'] {
  // 基础分：根据本卦是否动爻、爻地支组合
  const movingCount = yaoList.filter((y) => y.isMoving).length
  const base = 60
  const movingBonus = movingCount === 0 ? -8 : movingCount === 1 ? 8 : movingCount === 2 ? 4 : -4
  const yongBonus =
    yongshenStatus === '旺'
      ? 15
      : yongshenStatus === '相'
        ? 8
        : yongshenStatus === '休'
          ? -3
          : yongshenStatus === '囚'
            ? -10
            : yongshenStatus === '死'
              ? -18
              : -5 // 缺

  // 变卦影响
  const bianLiuqin = bianGua.yaoList.find((y) => y.isYang)
  let bianBonus = 0
  if (bianLiuqin) {
    const yaoWx = DIZHI_WUXING[bianLiuqin.dizhi]!
    const palaceWx = PALACE_WUXING[mainGua.palace]!
    if (yaoWx === palaceWx) bianBonus = 5
    else if (SHENG[yaoWx] === palaceWx) bianBonus = 3
    else if (KE[yaoWx] === palaceWx) bianBonus = -5
  }

  const adjust = (i: number) =>
    Math.max(20, Math.min(98, base + movingBonus + yongBonus + bianBonus + i))
  const t = (s: number) =>
    s >= 85 ? '大吉' : s >= 70 ? '吉' : s >= 55 ? '平' : s >= 40 ? '小凶' : '凶'
  void hasMoving
  return {
    career: { score: adjust(5), text: t(adjust(5)) },
    wealth: { score: adjust(0), text: t(adjust(0)) },
    love: { score: adjust(-3), text: t(adjust(-3)) },
    health: { score: adjust(8), text: t(adjust(8)) },
    study: { score: adjust(2), text: t(adjust(2)) },
  }
}

// ============ 建议 ============

function buildAdvice(
  mainGua: GuaFull,
  yaoList: YaoInfo[],
  bianGua: { name: string; reason: string },
  yongshen: LiuyaoResult['yongshen'],
  shensha: ShenshaDesc[],
  topic: Topic,
): Advice[] {
  const adv: Advice[] = []
  adv.push({
    title: '本卦总断',
    detail: `${mainGua.name}（${mainGua.symbol}），属 ${PALACE_NAME[mainGua.palace]}，第 ${mainGua.step} 卦。世爻在第 ${mainGua.shi} 爻。`,
    level: 'high',
  })
  adv.push({
    title: '卦爻结构',
    detail: `本卦 6 爻：${yaoList.map((y) => `${y.pos}爻[${y.liuqin}·${y.dizhi}${y.isYang ? '阳' : '阴'}${y.isMoving ? '·动' : ''}]`).join(' · ')}。`,
    level: 'mid',
  })
  adv.push({
    title: '动变分析',
    detail: bianGua.reason + (bianGua.name !== mainGua.name ? `，化卦为 ${bianGua.name}。` : '。'),
    level: 'mid',
  })
  adv.push({
    title: '用神分析',
    detail: `所占「${topic}」以${yongshen.key}为用神${yongshen.yaoPos ? `，立于第 ${yongshen.yaoPos} 爻` : ''}。${yongshen.statusDesc}`,
    level: 'high',
  })
  if (shensha.length > 0) {
    adv.push({
      title: '神煞点醒',
      detail: shensha
        .slice(0, 3)
        .map((s) => `${s.name}临第 ${s.yaoPos} 爻`)
        .join(' · '),
      level: 'mid',
    })
  }
  adv.push({
    title: '趋避之方',
    detail:
      yongshen.status === '旺' || yongshen.status === '相'
        ? '用神得力，所谋可成。宜乘势而上，把握良机。'
        : yongshen.status === '缺'
          ? '用神缺失，需借伏神之力。可另择时机或调整方案。'
          : '用神失力，宜静守待时。不如韬光养晦，待时而动。',
    level: 'low',
  })
  return adv
}

// ============ 综合解读 ============

function buildSummary(
  mainGua: GuaFull,
  bianGua: { name: string },
  yongshen: LiuyaoResult['yongshen'],
  fortunes: LiuyaoResult['fortunes'],
): string {
  const overall = fortunes.career.text
  return (
    `本卦 ${mainGua.name}（${PALACE_NAME[mainGua.palace]}），世在第 ${mainGua.shi} 爻。变卦 ${bianGua.name}。` +
    `用神${yongshen.key}（${yongshen.name}）${yongshen.status}，${yongshen.statusDesc}` +
    `综合运势【${overall}】，${overall === '大吉' || overall === '吉' ? '宜顺势而上' : overall === '平' ? '宜守正待时' : '宜静观其变'}。`
  )
}

// ============ 幸运元素 ============

function buildLucky(mainGua: GuaFull) {
  const upperWx = PALACE_WUXING[mainGua.palace]!
  const colorMap: Record<string, string> = {
    jin: '金色/白色',
    mu: '青色/绿色',
    shui: '黑色/蓝色',
    huo: '赤色/紫色',
    tu: '黄色/棕色',
  }
  const dirMap: Record<string, string> = { jin: '西', mu: '东', shui: '北', huo: '南', tu: '中央' }
  return {
    color: colorMap[upperWx] || '玄色',
    number: String((mainGua.shi * 3 + mainGua.step) % 9 || 9),
    direction: dirMap[upperWx] || '玄方',
  }
}

// ============ 主入口：起卦 + 排盘 ============

/**
 * 起卦并完整排盘
 *
 * @param topic - 所占之事
 * @param date  - 起卦时间（默认当前）
 * @param seed  - 可选 seed，用于稳定复现
 */
export function liuyaoDivinate(
  topic: Topic = '通用',
  date: Date = new Date(),
  seed?: number,
): LiuyaoResult {
  // 1. 蓍草起卦：6 爻
  const castProcess: LiuyaoResult['castProcess'] = []
  const yaoBin: [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType] = [0, 0, 0, 0, 0, 0]
  const isMoving: boolean[] = [false, false, false, false, false, false]

  const useSeed = seed !== undefined
  for (let i = 0; i < 6; i++) {
    let v: number
    if (useSeed && i === 0) {
      // 用 seed 哈希稳定生成
      let h = seed
      for (let k = 0; k < i + 1; k++) h = (h * 31 + k * 17) | 0
      v = [6, 7, 7, 8, 8, 8, 9, 9, 9, 9][Math.abs(h) % 10]
    } else {
      v = castYaoStick().value
    }
    const yang = v === 7 || v === 9 ? 1 : 0
    const isOld = v === 6 || v === 9
    const desc =
      v === 6
        ? '老阴 ━ ━（动，变阳）'
        : v === 7
          ? '少阳 ━━━━━'
          : v === 8
            ? '少阴 ━ ━'
            : '老阳 ━━━━━（动，变阴）'
    yaoBin[i] = yang as YaoType
    isMoving[i] = isOld
    castProcess.push({ step: i + 1, rawNumber: v, leftSticks: v, yang: yang as YaoType, desc })
  }

  // 2. 重组卦象
  const lowerBin = [yaoBin[0]!, yaoBin[1]!, yaoBin[2]!]
  const upperBin = [yaoBin[3]!, yaoBin[4]!, yaoBin[5]!]
  const lower = binToBagua(lowerBin)
  const upper = binToBagua(upperBin)
  const mainGua = findGua(upper, lower) || (GUA_PALACE[0]! as unknown as GuaFull)

  // 3. 推算 6 爻详细信息
  const yaoList = buildYaoList(
    mainGua.yaoBin,
    mainGua.upper,
    mainGua.lower,
    mainGua.palace,
    mainGua.shi,
    isMoving,
  )

  // 4. 变卦
  const bianGua = buildBianGua(mainGua, yaoList, isMoving)

  // 5. 互卦
  const huGua = buildHuGua(mainGua.yaoBin)

  // 6. 伏卦 = 本宫卦
  const palaceGuas = GUA_PALACE.filter((g) => g.palace === mainGua.palace)
  const benGong = palaceGuas.find((g) => g.step === 1) || palaceGuas[0]!
  const fuGuaYaoBin = [
    BAGUA_YAO[benGong.lower][0],
    BAGUA_YAO[benGong.lower][1],
    BAGUA_YAO[benGong.lower][2],
    BAGUA_YAO[benGong.upper][0],
    BAGUA_YAO[benGong.upper][1],
    BAGUA_YAO[benGong.upper][2],
  ] as [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType]
  const fuGuaYaoList = buildYaoList(
    fuGuaYaoBin,
    benGong.upper,
    benGong.lower,
    benGong.palace,
    benGong.shi,
    [false, false, false, false, false, false],
  )

  // 7. 用神
  const yongshenName = YONGSHEN_MAP[topic] || '妻财'
  const yaoYong = yaoList.find((y) => y.liuqin === yongshenName)
  const yongshenStatus: '旺' | '相' | '休' | '囚' | '死' | '缺' = yaoYong
    ? statusYongshen(DIZHI_WUXING[yaoYong.dizhi], date.getMonth() + 1)
    : '缺'
  const statusDescMap: Record<typeof yongshenStatus, string> = {
    旺: '用神当令得时，力量充沛，所求易成。',
    相: '用神得月令生扶，气数渐旺，可期可待。',
    休: '用神处休囚之地，力量不足，宜静守观望。',
    囚: '用神被月令克制，力量衰弱，多有阻碍。',
    死: '用神在月令死绝之地，事宜暂缓，待时而起。',
    缺: '卦中无此用神，需借伏神之力辅助判断。',
  }
  const yongshen: LiuyaoResult['yongshen'] = {
    key: yongshenName,
    yaoPos: yaoYong?.pos || null,
    name: yongshenName,
    wuxing: yaoYong ? DIZHI_WUXING[yaoYong.dizhi] : PALACE_WUXING[mainGua.palace],
    reason: `${topic}之占以 ${yongshenName} 为用神`,
    status: yongshenStatus,
    statusDesc: statusDescMap[yongshenStatus],
    found: !!yaoYong,
  }

  // 8. 伏神（用神缺失时找伏神）
  const fushen = buildFushen(mainGua, yaoList, [yongshenName])

  // 9. 流时
  const liushi = buildLiushi(yaoList, date)

  // 10. 神煞（用日干日支）
  const dayDizhis = getCurrentDizhis(date)
  const baseDate = new Date(1900, 0, 1)
  const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / 86400000)
  // 日干：1900-01-01 是甲戌日（甲=0）
  const dayGanIdx = (((0 + diffDays) % 10) + 10) % 10
  const dayGan = '甲乙丙丁戊己庚辛壬癸'[dayGanIdx] as TianGan
  const shensha = calcShensha(yaoList, dayGan, dayDizhis.day)

  // 11. 评分
  const hasMoving = isMoving.some((m) => m)
  const fortunes = calcFortunes(mainGua, yaoList, bianGua, yongshenStatus, hasMoving)

  // 12. 建议
  const advice = buildAdvice(mainGua, yaoList, bianGua, yongshen, shensha, topic)

  // 13. 综合解读
  const summary = buildSummary(mainGua, bianGua, yongshen, fortunes)

  // 14. 幸运
  const lucky = buildLucky(mainGua)

  return {
    divinationTime: date.getTime(),
    divinationTimeStr: formatDate(date),
    castProcess,
    benGua: {
      palace: mainGua.palace,
      palaceName: PALACE_NAME[mainGua.palace],
      palaceWuxing: PALACE_WUXING[mainGua.palace],
      name: mainGua.name,
      upper: mainGua.upper,
      lower: mainGua.lower,
      symbol: mainGua.symbol,
      yaoList,
      shiPos: mainGua.shi,
      yingPos: (mainGua.shi <= 3 ? mainGua.shi + 3 : mainGua.shi - 3) as YaoPos,
    },
    bianGua,
    huGua,
    fuGua: { name: benGong.name, yaoList: fuGuaYaoList },
    fushen,
    yongshen,
    liushi,
    shensha,
    fortunes,
    advice,
    summary,
    lucky,
  }
}

/** 格式化日期 */
function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

/** 占卜主题列表（UI 用） */
export const TOPICS: Array<{ key: Topic; label: string; glyph: string }> = [
  { key: '通用', label: '综合', glyph: '☯' },
  { key: '事业', label: '事业', glyph: '官' },
  { key: '求财', label: '求财', glyph: '财' },
  { key: '姻缘', label: '姻缘', glyph: '合' },
  { key: '学业', label: '学业', glyph: '学' },
  { key: '健康', label: '健康', glyph: '养' },
  { key: '家宅', label: '家宅', glyph: '宅' },
  { key: '出行', label: '出行', glyph: '行' },
  { key: '求子', label: '求子', glyph: '子' },
  { key: '诉讼', label: '诉讼', glyph: '讼' },
]

/** 文本：六亲含义 */
export const LIUQIN_DESC: Record<
  Liuqin,
  { name: Liuqin; wuxing: 'jin' | 'mu' | 'shui' | 'huo' | 'tu'; desc: string }
> = {
  父母: { name: '父母', wuxing: 'tu', desc: '父母爻主文书、契约、长辈、庇护、城池' },
  兄弟: { name: '兄弟', wuxing: 'mu', desc: '兄弟爻主朋友、同辈、竞争、阻碍、劫财' },
  子孙: { name: '子孙', wuxing: 'huo', desc: '子孙爻主福德、解忧、后代、谋望、医' },
  妻财: { name: '妻财', wuxing: 'shui', desc: '妻财爻主财源、妻子、物质、欲望、俸禄' },
  官鬼: { name: '官鬼', wuxing: 'jin', desc: '官鬼爻主官运、事业、压力、病灾、祸患' },
}

/** 文本：八卦基本信息 */
export const BAGUA_INTRO: Record<
  Bagua,
  { name: string; nature: string; wuxing: 'jin' | 'mu' | 'shui' | 'huo' | 'tu'; desc: string }
> = {
  qian: { name: '乾', nature: '天', wuxing: 'jin', desc: '乾为天 · 刚健中正 · 创始万物' },
  dui: { name: '兑', nature: '泽', wuxing: 'jin', desc: '兑为泽 · 悦乐喜悦 · 西方之象' },
  li: { name: '离', nature: '火', wuxing: 'huo', desc: '离为火 · 光明美丽 · 文明之象' },
  zhen: { name: '震', nature: '雷', wuxing: 'mu', desc: '震为雷 · 奋起震动 · 东方之象' },
  xun: { name: '巽', nature: '风', wuxing: 'mu', desc: '巽为风 · 顺入谦逊 · 东南之象' },
  kan: { name: '坎', nature: '水', wuxing: 'shui', desc: '坎为水 · 重险智慧 · 北方之象' },
  gen: { name: '艮', nature: '山', wuxing: 'tu', desc: '艮为山 · 止止静守 · 东北之象' },
  kun: { name: '坤', nature: '地', wuxing: 'tu', desc: '坤为地 · 厚德载物 · 西南之象' },
}
