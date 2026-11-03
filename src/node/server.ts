/**
 * 本地 HTTP 服务
 *
 * 这是"Web 加后台"里的后台：默认只监听 127.0.0.1，不对外暴露。
 * 它存在的理由不是把计算搬到服务器，而是让多设备/多进程共享同一份台账，
 * 以及让浏览器端以外的客户端（脚本、MCP、未来的桌面壳）走同一套接口。
 *
 * 协议选择：
 *  - HTTP/1.1 + JSON，无框架依赖（Node 内置 http），安装包因此不需要带 express；
 *  - 路由是显式表，不用正则魔法，出问题能一眼定位；
 *  - 每个响应带 `Cache-Control: no-store`，台账数据绝不进任何缓存。
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { SqliteLedgerStore } from './store'
import { VERSION } from './version'
import { assetKeys, readAsset } from './assets'
import { askAndRecord, ask, catalog, renderLedger, renderMatch, sessionView } from '../runtime'
import type { ReadingDomain } from '../contract/reading'

export interface ServerOptions {
  port: number
  dataDir: string
  /** 静态文件目录（构建后的 dist）；不存在时只提供 API */
  staticDir?: string
  /** 绑定地址，默认仅本机 */
  host?: string
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

const MAX_BODY = 2 * 1024 * 1024

function send(res: ServerResponse, status: number, body: unknown, type = 'application/json; charset=utf-8'): void {
  const payload = typeof body === 'string' ? body : JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    // 只允许同源：接口不打算被第三方页面调用
    'Access-Control-Allow-Origin': '',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY) throw new Error('请求体超过 2 MB')
    chunks.push(chunk as Buffer)
  }
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

/**
 * 抹掉一场盲测里的身份线索。
 *
 * 只把 `revealed` 设成 false 而没有真的删字段，等于把答案写在信封背面。
 * 这里做的是结构性脱敏：masterId、盘面、依据、引文全部移除，
 * 因为它们每一个都能反推出是哪一门。
 */
function sealMatch(match: import('../contract/reading').BlindMatch) {
  const SEALED = new Set(['pan', 'ju'])
  return {
    id: match.id,
    request: match.request,
    createdAt: match.createdAt,
    revealed: false as const,
    masterIds: match.masterIds.map(() => 'sealed' as const),
    answers: match.answers.map((answer, index) => ({
      id: `sealed-${index}`,
      label: index === 0 ? '甲' : '乙',
      mode: answer.mode,
      sections: answer.sections.filter((section) => !SEALED.has(section.key)),
      // 断言正文保留（用户要据此回填），但 masterId 与 matchId 必须去掉：
      // 断言 id 里拼着 masterId，是最容易被忽略的一处身份泄漏。
      claims: answer.claims.map((claim) => ({
        id: claim.id.slice(-8),
        text: claim.text,
        dueAt: claim.dueAt,
        createdAt: claim.createdAt,
        status: claim.status,
      })),
      generatedAt: answer.generatedAt,
      ...(answer.fallbackReason ? { fallbackReason: answer.fallbackReason } : {}),
    })),
  }
}

