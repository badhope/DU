/**
 * 玄枢 MISTVERSE · fix-strict.mjs 测试
 */

import { describe, it, expect } from 'vitest'
import { fixPatterns } from '../../scripts/fix-strict.mjs'

describe('fixPatterns', () => {
  it('模式 A: arr[i].x 链式访问加可选链', () => {
    expect(fixPatterns('const name = arr[i].name')).toBe('const name = arr[i]?.name')
  })

  it('模式 A: 不修改已有 ?. 链', () => {
    expect(fixPatterns('const name = arr[i]?.name')).toBe('const name = arr[i]?.name')
  })

  it('模式 B: const x: T = arr[i] 加 as T', () => {
    expect(fixPatterns('const x: number = arr[0]')).toBe('const x: number = arr[0] as number')
  })

  it('不动: 已经有 ! 的', () => {
    expect(fixPatterns('const x = arr[0]!')).toBe('const x = arr[0]!')
  })

  it('不动: 已经有 as 的', () => {
    expect(fixPatterns('const x = arr[0] as number')).toBe('const x = arr[0] as number')
  })

  it('不动: 普通代码行', () => {
    expect(fixPatterns('const x = 42')).toBe('const x = 42')
  })
})
