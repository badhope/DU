/**
 * 玄枢 MISTVERSE · 老黄历
 *
 *  - 日干支 + 月令
 *  - 28 宿 + 12 建除
 *  - 宜忌 + 冲煞 + 彭祖百忌
 *  - 5 日 / 5 日预览
 */

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 12 建除：建除满平定执破危成收开闭
const JIANCHU_12 = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭']
const JIANCHU_DESC: Record<string, string> = {
  建: '宜：出行 · 忌：动土',
  除: '宜：扫舍 · 忌：远行',
  满: '宜：造仓 · 忌：栽种',
  平: '宜：平治 · 忌：嫁娶',
  定: '宜：安定 · 忌：诉讼',
  执: '宜：捕捉 · 忌：开仓',
  破: '宜：破屋 · 忌：嫁娶',
  危: '宜：高处 · 忌：静坐',
  成: '宜：成就 · 忌：诉讼',
  收: '宜：收获 · 忌：开仓',
  开: '宜：开业 · 忌：丧葬',
  闭: '宜：闭门 · 忌：出行',
}

// 28 宿（简化 7 宿 + 4 象 + 28 循环）
const XIU_28 = [
  { name: '角', nature: '木', animal: '蛟', fortune: '吉', desc: '宜：嫁娶 · 修造' },
  { name: '亢', nature: '金', animal: '龙', fortune: '凶', desc: '宜：诉讼 · 忌：婚嫁' },
  { name: '氐', nature: '土', animal: '貉', fortune: '吉', desc: '宜：嫁娶 · 求财' },
  { name: '房', nature: '木', animal: '兔', fortune: '大吉', desc: '宜：嫁娶 · 入宅' },
  { name: '心', nature: '火', animal: '狐', fortune: '凶', desc: '宜：祭祀 · 忌：造葬' },
  { name: '尾', nature: '火', animal: '虎', fortune: '吉', desc: '宜：嫁娶 · 修造' },
  { name: '箕', nature: '木', animal: '豹', fortune: '吉', desc: '宜：出行 · 修造' },
]

// 12 值神：黄道/黑道
const ZHI_SHEN: Array<{ name: string; type: '黄道' | '黑道'; desc: string }> = [
  { name: '青龙', type: '黄道', desc: '宜：求财 · 婚嫁 · 开市' },
  { name: '明堂', type: '黄道', desc: '宜：祭祀 · 修造' },
  { name: '天刑', type: '黑道', desc: '宜：诉讼 · 忌：嫁娶' },
  { name: '朱雀', type: '黑道', desc: '宜：文书 · 忌：动土' },
  { name: '金匮', type: '黄道', desc: '宜：求财 · 开市' },
  { name: '天德', type: '黄道', desc: '宜：百事皆宜' },
  { name: '白虎', type: '黑道', desc: '宜：狩猎 · 忌：嫁娶' },
  { name: '玉堂', type: '黄道', desc: '宜：修造 · 嫁娶' },
  { name: '天牢', type: '黑道', desc: '宜：诉讼 · 忌：远行' },
  { name: '玄武', type: '黑道', desc: '宜：捕捉 · 忌：嫁娶' },
  { name: '司命', type: '黄道', desc: '宜：百事皆宜' },
  { name: '勾陈', type: '黑道', desc: '宜：静守 · 忌：远行' },
]

// 冲煞
const CHONG_MAP: Record<string, string> = {
  子: '冲马 · 煞南',
  丑: '冲羊 · 煞东',
  寅: '冲猴 · 煞北',
  卯: '冲鸡 · 煞西',
  辰: '冲狗 · 煞南',
  巳: '冲猪 · 煞东',
  午: '冲鼠 · 煞北',
  未: '冲牛 · 煞西',
  申: '冲虎 · 煞南',
  酉: '冲兔 · 煞东',
  戌: '冲龙 · 煞北',
  亥: '冲蛇 · 煞西',
}

export interface HuangliDay {
  date: string // YYYY-MM-DD
  year: number
  month: number
  day: number
  ganzhi: string // 干支
  gan: string
  zhi: string
  lunarMonth: string
  lunarDay: string
  shengxiao: string
  jianchu: string // 建除
  xiu: string // 宿
  xiuNature: string
  xiuFortune: string
  zhiShen: string
  zhiShenType: '黄道' | '黑道'
  chong: string // 冲煞
  yi: string[] // 宜
  ji: string[] // 忌
  pengZu: { tian: string; di: string } // 彭祖百忌
  fortune: '吉' | '平' | '凶'
  summary: string
}

