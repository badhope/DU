/**
 * Regression tests for the 6 AI master pages.
 *
 * Bug found in dogfood sweep (2026-06-12): Each of the 6 AI pages
 * (ai-gua, ai-ming, ai-feng, ai-name, ai-jiankang, ai-xiuxin) is registered
 * in pages.json as a top-level route with no parent component, so
 * `defineProps<{ masterKey: MasterKey }>()` resolves to `undefined`.
 * The body then crashes at `master.name` / `master.greeting` (TypeError:
 * "Cannot read properties of undefined (reading 'name')").
 *
 * Fix: each page must fall back to its own master key when the prop is
 * not provided. These tests assert that the source of each page contains
 * the required fallback expression.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MASTERS, type MasterKey } from '@/utils/ai'

describe('AI master pages — masterKey fallback', () => {
  const expected: Array<{ file: string; fallback: MasterKey }> = [
    { file: 'ai-ming.vue', fallback: 'ai-ming' },
    { file: 'ai-gua.vue', fallback: 'ai-gua' },
    { file: 'ai-feng.vue', fallback: 'ai-feng' },
    { file: 'ai-name.vue', fallback: 'ai-name' },
    { file: 'ai-jiankang.vue', fallback: 'ai-jiankang' },
    { file: 'ai-xiuxin.vue', fallback: 'ai-xiuxin' },
  ]

  for (const { file, fallback } of expected) {
    it(`${file} falls back to "${fallback}" when masterKey prop is missing`, () => {
      const path = join(process.cwd(), 'src/pages/ai', file)
      const src = readFileSync(path, 'utf-8')
      // The page must guard against undefined props.masterKey.
      // Acceptable forms: `MASTERS[props.masterKey || '...']` or `??`
      // or any expression that uses the page's own key as a default.
      const re = new RegExp(
        `MASTERS\\s*\\[\\s*props\\.masterKey\\s*\\|\\|\\s*['"]${fallback}['"]`,
      )
      expect(src, `${file} must default props.masterKey to '${fallback}'`).toMatch(re)
    })

    it(`${file} TopBar subtitle also guards props.masterKey`, () => {
      const path = join(process.cwd(), 'src/pages/ai', file)
      const src = readFileSync(path, 'utf-8')
      // The TopBar subtitle uses props.masterKey.toUpperCase() — this crashes
      // when the prop is undefined. Guard with `|| '${fallback}'`.
      const re = new RegExp(
        `props\\.masterKey\\s*\\|\\|\\s*['"]${fallback}['"]`,
      )
      expect(src, `${file} TopBar must guard props.masterKey`).toMatch(re)
    })
  }

  it('all 6 master records are present in MASTERS', () => {
    for (const k of ['ai-gua', 'ai-ming', 'ai-feng', 'ai-name', 'ai-jiankang', 'ai-xiuxin'] as const) {
      expect(MASTERS[k], `MASTERS.${k} must be defined`).toBeDefined()
      expect(MASTERS[k].name).toBeTruthy()
      expect(MASTERS[k].greeting).toBeTruthy()
    }
  })
})
