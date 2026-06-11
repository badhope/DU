/**
 * 玄枢 MISTVERSE · 集成测试
 *
 * 验证跨模块核心流程：
 * 1. 八字 → 紫微完整排盘链路
 * 2. 六爻起卦 → 解卦链路
 * 3. 命名测字 → 五行平衡链路
 */

import { describe, it, expect } from 'vitest'
import { safeCalcBazi, safeCalcZiwei } from '@/modules/mingli/logic/safe-calc'
import { safeLiuyaoDivinate } from '@/modules/zhanbu/logic/safe-calc'
import { safeAnalyzeMingji } from '@/modules/mingming/logic/safe-calc'
import { isOk } from '@shared/utils/result'

describe('集成测试：八字 → 紫微排盘', () => {
  it('safeCalcBazi 成功后 safeCalcZiwei 也成功', () => {
    const baziResult = safeCalcBazi(1990, 6, 15, 12)
    expect(isOk(baziResult)).toBe(true)
    if (!isOk(baziResult)) return

    const ziweiResult = safeCalcZiwei(1990, 6, 15, 12, '男')
    expect(isOk(ziweiResult)).toBe(true)
    if (!isOk(ziweiResult)) return

    // 紫微结果结构完整
    expect(ziweiResult.value.palaces).toHaveLength(12)
    expect(ziweiResult.value.mingGong.gongName).toBe('命宫')
    expect(ziweiResult.value.wuju).toBeTruthy()
    expect(ziweiResult.value.scores.career).toBeGreaterThan(0)
  })

  it('八字 + 紫微输入校验失败返回 Err', () => {
    const badBazi = safeCalcBazi(1800, 13, 32, 25)
    expect(badBazi.ok).toBe(false)
    const badZiwei = safeCalcZiwei(1800, 6, 15, 12)
    expect(badZiwei.ok).toBe(false)
  })
})

describe('集成测试：六爻起卦 → 解卦', () => {
  it('safeLiuyaoDivinate 成功返回完整结果', () => {
    const result = safeLiuyaoDivinate('事业', new Date(2024, 5, 15, 10, 30), 42)
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return

    const r = result.value
    expect(r.benGua.name).toBeTruthy()
    expect(r.benGua.yaoList).toHaveLength(6)
    expect(r.yongshen.key).toBe('官鬼') // 事业 → 官鬼
    expect(r.fortunes.career.score).toBeGreaterThan(0)
    expect(r.advice.length).toBeGreaterThan(0)
  })

  it('无效主题返回 Err', () => {
    const result = safeLiuyaoDivinate('不存在的主题')
    expect(result.ok).toBe(false)
  })
})

describe('集成测试：命名测字 → 五行平衡', () => {
  it('safeAnalyzeMingji 成功返回完整结果', () => {
    const result = safeAnalyzeMingji('张三丰', 1990, 6, 15, 12)
    expect(isOk(result)).toBe(true)
    if (!isOk(result)) return

    const r = result.value
    expect(r.name).toBe('张三丰')
    expect(r.charWx.length).toBe(3)
    expect(r.wuGe.zongGe).toBeGreaterThan(0)
    expect(r.score).toBeGreaterThan(0)
    expect(r.level).toBeTruthy()
    // 五行平衡总和 = 名字字数
    const total = Object.values(r.fiveElBalance).reduce((a, b) => a + b, 0)
    expect(total).toBe(3)
  })

  it('空姓名返回 Err', () => {
    const result = safeAnalyzeMingji('')
    expect(result.ok).toBe(false)
  })

  it('不完整生辰返回 Err', () => {
    const result = safeAnalyzeMingji('张三', 1990, 6)
    expect(result.ok).toBe(false)
  })
})
