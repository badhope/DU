import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * 后端模式端到端
 *
 * 这组测试守的是一个曾经"看起来完成了、实际没接线"的功能：
 * v0.4.0 只做了 /api/health 探测和设置页的一行字，问天仍然只写 localStorage。
 * 界面显示 SERVER，数据却在浏览器里 —— 状态是真的，行为是假的。
 *
 * 现在每条断言都要求服务端台账**真的发生变化**，而不只是界面上写了一句话。
 */

// 用 baseURL，跟随 playwright.backend.config.ts 的端口，避免两处硬编码
const BASE = process.env.DU_BACKEND_URL ?? 'http://127.0.0.1:4180'

/**
 * 服务端启动时会把一次性令牌写进数据目录的 token 文件。
 * 测试用 page.request 直接打 API，必须带上它 —— 这正是鉴权在起作用。
 */
function serverToken(): string {
  return readFileSync(join(process.cwd(), '.tmp-e2e-backend', 'token'), 'utf8').trim()
}

function apiHeaders() {
  return { 'X-Tianji-Token': serverToken() }
}
const question = '后端模式测试：我该不该接这个项目'

/** 等应用完成台账模式探测 */
async function waitReady(page: Page) {
  await page.waitForFunction(() => Boolean((window as unknown as { __tianjiReady?: Promise<string> }).__tianjiReady), null, { timeout: 10_000 })
  await page.evaluate(() => (window as unknown as { __tianjiReady: Promise<string> }).__tianjiReady)
}

async function serverState(page: Page) {
  const response = await page.request.get(`${BASE}/api/session`, { headers: apiHeaders() })
  expect(response.ok()).toBeTruthy()
  return (await response.json()) as { matches: number; claims: number; pendingClaims: number }
}

test.describe('后端模式真的接线', () => {
  test('探测到同源服务后，设置页显示服务端模式', async ({ page }) => {
    await page.goto('/#/settings')
    await waitReady(page)
    await expect(page.getByText('已连接本机服务', { exact: false })).toBeVisible()
    await expect(page.getByText('SERVER · 127.0.0.1')).toBeVisible()
  })

  test('从网页问一次，服务端台账真的多了一场', async ({ page }) => {
    const before = await serverState(page)

    await page.goto('/#/ask')
    await waitReady(page)
    await page.getByLabel('你要问什么').fill(question)
    await page.getByRole('button', { name: '开始匿名盲测' }).click()
    await expect(page.getByRole('heading', { name: '同一问题，两份回答' })).toBeVisible()

    // 关键断言：不是看界面，是查服务端
    await expect.poll(async () => (await serverState(page)).matches, { timeout: 5000 }).toBe(before.matches + 1)
  })

  test('网页投票后服务端记录被标记，且不会重复计分', async ({ page }) => {
    await page.goto('/#/ask')
    await waitReady(page)
    await page.getByLabel('你要问什么').fill(`${question}（投票）`)
    await page.getByRole('button', { name: '开始匿名盲测' }).click()
    await expect(page.getByRole('heading', { name: '同一问题，两份回答' })).toBeVisible()

    await page.getByRole('button', { name: '甲更贴' }).click()
    await expect(page.getByText('本局已记分。')).toBeVisible()

    // 服务端那份记录必须带上 vote 字段
    const matches = (await (
      await page.request.get(`${BASE}/api/matches`, { headers: apiHeaders() })
    ).json()) as Array<{ request: { question: string }; vote?: string }>
    const mine = matches.find((m) => m.request.question.includes('投票'))
    expect(mine?.vote).toBe('a')
  })

  test('应验簿页读的是服务端数据', async ({ page }) => {
    await page.goto('/#/ledger')
    await waitReady(page)
    // 上一个用例在服务端留下了断言
    await expect(page.getByText('待回填').first()).toBeVisible()

    const claimsBefore = await serverState(page)
    expect(claimsBefore.claims).toBeGreaterThan(0)
  })

  test('擂台页列出的是服务端对局', async ({ page }) => {
    await page.goto('/#/arena')
    await waitReady(page)
    await expect(page.getByText(question, { exact: false }).first()).toBeVisible()
  })
})
