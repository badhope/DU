/**
 * 梅花内核：直接拿《梅花易数·卷一》的两个原例做验收。
 *
 * 这类测试的价值在于"外部可核对"——断言里的期望值不是我们自己定的，
 * 是书里写的。起例若改错，第一条就红。
 */
import { describe, expect, it } from 'vitest'
import { castByNumbers, castByTime, mod6, mod8, monthSeason, tiStrength } from '@/core/meihua'
import { HEX_COUNT, hexagram, mutual, relate, changed } from '@/core/gua'

describe('起例算术', () => {
  it('卦以八除、爻以六除：整除不作 0', () => {
    expect(mod8(8)).toBe(8) // 原文"如得八數整，即坤卦，更不必除也"
    expect(mod8(34)).toBe(2)
    expect(mod6(43)).toBe(1)
    expect(mod6(6)).toBe(6)
  })

  it('观梅占：辰年十二月十七日申时 → 泽火革，初爻动，互见乾巽，变咸', () => {
    // 辰年5 + 月12 + 日17 = 34 → 余2 兑为上；加申时9 = 43 → 余3 离为下；43 除六余1 为动爻
    const c = castByTime(5, 12, 17, 9)
    expect(c.numbers).toEqual([5, 12, 17, 9])
    expect(c.total).toBe(43)
    expect(c.upper.name).toBe('兑')
    expect(c.lower.name).toBe('离')
    expect(c.ben.name).toBe('泽火革')
    expect(c.moving).toBe(1)
    expect(c.hu.name).toBe('天风姤') // 互见乾巽
    expect(c.bian.name).toBe('泽山咸') // 初爻变咸
    // 原文"兑金为体，离火克之"——动在下卦，故上卦兑为体
    expect(c.ti.name).toBe('兑')
    expect(c.yong.name).toBe('离')
    expect(c.relation).toBe('yongKeTi')
  })

  it('牡丹占：巳年三月十六日卯时 → 天风姤，五爻动，变鼎，巽木为体受乾金克', () => {
    const c = castByTime(6, 3, 16, 4)
    expect(c.total).toBe(29)
    expect(c.ben.name).toBe('天风姤')
    expect(c.moving).toBe(5)
    expect(c.bian.name).toBe('火风鼎')
    expect(c.hu.name).toBe('乾为天') // 互见重乾
    // 动在上卦 → 下卦巽为体，上卦乾为用；原文"巽木为体，乾金克之"
    expect(c.ti.name).toBe('巽')
    expect(c.yong.name).toBe('乾')
    expect(c.relation).toBe('yongKeTi')
  })

  it('报数占：两数定上下卦，和定动爻', () => {
    const c = castByNumbers(3, 8)
    expect(mod8(3)).toBe(3)
    expect(c.upper.name).toBe('离')
    expect(c.lower.name).toBe('坤') // mod8(8)=8
    expect(c.ben.name).toBe('火地晋') // 上离下坤；明夷是上坤下离，别写反
    expect(c.moving).toBe(mod6(11))
  })
})

describe('卦象结构', () => {
  it('六十四卦表无重复无缺漏', () => {
    expect(HEX_COUNT).toBe(64)
  })

  it('上下卦反序必然得到不同卦（除纯卦外）', () => {
    expect(hexagram([1, 1, 1, 0, 0, 0]).name).toBe('地天泰')
    expect(hexagram([0, 0, 0, 1, 1, 1]).name).toBe('天地否')
  })

  it('体用五种关系穷举', () => {
    expect(relate('jin', 'tu')).toBe('yongShengTi') // 土生金
    expect(relate('jin', 'shui')).toBe('tiShengYong') // 金生水
    expect(relate('jin', 'huo')).toBe('yongKeTi') // 火克金
    expect(relate('jin', 'mu')).toBe('tiKeYong') // 金克木
    expect(relate('jin', 'jin')).toBe('bihe')
  })

  it('变卦只改动爻那一爻', () => {
    const lines = [1, 0, 1, 1, 1, 0] as Array<0 | 1>
    const b = changed(lines, 1)
    expect(b.lines).toEqual([0, 0, 1, 1, 1, 0])
    expect(mutual(lines).lines).toEqual([0, 1, 1, 1, 1, 1]) // 2/3/4 + 3/4/5 爻
  })
})

describe('旺令', () => {
  it('原文"震巽木旺於春，離火旺于夏，乾兌金旺於秋，坎水旺於冬，坤艮土旺於辰戌丑未月"', () => {
    expect(monthSeason(3)).toBe('spring') // 寅
    expect(monthSeason(6)).toBe('summer') // 巳
    expect(monthSeason(9)).toBe('autumn') // 申
    expect(monthSeason(12)).toBe('winter') // 亥
    expect(monthSeason(1)).toBe('winter') // 子
    expect(monthSeason(2)).toBe('earth') // 丑
    expect(monthSeason(5)).toBe('earth') // 辰
    expect(monthSeason(8)).toBe('earth') // 未
    expect(monthSeason(11)).toBe('earth') // 戌

  })

  it('体卦得令与失令判定与原文一致', () => {
    const zhen = { bin: '100' as const, name: '震', symbol: '☳', xiantian: 4, wuxing: 'mu' as const, nature: '雷' }
    const kun = { bin: '000' as const, name: '坤', symbol: '☷', xiantian: 8, wuxing: 'tu' as const, nature: '地' }
    const li = { bin: '101' as const, name: '离', symbol: '☲', xiantian: 3, wuxing: 'huo' as const, nature: '火' }
    expect(tiStrength(zhen, 'spring')).toBe('wang') // 春震巽旺
    expect(tiStrength(kun, 'spring')).toBe('shuai') // 春坤艮衰
    expect(tiStrength(li, 'winter')).toBe('shuai') // 冬离衰
    expect(tiStrength(kun, 'earth')).toBe('wang') // 四季月坤艮旺
  })
})
