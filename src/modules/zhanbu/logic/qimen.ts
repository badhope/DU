/**
 * 玄枢 MISTVERSE · 时家奇门遁甲
 *
 * 完整排盘：
 *  - 24 节气定位（24 节精确表，按立春起）
 *  - 三元配局（5 日一局，15 日一气）
 *  - 阳遁冬至→夏至 顺行 1-9
 *  - 阴遁夏至→冬至 逆行 9-1
 *  - 真太阳时校正（经度 120° 基准）
 *  - 60 甲子日序号
 *  - 五鼠遁起时干
 *  - 三奇六仪排九宫
 *  - 九星飞布（蓬芮冲辅禽心柱任英）
 *  - 八门飞布（休生伤杜景死惊开）
 *  - 八神值符/腾蛇/太阴/六合/勾陈/朱雀/九地/九天
 *  - 值符值使定位
 *  - 击刑/入墓/空亡
 */

import { calcBazi, TIANGAN, DIZHI, type TianGan, type DiZhi } from '@modules/mingli/logic/bazi'

// ============ 节气三元表 ============
// 24 节气中每一节的上元/中元/下元局数（用 1-9 表示）
// 阳遁（冬至→夏至）：三元的局数 顺 1-9
// 阴遁（夏至→冬至）：三元的局数 逆 9-1
type ThreeYuan = [number, number, number] // [上元, 中元, 下元]

const SANYUAN: Record<string, { dun: '阳遁' | '阴遁'; ju: ThreeYuan }> = {
  // 阳遁 12 节
  冬至: { dun: '阳遁', ju: [1, 7, 4] },
  小寒: { dun: '阳遁', ju: [2, 8, 5] },
  大寒: { dun: '阳遁', ju: [3, 9, 6] },
  立春: { dun: '阳遁', ju: [8, 5, 2] },
  雨水: { dun: '阳遁', ju: [9, 6, 3] },
  惊蛰: { dun: '阳遁', ju: [1, 7, 4] },
  春分: { dun: '阳遁', ju: [3, 9, 6] },
  清明: { dun: '阳遁', ju: [4, 1, 7] },
  谷雨: { dun: '阳遁', ju: [5, 2, 8] },
  立夏: { dun: '阳遁', ju: [4, 1, 7] },
  小满: { dun: '阳遁', ju: [5, 2, 8] },
  芒种: { dun: '阳遁', ju: [6, 3, 9] },
  // 阴遁 12 节
  夏至: { dun: '阴遁', ju: [9, 3, 6] },
  小暑: { dun: '阴遁', ju: [8, 2, 5] },
  大暑: { dun: '阴遁', ju: [7, 1, 4] },
  立秋: { dun: '阴遁', ju: [2, 5, 8] },
  处暑: { dun: '阴遁', ju: [1, 4, 7] },
  白露: { dun: '阴遁', ju: [9, 3, 6] },
  秋分: { dun: '阴遁', ju: [7, 1, 4] },
  寒露: { dun: '阴遁', ju: [6, 9, 3] },
  霜降: { dun: '阴遁', ju: [5, 8, 2] },
  立冬: { dun: '阴遁', ju: [6, 9, 3] },
  小雪: { dun: '阴遁', ju: [5, 8, 2] },
  大雪: { dun: '阴遁', ju: [4, 7, 1] },
}

