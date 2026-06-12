/**
 * 玉匣记 · 高级命名学
 *
 * 出处：《玉匣记》—— 命学/姓名学典籍
 *
 * 核心：
 *  1. 三才五格：天地人格、外格
 *  2. 八十一数详批（熊崎氏 81 数灵签）
 *  3. 笔画算命（康熙笔画）
 *  4. 音形义综合
 */

import { kangxiStrokes } from './kangxi-strokes'

export type WuXing = '木' | '火' | '土' | '金' | '水'

export interface Wuge {
  tian: number
  ren: number
  di: number
  zong: number
  wai: number
}

export const WUGE_FIELD_LABELS: Record<keyof Wuge, string> = {
  tian: '天格',
  ren: '人格',
  di: '地格',
  zong: '总格',
  wai: '外格',
}

export interface NameAnalysis {
  surname: string
  given: string
  full: string
  pinyin: string
  // 三才
  tianGe: { num: number; wuXing: WuXing; yi: string; ji: string; desc: string }
  renGe: { num: number; wuXing: WuXing; yi: string; ji: string; desc: string }
  diGe: { num: number; wuXing: WuXing; yi: string; ji: string; desc: string }
  zongGe: { num: number; wuXing: WuXing; yi: string; ji: string; desc: string }
  waiGe: { num: number; wuXing: WuXing; yi: string; ji: string; desc: string }
  /** 三才配置：天人格五行 */
  sanCai: { tian: WuXing; ren: WuXing; di: WuXing; luck: '大吉' | '吉' | '半吉' | '凶' | '大凶'; reason: string }
  /** 81 数详批 */
  numbers: Array<{ ge: string; num: number; yi: string; ji: string; desc: string; level: '上' | '中' | '下' }>
  /** 音形义 */
  yiXingYi: {
    yinLu: { yi: string; ji: string; desc: string }
    xingXiang: { yi: string; ji: string; desc: string }
    yiYi: { yi: string; ji: string; desc: string }
  }
  /** 总评 */
  totalScore: number
  grade: '上上' | '上' | '中上' | '中' | '中下' | '下'
  summary: string
}

