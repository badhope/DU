/**
 * 版本号的唯一来源。
 *
 * 之前它散在 cli.ts / mcp.ts / server.ts 三处硬编码，发版时必然漏改一个。
 * 现在只在 package.json,由 scripts/build-all.mjs 通过 esbuild define 注入，
 * 三端读同一个常量。
 */
declare const __TIANJI_VERSION__: string

export const VERSION: string =
  typeof __TIANJI_VERSION__ === 'string' ? __TIANJI_VERSION__ : '0.0.0-dev'
