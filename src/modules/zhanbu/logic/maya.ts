/**
 * 玛雅历 · Tzolkin 卓尔金历
 *
 * 玛雅历由 260 天组成（13 月 × 20 日）：
 *  - 20 个日主（太阳图腾 Tzolk'in）
 *  - 13 个数字（1-13）
 *  - 260 种组合
 *
 * 简化算法（公历 → 玛雅日）：
 *  - 用相对参考日（2012-12-21 = 4 Ahau）做差
 *  - 差值 mod 260 = 玛雅日序号
 *
 * 推算 Kin 数字和太阳图腾
 */

export interface MayaTzolkin {
  kin: number // 1-260
  tone: number // 1-13
  seal: MayaSeal // 20 日主
  sealName: string // 中文名
  sealGlyph: string // 图腾
  sealMeaning: string
  sealColor: string
  sealElement: '火' | '土' | '风' | '水'
  sealPower: string // 本质力量
  sealAction: string // 行动
  sealEssence: string // 本质
  toneName: string // 数字调性名
  toneMeaning: string
  toneColor: string
  /** 5 维评分 */
  scores: {
    career: number
    wealth: number
    relationship: number
    health: number
    social: number
  }
  summary: string
  wavespell: MayaSeal[] // 13 天一个波符
  oracle: string
}

export type MayaSeal =
  | '红龙'
  | '白风'
  | '蓝夜'
  | '黄种子'
  | '红蛇'
  | '白世界桥'
  | '蓝手'
  | '黄星'
  | '红月'
  | '白狗'
  | '蓝猴'
  | '黄人'
  | '红天行者'
  | '白巫师'
  | '蓝鹰'
  | '黄战士'
  | '红地球'
  | '白镜'
  | '蓝风暴'
  | '黄太阳'

export const MAYA_SEAL_META: Record<
  MayaSeal,
  {
    glyph: string
    meaning: string
    power: string
    action: string
    essence: string
    color: string
    element: '火' | '土' | '风' | '水'
    desc: string
  }
