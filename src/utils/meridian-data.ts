/**
 * 玄枢 MISTVERSE · 经络穴位坐标数据
 *
 * 坐标系：500 × 800 viewBox
 *  - 头：y 0-180
 *  - 躯干：y 180-500
 *  - 腿：y 500-800
 *  - 手臂：左右展开
 *
 * 简化人体轮廓 + 12 正经 + 8 奇经主要穴位坐标
 *  设计：传统针灸铜人比例 · 头/躯干/四肢 1:3:4
 */

export type Side = 'front' | 'back'
export type ViewKey = 'qijing' | 'jingluo'

export interface Point {
  x: number
  y: number
  /** 穴位名（如果是穴位） */
  acupoint?: string
}

export interface MeridianPath {
  id: string
  name: string
  pinyin?: string
  /** 经脉颜色（阴/阳） */
  color: string
  /** 经脉标签位置 */
  labelAt: { x: number; y: number }
  /** 主要穴位 */
  acupoints: Point[]
  /** 经脉走向点（连成线） */
  path: Point[]
  /** 经络类别（"yin"/"yang"/"奇"） */
  category: 'yin' | 'yang' | 'qi'
  side: Side
}

// ============ 人体轮廓（简化版） ============
export const BODY_OUTLINE_FRONT = 'M 180 40 Q 150 40 145 80 Q 145 120 165 150 L 170 175 L 140 195 L 130 230 L 130 290 L 140 350 L 140 420 L 145 470 L 145 510 L 130 540 L 110 580 L 95 640 L 95 720 L 100 770 L 175 770 L 180 660 L 185 540 L 190 480 L 195 420 L 195 360 L 195 290 L 200 250 L 215 220 L 220 200 L 250 195 L 250 175 L 245 155 L 240 130 L 240 90 Q 235 50 200 40 Q 185 38 180 40 Z'
export const BODY_OUTLINE_BACK = 'M 180 40 Q 145 40 140 90 Q 140 130 155 150 L 165 175 L 140 200 L 135 240 L 135 300 L 145 360 L 145 430 L 150 480 L 145 520 L 130 550 L 110 590 L 95 650 L 95 730 L 100 770 L 175 770 L 180 660 L 185 540 L 190 480 L 195 420 L 195 360 L 195 290 L 200 250 L 215 220 L 220 200 L 250 195 L 250 175 L 245 155 Q 240 130 240 90 Q 235 50 200 40 Q 185 38 180 40 Z'
// 简化四肢
export const BODY_LIMBS_FRONT = 'M 130 230 L 80 260 L 60 320 L 50 380 L 55 440 L 80 480 L 130 460 Z M 250 230 L 300 260 L 320 320 L 330 380 L 325 440 L 300 480 L 250 460 Z M 145 510 L 130 600 L 135 700 L 160 770 L 180 770 L 195 700 L 195 600 L 195 510 Z M 195 510 L 205 600 L 205 700 L 220 770 L 240 770 L 245 700 L 245 600 L 250 510 Z'
export const BODY_LIMBS_BACK = 'M 130 230 L 80 260 L 60 320 L 50 380 L 55 440 L 80 480 L 130 460 Z M 250 230 L 300 260 L 320 320 L 330 380 L 325 440 L 300 480 L 250 460 Z M 145 510 L 130 600 L 135 700 L 160 770 L 180 770 L 195 700 L 195 600 L 195 510 Z M 195 510 L 205 600 L 205 700 L 220 770 L 240 770 L 245 700 L 245 600 L 250 510 Z'

// ============ 12 正经路径（简化） ============
// 每条经络有 5-10 个主要穴位
// 路径点连成线表示走向

