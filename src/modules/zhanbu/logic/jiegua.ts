/**
 * 玄枢 MISTVERSE · 解卦生成器
 *
 * 根据卦象生成传统六爻解卦所需的各项分析：
 *   世爻 / 应爻 / 用神 / 伏神 / 卦变 / 互卦 / 五行旺衰 / 解读
 *
 * 规则简化版本，基于传统易学共识：
 *  - 世爻：内卦（自方）核心，第 4 爻（内卦上爻）为世
 *  - 应爻：外卦（对方）第 3 爻为应
 *  - 用神：根据所问之事选定六亲
 *  - 伏神：卦中无六亲对应爻时，从本宫卦借来
 *  - 互卦：2-3-4 爻为下互，3-4-5 爻为上互
 *  - 变卦：动爻阴变阳 / 阳变阴
 */

import { GUA_LIST, TRIGRAMS, type Gua, type Trigram } from '@modules/zhanbu/logic/gua'

/** 六亲 */
export type Liuqin = '父母' | '兄弟' | '子孙' | '妻财' | '官鬼'

/** 六亲神煞（世爻应爻位置） */
export interface LiuqinShen {
  name: Liuqin
  wuxing: string
  desc: string
  icon: string
}

/** 世应爻位（1-6 爻） */
export interface Shiying {
  shi: number // 世爻位置
  ying: number // 应爻位置
  shiLiuqin: Liuqin
  yingLiuqin: Liuqin
}

/** 互卦 */
export interface Hugua {
  upper: Trigram
  lower: Trigram
  name: string
  symbol: string
  desc: string
}

/** 变卦 */
export interface Biangua {
  upper: Trigram
  lower: Trigram
  name: string
  symbol: string
  reason: string // 变卦原因
}

/** 用神分析 */
export interface Yongshen {
  yaoPos: number // 用神爻位 1-6
  name: Liuqin // 用神六亲
  wuxing: string
  reason: string // 选取理由
  status: '旺' | '相' | '休' | '囚' | '死' // 五行状态
  statusDesc: string // 状态解释
}

/** 伏神 */
export interface Fushen {
  yaoPos: number
  name: Liuqin
  reason: string
}

/** 一条具体建议 */
export interface Advice {
  title: string
  detail: string
  level: 'high' | 'mid' | 'low'
}

/** 完整解卦结果 */
export interface JieguaResult {
  gua: Gua // 本卦
  shiying: Shiying
  hugua: Hugua
  biangua: Biangua
  yongshen: Yongshen
  fushen?: Fushen | undefined // 缺位时才有
  wuxingFlow: string[] // 五行生克流
  fortunes: {
    // 分类运势
    career: { score: number; text: string }
    wealth: { score: number; text: string }
    love: { score: number; text: string }
    health: { score: number; text: string }
    study: { score: number; text: string }
  }
  advice: Advice[]
  summary: string // 综合解读
  lucky: {
    color: string
    number: string
    direction: string
  }
}

// ========== 六亲推算 ==========
// 用神选法（按所占之事）
const YONGSHEN_MAP: Record<string, Liuqin> = {
  事业: '官鬼',
  求财: '妻财',
  姻缘: '妻财', // 男占婚看财，女占婚看官
  官运: '官鬼',
  学业: '父母',
  病灾: '官鬼', // 病爻看官鬼
  家宅: '父母',
  出行: '父母',
  谋望: '子孙', // 谋望看子孙
  求子: '子孙',
  失物: '妻财',
  诉讼: '官鬼',
  求官: '官鬼',
  通用: '妻财', // 默认
}

export const YONGSHEN_TOPICS = [
  { key: '通用', label: '综合', glyph: '☯' },
  { key: '事业', label: '事业', glyph: '官' },
  { key: '求财', label: '财运', glyph: '财' },
  { key: '姻缘', label: '姻缘', glyph: '合' },
  { key: '学业', label: '学业', glyph: '学' },
  { key: '健康', label: '健康', glyph: '养' },
]

/**
 * 根据本卦 + 变爻生成解卦
 */
