/**
 * 本地报告导出
 *
 * 用户会想把一次阅读或整个应验簿留在手里，而不是依赖这个站点一直在线。
 *
 * 设计约束：
 *  - 纯本地生成，不经过任何服务器；
 *  - 生成的文件自包含（内联样式、无外链、无字体请求），断网也能打开；
 *  - 必须能安全地 embed 用户输入 —— 问题、回答、引文全部来自本机，但仍然是
 *    外部来源（导入的 JSON 可以是别人给的），所以一律转义，不做 innerHTML 拼接。
 */
import type { BlindMatch, Claim } from '@/contract/reading'
import { masterById } from '@/masters/registry'

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const nl2br = (text: string): string => escapeHtml(text).replace(/\r?\n/g, '<br />')

const formatDate = (ms: number): string =>
  new Date(ms).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

const DOMAIN_LABEL: Record<string, string> = {
  career: '前程 / 工作',
  love: '感情 / 关系',
  study: '学业 / 考试',
  health: '身心状态',
  wealth: '钱财 / 交易',
  family: '家人 / 居所',
  general: '整体',
}

const STYLE = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0; padding: 40px 24px 64px;
  background: #f7f4ed; color: #241f1a;
  font-family: "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", serif;
  line-height: 1.8;
}
.wrap { max-width: 780px; margin: 0 auto; }
header { border-bottom: 2px solid #241f1a; padding-bottom: 16px; margin-bottom: 28px; }
.kicker { margin: 0 0 6px; font-size: 11px; letter-spacing: .22em; color: #8a7f6d; }
h1 { margin: 0; font-size: 26px; letter-spacing: .12em; }
.sub { margin: 10px 0 0; font-size: 13px; color: #5a5245; }
.meta { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 12px; font-size: 12px; color: #6b6153; }
.answer { border: 1px solid #d9cfbb; border-radius: 8px; padding: 18px; margin-bottom: 18px; background: #fffdf8; }
.answer-head { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px dashed #d9cfbb; padding-bottom: 8px; margin-bottom: 12px; }
.name { font-size: 15px; font-weight: 700; }
.school { font-size: 11px; color: #8a7f6d; }
/* 边界提示：与页面上的视觉权重一致，不能因为导出就退化成脚注 */
.notice { margin: 0 0 14px; padding: 9px 12px; border-left: 3px solid #a8842a; background: #f7f2e6; color: #3d3628; font-size: 12px; line-height: 1.75; border-radius: 4px; }
section + section { margin-top: 14px; }
h2 { margin: 0 0 6px; font-size: 12px; letter-spacing: .14em; color: #9a5b3f; font-weight: 600; }
p { margin: 0 0 5px; font-size: 13.5px; }
blockquote { margin: 4px 0; padding: 6px 10px; border-left: 3px solid #c9a227; background: #f5efe2; font-size: 12.5px; color: #4a4235; }
.cite { font-size: 11.5px; color: #6b6153; }
.badge { display: inline-block; padding: 1px 7px; border-radius: 999px; border: 1px solid currentColor; font-size: 10px; margin-left: 6px; }
.ok { color: #2f7a45; }
.warn { color: #a8761a; }
.claims { border-top: 1px dashed #d9cfbb; margin-top: 14px; padding-top: 10px; }
.claim { font-size: 12px; color: #4a4235; }
footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #d9cfbb; font-size: 11px; color: #8a7f6d; line-height: 1.9; }
@media print { body { background: #fff; padding: 0; } .answer { break-inside: avoid; } }
`

/** 单次盲测报告：两份回答 + 引用 + 断言 */
export function renderMatchReport(match: BlindMatch): string {
  const answers = match.answers
    .map((answer, index) => {
      const master = masterById(answer.masterId)
      const label = master?.name ?? answer.masterId
      const school = master?.school ?? ''
      const sections = answer.sections
        .map(
          (section) => `<section><h2>${escapeHtml(section.title)}</h2>${section.lines
            .map((line) =>
              line.startsWith('>')
                ? `<blockquote>${escapeHtml(line.replace(/^>\s*/, ''))}</blockquote>`
                : `<p>${nl2br(line)}</p>`,
            )
            .join('')}</section>`,
        )
        .join('')
      const citations = answer.citations.length
        ? `<section><h2>引用状态</h2>${answer.citations
            .map(
              (citation) =>
                `<p class="cite">《${escapeHtml(citation.book)}》${escapeHtml(citation.loc ?? '')}：${escapeHtml(citation.text)}` +
                `<span class="badge ${citation.verification === 'verified' ? 'ok' : 'warn'}">${citation.verification === 'verified' ? '已核' : '未核'}</span></p>`,
            )
            .join('')}</section>`
        : ''
      const claims = answer.claims.length
        ? `<div class="claims"><h2>可验断言</h2>${answer.claims
            .map((claim) => `<p class="claim">${escapeHtml(claim.text)} · 截止 ${formatDate(claim.dueAt).slice(0, 10)}</p>`)
            .join('')}</div>`
        : ''
      /*
       * 边界提示必须进导出文件。
       * 导出的 HTML 是用来归档和转发的 —— 如果原页面说了"这不构成医疗判断"，
       * 归档版本却没有，那这段话离开原页面就变成了纯断语。
       */
      const notice = answer.notice ? `<p class="notice">${nl2br(answer.notice)}</p>` : ''
      return `<article class="answer">
  <div class="answer-head"><span class="name">${escapeHtml(label)}</span><span class="school">${escapeHtml(school)}${index === 0 ? ' · 甲' : ' · 乙'}</span></div>
  ${notice}
  ${sections}
  ${citations}
  ${claims}
</article>`
    })
    .join('')

  const voteText = match.vote === 'a' ? '甲更贴' : match.vote === 'b' ? '乙更贴' : match.vote === 'draw' ? '都不确定' : '未投票'

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>天机台 · 读取报告</title>
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
<header>
  <p class="kicker">TIANJI / READING REPORT</p>
  <h1>天机台 · 读取报告</h1>
  <p class="sub">${escapeHtml(match.request.question)}</p>
  <div class="meta">
    <span>领域：${escapeHtml(DOMAIN_LABEL[match.request.domain] ?? match.request.domain)}</span>
    <span>提问时间：${formatDate(match.request.askedAt)}</span>
    <span>本机投票：${escapeHtml(voteText)}</span>
    <span>记录编号：${escapeHtml(match.id.slice(0, 18))}…</span>
  </div>
</header>
${answers}
<footer>
  <p>本报告由天机台在浏览器本地生成，未经过任何服务器。文件内可能包含问题、生辰与回答，请自行保管。</p>
  <p>榜单与应验记录均为本机样本，不构成科学证明，也不代表任何全局准确率。本站不提供医疗、法律或投资建议。</p>
</footer>
</div>
</body>
</html>`
}

/** 应验簿报告：全部断言与回填结果 */
export function renderLedgerReport(claims: Claim[]): string {
  const sorted = [...claims].sort((a, b) => a.dueAt - b.dueAt)
  const rows = sorted
    .map((claim) => {
      const master = masterById(claim.masterId)?.name ?? claim.masterId
      const status = claim.status === 'pending' ? '待回填' : claim.status === 'hit' ? '应验' : claim.status === 'miss' ? '未验' : '无法判断'
      const tone = claim.status === 'hit' ? 'ok' : claim.status === 'miss' ? 'warn' : ''
      return `<article class="answer">
  <div class="answer-head"><span class="name">${escapeHtml(master)}</span><span class="badge ${tone}">${status}</span></div>
  <p>${escapeHtml(claim.text)}</p>
  <p class="cite">截止 ${formatDate(claim.dueAt).slice(0, 10)} · 建立于 ${formatDate(claim.createdAt).slice(0, 10)}</p>
</article>`
    })
    .join('')

  const pending = sorted.filter((claim) => claim.status === 'pending').length
  const resolved = sorted.filter((claim) => claim.status === 'hit' || claim.status === 'miss').length
  const hit = sorted.filter((claim) => claim.status === 'hit').length

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>天机台 · 应验簿</title>
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
<header>
  <p class="kicker">TIANJI / CLAIM LEDGER</p>
  <h1>天机台 · 应验簿</h1>
  <p class="sub">共 ${sorted.length} 条断言 · 待回填 ${pending} · 已判定 ${resolved}${resolved ? ` · 其中应验 ${hit}` : ''}</p>
</header>
${rows || '<p>目前没有任何断言记录。</p>'}
<footer>
  <p>应验率只统计你主动回填为"应验/未验"的条目，"无法判断"不进入分母。</p>
  <p>本文件由天机台在浏览器本地生成，未经过任何服务器，请自行保管。</p>
</footer>
</div>
</body>
</html>`
}

/** 触发浏览器下载；纯前端，不经过网络 */
export function downloadHtml(filename: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.click()
  URL.revokeObjectURL(url)
}
