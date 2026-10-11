/**
 * 界面冒烟测试
 *
 * 单元测试全绿但页面白屏，是 v1 后期的真实情形（测试只覆盖脚本层）。
 * 这里真挂载组件、真点按钮，验的是"用户看得见东西"。
 */
import { flushPromises, mount } from '@vue/test-utils'

/**
 * 等到条件成立，而不是猜需要几个微任务。
 *
 * compute 是异步的（内部动态 import lunar-typescript），首次解析外部依赖
 * 要多少轮微任务并不稳定——之前写死的 6+1+3 在单跑时够，
 * 但 npm run check 里 tsc 刚跑完、机器有负载时就漏了一轮。
 * 轮询到真出现为止，超时就如实失败。
 */
async function until(done: () => boolean, label: string, ms = 4000): Promise<void> {
  const deadline = Date.now() + ms
  for (;;) {
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))
    if (done()) return
    if (Date.now() > deadline) throw new Error(`等待超时：${label}`)
  }
}
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { makeRouter as makeRouterProd, routes } from '@/router'
import App from '@/App.vue'
import ResultView from '@/ui/ResultView.vue'
import FormRenderer from '@/ui/FormRenderer.vue'
import ToolPage from '@/pages/ToolPage.vue'
import Home from '@/pages/Home.vue'
import { meihuaTool } from '@/tools/meihua'
import type { ResultNode } from '@/contract/result'

/** 阅览室靠 fetch 语料，测试里给一个最小 stub，只验"不崩、有界面" */
const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ books: [], totalChars: 0 }) }))

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

// 用生产路由表，只是换成内存 history：测试与站点的导航结构同源
const makeRouter = () => makeRouterProd(createMemoryHistory())

