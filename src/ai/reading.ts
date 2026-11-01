import type { Master } from '@/contract/master'
import type { AskRequest, ChartFact, MasterAnswer } from '@/contract/reading'
import { retrievePassages } from '@/knowledge/retrieve'
import { localAnswer } from './offline'

export async function generateLocalAnswer(
  master: Master,
  request: AskRequest,
  facts: ChartFact[],
  matchId?: string,
): Promise<MasterAnswer> {
  let passages = [] as Awaited<ReturnType<typeof retrievePassages>>
  try {
    passages = await retrievePassages(request.question, master.books)
  } catch {
    passages = []
  }
  return localAnswer(master, request, facts, Date.now(), matchId, passages)
}
