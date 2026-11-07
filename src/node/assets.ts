/**
 * 内嵌网页资源
 *
 * SEA 构建时把 `dist/` 里的文件作为 assets 写进二进制，运行时用 `node:sea`
 * 的 `getAsset` 按路径取出。这样 `tianji.exe serve` 不需要旁边放一个 dist 目录
 * 就能直接打开网页 —— 单文件安装包的关键一环。
 *
 * 非 SEA 环境（`node build/cli.mjs`）回落到磁盘上的 dist/，开发时不必每次打包。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative, resolve } from 'node:path'

interface SeaModule {
  isSea?: () => boolean
  getAsset?: (key: string, encoding?: 'utf8' | 'binary') => string | ArrayBuffer
  getAssetKeys?: () => string[]
}

/**
 * node:sea 只在 SEA 二进制里可用；普通 Node 里 require 会抛。
 * 用 createRequire + try 同步加载，避免顶层 await —— SEA 的入口要打成 CJS，
 * 而 CJS 不支持顶层 await。
 */
function loadSea(): SeaModule | null {
  try {
    // SEA 入口是 CJS 且 __filename === process.execPath；
    // 优先用 globalThis.require（SEA 运行时提供），否则退回 createRequire。
    const req =
      typeof (globalThis as { require?: NodeRequire }).require === 'function'
        ? ((globalThis as { require: NodeRequire }).require as NodeRequire)
        : createRequire(process.execPath)
    return req('node:sea') as SeaModule
  } catch {
    return null
  }
}

const sea = loadSea()

export const isSea = (): boolean => {
  try {
    return sea?.isSea?.() === true
  } catch {
    return false
  }
}

/** 资源键统一用 posix 相对路径，避免 Windows 反斜杠进了 SEA 的 key 表 */
const normalizeKey = (path: string): string => path.replace(/\\/g, '/').replace(/^\/+/, '')

/** 开发/非 SEA：把 dist 里的文件列成 key → 绝对路径 */
function diskIndex(distDir: string): Map<string, string> {
  const index = new Map<string, string>()
  if (!existsSync(distDir)) return index
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile()) index.set(normalizeKey(relative(distDir, full)), full)
    }
  }
  walk(distDir)
  return index
}

let cache: Map<string, Buffer> | null = null

/**
 * 读取内嵌资源。
 *
 * SEA 里所有 assets 在构建期一次性写入，这里首次访问时全量载入内存并缓存：
 * 站点总共约 6 MB，比每次解压/拷贝便宜，也比 keep-alive 文件句柄简单。
 */
export function readAsset(requestPath: string, distDir: string): Buffer | null {
  const key = normalizeKey(requestPath)

  if (isSea() && sea?.getAsset) {
    if (!cache) {
      cache = new Map()
      const keys = typeof sea.getAssetKeys === 'function' ? sea.getAssetKeys() : []
      for (const assetKey of keys) {
        // node:sea 的 getAsset 只接受 'utf8' 或省略编码（返回 ArrayBuffer）。
        // 传 'binary' 会抛 The "binary" encoding is not supported —— 必须省略第二参。
        try {
          const value = sea.getAsset(assetKey)
          cache.set(normalizeKey(assetKey), Buffer.isBuffer(value) ? value : Buffer.from(value as ArrayBuffer))
        } catch {
          // 单个资源读取失败不应拖垮整个站点
        }
      }
    }
    return cache.get(key) ?? null
  }

  const full = resolve(distDir, key)
  if (!full.startsWith(resolve(distDir))) return null
  if (!existsSync(full) || !statSync(full).isFile()) return null
  return readFileSync(full)
}

/** 列出全部资源键（SEA 下用于生成路由回退判断） */
export function assetKeys(distDir: string): string[] {
  if (isSea() && sea?.getAsset && typeof (sea as { getAssetKeys?: () => string[] }).getAssetKeys === 'function') {
    return (sea as { getAssetKeys: () => string[] }).getAssetKeys().map(normalizeKey)
  }
  return [...diskIndex(distDir).keys()]
}


/**
 * 给 data/corpus 注入的读取器。
 *
 * 读取顺序：内嵌资源（exe / SEA）→ dist → public → ../public。
 * 返回 null 表示这份文件不在这里，由调用方决定报错还是继续。
 *
 * 为什么不放在 data/corpus 里直接 import：那会让浏览器构建打包 node:fs，
 * 直接构建失败。职责归宿主，data 层只接收函数。
 */
export async function corpusReaderFrom(distDir: string): Promise<(rel: string) => Promise<string | null>> {
  const { readFile } = await import('node:fs/promises')
  const { join } = await import('node:path')

  return async (rel: string) => {
    const embedded = readAsset(rel, distDir)
    if (embedded) return embedded.toString('utf8')

    const roots = [distDir, 'dist', 'public', join('..', 'public')].filter(Boolean)
    for (const root of roots) {
      try {
        return await readFile(join(root, rel), 'utf8')
      } catch {
        /* 换下一个根 */
      }
    }
    return null
  }
}
