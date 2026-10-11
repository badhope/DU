/**
 * DU · 共鸣引擎 · 输出层
 *
 * 把 Matched 翻成 ResultNode：每条断语都必须带
 * 「为什么选中我」（触发特征）与「这句话有多少人是通用的」（baseRate）。
 * 引擎的可解释性靠这里落到界面上，否则等于没有。
 */
import type { ResultNode } from '@/contract/result'
import { SITUATION_LABEL, extractFeatures, type RawContext, type Situation } from './features'
import { hashSeed, match, type Matched } from './match'
import { LIBRARY } from './statements.library'
import { SEED, type Statement } from './statements'

/** 生产命库 = 种子 + 扩展，单一入口，避免各处自行拼数组 */
export const STATEMENTS: Statement[] = [...SEED, ...LIBRARY]

const SIGNAL_LABEL: Record<string, string> = {
  'domain:career': '你问的是前程',
  'domain:love': '你问的是感情',
  'domain:study': '你问的是学业',
  'domain:health': '你问的是身体',
  'domain:wealth': '你问的是钱财',
  'domain:family': '你问的是家人',
  'domain:general': '你没限定领域',
  'time:late-night': '现在是深夜',
  'time:morning': '现在是清晨',
  'time:work-peak': '现在是工作时段',
  'time:midday': '现在是午间',
  'time:evening': '现在是傍晚',
  'time:night': '现在是夜里',
  'mood:reflective': '深夜常伴的回想状态',
  'mood:wind-down': '收尾放松时段',
  'behavior:repeat-visitor': '你不是第一次来',
  'season:spring': '春',
  'season:summer': '夏',
  'season:autumn': '秋',
  'season:winter': '冬',
}

const STAGE_LABEL: Record<string, string> = {
  student: '学生阶段',
  early: '初入社会',
  mid: '而立上下',
  settled: '家中顶梁柱',
  later: '已过中场',
}

/** 特征键 → 人话；未知前缀原样回显，方便发现词表漂移 */
export function explainKey(key: string): string {
  const [head, ...rest] = key.split(':')
  const tail = rest.join(':')
  if (head === 'sit') return `你勾选了「${SITUATION_LABEL[tail as Situation] ?? tail}」`
  if (head === 'stage') return STAGE_LABEL[tail] ?? tail
  if (head === 'age') return `年龄段：${tail}`
  if (head === 'life') return '这个年纪常见的人生事件'
  if (head === 'history') return '你上次也问过这里'
  if (head === 'resonated') return '你之前标记过"说中了"的主题'
  return SIGNAL_LABEL[key] ?? key
}

export interface ResonanceOptions {
  n?: number
  seed?: number
  seen?: string[]
}

export function resonate(ctx: RawContext, opts: ResonanceOptions = {}): Matched[] {
  return match(STATEMENTS, extractFeatures(ctx), {
    n: opts.n ?? 4,
    seed: opts.seed ?? hashSeed(JSON.stringify(ctx)),
    ...(opts.seen ? { seen: opts.seen } : {}),
  })
}

const pct = (v: number) => `${Math.round(v * 100)}%`

/** 单条命 → 一节：正文、可核出处、命中率明示、触发理由、出路 */
function statementNode(m: Matched, index: number): ResultNode {
  const { st } = m
  const children: ResultNode[] = [{ kind: 'text', lines: [st.text], lead: true }]

  children.push({
    kind: 'kv',
    items: [
      {
        label: '人群天然适用',
        value: pct(st.baseRate) + (m.generic ? '（泛谈）' : ''),
        tone: st.baseRate > 0.6 ? 'warn' : 'good',
      },
      { label: '你的真实信号', value: m.signal > 0 ? pct(m.signal) : '无 · 补位' },
    ],
  })

  if (m.reasons.length)
    children.push({
      kind: 'chips',
      items: m.reasons.map((r) => ({ text: explainKey(r), tone: 'info' as const })),
    })

  if (!st.source)
    return {
      kind: 'section',
      title: `第 ${index + 1} 条`,
      children: [...children, { kind: 'note', text: '本条未标出处，按不可信处理。', tone: 'warn' }],
    }

  const s = st.source
  if (s.kind === 'canon' && s.quote) {
    // 出处必须是可点开的引文节点，不是排好版的字：读者点进去要真能搜到
    children.push({
      kind: 'quote',
      book: s.book ?? '佚',
      text: s.quote,
      ...(s.loc ? { loc: s.loc } : {}),
      ...(s.gloss ? { gloss: s.gloss } : {}),
    })
  } else {
    const lines =
      s.kind === 'psych' ? ['现代心理观察', s.gloss ?? ''] : ['经验观察', s.gloss ?? '']
    children.push({ kind: 'text', lines: lines.filter(Boolean) })
  }

  if (st.action) children.push({ kind: 'note', text: '可以做的：' + st.action, tone: 'good' })

  return {
    kind: 'section',
    title: `第 ${index + 1} 条`,
    hint: s.kind === 'canon' ? '有出处' : '观察',
    children,
  }
}

export function resonanceNodes(items: Matched[]): ResultNode[] {
  if (!items.length)
    return [
      {
        kind: 'note',
        text: '这次没有足够的真实信号，引擎拒绝编一句来凑数。多勾两项处境再来。',
        tone: 'warn',
      },
    ]
  const hard = items.filter((m) => m.signal > 0).length
  return [
    {
      kind: 'note',
      text: `${items.length} 条里有 ${hard} 条来自你填的真实信息；其余为无信号补位，界面已标注。`,
      tone: 'info',
    },
    ...items.map((m, i) => statementNode(m, i)),
  ]
}

/** 只给领域、不给任何处境时，能带真实信号入选的条数——机制页用它说明"宁缺毋滥" */
export function bareSignalCount(): number {
  const f = extractFeatures({ nowYear: new Date().getFullYear(), domain: 'general', situations: [] })
  return match(STATEMENTS, f, { n: 6, seed: 1 }).filter((m) => m.signal > 0).length
}
