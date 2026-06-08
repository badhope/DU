import { describe, it, expect } from 'vitest'

describe('vitest 集成', () => {
  it('基础断言可用', () => {
    expect(1 + 1).toBe(2)
  })

  it('异步可用', async () => {
    const v = await Promise.resolve(42)
    expect(v).toBe(42)
  })
})
