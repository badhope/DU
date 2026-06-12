import { describe, it, expect } from 'vitest'
import {
  todayStr,
  friendlyDate,
  getUnlockDateForTool,
  newDivinator,
  hasTodayRecord,
  COOLDOWN_TYPE,
  type DivinationRecord,
  type ToolKey,
} from '@/utils/daily-cooldown'

describe('daily-cooldown', () => {
  describe('todayStr', () => {
    it('returns YYYY-MM-DD format', () => {
      const d = new Date(2025, 5, 15) // 2025-06-15
      expect(todayStr(d)).toBe('2025-06-15')
    })

    it('pads month and day with zeros', () => {
      const d = new Date(2025, 0, 3) // 2025-01-03
      expect(todayStr(d)).toBe('2025-01-03')
    })
  })

  describe('friendlyDate', () => {
    it('returns friendly Chinese date format', () => {
      expect(friendlyDate('2025-06-15')).toBe('6 月 15 日')
    })

    it('returns original string for invalid dates', () => {
      expect(friendlyDate('not-a-date')).toBe('not-a-date')
    })
  })

  describe('COOLDOWN_TYPE', () => {
    it('marks liuyao as once-per-day', () => {
      expect(COOLDOWN_TYPE['liuyao']).toBe('once-per-day')
    })

    it('marks tarot as free', () => {
      expect(COOLDOWN_TYPE['tarot']).toBe('free')
    })

    it('covers all once-per-day tools', () => {
      const oncePerDay = Object.entries(COOLDOWN_TYPE).filter(([, v]) => v === 'once-per-day')
      // Once-per-day set: 10 original heavy tools + 3 new high-end classics
      // (周易本义 / 子平真诠 / 地理五诀).
      expect(oncePerDay.length).toBe(13)
      // Sanity: the three new high-end classics must be present
      expect(COOLDOWN_TYPE['zhouyi']).toBe('once-per-day')
      expect(COOLDOWN_TYPE['ziping']).toBe('once-per-day')
      expect(COOLDOWN_TYPE['dili']).toBe('once-per-day')
    })
  })

  describe('getUnlockDateForTool', () => {
    it('returns next day for once-per-day tools', () => {
      const result = getUnlockDateForTool('liuyao', '2025-06-15')
      expect(result).toBe('2025-06-16')
    })

    it('returns undefined for free tools', () => {
      const result = getUnlockDateForTool('tarot', '2025-06-15')
      expect(result).toBeUndefined()
    })
  })

  describe('newDivinator', () => {
    it('creates a divinator with correct defaults', () => {
      const p = newDivinator('张三', '自己')
      expect(p.key).toBe('张三')
      expect(p.name).toBe('张三')
      expect(p.remark).toBe('自己')
      expect(p.totalCount).toBe(0)
      expect(p.toolCooldown).toEqual({})
    })

    it('trims whitespace from name', () => {
      const p = newDivinator('  李四  ')
      expect(p.name).toBe('李四')
      expect(p.key).toBe('李四')
    })
  })

  describe('hasTodayRecord', () => {
    const today = todayStr()
    const records: DivinationRecord[] = [
      {
        id: '1',
        date: today,
        userKey: 'user1',
        userName: '张三',
        tool: 'liuyao' as ToolKey,
        toolName: '六爻',
        brief: '吉',
        timestamp: Date.now(),
      },
    ]

    it('returns record when user has divined today', () => {
      const result = hasTodayRecord(records, 'user1', 'liuyao' as ToolKey, today)
      expect(result).toBeDefined()
      expect(result?.userKey).toBe('user1')
    })

    it('returns undefined when no record exists', () => {
      const result = hasTodayRecord(records, 'user2', 'liuyao' as ToolKey, today)
      expect(result).toBeUndefined()
    })

    it('returns undefined for different tool', () => {
      const result = hasTodayRecord(records, 'user1', 'gua' as ToolKey, today)
      expect(result).toBeUndefined()
    })
  })
})
