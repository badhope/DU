import type { MasterId } from '@/contract/master'
import type { AskRequest, BlindMatch, ChartFact, MasterAnswer } from '@/contract/reading'
import { calculateBazi } from '@/core/bazi'
import { calculateMeihua } from '@/core/meihuaFacts'
import { calculateZiwei } from '@/core/ziwei'
import { checkSafety, isBlocking } from '@/core/safety'
import { masterById } from '@/masters/registry'
import { generateLocalAnswer } from '@/ai/reading'
import { saveClaims, saveMatch } from './store'

/**
 * 取盘面事实：有生辰才排八字，梅花永远按时辰起卦。任一内核失败不阻断另一路。
 *
 * 注意一个刻意的取舍：没有生辰时这里只返回梅花的卦象，子平那边没有盘面。
 * 这会让两份回答"可核的东西"不对等 —— 但这是真实的能力边界，不是缺陷：
 * 没有出生时间就排不出四柱，假装能排才是欺骗。界面在揭晓后会把这一点
 * 直接说清楚（见 AnswerCard 的"盘面事实"缺省提示）。
 */
export async function factsForRequest(request: AskRequest): Promise<ChartFact[]> {
  const tasks: Array<Promise<ChartFact | null>> = []
  if (request.birth) {
    // 有生辰才能排的两套：四柱与紫微。任一失败不拖累另一套。
    tasks.push(calculateBazi(request.birth).then((result) => ('fact' in result ? result.fact : null)))
    tasks.push(calculateZiwei(request.birth).then((result) => ('fact' in result ? result.fact : null)))
  }
  // 梅花只依赖提问时刻，永远可用
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

/** 安全网关拦截时抛出；调用方按这个类型给出求助卡片，而不是普通错误提示 */
export class SafetyBlockError extends Error {
  level: string
  constructor(message: string, level: string) {
    super(message)
    this.name = 'SafetyBlockError'
    this.level = level
  }
}

export interface BlindMatchOptions {
  /** 注入确定性随机源，测试用；生产默认 Math.random */
  random?: () => number
  /**
   * 跨会话已展示过的断语 id。
   *
   * 盲测内部本来就有"同场互斥"，但那只在一次调用内有效：今天问过的问题，
   * 明天再问会原样重复。把历史 seen 传进来，引擎会降权（match.ts 里 -0.25），
   * 既不会立刻复读，也不会因为完全排除而导致句库耗尽。
   */
  seen?: string[]
}

/**
 * 纯计算：生成一场盲测，不写任何存储。
 *
 * 浏览器端在拿到结果后再 saveMatch/saveClaims；CLI 与服务端直接消费返回值。
 * 这样同一份盲测逻辑在三种宿主里跑的是同一段代码，不存在"网页版和命令行版
 * 算出来不一样"的可能。
 */
export async function composeBlindMatch(
  request: AskRequest,
  masterIds: [MasterId, MasterId],
  onAnswer?: (masterId: MasterId, answer: MasterAnswer) => void,
  options: BlindMatchOptions = {},
): Promise<BlindMatch> {
  // 安全网关必须排在最前面：命中危机词就完全不生成内容，
  // 不排盘、不选断语、不写断言 —— 对一个有自杀念头的人说"你在等一个不用负责的理由"
  // 是不可接受的输出，宁可少算一卦。
  const verdict = checkSafety(request.question)
  if (isBlocking(verdict)) throw new SafetyBlockError(verdict.message ?? '', verdict.level)

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
    // 同场互斥 + 跨会话历史合并去重
    const seen = [...new Set([...usedStatements, ...(options.seen ?? [])])]
    const answer = await generateLocalAnswer(master, request, facts, id, { seen })
    usedStatements.push(...answer.statementIds)
    answers.push(answer)
    onAnswer?.(masterId, answer)
  }
  if (answers.length !== 2) throw new Error('本次盲测需要两位已启用的大师。')

  return { id, request, masterIds: displayIds, answers: [answers[0]!, answers[1]!], createdAt: request.askedAt }
}

/** 浏览器入口：计算 + 写入本机存储 */
export async function runBlindMatch(
  request: AskRequest,
  masterIds: [MasterId, MasterId],
  onAnswer?: (masterId: MasterId, answer: MasterAnswer) => void,
  options: BlindMatchOptions = {},
): Promise<BlindMatch> {
  const match = await composeBlindMatch(request, masterIds, onAnswer, options)
  saveMatch(match)
  saveClaims(match.answers.flatMap((answer) => answer.claims))
  return match
}
