/**
 * 观形 模块入口
 *
 * SP-2 已搬移: 4 logic, 3 pages.
 * SP-3: 36 知识条目 + KnowledgeShell 双 tab.
 * SP-4: 添加 ModuleManifest.
 */
import type { ModuleManifest } from '@/config/module-manifest'

export const MODULE_KEY = 'guanxiang' as const
export const MODULE_NAME = '观形' as const

export const MODULE_MANIFEST: ModuleManifest = {
  key: 'guanxiang',
  name: '观形',
  icon: '相',
  desc: '面相、手相、风水等观形识势',
  category: 'guanxiang',
  pages: [
    'modules/guanxiang/pages/mianxiang',
    'modules/guanxiang/pages/shouxiang',
    'modules/guanxiang/pages/fenglui',
  ],
  logicFiles: ['chart-utils', 'fenglui', 'mianxiang', 'shouxiang'],
}
