import { describe, expect, it } from 'vitest'
import { readQuestion } from '@/engine/understand'

describe('问题理解层', () => {
  it('识别二选一并抽出两个选项', () => {
    const r = readQuestion('我应该接受北京的工作还是留在成都')
    expect(r.kind).toBe('either-or')
    expect(r.options).not.toBeNull()
    expect(r.options![0]).toContain('北京')
    expect(r.options![1]).toContain('成都')
  })

  it('股权分配不是二选一，是"怎么做"', () => {
    const r = readQuestion('我和合伙人股权怎么分比较合理')
    expect(r.kind).toBe('how')
    expect(r.options).toBeNull()
    expect(r.subject).toBe('other')
    expect(r.concerns).toContain('money')
    expect(r.concerns).toContain('relationship')
  })

  it('考研还是工作：二选一，且识别出考试与时间窗', () => {
    const r = readQuestion('下个月考研还是直接工作')
    expect(r.kind).toBe('either-or')
    expect(r.horizon).toBe('month')
    expect(r.named).toContain('考研')
  })

  it('要不要辞职：whether 型', () => {
    const r = readQuestion('我要不要辞职')
    expect(r.kind).toBe('whether')
    expect(r.named).toContain('辞职')
  })

  it('判断他人：assess-other', () => {
    const r = readQuestion('我这个合伙人是不是可靠')
    expect(r.kind).toBe('assess-other')
    expect(r.subject).toBe('other')
  })

  it('识别顾虑维度：钱、关系、风险、家人', () => {
    const r = readQuestion('换工作收入会降，但家里希望我稳妥一点，万一失败怎么办')
    expect(r.concerns).toContain('money')
    expect(r.concerns).toContain('family')
    expect(r.concerns).toContain('risk')
  })

  it('时间窗识别：本周 / 这个月 / 三个月 / 今年', () => {
    expect(readQuestion('这周要不要提离职').horizon).toBe('week')
    expect(readQuestion('这个月该不该签约').horizon).toBe('month')
    expect(readQuestion('三个月内换工作合适吗').horizon).toBe('quarter')
    expect(readQuestion('今年适合创业吗').horizon).toBe('year')
    expect(readQuestion('我适合做产品经理吗').horizon).toBe('none')
  })

  it('二选一抽取不会把长句当选项', () => {
    const r = readQuestion('我在想是不是应该把现在这份稳定但没什么成长的工作辞掉然后去一个创业公司还是继续考公务员')
    // 切出的两项若超过 24 字则放弃，宁可不给选项也不要给错
    if (r.options) {
      expect(r.options[0].length).toBeLessThanOrEqual(24)
      expect(r.options[1].length).toBeLessThanOrEqual(24)
    }
  })

  it('空问题与纯符号不崩溃', () => {
    expect(readQuestion('').kind).toBe('unknown')
    expect(readQuestion('？？？').kind).toBe('unknown')
  })
})

describe('具名实体抽取', () => {
  it('不会把「男朋友」切成「男朋 + 朋友」', () => {
    // 实测 bug：词表里同时有「男朋」和「朋友」，按包含匹配会双命中
    const r = readQuestion('我男朋友最近总是不回消息')
    expect(r.named).toContain('男朋友')
    expect(r.named).not.toContain('男朋')
    expect(r.named).not.toContain('朋友')
  })

  it('城市与考试能同时抽出', () => {
    const r = readQuestion('我想去北京考研')
    expect(r.named).toContain('北京')
    expect(r.named).toContain('考研')
  })

  it('重叠词只取最长的那个', () => {
    const r = readQuestion('我和合伙人股权怎么分')
    expect(r.named).toContain('合伙人')
    expect(r.named).toContain('股权')
  })
})
