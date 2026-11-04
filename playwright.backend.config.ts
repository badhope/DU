import { defineConfig, devices } from '@playwright/test'

/**
 * 后端模式 E2E 配置
 *
 * 与主配置的区别：这里的 webServer 不是 vite dev server，而是**打包后的
 * tianji serve**——也就是用户真正会跑的形态。这样测的是"网页 + HTTP API +
 * SQLite"的完整链路，而不是开发服务器的替身。
 *
 * 单独一份配置的另一个原因：它的端口、数据目录、启动命令都不同，
 * 塞进主配置会让两边的 webServer 互相打架。
 */
const PORT = 4180

export default defineConfig({
  testDir: './e2e',
  testMatch: /backend\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    // 必须先 build:all，否则 serve 找不到网页资源
    command: `node build/cli.mjs serve --port ${PORT} --data-dir .tmp-e2e-backend`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
