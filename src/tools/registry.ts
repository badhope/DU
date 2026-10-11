/**
 * DU v2 · 工具注册表
 *
 * 唯一真相来源。分类、首页列表、路由、README 的工具清单
 * 全部由此生成，杜绝 v1 那种"README 说 49 个、代码只有 43 个"的漂移。
 *
 * accent 一律引用 theme.css 的 token 名，不在这里出现色值。
 */
import type { Category, CategoryId, Tool } from '@/contract/tool'

export const CATEGORIES: Category[] = [
  { id: 'mingli', name: '命', latin: 'FATE', accent: 'var(--cat-mingli)' },
  { id: 'buzhan', name: '卜', latin: 'OMEN', accent: 'var(--cat-buzhan)' },
  { id: 'xiangshu', name: '象', latin: 'FORM', accent: 'var(--cat-xiangshu)' },
  { id: 'shijian', name: '时', latin: 'TIME', accent: 'var(--cat-shijian)' },
  { id: 'yangsheng', name: '养', latin: 'CARE', accent: 'var(--cat-yangsheng)' },
]

import { meihuaTool } from './meihua'

export const TOOLS: Tool[] = [meihuaTool]

export const toolById = (id: string): Tool | undefined => TOOLS.find((t) => t.id === id)

export const toolsByCategory = (id: CategoryId): Tool[] => TOOLS.filter((t) => t.category === id)

export const TOOL_COUNT = TOOLS.length
