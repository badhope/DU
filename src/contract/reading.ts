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
  kind: 'bazi' | 'meihua'
  title: string
  summary: string
  fields: Record<string, string | number | string[]>
}

export interface Citation {
  book: string
  loc?: string
  text: string
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
  generatedAt: number
  fallbackReason?: string
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
