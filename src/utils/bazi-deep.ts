/**
 * 玄枢 MISTVERSE · 八字深化
 *
 * 扩展排盘所必须的：
 *  - 藏干（本气 + 中气 + 余气）
 *  - 十神（以日干为太极点的十种关系）
 *  - 纳音（六十甲子纳音五行）
 *  - 神煞（常用吉凶神）
 *  - 胎元 / 命宫 / 身宫
 *  - 大运 / 流年（起运时间 + 十步大运）
 *  - 真太阳时（粗略经度修正）
 *  - 日主强弱 / 用神 / 喜神
 */

import {
  TIANGAN,
  DIZHI,
  TIANGAN_WUXING,
  DIZHI_WUXING,
  TIANGAN_YINYANG,
  type TianGan,
  type DiZhi,
  calcBazi,
} from './bazi'
import type { Wuxing } from './wuxing'

// ============ 藏干 ============
export interface Canggan {
  gan: TianGan
  wuxing: Wuxing
  level: '本' | '中' | '余' | '本气'
}

/**
 * 地支藏干表（本气 + 中气 + 余气）
 */
export const DIZHI_CANGGAN: Record<DiZhi, TianGan[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '戊', '庚'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
}

export function getCanggan(zhi: DiZhi): Canggan[] {
  const gans = DIZHI_CANGGAN[zhi]
  return gans.map((g, i) => ({
    gan: g,
    wuxing: TIANGAN_WUXING[g],
    level: (i === 0 ? '本' : i === 1 ? '中' : '余') as '本' | '中' | '余',
  }))
}

// ============ 十神 ============
export type Shishen =
  | '比肩'
  | '劫财'
  | '食神'
  | '伤官'
  | '偏财'
  | '正财'
  | '七杀'
  | '正官'
  | '偏印'
  | '正印'

const SHISHEN_TABLE: Record<TianGan, Record<TianGan, Shishen>> = {
  // 日干为甲：阳木
  甲: {
    甲: '比肩',
    乙: '劫财',
    丙: '食神',
    丁: '伤官',
    戊: '偏财',
    己: '正财',
    庚: '七杀',
    辛: '正官',
    壬: '偏印',
    癸: '正印',
  },
  乙: {
    甲: '劫财',
    乙: '比肩',
    丙: '伤官',
    丁: '食神',
    戊: '正财',
    己: '偏财',
    庚: '正官',
    辛: '七杀',
    壬: '正印',
    癸: '偏印',
  },
  丙: {
    甲: '偏印',
    乙: '正印',
    丙: '比肩',
    丁: '劫财',
    戊: '食神',
    己: '伤官',
    庚: '偏财',
    辛: '正财',
    壬: '七杀',
    癸: '正官',
  },
  丁: {
    甲: '正印',
    乙: '偏印',
    丙: '劫财',
    丁: '比肩',
    戊: '伤官',
    己: '食神',
    庚: '正财',
    辛: '偏财',
    壬: '正官',
    癸: '七杀',
  },
  戊: {
    甲: '七杀',
    乙: '正官',
    丙: '偏印',
    丁: '正印',
    戊: '比肩',
    己: '劫财',
    庚: '食神',
    辛: '伤官',
    壬: '偏财',
    癸: '正财',
  },
  己: {
    甲: '正官',
    乙: '七杀',
    丙: '正印',
    丁: '偏印',
    戊: '劫财',
    己: '比肩',
    庚: '伤官',
    辛: '食神',
    壬: '正财',
    癸: '偏财',
  },
  庚: {
    甲: '偏财',
    乙: '正财',
    丙: '七杀',
    丁: '正官',
    戊: '偏印',
    己: '正印',
    庚: '比肩',
    辛: '劫财',
    壬: '食神',
    癸: '伤官',
  },
  辛: {
    甲: '正财',
    乙: '偏财',
    丙: '正官',
    丁: '七杀',
    戊: '正印',
    己: '偏印',
    庚: '劫财',
    辛: '比肩',
    壬: '伤官',
    癸: '食神',
  },
  壬: {
    甲: '食神',
    乙: '伤官',
    丙: '偏财',
    丁: '正财',
    戊: '七杀',
    己: '正官',
    庚: '偏印',
    辛: '正印',
    壬: '比肩',
    癸: '劫财',
  },
  癸: {
    甲: '伤官',
    乙: '食神',
    丙: '正财',
    丁: '偏财',
    戊: '正官',
    己: '七杀',
    庚: '正印',
    辛: '偏印',
    壬: '劫财',
    癸: '比肩',
  },
}

