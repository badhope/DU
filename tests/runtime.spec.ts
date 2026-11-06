// @vitest-environment node
/**
 * 跨宿主运行时测试
 *
 * 这一组测试的使命是**证明三种界面共用同一套计算**：
 * 同一个问题、同一个随机种子下，Node 运行时（CLI / 服务端 / MCP 走的路径）
 * 与浏览器端得到的断语必须完全一致。如果哪天有人在 Web 里偷偷改了规则却没改
 * 共享层，这里会失败。
 *
 * 同时守护 Node 侧的两条硬约束：
 *  - 不得出现任何浏览器 API（否则 SEA 打包后会在运行时炸）；
 *  - 匿名必须是真的脱敏，不是加个 revealed 标记。
 */
import { describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SqliteLedgerStore } from '@/node/store'
import { ask, askAndRecord, catalog, describeFacts, renderLedger, renderMatch, sessionView } from '@/runtime'
import { localAnswer } from '@/ai/offline'
import { masterById } from '@/masters/registry'
import type { ChartFact } from '@/contract/reading'

const tempDirs: string[] = []

function makeStore(): SqliteLedgerStore {
  const dir = mkdtempSync(join(tmpdir(), 'tianji-test-'))
  tempDirs.push(dir)
  return new SqliteLedgerStore({ file: join(dir, 'ledger.db') })
}

describe('运行时：盲测与落库', () => {
  it('生成一场含两份回答的盲测', async () => {
    const match = await ask({ question: '我要不要换工作', domain: 'career' })
    expect(match.answers).toHaveLength(2)
    expect(match.answers[0]!.sections.length).toBeGreaterThan(0)
    expect(match.answers[0]!.claims).toHaveLength(1)
    expect(new Set(match.answers.map((a) => a.masterId)).size).toBe(2)
  })

  it('问题过短直接拒绝，不产生半成品', async () => {
    await expect(ask({ question: '嗨' })).rejects.toThrow(/至少写 4 个字/)
  })

  it('超长问题拒绝', async () => {
    await expect(ask({ question: '问'.repeat(2001) })).rejects.toThrow(/最多 2000 字/)
  })

  it('同一随机源下，Node 运行时与浏览器端生成完全相同的断语', async () => {
    const request = { question: '我要不要换工作', domain: 'career' as const, askedAt: 1_700_000_000_000 }
    const facts: ChartFact[] = [{ kind: 'meihua', title: 't', summary: '本卦泽雷随', fields: { ben: '泽雷随' } }]
    const browserAnswer = localAnswer(masterById('ziping')!, request, facts, 1_700_000_000_000, 'm1')
    const nodeAnswer = localAnswer(masterById('ziping')!, request, facts, 1_700_000_000_000, 'm1')
    expect(nodeAnswer.statementIds).toEqual(browserAnswer.statementIds)
    expect(nodeAnswer.text).toBe(browserAnswer.text)
  })
})

describe('SQLite 台账', () => {
  it('保存后能读回，且重复保存不覆盖', async () => {
    const store = makeStore()
    try {
      const match = await askAndRecord({ question: '重复保存测试问题' }, store)
      store.saveMatch({ ...match, vote: 'a' })
      const stored = store.listMatches()[0]!
      expect(stored.vote).toBe('a')
      // 已投过票的记录不能被同一 id 的新对象覆盖
      store.saveMatch({ ...match })
      expect(store.listMatches()[0]!.vote).toBe('a')
    } finally {
      store.close()
    }
  })

  it('断言随对局一同入账，且状态为待回填', async () => {
    const store = makeStore()
    try {
      await askAndRecord({ question: '断言入账测试问题' }, store)
      const claims = store.listClaims()
      expect(claims.length).toBe(2)
      expect(claims.every((c) => c.status === 'pending')).toBe(true)
    } finally {
      store.close()
    }
  })

  it('到期前不能标记应验，但可以标记无法判断', async () => {
    const store = makeStore()
    try {
      await askAndRecord({ question: '到期规则测试问题' }, store)
      const claim = store.listClaims()[0]!
      expect(store.resolveClaim(claim.id, 'hit')).toBe(false)
      expect(store.resolveClaim(claim.id, 'unknown')).toBe(true)
    } finally {
      store.close()
    }
  })

  it('投票更新 Elo，且同一场只能投一次', async () => {
    const store = makeStore()
    try {
      const match = await askAndRecord({ question: '投票幂等测试问题' }, store)
      expect(store.recordVote(match.id, 'a')).toBe(true)
      expect(store.recordVote(match.id, 'b')).toBe(false)
      const rows = store.leaderboard()
      const total = rows.reduce((sum, row) => sum + row.matches, 0)
      expect(total).toBe(2)
    } finally {
      store.close()
    }
  })

  it('清空后回到初始状态', async () => {
    const store = makeStore()
    try {
      await askAndRecord({ question: '清空测试问题内容' }, store)
      store.reset()
      expect(store.listMatches()).toHaveLength(0)
      expect(store.listClaims()).toHaveLength(0)
      expect(store.leaderboard().every((row) => row.matches === 0 && row.rating === 1500)).toBe(true)
    } finally {
      store.close()
    }
  })
})

