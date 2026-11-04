/**
 * 台账门面：Web 端唯一的读写入口
 *
 * 背景：v0.4.0 引入了"可选后端模式"，但当时只做了健康探测和设置页的一行字，
 * 实际读写仍然全部落在 localStorage —— 界面显示 "SERVER"，数据却还在浏览器里。
 * 这和我之前批评 API"装饰性匿名"是同一类错误：状态是真的，行为是假的。
 *
 * 这个模块把两条通路收敛到一个接口。页面只 import 这里的 ledger，不再直接
 * 碰 arena/store 或 fetch。切换模式时页面代码零改动，也不存在"某个页面忘了适配"。
 */
import { ref } from 'vue'
import type { AskRequest, BlindMatch, Claim } from '@/contract/reading'
import type { MasterId } from '@/contract/master'
import type { LeaderboardRow } from '@/arena/rating'
import * as localArena from '@/arena/store'
import { backendMode, probeBackend, serverLedger } from './backend'
import { markSeen, sessionContext } from './session'

export type LedgerMode = 'local' | 'server'

/** 当前实际生效的台账模式；页面用它显示状态、门面用它分派 */
export const ledgerMode = ref<LedgerMode>('local')

/** 模式变化时通知页面重新拉数据 */
const listeners = new Set<() => void>()
export function onLedgerChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
function notify(): void {
  for (const listener of listeners) listener()
}

/**
 * 探测并锁定模式。由 main.ts 在启动时调用一次。
 * 返回最终模式，便于调用方决定是否要重新加载数据。
 */
export async function initLedger(): Promise<LedgerMode> {
  const available = await probeBackend()
  ledgerMode.value = available ? 'server' : 'local'
  backendMode.value = ledgerMode.value
  notify()
  return ledgerMode.value
}

const useServer = (): boolean => ledgerMode.value === 'server'

/* ── 读取 ─────────────────────────────────────────────────── */

export async function listMatches(): Promise<BlindMatch[]> {
  return useServer() ? serverLedger.matches() : localArena.listMatches()
}

export async function listClaims(): Promise<Claim[]> {
  return useServer() ? serverLedger.claims() : localArena.listClaims()
}

export async function leaderboard(): Promise<LeaderboardRow[]> {
  if (!useServer()) return localArena.listLeaderboard()
  const session = await serverLedger.session()
  // 服务端只回聚合值；补齐 LeaderboardRow 的其余字段，避免页面出现 undefined
  return session.leaderboard.map((row) => ({
    masterId: row.masterId as MasterId,
    rating: row.rating,
    matches: row.matches,
    wins: 0,
    losses: 0,
    draws: 0,
    claimsResolved: 0,
    claimsHit: 0,
    claimsMiss: 0,
    winRate: null,
    wilsonLower: null,
    claimRate: null,
    tier: row.tier as LeaderboardRow['tier'],
  }))
}

/* ── 写入 ─────────────────────────────────────────────────── */

export interface AskOptions {
  request: AskRequest
  masterIds: [MasterId, MasterId]
}

export async function ask(options: AskOptions): Promise<BlindMatch> {
  // 跨会话轮换：把历史上展示过的断语 id 传给引擎，避免同一句话反复出现
  const seen = sessionContext(0).seen
  if (!useServer()) {
    const { runBlindMatch } = await import('@/arena/readingFlow')
    const match = await runBlindMatch(options.request, options.masterIds, undefined, seen.length ? { seen } : {})
    markSeen(match.answers.flatMap((answer) => answer.statementIds))
    return match
  }
  const match = await serverLedger.ask({
    question: options.request.question,
    domain: options.request.domain,
    ...(options.request.birth ? { birth: { date: options.request.birth.date, time: options.request.birth.time } } : {}),
    save: true,
    reveal: true,
  })
  // 服务端模式同样记录，保证换模式后轮换历史不丢
  markSeen(match.answers.flatMap((answer) => answer.statementIds))
  return match
}

export async function vote(id: string, choice: 'a' | 'b' | 'draw'): Promise<boolean> {
  if (!useServer()) return localArena.recordVote(id, choice)
  try {
    const result = await serverLedger.vote(id, choice)
    return result.ok
  } catch {
    return false
  }
}

export async function resolveClaim(id: string, status: 'hit' | 'miss' | 'unknown'): Promise<boolean> {
  if (!useServer()) return localArena.resolveClaim(id, status)
  try {
    const result = await serverLedger.resolve(id, status)
    return result.ok
  } catch {
    return false
  }
}

/* ── 维护 ─────────────────────────────────────────────────── */

/**
 * 导出。服务端模式下把它的台账也导出成同一份 JSON 形状，
 * 用户无论从哪个模式导出，文件都能互相导入。
 */
export async function exportLedger(): Promise<string> {
  if (!useServer()) return localArena.exportArena()
  const [matches, claims, board] = await Promise.all([serverLedger.matches(), serverLedger.claims(), leaderboard()])
  const stats = Object.fromEntries(
    board.map((row) => [
      row.masterId,
      {
        masterId: row.masterId,
        rating: row.rating,
        matches: row.matches,
        wins: row.wins,
        losses: row.losses,
        draws: row.draws,
        claimsResolved: row.claimsResolved,
        claimsHit: row.claimsHit,
        claimsMiss: row.claimsMiss,
      },
    ]),
  )
  return JSON.stringify({ schema: localArena.SCHEMA_VERSION, exportedFrom: 'server', stats, matches, claims }, null, 2)
}

/** 清空：服务端模式只清浏览器本地，避免误删服务端数据 */
export function resetLocal(): void {
  localArena.resetArena()
}
