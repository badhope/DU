/**
 * 玄空飞星 · 风水核心算法
 *
 * 玄空飞星风水以"三元九运"为基础：
 *  - 上元：1·2·3 运（1864-1923）
 *  - 中元：4·5·6 运（1924-1983）
 *  - 下元：7·8·9 运（1984-2043）
 *  - 公元 2004 后入下元 8 运，2024 即将进入 9 运
 *
 * 核心：
 *  - 运盘：9 宫飞星（洛书轨迹）
 *  - 山盘：坐向决定（八宫飞星）
 *  - 向盘：朝向决定
 *  - 零神/正神：水神与山神
 *  - 城门：八宫城门
 *  - 紫白飞星：动态流年
 *
 * 简化：基于九宫飞星轨迹 + 流年紫白
 */

// 九宫 1-9 顺序
export const GONG_NAMES_9 = [
  '一白',
  '二黑',
  '三碧',
  '四绿',
  '五黄',
  '六白',
  '七赤',
  '八白',
  '九紫',
] as const
export type GONG_NUM = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

// 九宫方位
export const GONG_DIR: Record<GONG_NUM, { dir: string; wx: string; meaning: string }> = {
  1: { dir: '正北', wx: '水', meaning: '一白贪狼 · 官星 · 文昌' },
  2: { dir: '西南', wx: '土', meaning: '二黑巨门 · 病符 · 煞气' },
  3: { dir: '正东', wx: '木', meaning: '三碧禄存 · 争讼 · 口舌' },
  4: { dir: '东南', wx: '木', meaning: '四绿文曲 · 文昌 · 桃花' },
  5: { dir: '中央', wx: '土', meaning: '五黄廉贞 · 灾煞 · 太岁' },
  6: { dir: '西北', wx: '金', meaning: '六白武曲 · 偏财 · 驿马' },
  7: { dir: '正西', wx: '金', meaning: '七赤破军 · 盗贼 · 官非' },
  8: { dir: '东北', wx: '土', meaning: '八白左辅 · 财星 · 太乙' },
  9: { dir: '正南', wx: '火', meaning: '九紫右弼 · 喜庆 · 桃花' },
}

// 洛书轨迹（顺飞 / 逆飞）
// 中宫 → 乾 → 兑 → 艮 → 离 → 坎 → 坤 → 震 → 巽
const LUOSHU_PATH: GONG_NUM[] = [5, 6, 7, 8, 9, 1, 2, 3, 4] // 顺飞序列

/**
 * 推算当前元运
 * 1864 起上元 1 运，每运 60 年
 */
export function getYun(year: number): { yuan: '上' | '中' | '下'; num: GONG_NUM; desc: string } {
  // 2004-2063 = 下元 8 运
  // 2044-2073 = 下元 9 运
  let num: GONG_NUM
  if (year >= 2044 && year <= 2073) num = 9
  else if (year >= 2024 && year <= 2043) num = 8
  else if (year >= 1984 && year <= 2003) num = 7
  else if (year >= 1964 && year <= 1983) num = 6
  else if (year >= 1944 && year <= 1963) num = 5
  else if (year >= 1924 && year <= 1943) num = 4
  else if (year >= 1904 && year <= 1923) num = 3
  else if (year >= 1884 && year <= 1903) num = 2
  else num = 1

  const yuan: '上' | '中' | '下' = num <= 3 ? '上' : num <= 6 ? '中' : '下'
  return {
    yuan,
    num,
    desc: `${GONG_NAMES_9[num - 1]}当运（${GONG_DIR[num]?.meaning}）`,
  }
}

/**
 * 运盘排布
 *  - 运星入中宫 = 当运数
 *  - 洛书顺飞
 *  - 返回 9 宫 1-9 数
 */
export function getYunPan(yunNum: GONG_NUM): Record<number, GONG_NUM> {
  // 起点 = yunNum, 在中宫
  // 顺飞：5(中)→6→7→8→9→1→2→3→4
  const startIdx = LUOSHU_PATH.indexOf(yunNum)
  const pan: Record<number, GONG_NUM> = {}
  for (let i = 0; i < 9; i++) {
    const luoshuIdx = (startIdx + i) % 9
    const star = LUOSHU_PATH[luoshuIdx]!
    // i=0 → 中宫(5)
    // i=1 → 乾(6)  i=2 → 兑(7)  i=3 → 艮(8)  i=4 → 坎(1)
    // i=5 → 坤(2)  i=6 → 震(3)  i=7 → 巽(4)  i=8 → 离(9)
    // 用后天文王八卦顺序
    const palaceMap: GONG_NUM[] = [5, 6, 7, 8, 1, 2, 3, 4, 9]
    pan[palaceMap[i]!] = star
  }
  return pan
}

/**
 * 流年紫白飞星
 *  - 流年入中 = (10 - 尾数) mod 9
 *  - 简化：(10 - 尾数)  mod 9, 若=0 则=9
 */
export function getLiuNianPan(year: number): Record<number, GONG_NUM> {
  // 流年紫白入中 = (10 - 年尾数) mod 9
  const last = year % 10
  const center = (10 - last) % 9
  const centerNum: GONG_NUM = center === 0 ? 9 : (center as GONG_NUM)
  const startIdx = LUOSHU_PATH.indexOf(centerNum)
  const pan: Record<number, GONG_NUM> = {}
  for (let i = 0; i < 9; i++) {
    const luoshuIdx = (startIdx + i) % 9
    const star = LUOSHU_PATH[luoshuIdx]!
    const palaceMap: GONG_NUM[] = [5, 6, 7, 8, 1, 2, 3, 4, 9]
    pan[palaceMap[i]!] = star
  }
  return pan
}

