/**
 * 玄枢 MISTVERSE · 五行深化
 *
 *  - 十二长生（长生/沐浴/冠带/临官/帝旺/衰/病/死/墓/绝/胎/养）
 *  - 缺失补救（颜色/方位/食物/职业/数字）
 *  - 性格特征
 *  - 养生要诀
 *  - 关系矩阵（生我 / 我生 / 克我 / 我克 / 同我）
 */

import type { Wuxing } from './wuxing'

// ============ 十二长生（阳顺阴逆） ============
export type Changsheng = '长生' | '沐浴' | '冠带' | '临官' | '帝旺' | '衰' | '病' | '死' | '墓' | '绝' | '胎' | '养'

const CHANGSHENG_NAMES: Changsheng[] = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']
type DiZhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥'

// 阳干：甲丙戊庚壬 顺行
// 阴干：乙丁己辛癸 逆行
// 起长生：甲/乙 始于 亥
//         丙/丁 始于 寅
//         戊/己 始于 寅
//         庚/辛 始于 巳
//         壬/癸 始于 申
const YANG_START: Record<string, DiZhi> = {
  甲: '亥', 丙: '寅', 戊: '寅', 庚: '巳', 壬: '申',
}
const YIN_START: Record<string, DiZhi> = {
  乙: '亥', 丁: '寅', 己: '寅', 辛: '巳', 癸: '申',
}