/** 三才五行相生相克吉凶 */
const SANCAI_JI: Record<string, { luck: '大吉' | '吉' | '半吉' | '凶' | '大凶'; reason: string }> = {
  '木木木': { luck: '大吉', reason: '三才皆木 · 秀气成功 · 大吉' },
  '木木火': { luck: '大吉', reason: '木生火 · 秀气之象 · 大吉' },
  '木火木': { luck: '大吉', reason: '木火通明 · 大吉' },
  '木火火': { luck: '吉', reason: '木火相生 · 吉' },
  '木火土': { luck: '吉', reason: '木火土递生 · 吉' },
  '木土木': { luck: '半吉', reason: '木克土 · 半吉' },
  '木土火': { luck: '半吉', reason: '土木相克 · 半吉' },
  '木土土': { luck: '半吉', reason: '木土交战 · 半吉' },
  '木土金': { luck: '凶', reason: '木土金克泄 · 凶' },
  '木金木': { luck: '凶', reason: '金克木 · 凶' },
  '木金金': { luck: '凶', reason: '金克木 · 凶' },
  '木金水': { luck: '凶', reason: '金生水 · 木受克 · 半吉' },
  '木水木': { luck: '吉', reason: '水生木 · 吉' },
  '木水水': { luck: '吉', reason: '水生木 · 吉' },
  '木水火': { luck: '吉', reason: '水木相生 · 木生火 · 吉' },
  '火火火': { luck: '大吉', reason: '三才皆火 · 文明之象 · 大吉' },
  '火火木': { luck: '吉', reason: '木生火 · 吉' },
  '火火土': { luck: '大吉', reason: '火生土 · 大吉' },
  '火火金': { luck: '凶', reason: '火克金 · 凶' },
  '火木火': { luck: '吉', reason: '木火通明 · 吉' },
  '火木木': { luck: '吉', reason: '木火相生 · 吉' },
  '火木土': { luck: '半吉', reason: '木火土相生 · 半吉' },
  '火土火': { luck: '吉', reason: '火土相生 · 吉' },
  '火土木': { luck: '凶', reason: '木克土 · 凶' },
  '火土土': { luck: '吉', reason: '火土相生 · 吉' },
  '火土金': { luck: '吉', reason: '火土金相生 · 吉' },
  '火金火': { luck: '凶', reason: '火克金 · 凶' },
  '火金金': { luck: '凶', reason: '火克金 · 凶' },
  '火金水': { luck: '凶', reason: '火克金 · 凶' },
  '火水金': { luck: '凶', reason: '水克火 · 凶' },
  '火水水': { luck: '凶', reason: '水克火 · 大凶' },
  '火水木': { luck: '凶', reason: '水克火 · 凶' },
  '土土土': { luck: '大吉', reason: '三才皆土 · 积德累功 · 大吉' },
  '土土火': { luck: '吉', reason: '火生土 · 吉' },
  '土土木': { luck: '凶', reason: '木克土 · 凶' },
  '土土金': { luck: '大吉', reason: '土生金 · 大吉' },
  '土土水': { luck: '凶', reason: '土克水 · 凶' },
  '土火土': { luck: '吉', reason: '火生土 · 吉' },
  '土火火': { luck: '吉', reason: '火土相生 · 吉' },
  '土火木': { luck: '凶', reason: '木克土 · 凶' },
  '土火金': { luck: '半吉', reason: '土火金相生 · 半吉' },
  '土木土': { luck: '凶', reason: '木克土 · 凶' },
  '土木木': { luck: '凶', reason: '木克土 · 凶' },
  '土木火': { luck: '凶', reason: '木克土 · 凶' },
  '土金土': { luck: '吉', reason: '土生金 · 吉' },
  '土金金': { luck: '吉', reason: '土金相生 · 吉' },
  '土金水': { luck: '吉', reason: '土金水相生 · 吉' },
  '土金木': { luck: '凶', reason: '金克木 · 凶' },
  '土水土': { luck: '凶', reason: '土克水 · 凶' },
  '土水水': { luck: '凶', reason: '土克水 · 凶' },
  '土水木': { luck: '半吉', reason: '土水相克 · 半吉' },
  '土水火': { luck: '凶', reason: '水克火 · 凶' },
  '金金金': { luck: '大吉', reason: '三才皆金 · 刚毅果断 · 大吉' },
  '金金土': { luck: '吉', reason: '土生金 · 吉' },
  '金金水': { luck: '大吉', reason: '金生水 · 大吉' },
  '金金木': { luck: '凶', reason: '金克木 · 凶' },
  '金金火': { luck: '凶', reason: '火克金 · 凶' },
  '金土金': { luck: '吉', reason: '土生金 · 吉' },
  '金土土': { luck: '吉', reason: '土金相生 · 吉' },
  '金土木': { luck: '凶', reason: '金克木 · 凶' },
  '金土水': { luck: '吉', reason: '土金水相生 · 吉' },
  '金土火': { luck: '凶', reason: '火克金 · 凶' },
  '金木金': { luck: '凶', reason: '金克木 · 凶' },
  '金木木': { luck: '凶', reason: '金克木 · 凶' },
  '金木水': { luck: '凶', reason: '金生水 · 水生木 · 半吉' },
  '金木火': { luck: '凶', reason: '金克木 · 凶' },
  '金水金': { luck: '吉', reason: '金水相生 · 吉' },
  '金水水': { luck: '吉', reason: '金水相生 · 吉' },
  '金水木': { luck: '半吉', reason: '金水木递生 · 半吉' },
  '金水火': { luck: '凶', reason: '水克火 · 凶' },
  '金火金': { luck: '凶', reason: '火克金 · 凶' },
  '金火火': { luck: '凶', reason: '火克金 · 凶' },
  '金火木': { luck: '凶', reason: '火克金 · 凶' },
  '金火土': { luck: '凶', reason: '火克金 · 凶' },
  '金火水': { luck: '凶', reason: '火克金 · 凶' },
  '水水水': { luck: '大吉', reason: '三才皆水 · 智圆行方 · 大吉' },
  '水水木': { luck: '大吉', reason: '水生木 · 大吉' },
  '水水金': { luck: '吉', reason: '金生水 · 吉' },
  '水水火': { luck: '凶', reason: '水克火 · 凶' },
  '水水土': { luck: '凶', reason: '土克水 · 凶' },
  '水木水': { luck: '吉', reason: '水生木 · 吉' },
  '水木木': { luck: '吉', reason: '水生木 · 吉' },
  '水木火': { luck: '吉', reason: '水木火相生 · 吉' },
  '水木金': { luck: '凶', reason: '金生水 · 水生木 · 半吉' },
  '水木土': { luck: '凶', reason: '木克土 · 凶' },
  '水金水': { luck: '吉', reason: '金水相生 · 吉' },
  '水金金': { luck: '吉', reason: '金水相生 · 吉' },
  '水金木': { luck: '半吉', reason: '金水木递生 · 半吉' },
  '水金火': { luck: '凶', reason: '水克火 · 凶' },
  '水金土': { luck: '吉', reason: '金水相生 · 吉' },
  '水火水': { luck: '凶', reason: '水克火 · 凶' },
  '水火火': { luck: '凶', reason: '水克火 · 大凶' },
  '水火木': { luck: '凶', reason: '水克火 · 凶' },
  '水火金': { luck: '凶', reason: '水克火 · 凶' },
  '水火土': { luck: '凶', reason: '水克火 · 凶' },
  '水土水': { luck: '凶', reason: '土克水 · 凶' },
  '水土土': { luck: '凶', reason: '土克水 · 凶' },
  '水土木': { luck: '凶', reason: '土克水 · 凶' },
  '水土火': { luck: '凶', reason: '土克水 · 凶' },
  '水土金': { luck: '半吉', reason: '土克水 · 金生水 · 半吉' },
}

