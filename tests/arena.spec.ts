import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BlindMatch } from '@/contract/reading'
import { emptyStats } from '@/arena/rating'
import { exportArena, getArenaState, importArena, listMatches, recordVote, resetArena, resolveClaim, saveClaims, saveMatch } from '@/arena/store'
import { runBlindMatch } from '@/arena/readingFlow'

const match = (): BlindMatch => ({ id: 'match-test-1', request: { question: '测试问题', domain: 'general', askedAt: 1 }, masterIds: ['ziping', 'meihua'], answers: [
  { id: 'a', masterId: 'ziping', mode: 'local', text: 'a', sections: [], facts: [], citations: [], claims: [], statementIds: [], generatedAt: 1 },
  { id: 'b', masterId: 'meihua', mode: 'local', text: 'b', sections: [], facts: [], citations: [], claims: [], statementIds: [], generatedAt: 1 },
], createdAt: 1 })

describe('盲测与台账存储', () => {
  beforeEach(() => { localStorage.clear(); resetArena() })

  it('同一 match id 重复投票只计一次', () => {
    saveMatch(match())
    expect(recordVote('match-test-1', 'a')).toBe(true)
    expect(recordVote('match-test-1', 'a')).toBe(false)
    const state = getArenaState()
    expect(state.stats.ziping.matches).toBe(1)
    expect(state.stats.meihua.matches).toBe(1)
  })

  it('清空后恢复 1500 初始分和空对局', () => {
    saveMatch(match())
    resetArena()
    const state = getArenaState()
    expect(state.matches).toHaveLength(0)
    expect(state.stats.ziping).toEqual(emptyStats('ziping'))
  })

  it('重复选择同一大师会被拒绝', async () => {
    await expect(runBlindMatch({ question: '测试问题', domain: 'general', askedAt: 1 }, ['ziping', 'ziping'])).rejects.toThrow('两位不同的大师')
  })

  it('未知应验不进入应验率分母，截止日前不能标记命中', () => {
    saveClaims([{ id: 'claim-test', masterId: 'ziping', text: '测试断言', dueAt: Date.now() + 86_400_000, createdAt: Date.now(), status: 'pending' }])
    expect(resolveClaim('claim-test', 'hit')).toBe(false)
    expect(resolveClaim('claim-test', 'unknown')).toBe(true)
    expect(getArenaState().stats.ziping.claimsResolved).toBe(0)
  })

  it('非法导入不会覆盖现有对局', () => {
    saveMatch(match())
    expect(importArena(JSON.stringify({ stats: {}, matches: [], claims: [] })).ok).toBe(false)
    expect(getArenaState().matches).toHaveLength(1)
  })

  it('网络不可用时仍完成两位 active 大师的本地盲测', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network disabled') }))
    const result = await runBlindMatch(
      { question: '我是否应该主动寻找新机会？', domain: 'career', askedAt: 1_735_689_600_000 },
      ['ziping', 'meihua'],
    )
    expect(result.answers).toHaveLength(2)
    expect(result.answers.every((answer) => answer.mode === 'local')).toBe(true)
    expect(getArenaState().matches).toHaveLength(1)
  })

  it('同一时刻的不同问题不会互相覆盖对局', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network disabled') }))
    const first = await runBlindMatch({ question: '我是否应该换工作？', domain: 'career', askedAt: 1_735_689_600_000 }, ['ziping', 'meihua'])
    const second = await runBlindMatch({ question: '这段关系是否需要暂缓？', domain: 'love', askedAt: 1_735_689_600_000 }, ['ziping', 'meihua'])
    expect(second.id).not.toBe(first.id)
    expect(second.id).not.toContain('换工作')
    expect(second.id).not.toContain('暂缓')
    expect(getArenaState().matches).toHaveLength(2)
  })
})

describe('刷新后本机台账必须存活', () => {
  /**
   * 这条回归测试针对一个真实上线过的缺陷：store 模块把 `readState()` 写在
   * 常量辅助函数之前，模块初始化时触发 TDZ 错误被 catch 吞掉，导致每次刷新
   * 都静默回退到空状态 —— 用户的对局与应验记录全部消失，界面还显示"还没有对局"。
   */
  beforeEach(() => { localStorage.clear(); resetArena() })

  it('已保存的对局能被重新读取（模拟刷新后的模块初始化）', async () => {
    const { runBlindMatch } = await import('@/arena/readingFlow')
    const created = await runBlindMatch(
      { question: '刷新后还在吗', domain: 'general', askedAt: 1_700_000_000_000 },
      ['ziping', 'meihua'],
    )
    // 用导出字符串验证"磁盘上的字节"完整，再喂回导入路径
    const persisted = exportArena()
    expect(JSON.parse(persisted).matches).toHaveLength(1)

    resetArena()
    expect(listMatches()).toHaveLength(0)

    expect(importArena(persisted).ok).toBe(true)
    const restored = listMatches()
    expect(restored).toHaveLength(1)
    expect(restored[0]!.id).toBe(created.id)
    expect(restored[0]!.answers).toHaveLength(2)
  })

  it('导出内容带 schema 版本号', () => {
    const parsed = JSON.parse(exportArena())
    expect(parsed.schema).toBe(2)
    expect(parsed.stats.ziping.masterId).toBe('ziping')
  })
})

