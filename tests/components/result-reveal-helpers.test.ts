import { describe, it, expect } from 'vitest'
import { resolveHostEl } from '@/shared/components/ui/result-reveal-helpers'

interface MaybeElInstance {
  $el?: HTMLElement | null
}

function makeEl(tag: string = 'div'): HTMLElement {
  return document.createElement(tag)
}

describe('resolveHostEl', () => {
  it('returns null for null', () => {
    expect(resolveHostEl(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(resolveHostEl(undefined)).toBeNull()
  })

  it('returns the element when given a raw HTMLElement', () => {
    const el = makeEl()
    expect(resolveHostEl(el)).toBe(el)
  })

  it('returns $el when given an instance ref', () => {
    const el = makeEl()
    const inst: MaybeElInstance = { $el: el }
    expect(resolveHostEl(inst)).toBe(el)
  })

  it('returns null when instance has no $el', () => {
    const inst: MaybeElInstance = { $el: null }
    expect(resolveHostEl(inst)).toBeNull()
  })

  it('returns null when $el is not an HTMLElement', () => {
    const inst = { $el: 'string-not-element' }
    expect(resolveHostEl(inst as unknown as MaybeElInstance)).toBeNull()
  })
})
