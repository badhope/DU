import { locateQuote } from '@/data/corpus'
import type { Citation } from '@/contract/reading'

export async function verifyCitation(citation: Citation): Promise<Citation> {
  try {
    const hits = await locateQuote(citation.text, citation.book)
    return { ...citation, verification: hits.length ? 'verified' : 'unverified' }
  } catch {
    return { ...citation, verification: 'unverified' }
  }
}

export async function verifyCitations(citations: Citation[]): Promise<Citation[]> {
  return Promise.all(citations.map(verifyCitation))
}
