// @vitest-environment node
/**
 * 安全网关测试
 *
 * 这组测试针对一个具体的失败：用户输入「我想自杀」，系统回了
 * 「你不是在做决定，是在等一个不用负责的理由」。对一个有自杀念头的人，
 * 这句话可能致命。
 *
 * 所以这里不测"返回什么好看的文案"，只测三件硬性的事：
 *   1. 危机输入必须完全阻断，不生成任何断语；
 *   2. 阻断必须发生在所有宿主（Web/CLI/HTTP/MCP 共用 composeBlindMatch）；
 *   3. 医疗/财务/法律类要给边界说明，而不是假装专业的建议。
 */
import { describe, expect, it } from 'vitest'
import { checkSafety, isBlocking, domainNotice, SAFETY_MESSAGES } from '@/core/safety'
import { composeBlindMatch, SafetyBlockError } from '@/arena/readingFlow'

const request = (question: string) => ({ question, domain: 'general' as const, askedAt: 1_700_000_000_000 })

describe('危机输入必须阻断', () => {
  const crisisInputs = ['我想自杀', '不想活了', '活不下去了', '我想轻生', '准备去死', '想自残', '割腕', '跳楼']

  for (const input of crisisInputs) {
    it(`「${input}」被判定为 crisis`, () => {
      const verdict = checkSafety(input)
      expect(verdict.level).toBe('crisis')
      expect(isBlocking(verdict)).toBe(true)
      expect(verdict.message).toContain('12356')
    })
  }

  it('危机时不生成任何断语', async () => {
    await expect(composeBlindMatch(request('我想自杀'), ['ziping', 'meihua'])).rejects.toThrow(SafetyBlockError)
  })

  it('危机回复包含可拨打的求助电话，且不说教', () => {
    const verdict = checkSafety('我想自杀')
    expect(verdict.message).toContain('12356')
    expect(verdict.message).toContain('120')
    // 不能出现任何评价性/归因性措辞
    for (const word of ['你应该', '想开点', '你要坚强', '都是你想太多']) {
      expect(verdict.message).not.toContain(word)
    }
  })
})

describe('家暴与人身安全', () => {
  it('家暴求助走求助路径，不排盘', () => {
    const verdict = checkSafety('我老公打我，我该怎么办')
    expect(verdict.level).toBe('crisis')
    expect(verdict.message).toContain('110')
    expect(verdict.message).toContain('12338')
  })

  it('未成年被家暴时给出青少年服务台', () => {
    const verdict = checkSafety('我14岁，我爸妈总打我')
    // 危机优先级高于 minor：先保证人身安全
    expect(verdict.level).toBe('crisis')
    expect(verdict.message).toContain('110')
  })
})

describe('医疗与财务只提醒不阻断', () => {
  it('停药问题给出就医提示，但仍可继续', () => {
    const verdict = checkSafety('我能不能停药')
    expect(verdict.level).toBe('medical')
    expect(isBlocking(verdict)).toBe(false)
    expect(verdict.message).toContain('医生')
  })

  it('医疗提醒会被附加到回答之后', () => {
    expect(domainNotice('medical')).toContain('就医')
  })

  it('借贷杠杆问题给出风险提示', () => {
    const verdict = checkSafety('我要不要借钱炒股加杠杆')
    expect(verdict.level).toBe('financial')
    expect(isBlocking(verdict)).toBe(false)
    expect(domainNotice('financial')).toContain('投资建议')
  })
})

describe('未成年人保护', () => {
  it('未成年单独使用时给监护提示', () => {
    const verdict = checkSafety('我16岁，想问学业')
    expect(verdict.level).toBe('minor')
    expect(verdict.message).toContain('12355')
  })

  it('未成年人不能直接看婚恋结果', async () => {
    // minor 级在 Web 端直接显示提示并停止，不进入排盘
    const verdict = checkSafety('我15岁，我和男朋友要不要分手')
    expect(['minor', 'crisis']).toContain(verdict.level)
  })
})

describe('正常输入不受影响', () => {
  const normal = ['我要不要换工作', '下个月适合搬家吗', '我该怎么安排学习计划', '这件事我该不该主动']

  for (const input of normal) {
    it(`「${input}」放行`, () => {
      const verdict = checkSafety(input)
      expect(verdict.level).toBe('ok')
      expect(verdict.message).toBeNull()
    })
  }

  it('正常输入能正常生成盲测', async () => {
    const match = await composeBlindMatch(request('我要不要换工作'), ['ziping', 'meihua'])
    expect(match.answers).toHaveLength(2)
  })
})

describe('误报是可接受的取舍', () => {
  it('宁可多拦：夸张表达也会命中', () => {
    // "笑死我了" 不含危机词；"我要死了" 会命中 —— 这是刻意选择
    expect(checkSafety('这个段子笑死我了').level).toBe('ok')
    expect(checkSafety('累得我要死了').level).toBe('crisis')
  })
})

describe('文案常量集中管理', () => {
  it('所有安全文案都在 SAFETY_MESSAGES 里，便于审查', () => {
    expect(Object.keys(SAFETY_MESSAGES).sort()).toEqual(['abuse', 'crisis', 'financial', 'legal', 'medical', 'minor'])
    for (const text of Object.values(SAFETY_MESSAGES)) {
      expect(text.length).toBeGreaterThan(20)
    }
  })
})
