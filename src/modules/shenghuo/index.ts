/**
 * 生活 模块入口
 *
 * SP-2 已搬移: 3 logic, 2 pages.
 * SP-4: 添加 ModuleManifest.
 */
import type { ModuleManifest } from '@/config/module-manifest'

export const MODULE_KEY = 'shenghuo' as const
export const MODULE_NAME = '生活' as const

export const MODULE_MANIFEST: ModuleManifest = {
  key: 'shenghuo',
  name: '生活',
  icon: '活',
  desc: '黄历、节气、运势等日常生活参考',
  category: 'shenghuo',
  pages: ['modules/shenghuo/pages/huangli', 'modules/shenghuo/pages/yunshi'],
  logicFiles: ['huangli', 'jieqi', 'yunshi'],
}
