#!/usr/bin/env node
/**
 * Windows 安装脚本门禁
 *
 * 背景：`build/install.cmd` 曾经是一个手工放进 build/ 的文件。build/ 在
 * .gitignore 里，所以它从未进过仓库，也没有出现在任何发布页上 ——
 * 用户拿到 tianji.exe 之后没有任何安装入口。README 里却写着 build/install.cmd。
 *
 * 另外两个真实故障也由这里守住：
 *   1. 批处理含非 ASCII 字符时，cmd 在 chcp 生效之前按 OEM 代码页解析，
 *      中文会被切成半个字符并当成命令执行，安装直接崩。
 *   2. 必须 CRLF，否则某些 Windows 版本会把续行符 ^ 误解析。
 *
 * 这个门禁检查源文件与构建产物两头，缺一即失败。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SOURCE = path.join(ROOT, 'scripts', 'installer.cmd')
const BUILT = path.join(ROOT, 'build', 'install.cmd')
const errors = []

function checkFile(file, label) {
  if (!fs.existsSync(file)) {
    errors.push(`${label} 不存在：${path.relative(ROOT, file)}`)
    return null
  }
  const buf = fs.readFileSync(file)
  const text = buf.toString('utf8')

  // 1. 纯 ASCII：批处理解析期不能出现多字节字符
  const nonAscii = [...text].filter((c) => c.charCodeAt(0) > 127)
  if (nonAscii.length) {
    errors.push(`${label} 含 ${nonAscii.length} 个非 ASCII 字符（cmd 会按 OEM 代码页误解析）`)
  }

  // 2. 单文件内换行符必须一致且为 CRLF
  const crlf = (text.match(/\r\n/g) ?? []).length
  const lf = (text.match(/(?<!\r)\n/g) ?? []).length
  if (lf > 0) errors.push(`${label} 有 ${lf} 处 LF 换行，必须是 CRLF`)
  if (crlf === 0) errors.push(`${label} 没有任何 CRLF 换行`)

  // 3. 关键行为：必须有跳过 PATH 的开关（否则无法在测试里安全试跑）
  if (!/TIANJI_INSTALL_NO_PATH/.test(text)) {
    errors.push(`${label} 缺少 TIANJI_INSTALL_NO_PATH 开关，测试会改写真实用户环境`)
  }

  // 4. 不能引用 find/reg 这类在本机会解析到 MSYS 的外部命令
  if (/^\s*find\s+\/I/m.test(text)) {
    errors.push(`${label} 使用了 find /I（本机解析到 MSYS find，参数不兼容）`)
  }

  return { chars: text.length, nonAscii: nonAscii.length }
}

const src = checkFile(SOURCE, 'scripts/installer.cmd')

/*
 * build/install.cmd 由 `npm run build:all` 生成，而 CI 只跑 `npm run check`
 * （内含 vite build，不产出 install.cmd）。所以产物缺失不算失败，
 * 但源文件永远必须有 —— 它才是版本库里的真相。
 *
 * 产物存在时必须满足同样的约束：那是用户真正会运行的文件。
 */
let built = null
if (fs.existsSync(BUILT)) {
  built = checkFile(BUILT, 'build/install.cmd')
  if (src && built && src.chars !== built.chars) {
    errors.push(`构建产物与源不一致（源 ${src.chars} 字节，产物 ${built.chars} 字节）—— 重跑 build:all`)
  }
}

if (errors.length) {
  console.error('安装脚本门禁失败：')
  for (const e of errors) console.error('  ✗ ' + e)
  process.exit(1)
}

console.log(
  built
    ? `安装脚本门禁通过：源与构建产物均为纯 ASCII + CRLF，含隔离开关（${src.chars} 字符）。`
    : `安装脚本门禁通过：源文件为纯 ASCII + CRLF（${src.chars} 字符）；构建产物存在时另行校验。`,
)
