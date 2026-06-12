/**
 * Regression tests for dogfood-found bugs.
 * Each test must FAIL on the current (broken) source and PASS after the fix.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('ISSUE-001 · zhouyi.ts parses and all 64 yaoCi arrays are 6-tuples', () => {
  it('module loads without parse / runtime error', async () => {
    // The dynamic import will throw if the file has a parse error
    const mod = await import('@/utils/zhouyi')
    expect(mod.HEXAGRAM_TEXTS).toBeDefined()
  })

  it('contains exactly 64 hexagrams', async () => {
    const { HEXAGRAM_TEXTS } = await import('@/utils/zhouyi')
    expect(Object.keys(HEXAGRAM_TEXTS)).toHaveLength(64)
  })

  it('every yaoCi is a 6-tuple of non-empty strings', async () => {
    const { HEXAGRAM_TEXTS } = await import('@/utils/zhouyi')
    for (const [k, v] of Object.entries(HEXAGRAM_TEXTS)) {
      expect(v.yaoCi, `hexagram ${k} yaoCi`).toHaveLength(6)
      v.yaoCi.forEach((y, i) => {
        expect(typeof y, `hexagram ${k} yaoCi[${i}]`).toBe('string')
        expect(y.length, `hexagram ${k} yaoCi[${i}]`).toBeGreaterThan(0)
      })
    }
  })
})

describe('ISSUE-001b · zhouyi.ts exports manualDivination helpers used by zhouyi.vue', () => {
  it('exports lookupHex, numToTrigram, transformHex, makeHu, makeCuo, makeZong', async () => {
    const mod = await import('@/utils/zhouyi')
    // These are imported by src/pages/zhouyi/zhouyi.vue for the 手动起卦 flow.
    // If any is missing, the Vite page load throws
    // "does not provide an export named 'lookupHex'" and the page shows
    // "The connection timed out, click the screen to try again."
    expect(typeof mod.lookupHex, 'lookupHex').toBe('function')
    expect(typeof mod.numToTrigram, 'numToTrigram').toBe('function')
    expect(typeof mod.transformHex, 'transformHex').toBe('function')
    expect(typeof mod.makeHu, 'makeHu').toBe('function')
    expect(typeof mod.makeCuo, 'makeCuo').toBe('function')
    expect(typeof mod.makeZong, 'makeZong').toBe('function')
  })
})

describe('ISSUE-002 · dili.ts parses and analyzeDili runs without throwing', () => {

  it('analyzeDili produces a valid gateAnalysis.advice string (no template-nesting crash)', async () => {
    const { analyzeDili } = await import('@/utils/dili')
    // Minimal input that exercises the line that previously had nested ${...}.
    // ownerElement = 火, gateDirection = 90 (正西, fiveEl=金).
    // 火生金 is NOT in the SHENG-of-金 lookup, so the FALSE branch of the
    // outer ternary was taken, which is where the nested ${...} was.
    const input = {
      facing: 0 as const, // 正南 (火)
      layout: { back: '山' as const, left: '山' as const, right: '山' as const, front: '水' as const },
      gateDirection: 90 as const, // 正西 (金)
      ownerElement: '火' as const,
    }
    const result = analyzeDili(input)
    expect(result.gateAnalysis.advice).toBeTypeOf('string')
    expect(result.gateAnalysis.advice.length).toBeGreaterThan(0)
    // It must contain 主事者属 and the gate direction info
    expect(result.gateAnalysis.advice).toMatch(/主事者属火/)
    expect(result.gateAnalysis.advice).toMatch(/属金/)
  })
})

describe('ISSUE-003 · LoadingSeal root is gated by v-if=visible', () => {
  it('template root has a v-if="visible" gate', () => {
    const src = readFileSync(
      resolve(__dirname, '../src/components/ui/LoadingSeal.vue'),
      'utf-8',
    )
    // Find the <template> block
    const tmpl = src.match(/<template>([\s\S]*?)<\/template>/)
    expect(tmpl, 'template block').toBeTruthy()
    // The first child of <template> must carry v-if="visible"
    const root = tmpl![1].trim().split('\n')[0].trim()
    expect(root, 'root element').toMatch(/v-if="visible"/)
  })
})

describe('ISSUE-005 · index.html meta description and og:description do not advertise AI', () => {
  it('description meta has no "AI masters" / "AI master"', () => {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8')
    const m = html.match(/<meta\s+name="description"\s+content="([^"]+)"/)
    expect(m, '<meta name=description>').toBeTruthy()
    expect(m![1]).not.toMatch(/AI\s*master/i)
  })

  it('og:description meta has no "AI masters" / "AI master"', () => {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8')
    const m = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/)
    expect(m, '<meta property=og:description>').toBeTruthy()
    expect(m![1]).not.toMatch(/AI\s*master/i)
  })
})