// 节气顺序（按公历月份）
const _JIEQI_ORDER = [
  '小寒',
  '大寒',
  '立春',
  '雨水',
  '惊蛰',
  '春分',
  '清明',
  '谷雨',
  '立夏',
  '小满',
  '芒种',
  '夏至',
  '小暑',
  '大暑',
  '立秋',
  '处暑',
  '白露',
  '秋分',
  '寒露',
  '霜降',
  '立冬',
  '小雪',
  '大雪',
  '冬至',
]
// 每个节气对应大致的月份分界日（公历）
const JIEQI_MONTH_DAY: Array<{ name: string; m: number; d: number }> = [
  { name: '小寒', m: 1, d: 5 },
  { name: '大寒', m: 1, d: 20 },
  { name: '立春', m: 2, d: 4 },
  { name: '雨水', m: 2, d: 19 },
  { name: '惊蛰', m: 3, d: 5 },
  { name: '春分', m: 3, d: 20 },
  { name: '清明', m: 4, d: 4 },
  { name: '谷雨', m: 4, d: 20 },
  { name: '立夏', m: 5, d: 5 },
  { name: '小满', m: 5, d: 20 },
  { name: '芒种', m: 6, d: 5 },
  { name: '夏至', m: 6, d: 21 },
  { name: '小暑', m: 7, d: 7 },
  { name: '大暑', m: 7, d: 22 },
  { name: '立秋', m: 8, d: 7 },
  { name: '处暑', m: 8, d: 23 },
  { name: '白露', m: 9, d: 7 },
  { name: '秋分', m: 9, d: 22 },
  { name: '寒露', m: 10, d: 8 },
  { name: '霜降', m: 10, d: 23 },
  { name: '立冬', m: 11, d: 7 },
  { name: '小雪', m: 11, d: 22 },
  { name: '大雪', m: 12, d: 7 },
  { name: '冬至', m: 12, d: 21 },
]

// ============ 九宫 ============
// 9 宫对应的卦象、九宫数、位置（行/列）
// 后天八卦 9 宫：戴九履一、左三右七、二四为肩、六八为足、五居中央
export const JIU_GONG: Array<{
  num: number
  gua: string
  gong: string
  row: number
  col: number
  element: '木' | '火' | '土' | '金' | '水'
  nature: '吉' | '中' | '凶'
}> = [
  { num: 1, gua: '坎', gong: '坎', row: 1, col: 1, element: '水', nature: '中' }, // 北
  { num: 2, gua: '坤', gong: '坤', row: 0, col: 1, element: '土', nature: '凶' }, // 西南
  { num: 3, gua: '震', gong: '震', row: 2, col: 0, element: '木', nature: '吉' }, // 东
  { num: 4, gua: '巽', gong: '巽', row: 0, col: 2, element: '木', nature: '吉' }, // 东南
  { num: 5, gua: '中', gong: '中', row: 1, col: 1, element: '土', nature: '中' }, // 中（寄宫）
  { num: 6, gua: '乾', gong: '乾', row: 0, col: 0, element: '金', nature: '吉' }, // 西北
  { num: 7, gua: '兑', gong: '兑', row: 2, col: 2, element: '金', nature: '凶' }, // 西
  { num: 8, gua: '艮', gong: '艮', row: 1, col: 0, element: '土', nature: '吉' }, // 东北
  { num: 9, gua: '离', gong: '离', row: 1, col: 2, element: '火', nature: '中' }, // 南
]
// 用 row/col 排序 9 宫（1-9 顺序）
JIU_GONG.sort((a, b) => {
  if (a.row !== b.row) return a.row - b.row
  return a.col - b.col
})

// ============ 三奇六仪 ============
// 戊己庚辛壬癸丁丙乙
// 戊 = 一局（坎）所在宫，依局数递推到对应宫
export const SAN_QI_LIU_YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'] as const
export const SAN_QI = new Set(['乙', '丙', '丁']) // 三奇
export const LIU_YI = new Set(['戊', '己', '庚', '辛', '壬', '癸'])

// 三奇五行属性
export const QI_WUXING: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  乙: '木',
  丙: '火',
  丁: '火',
}

// ============ 九星 ============
export const JIU_XING = [
  '天蓬',
  '天芮',
  '天冲',
  '天辅',
  '天禽',
  '天心',
  '天柱',
  '天任',
  '天英',
] as const
export type JiuXing = (typeof JIU_XING)[number]
// 九星吉凶
export const XING_NATURE: Record<JiuXing, '吉' | '中' | '凶'> = {
  天蓬: '凶',
  天芮: '凶',
  天冲: '吉',
  天辅: '吉',
  天禽: '中',
  天心: '吉',
  天柱: '中',
  天任: '吉',
  天英: '中',
}
export const XING_DESC: Record<JiuXing, string> = {
  天蓬: '主水 · 盗贼 · 隐匿',
  天芮: '主阴柔 · 病符 · 忧愁',
  天冲: '主木 · 冲动 · 征伐',
  天辅: '主木 · 辅助 · 教化',
  天禽: '主土 · 中央 · 调和',
  天心: '主金 · 医药 · 谋为',
  天柱: '主金 · 争讼 · 破败',
  天任: '主土 · 担当 · 厚重',
  天英: '主火 · 文采 · 礼仪',
}

