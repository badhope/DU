/**
 * 玄枢 MISTVERSE · Module Manifest 测试
 *
 * 验证 8 个模块的 MODULE_MANIFEST 结构完整性。
 */

import { describe, it, expect } from 'vitest'
import { MODULE_MANIFEST as mingli } from '@/modules/mingli'
import { MODULE_MANIFEST as zhanbu } from '@/modules/zhanbu'
import { MODULE_MANIFEST as guanxiang } from '@/modules/guanxiang'
import { MODULE_MANIFEST as mingming } from '@/modules/mingming'
import { MODULE_MANIFEST as jiankang } from '@/modules/jiankang'
import { MODULE_MANIFEST as xiuxin } from '@/modules/xiuxin'
import { MODULE_MANIFEST as shenghuo } from '@/modules/shenghuo'
import { MODULE_MANIFEST as personal } from '@/modules/personal'
import type { ModuleManifest } from '@/config/module-manifest'

const ALL_MANIFESTS: ModuleManifest[] = [
  mingli, zhanbu, guanxiang, mingming,
  jiankang, xiuxin, shenghuo, personal,
]

const REQUIRED_KEYS = [
  'mingli', 'zhanbu', 'guanxiang', 'mingming',
  'jiankang', 'xiuxin', 'shenghuo', 'personal',
]

describe('Module Manifest', () => {
  it('8 个模块均有 MODULE_MANIFEST', () => {
    const keys = ALL_MANIFESTS.map((m) => m.key)
    for (const k of REQUIRED_KEYS) {
      expect(keys).toContain(k)
    }
    expect(ALL_MANIFESTS).toHaveLength(8)
  })

  it('每个 manifest 结构完整（key/name/icon/desc/category/pages/logicFiles）', () => {
    for (const m of ALL_MANIFESTS) {
      expect(m.key).toBeTruthy()
      expect(m.name).toBeTruthy()
      expect(m.icon).toBeTruthy()
      expect(m.desc).toBeTruthy()
      expect(m.category).toBeTruthy()
      expect(Array.isArray(m.pages)).toBe(true)
      expect(Array.isArray(m.logicFiles)).toBe(true)
    }
  })

  it('key 与目录名一致且唯一', () => {
    const keys = ALL_MANIFESTS.map((m) => m.key)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
    for (const k of keys) {
      expect(REQUIRED_KEYS).toContain(k)
    }
  })

  it('pages 路径均以 modules/<key>/pages 开头', () => {
    for (const m of ALL_MANIFESTS) {
      for (const p of m.pages) {
        expect(p).toMatch(new RegExp(`^modules/${m.key}/pages/`))
      }
    }
  })
})