export const MERIDIAN_PATHS: MeridianPath[] = [
  // ============ 正面（手三阴从胸走手 · 足三阳从头走足 · 足三阴从足走胸）============
  {
    id: 'lu', name: '手太阴肺经', color: '#5B8ECC', category: 'yin', side: 'front',
    labelAt: { x: 60, y: 200 },
    path: [
      { x: 180, y: 200 }, { x: 150, y: 230 }, { x: 120, y: 270 }, { x: 100, y: 320 },
      { x: 85, y: 380 }, { x: 80, y: 420 }, { x: 80, y: 460 },
    ],
    acupoints: [
      { x: 180, y: 200, acupoint: '中府' },
      { x: 150, y: 230, acupoint: '云门' },
      { x: 120, y: 270, acupoint: '天府' },
      { x: 100, y: 320, acupoint: '尺泽' },
      { x: 80, y: 420, acupoint: '列缺' },
      { x: 80, y: 460, acupoint: '少商' },
    ],
  },
  {
    id: 'dachang', name: '手阳明大肠经', color: '#E8A03E', category: 'yang', side: 'front',
    labelAt: { x: 360, y: 200 },
    path: [
      { x: 320, y: 460 }, { x: 320, y: 420 }, { x: 320, y: 380 }, { x: 320, y: 320 },
      { x: 320, y: 270 }, { x: 310, y: 230 }, { x: 290, y: 200 }, { x: 260, y: 195 },
    ],
    acupoints: [
      { x: 320, y: 460, acupoint: '商阳' },
      { x: 320, y: 420, acupoint: '合谷' },
      { x: 320, y: 380, acupoint: '阳溪' },
      { x: 320, y: 320, acupoint: '手三里' },
      { x: 320, y: 270, acupoint: '曲池' },
      { x: 310, y: 230, acupoint: '肩髃' },
      { x: 260, y: 195, acupoint: '迎香' },
    ],
  },
  {
    id: 'wei', name: '足阳明胃经', color: '#E8A03E', category: 'yang', side: 'front',
    labelAt: { x: 90, y: 100 },
    path: [
      { x: 245, y: 165 }, { x: 220, y: 175 }, { x: 200, y: 195 }, { x: 180, y: 230 },
      { x: 170, y: 280 }, { x: 165, y: 340 }, { x: 170, y: 400 }, { x: 175, y: 460 },
      { x: 175, y: 510 }, { x: 165, y: 580 }, { x: 155, y: 660 }, { x: 155, y: 730 },
    ],
    acupoints: [
      { x: 245, y: 165, acupoint: '承泣' },
      { x: 200, y: 195, acupoint: '下关' },
      { x: 180, y: 230, acupoint: '人迎' },
      { x: 170, y: 280, acupoint: '梁门' },
      { x: 165, y: 340, acupoint: '天枢' },
      { x: 175, y: 460, acupoint: '归来' },
      { x: 175, y: 510, acupoint: '髀关' },
      { x: 165, y: 580, acupoint: '足三里' },
      { x: 155, y: 730, acupoint: '厉兑' },
    ],
  },
  {
    id: 'pi', name: '足太阴脾经', color: '#5B8ECC', category: 'yin', side: 'front',
    labelAt: { x: 280, y: 600 },
    path: [
      { x: 155, y: 730 }, { x: 165, y: 660 }, { x: 175, y: 580 }, { x: 180, y: 510 },
      { x: 200, y: 460 }, { x: 210, y: 400 }, { x: 215, y: 340 }, { x: 210, y: 280 },
      { x: 200, y: 230 }, { x: 215, y: 200 },
    ],
    acupoints: [
      { x: 155, y: 730, acupoint: '隐白' },
      { x: 175, y: 580, acupoint: '公孙' },
      { x: 180, y: 510, acupoint: '三阴交' },
      { x: 200, y: 460, acupoint: '地机' },
      { x: 210, y: 400, acupoint: '血海' },
      { x: 215, y: 280, acupoint: '大横' },
      { x: 215, y: 200, acupoint: '大包' },
    ],
  },
  {
    id: 'xin', name: '手少阴心经', color: '#C8407A', category: 'yin', side: 'front',
    labelAt: { x: 50, y: 320 },
    path: [
      { x: 195, y: 220 }, { x: 175, y: 250 }, { x: 130, y: 280 }, { x: 95, y: 320 },
      { x: 75, y: 380 }, { x: 65, y: 440 }, { x: 70, y: 460 },
    ],
    acupoints: [
      { x: 195, y: 220, acupoint: '极泉' },
      { x: 130, y: 280, acupoint: '青灵' },
      { x: 75, y: 380, acupoint: '少海' },
      { x: 70, y: 460, acupoint: '少冲' },
    ],
  },
  {
    id: 'xiaochang', name: '手太阳小肠经', color: '#E8A03E', category: 'yang', side: 'front',
    labelAt: { x: 380, y: 100 },
    path: [
      { x: 280, y: 460 }, { x: 290, y: 420 }, { x: 320, y: 380 }, { x: 340, y: 320 },
      { x: 350, y: 270 }, { x: 340, y: 220 }, { x: 320, y: 180 }, { x: 290, y: 160 },
    ],
    acupoints: [
      { x: 280, y: 460, acupoint: '少泽' },
      { x: 320, y: 380, acupoint: '后溪' },
      { x: 340, y: 320, acupoint: '养老' },
      { x: 340, y: 220, acupoint: '肩贞' },
      { x: 290, y: 160, acupoint: '听宫' },
    ],
  },
  {
    id: 'gan', name: '足厥阴肝经', color: '#5B8ECC', category: 'yin', side: 'front',
    labelAt: { x: 220, y: 600 },
    path: [
      { x: 235, y: 720 }, { x: 240, y: 660 }, { x: 240, y: 580 }, { x: 235, y: 510 },
      { x: 240, y: 460 }, { x: 250, y: 400 }, { x: 250, y: 340 }, { x: 245, y: 280 },
      { x: 240, y: 230 },
    ],
    acupoints: [
      { x: 235, y: 720, acupoint: '大敦' },
      { x: 240, y: 660, acupoint: '行间' },
      { x: 240, y: 580, acupoint: '太冲' },
      { x: 240, y: 510, acupoint: '曲泉' },
      { x: 250, y: 400, acupoint: '阴包' },
      { x: 245, y: 280, acupoint: '期门' },
    ],
  },
  {
    id: 'xinbao', name: '手厥阴心包经', color: '#C8407A', category: 'yin', side: 'front',
    labelAt: { x: 60, y: 380 },
    path: [
      { x: 205, y: 220 }, { x: 195, y: 250 }, { x: 165, y: 290 }, { x: 130, y: 340 },
      { x: 100, y: 390 }, { x: 90, y: 440 },
    ],
    acupoints: [
      { x: 205, y: 220, acupoint: '天池' },
      { x: 165, y: 290, acupoint: '曲泽' },
      { x: 130, y: 340, acupoint: '内关' },
      { x: 100, y: 390, acupoint: '大陵' },
      { x: 90, y: 440, acupoint: '中冲' },
    ],
  },

  // ============ 背面 ============
  {
    id: 'pangguang', name: '足太阳膀胱经', color: '#E8A03E', category: 'yang', side: 'back',
    labelAt: { x: 50, y: 350 },
    path: [
      { x: 245, y: 150 }, { x: 220, y: 175 }, { x: 195, y: 200 },
      { x: 165, y: 280 }, { x: 165, y: 360 }, { x: 170, y: 440 }, { x: 170, y: 500 },
      { x: 165, y: 600 }, { x: 160, y: 700 }, { x: 160, y: 760 },
    ],
    acupoints: [
      { x: 245, y: 150, acupoint: '睛明' },
      { x: 220, y: 175, acupoint: '攒竹' },
      { x: 195, y: 200, acupoint: '天柱' },
      { x: 165, y: 280, acupoint: '风门' },
      { x: 165, y: 360, acupoint: '心俞' },
      { x: 170, y: 440, acupoint: '肾俞' },
      { x: 170, y: 500, acupoint: '膀胱俞' },
      { x: 160, y: 700, acupoint: '昆仑' },
      { x: 160, y: 760, acupoint: '至阴' },
    ],
  },
  {
    id: 'shen', name: '足少阴肾经', color: '#5B8ECC', category: 'yin', side: 'back',
    labelAt: { x: 250, y: 350 },
    path: [
      { x: 250, y: 760 }, { x: 250, y: 700 }, { x: 245, y: 600 }, { x: 250, y: 500 },
      { x: 250, y: 440 }, { x: 245, y: 360 }, { x: 240, y: 280 }, { x: 220, y: 220 },
    ],
    acupoints: [
      { x: 250, y: 760, acupoint: '涌泉' },
      { x: 250, y: 600, acupoint: '照海' },
      { x: 250, y: 500, acupoint: '复溜' },
      { x: 245, y: 360, acupoint: '肓俞' },
      { x: 220, y: 220, acupoint: '俞府' },
    ],
  },
  {
    id: 'dan', name: '足少阳胆经', color: '#E8A03E', category: 'yang', side: 'back',
    labelAt: { x: 380, y: 200 },
    path: [
      { x: 285, y: 145 }, { x: 310, y: 165 }, { x: 320, y: 195 },
      { x: 300, y: 280 }, { x: 290, y: 360 }, { x: 290, y: 440 }, { x: 285, y: 500 },
      { x: 275, y: 600 }, { x: 270, y: 700 }, { x: 270, y: 760 },
    ],
    acupoints: [
      { x: 285, y: 145, acupoint: '瞳子髎' },
      { x: 320, y: 195, acupoint: '风池' },
      { x: 300, y: 280, acupoint: '肩井' },
      { x: 290, y: 360, acupoint: '京门' },
      { x: 290, y: 440, acupoint: '环跳' },
      { x: 285, y: 500, acupoint: '风市' },
      { x: 275, y: 600, acupoint: '阳陵泉' },
      { x: 270, y: 760, acupoint: '足窍阴' },
    ],
  },
  {
    id: 'sanjiao', name: '手少阳三焦经', color: '#E8A03E', category: 'yang', side: 'back',
    labelAt: { x: 380, y: 350 },
    path: [
      { x: 280, y: 460 }, { x: 305, y: 420 }, { x: 330, y: 380 }, { x: 340, y: 320 },
      { x: 340, y: 270 }, { x: 330, y: 220 }, { x: 310, y: 180 }, { x: 285, y: 160 },
    ],
    acupoints: [
      { x: 280, y: 460, acupoint: '关冲' },
      { x: 330, y: 380, acupoint: '中渚' },
      { x: 340, y: 320, acupoint: '外关' },
      { x: 330, y: 220, acupoint: '肩髎' },
      { x: 285, y: 160, acupoint: '丝竹空' },
    ],
  },
]

