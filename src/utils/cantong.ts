/**
 * 参同契 · 高级禅修心法
 *
 * 出处：东汉·魏伯阳《参同契》—— 道家丹经之祖 + 禅宗心法融合
 *
 * 核心：
 *  1. 调身：七支坐法（跏趺/手/脊/头/舌/眼/心）
 *  2. 调息：数息、随息、止息、观息
 *  3. 调心：止观、参话、观心
 *  4. 三阶段：初禅 → 似禅 → 真禅
 *  5. 心性论：本心、觉性、本来面目
 */

export type GongFa = '数息' | '参话' | '观心' | '随息' | '持咒' | '内观'
export type Stage = 1 | 2 | 3 | 4 | 5 | 6

export interface ChanSession {
  gongFa: GongFa
  duration: number // 秒
  cycles: number
  breathCount: number
  huaTou?: string
  stage: Stage
  insight: string
  energy: '低' | '中' | '高'
  tip: string
}

/** 6 阶段深度 */
const STAGES: Array<{ stage: Stage; name: string; desc: string; tip: string; insight: string }> = [
  { stage: 1, name: '初禅 · 定身', desc: '七支坐定 · 身相安住', tip: '跏趺端坐 · 脊直如串铜钱', insight: '身定心方安' },
  { stage: 2, name: '二禅 · 调息', desc: '数息入定 · 息风自调', tip: '默数出息入息 · 一至十 · 不急不缓', insight: '息调心自定' },
  { stage: 3, name: '三禅 · 入静', desc: '杂念渐息 · 一心凝寂', tip: '若有念起 · 不迎不送 · 观其自生自灭', insight: '念起即觉 · 觉之即无' },
  { stage: 4, name: '四禅 · 似禅', desc: '惺惺寂寂 · 似定非定', tip: '一念万年 · 万年一念', insight: '寂而常照 · 照而常寂' },
  { stage: 5, name: '五禅 · 真禅', desc: '本地风光 · 自然显现', tip: '不思善 · 不思恶 · 正恁么时 · 如何是本来面目', insight: '即心即佛 · 非心非佛' },
  { stage: 6, name: '六禅 · 无心', desc: '心无所住 · 名之为禅', tip: '无心者 · 非无心 · 但心无妄念耳', insight: '应无所住而生其心' },
]

/** 公案 100 则（精选） */
const GONG_AN: string[] = [
  '万法归一 · 一归何处',
  '念佛是谁',
  '父母未生前 · 如何是本来面目',
  '空手把锄头 · 步行骑水牛',
  '狗子还有佛性也无 · 无',
  '无 · 字公案',
  '赵州茶 · 赵州桥',
  '云门饼 · 三斤麻',
  '临济喝',
  '德山棒',
  '即心即佛',
  '非心非佛',
  '不是心 · 不是佛 · 不是物',
  '麻三斤',
  '庭前柏树子',
  '祖师西来意',
  '如何是佛 · 干屎橛',
  '不思善不思恶 · 正恁么时 · 是如何',
  '本来无一物 · 何处惹尘埃',
  '时时勤拂拭 · 勿使惹尘埃',
  '我这里无闲事',
  '何谓禅 · 吃茶去',
  '万法皆空 · 因果不空',
  '一切众生皆有如来智慧德相',
  '色即是空 · 空即是色',
  '心生种种法生 · 心灭种种法灭',
  '一花一世界 · 一叶一如来',
  '何期自性 · 本自清净',
  '何期自性 · 本不生灭',
  '何期自性 · 本自具足',
  '何期自性 · 本无动摇',
  '何期自性 · 能生万法',
  '心 · 佛 · 众生 · 三无差别',
  '佛说一切法 · 为度一切心',
  '我无一切心 · 何用一切法',
  '若以色见我 · 以音声求我 · 是人行邪道',
  '应无所住而生其心',
  '过去心不可得 · 现在心不可得 · 未来心不可得',
  '一切有为法 · 如梦幻泡影',
  '凡所有相 · 皆是虚妄',
  '若见诸相非相 · 即见如来',
]

/** 调身 · 七支坐法详解 */
export const QIZHI_ZUOFA: Array<{ name: string; desc: string; yi: string; ji: string }> = [
  { name: '一 · 跏趺', desc: '双盘或单盘 · 臀下垫高二寸许', yi: '稳如磐石 · 久坐不累', ji: '不垫高 · 久坐腿麻' },
  { name: '二 · 手印', desc: '结定印 · 右手在下 · 左手在上 · 二大指相触', yi: '气脉通 · 心安', ji: '手紧 · 气滞' },
  { name: '三 · 脊直', desc: '脊骨如串铜钱 · 自然挺直', yi: '气通任督 · 久坐不累', ji: '过直则僵 · 过曲则昏' },
  { name: '四 · 头正', desc: '下颔微收 · 舌抵上腭 · 眼垂帘', yi: '任督相交 · 玉液还丹', ji: '仰头则气散' },
  { name: '五 · 舌抵', desc: '舌轻抵上牙龈', yi: '生津 · 鹊桥通', ji: '用力则上火' },
  { name: '六 · 目', desc: '眼半睁半闭 · 视鼻端白', yi: '神光内敛 · 不昏不散', ji: '全闭易昏 · 全睁易散' },
  { name: '七 · 心息', desc: '心依于息 · 息依于心', yi: '心息相依 · 入定之门', ji: '心随境转' },
]

