/**
 * 报告导出
 *
 * 导出文件会离开应用，落进用户磁盘、邮件附件或打印纸。所以这里守两件事：
 *  1. 用户输入必须转义 —— 问题、回答、引文都可能是从别处导入的 JSON；
 *  2. 文件必须自包含 —— 断网、换机器打开都要能正常显示。
 */
import { describe, expect, it } from 'vitest'
import type { BlindMatch, Claim } from '@/contract/reading'
import { renderLedgerReport, renderMatchReport } from '@/arena/report'

const match = (): BlindMatch => ({
  id: 'match-abcdef1234567890',
  request: { question: '要不要换工作？', domain: 'career', askedAt: 1_700_000_000_000 },
  masterIds: ['ziping', 'meihua'],
  createdAt: 1_700_000_000_000,
  vote: 'a',
  answers: [
    {
      id: 'a1',
      masterId: 'ziping',
      mode: 'local',
      text: '',
      sections: [
        { key: 'duan', title: '断语', lines: ['- 你已经有答案了。'] },
        { key: 'ju', title: '依据', lines: ['> 《滴天髓》通神论：「行之始而進」'] },
      ],
      facts: [],
      citations: [{ book: '滴天髓', loc: '通神论', text: '行之始而進', origin: 'canon', verification: 'verified' }],
      claims: [],
      statementIds: ['st-1'],
      generatedAt: 1_700_000_000_000,
    },
    {
      id: 'a2',
      masterId: 'meihua',
      mode: 'local',
      text: '',
      sections: [{ key: 'duan', title: '断语', lines: ['- 势在变。'] }],
      facts: [],
      citations: [],
      claims: [{ id: 'c1', masterId: 'meihua', text: '记录一次行动', dueAt: 1_800_000_000_000, createdAt: 1_700_000_000_000, status: 'pending' }],
      statementIds: ['st-2'],
      generatedAt: 1_700_000_000_000,
    },
  ],
})

describe('单次报告导出', () => {
  it('包含完整结构：问题、两位大师、引用与断言', () => {
    const html = renderMatchReport(match())
    expect(html).toContain('要不要换工作？')
    expect(html).toContain('沈砚舟')
    expect(html).toContain('梅叟')
    expect(html).toContain('行之始而進')
    expect(html).toContain('已核')
    expect(html).toContain('记录一次行动')
  })

  it('自包含：没有任何外部资源引用', () => {
    const html = renderMatchReport(match())
    expect(html).not.toMatch(/<script[^>]+src=/i)
    expect(html).not.toMatch(/<link[^>]+href=["']https?:/i)
    expect(html).not.toMatch(/@import\s+url\(/i)
    expect(html).not.toMatch(/https?:\/\/(?!www\.w3\.org)/)
  })

  it('转义用户输入，不执行注入的标签', () => {
    const evil = match()
    evil.request.question = '<img src=x onerror=alert(1)>换工作？'
    evil.answers[0]!.sections[0]!.lines = ['<script>alert("x")</script>']
    const html = renderMatchReport(evil)
    expect(html).not.toContain('<img src=x')
    expect(html).not.toContain('<script>alert')
    expect(html).toContain('&lt;img src=x')
    expect(html).toContain('&lt;script&gt;')
  })

  it('声明 noindex，避免被搜索引擎收录个人记录', () => {
    expect(renderMatchReport(match())).toContain('noindex')
  })

  it('领域边界提示进入导出文件，而不是只留在页面里', () => {
    /*
     * 导出的 HTML 是用来归档、转发、打印的。原页面说了"不构成医疗判断"，
     * 归档版本却没有 —— 这段话离开原页面就变成纯断语了。
     */
    const m = match()
    const notice = '以上不构成任何医疗判断。身体不适请就医。'
    const withNotice = {
      ...m,
      answers: m.answers.map((a) => ({ ...a, notice })) as typeof m.answers,
    }
    const html = renderMatchReport(withNotice)
    expect(html).toContain(notice)
    expect(html).toContain('class="notice"')
  })

  it('没有边界提示时不渲染空占位', () => {
    expect(renderMatchReport(match())).not.toContain('class="notice"')
  })
})

describe('应验簿报告导出', () => {
  const claims = (): Claim[] => [
    { id: 'c1', masterId: 'ziping', text: '记录一次行动', dueAt: 1_800_000_000_000, createdAt: 1_700_000_000_000, status: 'pending' },
    { id: 'c2', masterId: 'meihua', text: '回看那个决定', dueAt: 1_700_000_000_000, createdAt: 1_600_000_000_000, status: 'hit' },
    { id: 'c3', masterId: 'ziping', text: '留意一次谈话', dueAt: 1_700_000_000_000, createdAt: 1_600_000_000_000, status: 'unknown' },
  ]

  it('按到期时间排序，并给出统计口径', () => {
    const html = renderLedgerReport(claims())
    expect(html).toContain('共 3 条断言')
    expect(html).toContain('待回填 1')
    expect(html).toContain('已判定 1')
    expect(html).toContain('应验 1')
  })

  it('无法判断不进入已判定计数', () => {
    const html = renderLedgerReport(claims())
    // resolved 只算 hit/miss：3 条里 1 hit + 1 unknown + 1 pending
    expect(html).toContain('已判定 1')
    expect(html).toContain('无法判断')
  })

  it('空账本也生成合法页面', () => {
    const html = renderLedgerReport([])
    expect(html).toContain('没有任何断言记录')
    expect(html).toContain('</html>')
  })

  it('转义断言正文', () => {
    const html = renderLedgerReport([{ id: 'x', masterId: 'ziping', text: '<b onclick=evil>x</b>', dueAt: 1, createdAt: 1, status: 'pending' }])
    expect(html).not.toContain('<b onclick=evil>')
    expect(html).toContain('&lt;b onclick=evil&gt;')
  })
})
