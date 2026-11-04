import type { MasterId } from '@/contract/master'
import type { BlindMatch, Claim, ClaimStatus, VoteChoice } from '@/contract/reading'
import { MASTERS } from '@/masters/registry'
import { emptyStats, leaderboardRows, updateElo, type LeaderboardRow, type MasterStats } from './rating'

/**
 * 本机台账：唯一持久化入口。
 *
 * 设计约束：
 *  1. 读写只在这里发生，页面不直接碰 localStorage；
 *  2. 反序列化走完整的逐层校验，任何一层不合法就整体拒绝，绝不用半截数据覆盖用户记录；
 *  3. 模块初始化必须放在所有校验辅助函数之后 —— 之前的版本把 `readState()` 写在
 *     常量辅助函数之前，触发 TDZ 错误被 catch 吞掉，导致每次刷新都静默清空台账。
 */

const KEY = 'tianji.arena.v1'
/** 导出文件带版本号，便于未来迁移；读取时对旧文件保持宽容（版本号可缺省） */
export const SCHEMA_VERSION = 2
/** 存储上限：防止单个用户把 localStorage 写爆（约 5 MB 配额） */
const MAX_MATCHES = 100
const MAX_CLAIMS = 300

export interface ArenaState {
  stats: Record<MasterId, MasterStats>
  matches: BlindMatch[]
  claims: Claim[]
}

function initialState(): ArenaState {
  return {
    stats: Object.fromEntries(MASTERS.map((master) => [master.id, emptyStats(master.id)])) as Record<MasterId, MasterStats>,
    matches: [],
    claims: [],
  }
}

/* ── 校验辅助 ─────────────────────────────────────────────── */

/** 与 contract/reading.ts 的 ChartFact['kind'] 一一对应；types 会在编译期提醒漂移 */
const FACT_KINDS = ['bazi', 'meihua', 'ziwei'] as const

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const isString = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max

function isMasterId(value: unknown): value is MasterId {
  return MASTERS.some((master) => master.id === value)
}

function validStats(value: unknown, master: MasterId): boolean {
  if (!isObject(value)) return false
  const stats = value as Partial<MasterStats>
  if (stats.masterId !== master) return false
  if (!isFiniteNumber(stats.rating)) return false
  const counters = [stats.matches, stats.wins, stats.losses, stats.draws, stats.claimsResolved, stats.claimsHit, stats.claimsMiss]
  if (!counters.every(isCount)) return false
  if (stats.wins! + stats.losses! + stats.draws! > stats.matches!) return false
  return stats.claimsHit! + stats.claimsMiss! <= stats.claimsResolved!
}

/** 引文、小节、断言都来自本机生成，但导入文件是外部输入：逐层校验 */
function validCitation(value: unknown): boolean {
  if (!isObject(value)) return false
  return (
    isString(value.book, 80) &&
    isString(value.text, 4000) &&
    (value.loc === undefined || (typeof value.loc === 'string' && value.loc.length <= 200)) &&
    ['canon', 'corpus'].includes(String(value.origin)) &&
    ['verified', 'unverified', 'pending'].includes(String(value.verification))
  )
}

function validSection(value: unknown): boolean {
  if (!isObject(value)) return false
  return (
    ['pan', 'duan', 'ju', 'yan', 'xing'].includes(String(value.key)) &&
    typeof value.title === 'string' &&
    Array.isArray(value.lines) &&
    value.lines.every((line) => typeof line === 'string' && line.length <= 8000)
  )
}

function validFact(value: unknown): boolean {
  if (!isObject(value)) return false
  return (
    // 白名单必须与 ChartFact['kind'] 保持同步。漏一个的后果不是"这条不显示"，
    // 而是整份台账被判定为非法，刷新后静默回退到空状态 —— 真实踩过。
    (FACT_KINDS as readonly string[]).includes(String(value.kind)) &&
    typeof value.title === 'string' &&
    typeof value.summary === 'string' &&
    isObject(value.fields)
  )
}

function validClaim(value: unknown): boolean {
  if (!isObject(value)) return false
  return (
    typeof value.id === 'string' &&
    value.id.length <= 300 &&
    isMasterId(value.masterId) &&
    isString(value.text, 4000) &&
    isFiniteNumber(value.dueAt) &&
    isFiniteNumber(value.createdAt) &&
    ['pending', 'hit', 'miss', 'unknown'].includes(String(value.status))
  )
}

function validAnswer(value: unknown, masterId: MasterId): boolean {
  if (!isObject(value)) return false
  if (value.masterId !== masterId || value.mode !== 'local') return false
  if (typeof value.id !== 'string' || typeof value.text !== 'string' || !isFiniteNumber(value.generatedAt)) return false
  if (!Array.isArray(value.sections) || !value.sections.every(validSection)) return false
  if (!Array.isArray(value.facts) || !value.facts.every(validFact)) return false
  if (!Array.isArray(value.citations) || !value.citations.every(validCitation)) return false
  if (!Array.isArray(value.claims) || !value.claims.every(validClaim)) return false
  if (value.statementIds !== undefined) {
    if (!Array.isArray(value.statementIds) || !value.statementIds.every((id) => typeof id === 'string')) return false
  }
  return value.fallbackReason === undefined || typeof value.fallbackReason === 'string'
}