// ============ 8 奇经路径（关键 + 复杂）============
// 任脉：前正中线
// 督脉：后正中线
// 冲脉：腹部两侧
// 带脉：腰部一周
// 阴维/阳维/阴跷/阳跷：起止 + 关键点

export const QIJING_PATHS: MeridianPath[] = [
  {
    id: 'ren', name: '任脉', pinyin: 'ren', color: '#9B59B6', category: 'qi', side: 'front',
    labelAt: { x: 360, y: 470 },
    path: [
      { x: 165, y: 760 }, { x: 165, y: 700 }, { x: 165, y: 600 }, { x: 165, y: 500 },
      { x: 165, y: 440 }, { x: 165, y: 360 }, { x: 165, y: 280 }, { x: 175, y: 230 },
      { x: 190, y: 195 }, { x: 210, y: 175 },
    ],
    acupoints: [
      { x: 165, y: 760, acupoint: '会阴' },
      { x: 165, y: 500, acupoint: '关元' },
      { x: 165, y: 440, acupoint: '气海' },
      { x: 165, y: 360, acupoint: '神阙' },
      { x: 165, y: 280, acupoint: '中脘' },
      { x: 165, y: 230, acupoint: '膻中' },
      { x: 190, y: 195, acupoint: '天突' },
      { x: 210, y: 175, acupoint: '承浆' },
    ],
  },
  {
    id: 'du', name: '督脉', pinyin: 'du', color: '#C8302A', category: 'qi', side: 'back',
    labelAt: { x: 380, y: 470 },
    path: [
      { x: 175, y: 760 }, { x: 175, y: 700 }, { x: 175, y: 600 }, { x: 175, y: 500 },
      { x: 175, y: 440 }, { x: 175, y: 360 }, { x: 175, y: 280 }, { x: 180, y: 230 },
      { x: 195, y: 195 }, { x: 200, y: 100 },
    ],
    acupoints: [
      { x: 175, y: 760, acupoint: '长强' },
      { x: 175, y: 500, acupoint: '命门' },
      { x: 175, y: 360, acupoint: '至阳' },
      { x: 175, y: 230, acupoint: '大椎' },
      { x: 200, y: 100, acupoint: '百会' },
    ],
  },
  {
    id: 'chong', name: '冲脉', pinyin: 'chong', color: '#9B59B6', category: 'qi', side: 'front',
    labelAt: { x: 360, y: 400 },
    path: [
      { x: 240, y: 760 }, { x: 240, y: 600 }, { x: 240, y: 500 }, { x: 240, y: 400 },
      { x: 240, y: 280 }, { x: 220, y: 220 }, { x: 200, y: 195 },
    ],
    acupoints: [
      { x: 240, y: 760, acupoint: '气街' },
      { x: 240, y: 600, acupoint: '气穴' },
      { x: 240, y: 500, acupoint: '肓俞' },
      { x: 240, y: 400, acupoint: '腹通谷' },
      { x: 200, y: 195, acupoint: '廉泉' },
    ],
  },
  {
    id: 'dai', name: '带脉', pinyin: 'dai', color: '#9B59B6', category: 'qi', side: 'front',
    labelAt: { x: 360, y: 350 },
    path: [
      { x: 95, y: 350 }, { x: 130, y: 350 }, { x: 165, y: 350 },
      { x: 200, y: 350 }, { x: 240, y: 350 }, { x: 280, y: 350 },
    ],
    acupoints: [
      { x: 95, y: 350, acupoint: '带脉' },
      { x: 165, y: 350, acupoint: '五枢' },
      { x: 240, y: 350, acupoint: '维道' },
    ],
  },
  {
    id: 'yinwei', name: '阴维脉', pinyin: 'yinwei', color: '#9B59B6', category: 'qi', side: 'front',
    labelAt: { x: 350, y: 280 },
    path: [
      { x: 240, y: 600 }, { x: 240, y: 500 }, { x: 240, y: 400 }, { x: 240, y: 300 },
      { x: 220, y: 240 }, { x: 200, y: 200 }, { x: 190, y: 180 },
    ],
    acupoints: [
      { x: 240, y: 600, acupoint: '筑宾' },
      { x: 240, y: 400, acupoint: '府舍' },
      { x: 240, y: 300, acupoint: '期门' },
      { x: 200, y: 200, acupoint: '天突' },
    ],
  },
  {
    id: 'yangwei', name: '阳维脉', pinyin: 'yangwei', color: '#C8302A', category: 'qi', side: 'back',
    labelAt: { x: 360, y: 280 },
    path: [
      { x: 260, y: 600 }, { x: 260, y: 500 }, { x: 280, y: 400 }, { x: 320, y: 300 },
      { x: 320, y: 220 }, { x: 280, y: 180 }, { x: 220, y: 200 },
    ],
    acupoints: [
      { x: 260, y: 600, acupoint: '金门' },
      { x: 280, y: 400, acupoint: '阳交' },
      { x: 320, y: 220, acupoint: '本神' },
      { x: 220, y: 200, acupoint: '风府' },
    ],
  },
  {
    id: 'yinqiao', name: '阴跷脉', pinyin: 'yinqiao', color: '#9B59B6', category: 'qi', side: 'back',
    labelAt: { x: 220, y: 450 },
    path: [
      { x: 220, y: 700 }, { x: 220, y: 500 }, { x: 220, y: 400 }, { x: 220, y: 280 },
      { x: 230, y: 200 }, { x: 240, y: 150 },
    ],
    acupoints: [
      { x: 220, y: 700, acupoint: '照海' },
      { x: 220, y: 500, acupoint: '交信' },
      { x: 240, y: 150, acupoint: '睛明' },
    ],
  },
  {
    id: 'yangqiao', name: '阳跷脉', pinyin: 'yangqiao', color: '#C8302A', category: 'qi', side: 'back',
    labelAt: { x: 380, y: 450 },
    path: [
      { x: 270, y: 700 }, { x: 270, y: 500 }, { x: 270, y: 400 }, { x: 270, y: 280 },
      { x: 280, y: 200 }, { x: 270, y: 150 },
    ],
    acupoints: [
      { x: 270, y: 700, acupoint: '申脉' },
      { x: 270, y: 500, acupoint: '跗阳' },
      { x: 270, y: 280, acupoint: '臑俞' },
      { x: 270, y: 150, acupoint: '睛明' },
    ],
  },
]

/** 转换 path 数组为 SVG d 字符串 */
export function pointsToPathD(pts: Point[]): string {
  if (pts.length === 0) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}