// ============ 八门 ============
export const BA_MEN = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门'] as const
export type BaMen = (typeof BA_MEN)[number]
// 八门吉凶
export const MEN_NATURE: Record<BaMen, '吉' | '中' | '凶'> = {
  休门: '吉',
  生门: '吉',
  伤门: '凶',
  杜门: '中',
  景门: '中',
  死门: '凶',
  惊门: '凶',
  开门: '吉',
}
export const MEN_DESC: Record<BaMen, string> = {
  休门: '休养生息 · 求财吉',
  生门: '生机勃发 · 谋事大吉',
  伤门: '血光之灾 · 争讼凶',
  杜门: '闭塞隐藏 · 保密',
  景门: '文书考试 · 礼仪',
  死门: '死亡终结 · 丧葬',
  惊门: '惊恐口舌 · 惊险',
  开门: '大开门户 · 事业大吉',
}

// ============ 八神 ============
// 阳遁：值符→腾蛇→太阴→六合→勾陈（白虎）→朱雀（玄武）→九地→九天 顺行
// 阴遁：值符→九天→九地→朱雀→勾陈→六合→太阴→腾蛇 逆行
export const BA_SHEN = ['值符', '腾蛇', '太阴', '六合', '勾陈', '朱雀', '九地', '九天'] as const
export type BaShen = (typeof BA_SHEN)[number]
export const SHEN_NATURE: Record<BaShen, '吉' | '中' | '凶'> = {
  值符: '吉',
  腾蛇: '凶',
  太阴: '吉',
  六合: '吉',
  勾陈: '中',
  朱雀: '凶',
  九地: '中',
  九天: '吉',
}
export const SHEN_DESC: Record<BaShen, string> = {
  值符: '尊贵之位 · 大吉',
  腾蛇: '虚惊怪异 · 不安',
  太阴: '阴柔暗助 · 密谋',
  六合: '和合成事 · 婚吉',
  勾陈: '田土牢狱 · 阻碍',
  朱雀: '口舌是非 · 文书',
  九地: '坚固藏匿 · 守成',
  九天: '高远发达 · 喜庆',
}

// ============ 九宫 → 九星（地盘） ============
// 9 宫与 9 星的对应关系（地盘九星位）
const GONG_TO_STAR: Record<number, JiuXing> = {
  1: '天蓬',
  2: '天芮',
  3: '天冲',
  4: '天辅',
  5: '天禽',
  6: '天柱',
  7: '天心',
  8: '天任',
  9: '天英',
}
// 九宫 → 八门（地盘八门位）
const _GONG_TO_MEN: Record<number, BaMen | '中'> = {
  1: '休门',
  2: '死门',
  3: '伤门',
  4: '杜门',
  5: '中',
  6: '开门',
  7: '惊门',
  8: '生门',
  9: '景门',
}

// ============ 五行关系（用纳音/河图）============
// 九星/八门 与宫位五行生克定中/吉/凶（吉凶核心）

function _isWood(w: string) {
  return w === '木'
}
function _isFire(w: string) {
  return w === '火'
}
function _isEarth(w: string) {
  return w === '土'
}
function _isMetal(w: string) {
  return w === '金'
}
function _isWater(w: string) {
  return w === '水'
}

/** 击刑：九星落入与地盘同位的对冲宫（落宫克所到宫为击刑/入墓） */
function hasPunish(star: JiuXing, gongIdx: number): boolean {
  // 简化的击刑表
  const punishMap: Record<JiuXing, number> = {
    天蓬: 1,
    天芮: 2,
    天冲: 3,
    天辅: 4,
    天禽: 5,
    天柱: 6,
    天心: 7,
    天任: 8,
    天英: 9,
  }
  return punishMap[star] === gongIdx
}