const ZHI_LIST: DiZhi[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export function changsheng(gan: string, zhi: DiZhi): Changsheng {
  const isYang = ['甲', '丙', '戊', '庚', '壬'].includes(gan)
  const start = isYang ? YANG_START[gan] : YIN_START[gan]
  if (!start) return '胎'
  const startIdx = ZHI_LIST.indexOf(start)
  const targetIdx = ZHI_LIST.indexOf(zhi)
  let step: number
  if (isYang) {
    step = ((targetIdx - startIdx) % 12 + 12) % 12
  } else {
    step = ((startIdx - targetIdx) % 12 + 12) % 12
  }
  return CHANGSHENG_NAMES[step]
}

const CS_DESC: Record<Changsheng, string> = {
  '长生': '生机初发，欣欣向荣',
  '沐浴': '桃花沐浴，情感萌动',
  '冠带': '初显才华，仪表堂堂',
  '临官': '出仕临位，担当大任',
  '帝旺': '气势鼎盛，巅峰状态',
  '衰': '气数渐衰，宜守不宜攻',
  '病': '虚弱不安，调养为宜',
  '死': '气数已尽，另辟蹊径',
  '墓': '入库收藏，厚积薄发',
  '绝': '生机断绝，绝处逢生',
  '胎': '受胎成形，孕育希望',
  '养': '蓄养待时，韬光养晦',
}

export function changshengDesc(cs: Changsheng): string {
  return CS_DESC[cs]
}

// ============ 缺失补救 ============
export interface WujiBuji {
  color: string[]
  direction: string
  season: string
  food: string[]
  career: string[]
  number: number
  body: string[]
  deco: string
}

const BUJI: Record<Wuxing, WujiBuji> = {
  mu: {
    color: ['青', '绿', '翠'],
    direction: '东方',
    season: '春',
    food: ['酸味食物', '绿色蔬菜', '菠菜、青菜', '茶叶'],
    career: ['文化教育', '出版', '设计', '中医药', '木业', '园艺'],
    number: 3,
    body: ['肝', '胆', '眼睛', '筋'],
    deco: '家中东方摆绿植，着青衣青饰',
  },
  huo: {
    color: ['红', '紫', '橙'],
    direction: '南方',
    season: '夏',
    food: ['苦味食物', '红色果蔬', '苦瓜、红枣', '红豆'],
    career: ['IT', '新能源', '餐饮', '演艺', '广告', '电子'],
    number: 7,
    body: ['心', '小肠', '舌', '血脉'],
    deco: '南方挂红灯笼，卧室南方用暖光',
  },
  tu: {
    color: ['黄', '棕', '咖'],
    direction: '中央',
    season: '长夏',
    food: ['甘味食物', '黄色谷物', '小米、玉米', '山药'],
    career: ['房地产', '建筑', '农业', '陶瓷', '矿业', '咨询'],
    number: 5,
    body: ['脾', '胃', '唇', '肌肉'],
    deco: '居中位置摆陶瓷，居所用黄系',
  },
  jin: {
    color: ['白', '银', '金'],
    direction: '西方',
    season: '秋',
    food: ['辛味食物', '白色食物', '白萝卜、梨', '银耳'],
    career: ['金融', '银行', '证券', '五金', '机械', '军警'],
    number: 4,
    body: ['肺', '大肠', '鼻', '皮毛'],
    deco: '西方摆金属饰品，着白衣白饰',
  },
  shui: {
    color: ['黑', '蓝', '灰'],
    direction: '北方',
    season: '冬',
    food: ['咸味食物', '黑色食物', '黑豆、黑芝麻', '海带'],
    career: ['航海', '水产', '物流', '传媒', '哲学', '玄学'],
    number: 1,
    body: ['肾', '膀胱', '耳', '骨骼'],
    deco: '北方摆水景鱼缸，着黑蓝系',
  },
}

export function getBuji(wx: Wuxing): WujiBuji {
  return BUJI[wx]
}

// ============ 性格特征 ============
const XINGGE: Record<Wuxing, { strong: string; weak: string }> = {
  mu: {
    strong: '仁慈宽厚，富有生机与同理心；擅长成长型思维，好学上进，重视人际和谐。',
    weak: '犹豫不决，优柔寡断；易被情绪左右，缺乏主见与决断。',
  },
  huo: {
    strong: '热情开朗，思维活跃；具感染力与领导魅力，行动力强。',
    weak: '急躁冲动，情绪化；好胜心强，欠深思熟虑。',
  },
  tu: {
    strong: '稳重诚信，包容大度；中正平和，善于协调，可托付大事。',
    weak: '固执保守，反应迟缓；过于依赖稳定，难适应变化。',
  },
  jin: {
    strong: '刚毅果决，重义守诺；执行力强，注重效率与秩序。',
    weak: '刻板冷漠，言辞犀利；过刚易折，人际欠柔。',
  },
  shui: {
    strong: '智慧深沉，善谋善断；灵活圆通，适应力强，富哲思。',
    weak: '多疑善变，城府过深；易消极内敛，行动力弱。',
  },
}

export function xingge(wx: Wuxing, isStrong: boolean): string {
  return isStrong ? XINGGE[wx].strong : XINGGE[wx].weak
}

// ============ 养生要诀 ============
const YANGSHENG: Record<Wuxing, { season: string; emotion: string; food: string; exercise: string; taboo: string }> = {
  mu: {
    season: '春养肝，宜早睡早起',
    emotion: '戒怒，常散步舒展',
    food: '多酸少辛，宜菠菜、芹菜',
    exercise: '八段锦、瑜伽、伸展',
    taboo: '久视伤血，避免熬夜',
  },
  huo: {
    season: '夏养心，宜夜卧早起',
    emotion: '戒躁，保持静心',
    food: '多苦多红，宜苦瓜、西红柿',
    exercise: '晨起慢跑、心率有氧',
    taboo: '过汗伤阳，避免烈日',
  },
  tu: {
    season: '长夏养脾，宜节制饮食',
    emotion: '戒思虑过度',
    food: '多甘多黄，宜山药、小米',
    exercise: '八段锦、太极',
    taboo: '忌生冷油腻',
  },
  jin: {
    season: '秋养肺，宜早卧早起',
    emotion: '戒悲，常深呼吸',
    food: '多辛多白，宜白萝卜、梨',
    exercise: '腹式呼吸、登山',
    taboo: '燥热伤津，避辛辣',
  },
  shui: {
    season: '冬养肾，宜早卧晚起',
    emotion: '戒惊恐，固精养神',
    food: '多咸多黑，宜黑豆、海带',
    exercise: '散步、站桩、暖足',
    taboo: '寒凉伤阳，忌冰冷',
  },
}

export function yangsheng(wx: Wuxing) {
  return YANGSHENG[wx]
}

// ============ 关系矩阵 ============
export interface WuxingMatrix {
  shengWo: Wuxing   // 生我 (reverse sheng)
  woSheng: Wuxing   // 我生
  keWo: Wuxing      // 克我 (reverse ke)
  woKe: Wuxing      // 我克
  tong: Wuxing      // 同我
}

import { SHENG, KE } from './wuxing'

// 找到"生我"和"克我"
const REVERSE_SHENG: Record<Wuxing, Wuxing> = {
  mu: 'shui', huo: 'mu', tu: 'huo', jin: 'tu', shui: 'jin',
}
const REVERSE_KE: Record<Wuxing, Wuxing> = {
  mu: 'jin', huo: 'shui', tu: 'mu', jin: 'huo', shui: 'tu',
}

export function matrix(wx: Wuxing): WuxingMatrix {
  return {
    shengWo: REVERSE_SHENG[wx],  // 谁生我
    woSheng: SHENG[wx],          // 我生谁
    keWo: REVERSE_KE[wx],        // 谁克我
    woKe: KE[wx],                // 我克谁
    tong: wx,                    // 同我
  }
}

// 完整关系矩阵
export function relationMatrix(wx: Wuxing): { name: string, target: Wuxing, desc: string }[] {
  return [
    { name: '我生', target: SHENG[wx], desc: '我付出，耗我之气' },
    { name: '生我', target: REVERSE_SHENG[wx], desc: '得扶助，吉' },
    { name: '我克', target: KE[wx], desc: '我制约，为我所用' },
    { name: '克我', target: REVERSE_KE[wx], desc: '受压制，需化解' },
    { name: '同我', target: wx, desc: '比和，助我之力' },
  ]
}

// ============ 旺衰自查（基于五行数量） ============
export type WangShuaiLevel = '极旺' | '偏旺' | '中和' | '偏弱' | '极弱'

/**
 * 给定五行计数（mu/huo/tu/jin/shui），计算该行的旺衰
 * - 数量 ≥ 4 → 极旺
 * - 数量 = 3 → 偏旺
 * - 数量 = 2 → 中和
 * - 数量 = 1 → 偏弱
 * - 数量 = 0 → 极弱
 */
export function wangshuaiOf(count: number): WangShuaiLevel {
  if (count >= 4) return '极旺'
  if (count === 3) return '偏旺'
  if (count === 2) return '中和'
  if (count === 1) return '偏弱'
  return '极弱'
}

/**
 * 根据某行五行的数量分布（已知总=8，四柱地支+天干），
 * 给出该行的旺衰 + 用神 + 喜神 + 忌神
 * - 极旺 / 偏旺：宜克泄耗（用神 = 克我）；喜 = 我生、被克；忌 = 生我、同类
 * - 极弱 / 偏弱：宜生扶（用神 = 生我）；喜 = 生我、同类；忌 = 克我、我生
 * - 中和：以"被生"为用神（轻微补益）；喜 = 生我；忌 = 克我
 */
export function wangshuai(counts: Record<Wuxing, number>, self: Wuxing): {
  level: WangShuaiLevel
  score: number        // 0-100，等价 strength
  yong: Wuxing         // 用神
  xi: Wuxing[]         // 喜神
  ji: Wuxing[]         // 忌神
  desc: string
  advice: string[]
} {
  const count = counts[self]
  const level = wangshuaiOf(count)
  // 折算 strength 评分：极旺 85 / 偏旺 65 / 中和 50 / 偏弱 35 / 极弱 15
  const scoreMap: Record<WangShuaiLevel, number> = {
    '极旺': 85, '偏旺': 65, '中和': 50, '偏弱': 35, '极弱': 15,
  }
  const score = scoreMap[level]
  const shengWo = REVERSE_SHENG[self]  // 谁生我
  const keWo = REVERSE_KE[self]        // 谁克我
  const woSheng = SHENG[self]          // 我生
  const woKe = KE[self]                // 我克

  let yong: Wuxing
  let xi: Wuxing[] = []
  let ji: Wuxing[] = []
  let desc = ''
  const selfName = self === 'mu' ? '木' : self === 'huo' ? '火' : self === 'tu' ? '土' : self === 'jin' ? '金' : '水'
  const wxName = (w: Wuxing) => w === 'mu' ? '木' : w === 'huo' ? '火' : w === 'tu' ? '土' : w === 'jin' ? '金' : '水'
  if (level === '极旺' || level === '偏旺') {
    yong = keWo
    xi = [woSheng, woKe]
    ji = [shengWo, self]
    desc = `${selfName}气${level === '极旺' ? '过盛' : '偏盛'}，需以${wxName(keWo)}克制泄化`
  } else if (level === '极弱' || level === '偏弱') {
    yong = shengWo
    xi = [shengWo, self]
    ji = [keWo, woSheng]
    desc = `${selfName}气${level === '极弱' ? '虚极' : '偏弱'}，需${wxName(shengWo)}生扶同类帮身`
  } else {
    yong = shengWo
    xi = [shengWo]
    ji = [keWo]
    desc = '五行中和，以生扶为用'
  }

  // 实用建议
  const bj = BUJI[yong]
  const advice: string[] = []
  // 居所颜色
  advice.push(`用神为${wxName(yong)}，日常穿着/居所可多用${bj.color.join('、')}系`)
  // 方位
  advice.push(`居住/办公朝${bj.direction}为佳`)
  // 食物
  advice.push(`饮食多${bj.food[0]}${bj.food[1] ? '、'+bj.food[1] : ''}`)
  // 职业
  advice.push(`适合职业方向：${bj.career.slice(0, 3).join('、')}`)
  // 数字
  advice.push(`吉利数字：${bj.number} 及 ${bj.number + 5}`)
  if (level === '极旺' || level === '极弱') {
    advice.push(`五行${level}，建议每季度做一次调整，避免长期失衡`)
  }
  return { level, score, yong, xi, ji, desc, advice }
}
