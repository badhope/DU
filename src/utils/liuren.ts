/**
 * 玄枢 MISTVERSE · 大六壬（简化版）
 *
 *  - 天地盘（月将 + 占时）
 *  - 四课（干上神、支上神、支上干、支上支）
 *  - 三传（贼克法）
 *  - 课体分类
 *  - 十二天将 / 神煞
 *
 * 注：完整大六壬需"天地盘加时支"等复杂演算，本工具为入门讲解版
 */

import { calcBazi } from './bazi'
import type { Wuxing } from './wuxing'
import { SHENG as _SHENG, KE as _KE } from './wuxing'

// ============ 十二天盘神将 ============
const TWELVE_GENERALS = [
  '贵人',
  '螣蛇',
  '朱雀',
  '六合',
  '勾陈',
  '青龙',
  '天空',
  '白虎',
  '太常',
  '玄武',
  '太阴',
  '天后',
] as const
type General = (typeof TWELVE_GENERALS)[number]

const GENERAL_DESC: Record<General, { nature: '吉' | '凶' | '中'; desc: string }> = {
  贵人: { nature: '吉', desc: '大吉之主，逢凶化吉' },
  螣蛇: { nature: '凶', desc: '惊疑怪异' },
  朱雀: { nature: '凶', desc: '口舌文书' },
  六合: { nature: '吉', desc: '和合成事' },
  勾陈: { nature: '凶', desc: '迟滞拘泥' },
  青龙: { nature: '吉', desc: '喜庆财帛' },
  天空: { nature: '中', desc: '虚假不实' },
  白虎: { nature: '凶', desc: '血光凶灾' },
  太常: { nature: '吉', desc: '酒食财帛' },
  玄武: { nature: '凶', desc: '暗昧盗贼' },
  太阴: { nature: '吉', desc: '阴柔妇人' },
  天后: { nature: '吉', desc: '婚姻恩泽' },
}

// 十二地支
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
type DiZhi = (typeof ZHI)[number]

// 月将（正月用登明亥，二月用河魁戌，... 十二月用丑）
const MONTH_GENERAL: DiZhi[] = [
  '亥',
  '戌',
  '酉',
  '申',
  '未',
  '午',
  '巳',
  '辰',
  '卯',
  '寅',
  '丑',
  '子',
]

// ============ 核心排课 ============
export interface LiurenResult {
  // 时间信息
  year: number
  month: number
  day: number
  hour: number
  dayGan: string
  dayZhi: DiZhi
  hourZhi: DiZhi
  monthJiang: General // 月将
  // 天盘（12 神将 + 12 地支）
  tianPan: Array<{ zhi: DiZhi; general: General; generalDesc: string }>
  // 地盘（占时支加月将所乘天盘）
  diPan: Array<{ zhi: DiZhi; general: General; generalDesc: string }>
  // 四课
  fourKe: Array<{
    ke: '第一课' | '第二课' | '第三课' | '第四课'
    zhi: DiZhi
    general: General
    desc: string
  }>
  // 三传
  sanChuan: { chu: General; zhong: General; mo: General; keti: string; desc: string }
  // 课体
  keti: string
  ketiDesc: string
  // 整体判断
  judge: '大吉' | '吉' | '中' | '凶' | '大凶'
  summary: string
  lucky: { color: string; direction: string; number: number }
}

const TIANGAN: Record<string, 'yang' | 'yin'> = {
  甲: 'yang',
  乙: 'yin',
  丙: 'yang',
  丁: 'yin',
  戊: 'yang',
  己: 'yin',
  庚: 'yang',
  辛: 'yin',
  壬: 'yang',
  癸: 'yin',
}

// 贵神起例：阳贵（甲丙戊庚壬）：从日支起贵神
// 阳贵起例：甲日 - 丑 / 丙 - 亥 / 戊 - 丑 / 庚 - 丑 / 壬 - 巳
// 阴贵起例：乙日 - 子 / 丁 - 亥 / 己 - 子 / 辛 - 午 / 癸 - 巳
const YANG_GUIREN: Record<string, DiZhi> = { 甲: '丑', 丙: '亥', 戊: '丑', 庚: '未', 壬: '巳' }
const YIN_GUIREN: Record<string, DiZhi> = { 乙: '子', 丁: '亥', 己: '申', 辛: '午', 癸: '巳' }

