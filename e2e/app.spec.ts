import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

/**
 * 真实浏览器验收。
 *
 * 两条原则：
 *  1. 断言用户看得见的东西——渲染文本、可见状态、持久化后的结果，不碰组件内部。
 *  2. 截图必须可复现：冻结时钟与随机源，否则每次生成的 match id 都不同，
 *     会把 100KB 的二进制差异塞进每次提交。
 */

const question = '虚构示例：如何安排下个月的学习计划？'

/** 冻结时间与随机源，让截图逐字节稳定，同时保留真实的渲染路径 */
async function freezeEnvironment(page: Page) {
  await page.addInitScript(() => {
    const FIXED = new Date('2026-11-02T20:00:00+08:00').getTime()
    const RealDate = Date
    // @ts-expect-error 故意替换全局 Date 以固定时间
    globalThis.Date = class extends RealDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) super(FIXED)
        else super(...(args as [number]))
      }
      static now() {
        return FIXED
      }
    }
    // 常量而非伪随机序列：任何库先调用一次 Math.random 都会让序列错位，
    // 常量则与调用次数无关，截图才真正逐字节可复现。
    Math.random = () => 0.42
  })
}

async function startMatch(page: Page, opts: { withBirth?: boolean; gender?: 'female' | 'male' } = {}) {
  await page.goto('/#/ask')
  await page.getByLabel('你要问什么').fill(question)
  if (opts.withBirth) {
    await page.getByLabel('出生日期（可选）').fill('1990-06-15')
    await page.getByLabel('出生时间（填写日期后必填）').fill('08:30')
    // 性别决定大运顺逆与紫微大限；不选会走"按男命"的提示分支
    if (opts.gender) await page.getByRole('radio', { name: opts.gender === 'female' ? '女' : '男' }).check()
  }
  await page.getByRole('button', { name: '开始匿名盲测' }).click()
  // 带生辰时会动态加载 iztro（紫微内核，含 dayjs/i18next），首次要几秒；
  // 默认 5s 断言超时在慢机器上会假失败。
  await expect(page.getByRole('heading', { name: '同一问题，两份回答' })).toBeVisible({ timeout: 25_000 })
  await expect(page.locator('.answer')).toHaveCount(2, { timeout: 25_000 })
}

/** 等两份回答的语料检索都落定：检索成功会多出"站内语料命中"标注，失败则没有 */
async function waitForEvidenceSettled(page: Page) {
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.answer')).toHaveCount(2)
}

test('首页展示大师阵容与可核数字', async ({ page }) => {
  await freezeEnvironment(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '天机台' })).toBeVisible()
  // 数字来自注册表与语料 manifest，不是硬编码
  await expect(page.getByText('可测评大师')).toBeVisible()
  await expect(page.getByText('部可检索古籍')).toBeVisible()
  // 旧工具入口必须有自己的卡片样式（曾经因为缺 .hm-card 而文字重叠）
  const card = page.locator('.hm-card')
  await expect(card).toHaveCount(1)
  const box = await card.boundingBox()
  expect(box!.height, '旧工具卡片应至少 60px 高，说明样式生效').toBeGreaterThan(60)
})

test('盲测：投票前看不到盘面与出处，投票后才揭晓', async ({ page }) => {
  await freezeEnvironment(page)
  await startMatch(page, { withBirth: true, gender: 'female' })

  // 匿名期：断语可见，但盘面事实与依据必须封存
  await expect(page.getByText('盘面事实与依据共', { exact: false }).first()).toBeVisible()
  await expect(page.locator('.answer .answer-section h3', { hasText: '盘面事实' })).toHaveCount(0)
  await expect(page.locator('.answer .answer-section h3', { hasText: '依据' })).toHaveCount(0)
  await expect(page.getByText('沈砚舟')).toHaveCount(0)
  await expect(page.getByText('梅叟')).toHaveCount(0)

  await page.getByRole('button', { name: '甲更贴' }).click()
  await expect(page.getByText('本局已记分。')).toBeVisible()

  // 揭晓后：方法与引文都出现，且引文标注为已核
  await expect(page.locator('.answer .answer-section h3', { hasText: '盘面事实' }).first()).toBeVisible()
  await expect(page.locator('.answer .answer-section h3', { hasText: '依据' }).first()).toBeVisible()
  await expect(page.getByText('已核').first()).toBeVisible()
  const names = await page.locator('.answer-label').allTextContents()
  expect(names.join('')).toMatch(/沈砚舟|梅叟/)
})

