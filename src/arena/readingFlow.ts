import type { MasterId } from '@/contract/master'
import type { AskRequest, BlindMatch, ChartFact, MasterAnswer } from '@/contract/reading'
import { calculateBazi } from '@/core/bazi'
import { calculateMeihua } from '@/core/meihuaFacts'
import { masterById } from '@/masters/registry'
import { generateLocalAnswer } from '@/ai/reading'
import { saveClaims, saveMatch } from './store'

/** 取盘面事实：有生辰才排八字，梅花永远按时辰起卦。任一内核失败不阻断另一路。 */
export async function factsForRequest(request: AskRequest): Promise<ChartFact[]> {
  const tasks: Array<Promise<ChartFact | null>> = []
  if (request.birth) {
    tasks.push(calculateBazi(request.birth).then((result) => ('fact' in result ? result.fact : null)))
  }
  tasks.push(calculateMeihua(new Date(request.askedAt)).then((result) => ('fact' in result ? result.fact : null)))
  const settled = await Promise.all(tasks)
  return settled.filter((fact): fact is ChartFact => fact !== null)
}

async function matchId(request: AskRequest, masterIds: [MasterId, MasterId]): Promise<string> {
  const fingerprint = JSON.stringify({ question: request.question.trim(), domain: request.domain, birth: request.birth ?? null, askedAt: request.askedAt, masterIds })
  const subtle = globalThis.crypto?.subtle
  if (!subtle) return `match-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
  const bytes = await subtle.digest('SHA-256', new TextEncoder().encode(fingerprint))
  const hex = [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `match-${hex}`
}

/**
 * 盲测匿名性靠两条保证，缺一不可：
 *  1. 甲乙位置随机（`shuffleForBlind`），固定顺序会让用户记住"甲永远是子平"；
 *  2. 先答的大师把用过的断语 id 传给后答的（`seen`），避免两份答案撞句。
 */
export function shuffleForBlind<T>(items: [T, T], random: () => number = Math.random): [T, T] {
  return random() < 0.5 ? [items[0], items[1]] : [items[1], items[0]]
}

export interface BlindMatchOptions {
  /** 注入确定性随机源，测试用；生产默认 Math.random */
  random?: () => number
}

export async function runBlindMatch(
  request: AskRequest,
  masterIds: [MasterId, MasterId],
  onAnswer?: (masterId: MasterId, answer: MasterAnswer) => void,
  options: BlindMatchOptions = {},
): Promise<BlindMatch> {
  if (masterIds[0] === masterIds[1]) throw new Error('本次盲测需要两位不同的大师。')

  // 展示顺序随机，但 matchId 必须对同一对大师稳定，否则同一请求重放会得到不同 id
  const displayIds = shuffleForBlind(masterIds, options.random ?? Math.random)
  const id = await matchId(request, masterIds)
  const facts = await factsForRequest(request)

  const answers: MasterAnswer[] = []
  const usedStatements: string[] = []
  for (const masterId of displayIds) {
    const master = masterById(masterId)
    if (!master || master.status !== 'active') continue
    const answer = await generateLocalAnswer(master, request, facts, id, { seen: usedStatements })
    usedStatements.push(...answer.statementIds)
    answers.push(answer)
    onAnswer?.(masterId, answer)
  }
  if (answers.length !== 2) throw new Error('本次盲测需要两位已启用的大师。')

  const match: BlindMatch = { id, request, masterIds: displayIds, answers: [answers[0]!, answers[1]!], createdAt: request.askedAt }
  saveMatch(match)
  saveClaims(answers.flatMap((answer) => answer.claims))
  return match
}
