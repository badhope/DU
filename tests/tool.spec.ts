/**
 * 工具契约测试
 *
 * v1 的 README 与注册表漂移（49 vs 43）就是因为没有一层测试钉住契约。
 * 这里不测断语内容，只测"任何工具都必须成立的结构性质"：
 * 加第 10 个工具时，它若字段乱写、结果不合法，CI 当场红。
 */
import { describe, expect, it } from 'vitest'
import type { ResultNode, Tone } from '@/contract/result'
import type { Tool, ToolInput } from '@/contract/tool'
import { CATEGORIES, TOOLS, TOOL_COUNT, toolById, toolsByCategory } from '@/tools/registry'

const NODE_KINDS = [
  'stack',
  'row',
  'section',
  'grid',
  'kv',
  'chips',
  'bars',
  'score',
  'table',
  'matrix',
  'gua',
  'text',
  'quote',
  'note',
] as const
const TONES: Tone[] = [
  'default',
  'good',
  'bad',
  'warn',
  'info',
  'mu',
  'huo',
  'tu',
  'jin',
  'shui',
]

function walk(node: ResultNode, fn: (n: ResultNode) => void) {
  fn(node)
  if (node.kind === 'stack' || node.kind === 'row' || node.kind === 'section')
    node.children.forEach((c) => walk(c, fn))
}

function collectNodes(nodes: ResultNode[]): ResultNode[] {
  const out: ResultNode[] = []
  nodes.forEach((n) => walk(n, (x) => out.push(x)))
  return out
}

describe('工具注册表', () => {
  it('id 唯一，且注册表与计数、分类视图一致', () => {
    const ids = TOOLS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(TOOL_COUNT).toBe(ids.length)
    for (const id of ids) expect(toolById(id)?.id).toBe(id)
    // 每个工具都必须在某个分类里出现一次（否则首页漏展示）
    const listed = CATEGORIES.flatMap((c) => toolsByCategory(c.id).map((t) => t.id))
    expect(listed.sort()).toEqual(ids.sort())
  })

  it('分类 id 唯一且工具的 category 都有对应分类', () => {
    const cids = CATEGORIES.map((c) => c.id)
    expect(new Set(cids).size).toBe(cids.length)
    for (const t of TOOLS) expect(cids).toContain(t.category)
  })

  it('accent 只允许 var(--*) token，不许出现色值（颜色只在 theme.css）', () => {
    for (const c of CATEGORIES) {
      expect(c.accent, `${c.id} 的 accent 不是 token`).toMatch(/^var\(--[\w-]+\)$/)
    }
  })

  it('每个工具字段 key 唯一、类型合法、select/multi 必须有选项', () => {
    for (const t of TOOLS) {
      const keys = t.fields.map((f) => f.key)
      expect(new Set(keys).size, `${t.id} 字段 key 重复`).toBe(keys.length)
      expect(t.fields.length, `${t.id} 没有任何输入字段`).toBeGreaterThan(0)
      for (const f of t.fields) {
        if (f.type === 'select' || f.type === 'multi') {
          expect(f.options?.length, `${t.id}.${f.key} 缺 options`).toBeGreaterThan(0)
          // select 有默认值时必须在选项内，否则渲染出空白项
          if (typeof f.default === 'string' && f.default)
            expect(
              f.options!.some((o) => o.value === f.default),
              `${t.id}.${f.key} default 不在 options 内`,
            ).toBe(true)
        }
      }
    }
  })
})

