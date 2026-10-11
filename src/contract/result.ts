/**
 * DU v2 · 渲染契约
 *
 * v1 把排盘结果写死在 46 个 .vue 里；v2 让算法只产出一棵 ResultNode 语法树，
 * 由唯一的通用渲染器（ui/ResultView.vue）解释成界面。
 * 新增一个工具 = 注册一条 Tool + 写一个纯函数，不需要新页面、不需要新组件。
 */

export type Tone =
  | 'default'
  | 'good'
  | 'bad'
  | 'warn'
  | 'info'
  /** 五行色：木火土金水 */
  | 'mu'
  | 'huo'
  | 'tu'
  | 'jin'
  | 'shui'

export interface Cell {
  label?: string
  value: string
  sub?: string
  tone?: Tone
}

/** 结果语法树的全部节点类型 */
export type ResultNode =
  /** 纵向容器 */
  | { kind: 'stack'; gap?: 'tight' | 'loose'; children: ResultNode[] }
  /** 横向分栏 */
  | { kind: 'row'; children: ResultNode[] }
  /** 带标题区块 */
  | { kind: 'section'; title: string; hint?: string; children: ResultNode[] }
  /** 等宽网格（宫位、爻位、吉凶矩阵） */
  | { kind: 'grid'; columns: number; cells: Cell[] }
  /** 键值对列表 */
  | { kind: 'kv'; items: Cell[]; columns?: number }
  /** 标签流 */
  | { kind: 'chips'; items: { text: string; tone?: Tone }[] }
  /** 数值条（五行能量、评分） */
  | { kind: 'bars'; items: { label: string; value: number; max?: number; tone?: Tone }[] }
  /** 环形/半环形仪表（综合评分） */
  | { kind: 'score'; value: number; max?: number; label?: string; caption?: string }
  /** 表格（黄历宜忌、流年表） */
  | { kind: 'table'; headers: string[]; rows: string[][]; align?: ('left' | 'center')[] }
  /** n×n 方阵（九宫飞星、奇门盘）：按洛书序填充 */
  | { kind: 'matrix'; size: number; caption?: string; cells: MatrixCell[] }
  /** 六爻卦画 */
  | { kind: 'gua'; lines: GuaLine[]; title?: string; subtitle?: string }
  /** 文本行（断语、解释） */
  | { kind: 'text'; lines: string[]; lead?: boolean }
  /**
   * 可核出处：引文原样列出，并给一个"查原文"的入口。
   *
   * 权威性不是靠排版出来的——读者点进去必须在阅览室搜到这句话，
   * 所以这一节单独成节点，而不是塞进 text 里。
   */
  | { kind: 'quote'; book: string; loc?: string; text: string; gloss?: string }
  /** 一句话提示 / 免责 */
  | { kind: 'note'; text: string; tone?: Tone }

export interface MatrixCell {
  /** 洛书宫位 1–9 */
  palace: number
  center: string
  corner?: string[]
  tone?: Tone
}

export interface GuaLine {
  /** 由下往上第几爻，1 起 */
  position: number
  yang: boolean
  /** 动爻（老阴/老阳） */
  moving?: boolean
  /** 六亲、纳甲等标注 */
  left?: string
  right?: string
  /** 世应 */
  mark?: string
}