/** 81 数详批（部分） */
const EIGHTY_ONE: Array<{ num: number; yi: string; ji: string; desc: string; level: '上' | '中' | '下' }> = [
  { num: 1, yi: '大吉', ji: '', desc: '万事亨通 · 大业之数', level: '上' },
  { num: 2, yi: '凶', ji: '破军', desc: '破败离散 · 难成大事', level: '下' },
  { num: 3, yi: '大吉', ji: '', desc: '进取如意 · 繁荣隆昌', level: '上' },
  { num: 4, yi: '凶', ji: '凶', desc: '万事休止 · 难遂心愿', level: '下' },
  { num: 5, yi: '大吉', ji: '', desc: '种竹成林 · 福禄长临', level: '上' },
  { num: 6, yi: '大吉', ji: '', desc: '安和乐利 · 天赐福祉', level: '上' },
  { num: 7, yi: '吉', ji: '', desc: '刚毅果断 · 精进不休', level: '上' },
  { num: 8, yi: '大吉', ji: '', desc: '坚刚果断 · 权威显达', level: '上' },
  { num: 9, yi: '凶', ji: '凶', desc: '兴尽衰来 · 多成多败', level: '下' },
  { num: 10, yi: '凶', ji: '凶', desc: '万事终局 · 暗淡收场', level: '下' },
  { num: 11, yi: '大吉', ji: '', desc: '旱苗逢雨 · 权威显达', level: '上' },
  { num: 12, yi: '凶', ji: '凶', desc: '薄弱无助 · 多灾多难', level: '下' },
  { num: 13, yi: '大吉', ji: '', desc: '智能超群 · 声誉显达', level: '上' },
  { num: 14, yi: '凶', ji: '凶', desc: '破兆浮沉 · 孤独运', level: '下' },
  { num: 15, yi: '大吉', ji: '', desc: '福寿共聚 · 温和雅量', level: '上' },
  { num: 16, yi: '大吉', ji: '', desc: '化凶为吉 · 厚重载德', level: '上' },
  { num: 17, yi: '半吉', ji: '', desc: '突破万难 · 权威刚强', level: '中' },
  { num: 18, yi: '半吉', ji: '', desc: '有志竟成 · 风云际会', level: '中' },
  { num: 19, yi: '凶', ji: '凶', desc: '多灾多难 · 徒劳无功', level: '下' },
  { num: 20, yi: '凶', ji: '凶', desc: '谋事不达 · 一事无成', level: '下' },
  { num: 21, yi: '大吉', ji: '', desc: '明月光照 · 独立权威', level: '上' },
  { num: 22, yi: '凶', ji: '凶', desc: '秋草逢霜 · 薄弱多难', level: '下' },
  { num: 23, yi: '大吉', ji: '', desc: '旭日升天 · 显著隆昌', level: '上' },
  { num: 24, yi: '大吉', ji: '', desc: '金钱丰盈 · 家门余庆', level: '上' },
  { num: 25, yi: '半吉', ji: '', desc: '英姿焕发 · 温和雅量', level: '中' },
  { num: 26, yi: '凶', ji: '凶', desc: '英雄运 · 多愁多忧', level: '下' },
  { num: 27, yi: '凶', ji: '凶', desc: '欲望太盛 · 招致失败', level: '下' },
  { num: 28, yi: '凶', ji: '凶', desc: '多难多灾 · 离散飘零', level: '下' },
  { num: 29, yi: '大吉', ji: '', desc: '智略超群 · 名利双收', level: '上' },
  { num: 30, yi: '半吉', ji: '', desc: '一成一败 · 守成之命', level: '中' },
  { num: 31, yi: '大吉', ji: '', desc: '智勇兼备 · 享誉中外', level: '上' },
  { num: 32, yi: '大吉', ji: '', desc: '池中之龙 · 风云际会', level: '上' },
  { num: 33, yi: '大吉', ji: '', desc: '旭日升天 · 鸾凤相会', level: '上' },
  { num: 34, yi: '大凶', ji: '大凶', desc: '破家亡身 · 难逃劫数', level: '下' },
  { num: 35, yi: '大吉', ji: '', desc: '温和端正 · 嘉庆之数', level: '上' },
  { num: 36, yi: '半吉', ji: '', desc: '波澜重叠 · 壮士多难', level: '中' },
  { num: 37, yi: '大吉', ji: '', desc: '权威显达 · 逢凶化吉', level: '上' },
  { num: 38, yi: '半吉', ji: '', desc: '薄弱意志 · 难成大事', level: '中' },
  { num: 39, yi: '大吉', ji: '', desc: '富贵荣华 · 德望兼备', level: '上' },
  { num: 40, yi: '凶', ji: '凶', desc: '谋事不达 · 怀才不遇', level: '下' },
  { num: 41, yi: '大吉', ji: '', desc: '纯阳独秀 · 权威显达', level: '上' },
  { num: 42, yi: '半吉', ji: '', desc: '寒蝉悲风 · 徒劳无功', level: '中' },
  { num: 43, yi: '凶', ji: '凶', desc: '散财破产 · 多灾多难', level: '下' },
  { num: 44, yi: '凶', ji: '凶', desc: '破家亡身 · 鬼哭神嚎', level: '下' },
  { num: 45, yi: '大吉', ji: '', desc: '杨柳遇风 · 德泽绵长', level: '上' },
  { num: 46, yi: '凶', ji: '凶', desc: '载宝沉舟 · 凶险万状', level: '下' },
  { num: 47, yi: '大吉', ji: '', desc: '点石成金 · 权威显达', level: '上' },
  { num: 48, yi: '大吉', ji: '', desc: '青松立鹤 · 德泽绵长', level: '上' },
  { num: 49, yi: '凶', ji: '凶', desc: '吉凶参半 · 变化莫测', level: '下' },
  { num: 50, yi: '大吉', ji: '', desc: '小舟入海 · 一成一败', level: '中' },
  { num: 51, yi: '半吉', ji: '', desc: '盛衰参半 · 起伏不定', level: '中' },
  { num: 52, yi: '大吉', ji: '', desc: '达眼先机 · 智勇兼备', level: '上' },
  { num: 53, yi: '半吉', ji: '', desc: '外祥内苦 · 多成多败', level: '中' },
  { num: 54, yi: '凶', ji: '凶', desc: '石上栽花 · 多难多灾', level: '下' },
  { num: 55, yi: '大吉', ji: '', desc: '雨后春笋 · 权威显达', level: '上' },
  { num: 56, yi: '凶', ji: '凶', desc: '多灾多难 · 怀才不遇', level: '下' },
  { num: 57, yi: '大吉', ji: '', desc: '寒梅晚香 · 阳光和悦', level: '上' },
  { num: 58, yi: '半吉', ji: '', desc: '晚来如意 · 先苦后甘', level: '中' },
  { num: 59, yi: '凶', ji: '凶', desc: '寒蝉悲风 · 一事无成', level: '下' },
  { num: 60, yi: '凶', ji: '凶', desc: '黑暗无光 · 心迷意乱', level: '下' },
  { num: 61, yi: '大吉', ji: '', desc: '名利双收 · 多成多业', level: '上' },
  { num: 62, yi: '凶', ji: '凶', desc: '根基不固 · 摇摇欲坠', level: '下' },
  { num: 63, yi: '大吉', ji: '', desc: '万物化生 · 繁荣昌盛', level: '上' },
  { num: 64, yi: '凶', ji: '凶', desc: '谋事不达 · 骨肉分离', level: '下' },
  { num: 65, yi: '大吉', ji: '', desc: '万物亨通 · 大业之数', level: '上' },
  { num: 66, yi: '凶', ji: '凶', desc: '内忧外患 · 进退两难', level: '下' },
  { num: 67, yi: '大吉', ji: '', desc: '通达四海 · 发达之数', level: '上' },
  { num: 68, yi: '大吉', ji: '', desc: '吉人天相 · 享誉中外', level: '上' },
  { num: 69, yi: '凶', ji: '凶', desc: '进退维谷 · 动摇不安', level: '下' },
  { num: 70, yi: '凶', ji: '凶', desc: '坐立不安 · 多灾多难', level: '下' },
  { num: 71, yi: '半吉', ji: '', desc: '阴阳和合 · 鱼龙混杂', level: '中' },
  { num: 72, yi: '凶', ji: '凶', desc: '外吉内凶 · 一成一败', level: '下' },
  { num: 73, yi: '大吉', ji: '', desc: '旭日升天 · 功名荣达', level: '上' },
  { num: 74, yi: '凶', ji: '凶', desc: '秋草逢霜 · 难成大事', level: '下' },
  { num: 75, yi: '半吉', ji: '', desc: '守成保终 · 难成大业', level: '中' },
  { num: 76, yi: '凶', ji: '凶', desc: '倾覆离散 · 骨肉分离', level: '下' },
  { num: 77, yi: '半吉', ji: '', desc: '先甘后苦 · 难成大业', level: '中' },
  { num: 78, yi: '半吉', ji: '', desc: '晚来转吉 · 谋事可成', level: '中' },
  { num: 79, yi: '大吉', ji: '', desc: '云行雨施 · 终成大业', level: '上' },
  { num: 80, yi: '大凶', ji: '大凶', desc: '枯木逢春 · 难逃劫数', level: '下' },
  { num: 81, yi: '大吉', ji: '', desc: '万物归终 · 还原复始', level: '上' },
]

