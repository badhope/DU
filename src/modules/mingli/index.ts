/**
 * 命理 模块入口
 *
 * SP-2 已搬移: 13 utils (bazi, wuxing, ziwei, astro, jiazu, jiri, ...),
 * 11 pages (wuxing, bazi, hehun, liunian, dayun, ziwei, life, astro,
 * jiazu, jiri, tieban).
 */
import type { ModuleManifest } from '@/config/module-manifest'

export const MODULE_KEY = 'mingli' as const
export const MODULE_NAME = '命理' as const

export const MODULE_MANIFEST: ModuleManifest = {
  key: 'mingli',
  name: '命理',
  icon: '命',
  desc: '八字、五行、紫微、占星等命理推演',
  category: 'mingli',
  pages: [
    'modules/mingli/pages/wuxing',
    'modules/mingli/pages/bazi',
    'modules/mingli/pages/hehun',
    'modules/mingli/pages/liunian',
    'modules/mingli/pages/dayun',
    'modules/mingli/pages/ziwei',
    'modules/mingli/pages/life',
    'modules/mingli/pages/astro',
    'modules/mingli/pages/jiazu',
    'modules/mingli/pages/jiri',
    'modules/mingli/pages/tieban',
  ],
  logicFiles: [
    'bazi',
    'wuxing',
    'ziwei',
    'astro',
    'jiazu',
    'jiri',
    'mingmen',
    'xuankong',
    'tieban',
    'dayun',
    'life',
    'hehun',
    'liunian',
  ],
}
