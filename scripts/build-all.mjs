#!/usr/bin/env node
/**
 * 多端构建
 *
 * 产出四样东西：
 *   1. `dist/`            —— 网页（vite build）
 *   2. `build/cli.mjs`    —— 可直接 `node cli.mjs` 跑的 CLI
 *   3. `build/mcp.mjs`    —— MCP server（stdio）
 *   4. `build/tianji.exe` —— Windows 单文件可执行（Node SEA）
 *
 * 为什么用 SEA 而不是 Electron：
 *   Electron 会把一个完整 Chromium 打进安装包（约 300MB），而本项目的三种界面里
 *   只有网页需要浏览器，且网页本来就由用户自己的浏览器打开。SEA 把 Node 运行时和
 *   脚本合成一个二进制（约 100MB 的 node.exe 本体 + 1.5MB 脚本），
 *   启动快、无安装目录污染、不需要管理员权限。
 *
 * 用法：
 *   node scripts/build-all.mjs            # 全部构建
 *   node scripts/build-all.mjs --skip-sea # 跳过 SEA（非 Windows 或没有 postject）
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, copyFileSync, existsSync, statSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve, relative, dirname, sep } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const PKG_VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version
const BUILD = join(ROOT, 'build')
const SKIP_SEA = process.argv.includes('--skip-sea')

/**
 * 直接调用 node_modules/.bin 里的可执行文件，而不是 `npx`：
 * npx 在 Windows 上要经过 cmd shim，从 Node 的 execFile 直接调会 ENOENT。
 */
const BIN = (name) => join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name)

/** esbuild 的 .cmd shim 会二次解析引号，带引号的 --define 会被吃掉；直接调 JS 入口更稳 */
const ESBUILD = join(ROOT, 'node_modules', 'esbuild', 'bin', 'esbuild')

const run = (command, args, options = {}) => {
  console.log(`  $ ${command.split(/[\/]/).pop()} ${args.join(' ')}`)
  // 只有 .cmd shim 需要 shell；直接调 node.exe 或真实二进制时走 shell 反而会把参数转义坏
  const needsShell = process.platform === 'win32' && /\.cmd$/i.test(command)
  return execFileSync(command, args, { cwd: ROOT, stdio: 'inherit', ...(needsShell ? { shell: true } : {}), ...options })
}

const ESBUILD_BASE = [
  '--bundle',
  '--platform=node',
  '--target=node22',
  '--alias:@=./src',
  // src/data/corpus.ts 用了 Vite 的 import.meta.env.BASE_URL 拼静态资源路径。
  // Node 里没有这个对象，构建时替换成空对象（读语料走绝对路径，不需要 base）。
  '--define:import.meta.env={}',
]

const esbuild = (entry, outfile, format = 'esm') => {
  // CJS 下 import.meta 会被 esbuild 判为不可用；语料模块只需要 BASE_URL，
  // 用 define 直接替换成空串即可（Node 侧读语料走绝对路径）。
  const defineMeta = format === 'cjs' ? ['--define:import.meta.env.BASE_URL=""'] : []
  return run(process.execPath, [
    ESBUILD,
    entry,
    ...ESBUILD_BASE,
    ...defineMeta,
    `--format=${format}`,
    `--define:__TIANJI_VERSION__="${PKG_VERSION}"`,
    `--outfile=${outfile}`,
    '--log-level=warning',
  ])
}

mkdirSync(BUILD, { recursive: true })

/* ── 1. 网页 ─────────────────────────────────────────────── */
console.log('\n[1/4] 构建网页')
run(BIN('vite'), ['build', '--logLevel', 'warn'])
console.log('  → dist/')

/* ── 2. CLI ──────────────────────────────────────────────── */
console.log('\n[2/4] 构建 CLI')
esbuild('src/node/cli.ts', join(BUILD, 'cli.mjs'))
const cliSize = statSync(join(BUILD, 'cli.mjs')).size
console.log(`  → build/cli.mjs (${(cliSize / 1024).toFixed(0)} KB)`)

/* ── 3. MCP server ───────────────────────────────────────── */
console.log('\n[3/4] 构建 MCP server')
esbuild('src/node/mcp.ts', join(BUILD, 'mcp.mjs'))
const mcpSize = statSync(join(BUILD, 'mcp.mjs')).size
console.log(`  → build/mcp.mjs (${(mcpSize / 1024).toFixed(0)} KB)`)

/* ── 4. Windows 单文件可执行 ─────────────────────────────── */
console.log('\n[4/4] 构建单文件可执行')
const isWindows = process.platform === 'win32'

if (SKIP_SEA || !isWindows) {
  console.log('  跳过（需要 --skip-sea 之外的条件：Windows 平台）')
} else {
  // SEA 要求 CommonJS 或 ESM 单文件；用 esbuild 打成 CJS 更稳（SEA 对 ESM 支持较新）
  esbuild('src/node/cli.ts', join(BUILD, 'sea-entry.cjs'), 'cjs')

  const blobPath = join(BUILD, 'sea-prep.blob')
  const configPath = join(BUILD, 'sea-config.json')

  // 把 dist/ 作为 SEA assets 嵌入：key 用 posix 相对路径，运行时由 node:sea 取用。
  // 这样安装包是真正的单文件，`tianji serve` 不需要旁边放一个 dist 目录。
  const assets = {}
  const distDir = join(ROOT, 'dist')
  if (existsSync(distDir)) {
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.isFile()) {
          // SEA 的 asset key 必须是 posix 路径，否则 Windows 反斜杠会进 key 表
          const key = relative(distDir, full).split(sep).join('/')
          assets[key] = full
        }
      }
    }
    walk(distDir)
  }
  console.log(`  内嵌网页资源：${Object.keys(assets).length} 个文件`)

  writeFileSync(
    configPath,
    JSON.stringify(
      {
        main: join(BUILD, 'sea-entry.cjs'),
        output: blobPath,
        disableExperimentalSEAWarning: true,
        useSnapshot: false,
        useCodeCache: false,
        assets,
      },
      null,
      2,
    ),
  )
  run(process.execPath, ['--experimental-sea-config', configPath])

  const exePath = join(BUILD, 'tianji.exe')
  copyFileSync(process.execPath, exePath)
  run(BIN('postject'), [
    exePath,
    'NODE_SEA_BLOB',
    blobPath,
    '--sentinel-fuse',
    'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  ])
  const exeSize = statSync(exePath).size
  console.log(`  → build/tianji.exe (${(exeSize / 1024 / 1024).toFixed(1)} MB)`)

  // 冒烟测试：跑一次 --version，确认二进制真的能启动
  const version = execFileSync(exePath, ['--version'], { encoding: 'utf8' }).trim()
  console.log(`  ✓ 二进制自检通过：tianji ${version}`)
}

console.log('\n构建完成。\n')
