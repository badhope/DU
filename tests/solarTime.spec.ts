import { describe, expect, it } from 'vitest'
import { dayOfYear, equationOfTime, toTrueSolarTime } from '@/core/solarTime'

describe('均时差', () => {
  it('2 月中旬最负（约 -14 分钟），11 月初最正（约 +16 分钟）', () => {
    expect(equationOfTime(dayOfYear(2024, 2, 11))).toBeCloseTo(-14.5, 0)
    expect(equationOfTime(dayOfYear(2024, 11, 3))).toBeCloseTo(16, 0)
  })

  it('一年中会跨过零点：4 月中与 6 月中接近 0', () => {
    expect(Math.abs(equationOfTime(dayOfYear(2024, 4, 15)))).toBeLessThan(2)
    expect(Math.abs(equationOfTime(dayOfYear(2024, 6, 13)))).toBeLessThan(2)
  })

  it('闰年 12 月 31 日是第 366 天', () => {
    expect(dayOfYear(2024, 12, 31)).toBe(366)
    expect(dayOfYear(2023, 12, 31)).toBe(365)
  })
})

describe('真太阳时校正', () => {
  it('东经 120 度出生：只差均时差，不差经度', () => {
    const r = toTrueSolarTime('2024-06-15', '12:00', 120)!
    expect(r.longitudeMinutes).toBe(0)
    expect(Math.abs(r.eotMinutes)).toBeLessThan(1)
    // 均时差约 -0.4 分钟，四舍五入后是 11:59，不是整点
    expect(r.time).toBe('11:59')
  })

  it('乌鲁木齐（东经 87.6）：时差约 -129 分钟，会跨到上一个时辰', () => {
    const r = toTrueSolarTime('2024-06-15', '12:00', 87.6)!
    expect(r.longitudeMinutes).toBeCloseTo(-129.6, 1)
    // 12:00 往前推约两小时 → 10 点前后
    expect(r.time.startsWith('09:') || r.time.startsWith('10:')).toBe(true)
    expect(r.offsetMinutes).toBeLessThan(-120)
  })

  it('哈尔滨（东经 126.6）：比标准时早，约 +26 分钟', () => {
    const r = toTrueSolarTime('2024-06-15', '12:00', 126.6)!
    expect(r.longitudeMinutes).toBeCloseTo(26.4, 1)
    expect(r.offsetMinutes).toBeGreaterThan(20)
  })

  it('跨日：23:50 在东经 73 度会退到前一天', () => {
    const r = toTrueSolarTime('2024-06-15', '23:50', 73)!
    expect(r.date).toBe('2024-06-15')
    // 再往前一点的时刻应该跨天
    const cross = toTrueSolarTime('2024-06-15', '00:30', 73)!
    expect(cross.date).toBe('2024-06-14')
  })

  it('非法输入返回 null，不抛异常', () => {
    expect(toTrueSolarTime('2024-13-01', '12:00', 120)).toBeNull()
    expect(toTrueSolarTime('2024-06-15', '25:00', 120)).toBeNull()
    expect(toTrueSolarTime('2024-06-15', '12:00', 999)).toBeNull()
    expect(toTrueSolarTime('bad', '12:00', 120)).toBeNull()
  })
})