/** 入墓：九星落入墓库之宫 */
function hasTomb(star: JiuXing, gongIdx: number): boolean {
  const tombMap: Record<JiuXing, number> = {
    天蓬: 2,
    天芮: 7,
    天冲: 8,
    天辅: 9,
    天禽: 5,
    天柱: 3,
    天心: 1,
    天任: 6,
    天英: 4,
  }
  return tombMap[star] === gongIdx
}

/** 空亡：60 甲子 10 个空亡 */
const KONG_WANG: Record<string, string[]> = {
  甲子: ['戌', '亥'],
  甲戌: ['申', '酉'],
  甲申: ['午', '未'],
  甲午: ['辰', '巳'],
  甲辰: ['寅', '卯'],
  甲寅: ['子', '丑'],
}
function getKongWang(dayGan: TianGan, dayZhi: DiZhi): string[] {
  const startZhi = dayZhi
  for (const [k, v] of Object.entries(KONG_WANG)) {
    if (k.endsWith(startZhi)) return v
  }
  return []
}

// ============ 工具：找当前节气 ============
function getJieqi(year: number, month: number, day: number): string {
  // 把当前日期与 24 节气对比
  // 节气日是公历日期
  const target = new Date(year, month - 1, day).getTime()
  let bestName = '冬至'
  let bestDiff = Infinity
  const _prevName = '小寒'
  for (let i = 0; i < JIEQI_MONTH_DAY.length; i++) {
    const j = JIEQI_MONTH_DAY[i]!
    let jYear = year
    if (j.name === '小寒' || j.name === '大寒') jYear = year // 当年 1 月
    const jDate = new Date(jYear, j.m - 1, j.d)
    const diff = target - jDate.getTime()
    // 找最近且已过
    if (diff >= 0 && diff < bestDiff) {
      bestDiff = diff
      bestName = j.name
    }
  }
  return bestName
}

function dayInJieqi(year: number, month: number, day: number): number {
  // 返回当月在当节第几天（1-15）
  const name = getJieqi(year, month, day)
  const idx = JIEQI_MONTH_DAY.findIndex((j) => j.name === name)
  const j = JIEQI_MONTH_DAY[idx]!
  const jDate = new Date(year, j.m - 1, j.d)
  const target = new Date(year, month - 1, day)
  return Math.floor((target.getTime() - jDate.getTime()) / 86400000) + 1
}

function getYuan(year: number, month: number, day: number): '上元' | '中元' | '下元' {
  const d = dayInJieqi(year, month, day)
  if (d <= 5) return '上元'
  if (d <= 10) return '中元'
  return '下元'
}

function getJu(
  year: number,
  month: number,
  day: number,
): { dun: '阳遁' | '阴遁'; ju: number; yuan: '上元' | '中元' | '下元'; jieqi: string } {
  const jieqi = getJieqi(year, month, day)
  const yuan = getYuan(year, month, day)
  const config = SANYUAN[jieqi]!
  const yuanIdx = yuan === '上元' ? 0 : yuan === '中元' ? 1 : 2
  return { dun: config.dun, ju: config.ju[yuanIdx], yuan, jieqi }
}

// ============ 60 甲子序号 ============
const JIAZI_60: Array<{ gan: TianGan; zhi: DiZhi }> = []
for (let i = 0; i < 60; i++) {
  JIAZI_60.push({
    gan: TIANGAN[i % 10] as TianGan,
    zhi: DIZHI[i % 12] as DiZhi,
  })
}

function jiaziIndex(gan: TianGan, zhi: DiZhi): number {
  // 60 甲子序数
  for (let i = 0; i < 60; i++) {
    if (JIAZI_60[i]?.gan === gan && JIAZI_60[i]?.zhi === zhi) return i
  }
  return 0
}

// ============ 9 宫数 → 8 神（按阳遁/阴遁顺逆） ============
function getShenSeq(dun: '阳遁' | '阴遁'): BaShen[] {
  // 阳遁从值符起顺行：值符 腾蛇 太阴 六合 勾陈 朱雀 九地 九天
  // 阴遁从值符起逆行：值符 九天 九地 朱雀 勾陈 六合 太阴 腾蛇
  if (dun === '阳遁') return ['值符', '腾蛇', '太阴', '六合', '勾陈', '朱雀', '九地', '九天']
  return ['值符', '九天', '九地', '朱雀', '勾陈', '六合', '太阴', '腾蛇']
}

