/**
 * 跨宿主运行时（Web / CLI / 服务端 / MCP）
 *
 * 这个模块是三种界面之外的唯一"应用层"。它只做三件事：
 *   1. 把请求变成一场盲测（调用与 Web 完全相同的 composeBlindMatch）；
 *   2. 读写台账（通过可注入的存储适配器，浏览器用 localStorage，Node 用 SQLite）；
 *   3. 生成导出报告（复用同一份 report.ts）。
 *
 * 关键约束：这里不允许出现 `document` / `window` / `localStorage`。
 * tests/runtime.spec.ts 会在 Node 环境里跑全套流程，若有人偷偷加了浏览器 API，
 * 测试会直接失败。
 */
import type { BlindMatch, Claim, AskRequest, ChartFact } from '@/contract/reading'
import type { MasterId } from '@/contract/master'
import { MASTERS, ACTIVE_MASTERS } from '@/masters/registry'
import { composeBlindMatch } from '@/arena/readingFlow'
import { type LeaderboardRow } from '@/arena/rating'
import { renderLedgerReport, renderMatchReport } from '@/arena/report'

/** 存储适配器：宿主自己实现，运行时只依赖这个接口 */
export interface LedgerStore {
  listMatches(): BlindMatch[]
  listClaims(): Claim[]
  saveMatch(match: BlindMatch): void
  saveClaims(claims: Claim[]): void
  resolveClaim(id: string, status: 'hit' | 'miss' | 'unknown'): boolean
  reset(): void
  /** 排行榜需要的统计；不同宿主实现方式不同（浏览器算 Elo，服务端可存表） */
  leaderboard(): LeaderboardRow[]
}

export interface AskOptions {
  question: string
  domain?: AskRequest['domain']
  birth?: AskRequest['birth']
  askedAt?: number
  /** 指定两位大师；默认取前两位 active */
  masterIds?: [MasterId, MasterId]
  /** 注入随机源，测试用 */
  random?: () => number
}

/** 生成一场盲测（不落库），供 CLI / MCP 的"只看不存"模式使用 */
export async function ask(options: AskOptions): Promise<BlindMatch> {
  const question = options.question?.trim() ?? ''
  if (question.length < 4) throw new Error('问题至少写 4 个字。')
  if (question.length > 2000) throw new Error('问题最多 2000 字。')

  const ids = options.masterIds ?? (ACTIVE_MASTERS.slice(0, 2).map((m) => m.id) as [MasterId, MasterId])
  const request: AskRequest = {
    question,
    domain: options.domain ?? 'general',
    askedAt: options.askedAt ?? Date.now(),
    ...(options.birth ? { birth: options.birth } : {}),
  }
  return composeBlindMatch(request, ids, undefined, options.random ? { random: options.random } : {})
}

/** 生成并落库 */
export async function askAndRecord(options: AskOptions, store: LedgerStore): Promise<BlindMatch> {
  const match = await ask(options)
  store.saveMatch(match)
  store.saveClaims(match.answers.flatMap((answer) => answer.claims))
  return match
}

export interface SessionView {
  matches: number
  claims: number
  pendingClaims: number
  leaderboard: LeaderboardRow[]
}

export function sessionView(store: LedgerStore): SessionView {
  const claims = store.listClaims()
  return {
    matches: store.listMatches().length,
    claims: claims.length,
    pendingClaims: claims.filter((claim) => claim.status === 'pending').length,
    leaderboard: store.leaderboard(),
  }
}

export function renderMatch(match: BlindMatch): string {
  return renderMatchReport(match)
}

export function renderLedger(claims: Claim[]): string {
  return renderLedgerReport(claims)
}

/** 供 CLI / MCP 枚举可用对象 */
export function catalog() {
  return {
    masters: MASTERS.map((master) => ({
      id: master.id,
      name: master.name,
      school: master.school,
      status: master.status,
      kernel: master.kernel,
      books: master.books,
    })),
    active: ACTIVE_MASTERS.map((master) => master.id),
  }
}

/** 把事实层结果转成人类可读的一行，CLI 与 MCP 共用 */
export function describeFacts(facts: ChartFact[]): string[] {
  return facts.map((fact) => `${fact.title}：${fact.summary}`)
}

export type { BlindMatch, Claim, ChartFact, AskRequest, LeaderboardRow }
