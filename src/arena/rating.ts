import type { MasterId } from '@/contract/master'

export interface MasterStats {
  masterId: MasterId
  rating: number
  matches: number
  wins: number
  losses: number
  draws: number
  claimsResolved: number
  claimsHit: number
  claimsMiss: number
}

export type RatingOutcome = 'win' | 'loss' | 'draw'

export interface RatingUpdate {
  winner: MasterId | null
  loser: MasterId | null
  outcome: RatingOutcome
  next: Record<MasterId, MasterStats>
}

export interface LeaderboardRow extends MasterStats {
  winRate: number | null
  wilsonLower: number | null
  claimRate: number | null
  tier: '见习' | '在榜'
}

export function emptyStats(masterId: MasterId): MasterStats {
  return {
    masterId,
    rating: 1500,
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    claimsResolved: 0,
    claimsHit: 0,
    claimsMiss: 0,
  }
}

function expected(a: number, b: number): number {
  return 1 / (1 + 10 ** ((b - a) / 400))
}

export function updateElo(a: MasterStats, b: MasterStats, outcome: RatingOutcome): [MasterStats, MasterStats] {
  const k = Math.max(16, 32 - Math.floor(Math.min(a.matches, b.matches) / 10))
  const actualA = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0
  const actualB = 1 - actualA
  const nextA = Math.round(a.rating + k * (actualA - expected(a.rating, b.rating)))
  const nextB = Math.round(b.rating + k * (actualB - expected(b.rating, a.rating)))
  return [
    {
      ...a,
      rating: nextA,
      matches: a.matches + 1,
      wins: a.wins + (outcome === 'win' ? 1 : 0),
      losses: a.losses + (outcome === 'loss' ? 1 : 0),
      draws: a.draws + (outcome === 'draw' ? 1 : 0),
    },
    {
      ...b,
      rating: nextB,
      matches: b.matches + 1,
      wins: b.wins + (outcome === 'loss' ? 1 : 0),
      losses: b.losses + (outcome === 'win' ? 1 : 0),
      draws: b.draws + (outcome === 'draw' ? 1 : 0),
    },
  ]
}

export function wilsonLower(successes: number, total: number, z = 1.96): number | null {
  if (total <= 0 || successes < 0 || successes > total) return null
  const p = successes / total
  const z2 = z * z
  const denominator = 1 + z2 / total
  const center = p + z2 / (2 * total)
  const spread = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total)
  return Math.max(0, (center - spread) / denominator)
}

export function leaderboardRows(stats: MasterStats[], minimumSamples = 5): LeaderboardRow[] {
  return stats
    .map((item) => {
      const decisive = item.wins + item.losses
      return {
        ...item,
        winRate: decisive ? item.wins / decisive : null,
        wilsonLower: decisive ? wilsonLower(item.wins, decisive) : null,
        claimRate: item.claimsResolved ? item.claimsHit / item.claimsResolved : null,
        tier: (item.matches >= minimumSamples ? '在榜' : '见习') as '在榜' | '见习',
      }
    })
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier === '在榜' ? -1 : 1
      if (a.wilsonLower !== null && b.wilsonLower !== null && a.wilsonLower !== b.wilsonLower)
        return b.wilsonLower - a.wilsonLower
      return b.rating - a.rating
    })
}