export function jiegua(
  gua: Gua,
  yao: number[],
  topic: keyof typeof YONGSHEN_MAP = '通用',
): JieguaResult {
  // 1. 世应
  const shiying = calcShiying(gua)
  // 2. 互卦
  const hugua = calcHugua(yao)
  // 3. 变卦
  const biangua = calcBiangua(gua, yao)
  // 4. 用神
  const yongshen = calcYongshen(gua, yao, topic)
  // 5. 伏神（如缺）
  const fushen = calcFushen(gua, yongshen)
  // 6. 五行流
  const wuxingFlow = calcWuxingFlow(gua, biangua)
  // 7. 分类运势
  const fortunes = calcFortunes(gua, biangua, yongshen)
  // 8. 建议
  const advice = calcAdvice(gua, biangua, yongshen, topic)
  // 9. 综合解读
  const summary = calcSummary(gua, biangua, yongshen, fortunes)
  // 10. 幸运元素
  const lucky = calcLucky(gua)

  return {
    gua,
    shiying,
    hugua,
    biangua,
    yongshen,
    fushen,
    wuxingFlow,
    fortunes,
    advice,
    summary,
    lucky,
  }
}

/**
 * 世爻/应爻位置
 *  规则：八纯卦（上下同）以 6 爻为世、3 爻为应
 *      五爻世：坎、艮、大畜（5 世 4 应）
 *      四爻世：震、巽、小畜（4 世 1 应？简化版）
 *      三爻世：离、兑、革（3 世 6 应）
 *      二爻世：其他多数（2 世 5 应）
 */
function calcShiying(gua: Gua): Shiying {
  const { upper, lower } = gua
  // 简化的世爻位规则（传统分宫卦序）
  const isQian = upper === 'qian' && lower === 'qian'
  const isKun = upper === 'kun' && lower === 'kun'
  const isKan = upper === 'kan' && lower === 'kan'
  const isGen = upper === 'gen' && lower === 'gen'
  const isZhen = upper === 'zhen' && lower === 'zhen'
  const isXun = upper === 'xun' && lower === 'xun'
  const isLi = upper === 'li' && lower === 'li'
  const isDui = upper === 'dui' && lower === 'dui'

  let shiPos: number
  if (isQian || isKun) shiPos = 6
  else if (isKan || isGen) shiPos = 5
  else if (isZhen || isXun) shiPos = 4
  else if (isLi || isDui) shiPos = 3
  else shiPos = 2

  // 应爻（与世爻隔两位）
  const yingPos = shiPos <= 3 ? shiPos + 3 : shiPos - 3

  // 世爻 / 应爻 的六亲：基于卦宫
  const liuqinList: Liuqin[] = ['父母', '兄弟', '子孙', '妻财', '官鬼']
  // 简化：按上卦属宫从 liuqinList 顺推
  const palace = upper
  const _baseIdx = (
    { qian: 0, dui: 0, li: 2, zhen: 3, xun: 3, kan: 1, gen: 1, kun: 4 } as Record<string, number>
  )[palace]
  // 这里采用"八卦属宫"定六亲位（简化）：本宫第 1 爻起
  // 为演示效果，按爻位简单映射
  const shiLiuqin = liuqinList[(shiPos - 1) % 5]!
  const yingLiuqin = liuqinList[(yingPos - 1) % 5]!

  return { shi: shiPos, ying: yingPos, shiLiuqin, yingLiuqin }
}

/**
 * 互卦
 *  2-3-4 爻合下互卦，3-4-5 爻合上互卦
 *  爻序：1=下卦下爻，2=下卦中爻，3=下卦上爻，4=上卦下爻，5=上卦中爻，6=上卦上爻
 */
function calcHugua(yao: number[]): Hugua {
  // yao[0]! = 第 1 爻 (阳=1, 阴=0)
  // 互卦下卦 = 爻 2,3,4
  // 互卦上卦 = 爻 3,4,5
  const lowerBin = [yao[1]!, yao[2]!, yao[3]!]
  const upperBin = [yao[2]!, yao[3]!, yao[4]!]
  const upper = binToTrigram(upperBin)
  const lower = binToTrigram(lowerBin)
  const name = TRIGRAMS[upper].name + TRIGRAMS[lower].name
  const symbol = TRIGRAMS[upper].symbol + TRIGRAMS[lower].symbol
  const desc = `互卦 ${name} 揭示事物内在脉络，常显隐情与中段走向。`
  return { upper, lower, name, symbol, desc }
}

/**
 * 变卦（动爻变化后）
 */
