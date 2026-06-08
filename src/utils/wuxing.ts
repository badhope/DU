/**
 * 五行系统
 * 金 木 水 火 土
 * 生：木→火→土→金→水→木
 * 克：木→土→水→火→金→木
 */

export type Wuxing = 'jin' | 'mu' | 'shui' | 'huo' | 'tu'

export interface WuxingMeta {
  key: Wuxing
  name: string // 中文
  pinyin: string
  symbol: string // 符号
  color: string // 主色
  colorHex: string // hex 用于 canvas/svg
  gradient: string // 渐变 CSS
  textColor: string // 在该色块上的文字色
  season: string // 对应季节
  direction: string // 对应方位
  organ: string // 对应脏器
  emotion: string // 对应情志
  virtue: string // 对应德
  desc: string // 描述
}

export const WUXING_META: Record<Wuxing, WuxingMeta> = {
  jin: {
    key: 'jin',
    name: '金',
    pinyin: 'jīn',
    symbol: '⚝',
    color: '#E8E4D8',
    colorHex: '#E8E4D8',
    gradient: 'linear-gradient(135deg, #F5F1E8 0%, #C9C2A8 100%)',
    textColor: '#1F1F2B',
    season: '秋',
    direction: '西',
    organ: '肺 · 大肠',
    emotion: '悲',
    virtue: '义',
    desc: '金者，革也。肃杀之气，曰义曰刚。',
  },
  mu: {
    key: 'mu',
    name: '木',
    pinyin: 'mù',
    symbol: '☘',
    color: '#2F7D4F',
    colorHex: '#2F7D4F',
    gradient: 'linear-gradient(135deg, #4FAE6F 0%, #1F5A38 100%)',
    textColor: '#F5F1E8',
    season: '春',
    direction: '东',
    organ: '肝 · 胆',
    emotion: '怒',
    virtue: '仁',
    desc: '木者，冒也。生长之气，曰仁曰柔。',
  },
  shui: {
    key: 'shui',
    name: '水',
    pinyin: 'shuǐ',
    symbol: '☵',
    color: '#1B3A5C',
    colorHex: '#1B3A5C',
    gradient: 'linear-gradient(135deg, #2E5C8A 0%, #0D1E33 100%)',
    textColor: '#F5F1E8',
    season: '冬',
    direction: '北',
    organ: '肾 · 膀胱',
    emotion: '恐',
    virtue: '智',
    desc: '水者，润也。寒凉之气，曰智曰柔。',
  },
  huo: {
    key: 'huo',
    name: '火',
    pinyin: 'huǒ',
    symbol: '☲',
    color: '#C8302A',
    colorHex: '#C8302A',
    gradient: 'linear-gradient(135deg, #E04A3A 0%, #8B1F1A 100%)',
    textColor: '#F5F1E8',
    season: '夏',
    direction: '南',
    organ: '心 · 小肠',
    emotion: '喜',
    virtue: '礼',
    desc: '火者，燚也。炎上之气，曰礼曰明。',
  },
  tu: {
    key: 'tu',
    name: '土',
    pinyin: 'tǔ',
    symbol: '☷',
    color: '#A87C4F',
    colorHex: '#A87C4F',
    gradient: 'linear-gradient(135deg, #C9A06B 0%, #6E5230 100%)',
    textColor: '#F5F1E8',
    season: '长夏',
    direction: '中央',
    organ: '脾 · 胃',
    emotion: '思',
    virtue: '信',
    desc: '土者，吐也。生化之气，曰信曰厚。',
  },
}

export const WUXING_LIST: Wuxing[] = ['mu', 'huo', 'tu', 'jin', 'shui']
export const WUXING_CYCLE = ['木→火→土→金→水→木'] // 生

// 生：木生火、火生土、土生金、金生水、水生木
export const SHENG: Record<Wuxing, Wuxing> = {
  mu: 'huo',
  huo: 'tu',
  tu: 'jin',
  jin: 'shui',
  shui: 'mu',
}

// 克：木克土、土克水、水克火、火克金、金克木
export const KE: Record<Wuxing, Wuxing> = {
  mu: 'tu',
  tu: 'shui',
  shui: 'huo',
  huo: 'jin',
  jin: 'mu',
}

/** 判断 a 与 b 的关系：'sheng' 生 b / 'be-sheng' 被 b 生 / 'ke' 克 b / 'be-ke' 被 b 克 / 'tong' 同 */
export function wuxingRelation(
  a: Wuxing,
  b: Wuxing,
): 'sheng' | 'be-sheng' | 'ke' | 'be-ke' | 'tong' {
  if (a === b) return 'tong'
  if (SHENG[a] === b) return 'sheng' // a 生 b
  if (SHENG[b] === a) return 'be-sheng' // b 生 a (a 被生)
  if (KE[a] === b) return 'ke' // a 克 b
  return 'be-ke' // a 被克
}

export const RELATION_DESC: Record<string, string> = {
  sheng: '相生 · 滋养',
  'be-sheng': '被生 · 扶助',
  ke: '相克 · 制约',
  'be-ke': '被克 · 压力',
  tong: '比和 · 同气',
}
