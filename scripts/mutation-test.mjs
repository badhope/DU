#!/usr/bin/env node
/**
 * 变异测试（mutation testing）
 *
 * 常规测试只能证明"代码按预期跑"，不能证明"测试能发现问题"。
 * 这个脚本故意把源码改坏，然后跑测试：
 *   - 测试失败 → 说明它真的在守护这段逻辑（杀死了变异）
 *   - 测试仍然通过 → 说明这个测试是摆设（存活变异）
 *
 * 为什么自己写而不引入 Stryker：本项目只有 190 个断言、19 个文件，
 * 引入完整变异框架要几百 MB 依赖和几分钟启动；这里只需要十几个关键变异点，
 * 用一个脚本 + 现有 vitest 就够，且能精确控制"改哪一行"。
 *
 * 用法：
 *   node scripts/mutation-test.mjs           # 跑全部变异
 *   node scripts/mutation-test.mjs --quick   # 只跑前 5 个
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const QUICK = process.argv.includes('--quick')

/**
 * 变异表。
 *
 * 每条 = 一个"如果这里写错了，测试应该发现"的关键点。
 * 挑选标准：只挑业务上真的重要的逻辑，不挑格式化的边角 ——
 * 变异测试的价值在于覆盖"错了会出人命/会骗人"的地方。
 */
const MUTANTS = [
  {
    name: '危机网关失效（自杀输入不再阻断）',
    file: 'src/core/safety.ts',
    find: "  { level: 'crisis', words: CRISIS, message: CRISIS_MESSAGE },",
    replace: '',
    expectFail: ['tests/safety.spec.ts'],
  },
  {
    name: '危机词表清空',
    file: 'src/core/safety.ts',
    // 必须整段替换成空数组，只加前缀不会破坏原有词
    find: "'自杀', '轻生', '不想活', '活不下去', '结束生命', '了断自己', '想死', '去死', '要死了', '死了算了',",
    replace: '',
    expectFail: ['tests/safety.spec.ts'],
  },
  {
    name: '断言期限改回一年',
    file: 'src/ai/offline.ts',
    find: 'due.setDate(due.getDate() + CLAIM_DAYS)',
    replace: 'due.setDate(due.getDate() + 365)',
    expectFail: ['tests/blind.spec.ts'],
  },
  {
    name: 'Wilson 下界不设样本门槛',
    file: 'src/arena/rating.ts',
    find: 'wilsonLower: item.matches >= minimumSamples && decisive ? wilsonLower(item.wins, decisive) : null,',
    replace: 'wilsonLower: decisive ? wilsonLower(item.wins, decisive) : null,',
    expectFail: ['tests/rating.spec.ts'],
  },
  {
    name: '跨答案断语互斥失效',
    file: 'src/api/../arena/readingFlow.ts',
    find: 'const seen = [...new Set([...usedStatements, ...(options.seen ?? [])])]',
    replace: 'const seen: string[] = []',
    expectFail: ['tests/blind.spec.ts'],
  },
  {
    name: '紫微时辰映射错位（23 点当成 0 点）',
    file: 'src/core/ziwei.ts',
    find: 'if (hour === 23) return 12',
    replace: 'if (hour === 23) return 0',
    expectFail: ['tests/ziwei.spec.ts'],
  },
  {
    name: '梅花取卦忽略时辰',
    file: 'src/core/meihuaFacts.ts',
    find: 'castByTime(yearZhi, month, day, hourZhi)',
    replace: 'castByTime(yearZhi, month, day, 1)',
    expectFail: ['tests/meihua.spec.ts'],
  },
  {
    name: '持久化白名单丢掉 ziwei',
    file: 'src/arena/store.ts',
    find: "const FACT_KINDS = ['bazi', 'meihua', 'ziwei'] as const",
    replace: "const FACT_KINDS = ['bazi', 'meihua'] as const",
    expectFail: ['tests/arena.spec.ts'],
  },
  {
    name: '匿名脱敏不再剥离 masterId',
    file: 'src/node/server.ts',
    find: 'masterIds: match.masterIds.map(() => \'sealed\' as const),',
    replace: 'masterIds: match.masterIds,',
    expectFail: ['tests/api.spec.ts'],
  },
  {
    name: '域名来源校验失效',
    file: 'src/node/server.ts',
    find: "const isLoopback = hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '[::1]'",
    replace: 'const isLoopback = true',
    expectFail: ['tests/api.spec.ts'],
  },
  {
    // 把"未来版本"的判断改成接受，让 v99 被当作合法数据。
    // 这条守护的是"不猜未知结构"，猜错会静默损坏用户数据。
    name: '导入迁移接受未来版本',
    file: 'src/arena/store.ts',
    find: 'if (from > SCHEMA_VERSION) return null',
    replace: 'if (from > SCHEMA_VERSION) return { state: raw, from }',
    expectFail: ['tests/arena.spec.ts'],
  },
  {
    // 关掉 flow 层的危机网关（UI 层还有一道，所以必须用 API 测试验证）
    name: 'Flow 层危机网关失效',
    file: 'src/arena/readingFlow.ts',
    find: 'if (isBlocking(verdict)) throw new SafetyBlockError',
    replace: 'if (false && isBlocking(verdict)) throw new SafetyBlockError',
    expectFail: ['tests/api.spec.ts'],
  },
  {
    // 把一条引文篡改一个字，verify-quotes 门禁必须报警。
    // 这条守护的是"引文可逐字核对"这个核心承诺。
    name: '引文被篡改（伪造出处）',
    file: 'src/engine/statements.library.ts',
    find: "quote: '祿逢沖破，吉處藏凶'",
    replace: "quote: '祿逢沖破，吉處藏吉'",
    expectFail: [],
    custom: 'verify-quotes',
  },
]

