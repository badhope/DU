/**
 * 修心 模块入口
 *
 * SP-2 已搬移: 3 pages.
 * SP-4: 添加 ModuleManifest.
 */
import type { ModuleManifest } from '@/config/module-manifest'

export const MODULE_KEY = 'xiuxin' as const
export const MODULE_NAME = '修心' as const

export const MODULE_MANIFEST: ModuleManifest = {
  key: 'xiuxin',
  name: '修心',
  icon: '心',
  desc: '占星、围棋、时间冥想等修心养性',
  category: 'xiuxin',
  pages: [
    'modules/xiuxin/pages/zhan',
    'modules/xiuxin/pages/fangqi',
    'modules/xiuxin/pages/shijian',
  ],
  logicFiles: [],
}
