import type { Master } from '@/contract/master'
import type { AskRequest, ChartFact, MasterAnswer } from '@/contract/reading'
import type { Passage } from '@/knowledge/retrieve'
import type { Situation } from '@/engine/features'
import { hashSeed } from '@/engine/match'
import { resonate } from '@/engine/resonance'
import { readQuestion } from '@/engine/understand'
import { readBazi, readMeihua, readZiwei, citationFor, type ReadingLine } from '@/engine/voices'
import { adviceFor } from '@/engine/advice'
import type { BaziChart } from '@/core/bazi'
import type { Cast } from '@/core/meihua'
import type { ZiweiChart } from '@/core/ziwei'
import { parseAnswer } from './parse'

/**
 * 盘面字段的中文标签。
 *
 * 为什么需要它：ChartFact.fields 的键是给代码看的（dayMaster、currentDecadal…），
 * 直接拼进正文会让界面出现「- currentDecadal：田宅宫 35–44 岁」这种半中半英的
 * 行。字段是用户要看的内容，键名不是。
 *
 * 未登记的键保留原样而不是丢掉 —— 新增内核时宁可露出一个英文键让人发现，
 * 也不要静默吞掉一条盘面事实。
 */
const FIELD_LABEL: Record<string, string> = {
  date: '公历',
  time: '出生时间',
  dayMaster: '日主',
  dayMasterWuxing: '日主五行',
  pillars: '四柱',
  wuxing: '五行统计',
  luckDirection: '大运方向',
  luckStart: '起运',
  luckCurrent: '当前大运',
  liuNian: '流年',
  solarDate: '公历',
  lunarDate: '农历',
  fourPillars: '四柱',
  timeName: '时辰',
  trueSolarTime: '真太阳时',
  fiveElementsClass: '五行局',
  soul: '命主',
  body: '身主',
  mutagen: '四化',
  currentDecadal: '当前大限',
  palaces: '十二宫',
  majorStars: '主星分布',
  /* 梅花易数：字段名全部要映射，否则界面会露出 ben / hu / bian / moving 这类键 */
  lunar: '农历',
  numbers: '起卦数',
  ben: '本卦',
  hu: '互卦',
  bian: '变卦',
  moving: '动爻',
  ti: '体卦',
  yong: '用卦',
  relation: '体用关系',
  gua: '卦象',
  movingLine: '动爻',
  bodyUse: '体用',
  castAt: '起卦时刻',
}

/** 每个内核保留多少条字段：紫微的宫位数组很长，多留几条才看得到命宫与四化。
 *  梅花的 9 个字段（本互变、体用、关系）全部有意义，少一条就说不清盘。 */
const FIELD_LIMIT: Record<string, number> = { ziwei: 11, bazi: 9, meihua: 9 }

function labelOf(key: string): string {
  return FIELD_LABEL[key] ?? key
}

/**
 * 本地规则回答生成器。
 *
 * 三条硬约束写在这里，不靠文档保证：
 *  1. 盲测期间不得泄露门派身份 —— 所以这里不写任何大师专属开场白，
 *     盘面事实与引文由页面在揭晓前隐藏，而不是靠文案"假装匿名"。
 *  2. 同一场盲测的两位大师不得给出同一句断语 —— 由调用方传入 `seen` 做互斥。
 *  3. 引文的 verification 只反映"这句话是否来自站内分发语料"，
 *     静态引文由 scripts/verify-quotes.mjs 门禁保证，检索片段按构造即可核。
 */

const SITUATION_HINTS: Array<[Situation, RegExp]> = [
  ['transition', /换|转|变化|新机会|离开/],
  ['waiting', /等|结果|消息|回复/],
  ['doubt', /犹豫|不确定|要不要|是否/],
  ['conflict', /争|冲突|矛盾|吵/],
  ['stuck', /卡住|困住|进退/],
  ['job-hunt', /找工作|求职|面试/],
  ['promotion', /升职|晋升|提拔/],
  ['trust', /信任|怀疑|背叛/],
]

/** 盲测期通用开场：不指向任何门派 */
const NEUTRAL_LEAD = '先看可核对的部分，再谈还能调整的部分。'

export function inferSituations(question: string): string[] {
  const found = SITUATION_HINTS.filter(([, pattern]) => pattern.test(question)).map(([key]) => key)
  return found.length ? found : ['doubt']
}

