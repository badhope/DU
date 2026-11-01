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
  'dist',
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
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  lines.forEach((line, index) => {
    for (const pattern of banned) if (pattern.test(line)) findings.push(`${path.relative(ROOT, file)}:${index + 1}: ${pattern}`)
  })
}
if (findings.length) {
  console.error('本地模式门禁失败：发现外部模型/凭据/上传出口或旧文案。')
  for (const finding of findings) console.error(`- ${finding}`)
  process.exit(1)
}
console.log('本地模式门禁通过：未发现外部模型、Key、endpoint 或远程上传文案。')
