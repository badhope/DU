/**
 * DU v2 · 工具契约
 *
 * 一个术数工具 = 一份输入声明 + 一个纯计算函数。
 * 输入表单由 FormRenderer 依 schema 自动生成；校验、持久化、分享、
 * 每日限次、免责声明全部由框架统一负责，工具本身只关心算法。
 */
import type { ResultNode } from './result'

export type CategoryId = 'mingli' | 'buzhan' | 'xiangshu' | 'shijian' | 'yangsheng'

export interface Category {
  id: CategoryId
  name: string
  latin: string
  /** 强调色，供界面着色 */
  accent: string
}

/** 输入字段类型（决定生成的控件） */
export type FieldType =
  | 'date'
  | 'time'
  | 'datetime'
  | 'text'
  | 'number'
  | 'select'
  | 'multi'
  | 'toggle'

export interface FieldDef {
  key: string
  label: string
  hint?: string
  type: FieldType
  required?: boolean
  placeholder?: string
  /** select 用 */
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  default?: string | number | boolean
}

/** multi 控件存数组，其余存标量；工具内自行收窄 */
export type ToolValue = string | number | boolean | string[] | undefined
export type ToolInput = Record<string, ToolValue>

export interface ToolResult {
  /** 结果区标题 */
  title: string
  /** 副标题，通常为一句话总纲 */
  summary?: string
  body: ResultNode[]
  /**
   * 供"这条说中了吗"反馈用的条目清单。
   * 反馈是引擎唯一的历史信号来源，不回收就等于 resonated:* 特征永远为空。
   */
  feedback?: FeedbackItem[]
}

export interface FeedbackItem {
  /** 命库条目 id */
  id: string
  /** 断语原文 */
  text: string
  /** 归入哪个主题标签，供下次匹配加权 */
  tag?: string
}

/** 计算可能因输入不足/不合法而失败 */
export type ComputeOutcome = ToolResult | { error: string }

/**
 * 允许异步：历法、星历这类库体积大（lunar-typescript 打进主包会把首页拖到
 * 472KB），工具应在 compute 内部 dynamic import，让它自己成 chunk。
 * 同步工具不必因此改动——返回类型只是宽了一档。
 */
export type ComputeResult = ComputeOutcome | Promise<ComputeOutcome>

/**
 * 本站本地累积的历史信号（第几次来访、上次问过什么、上次哪些说中）。
 * 由页面从 localStorage 读出后注入，工具本身不碰浏览器存储，保持可测。
 */
export interface SessionContext {
  visitCount: number
  lastDomains: string[]
  resonatedTags: string[]
  /** 本页内第几批；参与种子，保证"换一批"换得出、又仍可复现 */
  round: number
  /** 最近已经展示过的条目 id，引擎据此降权，避免连着几次同一句 */
  seen: string[]
}

export interface Tool {
  id: string
  name: string
  latin?: string
  category: CategoryId
  /** 一句话说明，用于工具卡片 */
  blurb: string
  /** 详细说明，用于工具页脚注 */
  method?: string
  fields: FieldDef[]
  compute: (input: ToolInput, session?: SessionContext) => ComputeResult
}

export interface ToolRegistryEntry {
  tool: Tool
}
