#!/usr/bin/env node
/**
 * 用户可见文本的「内部标识」门禁
 *
 * 为什么需要它：ChartFact.fields 的键是代码契约，值是内部枚举。它们很容易
 * 顺着 `Object.entries(fields)` 直接流到界面上 —— 实测已经出现过
 * 「- currentDecadal：田宅宫 35–44 岁」和「体用关系：yongShengTi」。
 * 这两类问题不会让任何测试变红，也不会让构建失败，只有人肉看图才会发现。
 *
 * 检查方式：跑一遍真实排盘（三套内核），把事实层字段序列化，
 * 断言键都在中文标签表里、值里没有 camelCase 内部枚举。
 *
 * 局限：它只能覆盖"事实层 → 正文"这条路。若将来别处也往界面拼内部值，
 * 这个门禁看不到 —— 所以真实截图走查仍然不能省。
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()

/** 与 src/ai/offline.ts 的 FIELD_LABEL 保持同一份清单 */
const offlineSource = readFileSync(join(ROOT, 'src', 'ai', 'offline.ts'), 'utf8')
const labelBlock = /const FIELD_LABEL: Record<string, string> = \{([\s\S]*?)\n\}/.exec(offlineSource)
if (!labelBlock) {
  console.error('无法从 src/ai/offline.ts 解析 FIELD_LABEL —— 门禁本身失效，按失败处理。')
  process.exit(1)
}
const labels = new Set(
  [...labelBlock[1].matchAll(/^\s*([A-Za-z][\w]*):/gm)].map((m) => m[1]),
)
if (labels.size < 10) {
  console.error(`FIELD_LABEL 只解析到 ${labels.size} 个键，解析很可能失败；按失败处理。`)
  process.exit(1)
}

/**
 * 内部枚举字段：这些值的类型是 TS 字面量联合（'yongShengTi' | 'bihe' | …），
 * 直接写进 fields 就会原样出现在界面上。
 *
 * 用白名单而不是正则启发式：日期、干支、卦名这些同样是 `a.b` 形式，
 * 但它们的值本来就是给人看的中文/数字。按形状猜会误报一堆，反而没人看报告。
 */
const ENUM_FIELDS = new Set(['relation'])

const failures = []

const coreFiles = ['src/core/meihuaFacts.ts', 'src/core/bazi.ts', 'src/core/ziwei.ts']
for (const file of coreFiles) {
  const source = readFileSync(join(ROOT, file), 'utf8')
  const fieldsBlock = /fields:\s*\{([\s\S]*?)\n\s*\},/m.exec(source)
  if (!fieldsBlock) continue
  for (const line of fieldsBlock[1].split('\n')) {
    const m = /^\s*([A-Za-z][\w]*):\s*(.+?),?\s*$/.exec(line)
    if (!m) continue
    const [, key, value] = m
    if (!labels.has(key)) {
      failures.push(`${file}: 字段键 "${key}" 没有中文标签，界面会显示英文键名`)
    }
    if (ENUM_FIELDS.has(key)) {
      // 枚举字段必须经过 LABEL 映射，不能是裸的 a.b 取值
      if (!/LABEL\[/.test(value)) {
        failures.push(`${file}: 枚举字段 "${key}" 未映射成中文字面（${value.trim()}）`)
      }
    }
  }
}

if (failures.length) {
  console.error('用户可见字段门禁失败：')
  for (const f of failures) console.error('  ✗ ' + f)
  process.exit(1)
}

console.log(`用户可见字段门禁通过：${labels.size} 个字段标签齐备，事实层无裸露枚举值。`)