function validMatch(value: unknown): boolean {
  if (!isObject(value)) return false
  if (!isString(value.id, 200)) return false
  if (!isObject(value.request)) return false
  const request = value.request
  if (typeof request.question !== 'string' || request.question.length > 2000) return false
  if (typeof request.domain !== 'string') return false
  if (!isFiniteNumber(request.askedAt)) return false
  if (request.birth !== undefined) {
    if (!isObject(request.birth)) return false
    if (typeof request.birth.date !== 'string' || typeof request.birth.time !== 'string') return false
  }
  if (!Array.isArray(value.masterIds) || value.masterIds.length !== 2) return false
  const ids = value.masterIds
  if (!ids.every(isMasterId) || ids[0] === ids[1]) return false
  if (value.vote !== undefined && !['a', 'b', 'draw'].includes(String(value.vote))) return false
  if (value.votedAt !== undefined && !isFiniteNumber(value.votedAt)) return false
  if (!Array.isArray(value.answers) || value.answers.length !== 2) return false
  return value.answers.every((answer, index) => validAnswer(answer, ids[index] as MasterId))
}

function validImportedState(value: unknown): value is ArenaState {
  if (!isObject(value)) return false
  if (!isObject(value.stats) || !Array.isArray(value.matches) || !Array.isArray(value.claims)) return false
  if (!MASTERS.every((master) => validStats((value.stats as Record<string, unknown>)[master.id], master.id))) return false
  if (!value.matches.every(validMatch)) return false
  return value.claims.every(validClaim)
}

/* ── 状态 ───────────────────────────────────────────────── */

/**
 * 读不出合法状态时，把原始字节搬到隔离 key 再回退。
 *
 * 这是踩过坑之后加的：之前注释写着"原始数据未被覆盖"，但下一次 persist
 * 就会把整份台账写成空状态 —— 用户看到的就是"刷新之后记录全没了"。
 * 真正能保护数据的是先备份，不是一句注释。
 */
const QUARANTINE_KEY = 'tianji.arena.quarantine'

function quarantine(raw: string, reason: string): void {
  try {
    const entry = { at: Date.now(), reason, raw: raw.slice(0, 200_000) }
    localStorage.setItem(QUARANTINE_KEY, JSON.stringify(entry))
    console.warn(`[arena] 台账结构不合法（${reason}），已备份到 ${QUARANTINE_KEY} 并回退到空状态。`)
  } catch {
    // 备份也失败（配额满）：至少不要抛出，让应用还能用
  }
}

function readState(): ArenaState {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    const parsed: unknown = JSON.parse(raw)
    if (validImportedState(parsed)) return parsed
    quarantine(raw, '结构校验未通过')
    return initialState()
  } catch (error) {
    if (raw) quarantine(raw, error instanceof Error ? error.message : '解析失败')
    return initialState()
  }
}

/** 隔离区里是否有备份；设置页用它提示用户"升级后可恢复" */
export function hasQuarantinedData(): boolean {
  try {
    return localStorage.getItem(QUARANTINE_KEY) !== null
  } catch {
    return false
  }
}

// 必须位于所有函数声明之后：readState → validImportedState 会调用上面的常量辅助函数
let state: ArenaState = readState()

/**
 * 最近一次持久化是否失败。
 *
 * localStorage 是同步 API，配额满时 setItem 直接抛 QuotaExceededError。
 * 之前这里静默吞掉，结果是用户以为投了票、其实什么都没存 —— 刷新就没了。
 * 现在记录状态并广播事件，由界面提示"先导出再清理"，而不是假装成功。
 */
export type PersistStatus = 'ok' | 'quota' | 'blocked'
let persistStatus: PersistStatus = 'ok'
let persistListeners: Array<(status: PersistStatus) => void> = []

export function getPersistStatus(): PersistStatus {
  return persistStatus
}

/** 订阅持久化失败事件；返回取消订阅函数 */
export function onPersistStatus(listener: (status: PersistStatus) => void): () => void {
  persistListeners.push(listener)
  return () => {
    persistListeners = persistListeners.filter((item) => item !== listener)
  }
}

function setPersistStatus(next: PersistStatus): void {
  if (persistStatus === next) return
  persistStatus = next
  for (const listener of persistListeners) {
    try {
      listener(next)
    } catch {
      /* 监听器自身出错不影响主流程 */
    }
  }
}

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    setPersistStatus('ok')
  } catch (error) {
    // 按错误类型区分：配额满 vs 存储被禁用（隐私模式）
    const name = error instanceof Error ? error.name : ''
    const quota = name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED'
    setPersistStatus(quota ? 'quota' : 'blocked')
  }
}