test('同一问题连续两次，甲乙顺序会变化（不固定门派）', async ({ page }) => {
  // 不冻结随机源，验证真实随机化
  const orders: string[] = []
  for (let i = 0; i < 6; i++) {
    await page.goto('/#/ask')
    // 同一 hash 路由不会卸载组件，必须 reload 才能拿到干净的问答页
    await page.reload()
    await page.getByLabel('你要问什么').fill(`${question}${i}`)
    await page.getByRole('button', { name: '开始匿名盲测' }).click()
    await expect(page.getByRole('heading', { name: '同一问题，两份回答' })).toBeVisible()
    await page.getByRole('button', { name: '都不确定' }).click()
    const label = await page.locator('.answer-label').first().textContent()
    orders.push(label ?? '')
    await page.evaluate(() => localStorage.clear())
  }
  expect(new Set(orders).size, `六局首答都是 ${orders[0]}，顺序没有随机化`).toBeGreaterThan(1)
})

test('性别从表单一路写入台账：女命与男命各自被记下', async ({ page }) => {
  /*
   * 这条回归防的是一个"页面照常出图、数据全错"的缺陷：
   * calculateZiwei 一直支持 gender，但 flow 层从没把 request.birth 的性别传下去，
   * Ask.vue 也没有输入控件 —— 所有用户都按男命排，大限错位整整一百年。
   *
   * 这里只断言浏览器里能确定的部分：表单选的性别必须真的进了落库的 request。
   * 大限本身随性别变化，由 tests/runtime.spec.ts 用固定 masterIds 确定性验证 ——
   * 浏览器里三位大师随机抽两位，紫微只有 2/3 概率出场，靠抽签的断言必然间歇失败。
   */
  async function runWithGender(gender: 'female' | 'male') {
    await page.goto('/#/ask')
    await page.reload()
    await page.getByLabel('你要问什么').fill(question)
    await page.getByLabel('出生日期（可选）').fill('1990-06-15')
    await page.getByLabel('出生时间（填写日期后必填）').fill('08:30')
    await page.getByRole('radio', { name: gender === 'female' ? '女' : '男' }).check()
    await page.getByRole('button', { name: '开始匿名盲测' }).click()
    await expect(page.getByRole('heading', { name: '同一问题，两份回答' })).toBeVisible({ timeout: 25_000 })
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('tianji.arena.v1')
      if (!raw) return null
      const match = JSON.parse(raw).matches?.[0]
      return match ? { gender: match.request?.birth?.gender ?? null } : null
    })
    await page.evaluate(() => localStorage.clear())
    return stored
  }

  const female = await runWithGender('female')
  const male = await runWithGender('male')
  expect(female, '应能在本机台账里读到这一局').not.toBeNull()
  expect(male, '应能在本机台账里读到这一局').not.toBeNull()
  expect(female!.gender).toBe('female')
  expect(male!.gender).toBe('male')
})

test('未选性别时给出按男命计算的明确提示，而不是静默假设', async ({ page }) => {
  await page.goto('/#/ask')
  await page.getByLabel('出生日期（可选）').fill('1990-06-15')
  await expect(page.getByText('按男命顺行计算', { exact: false })).toBeVisible()
  await page.getByRole('radio', { name: '女' }).check()
  await expect(page.getByText('按男命顺行计算', { exact: false })).toHaveCount(0)
})

