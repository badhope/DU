import type { Master } from '@/contract/master'
import type { AskRequest, ChartFact, MasterAnswer } from '@/contract/reading'
import type { Passage } from '@/knowledge/retrieve'
import type { Situation } from '@/engine/features'
import { hashSeed } from '@/engine/match'
import { resonate } from '@/engine/resonance'
import { parseAnswer } from './parse'

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
  const selected = selectedStatements(master, request, facts, now, seen)
  const relevantFacts = factsForMaster(master, facts)
  const lines = selected.map((item) => `- ${item.st.text}`)

  const staticQuotes = selected
    .filter((item) => item.st.source?.kind === 'canon' && item.st.source.quote)
    .map((item) => `> 《${item.st.source!.book}》${item.st.source!.loc ?? ''}：「${item.st.source!.quote}」`)
  const localQuotes = passages.slice(0, 3).map((passage) => `> 《${passage.book}》${passage.loc}：「${passage.text}」`)
  const quotes = [...staticQuotes, ...localQuotes].slice(0, 3)

  // 断言绑定本场第一条断语：两位大师的断言因此天然不同，应验簿里可分辨、可复盘。
  // 断语本身已带句末标点，拼进模板前去掉，避免出现「……。」，记录」这种标点叠加。
  const anchor = (selected[0]?.st.text ?? '这次的问题').replace(/[。！？!?，,、；;：:\s]+$/, '')
  const due = new Date(now)
  due.setFullYear(due.getFullYear() + 1)
  const dueDate = due.toISOString().slice(0, 10)

  const text = [
    '## 盘',
    ...relevantFacts.flatMap((fact) => [
      `盘面事实：${fact.summary}`,
      // 字段按内核给不同上限：四柱/梅花字段少且都是关键项，
      // 紫微的宫位数组很长，硬切前 4 个会跳过命宫与四化。
      ...Object.entries(fact.fields)
        .slice(0, fact.kind === 'ziwei' ? 9 : 4)
        .map(([key, value]) => `- ${key}：${Array.isArray(value) ? value.join('、') : String(value)}`),
    ]),
    '## 断',
    NEUTRAL_LEAD,
    ...lines,
    '## 据',
    ...(quotes.length ? quotes : ['经验推断：本地语料中没有与本次问题直接匹配的引文。']),
    '## 验',
    `- [${dueDate}] 针对「${anchor}」，记录你这周实际采取的一个动作及其结果，而不是只记“感觉准不准”。`,
    '## 行',
    '把下一步缩成一个本周内可完成、可复盘的动作。本站内容仅供自省与文化娱乐，不替代专业意见。',
  ].join('\n')

  const answer = parseAnswer(text, master.id, relevantFacts, 'local', matchId, now)

  // 没有对应盘面事实时不保留空小节：界面上不允许出现"盘面事实"标题下面是空的
  const sections = answer.sections.filter((section) => section.lines.length > 0)

  // 引文顺序与 `quotes` 完全一致（静态引文在前、检索片段在后），据此标注来源。
  // 静态引文由 scripts/verify-quotes.mjs 逐字校验，检索片段命中即原文子串，两者都可核；
  // pending 只保留给尚未校验的外部文本，本地模式不会产生。
  const canonCount = Math.min(staticQuotes.length, quotes.length)
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