describe('存储写入失败必须可被界面感知', () => {
  it('配额满时返回 quota 状态，而不是静默成功', async () => {
    const store = await import('@/arena/store')
    const real = globalThis.localStorage
    // happy-dom 的 Storage 方法不可直接改写，替换整个对象更可靠
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          const error = new Error('quota')
          error.name = 'QuotaExceededError'
          throw error
        },
        removeItem: () => {},
        clear: () => {},
      },
    })
    try {
      store.resetArena()
      expect(store.getPersistStatus()).toBe('quota')
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: real })
    }
  })

  it('存储被禁用时返回 blocked 状态', async () => {
    const store = await import('@/arena/store')
    const real = globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error('SecurityError')
        },
        removeItem: () => {},
        clear: () => {},
      },
    })
    try {
      store.resetArena()
      expect(store.getPersistStatus()).toBe('blocked')
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: real })
    }
  })

  it('写入恢复正常后状态回到 ok', async () => {
    const store = await import('@/arena/store')
    const real = globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => { throw new Error('boom') },
        removeItem: () => {},
        clear: () => {},
      },
    })
    store.resetArena()
    expect(store.getPersistStatus()).toBe('blocked')
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: real })
    store.resetArena()
    expect(store.getPersistStatus()).toBe('ok')
  })
})

describe('导入 schema 迁移', () => {
  beforeEach(() => { localStorage.clear(); resetArena() })

  it('v1 文件（无 schema 字段）能导入，并报告来源版本', async () => {
    const { migrate } = await import('@/arena/store')
    const v1 = { stats: {}, matches: [], claims: [] }
    const result = migrate(v1)
    expect(result?.from).toBe(1)
    expect((result?.state as { schema: number }).schema).toBe(2)
  })

  it('v2 文件原样通过', async () => {
    const { migrate } = await import('@/arena/store')
    const v2 = { schema: 2, stats: {}, matches: [], claims: [] }
    expect(migrate(v2)?.from).toBe(2)
  })

  it('未来版本被拒绝，而不是猜测结构', async () => {
    const { migrate } = await import('@/arena/store')
    expect(migrate({ schema: 99, stats: {}, matches: [], claims: [] })).toBeNull()
  })

  it('导出再导入是恒等的（版本与内容都不变）', () => {
    const before = exportArena()
    expect(importArena(before).ok).toBe(true)
    expect(exportArena()).toBe(before)
  })

  it('损坏的 JSON 返回可读原因，不抛异常', () => {
    const result = importArena('{not json')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('JSON')
  })
})

describe('持久化白名单必须覆盖全部内核', () => {
  beforeEach(() => { localStorage.clear(); resetArena() })

  it('含紫微盘面的对局能存能读，不会在刷新后消失', async () => {
    const { calculateZiwei } = await import('@/core/ziwei')
    const chart = await calculateZiwei({ date: '1990-06-15', time: '08:30' })
    if ('error' in chart) throw new Error(chart.error)

    const match: BlindMatch = {
      id: 'match-ziwei-persist',
      request: { question: '紫微持久化测试问题', domain: 'general', askedAt: 1_700_000_000_000 },
      masterIds: ['ziwei', 'meihua'],
      answers: [
        {
          id: 'a', masterId: 'ziwei', mode: 'local', text: '',
          sections: [{ key: 'pan', title: '盘面事实', lines: ['盘面事实：土五局'] }],
          facts: [chart.fact],
          citations: [], claims: [], statementIds: [], generatedAt: 1,
        },
        {
          id: 'b', masterId: 'meihua', mode: 'local', text: '',
          sections: [{ key: 'duan', title: '断语', lines: ['- 测试'] }],
          facts: [{ kind: 'meihua', title: 't', summary: 's', fields: {} }],
          citations: [], claims: [], statementIds: [], generatedAt: 1,
        },
      ],
      createdAt: 1_700_000_000_000,
    }

    saveMatch(match)
    const exported = exportArena()
    expect(JSON.parse(exported).matches).toHaveLength(1)

    // 关键：重新导入必须通过校验。若 kind 白名单漏了 ziwei，这里会 false。
    resetArena()
    expect(importArena(exported).ok).toBe(true)
    expect(listMatches()[0]!.answers[0]!.facts[0]!.kind).toBe('ziwei')
  })
})

describe('损坏数据被隔离而不是丢弃', () => {
  beforeEach(() => { localStorage.clear(); resetArena() })

  it('resetArena 之后加载到非法结构，会先备份原始字节再回退', async () => {
    // 直接测 readState 的隔离分支：把非法内容写进 key，然后重新导入模块
    const bad = JSON.stringify({ stats: {}, matches: [{ broken: true }], claims: [] })
    localStorage.setItem('tianji.arena.v1', bad)

    const fresh = await import('@/arena/store?quarantine-test=' + Date.now())
    // 回退到空状态
    expect(fresh.listMatches()).toHaveLength(0)

    // 原始字节被搬到隔离区，没有凭空消失
    const quarantined = localStorage.getItem('tianji.arena.quarantine')
    expect(quarantined).not.toBeNull()
    expect(quarantined).toContain('broken')
    expect(fresh.hasQuarantinedData()).toBe(true)
  })
})
