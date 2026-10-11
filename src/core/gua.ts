/**
 * DU v2 · 易学内核
 *
 * 六爻卦象的底层结构与推导（先天数、上下卦、互卦、变卦、体用）。
 * 与语料层解耦：这里只算，不断；断语由共鸣引擎按出处取。
 */

/** 八卦，键为自下而上三爻的二进制（阳=1） */
export type TrigramBin = '111' | '011' | '101' | '001' | '110' | '010' | '100' | '000'

export interface Trigram {
  bin: TrigramBin
  name: string
  symbol: string
  xiantian: number // 先天数 1–8
  wuxing: Wuxing
  nature: string
}

export type Wuxing = 'jin' | 'mu' | 'shui' | 'huo' | 'tu'

export const WUXING_NAME: Record<Wuxing, string> = {
  jin: '金',
  mu: '木',
  shui: '水',
  huo: '火',
  tu: '土',
}

/** 八卦先天数：乾一兑二离三震四巽五坎六艮七坤八 */
export const TRIGRAMS: Trigram[] = [
  { bin: '111', name: '乾', symbol: '☰', xiantian: 1, wuxing: 'jin', nature: '天' },
  { bin: '110', name: '兑', symbol: '☱', xiantian: 2, wuxing: 'jin', nature: '泽' },
  { bin: '101', name: '离', symbol: '☲', xiantian: 3, wuxing: 'huo', nature: '火' },
  { bin: '100', name: '震', symbol: '☳', xiantian: 4, wuxing: 'mu', nature: '雷' },
  { bin: '011', name: '巽', symbol: '☴', xiantian: 5, wuxing: 'mu', nature: '风' },
  { bin: '010', name: '坎', symbol: '☵', xiantian: 6, wuxing: 'shui', nature: '水' },
  { bin: '001', name: '艮', symbol: '☶', xiantian: 7, wuxing: 'tu', nature: '山' },
  { bin: '000', name: '坤', symbol: '☷', xiantian: 8, wuxing: 'tu', nature: '地' },
]

const BY_BIN = new Map(TRIGRAMS.map((t) => [t.bin, t]))
const BY_XIANTIAN = new Map(TRIGRAMS.map((t) => [t.xiantian, t]))

export const trigramByBin = (bin: TrigramBin): Trigram => {
  const t = BY_BIN.get(bin)
  if (!t) throw new Error(`unknown trigram ${bin}`)
  return t
}

/** 先天数 → 卦；余 0 作 8 */
export const trigramByXiantian = (n: number): Trigram => {
  const mod = ((n - 1) % 8 + 8) % 8 + 1
  const t = BY_XIANTIAN.get(mod)
  if (!t) throw new Error(`no trigram for ${n}`)
  return t
}

/** 上卦 × 下卦 → 卦名（通行本六十四卦），键序为 `下卦|上卦` */
const HEX_NAMES: Record<string, string> = {
  '111|111': '乾为天',
  '111|110': '泽天夬',
  '111|101': '火天大有',
  '111|100': '雷天大壮',
  '111|011': '风天小畜',
  '111|010': '水天需',
  '111|001': '山天大畜',
  '111|000': '地天泰',
  '110|111': '天泽履',
  '110|110': '兑为泽',
  '110|101': '火泽睽',
  '110|100': '雷泽归妹',
  '110|011': '风泽中孚',
  '110|010': '水泽节',
  '110|001': '山泽损',
  '110|000': '地泽临',
  '101|111': '天火同人',
  '101|110': '泽火革',
  '101|101': '离为火',
  '101|100': '雷火丰',
  '101|011': '风火家人',
  '101|010': '水火既济',
  '101|001': '火山旅',
  '101|000': '地火明夷',
  '100|111': '天雷无妄',
  '100|110': '泽雷随',
  '100|101': '火雷噬嗑',
  '100|100': '震为雷',
  '100|011': '风雷益',
  '100|010': '水雷屯',
  '100|001': '山雷颐',
  '100|000': '地雷复',
  '011|111': '天风姤',
  '011|110': '泽风大过',
  '011|101': '火风鼎',
  '011|100': '雷风恒',
  '011|011': '巽为风',
  '011|010': '风水涣',
  '011|001': '山风蛊',
  '011|000': '地风升',
  '010|111': '天水讼',
  '010|110': '泽水困',
  '010|101': '火水未济',
  '010|100': '雷水解',
  '010|011': '水风井',
  '010|010': '坎为水',
  '010|001': '山水蒙',
  '010|000': '地水师',
  '001|111': '天山遁',
  '001|110': '泽山咸',
  '001|101': '山火贲',
  '001|100': '雷山小过',
  '001|011': '风山渐',
  '001|010': '水山蹇',
  '001|001': '艮为山',
  '001|000': '地山谦',
  '000|111': '天地否',
  '000|110': '泽地萃',
  '000|101': '火地晋',
  '000|100': '雷地豫',
  '000|011': '风地观',
  '000|010': '水地比',
  '000|001': '山地剥',
  '000|000': '坤为地',
}

