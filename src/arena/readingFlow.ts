import type { MasterId } from '@/contract/master'
import type { AskRequest, BlindMatch, ChartFact, MasterAnswer } from '@/contract/reading'
import { calculateBazi } from '@/core/bazi'
import { calculateMeihua } from '@/core/meihuaFacts'
import { masterById } from '@/masters/registry'
import { generateLocalAnswer } from '@/ai/reading'
import { saveClaims, saveMatch } from './store'

export async function factsForRequest(request: AskRequest): Promise<ChartFact[]> {
  const facts: ChartFact[] = []
  if (request.birth) {
    const bazi = await calculateBazi(request.birth)
    if ('fact' in bazi) facts.push(bazi.fact)
  }
  const meihua = await calculateMeihua(new Date(request.askedAt))
  if ('fact' in meihua) facts.push(meihua.fact)
  return facts
}

async function matchId(request: AskRequest, masterIds: [MasterId, MasterId]): Promise<string> {
  const fingerprint = JSON.stringify({ question: request.question.trim(), domain: request.domain, birth: request.birth ?? null, askedAt: request.askedAt, masterIds })
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return `match-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
  const bytes = await subtle.digest('SHA-256', new TextEncoder().encode(fingerprint))
  const hex = [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `match-${hex}`
}

export async function runBlindMatch(
  request: AskRequest,
  masterIds: [MasterId, MasterId],
  onAnswer?: (masterId: MasterId, answer: MasterAnswer) => void,
): Promise<BlindMatch> {
  if (masterIds[0] === masterIds[1]) throw new Error('本次盲测需要两位不同的大师。')
  const id = await matchId(request, masterIds)
  const facts = await factsForRequest(request)
  const answers: MasterAnswer[] = []
  for (const masterId of masterIds) {
    const master = masterById(masterId)
    if (!master || master.status !== 'active') continue
    const answer = await generateLocalAnswer(master, request, facts, id)
    answers.push(answer)
    onAnswer?.(masterId, answer)
  }
  if (answers.length !== 2) throw new Error('本次盲测需要两位已启用的大师。')
  const match: BlindMatch = { id, request, masterIds, answers: [answers[0]!, answers[1]!], createdAt: request.askedAt }
  saveMatch(match)
  saveClaims(answers.flatMap((answer) => answer.claims))
  return match
}