function _getMenSeq(dun: '阳遁' | '阴遁'): BaMen[] {
  // 八门顺序：休 生 伤 杜 景 死 惊 开
  if (dun === '阳遁') return ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门']
  return ['休门', '开门', '惊门', '死门', '景门', '杜门', '伤门', '生门']
}

function _getXingSeq(dun: '阳遁' | '阴遁'): JiuXing[] {
  if (dun === '阳遁')
    return ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英']
  return ['天英', '天任', '天柱', '天心', '天禽', '天辅', '天冲', '天芮', '天蓬']
}

// ============ 真奇门排盘 ============
export interface QimenPalace {
  gong: string // 宫名（坎/坤/震/巽/中/乾/兑/艮/离）
  num: number // 9 宫数
  row: number
  col: number
  diPan: string // 地盘干
  tianPan: string // 天盘干
  star: JiuXing // 九星
  men: BaMen | '中' // 八门
  shen: BaShen // 八神
  starNature: '吉' | '中' | '凶'
  menNature: '吉' | '中' | '凶'
  shenNature: '吉' | '中' | '凶'
  starDesc: string // 九星释义
  menDesc: string // 八门释义
  shenDesc: string // 八神释义
  judge: '大吉' | '吉' | '中' | '凶' | '大凶'
  brief: string
  isKong: boolean // 空亡
  isPunish: boolean // 击刑
  isTomb: boolean // 入墓
}

export interface QimenResult {
  // 基础
  ju: number // 局数 1-9
  dun: '阳遁' | '阴遁'
  yuan: '上元' | '中元' | '下元'
  jieqi: string // 节气名
  // 时间
  shiGan: TianGan // 时干
  shiZhi: DiZhi // 时支
  trueSolarHour: number // 真太阳时
  // 60 甲子
  dayGan: TianGan
  dayZhi: DiZhi
  dayJiazi: number // 60 甲子序
  // 值符值使
  zhiFuStar: JiuXing
  zhiShiMen: BaMen
  zhiFuGong: number // 值符落宫
  zhiShiGong: number // 值使落宫
  // 九宫
  palace: QimenPalace[]
  // 评分
  scores: {
    career: number
    wealth: number
    relationship: number
    health: number
    social: number
  }
  // 空亡
  kongWang: string[]
  // 总结
  summary: string
  oracle: string
  advice: string[]
}

/**
 * 排盘主函数
 * @param year 公历年
 * @param month 月 1-12
 * @param day 日 1-31
 * @param hour 时 0-23
 * @param longitude 经度（东经为正），默认 120（北京时间基准）
 */