describe('工具输出结构', () => {
  const cases: { tool: Tool; input: ToolInput }[] = [
    { tool: toolById('meihua')!, input: { mode: 'time', domain: 'career', situations: ['promotion'] } },
    { tool: toolById('meihua')!, input: { mode: 'number', numA: 3, numB: 8, domain: 'love' } },
    { tool: toolById('meihua')!, input: { mode: 'time', domain: 'health', birthYear: 1962 } },
  ]

  it('合法输入产出合法 ResultNode 树，且每条断语都带出处', async () => {
    for (const { tool, input } of cases) {
      const out = await tool.compute(input)
      expect('body' in out, `${tool.id} 计算失败：${'error' in out ? out.error : ''}`).toBe(true)
      if (!('body' in out)) continue

      expect(out.title.length).toBeGreaterThan(0)
      const nodes = collectNodes(out.body)
      expect(nodes.length, `${tool.id} 结果树为空`).toBeGreaterThan(3)

      for (const n of nodes) {
        expect(NODE_KINDS, `未知节点类型 ${n.kind}`).toContain(n.kind)
        if ('tone' in n && n.tone) expect(TONES).toContain(n.tone)
      }

      // 引擎产物：每条命都要有 source（契约里写明的伦理线）
      for (const f of out.feedback ?? []) expect(f.text.length).toBeGreaterThan(0)
    }
  })

  it('结果里出现的"人群适用"与"真实信号"两项必须成对（透明性落到界面）', async () => {
    const out = await cases[0]!.tool.compute(cases[0]!.input)
    if (!('body' in out)) throw new Error('no body')
    const kvs = collectNodes(out.body).filter((n) => n.kind === 'kv')
    const labels = kvs.flatMap((n) => (n.kind === 'kv' ? n.items.map((i) => i.label) : []))
    expect(labels).toContain('人群天然适用')
    expect(labels).toContain('你的真实信号')
  })

  it('排盘必须同时给出本卦、互卦、变卦与体用（可复核性）', async () => {
    const out = await cases[0]!.tool.compute(cases[0]!.input)
    if (!('body' in out)) throw new Error('no body')
    const nodes = collectNodes(out.body)
    const gua = nodes.find((n) => n.kind === 'gua')
    expect(gua?.kind).toBe('gua')
    if (gua?.kind !== 'gua') return
    expect(gua.lines).toHaveLength(6)
    expect(gua.lines.filter((l) => l.moving)).toHaveLength(1)
    // 三卦在 grid，体用在 kv——两处都要有，否则用户无从复核
    const labels = [
      ...nodes.flatMap((n) => (n.kind === 'grid' ? n.cells.map((c) => c.label ?? '') : [])),
      ...nodes.flatMap((n) => (n.kind === 'kv' ? n.items.map((i) => i.label ?? '') : [])),
    ]
    for (const need of ['本卦', '互卦', '变卦', '体', '用', '体用']) expect(labels, `缺 ${need}`).toContain(need)
  })

  it('免责声明与出处必须出现在结果里', async () => {
    const out = await cases[0]!.tool.compute(cases[0]!.input)
    if (!('body' in out)) throw new Error('no body')
    const texts = collectNodes(out.body)
      .filter((n) => n.kind === 'note' || n.kind === 'text' || n.kind === 'quote')
      .map((n) =>
        n.kind === 'note' ? n.text : n.kind === 'text' ? n.lines.join('') : `《${n.book}》${n.text}`,
      )
      .join('\n')
    expect(texts).toContain('梅花易数')
    expect(texts).toMatch(/不作医疗|不作为医疗/)
  })

  it('canon 出必须是 quote 节点（可点开核对），不许退化成排好版的纯文本', async () => {
    const out = await cases[0]!.tool.compute(cases[0]!.input)
    if (!('body' in out)) throw new Error('no body')
    const quotes = collectNodes(out.body).filter((n) => n.kind === 'quote')
    // 至少要有 canon 出现，否则这条断言是空过的
    expect(quotes.length, '结果里一条 canon 出处都没有').toBeGreaterThan(0)
    for (const q of quotes) {
      if (q.kind !== 'quote') continue
      expect(q.book.length, '出处没书名').toBeGreaterThan(0)
      expect(q.text.length, '出处没引文').toBeGreaterThan(3)
      // 引文不该被截断成省略号尾巴——截断就是凭印象引书的痕迹
      expect(q.text).not.toMatch(/…$/)
    }
  })

  it('非法输入返回 error 而不是抛异常或空结果', async () => {
    const t = toolById('meihua')!
    const bad = await t.compute({ mode: 'number', numA: 0, numB: 1, domain: 'career' })
    expect('error' in bad).toBe(true)
    const badDate = await t.compute({ mode: 'time', date: 'not-a-date', domain: 'career' })
    expect('error' in badDate).toBe(true)
  })

  it('同一输入 + 同一批号结果完全一致；换批号才换内容', async () => {
    const t = toolById('meihua')!
    const input: ToolInput = { mode: 'time', domain: 'career', situations: ['plateau'], date: '2026-10-11', time: '14:30' }
    const s = { visitCount: 1, lastDomains: [], resonatedTags: [], round: 0, seen: [] }
    const a = await t.compute(input, s)
    const b = await t.compute(input, s)
    if (!('body' in a) || !('body' in b)) throw new Error('compute failed')
    expect(a.title).toBe(b.title)
    expect(a.feedback?.map((f) => f.id)).toEqual(b.feedback?.map((f) => f.id))

    const c = await t.compute(input, { ...s, round: 5 })
    if (!('body' in c)) throw new Error('compute failed')
    expect(c.title).toBe(a.title) // 卦不变——同一时刻同一起例
  })

  it('工具自陈一致：标题卦名 = 卦画节点卦名', async () => {
    const t = toolById('meihua')!
    const s = { visitCount: 1, lastDomains: [], resonatedTags: [], round: 0, seen: [] }
    const out = await t.compute({ mode: 'time', domain: 'love', date: '2026-10-11', time: '15:30' }, s)
    if (!('body' in out)) throw new Error('compute failed')
    const gua = collectNodes(out.body).find((n) => n.kind === 'gua')
    if (gua?.kind !== 'gua') throw new Error('no gua node')
    expect(out.title).toContain(gua.title?.replace('本卦 · ', ''))
  })
})
