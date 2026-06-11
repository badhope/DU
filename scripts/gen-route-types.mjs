#!/usr/bin/env node
/**
 * 玄枢 MISTVERSE · 路由类型生成器
 *
 * 读取 src/pages.json，生成 src/config/route-types.ts，
 * 包含 RoutePath 联合类型和 RouteConfig 映射。
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PAGES_JSON = join(ROOT, 'src', 'pages.json')
const OUTPUT = join(ROOT, 'src', 'config', 'route-types.ts')

function main() {
  const raw = JSON.parse(readFileSync(PAGES_JSON, 'utf8'))
  const pages = raw.pages || []
  const subPackages = raw.subPackages || []

  /** @type {Array<{path: string, title: string}>} */
  const routes = []

  for (const p of pages) {
    routes.push({
      path: '/' + p.path,
      title: (p.style && p.style.navigationBarTitleText) || '',
    })
  }

  for (const sub of subPackages) {
    for (const p of sub.pages) {
      routes.push({
        path: '/' + sub.root + '/' + p.path,
        title: (p.style && p.style.navigationBarTitleText) || '',
      })
    }
  }

  const pathUnion = routes.map((r) => `  | '${r.path}'`).join('\n')
  const configEntries = routes
    .map((r) => `  '${r.path}': { title: '${r.title}' }`)
    .join(',\n')

  const output = `/**
 * 玄枢 MISTVERSE · 路由类型（自动生成）
 *
 * 由 scripts/gen-route-types.mjs 从 pages.json 生成。
 * 请勿手动修改 — 重新运行脚本即可更新。
 *
 * 生成时间: ${new Date().toISOString()}
 */

export type RoutePath =
${pathUnion}

export interface RouteMeta {
  title: string
}

export const ROUTE_META: Record<RoutePath, RouteMeta> = {
${configEntries},
}
`

  writeFileSync(OUTPUT, output, 'utf8')
  console.log(`✅ 生成 ${routes.length} 条路由类型 → ${OUTPUT}`)
}

main()