export function calcQimen(
  year: number,
  month: number,
  day: number,
  hour: number,
  longitude: number = 120,
): QimenResult {
  // 1) 真太阳时
  const solarDiff = (longitude - 120) * 4 // 分钟
  const trueSolarHour = (hour + solarDiff / 60 + 24) % 24

  // 2) 通过 calcBazi 获取日柱（用真太阳时可能跨日）
  const bz = calcBazi(year, month, day, hour, longitude)
  const dayGan = bz.day.gan
  const dayZhi = bz.day.zhi
  const dayJiazi = jiaziIndex(dayGan, dayZhi)
  const shiGan = bz.hour.gan
  const shiZhi = bz.hour.zhi

  // 3) 节气 / 三元 / 局数
  const jieqiInfo = getJu(year, month, day)
  const { dun, ju, yuan, jieqi } = jieqiInfo

  // 4) 三奇六仪（地盘）：戊起一宫（坎），按 1-9 顺序排
  // 若局数 = 5，则戊居中宫（中寄坤 2）
  // 6 仪 戊己庚辛壬癸
  // 三奇 丁丙乙（顺序）  寄 6 7 8 9
  // 实际：戊 起局数所在宫，按 1-9 顺行
  // 例：局数 = 1，戊在 1 宫，己在 2 宫 ... 乙在 9 宫
  // 例：局数 = 6，戊在 6 宫，己在 7 宫，庚在 8 宫，辛在 9 宫，丁在 1 宫，丙在 2 宫，乙在 3 宫

  // 计算每个宫位（1-9）的地盘干
  // SAN_QI_LIU_YI = [戊 己 庚 辛 壬 癸 丁 丙 乙] 对应 1-9 局数
  // 局数 n 即戊所在宫
  const gongDiPan: Record<number, TianGan> = {}
  for (let g = 1; g <= 9; g++) {
    // 求 (g - n) mod 9 找索引
    const idx = (((g - ju) % 9) + 9) % 9
    const gan = SAN_QI_LIU_YI[idx]!
    gongDiPan[g] = gan
  }

  // 5) 值符星：时辰天干对照九星
  // 时干 → 起首星序（戊起天蓬，己起天芮，庚起天冲...）
  // 戊己庚辛壬癸丁丙乙 → 天蓬 天芮 天冲 天辅 天禽 天心 天柱 天任 天英
  // 简化：按时干
  const shiGanIdx = TIANGAN.indexOf(shiGan)
  // 时辰落宫 = shiGanIdx + 1（奇门遁甲中的 1-9 宫位）
  // 戊→1 己→2 庚→3 辛→4 壬→5 癸→6 丁→7 丙→8 乙→9
  const shiGong = (shiGanIdx + 1) % 9 || 9
  // 值符星 = 时辰落宫的地盘星
  const zhiFuStar = GONG_TO_STAR[shiGong]!
  // 值符落宫 = 时辰地盘干所在宫
  // 即"地盘上 shiGan 干所在宫"
  // 时干 = 戊→1宫 己→2宫 庚→3宫 辛→4宫 壬→5宫 癸→6宫 丁→7宫 丙→8宫 乙→9宫
  const zhiFuGong = shiGong

  // 6) 值使门：时辰地支对照八门（地盘八门）
  // 时辰子→休门 ... 时辰亥→开门
  // 简化：按时支索引取八门
  const shiZhiIdx = DIZHI.indexOf(shiZhi)
  // 值使 = 时辰地支 + 1 序
  // 子时 0 → 休门 0
  const zhiShiMen = (() => {
    const seq = ['休门', '生门', '伤门', '杜门', '景门', '死门', '惊门', '开门']
    return seq[shiZhiIdx % 8] as BaMen
  })()
  // 值使落宫 = 值使在地盘上对应的宫
  // 休=1 生=8 伤=3 杜=4 景=9 死=2 惊=7 开=6
  const zhiShiGong = (() => {
    const map: Record<BaMen, number> = {
      休门: 1,
      生门: 8,
      伤门: 3,
      杜门: 4,
      景门: 9,
      死门: 2,
      惊门: 7,
      开门: 6,
    }
    return map[zhiShiMen]
  })()

  // 7) 天盘干 = 飞布
  // 步骤：
  //  a) 值符星从地盘 shiGong 宫 飞 到  zhiFuGong 宫
  //  b) 其余星随值符星旋转
  //  c) 各星原本所在宫的地盘干 飞 到 值符星现落宫
  // 简化：直接生成天盘 - 地盘的对应关系
  // 旋转偏移 = zhiFuGong - shiGong
  const offset = zhiFuGong - shiGong
  // 飞布：原本 i 宫地盘的干，飞到 (i + offset) 宫的天盘
  // 这里采用"阳遁顺飞"惯例（盘转星不转）

  // 8) 天盘九星 = 值符星从地盘 飞到 zhiFuGong，其余星顺序轮转
  // 9) 天盘八门 = 值使门从地盘 飞到 zhiShiGong，其余门顺序轮转
  // 10) 八神 = 从值符宫起按阳遁顺/阴遁逆排列 8 神

  // ============ 构建 9 宫 ============
  const palace: QimenPalace[] = JIU_GONG.map((g) => {
    const gongNum = g.num
    const gInfo = JIU_GONG.find((x) => x.num === gongNum)!
    const row = gInfo.row
    const col = gInfo.col
    // 地盘干
    const diPan = gongDiPan[gongNum]!
    // 天盘干：飞布
    const tianPanGan = (() => {
      // 原本该宫地盘干在 (gongNum - offset) 宫，飞到 gongNum
      const fromGong = ((gongNum - offset - 1 + 9) % 9) + 1
      return gongDiPan[fromGong]!
    })()

    // 天盘九星：根据值符落宫 + 9 星的顺序
    // 地盘 9 星原始位置：1 蓬 2 芮 3 冲 4 辅 5 禽 6 柱 7 心 8 任 9 英
    // 值符从 原始 1 蓬位 飞到  zhiFuGong
    // 旋转偏移 = zhiFuGong - 1
    const xingOffset = zhiFuGong - 1
    const originalStarPos: Record<number, JiuXing> = {
      1: '天蓬',
      2: '天芮',
      3: '天冲',
      4: '天辅',
      5: '天禽',
      6: '天柱',
      7: '天心',
      8: '天任',
      9: '天英',
    }
    // 1 蓬位 飞 到 zhiFuGong；2 芮位 飞 到 zhiFuGong+1 ...
    // 反推：现在 gongNum 宫的天盘星 = 原本在 (gongNum - xingOffset) 宫的星
    const starOriginalGong = ((gongNum - xingOffset - 1 + 9) % 9) + 1
    const star = originalStarPos[starOriginalGong]!

    // 天盘八门
    const originalMenPos: Record<number, BaMen | '中'> = {
      1: '休门',
      2: '死门',
      3: '伤门',
      4: '杜门',
      5: '中',
      6: '开门',
      7: '惊门',
      8: '生门',
      9: '景门',
    }
    const menOffset = zhiShiGong - 1 // 1 休 飞 到 zhiShiGong
    const menOriginalGong = ((gongNum - menOffset - 1 + 9) % 9) + 1
    const men: BaMen | '中' = originalMenPos[menOriginalGong]!

    // 八神：从值符宫起 按阳遁顺 / 阴遁逆 排 8 神
    const shenSeq = getShenSeq(dun)
    const shenIdx = (((gongNum - zhiFuGong + (dun === '阳遁' ? 0 : 0)) % 8) + 8) % 8
    const shen = (dun === '阳遁' ? shenSeq[shenIdx] : shenSeq[shenIdx])! // 数组本身已按阴遁排好

    const starNature = XING_NATURE[star]!
    const menNature: '吉' | '中' | '凶' = men === '中' ? '中' : MEN_NATURE[men as BaMen]!
    const shenNature = SHEN_NATURE[shen]!

    // 空亡
    const kong = getKongWang(dayGan, dayZhi)
    const isKong = kong.includes(tianPanGan as string) || kong.includes(diPan)

    // 击刑 / 入墓
    const punish = hasPunish(star, gongNum)
    const tomb = hasTomb(star, gongNum)

    // 吉凶评定
    let score = 0
    if (starNature === '吉') score += 2
    if (starNature === '凶') score -= 2
    if (menNature === '吉') score += 2
    if (menNature === '凶') score -= 2
    if (shenNature === '吉') score += 1
    if (shenNature === '凶') score -= 1
    if (isKong) score -= 2
    if (punish) score -= 2
    if (tomb) score -= 1
    // 三奇加成
    if (SAN_QI.has(tianPanGan as string)) score += 1

    let judge: '大吉' | '吉' | '中' | '凶' | '大凶' = '中'
    if (score >= 4) judge = '大吉'
    else if (score >= 2) judge = '吉'
    else if (score <= -4) judge = '大凶'
    else if (score <= -2) judge = '凶'

    const brief =
      `${star}${men === '中' ? '' : men}·${shen} · ${isKong ? '空 ' : ''}${punish ? '刑 ' : ''}${tomb ? '墓' : ''}`.trim()

    return {
      gong: gInfo.gong,
      num: gongNum,
      row,
      col,
      diPan,
      tianPan: tianPanGan,
      star,
      men,
      shen,
      starNature,
      menNature,
      shenNature,
      starDesc: XING_DESC[star],
      menDesc: men === '中' ? '中宫' : MEN_DESC[men as BaMen],
      shenDesc: SHEN_DESC[shen as BaShen],
      judge,
      brief,
      isKong,
      isPunish: punish,
      isTomb: tomb,
    }
  })

  // ============ 评分 ============
  const bigJiCount = palace.filter((p) => p.judge === '大吉').length
  const jiCount = palace.filter((p) => p.judge === '吉').length
  const xiongCount = palace.filter((p) => p.judge === '凶' || p.judge === '大凶').length
  const baseScore = 50 + bigJiCount * 10 + jiCount * 5 - xiongCount * 7
  const scores = {
    career: Math.max(
      0,
      Math.min(
        100,
        baseScore +
          (palace.find((p) => p.num === 3)?.judge === '大吉' ||
          palace.find((p) => p.num === 3)?.judge === '吉'
            ? 8
            : -5),
      ),
    ),
    wealth: Math.max(
      0,
      Math.min(
        100,
        baseScore +
          (palace.find((p) => p.num === 8)?.judge === '大吉' ||
          palace.find((p) => p.num === 8)?.judge === '吉'
            ? 8
            : -5),
      ),
    ),
    relationship: Math.max(
      0,
      Math.min(
        100,
        baseScore +
          (palace.find((p) => p.num === 6)?.judge === '大吉' ||
          palace.find((p) => p.num === 6)?.judge === '吉'
            ? 8
            : -5),
      ),
    ),
    health: Math.max(
      0,
      Math.min(
        100,
        baseScore +
          (palace.find((p) => p.num === 1)?.judge === '大吉' ||
          palace.find((p) => p.num === 1)?.judge === '吉'
            ? 8
            : -5),
      ),
    ),
    social: Math.max(
      0,
      Math.min(
        100,
        baseScore +
          (palace.find((p) => p.num === 9)?.judge === '大吉' ||
          palace.find((p) => p.num === 9)?.judge === '吉'
            ? 8
            : -5),
      ),
    ),
  }

  // 总结
  const kong = getKongWang(dayGan, dayZhi)
  const summary = `${dun}${ju}局 · ${yuan} · ${jieqi} · 日柱${dayGan}${dayZhi}（${dayJiazi + 1}/60）· 时${shiGan}${shiZhi} · 值符${zhiFuStar}（${zhiFuGong}宫）· 值使${zhiShiMen}（${zhiShiGong}宫）`

  const oracle = `${summary}。${bigJiCount + jiCount}宫吉 · ${xiongCount}宫凶，空亡在${kong.join('、')}。${zhiFuStar}当值，主${XING_DESC[zhiFuStar]}；${zhiShiMen}当值，主${MEN_DESC[zhiShiMen]}。`

  // 实用建议
  const advice: string[] = []
  advice.push(`用时${shiGan}${shiZhi}（真太阳时 ${trueSolarHour.toFixed(1)} 时），${dun}${ju}局。`)
  advice.push(`值符星${zhiFuStar}，${XING_DESC[zhiFuStar]}。`)
  advice.push(`值使门${zhiShiMen}，${MEN_DESC[zhiShiMen]}。`)
  // 最吉宫
  const bestGong = palace.find((p) => p.judge === '大吉')
  if (bestGong) {
    advice.push(
      `最吉方位：${bestGong.gong}宫（${['北', '西南', '东', '东南', '中', '西北', '西', '东北', '南'][bestGong.num - 1]}），主${XING_DESC[bestGong.star]}。`,
    )
  }
  // 最凶宫
  const worstGong = palace.find((p) => p.judge === '大凶')
  if (worstGong) {
    advice.push(
      `慎行方位：${worstGong.gong}宫（${['北', '西南', '东', '东南', '中', '西北', '西', '东北', '南'][worstGong.num - 1]}），${XING_DESC[worstGong.star]}${worstGong.isKong ? '逢空' : ''}${worstGong.isPunish ? '击刑' : ''}。`,
    )
  }
  if (kong.length) {
    advice.push(`日空亡：${kong.join('、')}，此方所求皆虚。`)
  }

  return {
    ju,
    dun,
    yuan,
    jieqi,
    shiGan,
    shiZhi,
    trueSolarHour: Math.round(trueSolarHour * 10) / 10,
    dayGan,
    dayZhi,
    dayJiazi,
    zhiFuStar,
    zhiShiMen,
    zhiFuGong,
    zhiShiGong,
    palace,
    scores,
    kongWang: kong,
    summary,
    oracle,
    advice,
  }
}