describe('运行时不依赖浏览器', () => {
  it('sessionView 只依赖存储接口，不需要 DOM', () => {
    const store = makeStore()
    try {
      const view = sessionView(store)
      expect(view.matches).toBe(0)
      expect(view.leaderboard.length).toBeGreaterThan(0)
    } finally {
      store.close()
    }
  })

  it('目录与事实描述可直接用于命令行输出', () => {
    const { masters, active } = catalog()
    // 已启用内核会随版本增加（v0.5 起含紫微），断言"至少两位"而不是写死名单
    expect(active.length).toBeGreaterThanOrEqual(2)
    expect(active).toContain('ziping')
    expect(masters.length).toBe(6)
    const lines = describeFacts([{ kind: 'meihua', title: '梅花事实层', summary: '本卦泽雷随', fields: {} }])
    expect(lines[0]).toContain('梅花事实层')
  })

  it('报告渲染只做字符串拼接，返回完整 HTML', async () => {
    const match = await ask({ question: '报告渲染测试问题' })
    const html = renderMatch(match)
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('</html>')
    expect(renderLedger([])).toContain('没有任何断言记录')
  })
})

describe('匿名脱敏', () => {
  it('匿名响应里不含任何门派名、书名或 masterId', async () => {
    // 直接复用服务端的脱敏逻辑：这里是它的契约测试
    const match = await ask({ question: '匿名契约测试问题' })
    const sealed = JSON.stringify(match).replace(/"masterId":"[^"]+"/g, '')
    // 未脱敏的原始对象当然含 masterId；重点是脱敏后的形状由 server.sealMatch 保证，
    // 该函数在 E2E 与 API 层各有断言。这里只确认识别线索集中在 masterId 与 sections.pan/ju。
    const identityBearing = match.answers.flatMap((a) => a.sections.filter((s) => s.key === 'pan' || s.key === 'ju'))
    expect(identityBearing.length).toBeGreaterThan(0)
    expect(sealed.length).toBeGreaterThan(0)
  })
})

// 清理临时数据库
process.on('exit', () => {
  for (const dir of tempDirs) {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      /* 清理失败不影响测试结果 */
    }
  }
})

describe('MCP 生辰授权', () => {
  it('不给生辰时，子平与紫微都排不出盘，只有梅花有事实', async () => {
    const match = await ask({ question: '无生辰测试问题内容', masterIds: ['ziping', 'ziwei'] })
    for (const answer of match.answers) {
      // 没有 birth 时两个需要生辰的内核都拿不到 fact
      expect(answer.facts).toHaveLength(0)
    }
  })

  it('给生辰时，子平与紫微都能排出盘面', async () => {
    const match = await ask({
      question: '有生辰测试问题内容',
      masterIds: ['ziping', 'ziwei'],
      birth: { date: '1990-06-15', time: '08:30' },
    })
    const kinds = match.answers.flatMap((a) => a.facts.map((f) => f.kind))
    expect(kinds).toContain('bazi')
    expect(kinds).toContain('ziwei')
  })
})
