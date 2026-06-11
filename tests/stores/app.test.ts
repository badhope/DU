import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useAppStore } from '@/stores/app'

describe('useAppStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
    await nextTick()
  })
  afterEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
    }
  })

  it('adds history item and persists to app v1 key (with settings stripped to v1)', async () => {
    if (typeof window === 'undefined') return
    const a = useAppStore()
    a.addHistory({
      tool: 'bazi',
      toolName: '八字',
      category: 'mingli',
      input: {},
      output: {},
      brief: 'test',
    })
    expect(a.history.length).toBe(1)
    expect(a.history[0]?.tool).toBe('bazi')
    await nextTick()
    const stored = window.localStorage.getItem('mistverse-app-v1')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored as string)
    expect(Array.isArray(parsed.history)).toBe(true)
    expect(parsed.history.length).toBe(1)
  })

  it('truncates history to MAX_HISTORY (50) on overflow', () => {
    if (typeof window === 'undefined') return
    const a = useAppStore()
    for (let i = 0; i < 60; i++) {
      a.addHistory({
        tool: 'bazi',
        toolName: '八字',
        category: 'mingli',
        input: {},
        output: {},
        brief: `h${i}`,
      })
    }
    expect(a.history.length).toBe(50)
  })
})
