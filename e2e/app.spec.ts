import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const question = '虚构示例：如何安排下个月的学习计划？'

async function startMatch(page: Page) {
  await page.goto('/#/ask')
  await page.getByLabel('你要问什么').fill(question)
  await page.getByRole('button', { name: '开始匿名盲测' }).click()
  await expect(page.getByRole('heading', { name: '同一问题，两份回答' })).toBeVisible()
}

test('首页导航与空状态', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '天机台' })).toBeVisible()
  await page.getByRole('link', { name: '进入擂台' }).click()
  await expect(page.getByText('还没有对局。', { exact: false })).toBeVisible()
  await page.goto('/#/ledger')
  await expect(page.getByText('目前没有待回填断言', { exact: false })).toBeVisible()
})

test('问天校验、匿名投票和本机持久化', async ({ page }) => {
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
  await expect(page.getByText('已揭晓', { exact: false })).toBeVisible()
  await page.goto('/#/arena')
  await expect(page.getByText(question)).toBeVisible()
  await page.reload()
  await expect(page.getByText(question)).toBeVisible()
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
  expect(JSON.parse(data).matches[0].request.question).toBe(question)
  await page.locator('input[type=file]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') })
  await expect(page.getByText('导入失败：文件结构不符合本机台账格式。')).toBeVisible()
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
  await page.goto('/#/settings')
  await expect(page.getByRole('heading', { name: '本地模式' })).toBeVisible()
  expect(external).toEqual([])
})

test('@screenshots 生成桌面与移动端真实截图', async ({ page }) => {
  await mkdir('docs/screenshots', { recursive: true })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '天机台' })).toBeVisible()
  await page.screenshot({ path: 'docs/screenshots/home.png', fullPage: true, animations: 'disabled' })
  await startMatch(page)
  await page.screenshot({ path: 'docs/screenshots/blind-match.png', fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/#/settings')
  await expect(page.getByRole('heading', { name: '本地模式' })).toBeVisible()
  await page.screenshot({ path: 'docs/screenshots/settings-mobile.png', fullPage: true, animations: 'disabled' })
})
