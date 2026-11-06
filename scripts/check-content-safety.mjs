#!/usr/bin/env node
/**
 * 内容安全门禁
 *
 * 审计发现的问题不是「写错一句」而是一整类：断语里出现躯体断言
 * （"你的颈椎垮了"）、医疗归因（"你不是失眠，是…"）、投资结论（"先别做"）。
 * 靠人工复查不可持续 —— 175 条断语，每次新增都可能再犯。
 *
 * 这个门禁把三类禁令变成可执行规则：
 *   1. 躯体/疾病断言：不得宣称用户身体已经出问题或将会出问题；
 *   2. 医疗指令：不得出现停药、剂量、诊断结论；
 *   3. 投资结论：不得直接给"该不该买/卖/做"的判断。
 *
 * 它不判断文案好坏，只拦明显越界的表述。误报可通过 allowlist 逐条豁免，
 * 每条例外都要写理由。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const LIBRARY = path.join(ROOT, 'src', 'engine', 'statements.library.ts')

/** 禁令：(正则, 为什么禁, 修法提示) */
const RULES = [
  {
    // 跨度放宽到 12 字：中文句子常把主语和结论隔得很远
    // （"你的颈椎比你的计划表先一步垮了"中间有 9 个字）
    pattern: /(颈椎|腰椎|脊椎|胃|肝|肾|心脏|血压|血糖)[^。！？]{0,12}(垮|坏|废|出问题|不行了)/,
    why: '躯体断言：宣称用户某个器官已经出问题，属于医学结论',
    fix: '改成可自我观察的行为描述（如"你坐着的时长…"）',
  },
  {
    pattern: /你不是(失眠|抑郁|焦虑|生病|有病)/,
    why: '否定症状：把真实症状归因成性格或态度问题',
    fix: '描述现象而不下诊断（如"躺下之后脑子里还在开会"）',
  },
  {
    pattern: /(停药|断药|加量|减量|换药|剂量)/,
    why: '医疗指令：用药调整必须由医师决定',
    fix: '改为"请就医"或直接删除该 action',
  },
  {
    pattern: /(确诊|治愈|包治|药到病除)/,
    why: '医疗承诺：暗示能够诊断或治愈',
    fix: '删除，或改为就医建议',
  },
  {
    pattern: /(先别做|别买|别卖|赶紧买|赶紧卖|该抄底|该清仓)/,
    why: '投资结论：直接给出买卖决策，属于投资建议',
    fix: '只给核算方法，不给结论',
  },
  {
    pattern: /(借钱|杠杆)[^。]{0,8}(一定|必然|稳)/,
    why: '风险承诺：对借贷或杠杆给出确定性判断',
    fix: '删除确定性表述',
  },
  {
    /*
     * 中文断句里夹英文单词。实测出现过「你 sensed 的那个拐点」——
     * 这不是安全边界问题，是文案事故：用户读到会以为页面没写完。
     * 只拦"汉字 + 空格 + 小写英文单词"这种典型混写，不拦正常的外文专名。
     */
    pattern: /[\u4e00-\u9fff]\s+[a-z]{3,}\s+[\u4e00-\u9fff]/,
    why: '中英混写：中文断语里夹了英文单词',
    fix: '换成中文表达（sensed → 察觉到）',
  },
]

/** 逐条豁免：id → 理由。新增条目必须写清楚为什么它不是越界。 */
const ALLOW = new Map([
  // 目前没有豁免。若确需新增，格式：['statement-id', '理由']
])

const source = fs.readFileSync(LIBRARY, 'utf8')
const lines = source.split(/\r?\n/)

/** 找出每个 statement 的起始行与 id，便于把命中定位到具体条目 */
const blocks = []
let current = null
lines.forEach((line, index) => {
  const idMatch = /^\s*id:\s*'([^']+)'/.exec(line)
  if (idMatch) {
    if (current) blocks.push(current)
    current = { id: idMatch[1], start: index, lines: [] }
  }
  current?.lines.push(line)
})
if (current) blocks.push(current)

const findings = []
for (const block of blocks) {
  if (ALLOW.has(block.id)) continue
  const text = block.lines.join('\n')
  // 注释行不参与检测：那里会写"原句是错的"之类说明
  const content = block.lines.filter((line) => !line.trim().startsWith('//')).join('\n')
  for (const rule of RULES) {
    if (rule.pattern.test(content)) {
      findings.push({ id: block.id, line: block.start + 1, ...rule })
    }
  }
}

if (findings.length) {
  console.error('内容安全门禁失败：断语里出现了越界表述。')
  for (const finding of findings) {
    console.error(`- ${finding.id}（第 ${finding.line} 行）：${finding.why}`)
    console.error(`  修法：${finding.fix}`)
  }
  console.error('\n如确属误报，在 scripts/check-content-safety.mjs 的 ALLOW 里加一条并写明理由。')
  process.exit(1)
}

console.log(`内容安全门禁通过：${blocks.length} 条断语，未发现躯体断言、医疗指令或投资结论。`)
