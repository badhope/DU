#!/usr/bin/env node
/**
 * 重新生成展示截图。
 *
 * 为什么需要这个薄壳，而不是直接在 package.json 里写环境变量：
 * `DU_INCLUDE_SCREENSHOTS=1 playwright test` 是 POSIX 语法，Windows 的 cmd 不认，
 * 而本项目的桌面产物就是 Windows exe。为一个环境变量引入 cross-env 不值得，
 * 用 8 行 Node 更省。
 *
 * playwright.config.ts 里的 grepInvert 默认排除 @screenshots（避免日常测试
 * 弄脏工作树），所以必须同时设置这个变量并显式 --grep。
 * 之前 npm run screenshots 只写了 --grep，结果 grepInvert 先把用例排除了，
 * 报 "No tests found" —— 脚本形同虚设。
 */
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const root = process.cwd()
const bin = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'playwright.cmd' : 'playwright')

const result = spawnSync(bin, ['test', '--grep', '@screenshots'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, DU_INCLUDE_SCREENSHOTS: '1' },
  // Windows 上 .cmd 需要 shell 才能被解析
  shell: process.platform === 'win32',
})

if (result.error) {
  console.error('[screenshots] 启动 playwright 失败：', result.error.message)
  process.exit(1)
}
process.exit(result.status ?? 1)
