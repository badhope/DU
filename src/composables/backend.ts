/**
 * 后端模式：可选地使用本地服务端的台账
 *
 * 产品默认是纯前端（localStorage）。当用户主动运行 `tianji serve` 时，
 * 同一个 Web 构建可以切换到服务端台账，从而跨浏览器、跨设备共享同一份记录。
 *
 * 探测是**被动**的：只在同源下探一次 `/api/health`，超时 800ms 就放弃。
 * 不做轮询、不重试、不把失败报到任何地方 —— 独立静态部署时，它就应该
 * 安静地退回 localStorage，而不是让用户看到一堆请求错误。
 */
import { ref } from 'vue'
import type { BlindMatch, Claim } from '@/contract/reading'

export type BackendMode = 'local' | 'server'

const PROBE_TIMEOUT = 800

export const backendMode = ref<BackendMode>('local')
export const backendAvailable = ref(false)

let probed: Promise<boolean> | null = null

/** 探测同源后端；结果缓存，整页生命周期内只探一次 */
export function probeBackend(): Promise<boolean> {
  probed ??= (async () => {
    if (typeof fetch !== 'function' || typeof location === 'undefined') return false
    // 只有 http(s) 同源才探测；file:// 直接跳过
    if (!/^https?:$/.test(location.protocol)) return false
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT)
    try {
      const response = await fetch('api/health', {
        signal: controller.signal,
        headers: { Accept: 'application/json', ...authHeaders() },
      })
      if (!response.ok) return false
      const payload = (await response.json()) as { ok?: boolean }
      backendAvailable.value = payload.ok === true
      backendMode.value = payload.ok === true ? 'server' : 'local'
      return backendAvailable.value
    } catch {
      backendAvailable.value = false
      backendMode.value = 'local'
      return false
    } finally {
      clearTimeout(timer)
    }
  })()
  return probed
}

/** 服务端注入到页面的令牌（见 node/server.ts 的 index.html 注入） */
function authHeaders(): Record<string, string> {
  const token = (globalThis as { __TIANJI_TOKEN__?: string }).__TIANJI_TOKEN__
  return token ? { 'X-Tianji-Token': token } : {}
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...authHeaders(), ...(init?.headers ?? {}) },
  })
  if (!response.ok) throw new Error(`${init?.method ?? 'GET'} ${path} → ${response.status}`)
  return (await response.json()) as T
}

export interface ServerSession {
  matches: number
  claims: number
  pendingClaims: number
  leaderboard: Array<{ masterId: string; rating: number; matches: number; tier: string }>
}

/** 服务端台账的读写封装；仅在 backendMode === 'server' 时调用 */
export const serverLedger = {
  session: () => json<ServerSession>('api/session'),
  matches: () => json<BlindMatch[]>('api/matches'),
  match: (id: string) => json<BlindMatch>(`api/match?id=${encodeURIComponent(id)}`),
  claims: () => json<Claim[]>('api/claims'),
  ask: (body: {
    question: string
    domain?: string
    birth?: { date: string; time: string }
    save?: boolean
    /** 服务端默认脱敏；页面需要完整对象时才传 true */
    reveal?: boolean
  }) => json<BlindMatch>('api/ask', { method: 'POST', body: JSON.stringify(body) }),
  vote: (id: string, vote: 'a' | 'b' | 'draw') =>
    json<{ ok: boolean }>('api/vote', { method: 'POST', body: JSON.stringify({ id, vote }) }),
  resolve: (id: string, status: 'hit' | 'miss' | 'unknown') =>
    json<{ ok: boolean }>('api/claims/resolve', { method: 'POST', body: JSON.stringify({ id, status }) }),
}
