#!/usr/bin/env node
/**
 * tianji — 命令行入口
 *
 * 设计目标：可脚本化。每条命令默认输出人类可读文本，加 `--json` 输出结构化
 * 结果；退出码遵循 Unix 约定（0 成功 / 1 业务错误 / 2 用法错误），
 * 这样它能直接进 CI、makefile 或 shell 管道，而不只是给人看。
 *
 * 子命令：
 *   ask       同一问题请两位大师各断一遍
 *   masters   列出全部方法卡与状态
 *   ledger    查看应验簿
 *   resolve   回填一条断言
 *   report    导出单次读取或应验簿为 HTML
 *   export    导出完整台账为 JSON
 *   import    导入台账 JSON
 *   serve     启动本地 HTTP 服务
 *   doctor    检查环境与数据完整性
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve as resolvePath } from 'node:path'
import { homedir } from 'node:os'
import { SqliteLedgerStore } from './store'
import { VERSION } from './version'
import { ask, askAndRecord, catalog, describeFacts, renderLedger, renderMatch, sessionView } from '../runtime'
import type { ReadingDomain } from '../contract/reading'


/* ── 参数解析 ─────────────────────────────────────────────── */

interface Parsed {
  command: string
  positional: string[]
  flags: Record<string, string | boolean>
}

function parseArgs(argv: string[]): Parsed {
  const [command = 'help', ...rest] = argv
  const positional: string[] = []
  const flags: Record<string, string | boolean> = {}
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]!
    if (arg.startsWith('--')) {
      const [key, inline] = arg.slice(2).split('=')
      if (inline !== undefined) flags[key!] = inline
      else if (rest[i + 1] && !rest[i + 1]!.startsWith('--')) flags[key!] = rest[++i]!
      else flags[key!] = true
    } else if (arg.startsWith('-') && arg.length === 2) {
      flags[arg.slice(1)] = true
    } else {
      positional.push(arg)
    }
  }
  return { command, positional, flags }
}

/* ── 数据目录 ─────────────────────────────────────────────── */

/**
 * 数据目录优先级：`--data-dir` > `TIANJI_HOME` > 平台默认。
 * 不把数据库放在安装目录里 —— Windows 下 Program Files 是只读的。
 */
function dataDir(flags: Record<string, string | boolean>): string {
  if (typeof flags['data-dir'] === 'string') return resolvePath(flags['data-dir'])
  if (process.env.TIANJI_HOME) return resolvePath(process.env.TIANJI_HOME)
  const base =
    process.platform === 'win32'
      ? join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'Tianji')
      : join(process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'), 'tianji')
  return base
}

function openStore(flags: Record<string, string | boolean>): SqliteLedgerStore {
  const dir = dataDir(flags)
  // 0700：只有当前用户能进。默认 umask 022 会让同机其他用户读到生辰。
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  return new SqliteLedgerStore({ file: join(dir, 'ledger.db') })
}

/* ── 输出 ─────────────────────────────────────────────────── */

const isJson = (flags: Record<string, string | boolean>) => flags.json === true

function out(flags: Record<string, string | boolean>, text: string, data?: unknown): void {
  if (isJson(flags)) {
    if (data !== undefined) console.log(JSON.stringify(data, null, 2))
    return
  }
  console.log(text)
}

function fail(message: string, code = 1): never {
  console.error(`错误：${message}`)
  process.exit(code)
}

/* ── 命令 ─────────────────────────────────────────────────── */

