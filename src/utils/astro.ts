/**
 * 西洋占星 · 12 星座 + 10 星体
 *
 * 核心元素：
 *  - 12 星座（黄道带）
 *  - 10 星体（太阳/月亮/水星/金星/火星/木星/土星/天王/海王/冥王）
 *  - 元素（火/土/风/水）
 *  - 性质（本位/固定/变动）
 *  - 宫位（上升星座）
 *
 * 简化算法：
 *  - 太阳星座：按公历月日查表
 *  - 上升星座：按本地恒星时（生日+小时）推算
 *  - 月亮星座：按生日推算（简化按"月相"映射）
 *  - 主导元素 + 主导性质
 *  - 行星逆行推算（简化：每年特定日期）
 */

export type Zodiac = '白羊' | '金牛' | '双子' | '巨蟹' | '狮子' | '处女' | '天秤' | '天蝎' | '射手' | '摩羯' | '水瓶' | '双鱼'

export interface ZodiacMeta {
  key: Zodiac
  glyph: string
  symbol: string
  dateRange: string
  element: '火' | '土' | '风' | '水'
  quality: '本位' | '固定' | '变动'
  ruler: string         // 守护星
  polar: Zodiac         // 对宫
  archetype: string     // 原型
  virtue: string
  flaw: string
  bodyPart: string      // 身体部位
  color: string
  desc: string
}

export const ZODIAC_META: Record<Zodiac, ZodiacMeta> = {
  白羊: { key: '白羊', glyph: '♈', symbol: '羊', dateRange: '3.21-4.19', element: '火', quality: '本位', ruler: '火星', polar: '天秤', archetype: '勇者', virtue: '勇敢 · 开创', flaw: '急躁 · 冲动', bodyPart: '头部', color: '#C8302A', desc: '白羊座是黄道第一宫 · 万物之始 · 象征新生与开创。' },
  金牛: { key: '金牛', glyph: '♉', symbol: '牛', dateRange: '4.20-5.20', element: '土', quality: '固定', ruler: '金星', polar: '天蝎', archetype: '守护者', virtue: '稳健 · 务实', flaw: '固执 · 占有', bodyPart: '颈部', color: '#4FAE6F', desc: '金牛座 · 物之守护 · 稳定坚守之象。' },
  双子: { key: '双子', glyph: '♊', symbol: '双', dateRange: '5.21-6.21', element: '风', quality: '变动', ruler: '水星', polar: '射手', archetype: '信使', virtue: '机敏 · 善辩', flaw: '多变 · 浅尝', bodyPart: '手 · 肺', color: '#D4AF37', desc: '双子座 · 信息之载体 · 多变多才。' },
  巨蟹: { key: '巨蟹', glyph: '♋', symbol: '蟹', dateRange: '6.22-7.22', element: '水', quality: '本位', ruler: '月亮', polar: '摩羯', archetype: '养育者', virtue: '温情 · 母性', flaw: '敏感 · 防御', bodyPart: '胃 · 胸', color: '#A87C4F', desc: '巨蟹座 · 母性之护 · 家庭情感之根。' },
  狮子: { key: '狮子', glyph: '♌', symbol: '狮', dateRange: '7.23-8.22', element: '火', quality: '固定', ruler: '太阳', polar: '水瓶', archetype: '王者', virtue: '慷慨 · 领导', flaw: '自负 · 虚荣', bodyPart: '心脏 · 背', color: '#E8E4D8', desc: '狮子座 · 阳之骄子 · 光芒之座。' },
  处女: { key: '处女', glyph: '♍', symbol: '女', dateRange: '8.23-9.22', element: '土', quality: '变动', ruler: '水星', polar: '双鱼', archetype: '工匠', virtue: '精细 · 完美', flaw: '挑剔 · 多虑', bodyPart: '肠 · 腹', color: '#1B3A5C', desc: '处女座 · 技艺之精 · 完美主义之象。' },
  天秤: { key: '天秤', glyph: '♎', symbol: '秤', dateRange: '9.23-10.23', element: '风', quality: '本位', ruler: '金星', polar: '白羊', archetype: '外交官', virtue: '优雅 · 公正', flaw: '犹豫 · 取悦', bodyPart: '肾 · 腰', color: '#D4AF37', desc: '天秤座 · 平衡之美 · 公正权衡之座。' },
  天蝎: { key: '天蝎', glyph: '♏', symbol: '蝎', dateRange: '10.24-11.22', element: '水', quality: '固定', ruler: '冥王星', polar: '金牛', archetype: '转化者', virtue: '深邃 · 执着', flaw: '占有 · 嫉妒', bodyPart: '生殖 · 排泄', color: '#5B3A8E', desc: '天蝎座 · 幽冥之深 · 转化重生之座。' },
  射手: { key: '射手', glyph: '♐', symbol: '弓', dateRange: '11.23-12.21', element: '火', quality: '变动', ruler: '木星', polar: '双子', archetype: '探险家', virtue: '自由 · 乐观', flaw: '鲁莽 · 不羁', bodyPart: '大腿 · 肝', color: '#C8302A', desc: '射手座 · 远行之道 · 真理之追求。' },
  摩羯: { key: '摩羯', glyph: '♑', symbol: '羊', dateRange: '12.22-1.19', element: '土', quality: '本位', ruler: '土星', polar: '巨蟹', archetype: '建设者', virtue: '雄心 · 坚毅', flaw: '冷酷 · 压抑', bodyPart: '骨骼 · 膝', color: '#A87C4F', desc: '摩羯座 · 巅峰之登 · 长期主义之座。' },
  水瓶: { key: '水瓶', glyph: '♒', symbol: '瓶', dateRange: '1.20-2.18', element: '风', quality: '固定', ruler: '天王星', polar: '狮子', archetype: '改革者', virtue: '独立 · 创新', flaw: '疏离 · 叛逆', bodyPart: '小腿 · 踝', color: '#5B3A8E', desc: '水瓶座 · 未来之思 · 革命性之座。' },
  双鱼: { key: '双鱼', glyph: '♓', symbol: '鱼', dateRange: '2.19-3.20', element: '水', quality: '变动', ruler: '海王星', polar: '处女', archetype: '神秘家', virtue: '慈悲 · 灵性', flaw: '迷茫 · 逃避', bodyPart: '足 · 淋巴', color: '#1B3A5C', desc: '双鱼座 · 海渊之灵 · 慈悲梦幻之座。' },
}

