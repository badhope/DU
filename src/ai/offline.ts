import type { Master } from '@/contract/master'
import type { AskRequest, ChartFact, MasterAnswer } from '@/contract/reading'
import type { Passage } from '@/knowledge/retrieve'
import type { Situation } from '@/engine/features'
import { hashSeed } from '@/engine/match'
import { resonate } from '@/engine/resonance'
import { parseAnswer } from './parse'

const masterLead: Record<string, string> = {
  ziping: '先看四柱事实层的结构，再谈可以调整的选择。',
  meihua: '这一问的象意在变化，不宜把一个时点说成终局。',
}

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

function inferSituations(question: string): string[] {
  const found = SITUATION_HINTS.filter(([, pattern]) => pattern.test(question)).map(([key]) => key)
  return found.length ? found : ['doubt']
}

function selectedStatements(master: Master, request: AskRequest, facts: ChartFact[], now: number) {
  const at = new Date(now)
  const birthYear = request.birth ? Number(request.birth.date.slice(0, 4)) : undefined
  const items = resonate({
    nowYear: at.getFullYear(),
    domain: request.domain,
    situations: inferSituations(request.question),
    hour: at.getHours(),
    month: at.getMonth() + 1,
    ...(birthYear ? { birthYear } : {}),
  }, { n: 8, seed: hashSeed(`${master.id}|${request.question}|${facts.map((fact) => fact.summary).join('|')}`) })
  const scoped = items.filter((item) => item.st.source?.kind !== 'canon' || master.books.includes(item.st.source.book ?? ''))
  return (scoped.length ? scoped : items).slice(0, 3)
}

export function localAnswer(master: Master, request: AskRequest, facts: ChartFact[], now = Date.now(), matchId?: string, passages: Passage[] = []): MasterAnswer {
  const selected = selectedStatements(master, request, facts, now)
  const relevantFacts = facts.filter((fact) => master.kernel === 'bazi' ? fact.kind === 'bazi' : master.kernel === 'meihua' ? fact.kind === 'meihua' : true)
  const lines = selected.map((item) => `- ${item.st.text}`)
  const staticQuotes = selected.filter((item) => item.st.source?.kind === 'canon' && item.st.source.quote).map((item) => `> 《${item.st.source!.book}》${item.st.source!.loc ?? ''}：「${item.st.source!.quote}」`)
  const localQuotes = passages.slice(0, 3).map((passage) => `> 《${passage.book}》${passage.loc}：「${passage.text}」`)
  const quotes = [...staticQuotes, ...localQuotes].slice(0, 3)
  const due = new Date(now)
  due.setFullYear(due.getFullYear() + 1)
  const dueDate = due.toISOString().slice(0, 10)
  const text = [
    '## 盘',
    ...relevantFacts.flatMap((fact) => [`盘面事实：${fact.summary}`, ...Object.entries(fact.fields).slice(0, 4).map(([key, value]) => `- ${key}：${Array.isArray(value) ? value.join('、') : String(value)}`)]),
    '## 断',
    masterLead[master.id] ?? '先把可核对的输入与行动分开，不把未知说成命定。',
    ...lines,
    '## 据',
    ...(quotes.length ? quotes : ['经验推断：本地语料中没有与本次问题直接匹配的引文。']),
    '## 验',
    `- [${dueDate}] 回看你为这个问题采取的一个具体行动，并记录结果，而不是只记录“感觉准不准”。`,
    '## 行',
    '把下一步缩成一个本周内可完成、可复盘的动作。本站内容仅供自省与文化娱乐，不替代专业意见。',
  ].join('\n')
  const answer = parseAnswer(text, master.id, relevantFacts, 'local', matchId, now)
  const snippetTexts = new Set(passages.map((passage) => passage.text))
  return {
    ...answer,
    citations: answer.citations.map((citation) => ({ ...citation, verification: snippetTexts.has(citation.text) ? 'unverified' as const : 'verified' as const })),
    fallbackReason: '本地规则模式：问题、生辰、盘面与反馈只在本机处理，不上传。',
  }
}