async function cmdAsk(flags: Record<string, string | boolean>, positional: string[]): Promise<void> {
  const question = positional.join(' ').trim() || (typeof flags.question === 'string' ? flags.question : '')
  if (!question) fail('请提供问题，例如：tianji ask "我应该换工作吗？"', 2)

  const domain = (typeof flags.domain === 'string' ? flags.domain : 'general') as ReadingDomain
  const validDomains = ['career', 'love', 'study', 'health', 'wealth', 'family', 'general']
  if (!validDomains.includes(domain)) fail(`领域必须是 ${validDomains.join(' / ')} 之一`, 2)

  const birth =
    typeof flags.birth === 'string'
      ? (() => {
          const [date, time] = flags.birth!.split(' ')
          if (!date || !time) fail('--birth 格式应为 "YYYY-MM-DD HH:mm"', 2)
          return { date, time }
        })()
      : undefined

  const store = openStore(flags)
  try {
    const options = { question, domain, ...(birth ? { birth } : {}) }
    const match = flags['no-save'] ? await ask(options) : await askAndRecord(options, store)

    if (isJson(flags)) {
      out(flags, '', match)
      return
    }

    const revealed = flags.reveal === true
    console.log(`\n  问题：${match.request.question}`)
    console.log(`  编号：${match.id.slice(0, 20)}…\n`)

    // 匿名模式下不输出盘面与依据：八字盘只能来自子平、卦象只能来自梅花，
    // 一方的盘面是另一方的身份标签。与网页端 AnswerCard 的封存规则一致。
    const SEALED: ReadonlySet<string> = new Set(['pan', 'ju'])
    match.answers.forEach((answer, index) => {
      const master = catalog().masters.find((m) => m.id === answer.masterId)
      const label = revealed ? `${master?.name ?? answer.masterId}（${master?.school ?? ''}）` : index === 0 ? '甲' : '乙'
      console.log(`  ── ${label} ${'─'.repeat(Math.max(0, 46 - label.length))}`)
      if (revealed) {
        for (const fact of describeFacts(answer.facts)) console.log(`  ${fact}`)
      }
      let sealed = 0
      for (const section of answer.sections) {
        if (!revealed && SEALED.has(section.key)) { sealed++; continue }
        console.log(`\n  【${section.title}】`)
        for (const line of section.lines) console.log(`    ${line}`)
      }
      if (sealed) console.log(`\n  （盘面事实与依据共 ${sealed} 节已封存）`)
      console.log()
    })

    if (!revealed) {
      console.log('  提示：加 --reveal 可显示大师姓名、盘面与依据；加 --json 获取结构化输出。')
    }
    if (!flags['no-save']) {
      console.log(`  已写入台账：${dataDir(flags)}`)
    }
  } finally {
    store.close()
  }
}

function cmdMasters(flags: Record<string, string | boolean>): void {
  const { masters, active } = catalog()
  if (isJson(flags)) {
    out(flags, '', { masters, active })
    return
  }
  console.log('\n  大师方法卡\n')
  for (const master of masters) {
    const status = master.status === 'active' ? '可测评' : '筹备中'
    console.log(`  ${master.id.padEnd(9)} ${master.name.padEnd(6)} ${master.school.padEnd(12)} ${status}`)
    if (master.status === 'active') console.log(`  ${' '.repeat(9)} 典籍：${master.books.join('、')}`)
  }
  console.log()
}

function cmdLedger(flags: Record<string, string | boolean>): void {
  const store = openStore(flags)
  try {
    const claims = store.listClaims()
    if (isJson(flags)) {
      out(flags, '', claims)
      return
    }
    if (!claims.length) {
      console.log('\n  应验簿为空。先用 `tianji ask` 记录一次读取。\n')
      return
    }
    console.log(`\n  应验簿（${claims.length} 条）\n`)
    for (const claim of claims) {
      const status = claim.status === 'pending' ? '待回填' : claim.status === 'hit' ? '应验' : claim.status === 'miss' ? '未验' : '无法判断'
      const due = new Date(claim.dueAt).toISOString().slice(0, 10)
      console.log(`  [${status}] ${due}  ${claim.text.slice(0, 60)}`)
      console.log(`  ${' '.repeat(10)}id: ${claim.id.slice(-12)}`)
    }
    console.log()
  } finally {
    store.close()
  }
}