const SUN_DATE: Array<[number, number, Zodiac]> = [
  [3, 21, '白羊'], [4, 20, '金牛'], [5, 21, '双子'], [6, 22, '巨蟹'],
  [7, 23, '狮子'], [8, 23, '处女'], [9, 23, '天秤'], [10, 24, '天蝎'],
  [11, 23, '射手'], [12, 22, '摩羯'], [1, 20, '水瓶'], [2, 19, '双鱼'],
]

/**
 * 太阳星座推算
 */
export function sunSign(month: number, day: number): Zodiac {
  for (let i = 0; i < SUN_DATE.length; i++) {
    const [m, d, z] = SUN_DATE[i]
    const [nm, nd] = SUN_DATE[(i + 1) % SUN_DATE.length]
    if (m === month && day >= d) return z
    // 处理跨年（摩羯 12.22 - 1.19）
    if (i === 9 && month === 12 && day >= 22) return '摩羯'
    if (i === 9 && month === 1 && day < 20) return '摩羯'
    if (i === 10 && month === 1 && day >= 20) return '水瓶'
    if (i === 10 && month === 2 && day < 19) return '水瓶'
  }
  // fallback
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '摩羯'
  if (month === 1 && day >= 20) return '水瓶'
  if (month === 2 && day >= 19) return '双鱼'
  return '白羊'
}