export function shishen(dayGan: TianGan, other: TianGan): Shishen {
  return SHISHEN_TABLE[dayGan][other]
}

// ============ 纳音 ============
/**
 * 六十甲子纳音
 * 甲子乙丑海中金，丙寅丁卯炉中火，戊辰己巳大林木，庚午辛未路旁土，
 * 壬申癸酉剑锋金，甲戌乙亥山头火，丙子丁丑涧下水，戊寅己卯城头土，
 * 庚辰辛巳白蜡金，壬午癸未杨柳木，甲申乙酉泉中水，丙戌丁亥屋上土，
 * 戊子己丑霹雳火，庚寅辛卯松柏木，壬辰癸巳长流水，甲午乙未沙中金，
 * 丙申丁酉山下火，戊戌己亥平地木，庚子辛丑壁上土，壬寅癸卯金箔金，
 * 甲辰乙巳覆灯火，丙午丁未天河水，戊申己酉大驿土，庚戌辛亥钗钏金，
 * 壬子癸丑桑柘木，甲寅乙卯大溪水，丙辰丁巳沙中土，戊午己未天上火，
 * 庚申辛酉石榴木，壬戌癸亥大海水
 */
const NAYIN_60 = [
  '海中金',
  '海中金',
  '炉中火',
  '炉中火',
  '大林木',
  '大林木',
  '路旁土',
  '路旁土',
  '剑锋金',
  '剑锋金',
  '山头火',
  '山头火',
  '涧下水',
  '涧下水',
  '城头土',
  '城头土',
  '白蜡金',
  '白蜡金',
  '长流水',
  '长流水',
  '沙中金',
  '沙中金',
  '山下火',
  '山下火',
  '平地木',
  '平地木',
  '壁上土',
  '壁上土',
  '金箔金',
  '金箔金',
  '覆灯火',
  '覆灯火',
  '天河水',
  '天河水',
  '大驿土',
  '大驿土',
  '钗钏金',
  '钗钏金',
  '桑柘木',
  '桑柘木',
  '大溪水',
  '大溪水',
  '沙中土',
  '沙中土',
  '天上火',
  '天上火',
  '石榴木',
  '石榴木',
  '大海水',
  '大海水',
  '海中金',
  '海中金',
  '炉中火',
  '炉中火',
  '大林木',
  '大林木',
  '路旁土',
  '路旁土',
  '剑锋金',
  '剑锋金',
  '山头火',
  '山头火',
  '涧下水',
  '涧下水',
]

const NAYIN_WUXING: Record<string, Wuxing> = {
  海中金: 'jin',
  剑锋金: 'jin',
  白蜡金: 'jin',
  沙中金: 'jin',
  金箔金: 'jin',
  钗钏金: 'jin',
  炉中火: 'huo',
  山头火: 'huo',
  山下火: 'huo',
  覆灯火: 'huo',
  天上火: 'huo',
  大林木: 'mu',
  平地木: 'mu',
  桑柘木: 'mu',
  石榴木: 'mu',
  松柏木: 'mu',
  杨柳木: 'mu',
  路旁土: 'tu',
  城头土: 'tu',
  壁上土: 'tu',
  大驿土: 'tu',
  沙中土: 'tu',
  涧下水: 'shui',
  长流水: 'shui',
  大溪水: 'shui',
  天河水: 'shui',
  大海水: 'shui',
}

export interface NayinInfo {
  name: string
  wuxing: Wuxing
  desc: string
}

const NAYIN_DESC: Record<string, string> = {
  海中金: '深藏不露，珍而重之',
  剑锋金: '刚毅果决，锋芒毕露',
  白蜡金: '柔润光洁，巧饰之金',
  沙中金: '含沙藏金，待时而发',
  金箔金: '薄而华美，光而不坚',
  钗钏金: '精雕细琢，柔中带刚',
  炉中火: '热烈刚健，文明之始',
  山头火: '日照高山，光耀四方',
  山下火: '夕阳衔山，余晖万里',
  覆灯火: '燃灯照夜，光而不烈',
  天上火: '太阳之火，普照万物',
  大林木: '参天之木，根深叶茂',
  平地木: '原上之木，独立平原',
  桑柘木: '柔韧多枝，可制良器',
  石榴木: '结实多子，圆润温和',
  杨柳木: '随风摇曳，柔美多姿',
  松柏木: '岁寒不凋，坚贞之质',
  路旁土: '承载万物，行道之土',
  城头土: '城墙之土，固而厚重',
  壁上土: '依壁之土，安稳踏实',
  大驿土: '通衢之土，气势宏大',
  沙中土: '沙砾之土，松而不实',
  涧下水: '山涧清流，澄澈纯净',
  长流水: '源远流长，绵延不绝',
  大溪水: '溪流奔涌，气势浩荡',
  天河水: '银河之水，清而高远',
  大海水: '包容万象，深不可测',
}

