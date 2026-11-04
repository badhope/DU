/**
 * HTTP API 端到端契约
 *
 * 这组测试直接起一个真实服务、发真实请求。它守护三件容易被"看起来能用"
 * 掩盖的事：
 *   1. 匿名响应里真的没有身份线索（不是只加了个 revealed 标记）；
 *   2. 投票与断言回填的状态码语义正确（重复投票必须 409，不是 200）；
 *   3. 目录穿越被挡住。
 */
// @vitest-environment node
// 这组测试要发真实 HTTP 请求，happy-dom 的 CORS 实现会拦掉同机不同端口的请求，
// 而真实浏览器里同源是成立的。用 node 环境跑才测的是服务端本身。
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer, type Server } from 'node:http'
import { createApp, setServerToken } from '@/node/server'

let server: Server
let base: string
let dataDir: string

beforeAll(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'tianji-api-'))
  // v0.5.1 起 API 要求同源令牌；测试里固定一个，模拟页面注入
  const TOKEN = 'test-token'
  setServerToken(TOKEN)
  const handler = createApp({ port: 0, dataDir })
  server = createServer((req, res) => void handler(req, res))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  base = `http://127.0.0.1:${port}`
})

/** 所有 API 请求都带令牌与 127.0.0.1 Host（服务端会校验来源） */
function authFetch(url: string, init?: RequestInit) {
  return fetch(url, { ...init, headers: { 'X-Tianji-Token': 'test-token', ...(init?.headers ?? {}) } })
}

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  // Windows 上 SQLite 的 WAL 文件可能还挂在句柄里几毫秒；清理失败不应判测试失败
  try {
    rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  } catch {
    /* 临时目录留给系统清理 */
  }
})

describe('HTTP API', () => {
  it('健康检查返回版本号', async () => {
    const response = await authFetch(`${base}/api/health`)
    const body = (await response.json()) as { ok: boolean; version: string }
    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('目录返回全部大师与已启用子集', async () => {
    const body = (await (await authFetch(`${base}/api/catalog`)).json()) as {
      masters: unknown[]
      active: string[]
    }
    expect(body.masters).toHaveLength(6)
    expect(body.active.length).toBeGreaterThanOrEqual(2)
    expect(body.active).toContain('ziping')
  })

  it('问题过短返回 400 而不是空结果', async () => {
    const response = await authFetch(`${base}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '嗨' }),
    })
    expect(response.status).toBe(400)
  })

  it('匿名响应不含 masterId、门派名、盘面与依据', async () => {
    const response = await authFetch(`${base}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '匿名接口契约测试问题', save: false }),
    })
    const body = await response.json()
    const serialized = JSON.stringify(body)

    // 四个泄漏向量都必须在场检查，少一个都可能放过一种身份提示
    expect(serialized).not.toContain('"masterId"')
    expect(serialized).not.toMatch(/meihua|ziping/)
    expect(serialized).not.toMatch(/梅花易数|滴天髓|子平/)
    for (const answer of body.answers as Array<{ sections: Array<{ key: string }> }>) {
      const keys = answer.sections.map((section) => section.key)
      expect(keys).not.toContain('pan')
      expect(keys).not.toContain('ju')
    }
  })

  it('reveal=true 时才返回完整身份', async () => {
    const response = await authFetch(`${base}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '揭晓模式接口测试问题', save: false, reveal: true }),
    })
    const body = await response.json()
    expect(JSON.stringify(body)).toMatch(/meihua|ziping|ziwei/)

    // 这份断言只验证"揭晓后身份字段回来了"，不验证盘面 ——
    // 三位大师随机配对时，可能刚好抽到两个都需要生辰的（子平 + 紫微），
    // 而本请求没提供生辰，因此没有盘面是完全正确的。
    expect(body.revealed).toBeUndefined()
    expect(body.answers[0].masterId).toBeTruthy()
  })

  it('投票写一次成功，重复投票返回 409', async () => {
    const created = await (
      await authFetch(`${base}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: '重复投票接口测试问题', save: true }),
      })
    ).json()

    const first = await authFetch(`${base}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: created.id, vote: 'a' }),
    })
    expect(first.status).toBe(200)

    const second = await authFetch(`${base}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: created.id, vote: 'b' }),
    })
    expect(second.status).toBe(409)
  })

  it('未到期断言不能标记为应验', async () => {
    const claims = (await (await authFetch(`${base}/api/claims`)).json()) as Array<{ id: string }>
    expect(claims.length).toBeGreaterThan(0)
    const response = await authFetch(`${base}/api/claims/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: claims[0]!.id, status: 'hit' }),
    })
    expect(response.status).toBe(409)
  })

  it('报告的 Content-Type 是 HTML，且可被浏览器直接打开', async () => {
    const response = await authFetch(`${base}/api/report/ledger`)
    expect(response.headers.get('content-type')).toContain('text/html')
    const html = await response.text()
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('天机台')
  })

  it('路径穿越被拒绝', async () => {
    const response = await authFetch(`${base}/api/../../etc/passwd`, { redirect: 'manual' })
    expect([403, 404]).toContain(response.status)
  })

  it('所有响应都禁止缓存', async () => {
    const response = await authFetch(`${base}/api/health`)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})

describe('来源校验（DNS rebinding 防护）', () => {
  it('Host 不是本机地址时拒绝', async () => {
    // fetch 不允许覆盖 Host 头（属于禁止修改的头），必须用原生 http 构造
    const { request } = await import('node:http')
    const url = new URL(`${base}/api/health`)
    const status = await new Promise<number>((resolve, reject) => {
      const req = request(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          headers: { Host: 'evil.test', 'X-Tianji-Token': 'test-token' },
        },
        (res) => {
          res.resume()
          resolve(res.statusCode ?? 0)
        },
      )
      req.on('error', reject)
      req.end()
    })
    expect(status).toBe(403)
  })

  it('跨站 Origin 被拒绝', async () => {
    const response = await fetch(`${base}/api/session`, {
      headers: { Origin: 'http://evil.test', 'X-Tianji-Token': 'test-token' },
    })
    expect(response.status).toBe(403)
  })

  it('同源请求放行', async () => {
    const response = await fetch(`${base}/api/health`, {
      headers: { 'Sec-Fetch-Site': 'same-origin' },
    })
    expect(response.status).toBe(200)
  })

  it('未投票的对局不返回身份', async () => {
    const created = await (
      await authFetch(`${base}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: '盲测列表不可泄露身份', save: true }),
      })
    ).json()

    const list = (await (await authFetch(`${base}/api/matches`)).json()) as Array<Record<string, unknown>>
    const mine = list.find((m) => m.id === created.id)
    expect(mine).toBeDefined()
    // 未投票：列表项里不能有 masterIds、answers、facts
    expect(mine!.masterIds).toBeUndefined()
    expect(mine!.answers).toBeUndefined()
  })
})
