/**
 * 紫微斗数内核
 *
 * 这组测试的立场：紫微斗数最容易出错的地方不是主流程，是边界 ——
 * 子时换日、闰月、闰日、时辰索引映射。所以测试重点在这些地方，
 * 而不是"能跑出 12 个宫"这种几乎必然成立的断言。
 *
 * 校验基准：iztro 本身是被广泛使用的 MIT 库，这里复核的是**我们的封装**
 * 有没有把它的输入输出用错，而不是声称验证了紫微斗数理论。
 */
import { describe, expect, it } from 'vitest'
import { calculateZiwei, hourToIndex } from '@/core/ziwei'

describe('时辰索引映射', () => {
  it('早子时（00:00–00:59）是 0，晚子时（23:00–23:59）是 12', () => {
    expect(hourToIndex('00:00')).toBe(0)
    expect(hourToIndex('00:59')).toBe(0)
    expect(hourToIndex('23:00')).toBe(12)
    expect(hourToIndex('23:59')).toBe(12)
  })

  it('十二时辰各自落在正确的序号上', () => {
    expect(hourToIndex('01:00')).toBe(1) // 丑
    expect(hourToIndex('03:00')).toBe(2) // 寅
    expect(hourToIndex('05:00')).toBe(3) // 卯
    expect(hourToIndex('07:00')).toBe(4) // 辰
    expect(hourToIndex('09:00')).toBe(5) // 巳
    expect(hourToIndex('11:00')).toBe(6) // 午
    expect(hourToIndex('13:00')).toBe(7) // 未
    expect(hourToIndex('15:00')).toBe(8) // 申
    expect(hourToIndex('17:00')).toBe(9) // 酉
    expect(hourToIndex('19:00')).toBe(10) // 戌
    expect(hourToIndex('21:00')).toBe(11) // 亥
  })

  it('非法时间返回 null，不抛异常', () => {
    expect(hourToIndex('24:00')).toBeNull()
    expect(hourToIndex('12:60')).toBeNull()
    expect(hourToIndex('abc')).toBeNull()
    expect(hourToIndex('')).toBeNull()
  })
})

describe('排盘正确性', () => {
  it('1990-06-15 08:30 排出土五局、12 宫、四柱与四化', async () => {
    const chart = await calculateZiwei({ date: '1990-06-15', time: '08:30', gender: 'male' })
    expect('error' in chart).toBe(false)
    if ('error' in chart) return

    expect(chart.fiveElementsClass).toBe('土五局')
    expect(chart.palaces).toHaveLength(12)
    expect(chart.chineseDate).toBe('庚午 壬午 辛亥 壬辰')
    expect(chart.timeName).toBe('辰时')

    // 四化是庚年：太阳禄、武曲权、太阴科、天同忌
    const mutagen = chart.fact.fields.mutagen as string[]
    expect(mutagen.sort()).toEqual(['太阴化科', '太阳化禄', '天同化忌', '武曲化权'].sort())
  })

  it('十二宫名称齐全且不重复，身宫是其中一宫的标记而非独立宫位', async () => {
    const chart = await calculateZiwei({ date: '1990-06-15', time: '08:30' })
    if ('error' in chart) throw new Error(chart.error)
    const names = chart.palaces.map((palace) => palace.name)

    // 紫微斗数里"身宫"不占独立宫位，而是寄附在某一宫上（isBodyPalace）。
    // 把它当成第十三宫是常见误解，这里钉住正确语义。
    expect(names).toContain('命宫')
    expect(names).not.toContain('身宫')
    expect(new Set(names).size).toBe(names.length)
    expect(chart.palaces.filter((p) => p.isBodyPalace)).toHaveLength(1)
  })

  it('每宫都有天干地支，主星带庙旺信息', async () => {
    const chart = await calculateZiwei({ date: '1984-02-04', time: '14:00' })
    if ('error' in chart) throw new Error(chart.error)
    for (const palace of chart.palaces) {
      expect(palace.heavenlyStem).toMatch(/^[甲乙丙丁戊己庚辛壬癸]$/)
      expect(palace.earthlyBranch).toMatch(/^[子丑寅卯辰巳午未申酉戌亥]$/)
    }
    const withBrightness = chart.palaces.flatMap((p) => p.majorStars).filter((s) => s.brightness)
    expect(withBrightness.length).toBeGreaterThan(0)
  })
})

