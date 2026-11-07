/**
 * 测试环境初始化。
 *
 * 为什么需要：`data/corpus` 采用"宿主注入读取器"的设计（浏览器走 fetch，
 * CLI/MCP 走文件系统）。测试既不是浏览器也没有宿主入口，不注入的话
 * 所有检索都会失败 —— 这会让测试环境的行为和生产环境不一致，
 * 而"测试里检索不到、线上能检索到"正是最难发现的那类缺陷。
 *
 * 这里用与 CLI 相同的读取逻辑：优先内嵌资源，其次 dist / public。
 */
import { setCorpusReader } from '@/data/corpus'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

setCorpusReader(async (rel: string) => {
  const roots = [join(process.cwd(), 'dist'), join(process.cwd(), 'public')]
  for (const root of roots) {
    try {
      return await readFile(join(root, rel), 'utf8')
    } catch {
      /* 换下一个根目录 */
    }
  }
  return null
})
