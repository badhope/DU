import type { MasterId } from '@/contract/master'
import type { AskRequest, BlindMatch, ChartFact, MasterAnswer } from '@/contract/reading'
import { calculateBazi } from '@/core/bazi'
import { calculateMeihua } from '@/core/meihuaFacts'
import { masterById } from '@/masters/registry'
import { generateAnswer } from '@/ai/reading'
import type { AiConfig } from '@/ai/config'
import { hashSeed } from '@/engine/match'
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

function matchId(request: AskRequest, masterIds: [MasterId, MasterId]): string {
  const fingerprint = JSON.stringify({ question: request.question.trim(), domain: request.domain, birth: request.birth ?? null, askedAt: request.askedAt, masterIds })
  return `match-${hashSeed(fingerprint).toString(16)}`
}

export async function runBlindMatch(
  request: AskRequest,
  masterIds: [MasterId, MasterId],
  config: AiConfig,
  onAnswer?: (masterId: MasterId, answer: MasterAnswer) => void,
): Promise<BlindMatch> {
  const id = matchId(request, masterIds)
  const facts = await factsForRequest(request)
  const answers: MasterAnswer[] = []
  for (const masterId of masterIds) {
    const master = masterById(masterId)
    if (!master || master.status !== 'active') continue
    const answer = await generateAnswer(master, request, facts, config, id)
    answers.push(answer)
    onAnswer?.(masterId, answer)
  }
  if (answers.length !== 2) throw new Error('本次盲测需要两位已启用的大师。')
  const match: BlindMatch = { id, request, masterIds, answers: [answers[0]!, answers[1]!], createdAt: request.askedAt }
  saveMatch(match)
  saveClaims(answers.flatMap((answer) => answer.claims))
  return match
}
