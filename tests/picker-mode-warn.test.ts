/**
 * Regression test: Vue 3 warns "Invalid prop: custom validator check failed
 * for prop 'mode'" whenever <picker mode="number"> is rendered, because
 * the H5-side Picker only validates against the canonical mode set
 * ('selector' | 'multiSelector' | 'time' | 'date' | 'region'). On
 * the actual app, mode="number" still works fine in the H5 build, so
 * the warning is noise. Filter it out via a global warnHandler
 * registered in main.ts.
 *
 * These tests assert that the source of main.ts contains a warnHandler
 * that suppresses this specific warning.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Picker mode warning suppression', () => {
  it('main.ts registers a warnHandler', () => {
    const main = readFileSync(join(process.cwd(), 'src/main.ts'), 'utf-8')
    expect(main, 'main.ts must set app.config.warnHandler').toContain('warnHandler')
  })

  it('warnHandler silences the Picker "mode" custom-validator warning', () => {
    const main = readFileSync(join(process.cwd(), 'src/main.ts'), 'utf-8')
    // Acceptable filter predicates:
    //  - msg.includes("Invalid prop: custom validator check failed for prop \"mode\"")
    //  - msg.includes("prop \"mode\"")
    //  - regex over Picker + mode
    expect(main, 'main.ts warnHandler must filter the Picker mode warning').toMatch(
      /Invalid prop: custom validator.*mode|custom validator check failed.*prop "?mode"?/,
    )
  })
})