/** 五行数（1-10） */
const NUMBER_WUXING: Record<number, WuXing> = {
  1: '木', 2: '木', 3: '火', 4: '火', 5: '土',
  6: '土', 7: '金', 8: '金', 9: '水', 10: '水',
}

function getNumberWuXing(num: number): WuXing {
  const m = ((num - 1) % 10) + 1
  return NUMBER_WUXING[m]
}

function getNumberInfo(num: number) {
  // 1-81 中对应数
  if (num >= 1 && num <= 81) {
    return EIGHTY_ONE[num - 1]
  }
  // 超过 81 用末数（81 数最大循环）
  const rem = ((num - 1) % 81) + 1
  return EIGHTY_ONE[rem - 1]
}

/** 计算五格 */
export function calcWuge(surname: string, given: string): Wuge {
  const sur = kangxiStrokes(surname)
  const g1 = given.length >= 1 ? kangxiStrokes(given[0]) : 0
  const g2 = given.length >= 2 ? kangxiStrokes(given[1]) : 0
  const isSingleChar = given.length === 1
  // 天格 = 姓 + 1（复姓不加）
  const tian = isSingleChar ? sur + 1 : sur
  // 人格 = 姓 + 名首字
  const ren = isSingleChar ? sur + g1 : g1
  // 地格 = 名首 + 名末
  const di = isSingleChar ? g1 + g1 : g1 + g2
  // 总格 = 姓 + 名字
  const zong = sur + g1 + g2
  // 外格 = 总 - 人 + 1
  const wai = zong - ren + 1
  return { tian, ren, di, zong, wai }
}

