/**
 * DU v2 · 工具：梅花易数
 *
 * 两种起卦：干支年月日时占（照邵子起例）与报数占。
 * 排盘部分（本互变 + 体用 + 旺衰）是确定性推导，可复核；
 * 断语部分走共鸣引擎，绝不从卦名硬凑吉凶。
 */
import type { ResultNode, Tone } from '@/contract/result'
import type { ComputeOutcome, SessionContext, Tool, ToolInput } from '@/contract/tool'
import { TIYONG_LABEL, TIYONG_TREND, ZHI, type Wuxing } from '@/core/gua'
import {
  MEIHUA_SOURCE,
  STRENGTH_TEXT,
  castByNumbers,
  castByTime,
  mod6,
  mod8,
  monthSeason,
  tiStrength,
  type Cast,
} from '@/core/meihua'
import { hashSeed } from '@/engine/match'
import { resonate, resonanceNodes } from '@/engine/resonance'
import { SITUATION_LABEL, SITUATIONS, type Domain, type RawContext } from '@/engine/features'

const WUXING_TONE: Record<Wuxing, Tone> = {
  mu: 'mu',
  huo: 'huo',
  tu: 'tu',
  jin: 'jin',
  shui: 'shui',
}

const DOMAIN_OPTIONS = [
  { value: 'career', label: '前程 · 工作' },
  { value: 'love', label: '感情 · 婚姻' },
  { value: 'study', label: '学业 · 考试' },
  { value: 'health', label: '身体 · 状态' },
  { value: 'wealth', label: '钱财 · 交易' },
  { value: 'family', label: '家人 · 宅内' },
  { value: 'general', label: '说不清 · 整体' },
]