export function nayin(gan: TianGan, zhi: DiZhi): NayinInfo {
  // 60 甲子序号：循环 60 找匹配
  let n60 = 0
  for (let i = 0; i < 60; i++) {
    if (TIANGAN[i % 10] === gan && DIZHI[i % 12] === zhi) {
      n60 = i
      break
    }
  }
  const name = NAYIN_60[n60]
  return {
    name,
    wuxing: NAYIN_WUXING[name] || 'tu',
    desc: NAYIN_DESC[name] || '',
  }
}

// ============ 神煞（常用 14 位） ============
export interface Shensha {
  name: string
  type: '吉' | '凶' | '中'
  desc: string
}

/**
 * 判断日干支遇到地支是否有某神煞
 * 简化规则：
 *  - 天乙贵人：甲戊庚牛羊（丑未），乙己鼠猴乡（子申），丙丁猪鸡位（亥酉），壬癸蛇兔藏（巳卯），六辛逢马虎（午寅）
 *  - 驿马：申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳
 *  - 桃花：申子辰桃花在酉，寅午戌桃花在卯，巳酉丑桃花在午，亥卯未桃花在子
 *  - 华盖：申子辰华盖在辰，寅午戌华盖在戌，巳酉丑华盖在丑，亥卯未华盖在未
 *  - 文昌：甲乙巳位，丙丁申位，戊己申位，庚辛亥位，壬癸寅位
 *  - 羊刃：甲卯、丙午、戊午、庚酉、壬子
 *  - 将星：寅午戌在午，巳酉丑在酉，申子辰在子，亥卯未在卯
 *  - 天德贵人：正月生见丁，二月见申（略，简化为按月柱地支查）
 */
const TAIYI_GUIREN: Record<TianGan, DiZhi[]> = {
  甲: ['丑', '未'],
  戊: ['丑', '未'],
  庚: ['丑', '未'],
  乙: ['子', '申'],
  己: ['子', '申'],
  丙: ['亥', '酉'],
  丁: ['亥', '酉'],
  壬: ['巳', '卯'],
  癸: ['巳', '卯'],
  辛: ['午', '寅'],
}
const YIMA: Record<DiZhi, DiZhi> = {
  申: '寅',
  子: '寅',
  辰: '寅',
  寅: '申',
  午: '申',
  戌: '申',
  巳: '亥',
  酉: '亥',
  丑: '亥',
  亥: '巳',
  卯: '巳',
  未: '巳',
}
const TAOHUA: Record<DiZhi, DiZhi> = {
  申: '酉',
  子: '酉',
  辰: '酉',
  寅: '卯',
  午: '卯',
  戌: '卯',
  巳: '午',
  酉: '午',
  丑: '午',
  亥: '子',
  卯: '子',
  未: '子',
}
const HUAGAI: Record<DiZhi, DiZhi> = {
  申: '辰',
  子: '辰',
  辰: '辰',
  寅: '戌',
  午: '戌',
  戌: '戌',
  巳: '丑',
  酉: '丑',
  丑: '丑',
  亥: '未',
  卯: '未',
  未: '未',
}
const WENCHANG: Record<TianGan, DiZhi> = {
  甲: '巳',
  乙: '午',
  丙: '申',
  丁: '酉',
  戊: '申',
  己: '酉',
  庚: '亥',
  辛: '子',
  壬: '寅',
  癸: '卯',
}
const YANGREN: Record<TianGan, DiZhi> = {
  甲: '卯',
  丙: '午',
  戊: '午',
  庚: '酉',
  壬: '子',
  乙: '辰',
  丁: '未',
  己: '未',
  辛: '戌',
  癸: '丑',
}
const JIANGXING: Record<DiZhi, DiZhi> = {
  寅: '午',
  午: '午',
  戌: '午',
  巳: '酉',
  酉: '酉',
  丑: '酉',
  申: '子',
  子: '子',
  辰: '子',
  亥: '卯',
  卯: '卯',
  未: '卯',
}

