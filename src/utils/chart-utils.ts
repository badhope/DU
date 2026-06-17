/**
 * 渡 DU · 图表公共工具
 *
 * 提供所有可视化组件共享的工具函数：
 *  - 极坐标计算（圆盘/相位）
 *  - 路径构建（卦象/方阵）
 *  - 颜色混合（五行映射）
 *  - 动画/响应式尺寸
 */

/** 计算极坐标：中心 + 半径 + 角度(度数) → {x, y} */
export function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** SVG arc 路径 */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polar(cx, cy, r, endDeg)
  const end = polar(cx, cy, r, startDeg)
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

/** 圆环扇形路径（用于环形进度/五环图） */
export function ringSectorPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
): string {
  const a1 = polar(cx, cy, rOuter, endDeg)
  const a2 = polar(cx, cy, rOuter, startDeg)
  const b1 = polar(cx, cy, rInner, startDeg)
  const b2 = polar(cx, cy, rInner, endDeg)
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1
  return [
    `M ${a1.x.toFixed(2)} ${a1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${a2.x.toFixed(2)} ${a2.y.toFixed(2)}`,
    `L ${b1.x.toFixed(2)} ${b1.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${b2.x.toFixed(2)} ${b2.y.toFixed(2)}`,
    'Z',
  ].join(' ')
}

/** 12 星座顺序 */
export const ZODIAC_ORDER = [
  '白羊',
  '金牛',
  '双子',
  '巨蟹',
  '狮子',
  '处女',
  '天秤',
  '天蝎',
  '射手',
  '摩羯',
  '水瓶',
  '双鱼',
] as const

/** 12 地支顺序（用于命盘） */
export const DIZHI_ORDER = [
  '子',
  '丑',
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
] as const

/** 五行颜色（与 tokens.css 对齐） */
export const WUXING_COLOR = {
  jin: '#E8E4D8',
  mu: '#2F7D4F',
  shui: '#1B3A5C',
  huo: '#C8302A',
  tu: '#A87C4F',
} as const

/** 主题色 */
export const THEME = {
  bg: '#0A0A12',
  bg2: '#14141C',
  bg3: '#1F1F2B',
  fg: '#F5F1E8',
  fg2: '#B8B2A0',
  fg3: '#6B6655',
  zhu: '#C8302A',
  zhu2: '#E04A3A',
  liu: '#D4AF37',
  qing: '#1F4E4A',
  zi: '#5B3A8E',
  ji: '#2F7D4F',
  xiong: '#8B1F1A',
} as const

/** 吉凶判定颜色 */
export function levelColor(level: string): string {
  if (level === '大吉' || level === '上上') return THEME.liu
  if (level === '吉' || level === '上') return THEME.ji
  if (level === '平' || level === '中' || level === '中上等' || level === '中等') return THEME.fg2
  if (level === '凶' || level === '下' || level === '中下等') return THEME.zhu2
  if (level === '大凶' || level === '下下') return THEME.xiong
  return THEME.fg2
}

/** 标准化分数到 0-100 */
export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n))
}

/** SVG 唯一 id */
let _filterId = 0
export function uid(suffix?: string): string {
  const id = `c${++_filterId}`
  return suffix ? `${id}-${suffix}` : id
}
