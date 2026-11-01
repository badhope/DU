/**
 * DU v2 · 本地会话状态
 *
 * 纯前端站没有后端，"历史"只能来自本机 localStorage。
 * 这里把读写集中在一个地方，并明确写出存了什么——
 * 引擎的 resonated:* / history:domain:* 特征全部来自这份数据，
 * 用户看得见、可一键清空。
 */
import { reactive } from 'vue'
import type { SessionContext } from '@/contract/tool'

const KEY = 'du.session.v1'

export interface ResonatedRecord {
  /** 命库条目 id */
  id: string
  /** 主题标签，进 resonated:<tag> 特征 */
  tag: string
  /** 1 = 说中了，0 = 没说到 */
  hit: 1 | 0
  at: number
}

interface SessionState {
  visits: number
  lastDomains: string[]
  resonated: ResonatedRecord[]
  seen: string[]
}

const empty = (): SessionState => ({ visits: 0, lastDomains: [], resonated: [], seen: [] })

function load(): SessionState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Partial<SessionState>
    const validDomains = Array.isArray(parsed.lastDomains) && parsed.lastDomains.every((item) => typeof item === 'string')
    const validResonated = Array.isArray(parsed.resonated) && parsed.resonated.every((item) => item && typeof item.id === 'string' && typeof item.tag === 'string' && (item.hit === 0 || item.hit === 1) && Number.isFinite(item.at))
    const validSeen = Array.isArray(parsed.seen) && parsed.seen.every((item) => typeof item === 'string')
    if (!Number.isInteger(parsed.visits) || parsed.visits! < 0 || !validDomains || !validResonated || !validSeen) return empty()
    return { visits: parsed.visits!, lastDomains: parsed.lastDomains!.slice(0, 3), resonated: parsed.resonated!.slice(0, 40), seen: parsed.seen!.slice(0, 60) }
  } catch {
    return empty()
  }
}

const state = reactive<SessionState>(load())

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 隐私模式 / 配额满：站内功能照常，只是不记历史 */
  }
}

/** 每次出结果算一次来访，并记下问的领域 */
export function recordVisit(domain: string) {
  state.visits += 1
  state.lastDomains = [domain, ...state.lastDomains.filter((d) => d !== domain)].slice(0, 3)
  persist()
}

/** 用户对某条断语的反馈；只有"说中了"才加权 */
export function recordFeedback(r: Omit<ResonatedRecord, 'at'>) {
  state.resonated = [
    { ...r, at: Date.now() },
    ...state.resonated.filter((x) => x.id !== r.id),
  ].slice(0, 40)
  persist()
}

export function markSeen(ids: string[]) {
  state.seen = [...new Set([...ids, ...state.seen])].slice(0, 60)
  persist()
}

export function resetSession() {
  Object.assign(state, empty())
  persist()
}

/**
 * 注入工具 compute 的历史信号。
 * batch 由页面自己数（第几次点"换一批"），不进 localStorage——
 * 它只影响种子，不影响学习。
 */
export function sessionContext(batch = 0): SessionContext {
  return {
    visitCount: state.visits,
    lastDomains: state.lastDomains,
    resonatedTags: state.resonated.filter((r) => r.hit === 1).map((r) => r.tag),
    round: batch,
    seen: state.seen,
  }
}

export function wasSeen(id: string): boolean {
  return state.seen.includes(id)
}

export const session = state
