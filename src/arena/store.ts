import type { MasterId } from '@/contract/master'
import type { BlindMatch, Claim, ClaimStatus, VoteChoice } from '@/contract/reading'
import { MASTERS } from '@/masters/registry'
import { emptyStats, leaderboardRows, updateElo, type LeaderboardRow, type MasterStats } from './rating'

const KEY = 'tianji.arena.v1'

export interface ArenaState {
  stats: Record<MasterId, MasterStats>
  matches: BlindMatch[]
  claims: Claim[]
}

const initialState = (): ArenaState => ({
  stats: Object.fromEntries(MASTERS.map((master) => [master.id, emptyStats(master.id)])) as Record<MasterId, MasterStats>,
  matches: [],
  claims: [],
})

function readState(): ArenaState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as Partial<ArenaState>
    const fresh = initialState()
    return {
      stats: { ...fresh.stats, ...(parsed.stats ?? {}) },
      matches: Array.isArray(parsed.matches) ? parsed.matches : [],
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
    }
  } catch {
    return initialState()
  }
}

let state = readState()

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
  }
}

export function getArenaState(): ArenaState {
  return structuredClone(state)
}

export function replaceArenaState(next: ArenaState): void {
  state = next
  persist()
}

export function listLeaderboard(): LeaderboardRow[] {
  return leaderboardRows(Object.values(state.stats))
}

export function saveMatch(match: BlindMatch): void {
  if (state.matches.some((item) => item.id === match.id)) return
  state.matches = [match, ...state.matches].slice(0, 100)
  persist()
}

export function listMatches(): BlindMatch[] {
  return structuredClone(state.matches)
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
  state.claims = [...claims.filter((claim) => !existing.has(claim.id)), ...state.claims].slice(0, 300)
  persist()
}

export function listClaims(): Claim[] {
  return structuredClone(state.claims)
}

export function resolveClaim(id: string, status: Exclude<ClaimStatus, 'pending'>): boolean {
  const claim = state.claims.find((item) => item.id === id)
  if (!claim || claim.status !== 'pending') return false
  claim.status = status
  const stats = state.stats[claim.masterId]
  if (!stats) return false
  stats.claimsResolved += 1
  if (status === 'hit') stats.claimsHit += 1
  if (status === 'miss') stats.claimsMiss += 1
  persist()
  return true
}

export function resetArena(): void {
  state = initialState()
  persist()
}

export function exportArena(): string {
  return JSON.stringify(state, null, 2)
}

function isMasterId(value: unknown): value is MasterId {
  return MASTERS.some((master) => master.id === value)
}

function validImportedState(value: unknown): value is ArenaState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ArenaState>
  if (!candidate.stats || typeof candidate.stats !== 'object' || !Array.isArray(candidate.matches) || !Array.isArray(candidate.claims)) return false
  for (const master of MASTERS) {
    const item = (candidate.stats as Record<string, unknown>)[master.id]
    if (!item || typeof item !== 'object') return false
    const stats = item as Partial<MasterStats>
    if (stats.masterId !== master.id || !Number.isFinite(stats.rating) || !Number.isInteger(stats.matches) || (stats.matches ?? -1) < 0) return false
  }
  if (candidate.matches.some((item) => {
    if (!item || typeof item !== 'object') return true
    const match = item as Partial<BlindMatch>
    return typeof match.id !== 'string' || !Array.isArray(match.masterIds) || match.masterIds.length !== 2 || !match.masterIds.every(isMasterId)
  })) return false
  return !candidate.claims.some((item) => {
    if (!item || typeof item !== 'object') return true
    const claim = item as Partial<Claim>
    return typeof claim.id !== 'string' || !isMasterId(claim.masterId) || !Number.isFinite(claim.dueAt) || !['pending', 'hit', 'miss', 'unknown'].includes(String(claim.status))
  })
}

export function importArena(raw: string): boolean {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!validImportedState(parsed)) return false
    const fresh = initialState()
    state = {
      stats: { ...fresh.stats, ...parsed.stats },
      matches: parsed.matches.slice(0, 100),
      claims: parsed.claims.slice(0, 300),
    }
    persist()
    return true
  } catch {
    return false
  }
}
