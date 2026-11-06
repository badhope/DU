#!/usr/bin/env node
/**
 * 配色对比度门禁
 *
 * 为什么需要它：颜色全在 theme.css 的 token 里，改一个十六进制值不会让任何
 * 测试变红，但可能让小字掉到 3:1 以下 —— 眼睛看不出来，读屏和低视力用户直接读不了。
 * 之前宣纸皮肤的 --ink-3 就是 3.4:1，被大量用在 10–11px 的说明文字上。
 *
 * 检查的是真实会出现的「前景 / 背景」组合，不是所有两两配对：
 * 只对界面上确实叠加的 token 组合断言，避免把不该同屏的色也算进来。
 *
 * 阈值按 WCAG 2.2 AA：
 *   - 正文与 UI 文字 4.5:1
 *   - 大字（>=24px 或 >=18.66px 粗体）3:1
 * 本门禁对小字一律要求 4.5:1，因为同一 token 常常同时用于两种字号。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const THEME = path.join(ROOT, 'src', 'styles', 'theme.css')

const rawCss = fs.readFileSync(THEME, 'utf8')

/**
 * 去掉 @media print 块再解析 token。
 *
 * 打印样式把 --accent 覆盖成 #000 之类的值，那是「把页面变成黑白以便打印」的
 * 一次性替换，不是屏幕配色。不剔掉它，解析器会把黑色当成宣纸的强调色，
 * 于是所有对比度都变成 21:1 的假通过 —— 门禁看起来全绿，实际什么都没测。
 */
const css = rawCss.replace(/@media\s+print\s*\{[\s\S]*?\n\}/g, '')

/** 从某个选择器块里读出 token 值，并解析 var(--x) 引用 */
function readBlock(selector) {
  const pattern = new RegExp(`${selector.replace(/[[\]'=]/g, (m) => `\\${m}`)}\\s*\\{([^}]*)\\}`, 'g')
  const tokens = {}
  let match
  while ((match = pattern.exec(css))) {
    for (const line of match[1].split('\n')) {
      const m = /^\s*(--[\w-]+)\s*:\s*([^;]+);/.exec(line)
      if (m) tokens[m[1]] = m[2].trim()
    }
  }
  return tokens
}

const rootTokens = readBlock(':root')
const inkTokens = readBlock("[data-skin='ink']")
/** 皮肤叠加在 :root 之上，缺省值继承 root */
const paper = { ...rootTokens }
const ink = { ...rootTokens, ...inkTokens }

/** 解析 var(--x) 直到拿到字面色值 */
function resolve(value, table, depth = 0) {
  if (depth > 8) return null
  const ref = /^var\((--[\w-]+)\)$/.exec(value.trim())
  if (!ref) return value.trim()
  const next = table[ref[1]]
  return next ? resolve(next, table, depth + 1) : null
}

function srgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
}