test('问天表单校验与本机持久化', async ({ page }) => {
  await page.goto('/#/ask')
  const submit = page.getByRole('button', { name: '开始匿名盲测' })
  await expect(submit).toBeDisabled()
  await page.getByLabel('你要问什么').fill(question)
  await page.getByLabel('出生日期（可选）').fill('2000-01-01')
  await expect(submit).toBeDisabled()
  await page.getByLabel('出生时间（填写日期后必填）').fill('12:00')
  await submit.click()
  await expect(page.getByText('先读内容再投票', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: '甲更贴' }).click()
  await expect(page.getByText('本局已记分。')).toBeVisible()
  await page.goto('/#/arena')
  // 台账读取在 v0.5 起是异步的（可能来自服务端），刷新后要给页面一次拉取机会
  await expect(page.getByText(question)).toBeVisible({ timeout: 10_000 })
  await page.reload()
  await expect(page.getByText(question)).toBeVisible({ timeout: 10_000 })
})

test('应验簿：断言入账，到期前不能标记命中', async ({ page }) => {
  await startMatch(page)
  await page.getByRole('button', { name: '都不确定' }).click()
  await page.goto('/#/ledger')
  // 一年后到期，因此此时只能看到待回填
  await expect(page.getByText('待回填').first()).toBeVisible()
  const hit = page.getByRole('button', { name: '应验' }).first()
  await hit.click()
  await expect(page.getByText('待回填').first()).toBeVisible()
})

test('大师榜：新设备显示见习，没有假战绩', async ({ page }) => {
  await page.goto('/#/leaderboard')
  await expect(page.getByRole('heading', { name: '大师榜' })).toBeVisible()
  await expect(page.getByText('见习').first()).toBeVisible()
  await expect(page.getByText('胜率待定').first()).toBeVisible()
})