export interface ComposeOptions {
  /** 同一场盲测中已被另一位大师用过的断语 id，用于互斥 */
  seen?: string[]
  /**
   * 完整盘面。给了就走门派读象层（说本门体系里真实存在的东西），
   * 不给则退回旧的共享断语池 —— 后者是兼容路径，不是主路径。
   */
  charts?: { bazi?: BaziChart; meihua?: Cast; ziwei?: ZiweiChart }
}

function selectedStatements(master: Master, request: AskRequest, facts: ChartFact[], now: number, seen: string[]) {
  const at = new Date(now)
  const birthYear = request.birth ? Number(request.birth.date.slice(0, 4)) : undefined
  const seedInput = `${master.id}|${request.question}|${facts.map((fact) => fact.summary).join('|')}`
  const items = resonate(
    {
      nowYear: at.getFullYear(),
      domain: request.domain,
      situations: inferSituations(request.question),
      hour: at.getHours(),
      month: at.getMonth() + 1,
      ...(birthYear ? { birthYear } : {}),
    },
    // 关闭标签去重 + 放大候选池：这里的目标不是"主题多样"，而是给跨答案互斥
    // 留出足够余量。标签去重会在 17 条候选里砍到只剩 5 条，互斥必然失败。
    { n: 24, seed: hashSeed(seedInput), tagDedup: false, ...(seen.length ? { seen } : {}) },
  )
  const inScope = items.filter((item) => item.st.source?.kind !== 'canon' || master.books.includes(item.st.source.book ?? ''))
  const fresh = inScope.filter((item) => !seen.includes(item.st.id))
  return (fresh.length >= 3 ? fresh : inScope.length >= 3 ? inScope : items).slice(0, 3)
}

/** 盘面事实只保留与本门内核匹配的项；没有对应事实时返回空数组，由页面隐藏整节 */
function factsForMaster(master: Master, facts: ChartFact[]): ChartFact[] {
  // 内核 → 事实类型的映射。新增内核时这里必须登记，否则该大师会拿到所有门派的盘面，
  // 既暴露身份也可能引用不属于自己的体系。
  if (master.kernel === 'none') return []
  return facts.filter((fact) => fact.kind === master.kernel)
}

