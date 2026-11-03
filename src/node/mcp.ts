#!/usr/bin/env node
/**
 * 天机台 MCP Server
 *
 * 把本地排盘与盲测能力暴露给任何支持 Model Context Protocol 的客户端
 * （Claude Desktop、VS Code、Cursor 等）。用官方 SDK，不自己实现协议。
 *
 * 传输：stdio。这是 MCP 里最通用的本地传输方式，客户端只要配一条命令即可，
 * 不需要端口、不需要网络、不需要鉴权 —— 与"数据不出设备"的定位一致。
 *
 * 设计原则：
 *  - 工具只**读**或**写本地台账**，永不发起网络请求；
 *  - 每个工具返回结构化 content，AI 客户端可以直接引用；
 *  - 不给 AI 提供"编造运势"的自由度：它只能调用这里定义的计算与检索。
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { SqliteLedgerStore } from './store'
import { VERSION } from './version'
import { ask, askAndRecord, catalog, sessionView } from '../runtime'
import type { ReadingDomain } from '../contract/reading'


function dataDir(): string {
  if (process.env.TIANJI_HOME) return process.env.TIANJI_HOME
  const base =
    process.platform === 'win32'
      ? join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'Tianji')
      : join(process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'), 'tianji')
  return base
}

const dir = dataDir()
mkdirSync(dir, { recursive: true })
const store = new SqliteLedgerStore({ file: join(dir, 'ledger.db') })

const DOMAINS = ['career', 'love', 'study', 'health', 'wealth', 'family', 'general'] as const

const server = new Server(
  {
    name: 'tianji',
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
)

/* ── 工具清单 ─────────────────────────────────────────────── */

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'tianji_ask',
      description:
        '同一问题请两位已启用的玄学大师各断一遍，返回两份匿名回答。默认不写入台账；save=true 时写入本机 SQLite。回答包含盘面事实、断语、可核引文与带日期的可验断言。',
      inputSchema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: '要问的问题，至少 4 个字。' },
          domain: { type: 'string', enum: [...DOMAINS], description: '问题领域，默认 general。' },
          birthDate: { type: 'string', description: '公历出生日期 YYYY-MM-DD，可选。' },
          birthTime: { type: 'string', description: '出生时间 HH:mm，填了日期则必填。' },
          reveal: { type: 'boolean', description: '是否返回大师姓名与门派。默认 false（匿名）。' },
          save: { type: 'boolean', description: '是否写入本机台账。默认 false。' },
        },
        required: ['question'],
      },
    },
    {
      name: 'tianji_masters',
      description: '列出全部大师方法卡：已启用与筹备中、各自体系、可引用典籍。',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'tianji_ledger',
      description: '读取本机应验簿：所有带日期的可验断言及其回填状态。',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'tianji_resolve_claim',
      description: '回填一条断言的结果。到期前不能标记为 hit/miss，只能 unknown。',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '断言 id，可从 tianji_ledger 获取。' },
          status: { type: 'string', enum: ['hit', 'miss', 'unknown'], description: '应验 / 未验 / 无法判断。' },
        },
        required: ['id', 'status'],
      },
    },
    {
      name: 'tianji_session',
      description: '查看本机汇总：对局数、断言数、待回填数、大师榜（含 Wilson 下界）。',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}))

/* ── 工具实现 ─────────────────────────────────────────────── */