export function shensha(bazi: ReturnType<typeof calcBazi>): Shensha[] {
  const dayGan = bazi.day.gan
  const dayZhi = bazi.day.zhi
  const zhis = [bazi.year.zhi, bazi.month.zhi, bazi.day.zhi, bazi.hour.zhi]
  const result: Shensha[] = []

  // 天乙贵人
  const guirenList = TAIYI_GUIREN[dayGan] || []
  for (const z of zhis) {
    if (guirenList.includes(z)) {
      result.push({ name: '天乙贵人', type: '吉', desc: '逢凶化吉，贵人扶助' })
      break
    }
  }

  // 驿马
  const yima = YIMA[dayZhi]
  if (yima && zhis.includes(yima)) {
    result.push({ name: '驿马', type: '中', desc: '奔波走动，远行迁移' })
  }

  // 桃花
  const taohua = TAOHUA[dayZhi]
  if (taohua && zhis.includes(taohua)) {
    result.push({ name: '桃花', type: '中', desc: '聪慧秀丽，情感丰富' })
  }

  // 华盖
  const huagai = HUAGAI[dayZhi]
  if (huagai && zhis.includes(huagai)) {
    result.push({ name: '华盖', type: '中', desc: '聪明孤高，艺术宗教之质' })
  }

  // 文昌
  const wenchang = WENCHANG[dayGan]
  if (wenchang && zhis.includes(wenchang)) {
    result.push({ name: '文昌', type: '吉', desc: '主文运学业，才思敏捷' })
  }

  // 羊刃
  const yangren = YANGREN[dayGan]
  if (yangren && zhis.includes(yangren)) {
    result.push({ name: '羊刃', type: '凶', desc: '刚强果决，亦主血光' })
  }

  // 将星
  const jiangxing = JIANGXING[dayZhi]
  if (jiangxing && zhis.includes(jiangxing)) {
    result.push({ name: '将星', type: '吉', desc: '领导之才，执掌权柄' })
  }

  return result
}

// ============ 胎元 / 命宫 / 身宫 ============
export function taiyuan(bazi: ReturnType<typeof calcBazi>): { gan: TianGan; zhi: DiZhi } {
  // 胎元 = 月柱干支进 1 步
  const mgi = TIANGAN.indexOf(bazi.month.gan)
  const mzi = DIZHI.indexOf(bazi.month.zhi)
  return {
    gan: TIANGAN[(mgi + 1) % 10] as TianGan,
    zhi: DIZHI[(mzi + 1) % 12] as DiZhi,
  }
}

export function minggong(bazi: ReturnType<typeof calcBazi>): { gan: TianGan; zhi: DiZhi } {
  // 命宫 = 寅起正月，顺数至生月；再从卯起子时，顺数至生时
  const month = bazi.month.zhi
  const _monthStart = DIZHI.indexOf(month) // 寅=2, 卯=3 ...
  // 实际：从寅开始，正月在寅
  // 简化：以月支序号起
  const monthZhiIdx = DIZHI.indexOf(month)
  // 月支相对寅的偏移
  const monthOffset = (monthZhiIdx - 2 + 12) % 12
  // 时支
  const hourZhiIdx = DIZHI.indexOf(bazi.hour.zhi)
  // 时支相对卯的偏移
  const hourOffset = (hourZhiIdx - 3 + 12) % 12
  const mingGongIdx = (2 + monthOffset + hourOffset) % 12
  return {
    gan: '',
    zhi: DIZHI[mingGongIdx] as DiZhi,
  } as any
}

export function shengong(bazi: ReturnType<typeof calcBazi>): { gan: TianGan; zhi: DiZhi } {
  // 身宫 = 寅起，顺数至生月；从子起，顺数至生时
  const monthZhiIdx = DIZHI.indexOf(bazi.month.zhi)
  const monthOffset = (monthZhiIdx - 2 + 12) % 12
  const hourZhiIdx = DIZHI.indexOf(bazi.hour.zhi)
  const hourOffset = hourZhiIdx // 从子=0 起
  const shenGongIdx = (2 + monthOffset + hourOffset) % 12
  return {
    gan: '',
    zhi: DIZHI[shenGongIdx] as DiZhi,
  } as any
}

