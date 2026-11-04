#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const targets = [
  'src',
  'README.md',
  'docs',
  'package.json',
  'index.html',
  'scripts/gen-readme.mjs',
  // dist 是构建产物，同源 /api 调用会在打包后仍在里面，逐文件豁免不现实。
  // 它的可信度由 src 保证：src 过不了，dist 就没机会生成。
  // 注意：build/ 不在这里。它是 dist 与 src 的打包产物，内容完全由源码决定；
  // 扫它只会重复报同一行源码的错（例如服务端的 node:http），噪音大于收益。
  // 真正的保证是：源码门禁 + 构建脚本本身也受门禁约束。
]
/**
 * 出口检查。
 *
 * 之前只有"外部模型域名/Key"这类黑名单，把 `fetch("https://evil.example")`
 * 写进源码，门禁照样通过。现在补充对网络 API 的检测，并给同源与本地调用
 * 留出白名单 —— 我们要禁止的是"把数据送出设备"，不是禁止一切网络。
 */
const networkExports = [
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /new\s+WebSocket/,
  /EventSource/,
  /from\s+['"]node:https?['"]/,
  /require\(['"]https?['"]\)/,
  /from\s+['"]node:net['"]/,
  /navigator\.sendBeacon/,
]

/**
 * 允许出现网络调用的文件与理由。
 *
 * 这些要么是本地服务端自己（它就是 HTTP 服务），要么是访问同源 /api 的客户端。
 * 任何新增条目都需要写明理由，避免"加个白名单就过"。
 */
const networkAllow = [
  { file: 'src/node/server.ts', why: '本机 HTTP 服务端，服务本身' },
  { file: 'src/node/assets.ts', why: 'SEA 资源读取，无网络' },
  { file: 'src/composables/backend.ts', why: '只请求同源 /api，已由服务端鉴权' },
  { file: 'src/node/cli.ts', why: 'doctor 不联网；serve 起服务' },
  { file: 'src/node/mcp.ts', why: 'stdio 传输，无网络' },
  { file: 'src/data/corpus.ts', why: '只读同源 public/corpus 静态语料' },
  { file: 'src/core/ziwei.ts', why: 'iztro 为纯计算，动态 import 不联网' },
]

const banned = [
  /api\.openai\.com/i,
  /api\.anthropic\.com/i,
  /chat\/completions/i,
  /dangerous-direct-browser-access/i,
  /x-api-key/i,
  /Authorization\s*:\s*['"`]Bearer/i,
  /tianji\.ai(?:\.session)?\.v1/i,
  /模型生成/i,
  /自定义\s*endpoint/i,
]

function filesFor(target) {
  const full = path.join(ROOT, target)
  if (!fs.existsSync(full)) return []
  if (fs.statSync(full).isFile()) return [full]
  const out = []
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const child = path.join(full, entry.name)
    if (entry.isDirectory()) out.push(...filesFor(path.relative(ROOT, child)))
    else if (/\.(?:ts|vue|mjs|json|md|html|js|map)$/.test(entry.name)) out.push(child)
  }
  return out
}

const findings = []
for (const file of [...new Set(targets.flatMap(filesFor))]) {
  if (file.endsWith('scripts/check-local-only.mjs')) continue
  const rel = path.relative(ROOT, file).split(path.sep).join('/')
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)

  // 黑名单：外部模型域名、凭据、旧文案
  lines.forEach((line, index) => {
    for (const pattern of banned) if (pattern.test(line)) findings.push(`${rel}:${index + 1}: 命中禁用模式 ${pattern}`)
  })

  /*
   * 出口检查：禁止把数据送出设备的网络 API。
   *
   * 这里**不**豁免 dist/ 与 build/：它们是源码的打包产物，恰恰是最容易被
   * 忽略的出口（构建脚本注入一行 fetch，源码里看不到）。只按"我们的源码文件"
   * 逐条豁免，且每条都写了理由。
   */
  const allow = networkAllow.some((entry) => rel === entry.file)
  if (!allow) {
    for (const pattern of networkExports) {
      const match = pattern.exec(text)
      if (!match) continue
      const lineNo = text.slice(0, match.index).split('\n').length
      findings.push(`${rel}:${lineNo}: 发现网络出口 ${pattern}（如确有必要，在 scripts/check-local-only.mjs 的 networkAllow 里写明理由）`)
    }
  }
}
if (findings.length) {
  console.error('本地模式门禁失败：发现外部模型/凭据/上传出口或旧文案。')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}
console.log('本地模式门禁通过：未发现外部模型、Key、endpoint 或远程上传文案。')