const text = (value: string) => ({ type: 'text' as const, text: value })

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params

  try {
    if (name === 'tianji_ask') {
      const question = String(args.question ?? '').trim()
      if (question.length < 4) {
        return { content: [text('问题至少写 4 个字。')], isError: true }
      }
      const domain = (typeof args.domain === 'string' ? args.domain : 'general') as ReadingDomain
      if (!DOMAINS.includes(domain as (typeof DOMAINS)[number])) {
        return { content: [text(`领域必须是 ${DOMAINS.join(' / ')} 之一。`)], isError: true }
      }
      const birth =
        typeof args.birthDate === 'string'
          ? { date: String(args.birthDate), time: String(args.birthTime ?? '00:00') }
          : undefined

      const options = { question, domain, ...(birth ? { birth } : {}) }
      const match = args.save === true ? await askAndRecord(options, store) : await ask(options)
      const reveal = args.reveal === true

      const lines: string[] = [`问题：${match.request.question}`, `编号：${match.id}`, '']
      match.answers.forEach((answer, index) => {
        const master = catalog().masters.find((m) => m.id === answer.masterId)
        const label = reveal ? `${master?.name ?? answer.masterId}（${master?.school ?? ''}）` : index === 0 ? '甲' : '乙'
        lines.push(`── ${label} ──`)
        if (reveal) {
          for (const fact of answer.facts) lines.push(`盘面：${fact.summary}`)
        }
        for (const section of answer.sections) {
          if (!reveal && (section.key === 'pan' || section.key === 'ju')) continue
          lines.push(`【${section.title}】`)
          for (const line of section.lines) lines.push(line)
        }
        lines.push('')
      })
      if (!reveal) lines.push('（盘面与依据已封存；传 reveal=true 可查看）')
      return { content: [text(lines.join('\n'))] }
    }

    if (name === 'tianji_masters') {
      const { masters, active } = catalog()
      const lines = masters.map((m) => `${m.id}\t${m.name}\t${m.school}\t${m.status === 'active' ? '可测评' : '筹备中'}\t${m.books.join('、')}`)
      return { content: [text(`可测评：${active.join(', ')}\n\nid\t名号\t体系\t状态\t典籍\n${lines.join('\n')}`)] }
    }

    if (name === 'tianji_ledger') {
      const claims = store.listClaims()
      if (!claims.length) return { content: [text('应验簿为空。')] }
      const lines = claims.map((c) => {
        const status = c.status === 'pending' ? '待回填' : c.status === 'hit' ? '应验' : c.status === 'miss' ? '未验' : '无法判断'
        return `[${status}] ${new Date(c.dueAt).toISOString().slice(0, 10)} ${c.id}\n  ${c.text}`
      })
      return { content: [text(lines.join('\n\n'))] }
    }

    if (name === 'tianji_resolve_claim') {
      const id = String(args.id ?? '')
      const status = String(args.status ?? '') as 'hit' | 'miss' | 'unknown'
      if (!['hit', 'miss', 'unknown'].includes(status)) {
        return { content: [text('status 必须是 hit / miss / unknown。')], isError: true }
      }
      const ok = store.resolveClaim(id, status)
      return {
        content: [text(ok ? `已回填 ${id} → ${status}` : '无法回填：记录不存在、已判定，或尚未到期。')],
        isError: !ok,
      }
    }

    if (name === 'tianji_session') {
      const view = sessionView(store)
      const lines = [
        `对局：${view.matches} 场`,
        `断言：${view.claims} 条（待回填 ${view.pendingClaims}）`,
        '',
        '大师榜：',
        ...view.leaderboard.map((row) => `  ${row.masterId}\t评分 ${row.rating}\t${row.matches} 场\t${row.tier}`),
      ]
      return { content: [text(lines.join('\n'))] }
    }

    return { content: [text(`未知工具：${name}`)], isError: true }
  } catch (error) {
    return { content: [text(`执行失败：${error instanceof Error ? error.message : String(error)}`)], isError: true }
  }
})

/* ── 资源：把方法卡与语料索引暴露为可读资源 ───────────────── */

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'tianji://masters',
      name: '大师方法卡',
      description: '六位大师的体系、方法、安全边界与引用典籍。',
      mimeType: 'application/json',
    },
    {
      uri: 'tianji://ledger',
      name: '应验簿',
      description: '本机全部断言及回填状态。',
      mimeType: 'application/json',
    },
  ],
}))

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params
  if (uri === 'tianji://masters') {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(catalog(), null, 2) }] }
  }
  if (uri === 'tianji://ledger') {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(store.listClaims(), null, 2) }] }
  }
  throw new Error(`未知资源：${uri}`)
})

/* ── 启动 ─────────────────────────────────────────────────── */

async function main(): Promise<void> {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // stdio 传输下 stdout 属于协议，日志必须走 stderr
  console.error(`[tianji] MCP server v${VERSION} ready · data: ${dir}`)
}

main().catch((error) => {
  console.error('[tianji] fatal:', error)
  process.exit(1)
})
