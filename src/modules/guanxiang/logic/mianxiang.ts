/**
 * 玄枢 MISTVERSE · 面相分析
 *
 *  - 三停（早年/中年/晚年）
 *  - 五官（眉/眼/鼻/口/耳）
 *  - 12 宫（命宫/财帛/兄弟等）
 *  - 流年部位（12 年循环）
 *  - 五行形局（金/木/水/火/土 五形人）
 */

export const SAN_TING = [
  {
    name: '上停',
    part: '发际至眉',
    age: '15-30 岁',
    desc: '早年运势 · 父母祖业 · 智慧根基',
    element: '木' as const,
    score: 75,
  },
  {
    name: '中停',
    part: '眉至鼻准',
    age: '31-50 岁',
    desc: '中年运势 · 事业财禄 · 婚姻子嗣',
    element: '土' as const,
    score: 80,
  },
  {
    name: '下停',
    part: '鼻准至地阁',
    age: '51 岁后',
    desc: '晚年运势 · 子女积德 · 归宿之境',
    element: '水' as const,
    score: 70,
  },
]

export const WU_GUAN = [
  { name: '眉', wuxing: '木', desc: '为罗计星 · 主兄弟 · 居官辅贤 · 忌散乱逆生', fortune: 75 },
  { name: '眼', wuxing: '火', desc: '为太阳 · 主体性 · 心性智慧 · 忌红赤怒目', fortune: 80 },
  { name: '鼻', wuxing: '土', desc: '为财星 · 主财富 · 端直丰隆 · 忌尖削偏斜', fortune: 85 },
  { name: '口', wuxing: '金', desc: '为水星 · 主信用 · 言辞辩才 · 忌小薄反掀', fortune: 70 },
  { name: '耳', wuxing: '水', desc: '为金星 · 主根基 · 智慧寿元 · 忌轮飞廓反', fortune: 78 },
]

export const SHI_ER_GONG = [
  { name: '命宫', pos: '两眉之间', desc: '主命运根基 · 宜光润无痕' },
  { name: '财帛宫', pos: '鼻准', desc: '主财富收入 · 宜丰隆有气' },
  { name: '兄弟宫', pos: '眉头', desc: '主兄弟姐妹 · 宜清秀有神' },
  { name: '夫妻宫', pos: '鱼尾', desc: '主婚姻感情 · 宜平满光润' },
  { name: '子女宫', pos: '眼下', desc: '主子嗣多寡 · 宜丰厚有肉' },
  { name: '疾厄宫', pos: '山根', desc: '主健康安危 · 宜平满无破' },
  { name: '奴仆宫', pos: '地阁', desc: '主下属人际 · 宜圆满有肉' },
  { name: '父母宫', pos: '日月角', desc: '主父母缘份 · 宜高圆无破' },
  { name: '福德宫', pos: '天仓', desc: '主福德精神 · 宜丰满有气' },
  { name: '官禄宫', pos: '中正', desc: '主事业仕途 · 宜光润饱满' },
  { name: '田宅宫', pos: '眼胞', desc: '主家宅产业 · 宜丰厚有肉' },
  { name: '相貌宫', pos: '整面', desc: '主总体运势 · 宜端正有神' },
]

// ============ 12 流年部位（男左女右 / 或统一起始）============
// 传统面相 12 流年：自额至颐，按 12 部位循环
export const LIU_NIAN_BUWEI: Array<{ name: string; pos: string; age: number; desc: string }> = [
  { name: '火星', pos: '额上', age: 1, desc: '火星位 · 主幼年' },
  { name: '天仓', pos: '太阳穴', age: 9, desc: '天仓位 · 主少年' },
  { name: '山林', pos: '眉上', age: 17, desc: '山林位 · 主青年' },
  { name: '将台', pos: '额角', age: 25, desc: '将台位 · 主志业' },
  { name: '印堂', pos: '两眉间', age: 33, desc: '印堂位 · 主功名' },
  { name: '山根', pos: '鼻梁根部', age: 41, desc: '山根位 · 主健康' },
  { name: '年寿', pos: '鼻梁中部', age: 49, desc: '年寿位 · 主禄命' },
  { name: '准头', pos: '鼻头', age: 57, desc: '准头位 · 主财库' },
  { name: '人中', pos: '鼻下唇上', age: 65, desc: '人中位 · 主子女' },
  { name: '口', pos: '嘴唇', age: 73, desc: '口位 · 主信用' },
  { name: '承浆', pos: '下唇下', age: 81, desc: '承浆位 · 主归宿' },
  { name: '地阁', pos: '下巴', age: 89, desc: '地阁位 · 主晚福' },
]

