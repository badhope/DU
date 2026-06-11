/**
 * 占卜 模块入口
 *
 * SP-2 已搬移: 11 logic + 11 pages.
 * SP-4: 添加 ModuleManifest.
 */
import type { ModuleManifest } from '@/config/module-manifest'

export const MODULE_KEY = 'zhanbu' as const
export const MODULE_NAME = '占卜' as const

export const MODULE_MANIFEST: ModuleManifest = {
  key: 'zhanbu',
  name: '占卜',
  icon: '卜',
  desc: '六爻、梅花、塔罗、六壬等占卜问事',
  category: 'zhanbu',
  pages: [
    'modules/zhanbu/pages/qimen',
    'modules/zhanbu/pages/liuren',
    'modules/zhanbu/pages/gua',
    'modules/zhanbu/pages/tarot',
    'modules/zhanbu/pages/meihua',
    'modules/zhanbu/pages/liuyao',
    'modules/zhanbu/pages/xuankong',
    'modules/zhanbu/pages/xiaoliuren',
    'modules/zhanbu/pages/zhuge',
    'modules/zhanbu/pages/maya',
  ],
  logicFiles: [
    'gua',
    'liuren',
    'liuyao',
    'maya',
    'meihua',
    'qimen',
    'tarot',
    'xiaoliuren',
    'xuankong',
    'zhuge',
    'jiegua',
  ],
}
