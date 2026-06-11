import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { useSettingsStore } from '@/stores/settings'

describe('useSettingsStore', () => {
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

  it('migrates settings from legacy v3 key to v1 on init', async () => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      'mistverse-state-v3',
      JSON.stringify({
        settings: { theme: 'xuanzi', font: 'songti', mode: 'light', fontSize: 'lg' },
        history: [{ id: 'h1' }],
      }),
    )
    const s = useSettingsStore()
    expect(s.theme).toBe('xuanzi')
    expect(s.font).toBe('songti')
    expect(s.mode).toBe('light')
    expect(s.fontSize).toBe('lg')
    const stored = window.localStorage.getItem('mistverse-settings-v1')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored as string)
    expect(parsed.theme).toBe('xuanzi')
  })

  it('persists theme changes to v1 key', async () => {
    if (typeof window === 'undefined') return
    const s = useSettingsStore()
    s.setTheme('xuanqing')
    await nextTick()
    const stored = window.localStorage.getItem('mistverse-settings-v1')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored as string)
    expect(parsed.theme).toBe('xuanqing')
  })
})