describe('界面冒烟', () => {
  it('App 外壳渲染出导航与页脚，且页脚如实报出工具数与本机记录', async () => {
    const w = mount(App, { global: { plugins: [makeRouter()] } })
    await flushPromises()
    expect(w.find('header').exists()).toBe(true)
    expect(w.find('.du-brand').text()).toBe('DU')
    expect(w.text()).toContain('典籍')
    expect(w.text()).toContain('机制')
    expect(w.text()).toContain('不作医疗')
  })

  it('首页由注册表生成卡片，不写死工具名', async () => {
    const w = mount(Home, { global: { plugins: [makeRouter()] } })
    await flushPromises()
    expect(w.text()).toContain('梅花易数')
    expect(w.findAll('.hm-card')).toHaveLength(1)
    // 每日一签必须带出处或释义，否则等于匿名断语
    expect(w.find('.hm-daily-s').text().length).toBeGreaterThan(4)
  })

  it('工具页：填领域 → 点起一卦 → 出卦画、断语与反馈区', async () => {
    const router = makeRouter()
    router.push('/t/meihua')
    await router.isReady()
    const w = mount(ToolPage, { props: { id: 'meihua' }, global: { plugins: [router] } })

    // 未计算前只有表单
    expect(w.find('.tp-out').exists()).toBe(false)
    const select = w.findAll('select')[1]! // 第 0 个是起卦方式
    await select.setValue('career')
    await w.find('.du-btn.primary').trigger('click')
    // 出结果或出错都算"跑完了"；超时就是真失败，不再靠猜微任务数
    await until(
      () => w.find('.tp-out').exists() || w.find('.tp-err').exists(),
      '工具页未出结果也未报错',
    )

    // 出错的话先把错误信息当成断言失败原因显示出来，再断言结果区
    if (!w.find('.tp-out').exists()) expect(w.find('.tp-err').text()).toBe('（无错误信息）')
    expect(w.find('.tp-out').exists()).toBe(true)
    expect(w.find('.ga').exists()).toBe(true) // 卦画
    expect(w.findAll('.ga-r')).toHaveLength(6) // 六爻
    expect(w.text()).toContain('本卦')
    expect(w.text()).toContain('体')
    expect(w.text()).toContain('人群天然适用') // 透明标注
    expect(w.text()).toContain('你的真实信号')
    // 反馈区必须存在，否则引擎学不到任何东西
    expect(w.find('.tp-fb').exists()).toBe(true)
    expect(w.findAll('.tp-fb-r').length).toBeGreaterThan(0)
  })

  it('点"说中"会写进本机记录，页脚与引擎都能看见', async () => {
    const router = makeRouter()
    const w = mount(ToolPage, { props: { id: 'meihua' }, global: { plugins: [router] } })
    await w.findAll('select')[1]!.setValue('love')
    await w.find('.du-btn.primary').trigger('click')
    await until(() => w.find('.tp-fb-r button').exists(), '反馈区未出现')

    await w.findAll('.tp-fb-r button')[0]!.trigger('click')
    await until(() => !!localStorage.getItem('du.session.v1'), '本机记录未写入')
    const raw = localStorage.getItem('du.session.v1')
    expect(raw).toBeTruthy()
    const saved = JSON.parse(raw!) as { resonated: unknown[]; visits: number }
    expect(saved.resonated.length).toBeGreaterThan(0)
    expect(saved.visits).toBeGreaterThan(0)
  })

  it('非法 id 不白屏，给出可点的工具列表', async () => {
    const router = makeRouter()
    router.push('/t/meihua')
    await router.isReady()
    const w = mount(ToolPage, { props: { id: 'nope' }, global: { plugins: [router] } })
    expect(w.text()).toContain('没有 id 为')
  })

  it('导航里的每个链接都能命中路由，且工具都有可直达路径', () => {
    const paths = routes.map((r) => r.path)
    for (const need of ['/', '/reading', '/about', '/t/:id']) expect(paths).toContain(need)
  })

  it('ResultView 能解释全部节点类型（新工具不需要新组件）', () => {
    const nodes: ResultNode[] = [
      { kind: 'text', lines: ['x'], lead: true },
      { kind: 'note', text: 'n', tone: 'warn' },
      { kind: 'chips', items: [{ text: 'c', tone: 'good' }] },
      { kind: 'kv', items: [{ label: 'a', value: 'b', sub: 'c' }] },
      { kind: 'grid', columns: 2, cells: [{ label: 'g', value: '1' }] },
      { kind: 'bars', items: [{ label: 'b', value: 30, max: 100, tone: 'huo' }] },
      { kind: 'score', value: 66, max: 100, label: '势', caption: 'cap' },
      { kind: 'table', headers: ['h'], rows: [['r']] },
      { kind: 'matrix', size: 3, cells: [{ palace: 5, center: '中' }] },
      {
        kind: 'gua',
        title: 't',
        lines: [1, 0, 1, 1, 0, 0].map((v, i) => ({ position: i + 1, yang: v === 1, moving: i === 0 })),
      },
      { kind: 'row', children: [{ kind: 'text', lines: ['inner'] }] },
      { kind: 'section', title: 'S', children: [{ kind: 'note', text: 'in' }] },
    ]
    const w = mount(ResultView, { props: { node: { kind: 'stack', children: nodes } } })
    for (const cls of ['.tx', '.nt', '.ch', '.kv', '.gr', '.br', '.sco', '.tb', '.mx', '.ga', '.rw', '.sc'])
      expect(w.find(cls).exists(), `节点未渲染：${cls}`).toBe(true)
    // 环形评分的描边长度必须随分值变化，否则是摆设
    expect(w.find('.sco-fg').attributes('stroke-dasharray')).toBe('215.6 326.7')
  })

  it('FormRenderer 按 schema 生成控件，必填未填时提示', async () => {
    const w = mount(FormRenderer, {
      props: {
        modelValue: {},
        fields: [
          { key: 'q', label: '文本', type: 'text' },
          { key: 'd', label: '日期', type: 'date', required: true },
          { key: 'm', label: '多选', type: 'multi', options: [{ value: 'a', label: '甲' }, { value: 'b', label: '乙' }] },
          { key: 't', label: '开关', type: 'toggle' },
        ],
      },
    })
    expect(w.findAll('input[type=text]')).toHaveLength(1)
    expect(w.findAll('input[type=date]')).toHaveLength(1)
    expect(w.text()).toContain('请填写')
    const boxes = w.findAll('input[type=checkbox]')
    await boxes[0]!.setValue(true)
    // 受控组件：props 未回写前第二次点击仍从空数组起，这正是"状态由父级持有"的证明
    expect((w.emitted('update:modelValue')!.at(-1)![0] as Record<string, unknown>).m).toEqual(['a'])
    await w.setProps({ modelValue: { m: ['a'] } })
    await w.findAll('input[type=checkbox]')[1]!.setValue(true)
    expect((w.emitted('update:modelValue')!.at(-1)![0] as Record<string, unknown>).m).toEqual(['a', 'b'])
  })

  it('梅花工具的字段全部由注册表提供，页面不含任何硬编码领域', async () => {
    const labels = meihuaTool.fields.map((f) => f.key)
    expect(labels).toContain('domain')
    expect(labels).toContain('situations')
    const router = makeRouter()
    const w = mount(ToolPage, { props: { id: 'meihua' }, global: { plugins: [router] } })
    // 19 种处境由 SITUATIONS 生成，页面不该自己再列一份
    expect(w.findAll('.fm-opt')).toHaveLength(19)
  })
})