/**
 * 上升星座推算（简化）
 * 上升每 2 小时换一个星座
 * 假设出生时间 6:00 = 上升白羊起点
 */
export function risingSign(birthHour: number): Zodiac {
  // 6:00 → 0 (白羊)
  // 8:00 → 1 (金牛)
  // ... 2 小时一换
  const startHour = 6
  const diff = (birthHour - startHour + 24) % 24
  const idx = Math.floor(diff / 2)
  const order: Zodiac[] = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼']
  return order[idx]
}

/**
 * 月亮星座推算（简化：月亮约 28 天一个周期，每天约 13 度）
 */
export function moonSign(year: number, month: number, day: number): Zodiac {
  // 简化：月亮每天约 13.2 度，28 天一个周期
  // 用累计天数 mod 12
  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000)
  const moonCycle = (dayOfYear * 13.2) % 360
  const idx = Math.floor(moonCycle / 30)
  const order: Zodiac[] = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼']
  return order[idx % 12]
}

/**
 * 水星/金星/火星 推算（简化：行星和太阳同一区间）
 */
export function planetSign(planet: 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn', month: number, day: number): Zodiac {
  // 简化：各行星有不同偏移
  const offsetMap = { mercury: 0, venus: 0, mars: -1, jupiter: 1, saturn: 2 }
  const offset = offsetMap[planet]
  const sun = sunSign(month, day)
  const order: Zodiac[] = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼']
  const idx = order.indexOf(sun)
  return order[(idx + offset + 12) % 12]
}

/**
 * 是否逆行
 */
export function isRetrograde(planet: 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn', year: number, month: number, day: number): boolean {
  // 简化：每年特定时间逆行
  // 水星一年逆行 3 次，每次约 3 周
  if (planet === 'mercury') {
    const m = (month - 1) * 31 + day
    if ((m > 60 && m < 80) || (m > 220 && m < 240) || (m > 320)) return true
  }
  if (planet === 'venus') {
    if (month === 5 || month === 9) return true
  }
  if (planet === 'mars') {
    if (month === 2) return true
  }
  if (planet === 'jupiter') {
    if (month === 6) return true
  }
  if (planet === 'saturn') {
    if (month === 11) return true
  }
  return false
}

export interface AstroPlanet {
  name: string
  sign: Zodiac
  retrograde: boolean
  meaning: string
}

export interface AstroResult {
  sun: Zodiac
  moon: Zodiac
  rising: Zodiac
  planets: AstroPlanet[]
  dominantElement: '火' | '土' | '风' | '水'
  dominantQuality: '本位' | '固定' | '变动'
  elementCounts: Record<'火' | '土' | '风' | '水', number>
  scores: {
    career: number
    wealth: number
    relationship: number
    health: number
    social: number
  }
  summary: string
  bigThree: {
    label: string
    sign: Zodiac
    meta: ZodiacMeta
    desc: string
  }[]
  yearlyForecast: { year: number; highlight: string; level: '大吉' | '吉' | '平' | '凶' | '大凶' }[]
}

const PLANET_MEANING: Record<string, string> = {
  sun: '自我 · 核心 · 生命力',
  moon: '情感 · 潜意识 · 内在',
  mercury: '思维 · 沟通 · 学习',
  venus: '爱情 · 审美 · 财富',
  mars: '行动 · 欲望 · 勇气',
  jupiter: '扩张 · 幸运 · 哲学',
  saturn: '限制 · 责任 · 成熟',
  uranus: '革新 · 突变 · 独立',
  neptune: '梦幻 · 灵性 · 迷惑',
  pluto: '转化 · 死亡 · 重生',
}

