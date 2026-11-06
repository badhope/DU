import type { MasterId } from './master'

export type ReadingDomain = 'career' | 'love' | 'study' | 'health' | 'wealth' | 'family' | 'general'
export type AnswerMode = 'local'
export type ClaimStatus = 'pending' | 'hit' | 'miss' | 'unknown'
export type VoteChoice = 'a' | 'b' | 'draw'

export interface BirthInput {
  date: string
  time: string
  gender?: 'male' | 'female' | 'unknown'
  longitude?: number
}

export interface AskRequest {
  question: string
  domain: ReadingDomain
  birth?: BirthInput
  askedAt: number
}

export interface ChartFact {
  /** 盘面事实来自哪套内核；新增内核必须在此登记，否则界面不会渲染它 */
  kind: 'bazi' | 'meihua' | 'ziwei'
  title: string
  summary: string
  fields: Record<string, string | number | string[]>
}

/**
 * 引文来源：
 *  - `canon`  断语库里写死的原文，由 scripts/verify-quotes.mjs 在门禁里逐字校验；
 *  - `corpus` 本次从站内分发语料检索出的片段，命中即原文子串。
 * 两者都可点回典籍阅览室复核；`pending` 只用于尚未校验的文本，本地模式不产生。
 */
export type CitationOrigin = 'canon' | 'corpus'

export interface Citation {
  book: string
  loc?: string
  text: string
  origin: CitationOrigin
  verification: 'verified' | 'unverified' | 'pending'
}

export interface ReadingSection {
  key: 'pan' | 'duan' | 'ju' | 'yan' | 'xing'
  title: string
  lines: string[]
}

export interface Claim {
  id: string
  masterId: MasterId
  matchId?: string
  text: string
  dueAt: number
  createdAt: number
  status: ClaimStatus
}

export interface MasterAnswer {
  id: string
  masterId: MasterId
  mode: AnswerMode
  text: string
  sections: ReadingSection[]
  facts: ChartFact[]
  citations: Citation[]
  claims: Claim[]
  /** 本次用到的断语库 id，用于同场盲测互斥与复盘 */
  statementIds: string[]
  generatedAt: number
  fallbackReason?: string
  /**
   * 领域边界提示（医疗 / 财务 / 法律 / 未成年）。
   *
   * 放在回答对象上而不是只在某个页面里拼：Web 之外还有 CLI、HTTP、MCP 三个宿主，
   * 只写进页面等于另外三个没有。由运行时统一填充，各宿主只负责显示。
   */
  notice?: string
}

export interface BlindMatch {
  id: string
  request: AskRequest
  masterIds: [MasterId, MasterId]
  answers: [MasterAnswer, MasterAnswer]
  createdAt: number
  vote?: VoteChoice
  votedAt?: number
}
