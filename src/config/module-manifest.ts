/**
 * 玄枢 MISTVERSE · 模块清单类型
 *
 * 每个 module 的 index.ts 导出此接口的常量，
 * 供路由守卫 / 首页分类 / 工具注册等统一消费。
 */

export interface ModuleManifest {
  /** 模块 key（与目录名一致） */
  key: string
  /** 模块中文名 */
  name: string
  /** 模块图标（emoji 或 icon class） */
  icon: string
  /** 模块描述 */
  desc: string
  /** 所属分类（与 config/tools.ts category 一致） */
  category: string
  /** 模块下的页面路径列表（相对 src/） */
  pages: string[]
  /** 模块下的 logic 文件列表（不含 knowledge / illustration-specs） */
  logicFiles: string[]
}
