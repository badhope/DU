import { describe, expect, it } from 'vitest'
import { calculateBazi } from '@/core/bazi'

describe('八字事实层', () => {
  it('同一输入得到稳定四柱、日主和五行统计', async () => {
    const a = await calculateBazi({ date: '1990-01-01', time: '12:00' })
    const b = await calculateBazi({ date: '1990-01-01', time: '12:00' })
    expect('fact' in a).toBe(true)
    expect('fact' in b).toBe(true)
    if (!('fact' in a) || !('fact' in b)) return
    expect(a.pillars.map((pillar) => pillar.value)).toEqual(b.pillars.map((pillar) => pillar.value))
    expect(a.dayMaster).toBe('丙')
    expect(Object.keys(a.wuxing)).toEqual(['金', '木', '水', '火', '土'])
    expect(Object.values(a.wuxing).reduce((sum, value) => sum + value, 0)).toBe(8)
  })

  it('非法日期返回可显示错误，不抛异常', async () => {
    const result = await calculateBazi({ date: 'not-a-date', time: '12:00' })
    expect(result).toEqual({ error: '出生日期或时间格式不合法。' })
  })
})