/* ── 读 ─────────────────────────────────────────────────── */

export function getArenaState(): ArenaState {
  return structuredClone(state)
}

export function replaceArenaState(next: ArenaState): void {
  state = next
  persist()
}

export function listLeaderboard(): LeaderboardRow[] {
  const activeIds = new Set(MASTERS.filter((master) => master.status === 'active').map((master) => master.id))
  return leaderboardRows(Object.values(state.stats).filter((stats) => activeIds.has(stats.masterId)))
}

export function listMatches(): BlindMatch[] {
  return structuredClone(state.matches)
}

export function listClaims(): Claim[] {
  return structuredClone(state.claims)
}

/* ── 写 ─────────────────────────────────────────────────── */

export function saveMatch(match: BlindMatch): void {
  if (state.matches.some((item) => item.id === match.id)) return
  state.matches = [match, ...state.matches].slice(0, MAX_MATCHES)
  persist()
}

export function recordVote(matchId: string, vote: VoteChoice): boolean {
  const match = state.matches.find((item) => item.id === matchId)
  if (!match || match.vote) return false
  const [aId, bId] = match.masterIds
  const a = state.stats[aId]
  const b = state.stats[bId]
  if (!a || !b) return false
  const outcome = vote === 'a' ? 'win' : vote === 'b' ? 'loss' : 'draw'
  const [nextA, nextB] = updateElo(a, b, outcome)
  state.stats[aId] = nextA
  state.stats[bId] = nextB
  match.vote = vote
  match.votedAt = Date.now()
  persist()
  return true
}

export function saveClaims(claims: Claim[]): void {
  const existing = new Set(state.claims.map((claim) => claim.id))
  const fresh = claims.filter((claim) => !existing.has(claim.id))
  if (!fresh.length) return
  state.claims = [...fresh, ...state.claims].slice(0, MAX_CLAIMS)
  persist()
}

export function resolveClaim(id: string, status: Exclude<ClaimStatus, 'pending'>): boolean {
  const claim = state.claims.find((item) => item.id === id)
  if (!claim || claim.status !== 'pending') return false
  // 到期前不得判定为应验/未验：这是应验率可信度的底线
  if (status !== 'unknown' && Date.now() < claim.dueAt) return false
  claim.status = status
  const stats = state.stats[claim.masterId]
  if (!stats) return false
  if (status !== 'unknown') {
    stats.claimsResolved += 1
    if (status === 'hit') stats.claimsHit += 1
    if (status === 'miss') stats.claimsMiss += 1
  }
  persist()
  return true
}

export function resetArena(): void {
  state = initialState()
  persist()
}

/* ── 导入导出 ───────────────────────────────────────────── */

export function exportArena(): string {
  return JSON.stringify({ schema: SCHEMA_VERSION, ...state }, null, 2)
}

/**
 * 导入文件的版本迁移。
 *
 * v1 → v2 的唯一变化是 ChartFact.kind 增加了 'ziwei'，数据结构本身没动，
 * 所以迁移是恒等的 —— 但这一步必须存在：等到真的改了结构才补迁移，
 * 旧文件就已经导不进来了。
 *
 * 返回 null 表示版本无法处理（比当前版本更新），应当拒绝而不是猜测。
 */
export function migrate(raw: unknown): { state: unknown; from: number } | null {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as { schema?: unknown }
  // 缺省 schema 视为 v1（早期导出没有版本字段）
  const from = typeof candidate.schema === 'number' ? candidate.schema : 1
  if (from > SCHEMA_VERSION) return null
  if (from === 2) return { state: raw, from }
  if (from === 1) {
    // v1 → v2：无结构变化，仅标记版本
    return { state: { ...candidate, schema: 2 }, from }
  }
  return null
}

export function importArena(raw: string): { ok: true; from: number } | { ok: false; reason: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, reason: '文件不是合法 JSON。' }
  }

  const migrated = migrate(parsed)
  if (!migrated) {
    const version = (parsed as { schema?: unknown }).schema
    return {
      ok: false,
      reason:
        typeof version === 'number' && version > SCHEMA_VERSION
          ? `文件版本 v${version} 比当前应用（v${SCHEMA_VERSION}）新，请先升级。`
          : '文件结构不符合本机台账格式。',
    }
  }

  if (!validImportedState(migrated.state)) return { ok: false, reason: '文件结构不符合本机台账格式。' }
  const incoming = migrated.state as ArenaState
  const fresh = initialState()
  state = {
    stats: { ...fresh.stats, ...incoming.stats },
    matches: incoming.matches.slice(0, MAX_MATCHES),
    claims: incoming.claims.slice(0, MAX_CLAIMS),
  }
  persist()
  return { ok: true, from: migrated.from }
}
