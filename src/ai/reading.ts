import type { Master } from '@/contract/master'
import type { AskRequest, ChartFact, MasterAnswer } from '@/contract/reading'
import { retrievePassages } from '@/knowledge/retrieve'
import { localAnswer, type ComposeOptions } from './offline'

/**
 * 本地回答组装：先尝试同源语料检索，失败不影响主流程。
 * 语料不可用（离线预览、部署路径错）时仍返回完整回答，只是"依据"退回断语库静态引文。
 */
export async function generateLocalAnswer(
  master: Master,
  request: AskRequest,
  facts: ChartFact[],
  matchId?: string,
  options: ComposeOptions = {},
): Promise<MasterAnswer> {
  let passages: Awaited<ReturnType<typeof retrievePassages>> = []
  try {
    passages = await retrievePassages(request.question, master.books)
  } catch {
    passages = []
  }
  return localAnswer(master, request, facts, Date.now(), matchId, passages, options)
}