// 求贵神
function guirenStart(dayGan: string): { yang: DiZhi; yin: DiZhi } {
  const _yy = TIANGAN[dayGan] || 'yang'
  return {
    yang: YANG_GUIREN[dayGan] || '丑',
    yin: YIN_GUIREN[dayGan] || '子',
  }
}

/**
 * 大六壬排课（简化版）
 */
export function calcLiuren(year: number, month: number, day: number, hour: number): LiurenResult {
  const bazi = calcBazi(year, month, day, hour)
  const dayGan = bazi.day.gan
  const dayZhi = bazi.day.zhi as DiZhi
  const hourZhi = bazi.hour.zhi as DiZhi
  const monthJiangZhi = MONTH_GENERAL[month - 1] as DiZhi

  // 求贵神起
  const gr = guirenStart(dayGan)
  // 阳贵：白天顺行
  // 阴贵：夜晚逆行（实际：阳贵白天顺行从贵起；阴贵夜晚逆行）
  // 简化：以昼为 6-18、夜为 18-6
  const isDay = hour >= 6 && hour < 18
  const isYangGan = ['甲', '丙', '戊', '庚', '壬'].includes(dayGan)
  let guirenStartZhi: DiZhi
  if (isYangGan) {
    guirenStartZhi = isDay ? gr.yang : gr.yin
  } else {
    guirenStartZhi = isDay ? gr.yin : gr.yang
  }

  // 天盘神将顺布（以贵神所乘地支为起点，顺行 12）
  const grIdx = ZHI.indexOf(guirenStartZhi)
  const tianPan = TWELVE_GENERALS.map((g, i) => {
    const zhi = ZHI[(grIdx + i) % 12] as DiZhi
    return { zhi, general: g, generalDesc: GENERAL_DESC[g].desc }
  })

  // 地盘 = 天盘 + 占时支
  // 月将加占时支 → 顺数至占时支位，所得即为地盘
  const hourZhiIdx = ZHI.indexOf(hourZhi)
  const mjIdx = ZHI.indexOf(monthJiangZhi)
  // 旋转 = (hourZhiIdx - mjIdx + 12) % 12
  const offset = (hourZhiIdx - mjIdx + 12) % 12
  const diPan = TWELVE_GENERALS.map((g, i) => {
    const zhi = ZHI[(i + offset) % 12] as DiZhi
    return { zhi, general: g, generalDesc: GENERAL_DESC[g].desc }
  })

  // 四课：以日干支为基准
  //  第一课：日干 阳神 = 日干寄宫上所乘天盘
  //  第二课：日干 阴神 = 阳神所乘地支上所乘天盘
  //  第三课：日支 阳神 = 日支上所乘天盘
  //  第四课：日支 阴神 = 阳神所乘地支上所乘天盘
  const GAN_GONG: Record<string, DiZhi> = {
    甲: '寅',
    乙: '辰',
    丙: '巳',
    丁: '未',
    戊: '巳',
    己: '未',
    庚: '申',
    辛: '戌',
    壬: '亥',
    癸: '丑',
  }
  const dayGanZhi = GAN_GONG[dayGan] as DiZhi

  // 查天盘
  const tianByZhi = (z: DiZhi): General => {
    const item = tianPan.find((tp) => tp.zhi === z)
    return item ? item.general : '贵人'
  }
  const _diByZhi = (z: DiZhi): General => {
    const item = diPan.find((tp) => tp.zhi === z)
    return item ? item.general : '贵人'
  }

  // 第一课：日干 阳
  const ke1Yang = tianByZhi(dayGanZhi)
  // 第二课：日干 阴
  const ke1Zhi = tianPan.find((tp) => tp.general === ke1Yang)?.zhi || dayGanZhi
  const ke2Yang = tianByZhi(ke1Zhi)
  // 第三课：日支 阳
  const ke3Yang = tianByZhi(dayZhi)
  // 第四课：日支 阴
  const ke3Zhi = tianPan.find((tp) => tp.general === ke3Yang)?.zhi || dayZhi
  const ke4Yang = tianByZhi(ke3Zhi)

  const fourKe = [
    { ke: '第一课' as const, zhi: dayGanZhi, general: ke1Yang, desc: '日干阳神 · 主事之始' },
    { ke: '第二课' as const, zhi: ke1Zhi, general: ke2Yang, desc: '日干阴神 · 主内情' },
    { ke: '第三课' as const, zhi: dayZhi, general: ke3Yang, desc: '日支阳神 · 主事之应' },
    { ke: '第四课' as const, zhi: ke3Zhi, general: ke4Yang, desc: '日支阴神 · 主隐秘' },
  ]

  // 三传（贼克法简化）：
  //  - 阳将 = 四课中克下贼上者
  //  - 若四课无贼，取日支阳神为初传
  const generals = [ke1Yang, ke2Yang, ke3Yang, ke4Yang]
  const gSet = new Set(generals)
  // 找有克 → 第一贼
  const KILL_LIST: General[] = ['白虎', '玄武', '勾陈', '朱雀', '螣蛇', '天空']
  const keList = KILL_LIST.filter((k) => gSet.has(k))
  const chu: General = keList[0] || ke3Yang
  const zhong: General = generals[(generals.indexOf(chu) + 1) % 4] || ke2Yang
  const mo: General = generals[(generals.indexOf(chu) + 2) % 4] || ke1Yang

  // 课体判断（简化）
  let keti = '比用课'
  const judgeCount = KILL_LIST.filter((k) => gSet.has(k)).length
  if (judgeCount === 0) keti = '元首课'
  else if (judgeCount === 1) keti = '重审课'
  else if (judgeCount === 2) keti = '知一课'
  else keti = '杂派课'

  const ketiDesc = {
    比用课: '诸神相比，谋事难成',
    元首课: '元首统众，先难后易',
    重审课: '重新审视，可改旧图新',
    知一课: '知一达十，专一可成',
    杂派课: '众神杂出，谋事宜慎',
  }[keti]

  // 吉凶判断（简化）：青龙/六合/贵人越多越吉
  const goodCount = ['青龙', '六合', '贵人', '太常', '太阴', '天后'].filter((g) =>
    gSet.has(g as General),
  ).length
  const badCount = ['白虎', '玄武', '勾陈', '螣蛇', '天空', '朱雀'].filter((g) =>
    gSet.has(g as General),
  ).length
  const judge: LiurenResult['judge'] =
    goodCount >= 4
      ? '大吉'
      : goodCount >= 2
        ? '吉'
        : badCount >= 4
          ? '大凶'
          : badCount >= 2
            ? '凶'
            : '中'

  // 总结
  const summary = `${year}年${month}月${day}日${hourZhi}时课体「${keti}」，初传${chu}、中传${zhong}、末传${mo}。${judge}：${ketiDesc}。`

  // 喜神方位（简化）
  const directionMap: Record<Wuxing, string> = {
    mu: '东',
    huo: '南',
    tu: '中',
    jin: '西',
    shui: '北',
  }
  // 喜神五行：日干阳则喜水阴则喜金 ...（简化用日干）
  const dayGanWuxing: Wuxing = (() => {
    const w = {
      甲: 'mu',
      乙: 'mu',
      丙: 'huo',
      丁: 'huo',
      戊: 'tu',
      己: 'tu',
      庚: 'jin',
      辛: 'jin',
      壬: 'shui',
      癸: 'shui',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    return w[dayGan] as Wuxing
  })()
  const lucky = {
    color: { mu: '青', huo: '红', tu: '黄', jin: '白', shui: '黑' }[dayGanWuxing],
    direction: directionMap[dayGanWuxing],
    number: { mu: 3, huo: 7, tu: 5, jin: 4, shui: 1 }[dayGanWuxing],
  }

  return {
    year,
    month,
    day,
    hour,
    dayGan,
    dayZhi,
    hourZhi,
    monthJiang: (TWELVE_GENERALS[ZHI.indexOf(monthJiangZhi)] ||
      '青龙') as (typeof TWELVE_GENERALS)[number],
    tianPan,
    diPan,
    fourKe,
    sanChuan: {
      chu: chu as General,
      zhong: zhong as General,
      mo: mo as General,
      keti: keti || '',
      desc: ketiDesc || '',
    },
    keti: keti || '',
    ketiDesc: ketiDesc || '',
    judge,
    summary,
    lucky,
  }
}