const num = (v: unknown): number | undefined => {
  if (v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** 排盘区：数 → 卦 → 体用 → 旺衰，每一步都把算式写出来 */
function paiPan(cast: Cast, seasonLabel: string, zhiMonth: number): ResultNode {
  const { upper, lower, moving, ben, hu, bian, ti, yong } = cast
  const trend = TIYONG_TREND[cast.relation]
  const strength = tiStrength(ti, monthSeason(zhiMonth))

  const sum = cast.numbers.join(' + ')
  const formula =
    cast.numbers.length === 4
      ? `上卦 =（${cast.numbers.slice(0, 3).join(' + ')}）= ${cast.numbers.slice(0, 3).reduce((a, b) => a + b, 0)}，除八余 ${mod8(cast.numbers.slice(0, 3).reduce((a, b) => a + b, 0))} → ${upper.name}；下卦 = 总数 ${cast.total}，除八余 ${mod8(cast.total)} → ${lower.name}；动爻 = ${cast.total} 除六余 ${mod6(cast.total)}`
      : `上卦 = ${cast.numbers[0]} 除八余 ${mod8(cast.numbers[0]!)} → ${upper.name}；下卦 = ${cast.numbers[1]} 除八余 ${mod8(cast.numbers[1]!)} → ${lower.name}；动爻 = ${cast.total} 除六余 ${mod6(cast.total)}`

  return {
    kind: 'stack',
    children: [
      {
        kind: 'gua',
        title: `本卦 · ${ben.name}`,
        subtitle: `${upper.symbol}${lower.symbol} 动爻在第${moving}爻`,
        lines: cast.lines.map((v, i) => ({
          position: i + 1,
          yang: v === 1,
          moving: i + 1 === moving,
          left: i < 3 ? '下卦' : '上卦',
          right: i + 1 === moving ? '动' : '',
        })),
      },
      {
        kind: 'grid',
        columns: 3,
        cells: [
          { label: '本卦', value: ben.name, sub: '现下之势', tone: 'info' },
          { label: '互卦', value: hu.name, sub: '过程之中', tone: 'default' },
          { label: '变卦', value: bian.name, sub: '末后之期', tone: 'warn' },
        ],
      },
      {
        kind: 'kv',
        items: [
          { label: '上卦', value: `${upper.name}（${upper.nature}·${upper.wuxing}）` },
          { label: '下卦', value: `${lower.name}（${lower.nature}·${lower.wuxing}）` },
          { label: '体', value: `${ti.name} · ${ti.wuxing}`, sub: '为己身之兆', tone: WUXING_TONE[ti.wuxing] },
          { label: '用', value: `${yong.name} · ${yong.wuxing}`, sub: '为应事之端', tone: WUXING_TONE[yong.wuxing] },
          { label: '体用', value: TIYONG_LABEL[cast.relation], tone: trend.tone },
          { label: '体卦得令', value: STRENGTH_TEXT[strength].slice(0, 12), sub: seasonLabel },
        ],
      },
      { kind: 'text', lines: [`起卦数：${sum}（${formula}）`] },
      {
        kind: 'note',
        text: `势：${trend.text}。这是体用五行关系的直接推论，不是对具体事件的预言。`,
        tone: trend.tone,
      },
    ],
  }
}

async function compute(input: ToolInput, session?: SessionContext): Promise<ComputeOutcome> {
  // 只在真要排盘时载入农历库；页面不打开本工具就不下载这块
  const { Solar } = await import('lunar-typescript')
  const mode = String(input.mode ?? 'time')
  const domain = String(input.domain ?? 'general') as Domain
  const situations = Array.isArray(input.situations) ? (input.situations as string[]) : []
  const birthYear = num(input.birthYear)

  const now = input.date ? new Date(String(input.date) + 'T' + String(input.time ?? '12:00')) : new Date()
  if (Number.isNaN(now.getTime())) return { error: '日期或时间不合法。' }

  let cast: Cast
  let lunarDesc: string
  const sol = Solar.fromDate(now)
  const lun = sol.getLunar()
  // 梅花起例用地支序数：子=1…亥=12；lunar 的 index 自 0 起
  const yearZhi = lun.getYearZhiIndex() + 1
  const dayZhi = lun.getTimeZhiIndex() + 1
  const zhiMonth = lun.getMonthZhiIndex() + 1
  const monthNum = Math.abs(lun.getMonth())
  const dayNum = lun.getDay()

  if (mode === 'number') {
    const a = num(input.numA)
    const b = num(input.numB)
    if (!a || !b || a < 1 || b < 1) return { error: '报数占需两个正整数。' }
    cast = castByNumbers(a, b)
    lunarDesc = `报数 ${a}、${b}（起卦时刻 ${lun.toString()} ${ZHI[dayZhi - 1]}时）`
  } else {
    cast = castByTime(yearZhi, monthNum, dayNum, dayZhi)
    lunarDesc = `农历${lun.getYearInGanZhi()}年${lun.getMonthInChinese()}月${lun.getDayInChinese()}日 ${ZHI[dayZhi - 1]}时（年支${yearZhi}、月${monthNum}、日${dayNum}、时支${dayZhi}）`
  }

  const seasonLabel = `月支${ZHI[zhiMonth - 1]}，旺令按《卷一·卦氣旺》`
  const hour = now.getHours()

  const ctx: RawContext = {
    nowYear: now.getFullYear(),
    domain,
    situations,
    hour,
    month: now.getMonth() + 1,
    ...(birthYear !== undefined ? { birthYear } : {}),
    ...(session ? { visitCount: session.visitCount } : {}),
    ...(session?.lastDomains.length ? { lastDomains: session.lastDomains } : {}),
    ...(session?.resonatedTags.length ? { resonatedTags: session.resonatedTags } : {}),
  }

  const items = resonate(ctx, {
    n: 4,
    // 种子 = 输入本身 + 第几批 + 卦象：同一卦同一批必然同一结果，可分享可回归
    seed: hashSeed(`${JSON.stringify(ctx)}|${session?.round ?? 0}|${cast.ben.name}|${cast.moving}`),
    ...(session?.seen.length ? { seen: session.seen } : {}),
  })

  const body: ResultNode[] = [
    paiPan(cast, seasonLabel, zhiMonth),
    { kind: 'section', title: '共鸣断语', hint: '带出处与适用范围', children: resonanceNodes(items) },
    {
      kind: 'note',
      text: `起例与体用出自《${MEIHUA_SOURCE.book}》${MEIHUA_SOURCE.qili}、${MEIHUA_SOURCE.tiyong}。占测用于自省与娱乐，不作为医疗、法律、投资依据。`,
    },
  ]

  return {
    title: `梅花易数 · ${cast.ben.name}`,
    summary: lunarDesc,
    body,
    feedback: items.map((m) => ({
      id: m.st.id,
      text: m.st.text,
      ...(m.st.tags?.[0] ? { tag: m.st.tags[0] } : {}),
    })),
  }
}

export const meihuaTool: Tool = {
  id: 'meihua',
  name: '梅花易数',
  latin: 'PLUM',
  category: 'buzhan',
  blurb: '时间或两个数起卦，本互变三卦 + 体用生克，断语全部标出处。',
  method:
    '年月日时占照《梅花易数·卷一》邵子起例：年支序数加农历月、日为上卦，再加时支为下卦，总数除六定动爻；动爻所在之卦为用，不动者为体，体用五行关系出自《卷二·体用总诀》。断语由共鸣引擎按你填的真实信息挑选，每条附带人群适用率。',
  fields: [
    {
      key: 'mode',
      label: '起卦方式',
      type: 'select',
      default: 'time',
      options: [
        { value: 'time', label: '年月日时占（用当前或指定时刻）' },
        { value: 'number', label: '报数占（两个正整数）' },
      ],
    },
    { key: 'date', label: '日期', type: 'date', hint: '留空 = 此刻' },
    { key: 'time', label: '时刻', type: 'time', hint: '留空 = 此刻；用于定时辰' },
    { key: 'numA', label: '第一个数', type: 'number', min: 1, max: 999, hint: '报数占用' },
    { key: 'numB', label: '第二个数', type: 'number', min: 1, max: 999, hint: '报数占用' },
    {
      key: 'domain',
      label: '想问哪方面',
      type: 'select',
      required: true,
      default: 'general',
      options: DOMAIN_OPTIONS,
      hint: '这是引擎最主要也唯一必用的信号——它决定断语的取舍。',
    },
    {
      key: 'situations',
      label: '此刻的处境（可多选）',
      type: 'multi',
      options: SITUATIONS.map((s) => ({ value: s, label: SITUATION_LABEL[s] })),
      hint: '只勾真的。勾得越少，引擎越可能告诉你"信号不足"而不是硬编一句。',
    },
    { key: 'birthYear', label: '出生年', type: 'number', min: 1900, max: 2100, hint: '仅用于本地推算年龄段，不上传' },
  ],
  compute,
}
