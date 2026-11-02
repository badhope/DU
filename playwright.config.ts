import { defineConfig, devices } from '@playwright/test'

/**
 * 浏览器测试配置。
 *
 * 截图用例（@screenshots）默认排除：它会把 PNG 写回 docs/screenshots/，
 * 而 Chromium 的文字抗锯齿在不同运行之间会有 1–2 像素的抖动，每次跑测试都
 * 弄脏工作树。需要更新展示图时显式跑 `npm run screenshots`。
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  grepInvert: process.env.DU_INCLUDE_SCREENSHOTS ? undefined : /@screenshots/,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