const YI_POOL = [
  '祭祀',
  '祈福',
  '求嗣',
  '开光',
  '塑绘',
  '出行',
  '会友',
  '订婚',
  '嫁娶',
  '入宅',
  '安门',
  '动土',
  '修造',
  '上梁',
  '开市',
  '交易',
  '立券',
  '挂匾',
  '栽种',
  '牧养',
  '纳财',
  '理发',
  '扫舍',
  '破屋',
  '坏垣',
  '求医',
  '治病',
  '词讼',
  '打猎',
  '畋猎',
  '教牛马',
  '置产',
]
const JI_POOL = [
  '祈福',
  '斋醮',
  '开池',
  '安葬',
  '破土',
  '伐木',
  '作灶',
  '行丧',
  '修坟',
  '入殓',
  '移柩',
  '余事勿取',
]

/**
 * 简化的公历 → 干支日（基于 1900-01-31 = 甲辰日）
 */
function getGanzhiDay(date: Date): { gan: string; zhi: string } {
  const ref = new Date(1900, 0, 31)
  const days = Math.floor((date.getTime() - ref.getTime()) / 86400000)
  const gan = TIANGAN[((days % 10) + 10) % 10]!
  const zhi = DIZHI[((days % 12) + 12) % 12]!
  return { gan, zhi }
}

/**
 * 简化的农历月日（精度有限）
 */
function getLunar(date: Date): { month: string; day: string; shengxiao: string } {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const shengxiao = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'][
    ((((date.getFullYear() - 1900) * 12 + month) % 12) + 12) % 12
  ]
  return { month: '农历 ' + month + '月', day: day + '日', shengxiao }
}

function pengZu(gan: string, zhi: string): { tian: string; di: string } {
  const tianMap: Record<string, string> = {
    甲: '甲不开仓',
    乙: '乙不栽植',
    丙: '丙不修灶',
    丁: '丁不剃头',
    戊: '戊不受田',
    己: '己不破券',
    庚: '庚不经络',
    辛: '辛不合酱',
    壬: '壬不泮水',
    癸: '癸不词讼',
  }
  const diMap: Record<string, string> = {
    子: '子不问卜',
    丑: '丑不冠带',
    寅: '寅不带佩',
    卯: '卯不穿井',
    辰: '辰不哭泣',
    巳: '巳不远行',
    午: '午不伐木',
    未: '未不服药',
    申: '申不安床',
    酉: '酉不宴客',
    戌: '戌不归家',
    亥: '亥不嫁娶',
  }
  return {
    tian: tianMap[gan] || '',
    di: diMap[zhi] || '',
  }
}

function pickYiJi(zhi: string, seed: number): { yi: string[]; ji: string[] } {
  const idx1 = (zhi.charCodeAt(0) + seed) % YI_POOL.length
  const yi = [
    YI_POOL[idx1],
    YI_POOL[(idx1 + 3) % YI_POOL.length],
    YI_POOL[(idx1 + 7) % YI_POOL.length],
  ]
  const idx2 = (zhi.charCodeAt(0) + seed + 5) % JI_POOL.length
  const ji = [JI_POOL[idx2], JI_POOL[(idx2 + 2) % JI_POOL.length]]
  return { yi, ji }
}

export function getHuangliDay(date: Date): HuangliDay {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const { gan, zhi } = getGanzhiDay(date)
  const { month: lunarMonth, day: lunarDay, shengxiao } = getLunar(date)
  const jianchu = JIANCHU_12[(((zhi.charCodeAt(0) + day) % 12) + 12) % 12]!
  const xiu = XIU_28[(day + month) % 7]!
  const zhiShen = ZHI_SHEN[zhi.charCodeAt(0) % 12]!
  const chong = CHONG_MAP[zhi] || ''
  const seed = (year * 1000 + month * 100 + day) % 100
  const { yi, ji } = pickYiJi(zhi, seed)
  const peng = pengZu(gan, zhi)

  let fortune: '吉' | '平' | '凶' = '平'
  if (zhiShen.type === '黄道' && xiu.fortune !== '凶') fortune = '吉'
  if (zhiShen.type === '黑道' && xiu.fortune === '凶') fortune = '凶'

  return {
    date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    year,
    month,
    day,
    ganzhi: `${gan}${zhi}`,
    gan,
    zhi,
    lunarMonth,
    lunarDay,
    shengxiao,
    jianchu,
    xiu: xiu.name,
    xiuNature: xiu.nature,
    xiuFortune: xiu.fortune,
    zhiShen: zhiShen.name,
    zhiShenType: zhiShen.type,
    chong,
    yi,
    ji,
    pengZu: peng,
    fortune,
    summary: `${year}年${month}月${day}日 · ${gan}${zhi}日 · ${zhiShen.name}值日 · ${zhiShen.type}日 · ${fortune}`,
  }
}

export function getHuangli5Days(date: Date): HuangliDay[] {
  const days: HuangliDay[] = []
  for (let i = -1; i <= 3; i++) {
    const d = new Date(date)
    d.setDate(d.getDate() + i)
    days.push(getHuangliDay(d))
  }
  return days
}

export const JIANCHU_DESC_EXPORT = JIANCHU_DESC
export const ZHI_SHEN_EXPORT = ZHI_SHEN
export const XIU_28_EXPORT = XIU_28
