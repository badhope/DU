import type { Master } from '@/contract/master'
import type { AskRequest, ChartFact, MasterAnswer } from '@/contract/reading'
import { chat, type ChatRequest } from './client'
import type { AiConfig } from './config'
import { buildSystemPrompt, buildUserPrompt } from './prompt'
import { parseAnswer } from './parse'
import { offlineAnswer } from './offline'
import { retrievePassages } from '@/knowledge/retrieve'
import { verifyCitations } from '@/knowledge/verify'

export async function generateAnswer(
  master: Master,
  request: AskRequest,
  facts: ChartFact[],
  config: AiConfig,
  matchId?: string,
  onDelta?: (delta: string) => void,
): Promise<MasterAnswer> {
  if (!config.apiKey) return offlineAnswer(master, request, facts, Date.now(), matchId)
  let passages = [] as Awaited<ReturnType<typeof retrievePassages>>
  try {
    passages = await retrievePassages(request.question, master.books)
  } catch {
    passages = []
  }
  try {
    const chatRequest: ChatRequest = { config, messages: [{ role: 'system', content: buildSystemPrompt(master, facts, passages) }, { role: 'user', content: buildUserPrompt(request) }] }
    if (onDelta) chatRequest.onDelta = onDelta
    const result = await chat(chatRequest)
    const answer = parseAnswer(result.text, master.id, facts, 'ai', matchId)
    return { ...answer, citations: await verifyCitations(answer.citations) }
  } catch (error) {
    const fallback = offlineAnswer(master, request, facts, Date.now(), matchId)
    return { ...fallback, fallbackReason: error instanceof Error ? `模型不可用，已离线降级：${error.message}` : '模型不可用，已离线降级。' }
  }
}