function calcBiangua(gua: Gua, yao: number[]): Biangua {
  // 简化：随机取 1-3 个变爻，阴变阳或阳变阴
  // 动爻根据 yao 数组：1=阳爻，0=阴爻
  // 模拟：选最末尾的奇数爻为动爻（变化演示）
  const changes: number[] = []
  for (let i = 0; i < 6; i++) {
    if (Math.random() > 0.7) changes.push(i)
  }
  if (changes.length === 0) changes.push(Math.floor(Math.random() * 6))

  const newYao = [...yao]
  changes.forEach((i) => (newYao[i] = newYao[i] === 1 ? 0 : 1))

  // 由 newYao 重组卦象
  const lowerBin = newYao.slice(0, 3)
  const upperBin = newYao.slice(3, 6)
  const upper = binToTrigram(upperBin)
  const lower = binToTrigram(lowerBin)

  // 查找变卦
  const targetGua =
    GUA_LIST.find(
      (g: { upper: string; lower: string }) => g.upper === upper && g.lower === lower,
    ) || gua

  const reason =
    changes.length === 1
      ? `第 ${changes[0]! + 1} 爻发动，由${yao[changes[0]!] === 1 ? '阳' : '阴'}变${newYao[changes[0]!] === 1 ? '阳' : '阴'}`
      : `${changes.length} 爻齐动，动而化之`

  return { upper, lower, name: targetGua.name, symbol: targetGua.symbol, reason }
}

/**
 * 用神（基于所占之事）
 */
function calcYongshen(gua: Gua, yao: number[], topic: keyof typeof YONGSHEN_MAP): Yongshen {
  const wushenName = YONGSHEN_MAP[topic] || YONGSHEN_MAP['通用']
  // 简化：随机选一个含该六亲爻的爻位
  // 找第一个爻对应的六亲
  const liuqinList: Liuqin[] = ['父母', '兄弟', '子孙', '妻财', '官鬼']
  const pos = yao.findIndex((_, i) => {
    return liuqinList[i % 5] === wushenName
  })
  const yaoPos = pos >= 0 ? pos + 1 : Math.ceil(Math.random() * 6)

  const upperWx = TRIGRAMS[gua.upper].wuxing!
  // 五行旺衰（简化）：根据月令
  const month = new Date().getMonth() + 1
  const seasonal: Record<number, string> = {
    2: '木',
    3: '木',
    4: '木',
    5: '火',
    6: '火',
    7: '火',
    8: '土',
    9: '土',
    10: '土',
    11: '金',
    12: '金',
    1: '水',
  }
  const seasonWx = seasonal[month] || '土'
  let status: Yongshen['status'] = '旺'
  if (upperWx === seasonWx) status = '旺'
  else if (isSheng(seasonWx, upperWx)) status = '相'
  else if (isSheng(upperWx, seasonWx)) status = '休'
  else if (isKe(seasonWx, upperWx)) status = '囚'
  else status = '死'

  const statusDesc: Record<Yongshen['status'], string> = {
    旺: '用神当令得时，力量充沛，所求易成。',
    相: '用神得月令生扶，气数渐旺，可期可待。',
    休: '用神处休囚之地，力量不足，宜静守观望。',
    囚: '用神被月令克制，力量衰弱，多有阻碍。',
    死: '用神在月令死绝之地，事宜暂缓，待时而起。',
  }

  const reasonMap: Record<Liuqin, string> = {
    父母: '占事看父母爻，主文书、契约、长辈、庇护。',
    兄弟: '占事看兄弟爻，主朋友、同辈、竞争、阻碍。',
    子孙: '占事看子孙爻，主福德、解忧、后代、谋望。',
    妻财: '占事看妻财爻，主财源、妻子、物质、欲望。',
    官鬼: '占事看官鬼爻，主官运、事业、压力、病灾。',
  }

  return {
    yaoPos,
    name: wushenName,
    wuxing: upperWx,
    reason: reasonMap[wushenName],
    status,
    statusDesc: statusDesc[status],
  }
}

function calcFushen(gua: Gua, yongshen: Yongshen): Fushen | undefined {
  // 简化：50% 概率有伏神
  if (Math.random() > 0.5) return undefined
  return {
    yaoPos: yongshen.yaoPos,
    name: yongshen.name,
    reason: `卦中用神不显，伏于第 ${yongshen.yaoPos} 爻之下，待时而动。`,
  }
}

function calcWuxingFlow(gua: Gua, biangua: Biangua): string[] {
  const upper = TRIGRAMS[gua.upper].wuxing!
  const lower = TRIGRAMS[gua.lower].wuxing!
  const bUpper = TRIGRAMS[biangua.upper].wuxing!
  const bLower = TRIGRAMS[biangua.lower].wuxing!
  return [
    `本卦下卦 ${lower} → 上卦 ${upper}`,
    `变卦下卦 ${bLower} → 上卦 ${bUpper}`,
    `${upper}生${bUpper}（泄），力量渐去；${lower}与${bLower}比和，守正可成。`,
  ]
}

