/**
 * 玄枢 MISTVERSE · 今日运势（12 生肖）
 *
 *  - 基于日干支 + 生肖 + 月令
 *  - 5 维评分：事业/财运/感情/健康/人际
 *  - 宜忌、幸运色、幸运数字
 */

import { calcBazi, TIANGAN_WUXING, type Wuxing } from '@modules/mingli/logic/bazi'
import { SHENG, KE } from '@modules/mingli/logic/wuxing'

const SHENGXIAO_LIST = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

// 简化的"今日干支"生成
function todayGanzhi(): { gan: string; zhi: string } {
  const ref = new Date(1900, 0, 31)
  const days = Math.floor((Date.now() - ref.getTime()) / 86400000)
  const tiangan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const dizhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  return {
    gan: tiangan[((days % 10) + 10) % 10] ?? '甲',
    zhi: dizhi[((days % 12) + 12) % 12] ?? '子',
  }
}

// 生肖 → 地支
const SX_DZ: Record<string, string> = {
  鼠: '子',
  牛: '丑',
  虎: '寅',
  兔: '卯',
  龙: '辰',
  蛇: '巳',
  马: '午',
  羊: '未',
  猴: '申',
  鸡: '酉',
  狗: '戌',
  猪: '亥',
}

export interface YunshiResult {
  shengxiao: string
  todayGan: string
  todayZhi: string
  todayGanzhi: string
  scores: {
    shiye: number
    caiyun: number
    ganqing: number
    jiankang: number
    renyuan: number
    total: number
  }
  level: '大吉' | '吉' | '平' | '小凶' | '凶'
  yi: string[]
  ji: string[]
  lucky: { color: string; number: number; wuxing: Wuxing; direction: string }
  summary: string
  advice: string
}

const YI_POOL = [
  '祭祀',
  '祈福',
  '出行',
  '会友',
  '订婚',
  '嫁娶',
  '开市',
  '交易',
  '动土',
  '修造',
  '入宅',
  '理发',
  '扫舍',
  '求医',
  '栽种',
  '牧养',
  '纳财',
  '教牛马',
  '置产',
  '破屋',
  '坏垣',
  '畋猎',
  '余事勿取',
  '修坟',
  '安葬',
  '上梁',
  '安门',
  '挂匾',
  '立券',
  '入殓',
  '移柩',
  '词讼',
]
const JI_POOL = ['嫁娶', '动土', '开市', '出行', '安葬', '入殓', '修坟', '诉讼', '造屋', '作灶']

const COLOR_POOL: Record<Wuxing, string[]> = {
  mu: ['青', '绿', '翠'],
  huo: ['红', '紫', '橙'],
  tu: ['黄', '棕', '咖'],
  jin: ['白', '金', '银'],
  shui: ['黑', '蓝', '灰'],
}

const DIRECTION: Record<Wuxing, string> = {
  mu: '东',
  huo: '南',
  tu: '中',
  jin: '西',
  shui: '北',
}

export function calcYunshi(
  shengxiao: string,
  year?: number,
  month?: number,
  day?: number,
  hour?: number,
): YunshiResult {
  const { gan, zhi } = todayGanzhi()
  const todayGan = gan
  const todayZhi = zhi
  const todayWx = TIANGAN_WUXING[todayGan as keyof typeof TIANGAN_WUXING]!
  const sxDz = SX_DZ[shengxiao] || '子'

  let shiye = 60,
    caiyun = 60,
    ganqing = 60,
    jiankang = 60,
    renyuan = 60

  // 个人日主 vs 今日天干
  let personalWx: Wuxing = 'mu'
  if (year && month && day !== undefined && hour !== undefined) {
    const bazi = calcBazi(year, month, day, hour)
    personalWx = TIANGAN_WUXING[bazi.day.gan]
  }

  // 相生关系
  if (SHENG[personalWx] === todayWx) {
    shiye += 8
    renyuan += 8
  }
  if (SHENG[todayWx] === personalWx) {
    caiyun += 8
    jiankang += 6
  }
  if (KE[personalWx] === todayWx) {
    shiye += 5
    ganqing -= 4
  }
  if (KE[todayWx] === personalWx) {
    jiankang -= 8
    renyuan -= 6
  }

  // 生肖冲合
  if (sxDz === todayZhi) {
    renyuan -= 5
    ganqing -= 5
  } // 自刑/本气
  // 六合：子丑合 寅亥合 卯戌合 辰酉合 巳申合 午未合
  const liuhe: Record<string, string> = {
    子: '丑',
    丑: '子',
    寅: '亥',
    亥: '寅',
    卯: '戌',
    戌: '卯',
    辰: '酉',
    酉: '辰',
    巳: '申',
    申: '巳',
    午: '未',
    未: '午',
  }
  if (liuhe[sxDz] === todayZhi) {
    ganqing += 10
    renyuan += 5
  }
  // 六冲：子午 丑未 寅申 卯酉 辰戌 巳亥
  const liuchong: Record<string, string> = {
    子: '午',
    午: '子',
    丑: '未',
    未: '丑',
    寅: '申',
    申: '寅',
    卯: '酉',
    酉: '卯',
    辰: '戌',
    戌: '辰',
    巳: '亥',
    亥: '巳',
  }
  if (liuchong[sxDz] === todayZhi) {
    shiye -= 8
    caiyun -= 6
    jiankang -= 6
  }

  shiye = Math.max(20, Math.min(100, shiye))
  caiyun = Math.max(20, Math.min(100, caiyun))
  ganqing = Math.max(20, Math.min(100, ganqing))
  jiankang = Math.max(20, Math.min(100, jiankang))
  renyuan = Math.max(20, Math.min(100, renyuan))
  const total = Math.round((shiye + caiyun + ganqing + jiankang + renyuan) / 5)

  let level: '大吉' | '吉' | '平' | '小凶' | '凶' = '平'
  if (total >= 85) level = '大吉'
  else if (total >= 70) level = '吉'
  else if (total >= 55) level = '平'
  else if (total >= 40) level = '小凶'
  else level = '凶'

  // 宜忌
  const seed = (shengxiao.charCodeAt(0) + gan.charCodeAt(0) + zhi.charCodeAt(0)) % YI_POOL.length
  const yi: string[] = [
    YI_POOL[seed] ?? '',
    YI_POOL[(seed + 4) % YI_POOL.length] ?? '',
    YI_POOL[(seed + 8) % YI_POOL.length] ?? '',
  ]
  const ji: string[] = [
    JI_POOL[(seed + 3) % JI_POOL.length] ?? '',
    JI_POOL[(seed + 7) % JI_POOL.length] ?? '',
  ]

  // 幸运
  const luckyWx = SHENG[personalWx] // 生我的为喜
  const colors = COLOR_POOL[luckyWx]!

  return {
    shengxiao,
    todayGan,
    todayZhi,
    todayGanzhi: `${gan}${zhi}`,
    scores: { shiye, caiyun, ganqing, jiankang, renyuan, total },
    level,
    yi,
    ji,
    lucky: {
      color: colors[seed % colors.length] ?? '',
      number: [1, 6, 8, 9, 5][seed % 5] ?? 1,
      wuxing: luckyWx,
      direction: DIRECTION[luckyWx],
    },
    summary: `${shengxiao} · 今日 ${gan}${zhi}日 · ${level} · 总分 ${total}`,
    advice:
      level === '大吉' || level === '吉'
        ? '顺势而为 · 大可作为'
        : level === '平'
          ? '守成为上 · 不急不躁'
          : '谨慎行事 · 退守为佳',
  }
}

export const YUNSHI_SX = SHENGXIAO_LIST