// ============ 五形人 ============
// 望诊：木形人（长/青）金形人（方/白）水形人（圆/黑）火形人（尖/赤）土形人（厚/黄）
export const WU_XING_REN: Array<{
  name: string
  shape: string
  color: string
  character: string
  career: string
  health: string
}> = [
  {
    name: '木形人',
    shape: '瘦长 · 青色 · 头隆额耸',
    color: '青',
    character: '仁慈 · 思虑深远',
    career: '文教/中医/文化',
    health: '肝胆需养 · 忌怒',
  },
  {
    name: '火形人',
    shape: '尖锐 · 赤色 · 面红齿利',
    color: '赤',
    character: '热情 · 行动力强',
    career: '科技/演艺/IT',
    health: '心血管需养 · 忌急',
  },
  {
    name: '土形人',
    shape: '敦厚 · 黄色 · 背厚面方',
    color: '黄',
    character: '稳重 · 包容守信',
    career: '建筑/农业/管理',
    health: '脾胃需养 · 忌湿',
  },
  {
    name: '金形人',
    shape: '方正 · 白色 · 骨骼清奇',
    color: '白',
    character: '刚毅 · 重义讲信',
    career: '金融/法务/军警',
    health: '肺肠需养 · 忌悲',
  },
  {
    name: '水形人',
    shape: '圆润 · 黑色 · 眉粗眼大',
    color: '黑',
    character: '智巧 · 灵活善变',
    career: '商业/外交/艺术',
    health: '肾膀胱需养 · 忌寒',
  },
]

export interface ShiErGongItem {
  name: string
  pos: string
  desc: string
  score: number // 0-100 该宫流年吉凶
  level: '大吉' | '吉' | '平' | '凶' | '大凶'
  detail: string // 该宫细评
}

export interface LiuNianItem {
  name: string
  pos: string
  baseAge: number
  ageInUser: number
  flow: '吉' | '平' | '凶'
  detail: string
}

export interface MianxiangResult {
  sanTing: typeof SAN_TING
  wuGuan: typeof WU_GUAN
  shiErGong: typeof SHI_ER_GONG
  shiErGongDetail: ShiErGongItem[]
  liuNian: LiuNianItem[]
  xingJu: typeof WU_XING_REN
  xingJuName: string
  totalScore: number
  level: '大吉' | '吉' | '平' | '凶'
  summary: string
  advice: string[]
}

/**
 * 基于生辰年份（决定年龄段）生成对面相的运势评估
 */