export interface XuanKongResult {
  year: number
  yun: { yuan: '上' | '中' | '下'; num: GONG_NUM; desc: string }
  yunPan: Record<number, GONG_NUM>
  liuNianPan: Record<number, GONG_NUM>
  /** 流年方位吉凶 */
  directions: Array<{
    dir: string
    star: GONG_NUM
    starName: string
    level: '大吉' | '吉' | '平' | '凶' | '大凶'
    advice: string
  }>
  /** 整体建议 */
  summary: string
  /** 当运 5 事 */
  fiveTips: string[]
  /** 每月运势 12 */
  monthly: Array<{ month: number; star: GONG_NUM; level: string; advice: string }>
}

/**
 * 完整排盘
 */
export function calcXuanKong(
  year: number,
  _month: number,
  _day: number,
  _hour: number,
): XuanKongResult {
  const yun = getYun(year)
  const yunPan = getYunPan(yun.num)
  const liuNianPan = getLiuNianPan(year)

  // 八方位吉凶
  const dirKeys: Array<{ pos: number; dir: string }> = [
    { pos: 1, dir: '正北' },
    { pos: 2, dir: '西南' },
    { pos: 3, dir: '正东' },
    { pos: 4, dir: '东南' },
    { pos: 5, dir: '中央' },
    { pos: 6, dir: '西北' },
    { pos: 7, dir: '正西' },
    { pos: 8, dir: '东北' },
    { pos: 9, dir: '正南' },
  ]
  const directions = dirKeys.map(({ pos, dir }) => {
    const star = liuNianPan[pos]!
    const level = _starLevel(star)
    return {
      dir,
      star,
      starName: GONG_NAMES_9[star - 1]!,
      level,
      advice: _advice(star, level, dir),
    }
  })

  // 12 月运势
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    // 简化：月紫白 = (年紫白 + 月序) mod 9
    const star = ((liuNianPan[5]! + m - 1) % 9 || 9) as GONG_NUM
    const level = _starLevel(star)
    return {
      month: m,
      star,
      level: _levelText(level),
      advice: _monthAdvice(m, star, level),
    }
  })

  // 5 事
  const fiveTips = [_tip1(yun), _tip2(directions), _tip3(year), _tip4(directions), _tip5(monthly)]

  return {
    year,
    yun,
    yunPan,
    liuNianPan,
    directions,
    summary: `${year}年${yun.yuan}元${yun.num}运 · ${yun.desc}。流年入中${liuNianPan[5]!}（${GONG_NAMES_9[liuNianPan[5]! - 1]}），以${_starLevel(liuNianPan[5]!)}为主调。`,
    fiveTips,
    monthly,
  }
}

function _starLevel(s: GONG_NUM): '大吉' | '吉' | '平' | '凶' | '大凶' {
  if (s === 1 || s === 8 || s === 9) return '大吉'
  if (s === 4 || s === 6) return '吉'
  if (s === 3 || s === 7) return '平'
  if (s === 5 || s === 2) return s === 2 ? '大凶' : '大凶'
  return '平'
}

function _levelText(l: '大吉' | '吉' | '平' | '凶' | '大凶'): string {
  return l
}

function _advice(star: GONG_NUM, level: string, dir: string): string {
  if (level === '大吉') return `${dir}方见${GONG_NAMES_9[star - 1]}大吉 · 可动土开门 · 宜求财谋职`
  if (level === '吉') return `${dir}方见${GONG_NAMES_9[star - 1]}为吉 · 可布置 · 宜静守`
  if (level === '平') return `${dir}方见${GONG_NAMES_9[star - 1]}平和 · 不宜大动`
  if (level === '凶') return `${dir}方见${GONG_NAMES_9[star - 1]}为凶 · 切忌动土`
  return `${dir}方见${GONG_NAMES_9[star - 1]}大凶 · 需安符镇煞`
}

function _monthAdvice(m: number, star: GONG_NUM, level: string): string {
  return `${m}月${GONG_NAMES_9[star - 1]}（${level}）：${_advice(star, level, '此月')}`
}

function _tip1(y: XuanKongResult['yun']): string {
  if (y.yuan === '下' && y.num === 8)
    return '下元 8 运 · 八白左辅当运 · 2004-2023 财星主导 · 适合置业'
  if (y.yuan === '下' && y.num === 9)
    return '下元 9 运 · 九紫右弼当运 · 2024-2043 喜事主导 · 桃花科甲'
  if (y.yuan === '中' && y.num === 6) return '中元 6 运 · 六白武曲当运 · 偏财驿马 · 适合远行'
  return `${y.yuan}元${y.num}运主导 · ${y.desc}`
}

function _tip2(dirs: XuanKongResult['directions']): string {
  const best = dirs
    .filter((d) => d.level === '大吉')
    .map((d) => d.dir)
    .join('、')
  return `大吉方位：${best || '无'} · 开门安床首选`
}

function _tip3(year: number): string {
  const tail = year % 12
  const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
  return `本年生肖：${animals[tail]} · 太岁方位需避`
}

function _tip4(dirs: XuanKongResult['directions']): string {
  const bad = dirs
    .filter((d) => d.level === '大凶' || d.level === '凶')
    .map((d) => d.dir)
    .join('、')
  return `凶煞方位：${bad || '无'} · 切忌动土开门`
}

function _tip5(months: XuanKongResult['monthly']): string {
  const best = months
    .filter((m) => m.level === '大吉')
    .map((m) => `${m.month}月`)
    .join('、')
  const worst = months
    .filter((m) => m.level === '大凶')
    .map((m) => `${m.month}月`)
    .join('、')
  return `月运大吉：${best || '无'} · 月运大凶：${worst || '无'}`
}
