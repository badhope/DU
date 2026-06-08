/**
 * 生命灵数 · 1-9 主命 + 11/22/33 表现数
 *
 * 核心算法：
 *  - 生命数 = 出生年月日各位数相加 → 归约到 1-9（或保留 11/22/33）
 *  - 表现数 = 出生月 + 日 → 归约
 *  - 灵魂数 = 出生日 → 归约
 *  - 命运数 = 出生年 + 月 + 日 → 归约
 *  - 心数 = 姓名全拼对应数字相加（简化：英文字母）
 *
 * 归约规则：连续相加至一位数（保留 11/22/33 大师数）
 */

export interface LifeNumber {
  lifePath: number     // 生命数 1-9, 11, 22, 33
  expression: number   // 表现数
  soulUrge: number     // 灵魂数
  destiny: number      // 命运数
  birthday: number     // 生日数
}

const MASTER_NUMBERS = [11, 22, 33]

/**
 * 归约数字（保留大师数）
 */
function reduce(n: number, keepMaster: boolean = true): number {
  if (keepMaster && MASTER_NUMBERS.includes(n)) return n
  let s = n
  while (s >= 10) {
    if (keepMaster && MASTER_NUMBERS.includes(s)) return s
    let sum = 0
    let t = s
    while (t > 0) { sum += t % 10; t = Math.floor(t / 10) }
    s = sum
  }
  return s
}

export function calcLifeNumber(year: number, month: number, day: number): LifeNumber {
  const yReduce = reduce(year, true)
  const mReduce = reduce(month, true)
  const dReduce = reduce(day, true)
  const lifePath = reduce(yReduce + mReduce + dReduce, true)
  const expression = reduce(mReduce + dReduce, true)
  const soulUrge = reduce(dReduce, true)
  const destiny = reduce(yReduce + mReduce + dReduce, true)

  return {
    lifePath,
    expression,
    soulUrge,
    destiny,
    birthday: dReduce,
  }
}

export interface NumberMeta {
  num: number
  name: string
  glyph: string
  color: string
  element: '金' | '木' | '水' | '火' | '土'
  planet: string       // 守护星
  virtue: string       // 德性
  flaw: string         // 缺陷
  career: string       // 适合职业
  relationship: string // 婚恋特征
  health: string       // 健康注意
  luckyColor: string
  luckyDay: string
  description: string
}