test('典籍阅览室：引文可检索到原文', async ({ page }) => {
  await page.goto('/#/reading?bk=滴天髓&q=行之始而進')
  await expect(page.locator('.rd-hit').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.rd-hit').first()).toContainText('行之始')
})

test('设置支持导出、拒绝无效导入和清空本机数据', async ({ page }) => {
  await startMatch(page)
  await page.getByRole('button', { name: '都不确定' }).click()
  await page.goto('/#/settings')
  await expect(page.getByRole('heading', { name: '本地模式' })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出擂台与应验簿' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('tianji-local-arena.json')
  const stream = await download.createReadStream()
  let data = ''
  for await (const chunk of stream) data += chunk.toString()
  const parsed = JSON.parse(data)
  // 导出格式版本随 schema 演进，断言"有版本号且不低于 1"，不钉死具体数字
  expect(typeof parsed.schema).toBe('number')
  expect(parsed.schema).toBeGreaterThanOrEqual(1)
  expect(parsed.matches[0].request.question).toBe(question)

  await page.locator('input[type=file]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') })
  await expect(page.getByText('导入失败：', { exact: false })).toBeVisible()

  // 嵌套字段被篡改也要拒绝，而不是只查顶层
  const tampered = JSON.parse(data)
  tampered.matches[0].answers[0].citations = [{ book: 'x', text: 'y' }]
  await page.locator('input[type=file]').setInputFiles({ name: 'tampered.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(tampered)) })
  await expect(page.getByText('导入失败：', { exact: false })).toBeVisible()

  await page.getByRole('button', { name: '清空全部本机数据' }).click()
  await expect(page.getByText('本机擂台、应验簿、工具反馈和旧配置已清空。')).toBeVisible()
  await page.goto('/#/arena')
  await expect(page.getByText('还没有对局。', { exact: false })).toBeVisible()
  await page.goto('/#/settings')
  await page.locator('input[type=file]').setInputFiles({ name: 'arena.json', mimeType: 'application/json', buffer: Buffer.from(data) })
  await expect(page.getByText('本机数据已导入。')).toBeVisible()
  await page.goto('/#/arena')
  await expect(page.getByText(question)).toBeVisible()
})

test('移动视图可操作且无横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await startMatch(page)
  await expect(page.getByRole('button', { name: '甲更贴' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  // 盲测页在窄屏应该是单列
  const cards = page.locator('.answer')
  const first = await cards.nth(0).boundingBox()
  const second = await cards.nth(1).boundingBox()
  expect(second!.y).toBeGreaterThan(first!.y + first!.height - 5)
})

test('核心流程仅发起同源请求', async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL!).origin
  const external: string[] = []
  await context.route('**/*', async (route) => {
    const url = route.request().url()
    if (new URL(url).origin !== origin) {
      external.push(url)
      await route.abort()
    } else await route.continue()
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '天机台' })).toBeVisible()
  await startMatch(page)
  await page.getByRole('button', { name: '都不确定' }).click()
  await page.goto('/#/reading?bk=滴天髓&q=行之始而進')
  await expect(page.locator('.rd-hit').first()).toBeVisible({ timeout: 15_000 })
  await page.goto('/#/settings')
  await expect(page.getByRole('heading', { name: '本地模式' })).toBeVisible()
  expect(external).toEqual([])
})

test('全部路由可达且不白屏', async ({ page }) => {
  const routes = ['/', '/#/ask', '/#/arena', '/#/leaderboard', '/#/ledger', '/#/settings', '/#/about', '/#/reading', '/#/masters/ziping', '/#/t/meihua', '/#/not-a-page']
  for (const route of routes) {
    await page.goto(route)
    // 路由切换用 <Transition mode="out-in">，旧页面淡出期间 main 会短暂为空。
    // 用"页面标题已被 afterEach 写入"作为就绪信号，而不是抓一帧快照。
    await expect.poll(() => page.title(), { message: `${route} 没有渲染出页面` }).toContain('天机台')
    await expect(page.locator('.du-brand')).toBeVisible()
    await expect(page.locator('main')).not.toBeEmpty()
  }
})

test('@screenshots 生成可复现的展示截图', async ({ page }) => {
  await freezeEnvironment(page)
  await mkdir('docs/screenshots', { recursive: true })

  /**
   * 哈希导航不会让浏览器重新加载文档，Vue 路由是异步切换的。
   * 直接 goto 后立刻截图，会把上一页拍进去 —— 这正是之前 leaderboard.png
   * 里出现的其实是问天页的原因。所以每次截图前都强制一次完整导航并等待标志元素。
   */
  async function openAndWait(hash: string, ready: () => Promise<unknown>) {
    await page.goto('about:blank')
    await page.goto(`/${hash}`)
    await ready()
    await page.waitForLoadState('networkidle')
  }

  const shot = async (name: string) => {
    // 全页截图时 sticky 页眉会被合成到页面中段，产生"页眉重复"的假象。
    // 这是截图机制的产物，不是页面缺陷，所以只在截图期间把它改成 static。
    await page.addStyleTag({ content: '.du-top{position:static!important}' })
    await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true, animations: 'disabled', caret: 'hide' })
    await page.evaluate(() => {
      for (const style of document.querySelectorAll('style')) {
        if (style.textContent?.includes('.du-top{position:static!important}')) style.remove()
      }
    })
  }

  await openAndWait('', async () => {
    await expect(page.getByRole('heading', { name: '天机台' })).toBeVisible()
  })
  await shot('home')

  // 问天表单本身没有截图：性别控件与"按男命计算"提示是 v0.6.0 的关键新增，
  // 展示图里必须能看见它，否则新功能等于没展示。
  await openAndWait('#/ask', async () => {
    await expect(page.getByRole('heading', { name: '问天' })).toBeVisible()
  })
  await page.getByLabel('你要问什么').fill(question)
  await page.getByLabel('出生日期（可选）').fill('1990-06-15')
  await page.getByLabel('出生时间（填写日期后必填）').fill('08:30')
  await page.getByRole('radio', { name: '女' }).check()
  await shot('ask-form')

  await startMatch(page, { withBirth: true, gender: 'female' })
  await waitForEvidenceSettled(page)
  await shot('blind-match')

  await page.getByRole('button', { name: '甲更贴' }).click()
  await expect(page.getByText('本局已记分。')).toBeVisible()
  // 揭晓后断言区会渲染截止日期；日期由冻结的时钟决定，但排版完成有第 n 帧差异，
  // 等两张卡片都完成布局再截，避免同一次运行产出两种图。
  await expect(page.locator('.answer-claims')).toHaveCount(2)
  await page.waitForTimeout(120)
  await shot('reveal')

  await openAndWait('#/leaderboard', async () => {
    await expect(page.getByRole('heading', { name: '大师榜' })).toBeVisible()
    await expect(page.locator('.board-row').first()).toBeVisible()
  })
  await shot('leaderboard')

  await openAndWait('#/ledger', async () => {
    await expect(page.getByRole('heading', { name: '应验簿' })).toBeVisible()
  })
  await shot('ledger')

  await openAndWait('#/reading', async () => {
    await expect(page.locator('.rd-bk').first()).toBeVisible({ timeout: 15_000 })
  })
  await shot('reading')

  await openAndWait('#/masters/ziping', async () => {
    await expect(page.getByRole('heading', { name: '沈砚舟' })).toBeVisible()
  })
  await shot('master-card')

  await page.setViewportSize({ width: 375, height: 812 })

  await openAndWait('#/settings', async () => {
    await expect(page.getByRole('heading', { name: '本地模式' })).toBeVisible()
  })
  await shot('settings-mobile')

  await openAndWait('', async () => {
    await expect(page.getByRole('heading', { name: '天机台' })).toBeVisible()
  })
  await shot('home-mobile')
})