export function createApp(options: ServerOptions) {
  // 数据目录可能尚不存在（首次运行）；SQLite 不会自动建目录
  mkdirSync(options.dataDir, { recursive: true })
  const store = new SqliteLedgerStore({ file: join(options.dataDir, 'ledger.db') })

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`)
    const path = url.pathname

    try {
      /* ── API ─────────────────────────────────────────── */
      if (path === '/api/health') {
        send(res, 200, { ok: true, version: VERSION, uptime: process.uptime() })
        return
      }

      if (path === '/api/catalog') {
        send(res, 200, catalog())
        return
      }

      if (path === '/api/session' && req.method === 'GET') {
        send(res, 200, sessionView(store))
        return
      }

      if (path === '/api/ask' && req.method === 'POST') {
        const body = (await readJson(req)) as {
          question?: string
          domain?: ReadingDomain
          birth?: { date: string; time: string }
          reveal?: boolean
          save?: boolean
        }
        if (!body.question || body.question.trim().length < 4) {
          send(res, 400, { error: '问题至少写 4 个字。' })
          return
        }
        const askOptions = {
          question: body.question,
          domain: body.domain ?? 'general',
          ...(body.birth ? { birth: body.birth } : {}),
        }
        const match = body.save === false ? await ask(askOptions) : await askAndRecord(askOptions, store)
        // 匿名是一份真实的响应契约，不是一个布尔标记：
        // 未揭晓时把 masterId 与能反推门派的字段全部剥掉，而不是只加 revealed:false
        // 却把身份照旧返回 —— 那只是自欺欺人的匿名。
        const payload = body.reveal === true ? match : sealMatch(match)
        send(res, 200, payload)
        return
      }

      if (path === '/api/matches' && req.method === 'GET') {
        send(res, 200, store.listMatches())
        return
      }

      if (path === '/api/claims' && req.method === 'GET') {
        send(res, 200, store.listClaims())
        return
      }

      if (path === '/api/claims/resolve' && req.method === 'POST') {
        const body = (await readJson(req)) as { id?: string; status?: 'hit' | 'miss' | 'unknown' }
        if (!body.id || !body.status) {
          send(res, 400, { error: '需要 id 与 status。' })
          return
        }
        const ok = store.resolveClaim(body.id, body.status)
        send(res, ok ? 200 : 409, { ok })
        return
      }

      if (path === '/api/vote' && req.method === 'POST') {
        const body = (await readJson(req)) as { id?: string; vote?: 'a' | 'b' | 'draw' }
        if (!body.id || !body.vote) {
          send(res, 400, { error: '需要 id 与 vote。' })
          return
        }
        const ok = store.recordVote(body.id, body.vote)
        send(res, ok ? 200 : 409, { ok })
        return
      }

      if (path === '/api/report/match' && req.method === 'GET') {
        const id = url.searchParams.get('id')
        const matches = store.listMatches()
        const match = id ? matches.find((m) => m.id === id) : matches[0]
        if (!match) {
          send(res, 404, { error: '没有这条记录。' })
          return
        }
        send(res, 200, renderMatch(match), 'text/html; charset=utf-8')
        return
      }

      if (path === '/api/report/ledger' && req.method === 'GET') {
        send(res, 200, renderLedger(store.listClaims()), 'text/html; charset=utf-8')
        return
      }

      /* ── 静态文件 ─────────────────────────────────────── */
      if (options.staticDir && (req.method === 'GET' || req.method === 'HEAD')) {
        const requested = decodeURIComponent(path)
        // 目录穿越防护：拒绝任何 `..` 段
        if (requested.split('/').some((segment) => segment === '..')) {
          send(res, 403, { error: '禁止访问。' })
          return
        }
        const key = requested.replace(/^\/+/, '') || 'index.html'
        const known = new Set(assetKeys(options.staticDir))

        // hash 路由的深链都指向 index.html；真正的资源必须精确命中
        const resolvedKey = known.has(key) ? key : known.has('index.html') ? 'index.html' : null
        if (resolvedKey) {
          const body = readAsset(resolvedKey, options.staticDir)
          if (body) {
            res.writeHead(200, {
              'Content-Type': MIME[extname(resolvedKey)] ?? 'application/octet-stream',
              'Cache-Control': resolvedKey === 'index.html' ? 'no-store' : 'public, max-age=3600',
              'X-Content-Type-Options': 'nosniff',
              'Content-Length': body.length,
            })
            res.end(req.method === 'HEAD' ? undefined : body)
            return
          }
        }
      }

      send(res, 404, { error: 'Not found' })
    } catch (error) {
      send(res, 500, { error: error instanceof Error ? error.message : 'Internal error' })
    }
  }
}

export async function startServer(options: ServerOptions): Promise<void> {
  const handler = createApp(options)
  const server = createServer((req, res) => {
    void handler(req, res)
  })

  const host = options.host ?? '127.0.0.1'
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(options.port, host, () => resolve())
  })

  const address = server.address()
  const actualPort = typeof address === 'object' && address ? address.port : options.port
  console.log(`\n  天机台本地服务已启动`)
  console.log(`  http://${host}:${actualPort}`)
  console.log(`  数据目录：${options.dataDir}`)
  console.log(`  仅监听本机；按 Ctrl+C 停止。\n`)

  const shutdown = () => {
    console.log('\n  正在停止…')
    server.close(() => process.exit(0))
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

export { SqliteLedgerStore }
