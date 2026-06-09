import { describe, it, expect } from 'vitest'
import { calcLifeNumber, fullLifeResult, NUMBER_META } from '@/utils/life'

describe('life (生命灵数)', () => {
  describe('calcLifeNumber', () => {
    it('reduces to single digit', () => {
      const result = calcLifeNumber(1990, 6, 15)
      expect(result.lifePath).toBeGreaterThanOrEqual(1)
      expect(result.lifePath).toBeLessThanOrEqual(9)
    })

    it('preserves master number 11', () => {
      // 11/29: 1+1+2+9=13→4, but 29 day: 2+9=11 (master)
      const result = calcLifeNumber(1990, 11, 29)
      expect(result.soulUrge).toBe(11)
    })

    it('calculates all four numbers', () => {
      const result = calcLifeNumber(1990, 6, 15)
      expect(result.lifePath).toBeTypeOf('number')
      expect(result.expression).toBeTypeOf('number')
      expect(result.soulUrge).toBeTypeOf('number')
      expect(result.destiny).toBeTypeOf('number')
    })
  })

  describe('NUMBER_META', () => {
    it('has metadata for numbers 1-9', () => {
      for (let i = 1; i <= 9; i++) {
        expect(NUMBER_META[i]).toBeDefined()
        expect(NUMBER_META[i].name).toBeTruthy()
        expect(NUMBER_META[i].element).toBeTruthy()
      }
    })

    it('has metadata for master numbers 11, 22, 33', () => {
      expect(NUMBER_META[11]).toBeDefined()
      expect(NUMBER_META[22]).toBeDefined()
      expect(NUMBER_META[33]).toBeDefined()
    })
  })

  describe('fullLifeResult', () => {
    it('returns complete result with advice', () => {
      const result = fullLifeResult(1990, 6, 15)
      expect(result.number).toBeDefined()
      expect(result.primary).toBeDefined()
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.advice).toBeDefined()
      expect(result.advice.career).toBeTruthy()
      expect(result.cycle.length).toBeGreaterThan(0)
    })
  })
})
