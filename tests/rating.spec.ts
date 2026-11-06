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

describe('小样本不得披露胜率', () => {
  it('1 场全胜时不显示胜率下界（否则会显示"胜率 100%"）', () => {
    // 这正是审计抓到的自相矛盾：界面写"满 5 场才在榜"，
    // 却在 1 场时显示"见习 · 胜率下界 21%"。
    const stats = [{ ...emptyStats('ziping'), matches: 1, wins: 1, losses: 0 }]
    const row = leaderboardRows(stats)[0]!
    expect(row.tier).toBe('见习')
    expect(row.wilsonLower).toBeNull()
    expect(row.winRate).toBeNull()
  })

  it('4 场全胜仍不披露', () => {
    const stats = [{ ...emptyStats('ziping'), matches: 4, wins: 4, losses: 0 }]
    const row = leaderboardRows(stats)[0]!
    expect(row.wilsonLower).toBeNull()
  })

  it('满 5 场才开始披露胜率下界', () => {
    const stats = [{ ...emptyStats('ziping'), matches: 5, wins: 3, losses: 2 }]
    const row = leaderboardRows(stats)[0]!
    expect(row.tier).toBe('在榜')
    expect(row.wilsonLower).not.toBeNull()
    expect(row.wilsonLower!).toBeGreaterThan(0)
    expect(row.wilsonLower!).toBeLessThan(0.6)
  })

  it('门槛可通过参数调整，且一致生效', () => {
    const stats = [{ ...emptyStats('ziping'), matches: 3, wins: 2, losses: 1 }]
    const strict = leaderboardRows(stats, 10)[0]!
    expect(strict.tier).toBe('见习')
    expect(strict.wilsonLower).toBeNull()
  })
})

describe('应验率的小样本门槛', () => {
  /*
   * 这条守的是一个真实缺陷：胜率有 5 场门槛，应验率却只要 claimsResolved > 0
   * 就披露 —— 回填 1 条命中会显示「应验 100%」。同一个函数里刚写着
   * 「1 场赢了显示 100% 是在用小样本冒充实力」，对另一半数据却没执行。
   */
  it('只有 1 条应验时不披露应验率', () => {
    const stats = [{ ...emptyStats('ziping'), claimsResolved: 1, claimsHit: 1 }]
    const row = leaderboardRows(stats)[0]!
    expect(row.claimsResolved).toBe(1)
    expect(row.claimRate, '1 条命中不能显示 100%').toBeNull()
  })

  it('4 条仍不披露，满 5 条才披露且数值正确', () => {
    const four = [{ ...emptyStats('ziping'), claimsResolved: 4, claimsHit: 4 }]
    expect(leaderboardRows(four)[0]!.claimRate).toBeNull()

    const five = [{ ...emptyStats('ziping'), claimsResolved: 5, claimsHit: 3 }]
    const row = leaderboardRows(five)[0]!
    expect(row.claimRate).not.toBeNull()
    // 断言具体数值，而不只是"非空" —— 否则算错了也看不出来
    expect(row.claimRate).toBeCloseTo(0.6, 10)
  })

  it('没有已判定断言时不进分母', () => {
    const stats = [{ ...emptyStats('ziping'), claimsResolved: 0, claimsHit: 0 }]
    expect(leaderboardRows(stats)[0]!.claimRate).toBeNull()
  })
})
