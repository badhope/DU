/**
 * 命名 模块入口
 *
 * SP-2 已搬移: 5 logic, 4 pages.
 * SP-4: 添加 ModuleManifest.
 */
import type { ModuleManifest } from '@/config/module-manifest'

export const MODULE_KEY = 'mingming' as const
export const MODULE_NAME = '命名' as const

export const MODULE_MANIFEST: ModuleManifest = {
  key: 'mingming',
  name: '命名',
  icon: '名',
  desc: '测字、灵签、数理等命名择吉',
  category: 'mingming',
  pages: [
    'modules/mingming/pages/jiaobei',
    'modules/mingming/pages/lingqian',
    'modules/mingming/pages/shuzhi',
    'modules/mingming/pages/mingji',
  ],
  logicFiles: ['jiaobei', 'kangxi-strokes', 'lingqian', 'mingji', 'shuzhi'],
}
