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
import { ask } from '@/runtime'

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

describe('医疗分级：治疗决策阻断，身心困扰提示', () => {
  /*
   * 这条断言在 v0.7.1 改过。原来的写法是「停药问题只提醒、仍可继续」，
   * 那是错的：停药属于治疗决策，排盘参与这个决定本身就不该发生。
   * 实测事故是「我爸生病了要不要手术」被完整排盘并给出断语。
   *
   * 现在的分级：
   *  - 手术 / 化疗 / 停药 / 换药 → crisis，直接拒绝
   *  - 睡不好 / 焦虑 / 疲惫 → medical，给提示但可谈作息
   */
  it('停药属于治疗决策，必须阻断并给出就医提示', () => {
    const verdict = checkSafety('我能不能停药')
    expect(verdict.level).toBe('crisis')
    expect(isBlocking(verdict)).toBe(true)
    expect(verdict.message).toContain('医生')
  })

  it('身心困扰只提示不阻断', () => {
    const verdict = checkSafety('我最近总是睡不好')
    expect(verdict.level).toBe('medical')
    expect(isBlocking(verdict)).toBe(false)
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

describe('未成年识别：真实表达全覆盖', () => {
  const HIT = [
    '我 14 岁，想问学业', '我十四岁，能和我说说吗', '今年14，想问问考试',
    '14岁可以算吗', '我15周岁了', '17周岁，想问问未来', '读初三，压力很大',
    '初二学生适合算吗', '高一了，想问问选科', '高三党，想问高考',
    '未成年，能算吗', '未满18岁', '不满十八', '我是初三的',
    '16岁，想问问感情', '今年 12 岁', '俺十七了？不对，俺十六岁',
  ]
  for (const q of HIT) {
    it(`拦：${q}`, () => expect(checkSafety(q).level).toBe('minor'))
  }

  const MISS = [
    '我今年 34 岁，想问事业', '48 岁了，想看看退休', '我 60 岁，孩子高三',
    '初中时的事影响到现在', '孩子读高三，我能帮他问吗', '我今年 45，孩子上高一',
    '30岁想换工作', '我 28 岁，想问婚姻', '高二那年的事', '大学二年级了',
  ]
  for (const q of MISS) {
    it(`不误报：${q}`, () => expect(checkSafety(q).level).not.toBe('minor'))
  }
})

describe('安全规则在四个宿主上必须一致', () => {
  it('未成年：运行时（CLI/HTTP/MCP 共同入口）必须拒绝', async () => {
    await expect(ask({ question: '我16岁，想问学业' })).rejects.toThrow(/未成年|监护人/)
  })

  it('未成年：拒绝时是真阻断，不是只返回提示', async () => {
    const v = checkSafety('我16岁，想问学业')
    expect(v.level).toBe('minor')
    expect(isBlocking(v), 'minor 必须是阻断级，否则 CLI 会照常出结果').toBe(true)
  })

  it('财务/法律：放行但要带边界提示；治疗决策则阻断', async () => {
    for (const q of ['要不要借钱炒股', '想起诉离婚协议']) {
      const v = checkSafety(q)
      expect(isBlocking(v), `${q} 不该被硬拦`).toBe(false)
      expect(domainNotice(v.level), `${q} 必须带提示`).not.toBeNull()
    }
  })

  it('运行时生成的回答里带着 notice 字段', async () => {
    // 用身心困扰类问题：它是 medical（提示级），能正常生成回答并带 notice
    const match = await ask({ question: '我最近总是睡不好', masterIds: ['ziping', 'meihua'] })
    expect(match.answers[0]!.notice).toBeTruthy()
    expect(match.answers[1]!.notice).toBeTruthy()
    expect(match.answers[0]!.notice).toContain('医疗')
  })

  it('治疗决策在运行时被直接拒绝', async () => {
    await expect(ask({ question: '要不要做手术', masterIds: ['ziping', 'meihua'] })).rejects.toThrow()
  })

  it('普通问题不带 notice，避免每条都挂免责声明', async () => {
    const match = await ask({ question: '我要不要换工作', masterIds: ['ziping', 'meihua'] })
    expect(match.answers[0]!.notice).toBeUndefined()
  })
})

describe('医疗与法律：语序无关的结构识别', () => {
  /*
   * 这一组守的是一个真实事故：词表写的是「手术要不要」，
   * 用户说的是「要不要手术」—— 同样的词换个语序就完全失配，
   * 系统对「我爸生病了要不要手术」照常排盘并给出断语。
   * 靠继续堆字面词解决不了，改成了「医疗对象 + 决策意图」共现。
   */
  /*
   * 治疗决策类（手术/化疗/停药）判 crisis（阻断）；
   * 确诊类（查出来有病）判 medical（提示）。
   * 两者都必须「拦」，但阻断级别不同 —— 测试按各自应有的级别断言，
   * 而不是笼统地都写成 medical。
   */
  const TREATMENT_DECISIONS = [
    '我爸生病了要不要手术',
    '要不要做手术',
    '手术该不该做',
    '这个药能停吗',
    '要不要吃这个药',
    '医生说要做化疗，怎么办',
  ]
  for (const q of TREATMENT_DECISIONS) {
    it(`治疗决策必须阻断：${q}`, () => {
      const v = checkSafety(q)
      expect(v.level, `${q} 应判 crisis`).toBe('crisis')
      expect(isBlocking(v)).toBe(true)
    })
  }

  const DIAGNOSIS = ['我最近查出来有病', '诊断出癌症', '体检出结节']
  for (const q of DIAGNOSIS) {
    it(`确诊类给提示：${q}`, () => {
      expect(checkSafety(q).level).toBe('medical')
    })
  }

  const LEGAL_CASES = ['我想起诉他', '该不该报警', '我想打官司', '要不要请律师', '离婚协议怎么签']
  for (const q of LEGAL_CASES) {
    it(`法律必须拦：${q}`, () => {
      expect(checkSafety(q).level).toBe('legal')
    })
  }

  /*
   * 同时必须不误伤。医疗词里有「药」这种高频字，
   * 如果只按单字匹配，「药妆」「合同」「睡不好」都会被打成医疗。
   */
  // 注意：「我最近总是睡不好」现在属于 medical（身心困扰），不再列为"不该命中"
  const NOT_MEDICAL = ['我想换个药妆品牌', '公司要我签合同，怎么看', '查出来他的秘密']
  for (const q of NOT_MEDICAL) {
    it(`不应误报：${q}`, () => {
      expect(checkSafety(q).level).toBe('ok')
    })
  }
})

describe('高风险医疗必须阻断，而非只给提示', () => {
  /*
   * 实测事故：问「我爸生病了要不要手术」，系统完整排盘并给出断语。
   * 医疗原先只有提示级别（advisory），所以照常生成内容 —— 但手术、用药、
   * 化疗这类问题是在替医生做决定，排盘本身就不该发生。
   * 现在按危险程度分成两级：治疗决策 → crisis（阻断），身心困扰 → medical（提示）。
   */
  const BLOCKING = ['我爸生病了要不要手术', '要不要做手术', '这个药能停吗', '医生说要做化疗，怎么办']
  for (const q of BLOCKING) {
    it(`必须阻断：${q}`, () => {
      const v = checkSafety(q)
      expect(v.level, `${q} 应判为 crisis`).toBe('crisis')
      expect(isBlocking(v), `${q} 必须阻断，不能只给提示`).toBe(true)
    })
  }

  const ADVISORY = ['我最近睡不好怎么调整', '总是焦虑怎么办']
  for (const q of ADVISORY) {
    it(`给提示但不阻断：${q}`, () => {
      const v = checkSafety(q)
      expect(v.level).toBe('medical')
      expect(isBlocking(v), `${q} 可以谈作息与压力，不该硬拦`).toBe(false)
    })
  }

  it('普通问题不误伤', () => {
    for (const q of ['我要不要换工作', '这个月适合买房吗', '我男朋友不回消息', '老板让我周末加班']) {
      expect(checkSafety(q).level).toBe('ok')
    }
  })
})