> = {
  红龙: {
    glyph: '🐉',
    meaning: '滋养 · 起源 · 母性',
    power: '出生',
    action: '滋养',
    essence: '本源',
    color: '#C8302A',
    element: '水',
    desc: '红龙 · 宇宙起源之水 · 万物之母',
  },
  白风: {
    glyph: '💨',
    meaning: '沟通 · 灵息 · 传递',
    power: '呼吸',
    action: '传递',
    essence: '灵息',
    color: '#E8E4D8',
    element: '风',
    desc: '白风 · 神圣呼吸 · 大地之精神',
  },
  蓝夜: {
    glyph: '🌙',
    meaning: '丰盛 · 梦境 · 内在',
    power: '梦境',
    action: '内化',
    essence: '丰盛',
    color: '#1B3A5C',
    element: '水',
    desc: '蓝夜 · 内在丰盛 · 梦境智慧',
  },
  黄种子: {
    glyph: '🌱',
    meaning: '目标 · 觉知 · 开花',
    power: '觉知',
    action: '瞄准',
    essence: '开花',
    color: '#D4AF37',
    element: '土',
    desc: '黄种子 · 觉知开花 · 目标清晰',
  },
  红蛇: {
    glyph: '🐍',
    meaning: '生命力 · 生存 · 激情',
    power: '生命力',
    action: '生存',
    essence: '本能',
    color: '#C8302A',
    element: '火',
    desc: '红蛇 · 生命之火 · 生存本能',
  },
  白世界桥: {
    glyph: '🌉',
    meaning: '平衡 · 机会 · 死亡',
    power: '平等',
    action: '连接',
    essence: '机遇',
    color: '#E8E4D8',
    element: '风',
    desc: '白世界桥 · 阴阳平衡 · 机会之门',
  },
  蓝手: {
    glyph: '✋',
    meaning: '实现 · 治愈 · 知晓',
    power: '知晓',
    action: '治愈',
    essence: '实现',
    color: '#1B3A5C',
    element: '水',
    desc: '蓝手 · 治愈之手 · 实现与知晓',
  },
  黄星: {
    glyph: '⭐',
    meaning: '优雅 · 美 · 艺术',
    power: '美',
    action: '美化',
    essence: '优雅',
    color: '#D4AF37',
    element: '土',
    desc: '黄星 · 美的优雅 · 艺术光芒',
  },
  红月: {
    glyph: '🌕',
    meaning: '净化 · 流动 · 宇宙水',
    power: '净化',
    action: '流动',
    essence: '宇宙水',
    color: '#C8302A',
    element: '水',
    desc: '红月 · 宇宙净化之水 · 流动之源',
  },
  白狗: {
    glyph: '🐕',
    meaning: '爱 · 忠诚 · 心',
    power: '爱',
    action: '守护',
    essence: '忠诚',
    color: '#E8E4D8',
    element: '风',
    desc: '白狗 · 无条件之爱 · 忠诚之心',
  },
  蓝猴: {
    glyph: '🐒',
    meaning: '游戏 · 幻术 · 神圣',
    power: '幻术',
    action: '游戏',
    essence: '神圣',
    color: '#1B3A5C',
    element: '水',
    desc: '蓝猴 · 神圣之戏 · 幻术游戏',
  },
  黄人: {
    glyph: '🧑',
    meaning: '自由意志 · 智慧 · 影响',
    power: '自由意志',
    action: '影响',
    essence: '智慧',
    color: '#D4AF37',
    element: '土',
    desc: '黄人 · 自由意志 · 智慧人类',
  },
  红天行者: {
    glyph: '🚀',
    meaning: '探索 · 空间 · 觉醒',
    power: '觉醒',
    action: '探索',
    essence: '空间',
    color: '#C8302A',
    element: '风',
    desc: '红天行者 · 空间探索 · 觉醒之路',
  },
  白巫师: {
    glyph: '🧙',
    meaning: '永恒 · 魅力 · 接收',
    power: '永恒',
    action: '魅惑',
    essence: '接收',
    color: '#E8E4D8',
    element: '风',
    desc: '白巫师 · 永恒之魅 · 神圣接收',
  },
  蓝鹰: {
    glyph: '🦅',
    meaning: '视野 · 创造 · 心智',
    power: '视野',
    action: '创造',
    essence: '心智',
    color: '#1B3A5C',
    element: '火',
    desc: '蓝鹰 · 飞越视野 · 心智创造',
  },
  黄战士: {
    glyph: '⚔️',
    meaning: '勇气 · 才智 · 提问',
    power: '才智',
    action: '质问',
    essence: '勇敢',
    color: '#D4AF37',
    element: '土',
    desc: '黄战士 · 智能之勇 · 提问之力',
  },
  红地球: {
    glyph: '🌍',
    meaning: '进化 · 同步 · 航行',
    power: '航行',
    action: '进化',
    essence: '同步',
    color: '#C8302A',
    element: '土',
    desc: '红地球 · 大地进化 · 同步航行',
  },
  白镜: {
    glyph: '🪞',
    meaning: '反射 · 秩序 · 无限',
    power: '无限',
    action: '反射',
    essence: '秩序',
    color: '#E8E4D8',
    element: '风',
    desc: '白镜 · 无限反射 · 宇宙秩序',
  },
  蓝风暴: {
    glyph: '⚡',
    meaning: '催化 · 能量 · 自生',
    power: '自生',
    action: '催化',
    essence: '能量',
    color: '#1B3A5C',
    element: '水',
    desc: '蓝风暴 · 自生之能 · 催化变革',
  },
  黄太阳: {
    glyph: '☀️',
    meaning: '启蒙 · 存在 · 自由',
    power: '自由',
    action: '启蒙',
    essence: '存在',
    color: '#D4AF37',
    element: '火',
    desc: '黄太阳 · 启蒙之光 · 存在之自由',
  },
}