test('可访问性：跳转链接、焦点环、标题随路由变化', async ({ page }) => {
  await page.goto('/')
  // 首个 Tab 应落在"跳到主内容"，而不是七个导航项里的第一个
  await page.keyboard.press('Tab')
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
  expect(focused).toContain('跳到主内容')

  // 页面标题随路由变化，读屏与浏览器历史靠它区分页面。
  // afterEach 在导航完成后才写标题，所以用 poll 而不是立即断言。
  await expect.poll(() => page.title()).toContain('天机台')
  await page.goto('/#/ask')
  await expect.poll(() => page.title()).toContain('问天')
  await page.goto('/#/ledger')
  await expect.poll(() => page.title()).toContain('应验簿')

  // 主内容区可被聚焦（路由切换后焦点回到这里）
  expect(await page.getAttribute('#main', 'tabindex')).toBe('-1')
})

test('从首页点导航能真正切换到目标页（回归：曾因离场动画卡死白屏）', async ({ page }) => {
  // 这个缺陷曾经让"首页 → 任意子页"永远停在空注释节点：
  // <Transition mode="out-in"> 等不到旧页面离场动画结束，新页面就永不挂载。
  // 用点击真实导航链接来复现，而不是 goto —— 只有客户端路由切换才会触发它。
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '天机台' })).toBeVisible()

  for (const [label, heading] of [['问天', '问天'], ['大师榜', '大师榜'], ['机制', null]] as const) {
    await page.getByRole('link', { name: label, exact: true }).click()
    await expect(page.locator('main')).not.toBeEmpty({ timeout: 3000 })
    if (heading) await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
    await page.getByRole('link', { name: '天机台首页' }).click()
    await expect(page.getByRole('heading', { name: '天机台' })).toBeVisible()
  }
})

test('404 给出真实出路，不是死胡同', async ({ page }) => {
  await page.goto('/#/no-such-page')
  await expect(page.getByRole('heading', { name: '这里没有东西' })).toBeVisible()
  await expect(page.getByRole('link', { name: '去问天' })).toBeVisible()
  await page.getByRole('link', { name: '去问天' }).click()
  await expect(page.getByLabel('你要问什么')).toBeVisible()
})

test('打印样式：切到白底且隐藏导航与投票', async ({ page }) => {
  await startMatch(page)
  await page.emulateMedia({ media: 'print' })

  // 导航与投票区在纸上没有意义，必须消失
  await expect(page.locator('.du-top')).toBeHidden()
  await expect(page.locator('.vote')).toBeHidden()

  // 背景必须是浅色，否则打出来是一整页黑
  const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
  const [r, g, b] = bg.match(/\d+/g)!.map(Number)
  expect((r! + g! + b!) / 3, `打印背景仍是深色：${bg}`).toBeGreaterThan(200)
})