export function calcAstro(year: number, month: number, day: number, hour: number): AstroResult {
  const sun = sunSign(month, day)
  const moon = moonSign(year, month, day)
  const rising = risingSign(hour)

  const planets: AstroPlanet[] = [
    { name: '太阳', sign: sun, retrograde: false, meaning: PLANET_MEANING.sun },
    { name: '月亮', sign: moon, retrograde: false, meaning: PLANET_MEANING.moon },
    { name: '水星', sign: planetSign('mercury', month, day), retrograde: isRetrograde('mercury', year, month, day), meaning: PLANET_MEANING.mercury },
    { name: '金星', sign: planetSign('venus', month, day), retrograde: isRetrograde('venus', year, month, day), meaning: PLANET_MEANING.venus },
    { name: '火星', sign: planetSign('mars', month, day), retrograde: isRetrograde('mars', year, month, day), meaning: PLANET_MEANING.mars },
    { name: '木星', sign: planetSign('jupiter', month, day), retrograde: isRetrograde('jupiter', year, month, day), meaning: PLANET_MEANING.jupiter },
    { name: '土星', sign: planetSign('saturn', month, day), retrograde: isRetrograde('saturn', year, month, day), meaning: PLANET_MEANING.saturn },
    { name: '天王', sign: sun, retrograde: false, meaning: PLANET_MEANING.uranus },
    { name: '海王', sign: moon, retrograde: false, meaning: PLANET_MEANING.neptune },
    { name: '冥王', sign: rising, retrograde: false, meaning: PLANET_MEANING.pluto },
  ]

  // 元素统计
  const elementCounts: Record<'火' | '土' | '风' | '水', number> = { 火: 0, 土: 0, 风: 0, 水: 0 }
  planets.forEach(p => elementCounts[ZODIAC_META[p.sign].element]++)
  elementCounts[ZODIAC_META[rising].element]++
  const dominantElement = (Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0][0]) as '火' | '土' | '风' | '水'

  // 性质统计
  const q: Record<'本位' | '固定' | '变动', number> = { 本位: 0, 固定: 0, 变动: 0 }
  planets.forEach(p => q[ZODIAC_META[p.sign].quality]++)
  q[ZODIAC_META[rising].quality]++
  const dominantQuality = (Object.entries(q).sort((a, b) => b[1] - a[1])[0][0]) as '本位' | '固定' | '变动'

  // 5 维评分
  const scores: AstroResult['scores'] = {
    career: 30 + (year * 7 + month * 11 + day * 13) % 71,
    wealth: 30 + (year * 11 + month * 13 + day * 17) % 71,
    relationship: 30 + (year * 13 + month * 17 + day * 19) % 71,
    health: 30 + (year * 17 + month * 19 + day * 23) % 71,
    social: 30 + (year * 19 + month * 23 + day * 29) % 71,
  }

  // Big Three
  const bigThree: AstroResult['bigThree'] = [
    { label: '太阳', sign: sun, meta: ZODIAC_META[sun], desc: ZODIAC_META[sun].desc },
    { label: '月亮', sign: moon, meta: ZODIAC_META[moon], desc: ZODIAC_META[moon].desc },
    { label: '上升', sign: rising, meta: ZODIAC_META[rising], desc: ZODIAC_META[rising].desc },
  ]

  // 流年
  const currentYear = new Date().getFullYear()
  const yearlyForecast = Array.from({ length: 5 }, (_, i) => {
    const yr = currentYear + i
    const seed = (yr + year) * 31 + month * 13 + day * 7
    const idx = (Math.abs(seed) % 5)
    const levels: Array<'大吉' | '吉' | '平' | '凶' | '大凶'> = ['大吉', '吉', '平', '凶', '大凶']
    return {
      year: yr,
      highlight: ['大吉', '吉', '平', '凶', '大凶'][idx] === '大吉' ? '土星归位 · 大展宏图' : '平运 · 守正待时',
      level: levels[idx],
    }
  })

  return {
    sun,
    moon,
    rising,
    planets,
    dominantElement,
    dominantQuality,
    elementCounts,
    scores,
    summary: `太阳 ${sun} · 月亮 ${moon} · 上升 ${rising} · 主导元素 ${dominantElement} · 主导性质 ${dominantQuality}`,
    bigThree,
    yearlyForecast,
  }
}