function luminance(hex) {
  const rgb = srgb(hex)
  if (!rgb) return null
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(fg, bg) {
  const a = luminance(fg)
  const b = luminance(bg)
  if (a === null || b === null) return null
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * 界面上真实出现的组合。每一条都对应一个实际用法，
 * 加新 token 时如果不在这里登记，门禁不会替它兜底 —— 所以清单要跟着界面走。
 */
const PAIRS = [
  ['--ink-1', '--bg-0', '正文 / 页面底'],
  ['--ink-1', '--surface-1', '正文 / 卡片底'],
  ['--ink-1', '--bg-1', '正文 / 浅底区块'],
  ['--ink-2', '--surface-1', '次要正文 / 卡片底'],
  ['--ink-2', '--bg-1', '次要正文 / 浅底区块'],
  ['--ink-3', '--surface-1', '说明小字 / 卡片底'],
  ['--ink-3', '--bg-0', '说明小字 / 页面底'],
  ['--ink-3', '--bg-1', '说明小字 / 浅底区块'],
  ['--accent', '--bg-0', '强调文字 / 页面底'],
  ['--accent', '--surface-1', '强调文字 / 卡片底'],
  ['--accent', '--bg-1', '强调文字 / 浅底区块'],
  ['--accent-2', '--bg-0', 'kicker 小字 / 页面底'],
  ['--accent-2', '--surface-1', 'kicker 小字 / 卡片底'],
  ['--tone-good', '--surface-1', '成功语气 / 卡片底'],
  ['--tone-warn', '--surface-1', '警告语气 / 卡片底'],
  ['--tone-bad', '--surface-1', '错误语气 / 卡片底'],
  ['--tone-info', '--surface-1', '信息语气 / 卡片底'],
]

const MIN = 4.5
let failed = 0
const report = []

for (const [skin, table] of [
  ['宣纸 paper', paper],
  ['夜墨 ink', ink],
]) {
  for (const [fgToken, bgToken, usage] of PAIRS) {
    const fg = resolve(table[fgToken] ?? '', table)
    const bg = resolve(table[bgToken] ?? '', table)
    if (!fg || !bg) {
      report.push(`  ✗ ${skin} · ${usage}：token 缺失（${fgToken} / ${bgToken}）`)
      failed++
      continue
    }
    const ratio = contrast(fg, bg)
    if (ratio === null) {
      report.push(`  ✗ ${skin} · ${usage}：无法解析色值 ${fg} / ${bg}`)
      failed++
      continue
    }
    const ok = ratio >= MIN
    if (!ok) failed++
    report.push(`  ${ok ? '✓' : '✗'} ${skin.padEnd(12)} ${usage.padEnd(22)} ${ratio.toFixed(2)}:1`)
  }
}

/*
 * 季节换色会在皮肤之上覆盖 --accent，于是四种节气各有自己的按钮底色。
 * 只测默认 accent 会漏掉整组：实测夜墨四个季节的主按钮全部不达标（最低 2.41）。
 *
 * 两种声明形态都要覆盖：
 *   [data-season='x']                —— 宣纸（默认皮肤，直接覆盖 :root）
 *   [data-skin='ink'][data-season='x'] —— 夜墨（皮肤层再覆盖）
 * 共 8 条，少一条说明某套皮肤的某季节没有定义，会退回默认强调色 —— 那也要能算出来。
 */
const paperSeason = [...css.matchAll(/^\[data-season='(\w+)'\]\s*\{\s*--accent:\s*([^;]+);/gm)]
const inkSeason = [...css.matchAll(/\[data-skin='ink'\]\[data-season='(\w+)'\]\s*\{\s*--accent:\s*([^;]+);/g)]

for (const [skinName, entries, table] of [
  ['宣纸', paperSeason, paper],
  ['夜墨', inkSeason, ink],
]) {
  if (entries.length !== 4) {
    report.push(`  ✗ ${skinName} 季节配色规则应有 4 条，实际 ${entries.length} 条`)
    failed++
  }
  for (const [, season, accent] of entries) {
    const onAccent = resolve(table['--on-accent'] ?? '', table)
    const ratio = contrast(onAccent ?? '', accent.trim())
    const ok = ratio !== null && ratio >= MIN
    if (!ok) failed++
    report.push(
      `  ${ok ? '✓' : '✗'} ${skinName.padEnd(10)} ${`${season} 主按钮`.padEnd(18)} ${(ratio ?? 0).toFixed(2)}:1`,
    )
  }
}

console.log(report.join('\n'))
if (failed) {
  console.error(`\n配色门禁失败：${failed} 组低于 WCAG AA ${MIN}:1。`)
  console.error('改颜色前先看这里 —— 小字对比度不够时，眼睛看不出来但读屏用户读不了。')
  process.exit(1)
}
console.log(
  `\n配色门禁通过：两套皮肤各 ${PAIRS.length} 组正文/语气组合，加 8 组季节主按钮，均 ≥ ${MIN}:1。`,
)