function cmdResolve(flags: Record<string, string | boolean>, positional: string[]): void {
  const id = positional[0]
  const status = positional[1]
  if (!id || !status) fail('用法：tianji resolve <claim-id> <hit|miss|unknown>', 2)
  if (!['hit', 'miss', 'unknown'].includes(status)) fail('状态必须是 hit / miss / unknown', 2)

  const store = openStore(flags)
  try {
    const ok = store.resolveClaim(id, status as 'hit' | 'miss' | 'unknown')
    if (!ok) fail('无法回填：记录不存在、已判定，或尚未到期。')
    out(flags, `已记录：${id.slice(-12)} → ${status}`, { ok: true, id, status })
  } finally {
    store.close()
  }
}

async function cmdReport(flags: Record<string, string | boolean>, positional: string[]): Promise<void> {
  const target = positional[0] ?? 'latest'
  const store = openStore(flags)
  try {
    if (target === 'ledger') {
      const html = renderLedger(store.listClaims())
      const file = typeof flags.out === 'string' ? flags.out : join(dataDir(flags), 'claims.html')
      writeFileSync(file, html, 'utf8')
      out(flags, `应验簿报告已写入：${file}`, { file })
      return
    }
    const matches = store.listMatches()
    if (!matches.length) fail('台账里还没有记录，先运行 tianji ask。')
    const match = target === 'latest' ? matches[0]! : matches.find((m) => m.id === target || m.id.endsWith(target))
    if (!match) fail(`找不到记录：${target}`)
    const html = renderMatch(match)
    const file = typeof flags.out === 'string' ? flags.out : join(dataDir(flags), `reading-${match.id.slice(6, 14)}.html`)
    writeFileSync(file, html, 'utf8')
    out(flags, `读取报告已写入：${file}`, { file, matchId: match.id })
  } finally {
    store.close()
  }
}

function cmdExport(flags: Record<string, string | boolean>): void {
  const store = openStore(flags)
  try {
    const payload = {
      schema: 1,
      exportedAt: new Date().toISOString(),
      matches: store.listMatches(),
      claims: store.listClaims(),
    }
    const file = typeof flags.out === 'string' ? flags.out : join(dataDir(flags), 'tianji-export.json')
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8')
    out(flags, `已导出 ${payload.matches.length} 场对局、${payload.claims.length} 条断言 → ${file}`, { file, matches: payload.matches.length, claims: payload.claims.length })
  } finally {
    store.close()
  }
}

function cmdImport(flags: Record<string, string | boolean>, positional: string[]): void {
  const file = positional[0]
  if (!file) fail('用法：tianji import <file.json>', 2)
  if (!existsSync(file)) fail(`文件不存在：${file}`)
  const raw = JSON.parse(readFileSync(file, 'utf8')) as { matches?: unknown[]; claims?: unknown[] }
  const store = openStore(flags)
  try {
    const matches = (raw.matches ?? []) as Parameters<typeof store.saveMatch>[0][]
    const claims = (raw.claims ?? []) as Parameters<typeof store.saveClaims>[0]
    for (const match of matches) store.saveMatch(match)
    store.saveClaims(claims)
    out(flags, `已导入 ${matches.length} 场对局、${claims.length} 条断言`, { matches: matches.length, claims: claims.length })
  } finally {
    store.close()
  }
}

function cmdReset(flags: Record<string, string | boolean>): void {
  if (flags.yes !== true) {
    fail('清空会删除全部对局、断言与生辰记录，不可恢复。确认请加 --yes。', 2)
  }
  const store = openStore(flags)
  try {
    const before = store.listMatches().length
    store.reset()
    out(flags, `已清空 ${before} 场对局与全部断言（含 WAL 截断）。`, { cleared: before })
  } finally {
    store.close()
  }
}

