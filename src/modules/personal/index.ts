/**
 * 个人 模块入口
 *
 * SP-2 已搬移: 7 pages.
 * SP-4: 添加 ModuleManifest.
 */
import type { ModuleManifest } from '@/config/module-manifest'

export const MODULE_KEY = 'personal' as const
export const MODULE_NAME = '个人' as const

export const MODULE_MANIFEST: ModuleManifest = {
  key: 'personal',
  name: '个人',
  icon: '我',
  desc: '个人中心、档案、签到、海报等',
  category: 'personal',
  pages: [
    'modules/personal/pages/index',
    'modules/personal/pages/category',
    'modules/personal/pages/profile',
    'modules/personal/pages/dashboard',
    'modules/personal/pages/checkin',
    'modules/personal/pages/poster',
    'modules/personal/pages/users',
  ],
  logicFiles: [],
}