// ============ 真太阳时（粗略经度修正） ============
/**
 * 简化版：每偏离东经 120 度 1 度 ≈ 4 分钟
 * 经度输入为东经正值
 */
export function trueSolarTime(
  hour: number,
  minute: number,
  longitude: number,
): { hour: number; minute: number; diff: number } {
  const diff = Math.round((longitude - 120) * 4) // 分钟
  let total = hour * 60 + minute + diff
  total = ((total % 1440) + 1440) % 1440
  return {
    hour: Math.floor(total / 60),
    minute: total % 60,
    diff,
  }
}

// ============ 大运 / 流年 ============
export interface DayunStep {
  startAge: number // 起始年龄（含）
  endAge: number // 结束年龄（含）
  gan: TianGan
  zhi: DiZhi
  nayin: string
  nayinWx: Wuxing
  shishen: Shishen // 相对日干
}

export interface DayunResult {
  qiyunAge: number // 起运年龄
  qiyunYear: number // 起运公历年
  direction: '顺' | '逆' // 阳男阴女顺排 / 阴男阳女逆排
  steps: DayunStep[] // 10 步大运（每步 10 年）
  currentStep?: DayunStep // 当前大运
}

/**
 * 起运时间：阳男阴女从出生日顺数到下一个节，阴男阳女从出生日逆数到上一个节
 * 简化版：直接按月数 3 倍 + 日数 / 3，得到 1 天 = 4 个月
 * 真实起运需查节气表，这里用简化估算
 */
export function calcDayun(
  bazi: ReturnType<typeof calcBazi>,
  gender: '男' | '女',
  birthYear: number,
  birthMonth: number,
  birthDay: number,
): DayunResult {
  const yearGan = bazi.year.gan
  const isYang = TIANGAN_YINYANG[yearGan] === 'yang'
  // 阳男/阴女 → 顺排；阴男/阳女 → 逆排
  const direction: '顺' | '逆' =
    (isYang && gender === '男') || (!isYang && gender === '女') ? '顺' : '逆'

  // 精确起运：阳男/阴女 → 出生到下一个节气（顺行）的天数
  //         阴男/阳女 → 出生到上一个节气（逆行）的天数
  // 每 3 天 = 1 年
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay)
  let _diffDays = 0
  if (direction === '顺') {
    // 找下一个节
    const jieqiOrder: DiZhi[] = [
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
      '子',
      '丑',
    ]
    const currentZhi = bazi.month.zhi
    const _currentIdx = jieqiOrder.indexOf(currentZhi)
    // 用一个近似：直接计算 15 天（每月约 30 天，过中气后约 15 天到下一节气）
    // 更精确：查 jieqiDay（已在 bazi.ts 导出）
    _diffDays = 15 // 简化
  } else {
    _diffDays = 15
  }
  // 更精确：用节气平均间隔 30.43 天
  // 起运天数 = 节气到出生日距离（顺）或 反向（逆）
  // 近似：以"出生到本月节气" + "到下月节气"为参考
  // 这里采取传统算法：约 3 天 = 1 年，4 时辰 = 1 天，10 天 = 1 月
  // 简化：把出生日减去 2 月 4 日（或加上），除以 3
  const lichunDate = new Date(birthYear, 1, 4)
  const rawDiff =
    direction === '顺'
      ? (birthDate.getTime() - lichunDate.getTime()) / 86400000
      : (lichunDate.getTime() - birthDate.getTime()) / 86400000
  // 节气间隔约 30.43 天，距下一个节平均 15 天
  // 顺行：距出生后下一个节气 ≈ 月中（15 天）
  // 逆行：距出生前一个节气 ≈ 月中（15 天）
  // 折合起运：3 天 = 1 年
  const qiyunAge = Math.max(1, Math.floor(rawDiff / 3))

  // 月柱顺推/逆推大运
  const mgi = TIANGAN.indexOf(bazi.month.gan)
  const mzi = DIZHI.indexOf(bazi.month.zhi)
  const steps: DayunStep[] = []
  for (let i = 0; i < 10; i++) {
    const offset = direction === '顺' ? i + 1 : -(i + 1)
    const ggi = (((mgi + offset) % 10) + 10) % 10
    const zzi = (((mzi + offset) % 12) + 12) % 12
    const gan = TIANGAN[ggi] as TianGan
    const zhi = DIZHI[zzi] as DiZhi
    const n = nayin(gan, zhi)
    steps.push({
      startAge: qiyunAge + i * 10,
      endAge: qiyunAge + i * 10 + 9,
      gan,
      zhi,
      nayin: n.name,
      nayinWx: n.wuxing,
      shishen: shishen(bazi.day.gan, gan),
    })
  }

  const currentAge = new Date().getFullYear() - birthYear
  const currentStep = steps.find((s) => currentAge >= s.startAge && currentAge <= s.endAge)

  return {
    qiyunAge,
    qiyunYear: birthYear + qiyunAge,
    direction,
    steps,
    currentStep,
  }
}

