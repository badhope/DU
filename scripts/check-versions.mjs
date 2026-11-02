#!/usr/bin/env node
/**
 * 版本一致性门禁
 *
 * 版本号在三个地方出现：package.json、CHANGELOG 的顶层条目、以及
 * CITATION.cff 的 version 字段。三处对不上时，README 里写的版本、
 * 用户看到的 tag、实际发布的代码就可能是三个不同的东西。
 *
 * 这里只做一件事：让它们在 CI 里必须一致。检查失败信息直接给出修法。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8')

const pkg = JSON.parse(read('package.json'))
const version = pkg.version
const errors = []

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  errors.push(`package.json version "${version}" 不是合法 semver（需要 MAJOR.MINOR.PATCH）。`)
}

// CHANGELOG：最新发布段必须是当前版本，且不能只留 Unreleased
const changelog = read('CHANGELOG.md')
const released = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+[^\]]*)\] - (\d{4}-\d{2}-\d{2})$/gm)]
if (!released.length) {
  errors.push('CHANGELOG.md 没有任何 "## [x.y.z] - YYYY-MM-DD" 发布段。')
} else {
  const latest = released[0][1]
  if (latest !== version) {
    errors.push(`CHANGELOG.md 最新发布段是 ${latest}，与 package.json 的 ${version} 不一致。`)
  }
  const date = released[0][2]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    errors.push(`CHANGELOG.md 最新发布段的日期 "${date}" 不是合法日期。`)
  }
}

// CITATION.cff：可选，但存在就必须与 package.json 对齐
const citationPath = path.join(ROOT, 'CITATION.cff')
if (fs.existsSync(citationPath)) {
  const citation = fs.readFileSync(citationPath, 'utf8')
  const match = /^version:\s*"?([^"\n]+)"?$/m.exec(citation)
  if (!match) errors.push('CITATION.cff 缺少 version 字段。')
  else if (match[1].trim() !== version) {
    errors.push(`CITATION.cff version 是 ${match[1].trim()}，与 package.json 的 ${version} 不一致。`)
  }
}

if (errors.length) {
  console.error('版本一致性门禁失败：')
  for (const error of errors) console.error(`- ${error}`)
  console.error('\n修法：改 package.json version 后，同步 CHANGELOG.md 顶层发布段与 CITATION.cff。')
  process.exit(1)
}

console.log(`版本一致性通过：v${version}（package.json / CHANGELOG.md${fs.existsSync(citationPath) ? ' / CITATION.cff' : ''}）`)