export function calcMianxiang(
  year: number,
  focusArea: string = '',
  currentAge: number = 0,
): MianxiangResult {
  // 三停得分微调
  const base = 70 + (year % 7) - 3
  const sanTing = SAN_TING.map((s, i) => ({
    ...s,
    score: Math.max(50, Math.min(95, base + i * 2 + (year % 5) - 2)),
  }))
  const wuGuan = WU_GUAN.map((g, i) => ({
    ...g,
    fortune: Math.max(55, Math.min(95, g.fortune + (year % 5) - 2 + (i === 2 ? 4 : 0))),
  }))

  // 12 宫细化评分（按 4 大类分：命格/六亲/物质/福缘）
  const categoryBase: Record<number, number> = {
    0: 80,
    1: 70,
    2: 65,
    3: 75,
    4: 80,
    5: 70,
    6: 60,
    7: 75,
    8: 78,
    9: 72,
    10: 70,
    11: 73,
  }
  const yearSeed = (year + 5) % 9
  const shiErGongDetail: ShiErGongItem[] = SHI_ER_GONG.map((g, i) => {
    let score = (categoryBase[i] ?? 0) + ((yearSeed * 7 + i * 11) % 19) - 9
    // focus area 加权
    if (focusArea && g.name.includes(focusArea)) score += 8
    score = Math.max(40, Math.min(98, score))
    let level: '大吉' | '吉' | '平' | '凶' | '大凶'
    if (score >= 88) level = '大吉'
    else if (score >= 75) level = '吉'
    else if (score >= 60) level = '平'
    else if (score >= 48) level = '凶'
    else level = '大凶'
    const detail = _gongDetail(g.name, level, i)
    return { name: g.name, pos: g.pos, desc: g.desc, score, level, detail }
  })

  // 12 流年部位（按当前年龄推算）
  const ageNow = currentAge || new Date().getFullYear() - year
  const liuNian: LiuNianItem[] = LIU_NIAN_BUWEI.map((b, i) => {
    const ageInUser = ageNow - b.age
    let flow: '吉' | '平' | '凶'
    const seed = (i * 7 + yearSeed) % 7
    if (seed <= 2) flow = '吉'
    else if (seed <= 4) flow = '平'
    else flow = '凶'
    return {
      name: b.name,
      pos: b.pos,
      baseAge: b.age,
      ageInUser,
      flow,
      detail: _liuNianDetail(b, flow),
    }
  })

  // 五形人
  const xingJu = WU_XING_REN[(yearSeed + (year % 5)) % 5]!
  const xingJuName = xingJu.name

  const avgSanTing = sanTing.reduce((s, x) => s + x.score, 0) / sanTing.length
  const avgWuGuan = wuGuan.reduce((s, x) => s + x.fortune, 0) / wuGuan.length
  const avgGong = shiErGongDetail.reduce((s, x) => s + x.score, 0) / shiErGongDetail.length
  const totalScore = Math.round(avgSanTing * 0.3 + avgWuGuan * 0.3 + avgGong * 0.4)

  let level: '大吉' | '吉' | '平' | '凶' = '平'
  if (totalScore >= 85) level = '大吉'
  else if (totalScore >= 70) level = '吉'
  else if (totalScore < 55) level = '凶'

  // 实用建议
  const advice: string[] = []
  advice.push(
    `形局属${xingJuName}（${xingJu.shape}），主${xingJu.character}，宜从事${xingJu.career}。`,
  )
  advice.push(
    `流年关注：${
      liuNian
        .filter((x) => x.flow === '吉')
        .map((x) => x.name)
        .join('、') || '守中'
    }${
      liuNian.filter((x) => x.flow === '凶').length
        ? ' · 慎行：' +
          liuNian
            .filter((x) => x.flow === '凶')
            .map((x) => x.name)
            .join('、')
        : ''
    }。`,
  )
  // 12 宫最吉/最凶
  const bestG = shiErGongDetail.reduce((a, b) => (a.score > b.score ? a : b))
  const worstG = shiErGongDetail.reduce((a, b) => (a.score < b.score ? a : b))
  advice.push(`${bestG.name}（${bestG.pos}）${bestG.level}：${bestG.detail}`)
  if (worstG.level === '凶' || worstG.level === '大凶') {
    advice.push(`慎防${worstG.name}（${worstG.pos}）${worstG.level}：${worstG.detail}`)
  }
  advice.push(`养生：${xingJu.health}。`)

  return {
    sanTing,
    wuGuan,
    shiErGong: SHI_ER_GONG,
    shiErGongDetail,
    liuNian,
    xingJu: WU_XING_REN,
    xingJuName,
    totalScore,
    level,
    summary: `${year}年生人 · ${xingJuName} · 面相总评 ${level} · 三停均匀 · 五官清朗`,
    advice,
  }
}

function _gongDetail(
  name: string,
  level: '大吉' | '吉' | '平' | '凶' | '大凶',
  _idx: number,
): string {
  const levelText =
    level === '大吉'
      ? '大吉'
      : level === '吉'
        ? '吉利'
        : level === '平'
          ? '平稳'
          : level === '凶'
            ? '欠佳'
            : '大凶'
  const baseTexts: Record<string, string> = {
    命宫: '命运根基稳固，意志坚定',
    财帛宫: '财源丰隆，收入稳增',
    兄弟宫: '手足情深，相互扶持',
    夫妻宫: '琴瑟和鸣，配偶贤淑',
    子女宫: '子嗣兴旺，后继有人',
    疾厄宫: '体魄康健，少有灾疾',
    奴仆宫: '下属得力，人际和谐',
    父母宫: '父母双全，庇荫有加',
    福德宫: '心性仁厚，福德绵长',
    官禄宫: '事业顺遂，仕途可期',
    田宅宫: '家宅安稳，产业丰盈',
    相貌宫: '仪表堂堂，气质出众',
  }
  return `${name}${levelText}：${baseTexts[name] || '运势平稳'}${level === '大吉' || level === '大凶' ? `，${level === '大吉' ? '宜积极进取' : '宜守正待时'}` : ''}`
}

function _liuNianDetail(
  b: { name: string; pos: string; desc: string },
  flow: '吉' | '平' | '凶',
): string {
  const f = flow === '吉' ? '顺' : flow === '平' ? '平' : '逆'
  return `${b.name}（${b.pos}）流年${f} · ${b.desc} · ${flow === '吉' ? '诸事可图' : flow === '平' ? '守中为宜' : '慎行避祸'}`
}
