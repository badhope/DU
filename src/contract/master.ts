export type MasterId = 'ziping' | 'ziwei' | 'meihua' | 'qimen' | 'liuren' | 'xiangfa'

export type MasterStatus = 'active' | 'planned'
export type MasterKernel = 'bazi' | 'meihua' | 'none'

export interface Master {
  id: MasterId
  name: string
  title: string
  glyph: string
  accent: string
  school: string
  status: MasterStatus
  kernel: MasterKernel
  books: string[]
  method: string
  persona: string
  style: string[]
  safety: string[]
}