/** 流年（自起运年起逐年公历年 + 干支） */
export function liunians(
  bazi: ReturnType<typeof calcBazi>,
  fromYear: number,
  count = 12,
): Array<{ year: number; age: number; gan: TianGan; zhi: DiZhi; shishen: Shishen }> {
  const arr: Array<{ year: number; age: number; gan: TianGan; zhi: DiZhi; shishen: Shishen }> = []
  for (let i = 0; i < count; i++) {
    const y = fromYear + i
    const gi = (((y - 4) % 10) + 10) % 10
    const zi = (((y - 4) % 12) + 12) % 12
    const gan = TIANGAN[gi] as TianGan
    const zhi = DIZHI[zi] as DiZhi
    arr.push({
      year: y,
      age: y - (fromYear - 1),
      gan,
      zhi,
      shishen: shishen(bazi.day.gan, gan),
    })
  }
  return arr
}

// ============ 日主强弱 / 用神 ============
export interface DayunStrength {
  score: number // 0-100
  level: '极弱' | '偏弱' | '中和' | '偏旺' | '极旺'
  xi: Wuxing[] // 喜神
  ji: Wuxing[] // 忌神
  yong: Wuxing // 用神
}

/**
 * 简化日主强弱：
 *  - 月令地支为本气五行
 *  - 月令生扶日主 + 30，相同 + 20
 *  - 日支五行同类 + 10，年/时天干 + 5
 *  - 反向 -10 / -20
 */
export function dayunStrength(bazi: ReturnType<typeof calcBazi>): DayunStrength {
  const dayWx = TIANGAN_WUXING[bazi.day.gan]
  const monthZhiWx = DIZHI_WUXING[bazi.month.zhi]
  let score = 50
  // 月令权重最大
  if (monthZhiWx === dayWx) score += 30
  else if (SHENG[monthZhiWx] === dayWx) score += 20
  else if (KE[monthZhiWx] === dayWx) score -= 25
  else if (KE[dayWx] === monthZhiWx) score += 10

  // 日支
  const dayZhiWx = DIZHI_WUXING[bazi.day.zhi]
  if (dayZhiWx === dayWx) score += 10
  else if (SHENG[dayZhiWx] === dayWx) score += 8
  else if (KE[dayZhiWx] === dayWx) score -= 8

  // 年/时天干
  for (const g of [bazi.year.gan, bazi.hour.gan]) {
    const wx = TIANGAN_WUXING[g]
    if (wx === dayWx) score += 6
    else if (SHENG[wx] === dayWx) score += 5
    else if (KE[wx] === dayWx) score -= 6
  }

  score = Math.max(0, Math.min(100, score))
  let level: DayunStrength['level'] = '中和'
  if (score < 30) level = '极弱'
  else if (score < 45) level = '偏弱'
  else if (score > 70) level = '极旺'
  else if (score > 55) level = '偏旺'

  // 用神：日主偏旺 → 抑制（金克木、火克金、土克水、水克火、木克土）
  //       日主偏弱 → 生扶
  const WX_LIST: Wuxing[] = ['mu', 'huo', 'tu', 'jin', 'shui']
  const idx = WX_LIST.indexOf(dayWx)
  const keToDay = WX_LIST[(idx + 4) % 5]
  const shengToDay = WX_LIST[(idx + 3) % 5]
  const yong: Wuxing = score > 55 ? keToDay : shengToDay
  const xi: Wuxing[] = score > 55 ? [keToDay] : [shengToDay]
  const ji: Wuxing[] = score > 55 ? [dayWx, SHENG[dayWx]] : [keToDay]

  return { score, level, xi, ji, yong }
}

// 复用 wuxing 中的生克
import { SHENG, KE } from './wuxing'
