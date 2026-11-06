#!/usr/bin/env node
/**
 * README 语言门禁
 *
 * 用户要求对外介绍"以英文为主，语气贴合开源项目正式展示"。实测英文 README
 * 里有整句中文（标题、安装示例、功能表），而 check:readme 只比对**生成器输出
 * 是否与实际文件一致** —— 两边一起错它照样通过。一致性门禁管不了内容质量。
 *
 * 规则：
 *   - README.md（英文）：正文不得出现连续 12 个以上汉字（短词如"八字"不算）
 *   - README.zh-CN.md（中文）：必须有足够汉字，且英文词占比不能过高
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const errors = []

/** 连续 12 个以上汉字 = 成句中文；短专名（天机台 / 紫微斗数）不算 */
const CJK_RUN = /[\u4e00-\u9fff]{12,}/g

function stripCodeAndLinks(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
}

const en = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8')
const enRuns = [...stripCodeAndLinks(en).matchAll(CJK_RUN)].map((m) => m[0])
if (enRuns.length) {
  errors.push(
    `README.md（英文版）出现 ${enRuns.length} 处成句中文：` +
      enRuns.slice(0, 3).map((s) => `「${s}」`).join('、'),
  )
}

const zh = stripCodeAndLinks(fs.readFileSync(path.join(ROOT, 'README.zh-CN.md'), 'utf8'))
const zhChars = (zh.match(/[\u4e00-\u9fff]/g) ?? []).length
const latinWords = (zh.match(/\b[a-zA-Z]{3,}\b/g) ?? []).length
/*
 * 中文版是精简版（一句话 + 安装 + 四步表），实测 156 个汉字是正常体量。
 * 阈值取 120：低于这个说明模板被换成了英文，而不是"中文版写得短"。
 */
if (zhChars < 120) {
  errors.push(`README.zh-CN.md 只有 ${zhChars} 个汉字，看起来不像中文版。`)
}
if (latinWords > zhChars / 4) {
  errors.push(`README.zh-CN.md 英文词 ${latinWords} 个，相对汉字 ${zhChars} 个过多，可能混入了英文模板。`)
}

if (errors.length) {
  console.error('README 语言门禁失败：')
  for (const e of errors) console.error('  ✗ ' + e)
  console.error('\n修法：改 scripts/gen-readme.mjs 里对应的 en / zh 模板，再跑 npm run gen:readme。')
  process.exit(1)
}

console.log(`README 语言门禁通过：英文版无成句中文，中文版 ${zhChars} 个汉字。`)