export function analyzeName(surname: string, given: string): NameAnalysis {
  const full = surname + given
  const w = calcWuge(surname, given)
  const tianWx = getNumberWuXing(w.tian)
  const renWx = getNumberWuXing(w.ren)
  const diWx = getNumberWuXing(w.di)
  const zongWx = getNumberWuXing(w.zong)
  const waiWx = getNumberWuXing(w.wai)
  const tianInfo = getNumberInfo(w.tian)
  const renInfo = getNumberInfo(w.ren)
  const diInfo = getNumberInfo(w.di)
  const zongInfo = getNumberInfo(w.zong)
  const waiInfo = getNumberInfo(w.wai)
  // 三才
  const sanCaiKey = `${tianWx}${renWx}${diWx}`
  const sanCaiConfig = SANCAI_JI[sanCaiKey] || { luck: '半吉' as const, reason: '配置平和' }
  // 评分
  const luckyCount = [tianInfo, renInfo, diInfo, zongInfo, waiInfo].filter((n) => n.level === '上').length
  const totalScore = Math.min(100, luckyCount * 12 + (sanCaiConfig.luck === '大吉' ? 40 : sanCaiConfig.luck === '吉' ? 30 : sanCaiConfig.luck === '半吉' ? 20 : 10))
  const grade: NameAnalysis['grade'] = totalScore >= 85 ? '上上' : totalScore >= 70 ? '上' : totalScore >= 55 ? '中上' : totalScore >= 40 ? '中' : totalScore >= 25 ? '中下' : '下'
  // 音形义
  const yiXingYi: NameAnalysis['yiXingYi'] = {
    yinLu: {
      yi: '声调有起伏',
      ji: '声调相同',
      desc: '宜声调平仄相间 · 名之音律感强 · 则音韵佳',
    },
    xingXiang: {
      yi: '字形美观',
      ji: '字形怪异',
      desc: '宜字形正派 · 书写流畅 · 则可显名',
    },
    yiYi: {
      yi: '寓意深远',
      ji: '意义粗浅',
      desc: '宜选寓意深远 · 君子比德之物 · 则名以正人',
    },
  }
  const numbers: NameAnalysis['numbers'] = [
    { ge: '天格', num: w.tian, ...tianInfo },
    { ge: '人格', num: w.ren, ...renInfo },
    { ge: '地格', num: w.di, ...diInfo },
    { ge: '总格', num: w.zong, ...zongInfo },
    { ge: '外格', num: w.wai, ...waiInfo },
  ]
  const summary = `${full} · 天格${w.tian}${tianInfo.level === '上' ? '吉' : tianInfo.level === '中' ? '中' : '凶'} · 人格${w.ren}${renInfo.level === '上' ? '吉' : renInfo.level === '中' ? '中' : '凶'} · 地格${w.di}${diInfo.level === '上' ? '吉' : diInfo.level === '中' ? '中' : '凶'} · 三才${sanCaiConfig.luck}`
  return {
    surname,
    given,
    full,
    pinyin: '',
    tianGe: { num: w.tian, wuXing: tianWx, ...tianInfo },
    renGe: { num: w.ren, wuXing: renWx, ...renInfo },
    diGe: { num: w.di, wuXing: diWx, ...diInfo },
    zongGe: { num: w.zong, wuXing: zongWx, ...zongInfo },
    waiGe: { num: w.wai, wuXing: waiWx, ...waiInfo },
    sanCai: { tian: tianWx, ren: renWx, di: diWx, luck: sanCaiConfig.luck, reason: sanCaiConfig.reason },
    numbers,
    yiXingYi,
    totalScore,
    grade,
    summary,
  }
}