test('报告导出：投票后可下载自包含 HTML', async ({ page }) => {
  await startMatch(page)
  await page.getByRole('button', { name: '甲更贴' }).click()
  await expect(page.getByText('本局已记分。')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出本次报告' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^tianji-reading-[0-9a-f]+\.html$/)

  const stream = await download.createReadStream()
  let html = ''
  for await (const chunk of stream) html += chunk.toString()
  expect(html).toContain('<!doctype html>')
  expect(html).toContain('天机台 · 读取报告')
  expect(html).toContain(question)
  // 自包含：不引用任何外部资源
  expect(html).not.toMatch(/<script[^>]+src=/i)
  expect(html).not.toMatch(/https?:\/\/(?!www\.w3\.org)/)
})

test('应验簿可导出为 HTML', async ({ page }) => {
  await startMatch(page)
  await page.getByRole('button', { name: '都不确定' }).click()
  await page.goto('/#/ledger')
  await expect(page.getByText('待回填').first()).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出应验簿（HTML）' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('tianji-claims.html')
  const stream = await download.createReadStream()
  let html = ''
  for await (const chunk of stream) html += chunk.toString()
  expect(html).toContain('天机台 · 应验簿')
  expect(html).toContain('共 2 条断言')
})

test('存储被禁用时如实告知未保存，而不是假装成功', async ({ page }) => {
  // 在页面脚本运行前把 setItem 打坏，模拟配额满 / 隐私模式
  await page.addInitScript(() => {
    const real = Storage.prototype.setItem
    let armed = false
    Storage.prototype.setItem = function (key: string, value: string) {
      if (armed) {
        const error = new Error('quota')
        error.name = 'QuotaExceededError'
        throw error
      }
      return real.call(this, key, value)
    }
    // 允许应用初始化写入，之后才拦截
    ;(window as unknown as { __armQuota?: () => void }).__armQuota = () => { armed = true }
  })

  await page.goto('/#/ask')
  await page.getByLabel('你要问什么').fill(question)
  await page.getByRole('button', { name: '开始匿名盲测' }).click()
  await expect(page.getByRole('heading', { name: '同一问题，两份回答' })).toBeVisible()

  await page.evaluate(() => (window as unknown as { __armQuota?: () => void }).__armQuota?.())
  await page.getByRole('button', { name: '甲更贴' }).click()

  await expect(page.getByText('本机存储空间已满', { exact: false })).toBeVisible()
  await expect(page.getByText('没有写进浏览器', { exact: false })).toBeVisible()
})

test('安全网关：危机输入不生成断语，给出求助信息', async ({ page }) => {
  await page.goto('/#/ask')
  await page.getByLabel('你要问什么').fill('我想自杀')
  await page.getByRole('button', { name: '开始匿名盲测' }).click()

  // 必须出现求助卡片，且不能渲染任何回答
  await expect(page.locator('.safety-card')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('12356', { exact: false })).toBeVisible()
  await expect(page.locator('.answer')).toHaveCount(0)
})

test('安全网关：未成年单独使用给出监护提示', async ({ page }) => {
  await page.goto('/#/ask')
  await page.getByLabel('你要问什么').fill('我16岁，想问学业')
  await page.getByRole('button', { name: '开始匿名盲测' }).click()
  await expect(page.locator('.safety-card')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('12355', { exact: false })).toBeVisible()
})

test('移动端所有可点击元素至少 44px 高', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '天机台' })).toBeVisible()

  const targets = await page.locator('nav a, nav button, .du-btn').all()
  const tooSmall: string[] = []
  for (const target of targets) {
    if (!(await target.isVisible())) continue
    const box = await target.boundingBox()
    if (box && box.height < 44) {
      tooSmall.push(`${(await target.textContent())?.trim().slice(0, 10)} = ${Math.round(box.height)}px`)
    }
  }
  expect(tooSmall, `这些元素低于 44px 触控下限：${tooSmall.join(', ')}`).toEqual([])
})