/** 调息法 */
export const TIAOXI_FAFA: Array<{ name: string; method: string; goal: string }> = [
  { name: '数息法', method: '默数出息 · 一至十 · 反复 · 杂念起则重数', goal: '摄心入定 · 净除杂念' },
  { name: '随息法', method: '不数 · 但觉息出入 · 心随息转', goal: '心息相依 · 自然入定' },
  { name: '止息法', method: '心注于息 · 不随出入 · 若有若无', goal: '止于至善 · 心一境性' },
  { name: '观息法', method: '观息之色 · 形 · 住 · 出入 · 遍满全身', goal: '十六特胜 · 证四禅八定' },
]

/** 调心法 */
export const TIAOXIN_FAFA: Array<{ name: string; method: string; goal: string }> = [
  { name: '止观法', method: '止于一境 · 观其性相 · 寂照双运', goal: '止观双运 · 入三摩地' },
  { name: '参话头', method: '万法归一 · 一归何处 · 起疑情 · 究参不已', goal: '疑团粉碎 · 虚空粉碎 · 大地平沉' },
  { name: '观心法', method: '观此念 · 谁知之 · 念起即觉 · 觉之即空', goal: '识自本心 · 见自本性' },
  { name: '持咒法', method: '持六字大明 · 准提咒 · 心念口诵 · 字字分明', goal: '都摄六根 · 净念相继' },
]

/** 一次完整禅修记录 */
export interface FullChanSession {
  startedAt: number
  durationSec: number
  gongFa: GongFa
  stage: Stage
  stageName: string
  huaTou?: string
  insight: string
  tip: string
  energy: '低' | '中' | '高'
  qiXiang: Array<{ time: number; breath: number; pulse: '稳' | '缓' | '急'; state: '定' | '散' | '明' }>
  summary: string
  advice: string
}

/** 开始一次禅修 */
export function startChanSession(gongFa: GongFa, durationMin: number = 25, huaTou?: string): FullChanSession {
  const durationSec = durationMin * 60
  // 模拟每分钟一个 qi xiang 记录
  const qiXiang: FullChanSession['qiXiang'] = []
  for (let i = 0; i < durationMin; i++) {
    const breath = 14 + Math.floor(Math.sin(i / 2) * 2) // 12-16 次/分
    const pulseIdx = Math.min(2, Math.floor((i / durationMin) * 3))
    const pulse: ('稳' | '缓' | '急')[] = ['缓', '稳', '稳']
    const state: ('定' | '散' | '明')[] = ['散', '定', '明']
    qiXiang.push({
      time: i + 1,
      breath,
      pulse: pulse[pulseIdx],
      state: state[pulseIdx],
    })
  }
  // 阶段评估
  let stage: Stage = 1
  if (durationMin >= 5) stage = 2
  if (durationMin >= 15) stage = 3
  if (durationMin >= 25) stage = 4
  if (durationMin >= 45) stage = 5
  if (durationMin >= 60) stage = 6
  const stageInfo = STAGES[stage - 1]
  // 公案
  if (gongFa === '参话' && !huaTou) {
    huaTou = GONG_AN[Math.floor(Math.random() * GONG_AN.length)]
  }
  // 能量
  const energy: '低' | '中' | '高' = durationMin >= 30 ? '高' : durationMin >= 15 ? '中' : '低'
  const summary = `${durationMin} 分钟 ${gongFa} 修法 · 达 ${stageInfo.name} · 状态 ${qiXiang[qiXiang.length - 1].state} · 息 ${qiXiang[qiXiang.length - 1].pulse}`
  const advice = energy === '高'
    ? '功夫绵密 · 可参深禅 · 日常持诵不辍'
    : energy === '中'
    ? '基础已具 · 当绵密用功 · 不可放逸'
    : '初学者 · 宜从小坐开始 · 日日不断'
  return {
    startedAt: Date.now(),
    durationSec,
    gongFa,
    stage,
    stageName: stageInfo.name,
    huaTou,
    insight: stageInfo.insight,
    tip: stageInfo.tip,
    energy,
    qiXiang,
    summary,
    advice,
  }
}

/** 随机取公案 */
export function randomGongAn(): string {
  return GONG_AN[Math.floor(Math.random() * GONG_AN.length)]
}

/** 获取所有阶段 */
export function getStages() {
  return STAGES
}

export { GONG_AN }
