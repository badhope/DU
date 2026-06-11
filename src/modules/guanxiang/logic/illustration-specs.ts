/**
 * 玄枢 MISTVERSE · 观形 illustration 规格（26 个）
 *
 * 实际配图由 SP-4 真实 AI/设计师管线生成；
 * 当前用占位 SVG（scripts/gen-illustrations.mjs 输出）。
 *
 * spec 与 knowledge-{mianxiang,shouxiang,fenglui}.ts 的 illustId 字段一一对应。
 */

export type IllustrationCategory = 'face' | 'palm' | 'fengshui'
export type IllustrationStyle = 'line' | 'block' | 'icon'

export interface IllustrationSpec {
  id: string
  name: string
  category: IllustrationCategory
  size: { w: number; h: number }
  style: IllustrationStyle
  position?: { x: number; y: number }
  prompt: string
}

export const ILLUSTRATION_SPECS: IllustrationSpec[] = [
  // ===== mianxiang 8 个 =====
  {
    id: 'st-shang',
    name: '上停',
    category: 'face',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 100, y: 50 },
    prompt: '中国传统面相图，上停部位（发际至眉）的水墨线描',
  },
  {
    id: 'st-zhong',
    name: '中停',
    category: 'face',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 100, y: 100 },
    prompt: '中国传统面相图，中停部位（眉至鼻准）的水墨线描',
  },
  {
    id: 'st-xia',
    name: '下停',
    category: 'face',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 100, y: 160 },
    prompt: '中国传统面相图，下停部位（鼻准至地阁）的水墨线描',
  },
  {
    id: 'wg-mei',
    name: '眉',
    category: 'face',
    size: { w: 120, h: 60 },
    style: 'icon',
    position: { x: 60, y: 30 },
    prompt: '面相图·眉毛特写，传统水墨笔触',
  },
  {
    id: 'wg-yan',
    name: '眼',
    category: 'face',
    size: { w: 120, h: 60 },
    style: 'icon',
    position: { x: 60, y: 30 },
    prompt: '面相图·眼睛特写，传统工笔重彩',
  },
  {
    id: 'wg-bi',
    name: '鼻',
    category: 'face',
    size: { w: 80, h: 120 },
    style: 'icon',
    position: { x: 40, y: 60 },
    prompt: '面相图·鼻梁特写，传统白描技法',
  },
  {
    id: 'wg-kou',
    name: '口',
    category: 'face',
    size: { w: 100, h: 60 },
    style: 'icon',
    position: { x: 50, y: 30 },
    prompt: '面相图·嘴唇特写，传统朱砂点唇',
  },
  {
    id: 'wg-er',
    name: '耳',
    category: 'face',
    size: { w: 80, h: 120 },
    style: 'icon',
    position: { x: 40, y: 60 },
    prompt: '面相图·耳廓特写，传统线描',
  },

  // ===== shouxiang 8 个 =====
  {
    id: 'bg-qian',
    name: '乾宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 80, y: 20 },
    prompt: '手相图·乾宫方位（手腕上方），八卦方位标注',
  },
  {
    id: 'bg-dui',
    name: '兑宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 140, y: 80 },
    prompt: '手相图·兑宫方位（小指下方），八卦方位标注',
  },
  {
    id: 'bg-li',
    name: '离宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 80, y: 80 },
    prompt: '手相图·离宫方位（中指下方），八卦方位标注',
  },
  {
    id: 'bg-zhen',
    name: '震宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 20, y: 80 },
    prompt: '手相图·震宫方位（食指下方），八卦方位标注',
  },
  {
    id: 'bg-xun',
    name: '巽宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 30, y: 30 },
    prompt: '手相图·巽宫方位（食指根），八卦方位标注',
  },
  {
    id: 'bg-kan',
    name: '坎宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 30, y: 130 },
    prompt: '手相图·坎宫方位（拇指球），八卦方位标注',
  },
  {
    id: 'bg-gen',
    name: '艮宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 80, y: 140 },
    prompt: '手相图·艮宫方位（拇指根），八卦方位标注',
  },
  {
    id: 'bg-kun',
    name: '坤宫',
    category: 'palm',
    size: { w: 160, h: 160 },
    style: 'block',
    position: { x: 130, y: 130 },
    prompt: '手相图·坤宫方位（小指根），八卦方位标注',
  },

  // ===== fenglui 10 个 =====
  {
    id: 'bf-dongnan',
    name: '东南',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 150, y: 50 },
    prompt: '八宅派罗盘图·东南方位（生气方）标注',
  },
  {
    id: 'bf-nan',
    name: '南方',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 100, y: 150 },
    prompt: '八宅派罗盘图·南方位（延年方）标注',
  },
  {
    id: 'bf-xinan',
    name: '西南',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 50, y: 150 },
    prompt: '八宅派罗盘图·西南方位（天医方）标注',
  },
  {
    id: 'bf-dong',
    name: '东方',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 150, y: 100 },
    prompt: '八宅派罗盘图·东方位（伏位方）标注',
  },
  {
    id: 'bf-xi',
    name: '西方',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 50, y: 100 },
    prompt: '八宅派罗盘图·西方位（祸害方）标注',
  },
  {
    id: 'bf-xibei',
    name: '西北',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 50, y: 50 },
    prompt: '八宅派罗盘图·西北方位（六煞方）标注',
  },
  {
    id: 'bf-bei',
    name: '北方',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 100, y: 50 },
    prompt: '八宅派罗盘图·北方位（五鬼方）标注',
  },
  {
    id: 'bf-dongbei',
    name: '东北',
    category: 'fengshui',
    size: { w: 200, h: 200 },
    style: 'line',
    position: { x: 150, y: 150 },
    prompt: '八宅派罗盘图·东北方位（绝命方）标注',
  },
  {
    id: 'mg-kan',
    name: '坎命',
    category: 'fengshui',
    size: { w: 100, h: 100 },
    style: 'icon',
    position: { x: 50, y: 50 },
    prompt: '坎命卦象符号（☵）',
  },
  {
    id: 'mg-li',
    name: '离命',
    category: 'fengshui',
    size: { w: 100, h: 100 },
    style: 'icon',
    position: { x: 50, y: 50 },
    prompt: '离命卦象符号（☲）',
  },
  {
    id: 'mg-zhen',
    name: '震命',
    category: 'fengshui',
    size: { w: 100, h: 100 },
    style: 'icon',
    position: { x: 50, y: 50 },
    prompt: '震命卦象符号（☳）',
  },
  {
    id: 'mg-xun',
    name: '巽命',
    category: 'fengshui',
    size: { w: 100, h: 100 },
    style: 'icon',
    position: { x: 50, y: 50 },
    prompt: '巽命卦象符号（☴）',
  },
]
