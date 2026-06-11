/**
 * 健康 模块入口
 *
 * SP-2 已搬移: 4 logic + 1 data, 4 pages + 1 components.
 * SP-4: 添加 ModuleManifest.
 */
import type { ModuleManifest } from '@/config/module-manifest'

export const MODULE_KEY = 'jiankang' as const
export const MODULE_NAME = '健康' as const

export const MODULE_MANIFEST: ModuleManifest = {
  key: 'jiankang',
  name: '健康',
  icon: '健',
  desc: '经络、五运、子午流注等养生指导',
  category: 'jiankang',
  pages: [
    'modules/jiankang/pages/qijing',
    'modules/jiankang/pages/ziwu',
    'modules/jiankang/pages/wufu',
    'modules/jiankang/pages/yangsheng',
  ],
  logicFiles: ['jingluo', 'wufu', 'zhenci'],
}
