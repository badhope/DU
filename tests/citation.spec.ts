/**
 * 出处闭环
 *
 * 断语上那句"查原文"是唯一能让权威性当场兑现的入口：
 * 读者点进去必须在阅览室搜到这句话。这条链路跨了三个模块
 * （引擎出 quote 节点 → ResultView 拼查询串 → 阅览室解析书名别名并检索），
 * 任一处写歪，用户看到的就是一句无处可核的引文。
 */
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { makeRouter } from '@/router'
import Reading from '@/pages/Reading.vue'
import ResultView from '@/ui/ResultView.vue'
import { STATEMENTS } from '@/engine/resonance'
import type { ResultNode } from '@/contract/result'

/** 与 corpus.spec 同一口径：读 public/corpus，即部署产物本身 */
async function fakeFetch(input: string) {
  const path = input.replace(/^(\.\/|\/)/, '')
  try {
    const body = JSON.parse(readFileSync(`public/${path}`, 'utf8'))
    return { ok: true, json: async () => body } as unknown as Response
  } catch {
    return { ok: false, status: 404, json: async () => ({}) } as unknown as Response
  }
}

async function settle(rounds = 8): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(fakeFetch))
})

describe('断语 → 原文 的闭环', () => {
  it('每条 canon 断语都渲染成带查询串的出处链接', () => {
    const canon = STATEMENTS.filter((s) => s.source?.kind === 'canon' && s.source.quote)
    expect(canon.length).toBeGreaterThanOrEqual(20)
    for (const st of canon) {
      const node: ResultNode = {
        kind: 'quote',
        book: st.source!.book!,
        text: st.source!.quote!,
        ...(st.source!.loc ? { loc: st.source!.loc } : {}),
      }
      const w = mount(ResultView, { props: { node } })
      const href = w.find('.qt-a').attributes('href')
      expect(href, `${st.id} 的出处不可点`).toContain('#/reading')
      const q = new URLSearchParams(href!.split('?')[1]!)
      // 引文进查询串时必须是去省略号后的首段，否则阅览室永远搜不到
      expect(q.get('q')!.length).toBeGreaterThan(3)
      expect(q.get('q')).not.toContain('…')
    }
  })

  it('点进阅览室：《黄帝内经》按别名解析到素问/灵枢，并搜出那句话', async () => {
    const router = makeRouter(createMemoryHistory())
    await router.push({
      name: 'reading',
      query: { bk: '黄帝内经', q: '恬淡虛無，真氣從之' },
    })
    await router.isReady()
    const w = mount(Reading, { global: { plugins: [router] } })
    await settle(30) // 首次要载 opencc + 拉两部书的 JSON

    expect(w.find('.rd-cite').text()).toContain('素问')
    expect(w.findAll('.rd-hit').length, '引文在站内搜不到').toBeGreaterThan(0)
    expect(w.find('.rd-hit').text()).toContain('恬淡虚无') // snippet 已转简体
  })

  it('书名对不上时如实说无法核对，不假装命中', async () => {
    const router = makeRouter(createMemoryHistory())
    await router.push({ name: 'reading', query: { bk: '不存在的书', q: '随便一句' } })
    await router.isReady()
    const w = mount(Reading, { global: { plugins: [router] } })
    await settle()

    expect(w.find('.rd-err').text()).toContain('站内没有《不存在的书》')
    expect(w.findAll('.rd-hit').length).toBe(0)
  })
})