export function localAnswer(
  master: Master,
  request: AskRequest,
  facts: ChartFact[],
  now = Date.now(),
  matchId?: string,
  passages: Passage[] = [],
  options: ComposeOptions = {},
): MasterAnswer {
  const seen = options.seen ?? []
  const relevantFacts = factsForMaster(master, facts)

  /*
   * 主路径：门派读象。
   *
   * 每个门派只解读自己体系里真实存在的结构 —— 子平看十神与大运，
   * 梅花看本互变与体用，紫微看宫位与四化。这是两份回答第一次真正
   * 从不同的东西里长出来，而不是从同一个池子里各抽三句。
   *
   * 没有对应盘面时（比如没填生辰问子平）才退回共享断语池。
   */
  const q = readQuestion(request.question)
  const voice: ReadingLine[] = []
  if (master.kernel === 'bazi' && options.charts?.bazi) {
    voice.push(...readBazi(options.charts.bazi, q))
  } else if (master.kernel === 'meihua' && options.charts?.meihua) {
    voice.push(...readMeihua(options.charts.meihua, q))
  } else if (master.kernel === 'ziwei' && options.charts?.ziwei) {
    voice.push(...readZiwei(options.charts.ziwei, q))
  }

  // 读象不足时用共享池补位；读象已经够 3 条就不再掺通用句
  const needFallback = voice.length < 3
  const selected = needFallback ? selectedStatements(master, request, facts, now, seen) : []
  const fallbackLines = selected
    .slice(0, Math.max(0, 3 - voice.length))
    .map((item) => `- ${item.st.text}`)
  const lines = [
    ...voice.map((v) => `- ${v.text}`),
    ...fallbackLines,
  ]

  const staticQuotes = selected
    .filter((item) => item.st.source?.kind === 'canon' && item.st.source.quote)
    .map((item) => `> 《${item.st.source!.book}》${item.st.source!.loc ?? ''}：「${item.st.source!.quote}」`)
  const localQuotes = passages.slice(0, 3).map((passage) => `> 《${passage.book}》${passage.loc}：「${passage.text}」`)
  /*
   * 读象路径下 selected 为空，staticQuotes 也就为空 —— 这时必须补上本门依据，
   * 否则「依据」一栏会退化成"本地语料中没有匹配的引文"，等于把项目最核心的
   * 可核引文能力弄丢了。引文由 verify-quotes 门禁逐字校验。
   */
  const voiceCitation = citationFor(master.kernel)
  const anchorQuote = voiceCitation
    ? [`> 《${voiceCitation.book}》${voiceCitation.loc}：「${voiceCitation.quote}」`]
    : []
  const quotes = [...anchorQuote, ...staticQuotes, ...localQuotes].slice(0, 3)

  // 断言绑定本场第一条断语：两位大师的断言因此天然不同，应验簿里可分辨、可复盘。
  // 断语本身已带句末标点，拼进模板前去掉，避免出现「……。」，记录」这种标点叠加。
  const anchor = (selected[0]?.st.text ?? '这次的问题').replace(/[。！？!?，,、；;：:\s]+$/, '')
  // 断言期限必须与断言内容匹配。
  // 之前一律设成"一年后"，但正文写的是"记录你这周实际采取的一个动作" ——
  // 用户点"应验"会被拒（未到期），核心闭环第一次使用就是死路。
  // 现在按断言类型给期限：本周行为类 +7 天，阶段观察类 +90 天。
  // 不能用 process.env：这段代码跑在浏览器里，process 未定义（踩过，整页崩）。
  const CLAIM_DAYS = 7
  const due = new Date(now)
  due.setDate(due.getDate() + CLAIM_DAYS)
  const dueDate = due.toISOString().slice(0, 10)

  const text = [
    '## 盘',
    ...relevantFacts.flatMap((fact) => [
      `盘面事实：${fact.summary}`,
      // 每个内核按自己的字段数量留上限：紫微字段多，硬切 4 条会丢掉命宫与四化。
      // 键名必须经过 labelOf：直接输出字段名会让界面出现英文键。
      ...Object.entries(fact.fields)
        .slice(0, FIELD_LIMIT[fact.kind] ?? 4)
        .map(([key, value]) => `- ${labelOf(key)}：${Array.isArray(value) ? value.join('、') : String(value)}`),
    ]),
    '## 断',
    NEUTRAL_LEAD,
    ...lines,
    '## 据',
    ...(quotes.length ? quotes : ['经验推断：本地语料中没有与本次问题直接匹配的引文。']),
    '## 验',
    // 期限写在断言语义里，用户一眼能看到要过多久才能回填
    `- [截止 ${dueDate}] 针对「${anchor}」，记录你这一周实际采取的一个动作及其结果，而不是只记“感觉准不准”。`,
    '## 行',
    /*
     * 领域化建议。原来这里是一句对所有问题都成立的话 ——
     * 「把下一步缩成一个本周内可完成、可复盘的动作」。它放之四海皆准，
     * 也就对任何问题都没用：问「简历怎么改」和「怎么跟伴侣沟通」拿到同一句。
     * 现在按领域给具体动作，换到别的领域去读会明显不对。
     */
    adviceFor(request.domain, q, hashSeed(`${master.id}|${request.question}`)),
    '',
    '本站内容仅供自省与文化娱乐，不构成医疗、法律或投资建议。',
  ].join('\n')

  const answer = parseAnswer(text, master.id, relevantFacts, 'local', matchId, now)

  // 没有对应盘面事实时不保留空小节：界面上不允许出现"盘面事实"标题下面是空的
  const sections = answer.sections.filter((section) => section.lines.length > 0)

  // 引文顺序与 `quotes` 完全一致（静态引文在前、检索片段在后），据此标注来源。
  // 静态引文由 scripts/verify-quotes.mjs 逐字校验，检索片段命中即原文子串，两者都可核；
  // pending 只保留给尚未校验的外部文本，本地模式不会产生。
  /*
   * canon 引文在前，corpus 片段在后 —— 顺序由 quotes 的拼装方式决定。
   * 之前只数 staticQuotes，但 quotes 现在前面还有一条本门依据（anchorQuote），
   * 于是第一条被误标成 corpus，测试当场抓到。
   */
  const canonCount = Math.min(anchorQuote.length + staticQuotes.length, quotes.length)
  return {
    ...answer,
    sections,
    statementIds: selected.map((item) => item.st.id),
    citations: answer.citations.map((citation, index) => ({
      ...citation,
      origin: index < canonCount ? ('canon' as const) : ('corpus' as const),
      verification: 'verified' as const,
    })),
    fallbackReason: '本地规则模式：问题、生辰、盘面与反馈只在本机处理，不上传。',
  }
}