/** 一卦：自下而上六爻，阳为 1 */
export interface Hexagram {
  lines: Array<0 | 1>
  name: string
}

export function hexagram(lines: Array<0 | 1>): Hexagram {
  if (lines.length !== 6) throw new Error('hexagram needs 6 lines')
  const lower = lines.slice(0, 3).join('') as TrigramBin
  const upper = lines.slice(3, 6).join('') as TrigramBin
  const name = HEX_NAMES[`${lower}|${upper}`]
  if (!name) throw new Error(`unknown hexagram ${upper}|${lower}`)
  return { lines, name }
}

/** 六十四卦去重后必须 64 个，用作自检 */
export const HEX_COUNT = Object.keys(HEX_NAMES).length

/** 互卦：2/3/4 爻为下互，3/4/5 爻为上互 */
export function mutual(lines: Array<0 | 1>): Hexagram {
  return hexagram([lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]])
}

/** 变卦：动爻阴阳互变 */
export function changed(lines: Array<0 | 1>, movingPos: number): Hexagram {
  const next = [...lines] as Array<0 | 1>
  const i = movingPos - 1
  if (i < 0 || i > 5) throw new Error(`moving pos out of range: ${movingPos}`)
  next[i] = next[i] === 1 ? 0 : 1
  return hexagram(next)
}

/** 生我 / 我生 / 克我 / 我克 / 同 */
const SHENG: Record<Wuxing, Wuxing> = { mu: 'huo', huo: 'tu', tu: 'jin', jin: 'shui', shui: 'mu' }
const KE: Record<Wuxing, Wuxing> = { mu: 'tu', tu: 'shui', shui: 'huo', huo: 'jin', jin: 'mu' }

export type TiYong = 'bihe' | 'yongShengTi' | 'tiShengYong' | 'tiKeYong' | 'yongKeTi'

export function relate(ti: Wuxing, yong: Wuxing): TiYong {
  if (ti === yong) return 'bihe'
  if (SHENG[yong] === ti) return 'yongShengTi'
  if (SHENG[ti] === yong) return 'tiShengYong'
  if (KE[ti] === yong) return 'tiKeYong'
  return 'yongKeTi'
}

export const TIYONG_LABEL: Record<TiYong, string> = {
  bihe: '体用比和',
  yongShengTi: '用生体',
  tiShengYong: '体生用',
  tiKeYong: '体克用',
  yongKeTi: '用克体',
}

/**
 * 体用吉凶：比和与用生体为顺，体生用为泄，用克体为逆。
 * 注意：只描述"势"，不预测具体事件；界面须与典籍出处同屏。
 */
export const TIYONG_TREND: Record<TiYong, { tone: 'good' | 'warn' | 'bad'; text: string }> = {
  bihe: { tone: 'good', text: '比和，气势相合' },
  yongShengTi: { tone: 'good', text: '来生我，事顺' },
  tiKeYong: { tone: 'warn', text: '我去克它，费力可得' },
  tiShengYong: { tone: 'warn', text: '我去生它，耗神' },
  yongKeTi: { tone: 'bad', text: '来克我，宜守不宜攻' },
}

export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 23–1 点为子时，依次两小时一辰 */
export function shiChenIndex(hour: number): number {
  return Math.floor((((hour + 1) % 24) + 24) % 24 / 2)
}