function cmdDoctor(flags: Record<string, string | boolean>): void {
  const dir = dataDir(flags)
  const store = openStore(flags)
  try {
    const view = sessionView(store)
    const checks = [
      { name: 'Node 版本', ok: Number(process.versions.node.split('.')[0]) >= 22, detail: process.version },
      { name: '数据目录可写', ok: existsSync(dir), detail: dir },
      { name: '数据库可读', ok: true, detail: `${view.matches} 场对局 / ${view.claims} 条断言` },
      // 不能写死人数：内核会随版本增加，写死会让升级后 doctor 直接报红
      { name: '大师注册表', ok: catalog().active.length >= 2, detail: `${catalog().active.length} 位可测评` },
    ]
    if (isJson(flags)) {
      out(flags, '', { ok: checks.every((c) => c.ok), checks, version: VERSION })
      return
    }
    console.log(`\n  天机台 v${VERSION} · 环境检查\n`)
    for (const check of checks) console.log(`  ${check.ok ? '✓' : '✗'} ${check.name.padEnd(14)} ${check.detail}`)
    console.log(`\n  ${checks.every((c) => c.ok) ? '全部通过。' : '存在问题，见上方标记。'}\n`)
    if (!checks.every((c) => c.ok)) process.exit(1)
  } finally {
    store.close()
  }
}

function cmdHelp(): void {
  console.log(`
  天机台 · tianji ${VERSION}

  用法：tianji <command> [options]

  命令
    ask [问题]            同一问题请两位大师各断一遍
      --domain <领域>     career|love|study|health|wealth|family|general
      --birth "日期 时间"  1990-06-15 08:30
      --reveal            显示大师姓名（默认匿名）
      --no-save           只看结果，不写入台账
      --json              输出结构化 JSON

    masters               列出全部方法卡与状态
    ledger                查看应验簿
    resolve <id> <状态>   回填断言：hit|miss|unknown
    report [latest|ledger|<id>]  导出 HTML 报告
      --out <路径>
    reset --yes            清空本机台账（不可恢复）
    export                导出完整台账为 JSON
    import <file>         导入台账 JSON
    serve                 启动本地 HTTP 服务
      --port <端口>       默认 7317
    doctor                环境与数据检查

  全局
    --data-dir <路径>     数据库目录（默认：系统用户数据目录下的 Tianji）
    --json               机器可读输出

  示例
    tianji ask "我准备在三个月内换工作，应该先等机会还是主动出击？"
    tianji ask "要不要接这个项目" --domain career --birth "1990-06-15 08:30" --reveal
    tianji ledger --json | jq '.pending'
`)
}

/* ── 入口 ─────────────────────────────────────────────────── */

async function main(): Promise<void> {
  const { command, positional, flags } = parseArgs(process.argv.slice(2))

  switch (command) {
    case 'ask':
      await cmdAsk(flags, positional)
      break
    case 'masters':
      cmdMasters(flags)
      break
    case 'ledger':
      cmdLedger(flags)
      break
    case 'resolve':
      cmdResolve(flags, positional)
      break
    case 'report':
      await cmdReport(flags, positional)
      break
    case 'export':
      cmdExport(flags)
      break
    case 'import':
      cmdImport(flags, positional)
      break
    case 'reset':
      cmdReset(flags)
      break
    case 'doctor':
      cmdDoctor(flags)
      break
    case 'version':
    case '--version':
    case '-v':
      console.log(VERSION)
      break
    case 'serve': {
      const { startServer } = await import('./server')
      const { isSea } = await import('./assets')
      // 静态资源位置：
      //  - SEA 单文件：dist 已作为 assets 嵌进二进制，assets 模块会走 node:sea
      //  - 开发环境：仓库根目录的 dist/
      const staticDir = isSea() ? join(dirname(process.execPath), 'dist') : join(process.cwd(), 'dist')
      const { assetKeys } = await import('./assets')
      const available = assetKeys(staticDir)
      if (available.length === 0) {
        console.error('  警告：没有找到网页资源，只能提供 API。开发环境请先跑 npm run build。')
      } else {
        console.log(`  网页资源：${available.length} 个文件`)
      }
      await startServer({
        port: Number(flags.port ?? 7317),
        dataDir: dataDir(flags),
        staticDir,
      })
      break
    }
    case 'help':
    case '--help':
    case '-h':
      cmdHelp()
      break
    default:
      console.error(`未知命令：${command}`)
      cmdHelp()
      process.exit(2)
  }
}

main().catch((error) => {
  console.error(`错误：${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
