import type { Citation, Claim, MasterAnswer, ReadingSection } from '@/contract/reading'
import type { MasterId } from '@/contract/master'

const TITLES: Record<ReadingSection['key'], string> = { pan: '盘面事实', duan: '断语', ju: '依据', yan: '可验断言', xing: '行动建议' }

function keyFor(title: string): ReadingSection['key'] | null {
  if (/盘/.test(title)) return 'pan'
  if (/断/.test(title)) return 'duan'
  if (/据/.test(title)) return 'ju'
  if (/验/.test(title)) return 'yan'
  if (/行/.test(title)) return 'xing'
  return null
}

export function parseSections(text: string): ReadingSection[] {
  const sections: ReadingSection[] = []
  let current: ReadingSection | null = null
  for (const line of text.split(/\r?\n/)) {
    const header = /^##\s+(.+?)\s*$/.exec(line)
    if (header) {
      const key = keyFor(header[1]!)
      if (!key) continue
      current = { key, title: TITLES[key], lines: [] }
      sections.push(current)
      continue
    }
    if (current && line.trim()) current.lines.push(line.trim())
  }
  if (!sections.length && text.trim()) return [{ key: 'duan', title: TITLES.duan, lines: text.trim().split(/\r?\n/).filter(Boolean) }]
  return sections
}

function parseCitation(line: string): Citation | null {
  const match = /《([^》]+)》([^：:]*)(?:：|:)?[「“\"]?(.+?)[」”\"]?$/.exec(line.replace(/^>\s*/, ''))
  if (!match) return null
  const citation: Citation = { book: match[1]!, text: match[3]!, verification: 'pending' }
  if (match[2]) citation.loc = match[2]
  return citation
}

function parseClaims(lines: string[], masterId: MasterId, matchId: string | undefined, now: number): Claim[] {
  return lines.flatMap((line, index) => {
    const match = /^[-*]\s*\[(\d{4}-\d{2}-\d{2})\]\s*(.+)$/.exec(line)
    if (!match) return []
    const due = new Date(`${match[1]}T23:59:59`).getTime()
    if (!Number.isFinite(due)) return []
    const claim: Claim = { id: `${matchId ?? 'reading'}-${masterId}-${now}-${index}`, masterId, text: match[2]!, dueAt: due, createdAt: now, status: 'pending' }
    if (matchId) claim.matchId = matchId
    return [claim]
  })
}

export function parseAnswer(text: string, masterId: MasterId, facts: MasterAnswer['facts'], mode: MasterAnswer['mode'], matchId?: string, now = Date.now()): MasterAnswer {
  const sections = parseSections(text)
  const citations = (sections.find((section) => section.key === 'ju')?.lines ?? []).map(parseCitation).filter((item): item is Citation => item !== null)
  const claims = parseClaims(sections.find((section) => section.key === 'yan')?.lines ?? [], masterId, matchId, now)
  return { id: `${masterId}-${now}`, masterId, mode, text, sections, facts, citations, claims, generatedAt: now }
}

export function citationLines(answer: MasterAnswer): string[] {
  return answer.citations.map((citation) => `《${citation.book}》${citation.loc ?? ''}：${citation.text}`)
}