function calcFortunes(gua: Gua, biangua: Biangua, yongshen: Yongshen) {
  const base = gua.fortune === '吉' ? 75 : gua.fortune === '平' ? 60 : 40
  const bonus =
    yongshen.status === '旺'
      ? 15
      : yongshen.status === '相'
        ? 8
        : yongshen.status === '休'
          ? -5
          : yongshen.status === '囚'
            ? -12
            : -20
  const adjust = (i: number) => Math.max(20, Math.min(98, base + bonus + i))

  const t = (s: number) => {
    if (s >= 85) return '大吉'
    if (s >= 70) return '吉'
    if (s >= 55) return '平'
    if (s >= 40) return '小凶'
    return '凶'
  }

  return {
    career: { score: adjust(5), text: t(adjust(5)) },
    wealth: { score: adjust(0), text: t(adjust(0)) },
    love: { score: adjust(-3), text: t(adjust(-3)) },
    health: { score: adjust(8), text: t(adjust(8)) },
    study: { score: adjust(2), text: t(adjust(2)) },
  }
}

function calcAdvice(
  gua: Gua,
  biangua: Biangua,
  yongshen: Yongshen,
  topic: keyof typeof YONGSHEN_MAP,
): Advice[] {
  const adv: Advice[] = []
  adv.push({
    title: '本卦总断',
    detail: `${gua.name}（${gua.symbol}），卦辞「${gua.judgment}」。象传曰「${gua.image}」。此卦主${gua.tag}，${gua.desc}`,
    level: 'high',
  })
  adv.push({
    title: '用神分析',
    detail: `所占「${topic}」以${yongshen.name}爻为用神，立于第 ${yongshen.yaoPos} 爻。${yongshen.statusDesc}`,
    level: 'high',
  })
  adv.push({
    title: '互卦内情',
    detail: `互卦 ${biangua.name} 显事物中段演变，主${gua.tag}之内的隐微脉络。`,
    level: 'mid',
  })
  adv.push({
    title: '变卦走势',
    detail: `变卦 ${biangua.name}（${biangua.symbol}），${biangua.reason}。示事之终局与发展方向，宜细参之。`,
    level: 'mid',
  })
  adv.push({
    title: '趋避之方',
    detail:
      yongshen.status === '旺' || yongshen.status === '相'
        ? '用神得力，所谋可成。宜乘势而上，把握良机。'
        : '用神失力，宜静守待时。不如韬光养晦，待时而动。',
    level: 'low',
  })
  return adv
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcSummary(gua: Gua, biangua: Biangua, yongshen: Yongshen, fortunes: any): string {
  const f = gua.fortune
  const overall = fortunes.career.text
  return `本卦${gua.name}，${f}。${gua.desc}变卦${biangua.name}，示事之终。用神${yongshen.name}${yongshen.status}。综合运势【${overall}】，宜${f === '吉' ? '顺势而行' : f === '平' ? '守正待时' : '静观其变'}。`
}

function calcLucky(gua: Gua) {
  const colors = ['赤色', '金色', '青色', '黑色', '黄色', '白色', '紫色']
  const directions = ['东', '南', '西', '北', '东南', '西南', '东北', '西北']
  const upperIdx = { qian: 0, dui: 0, li: 1, zhen: 2, xun: 2, kan: 3, gen: 4, kun: 4 }[gua.upper]
  return {
    color: colors[upperIdx],
    number: String(gua.id % 9 || 9),
    direction: directions[upperIdx],
  }
}

// ========== 辅助 ==========
function binToTrigram(bin: number[]): Trigram {
  const map: Record<string, Trigram> = {
    '111': 'qian',
    '110': 'dui',
    '101': 'li',
    '100': 'zhen',
    '011': 'xun',
    '010': 'kan',
    '001': 'gen',
    '000': 'kun',
  }
  return map[bin.join('')] || 'qian'
}

function isSheng(a: string, b: string): boolean {
  // 木生火、火生土、土生金、金生水、水生木
  const cycle: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
  return cycle[a] === b
}

function isKe(a: string, b: string): boolean {
  // 木克土、土克水、水克火、火克金、金克木
  const cycle: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }
  return cycle[a] === b
}
