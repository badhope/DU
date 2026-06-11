/**
 * 玄枢 MISTVERSE · 手相知识库（12 条）
 */

export interface PalmKnowledge {
  key: string
  name: string
  pos: string
  element?: '金' | '木' | '水' | '火' | '土'
  illustId: string
}

export const SHOUXIANG_KNOWLEDGE: PalmKnowledge[] = [
  { key: 'ba-gong-1', name: '乾宫', pos: '手腕上方（金星丘）', element: '金', illustId: 'bg-qian' },
  { key: 'ba-gong-2', name: '兑宫', pos: '小指下方（太阴丘）', element: '金', illustId: 'bg-dui' },
  { key: 'ba-gong-3', name: '离宫', pos: '中指下方（太阳丘）', element: '火', illustId: 'bg-li' },
  { key: 'ba-gong-4', name: '震宫', pos: '食指下方（木星丘）', element: '木', illustId: 'bg-zhen' },
  { key: 'ba-gong-5', name: '巽宫', pos: '食指根（巽宫丘）', element: '木', illustId: 'bg-xun' },
  { key: 'ba-gong-6', name: '坎宫', pos: '拇指球（金星丘）', element: '水', illustId: 'bg-kan' },
  { key: 'ba-gong-7', name: '艮宫', pos: '拇指根（艮宫丘）', element: '土', illustId: 'bg-gen' },
  { key: 'ba-gong-8', name: '坤宫', pos: '小指根（坤宫丘）', element: '土', illustId: 'bg-kun' },
  { key: 'zhou-1', name: '木星丘', pos: '食指根', element: '木', illustId: 'zhou-mu' },
  { key: 'zhou-2', name: '太阳丘', pos: '中指根', element: '火', illustId: 'zhou-taiyang' },
  { key: 'zhou-3', name: '金星丘', pos: '拇指球', element: '金', illustId: 'zhou-jin' },
  { key: 'zhou-4', name: '水星丘', pos: '小指根', element: '水', illustId: 'zhou-shui' },
]

export const SHOUXIANG_SUMMARIES: Record<string, string> = {
  'ba-gong-1': '主祖业 · 父母 · 权威',
  'ba-gong-2': '主艺术 · 才华 · 灵感',
  'ba-gong-3': '主财富 · 领导 · 自信',
  'ba-gong-4': '主事业 · 进取 · 权威',
  'ba-gong-5': '主交际 · 灵活 · 适应',
  'ba-gong-6': '主活力 · 健康 · 感情',
  'ba-gong-7': '主积蓄 · 理财 · 意志',
  'ba-gong-8': '主家宅 · 母系 · 内省',
  'zhou-1': '主雄心 · 抱负 · 领导力',
  'zhou-2': '主艺术 · 财富 · 名声',
  'zhou-3': '主热情 · 爱情 · 活力',
  'zhou-4': '主商业 · 辩才 · 机敏',
}

export const SHOUXIANG_DETAILS: Record<string, string> = {
  'ba-gong-1': '乾宫在手腕上方（金星丘内），主祖业父母权威。宜丰隆有肉、纹路清晰，凹陷者祖业难承。',
  'ba-gong-2': '兑宫在小指下方（太阴丘），主艺术才华灵感。宜光润有泽，纹乱者多幻想而少成。',
  'ba-gong-3': '离宫在中指下方（太阳丘），主财富领导自信。宜饱满红润，枯陷者财来财去。',
  'ba-gong-4': '震宫在食指下方（木星丘），主事业进取权威。宜高耸有势，塌陷者难居高位。',
  'ba-gong-5': '巽宫在食指根，主交际灵活适应。宜有肉有泽，筋浮骨露者人缘欠佳。',
  'ba-gong-6': '坎宫在拇指球（金星丘），主活力健康感情。宜丰隆红润，扁平者多病虚弱。',
  'ba-gong-7': '艮宫在拇指根，主积蓄理财意志。宜圆厚有气，筋骨暴露者难聚财。',
  'ba-gong-8': '坤宫在小指根，主家宅母系内省。宜红润有肉，色暗者家宅不安。',
  'zhou-1': '木星丘在食指根，主雄心抱负。饱满者志向远大，扁平者进取不足。',
  'zhou-2': '太阳丘在中指根，主艺术名声。丰隆者名利双收，凹陷者多阻滞。',
  'zhou-3': '金星丘在拇指球，主爱情活力。圆润饱满者人缘佳、色欲调和，枯陷者多愁善感。',
  'zhou-4': '水星丘在小指根，主商业辩才机敏。发达者善于理财、巧言辞令，扁平者不善经营。',
}