export const NUMBER_META: Record<number, NumberMeta> = {
  1: {
    num: 1, name: '开拓者', glyph: '①', color: '#C8302A', element: '火', planet: '太阳',
    virtue: '独立 · 领导 · 开创', flaw: '独断 · 自负',
    career: '领导者 · 创业 · 管理 · 独立工作室', relationship: '主动出击 · 强势吸引',
    health: '注意心脏 · 血压 · 头部',
    luckyColor: '红色 · 金色', luckyDay: '星期日',
    description: '1 是万物之始 · 太阳之数 · 代表领导力与开创精神。',
  },
  2: {
    num: 2, name: '协调者', glyph: '②', color: '#1B3A5C', element: '水', planet: '月亮',
    virtue: '合作 · 灵敏 · 外交', flaw: '犹豫 · 依赖',
    career: '外交 · 调解 · 中介 · 艺术合作', relationship: '温柔细致 · 善于倾听',
    health: '注意肠胃 · 情绪',
    luckyColor: '白色 · 银色', luckyDay: '星期一',
    description: '2 是阴阳之合 · 月亮之数 · 代表合作与协调。',
  },
  3: {
    num: 3, name: '表达者', glyph: '③', color: '#D4AF37', element: '木', planet: '木星',
    virtue: '创造 · 表达 · 乐观', flaw: '散漫 · 虚荣',
    career: '艺术 · 写作 · 表演 · 销售', relationship: '浪漫多情 · 魅力四射',
    health: '注意肝胆 · 咽喉',
    luckyColor: '黄色 · 紫色', luckyDay: '星期四',
    description: '3 是三才之华 · 木星之数 · 代表创造与表达。',
  },
  4: {
    num: 4, name: '建设者', glyph: '④', color: '#A87C4F', element: '土', planet: '天王星',
    virtue: '稳定 · 踏实 · 实际', flaw: '固执 · 保守',
    career: '工程 · 建筑 · 会计 · 法律', relationship: '忠诚可靠 · 不善浪漫',
    health: '注意骨骼 · 关节',
    luckyColor: '灰色 · 蓝色', luckyDay: '星期六',
    description: '4 是四象之基 · 天王星之数 · 代表稳定与建设。',
  },
  5: {
    num: 5, name: '自由者', glyph: '⑤', color: '#4FAE6F', element: '木', planet: '水星',
    virtue: '自由 · 适应 · 多才', flaw: '不稳定 · 放纵',
    career: '旅行 · 销售 · 媒体 · 自由职业', relationship: '多情 · 需空间',
    health: '注意神经 · 呼吸',
    luckyColor: '绿色 · 浅蓝', luckyDay: '星期五',
    description: '5 是五行之中 · 水星之数 · 代表自由与变化。',
  },
  6: {
    num: 6, name: '守护者', glyph: '⑥', color: '#E8E4D8', element: '金', planet: '金星',
    virtue: '责任 · 慈爱 · 艺术', flaw: '牺牲 · 控制',
    career: '教育 · 医疗 · 艺术 · 家庭', relationship: '深情守护 · 家庭为重',
    health: '注意心肺 · 皮肤',
    luckyColor: '粉色 · 蓝色', luckyDay: '星期五',
    description: '6 是六合之爱 · 金星之数 · 代表责任与守护。',
  },
  7: {
    num: 7, name: '探索者', glyph: '⑦', color: '#5B3A8E', element: '水', planet: '海王星',
    virtue: '智慧 · 灵性 · 探究', flaw: '孤僻 · 多疑',
    career: '研究 · 哲学 · 玄学 · 心理', relationship: '慢热 · 精神至上',
    health: '注意神经 · 失眠',
    luckyColor: '紫色 · 银灰', luckyDay: '星期一',
    description: '7 是七星之明 · 海王星之数 · 代表智慧与灵性。',
  },
  8: {
    num: 8, name: '成就者', glyph: '⑧', color: '#D4AF37', element: '土', planet: '土星',
    virtue: '权力 · 财富 · 平衡', flaw: '功利 · 压力',
    career: '金融 · 管理 · 地产 · 政治', relationship: '物质为基础 · 权力平衡',
    health: '注意脾胃 · 皮肤',
    luckyColor: '黑色 · 金色', luckyDay: '星期六',
    description: '8 是八卦之象 · 土星之数 · 代表权力与成就。',
  },
  9: {
    num: 9, name: '慈悲者', glyph: '⑨', color: '#8B1F1A', element: '火', planet: '火星',
    virtue: '博爱 · 智慧 · 完成', flaw: '多愁 · 极端',
    career: '慈善 · 艺术 · 疗愈 · 教育', relationship: '博爱无私 · 灵魂伴侣',
    health: '注意心脏 · 情绪',
    luckyColor: '红色 · 白色', luckyDay: '星期二',
    description: '9 是九宫之极 · 火星之数 · 代表慈悲与完成。',
  },
  11: {
    num: 11, name: '灵性大师', glyph: '⓫', color: '#5B3A8E', element: '水', planet: '月亮',
    virtue: '直觉 · 灵性 · 启发', flaw: '神经质 · 过度敏感',
    career: '灵性导师 · 艺术家 · 心理咨询', relationship: '灵性共鸣',
    health: '注意神经 · 失眠',
    luckyColor: '银白 · 紫色', luckyDay: '星期一',
    description: '11 是大师数 · 灵性直觉之数 · 1+1=2 但其振动独立。',
  },
  22: {
    num: 22, name: '建筑大师', glyph: '㉒', color: '#A87C4F', element: '土', planet: '土星',
    virtue: '实现 · 远见 · 创造', flaw: '压力 · 完美主义',
    career: '大建筑师 · 政治家 · 实业家', relationship: '稳定 · 远见',
    health: '注意脾胃',
    luckyColor: '深褐 · 金色', luckyDay: '星期六',
    description: '22 是大师数 · 理想实现之数 · 4 的振动但具 11 的灵性。',
  },
  33: {
    num: 33, name: '慈悲大师', glyph: '㉝', color: '#C8302A', element: '火', planet: '火星',
    virtue: '服务 · 慈爱 · 教导', flaw: '自我牺牲',
    career: '教师 · 灵性导师 · 治愈者', relationship: '无条件的爱',
    health: '注意心脏',
    luckyColor: '白色 · 红色', luckyDay: '星期二',
    description: '33 是大师数 · 慈悲服务之数 · 基督意识之振动。',
  },
}