describe('边界：子时换日', () => {
  it('早子时与晚子时落在同一天，宫位一致', async () => {
    // 这是紫微最容易算错的地方：23:00 之后算当天还是次日
    const early = await calculateZiwei({ date: '1990-06-15', time: '00:30' })
    const late = await calculateZiwei({ date: '1990-06-15', time: '23:30' })
    if ('error' in early || 'error' in late) throw new Error('排盘失败')
    expect(early.fiveElementsClass).toBe(late.fiveElementsClass)
    expect(early.palaces.map((p) => p.name)).toEqual(late.palaces.map((p) => p.name))
  })
})

describe('边界：闰月与闰日', () => {
  it('闰四月能排出盘，且月建被正确识别', async () => {
    const chart = await calculateZiwei({ date: '2020-05-23', time: '08:30' })
    if ('error' in chart) throw new Error(chart.error)
    expect(chart.lunarDate).toContain('闰四月')
    expect(chart.palaces).toHaveLength(12)
  })

  it('闰日 2000-02-29 不报错', async () => {
    const chart = await calculateZiwei({ date: '2000-02-29', time: '12:00' })
    expect('error' in chart).toBe(false)
  })

  it('不存在的日期被拒绝，而不是被 Date 悄悄规范化', async () => {
    const feb30 = await calculateZiwei({ date: '2021-02-30', time: '12:00' })
    expect('error' in feb30).toBe(true)
    const month13 = await calculateZiwei({ date: '2021-13-01', time: '12:00' })
    expect('error' in month13).toBe(true)
  })
})

describe('性别影响', () => {
  it('同生辰不同性别会改变大限方向，但宫位结构不变', async () => {
    const male = await calculateZiwei({ date: '1990-06-15', time: '08:30', gender: 'male' })
    const female = await calculateZiwei({ date: '1990-06-15', time: '08:30', gender: 'female' })
    if ('error' in male || 'error' in female) throw new Error('排盘失败')

    expect(male.palaces.map((p) => p.name)).toEqual(female.palaces.map((p) => p.name))

    // 只断言"两者都有值"是没有意义的 —— 那在性别被完全忽略时也会通过。
    // 必须断言大限真的不同，而且指向同一宫时年龄段相反方向。
    const malePairs = male.palaces.map((p) => `${p.name}:${p.decadal?.range?.join('-')}`)
    const femalePairs = female.palaces.map((p) => `${p.name}:${p.decadal?.range?.join('-')}`)
    expect(malePairs).not.toEqual(femalePairs)

    const maleSoul = male.palaces.find((p) => p.name === '命宫')?.decadal?.range
    const femaleSoul = female.palaces.find((p) => p.name === '命宫')?.decadal?.range
    expect(maleSoul).toEqual([5, 14])
    expect(femaleSoul).toEqual([5, 14])
    // 命宫本身相同，但兄弟宫方向相反：男 115–124 / 女 15–24
    const maleSibling = male.palaces.find((p) => p.name === '兄弟')?.decadal?.range
    const femaleSibling = female.palaces.find((p) => p.name === '兄弟')?.decadal?.range
    expect(maleSibling).toEqual([115, 124])
    expect(femaleSibling).toEqual([15, 24])
  })

  it('当前大限来自 horoscope，且随性别不同而落在不同宫', async () => {
    const male = await calculateZiwei({ date: '1990-06-15', time: '08:30', gender: 'male' })
    const female = await calculateZiwei({ date: '1990-06-15', time: '08:30', gender: 'female' })
    if ('error' in male || 'error' in female) throw new Error('排盘失败')

    expect(male.currentDecadal).toBeTruthy()
    expect(female.currentDecadal).toBeTruthy()
    // 同一出生日、同一年龄，大限方向不同 → 落在不同宫
    expect(male.currentDecadal!.palace).not.toBe(female.currentDecadal!.palace)
  })
})

describe('事实层输出', () => {
  it('summary 与 fields 都是可核对的具体值，不含吉凶判词', async () => {
    const chart = await calculateZiwei({ date: '1990-06-15', time: '08:30' })
    if ('error' in chart) throw new Error(chart.error)

    expect(chart.fact.kind).toBe('ziwei')
    expect(chart.fact.summary).toContain(chart.fiveElementsClass)
    expect(chart.fact.fields.palaces).toBeInstanceOf(Array)
    expect((chart.fact.fields.palaces as string[]).length).toBe(12)

    // 事实层不许出现吉凶断语
    const forbidden = ['大吉', '大凶', '必', '注定', '一定会']
    const serialized = JSON.stringify(chart.fact)
    for (const word of forbidden) expect(serialized).not.toContain(word)
  })
})
