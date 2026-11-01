import { describe, expect, it } from 'vitest'
import { listLeaderboard } from '@/arena/store'
import { ACTIVE_MASTERS, MASTERS, masterById } from '@/masters/registry'

describe('大师方法卡', () => {
  it('id 唯一、每位大师有典籍、方法和安全边界', () => {
    expect(new Set(MASTERS.map((master) => master.id)).size).toBe(MASTERS.length)
    for (const master of MASTERS) {
      expect(master.books.length).toBeGreaterThan(0)
      expect(master.method.length).toBeGreaterThan(10)
      expect(master.safety.length).toBeGreaterThan(0)
      expect(masterById(master.id)?.id).toBe(master.id)
    }
  })

  it('只有 active 大师允许进入首版盲测，planned 大师不伪装成成品', () => {
    expect(ACTIVE_MASTERS.map((master) => master.id)).toEqual(['ziping', 'meihua'])
    expect(MASTERS.filter((master) => master.status === 'planned').every((master) => master.kernel === 'none')).toBe(true)
    expect(listLeaderboard().map((row) => row.masterId)).toEqual(['ziping', 'meihua'])
  })
})
