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

describe('大运与流年', () => {
  it('大运按性别顺逆，且起运岁数真的不同', async () => {
    const male = await calculateBazi({ date: '1990-06-15', time: '08:30', gender: 'male' })
    const female = await calculateBazi({ date: '1990-06-15', time: '08:30', gender: 'female' })
    if (!('fact' in male) || !('fact' in female)) throw new Error('排盘失败')

    expect(male.luck).toBeDefined()
    expect(female.luck).toBeDefined()
    // 断言的是顺逆行不同、起运年月不同 —— 不是"两个对象都存在"
    expect(male.luck!.forward).toBe(true)
    expect(female.luck!.forward).toBe(false)
    expect(male.luck!.startYear).not.toBe(female.luck!.startYear)

    // 大运干支序列方向相反：男第一步癸未，女第一步是逆行的另一柱
    expect(male.luck!.pillars[0]!.ganZhi).toBe('癸未')
    expect(female.luck!.pillars[0]!.ganZhi).not.toBe('癸未')
  })

  it('大运是连续的十年一步，且当前大限落在其中一步之内', async () => {
    const chart = await calculateBazi({ date: '1990-06-15', time: '08:30', gender: 'male' })
    if (!('fact' in chart)) throw new Error('排盘失败')
    const { luck } = chart
    if (!luck) throw new Error('缺少大运')

    expect(luck.pillars.length).toBeGreaterThanOrEqual(8)
    for (let i = 1; i < luck.pillars.length; i++) {
      // 每一步必须紧接上一步的下一年，中间不能有空档
      expect(luck.pillars[i]!.startYear).toBe(luck.pillars[i - 1]!.endYear + 1)
      expect(luck.pillars[i]!.endYear - luck.pillars[i]!.startYear).toBe(9)
    }
    // 没起运的人当前大限应为 null，而不是硬塞第一步
    const now = new Date().getFullYear()
    const inRange = luck.pillars.some((p) => now >= p.startYear && now <= p.endYear)
    if (inRange) expect(luck.current).not.toBeNull()
    if (luck.current) expect(now).toBeGreaterThanOrEqual(luck.current.startYear)
  })

  it('流年干支来自历法库，不是空串也不是写死的值', async () => {
    const chart = await calculateBazi({ date: '1990-06-15', time: '08:30', gender: 'male' })
    if (!('fact' in chart)) throw new Error('排盘失败')
    expect(chart.year).toBeDefined()
    expect(chart.year!.year).toBe(new Date().getFullYear())
    expect(chart.year!.ganZhi).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/)
    expect(chart.fact.fields.liuNian).toContain(chart.year!.ganZhi)
  })

  it('不传性别时四柱不变，但大运退回男命口径并可解释', async () => {
    const none = await calculateBazi({ date: '1990-06-15', time: '08:30' })
    const male = await calculateBazi({ date: '1990-06-15', time: '08:30', gender: 'male' })
    if (!('fact' in none) || !('fact' in male)) throw new Error('排盘失败')
    expect(none.pillars.map((p) => p.value)).toEqual(male.pillars.map((p) => p.value))
    expect(none.luck?.forward).toBe(true)
  })
})

describe('真太阳时校正', () => {
  it('经度真的改变时柱：乌鲁木齐与北京同一钟表时间排出不同时柱', async () => {
    /*
     * 这条防的是"参数传了但没用"。中国统一东经 120° 标准时，
     * 乌鲁木齐（87.6°）比北京时间晚约 129 分钟 —— 12:00 出生实际是上午 10 点前，
     * 时柱必然不同。如果这里没差异，说明 longitude 被静默忽略了。
     */
    const base = { date: '1990-06-15', time: '12:00', gender: 'male' as const }
    const urumqi = await calculateBazi({ ...base, longitude: 87.6 })
    const beijing = await calculateBazi({ ...base, longitude: 116.4 })
    if (!('fact' in urumqi) || !('fact' in beijing)) throw new Error('排盘失败')

    const hourOf = (r: typeof urumqi) => r.pillars.find((p) => p.label === '时柱')!.value
    expect(hourOf(urumqi), '经度差了 29 度，时柱不该相同').not.toBe(hourOf(beijing))
  })

  it('不填经度时行为与原来完全一致', async () => {
    const base = { date: '1990-06-15', time: '12:00', gender: 'male' as const }
    const none = await calculateBazi(base)
    const explicit120 = await calculateBazi({ ...base, longitude: 120 })
    if (!('fact' in none) || !('fact' in explicit120)) throw new Error('排盘失败')
    // 东经 120 只差均时差；6 月中旬均时差接近 0，四柱应当相同
    expect(explicit120.pillars.map((p) => p.value)).toEqual(none.pillars.map((p) => p.value))
    // 但事实层要标明做了校正
    expect(explicit120.fact.fields.trueSolarTime).toBeTruthy()
    expect(none.fact.fields.trueSolarTime).toBeUndefined()
  })

  it('经度非法时明确报错，不静默按原时间排', async () => {
    const r = await calculateBazi({ date: '1990-06-15', time: '12:00', longitude: 999 })
    expect('error' in r).toBe(true)
  })
})
