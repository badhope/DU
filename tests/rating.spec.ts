import { describe, expect, it } from 'vitest'
import { emptyStats, leaderboardRows, updateElo, wilsonLower } from '@/arena/rating'
import { MASTERS } from '@/masters/registry'

describe('大师测评评分', () => {
  it('胜负和平局都会更新对局数，平局双方分值相同', () => {
    const a = emptyStats('ziping')
    const b = emptyStats('meihua')
    const [nextA, nextB] = updateElo(a, b, 'draw')
    expect(nextA.matches).toBe(1)
    expect(nextB.matches).toBe(1)
    expect(nextA.rating).toBe(nextB.rating)
    expect(nextA.draws).toBe(1)
    expect(nextB.draws).toBe(1)
  })

  it('Wilson 下界对空样本返回 null，并随成功样本有界', () => {
    expect(wilsonLower(0, 0)).toBeNull()
    const lower = wilsonLower(4, 5)
    expect(lower).not.toBeNull()
    expect(lower!).toBeGreaterThanOrEqual(0)
    expect(lower!).toBeLessThanOrEqual(1)
  })

  it('没有五场样本时显示见习，五场后才在榜', () => {
    const stats = MASTERS.map((master) => ({ ...emptyStats(master.id), matches: master.id === 'ziping' ? 5 : 0, wins: master.id === 'ziping' ? 3 : 0, losses: master.id === 'ziping' ? 2 : 0 }))
    const rows = leaderboardRows(stats)
    expect(rows.find((row) => row.masterId === 'ziping')?.tier).toBe('在榜')
    expect(rows.find((row) => row.masterId === 'meihua')?.tier).toBe('见习')
  })
})