const TONE_META: Array<{ tone: number; name: string; meaning: string; color: string }> = [
  { tone: 1, name: '磁性', meaning: '目的 · 吸引 · 统合', color: '#C8302A' },
  { tone: 2, name: '月亮', meaning: '挑战 · 极性 · 稳定', color: '#E8E4D8' },
  { tone: 3, name: '电', meaning: '激活 · 服务 · 连接', color: '#C8302A' },
  { tone: 4, name: '自我', meaning: '形式 · 测量 · 稳定', color: '#D4AF37' },
  { tone: 5, name: '倍增', meaning: '命令 · 中心 · 辐射', color: '#1B3A5C' },
  { tone: 6, name: '韵律', meaning: '平衡 · 组织 · 等分', color: '#5B3A8E' },
  { tone: 7, name: '共振', meaning: '调和 · 通道 · 灵感', color: '#4FAE6F' },
  { tone: 8, name: '银河', meaning: '和谐 · 模型 · 塑造', color: '#E8E4D8' },
  { tone: 9, name: '太阳', meaning: '意图 · 脉冲 · 实现', color: '#D4AF37' },
  { tone: 10, name: '行星', meaning: '显现 · 完美 · 创造', color: '#A87C4F' },
  { tone: 11, name: '光谱', meaning: '释放 · 解脱 · 净化', color: '#5B3A8E' },
  { tone: 12, name: '水晶', meaning: '合作 · 普遍化 · 奉献', color: '#1B3A5C' },
  { tone: 13, name: '宇宙', meaning: '超越 · 存在 · 玄妙', color: '#8B1F1A' },
]

const SEALS: MayaSeal[] = [
  '红龙',
  '白风',
  '蓝夜',
  '黄种子',
  '红蛇',
  '白世界桥',
  '蓝手',
  '黄星',
  '红月',
  '白狗',
  '蓝猴',
  '黄人',
  '红天行者',
  '白巫师',
  '蓝鹰',
  '黄战士',
  '红地球',
  '白镜',
  '蓝风暴',
  '黄太阳',
]

const REFERENCE_DATE = new Date(Date.UTC(2012, 11, 21)) // 2012-12-21 = 4 Ahau（Kin 84）
const REFERENCE_KIN = 84 // 红月 · 4 月亮调性（按 13×20+4 推算）

/**
 * 公历 → 玛雅 Kin
 */
export function calcMaya(year: number, month: number, day: number): MayaTzolkin {
  const target = new Date(Date.UTC(year, month - 1, day))
  const diffDays = Math.floor((target.getTime() - REFERENCE_DATE.getTime()) / 86400000)
  // 玛雅历为循环历：260 天一循环
  // (REFERENCE_KIN + diffDays) mod 260
  const kin = ((((REFERENCE_KIN - 1 + diffDays) % 260) + 260) % 260) + 1

  const tone = ((kin - 1) % 13) + 1
  const sealIdx = (kin - 1) % 20
  const seal = SEALS[sealIdx]!
  const sealMeta = MAYA_SEAL_META[seal]!
  const toneMeta = TONE_META[tone - 1]!

  // 13 天波符
  const wavespellStart = kin - (tone - 1)
  const wavespell: MayaSeal[] = []
  for (let i = 0; i < 13; i++) {
    const k = wavespellStart + i
    const idx = (k - 1) % 20
    wavespell.push(SEALS[(idx + 20) % 20]!)
  }

  // 5 维评分（基于 Kin 数字 + Seal 元素）
  const baseScore = (kin * 7 + sealIdx * 13) % 71
  const elementBoost = sealMeta.element === '水' ? 10 : sealMeta.element === '火' ? 8 : 5
  const scores = {
    career: 30 + baseScore + elementBoost,
    wealth: 30 + ((kin * 11 + sealIdx * 17) % 71) + elementBoost,
    relationship: 30 + ((kin * 13 + sealIdx * 19) % 71) + (sealMeta.element === '水' ? 15 : 5),
    health: 30 + ((kin * 17 + sealIdx * 23) % 71) + (sealMeta.element === '火' ? 12 : 5),
    social: 30 + ((kin * 19 + sealIdx * 29) % 71) + 5,
  }

  return {
    kin,
    tone,
    seal,
    sealName: seal,
    sealGlyph: sealMeta.glyph,
    sealMeaning: sealMeta.meaning,
    sealColor: sealMeta.color,
    sealElement: sealMeta.element,
    sealPower: sealMeta.power,
    sealAction: sealMeta.action,
    sealEssence: sealMeta.essence,
    toneName: toneMeta.name,
    toneMeaning: toneMeta.meaning,
    toneColor: toneMeta.color,
    scores,
    summary: `Kin ${kin} · ${tone} ${toneMeta.name} · ${seal}（${sealMeta.meaning}）`,
    wavespell,
    oracle: `${kin}号玛雅日 · ${tone}调性${toneMeta.meaning} · ${seal}${sealMeta.desc}。本日的指引是「${sealMeta.action}」，本原是「${sealMeta.essence}」，力量是「${sealMeta.power}」。`,
  }
}