const results = []

function runTest(files) {
  try {
    execFileSync(process.execPath, [join(ROOT, 'node_modules', 'vitest', 'vitest.mjs'), 'run', ...files], {
      cwd: ROOT,
      stdio: 'pipe',
      timeout: 180_000,
    })
    return true // 通过
  } catch {
    return false // 失败
  }
}

/** 跑引文校验门禁；返回 true 表示通过（即变异未被发现） */
function runVerifyQuotes() {
  try {
    execFileSync(process.execPath, [join(ROOT, 'scripts', 'verify-quotes.mjs')], {
      cwd: ROOT,
      stdio: 'pipe',
      timeout: 60_000,
    })
    return true
  } catch {
    return false
  }
}

const selected = QUICK ? MUTANTS.slice(0, 5) : MUTANTS
console.log(`\n变异测试：${selected.length} 个变异点\n`)

for (const mutant of selected) {
  const filePath = join(ROOT, mutant.file)
  const original = readFileSync(filePath, 'utf8')

  if (!original.includes(mutant.find)) {
    console.log(`  ??  ${mutant.name}`)
    console.log(`      找不到目标代码，变异未应用（源文件可能已改动）\n`)
    results.push({ ...mutant, status: 'not-applied' })
    continue
  }

  const mutated = original.replace(mutant.find, mutant.replace)
  if (mutated === original) {
    console.log(`  ??  ${mutant.name}
      变异未改变内容，跳过
`)
    results.push({ ...mutant, status: 'not-applied' })
    continue
  }
  writeFileSync(filePath, mutated)
  let passed
  try {
    // custom 类型的变异跑独立脚本（如 verify-quotes），而不是 vitest
    passed = mutant.custom === 'verify-quotes' ? runVerifyQuotes() : runTest(mutant.expectFail)
  } finally {
    writeFileSync(filePath, original) // 无论结果如何都还原
  }

  const killed = !passed
  console.log(`  ${killed ? '✓' : '✗'}  ${mutant.name}`)
  console.log(`      ${killed ? '测试捕获了这个错误' : '测试没有发现这个错误 —— 覆盖缺口'}\n`)
  results.push({ ...mutant, status: killed ? 'killed' : 'survived' })
}

const killed = results.filter((r) => r.status === 'killed').length
const survived = results.filter((r) => r.status === 'survived')
const notApplied = results.filter((r) => r.status === 'not-applied').length

console.log('─'.repeat(60))
console.log(`杀死 ${killed}/${results.length - notApplied} 个变异`)

if (survived.length) {
  console.error('\n存活的变异（测试覆盖缺口）：')
  for (const mutant of survived) console.error(`  - ${mutant.name}（${mutant.file}）`)
  process.exit(1)
}
if (notApplied) {
  console.error(`\n${notApplied} 个变异未能应用，请检查目标代码是否已重构。`)
  process.exit(1)
}
console.log('全部变异被测试捕获。\n')
