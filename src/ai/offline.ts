import type { Master } from '@/contract/master'
import type { AskRequest, ChartFact, MasterAnswer } from '@/contract/reading'
import { STATEMENTS } from '@/engine/resonance'
import { parseAnswer } from './parse'

const masterLead: Record<string, string> = {
  ziping: '先看事实层的结构，再谈可以调整的选择。',
  meihua: '这一问的象意在变化，不宜把一个时点说成终局。',
}

export function offlineAnswer(master: Master, request: AskRequest, facts: ChartFact[], now = Date.now(), matchId?: string): MasterAnswer {
  const candidates = STATEMENTS.filter((item) => item.domain.includes(request.domain) || item.domain.includes('general')).filter((item) => item.source)
  const selected = candidates.slice(0, 3)
  const lines = selected.map((item) => `- ${item.text}`)
  const quotes = selected.filter((item) => item.source?.kind === 'canon' && item.source.quote).map((item) => `> 《${item.source!.book}》${item.source!.loc ?? ''}：「${item.source!.quote}」`)
  const due = new Date(now)
  due.setFullYear(due.getFullYear() + 1)
  const dueDate = due.toISOString().slice(0, 10)
  const text = [
    '## 盘',
    ...facts.flatMap((fact) => [`${fact.title}：${fact.summary}`, ...Object.entries(fact.fields).slice(0, 4).map(([key, value]) => `- ${key}：${Array.isArray(value) ? value.join('、') : String(value)}`)]),
    '## 断',
    masterLead[master.id] ?? '先把可核对的输入与行动分开，不把未知说成命定。',
    ...lines,
    '## 据',
    ...(quotes.length ? quotes : ['经验推断：本次离线模式未检索到可直接核验的原文。']),
    '## 验',
    `- [${dueDate}] 回看你为这个问题采取的一个具体行动，并记录结果，而不是只记录“感觉准不准”。`,
    '## 行',
    '把下一步缩成一个本周内可完成、可复盘的动作。本站内容仅供自省与文化娱乐，不替代专业意见。',
  ].join('\n')
  return { ...parseAnswer(text, master.id, facts, 'offline', matchId, now), fallbackReason: '未接入模型，使用本地确定性规则与已核断语。' }
}