export interface LifeNumberResult {
  number: LifeNumber
  primary: NumberMeta
  expressionMeta: NumberMeta
  soulMeta: NumberMeta
  destinyMeta: NumberMeta
  score: number
  summary: string
  /** 4 大领域建议 */
  advice: {
    career: string
    love: string
    health: string
    wealth: string
  }
  /** 9 年周期 */
  cycle: Array<{ year: number; cycle: '播种' | '生长' | '收获' | '完成' }>
}

const ADVICE: Record<number, LifeNumberResult['advice']> = {
  1: { career: '领导者 · 适合开创 · 独立作业', love: '主动表白 · 强磁场吸引', health: '注意心血管 · 多运动', wealth: '正财为主 · 不宜合伙' },
  2: { career: '合作型 · 协调能力 · 后勤支持', love: '温柔示爱 · 善于倾听', health: '注意肠胃 · 情绪疏导', wealth: '合作生财 · 副业为辅' },
  3: { career: '创意型 · 表达 · 艺术', love: '浪漫多情 · 甜言蜜语', health: '注意肝胆 · 咽喉', wealth: '因才艺聚财' },
  4: { career: '建设型 · 工程 · 实业', love: '稳重可靠 · 慢热持久', health: '注意骨骼 · 关节', wealth: '积少成多' },
  5: { career: '自由型 · 销售 · 媒体', love: '自由恋爱 · 需空间', health: '注意神经 · 呼吸', wealth: '流动中求财' },
  6: { career: '服务型 · 教育 · 医疗', love: '深情守护 · 家庭为重', health: '注意心肺 · 皮肤', wealth: '稳定积财' },
  7: { career: '研究型 · 灵性 · 哲学', love: '精神共鸣 · 慢热', health: '注意神经 · 失眠', wealth: '知识变现' },
  8: { career: '管理型 · 金融 · 政商', love: '务实关系 · 权力平衡', health: '注意脾胃 · 压力', wealth: '大财可期' },
  9: { career: '服务型 · 慈善 · 艺术', love: '博爱无私', health: '注意心脏', wealth: '因德聚财' },
  11: { career: '灵性导师 · 艺术', love: '灵性共鸣', health: '注意神经', wealth: '灵感变现' },
  22: { career: '大建筑 · 政治家', love: '稳定 · 远见', health: '注意脾胃', wealth: '宏大事业' },
  33: { career: '教师 · 治愈者', love: '无条件的爱', health: '注意心脏', wealth: '以服务聚财' },
}

export function fullLifeResult(year: number, month: number, day: number): LifeNumberResult {
  const num = calcLifeNumber(year, month, day)
  const primary = NUMBER_META[num.lifePath] || NUMBER_META[num.lifePath - 9] || NUMBER_META[1]
  const expressionMeta = NUMBER_META[num.expression] || NUMBER_META[1]
  const soulMeta = NUMBER_META[num.soulUrge] || NUMBER_META[1]
  const destinyMeta = NUMBER_META[num.destiny] || NUMBER_META[1]

  // 9 年周期
  const currentYear = new Date().getFullYear()
  const age = currentYear - year
  const cycleStart = age - (age % 9)
  const cycle: LifeNumberResult['cycle'] = []
  for (let i = 0; i < 9; i++) {
    const phase = i % 4
    cycle.push({
      year: year + cycleStart + i,
      cycle: phase === 0 ? '播种' : phase === 1 ? '生长' : phase === 2 ? '收获' : '完成',
    })
  }

  return {
    number: num,
    primary,
    expressionMeta,
    soulMeta,
    destinyMeta,
    score: 30 + (num.lifePath * 11) % 71,
    summary: `生命数 ${num.lifePath}（${primary.name}）· 表现数 ${num.expression}（${expressionMeta.name}）· 灵魂数 ${num.soulUrge} · 命运数 ${num.destiny}`,
    advice: ADVICE[num.lifePath] || ADVICE[1],
    cycle,
  }
}
