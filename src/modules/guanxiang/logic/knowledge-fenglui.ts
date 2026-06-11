/**
 * 玄枢 MISTVERSE · 风水知识库（12 条）
 */

export interface FengshuiKnowledge {
  key: string
  name: string
  direction: '东' | '南' | '西' | '北' | '东南' | '西南' | '东北' | '西北'
  jiXiong: '大吉' | '吉' | '平' | '凶' | '大凶'
  illustId: string
}

export const FENGLUI_KNOWLEDGE: FengshuiKnowledge[] = [
  { key: 'ba-fang-1', name: '东南', direction: '东南', jiXiong: '吉', illustId: 'bf-dongnan' },
  { key: 'ba-fang-2', name: '南方', direction: '南', jiXiong: '大吉', illustId: 'bf-nan' },
  { key: 'ba-fang-3', name: '西南', direction: '西南', jiXiong: '吉', illustId: 'bf-xinan' },
  { key: 'ba-fang-4', name: '东方', direction: '东', jiXiong: '大吉', illustId: 'bf-dong' },
  { key: 'ba-fang-5', name: '西方', direction: '西', jiXiong: '平', illustId: 'bf-xi' },
  { key: 'ba-fang-6', name: '西北', direction: '西北', jiXiong: '吉', illustId: 'bf-xibei' },
  { key: 'ba-fang-7', name: '北方', direction: '北', jiXiong: '凶', illustId: 'bf-bei' },
  { key: 'ba-fang-8', name: '东北', direction: '东北', jiXiong: '凶', illustId: 'bf-dongbei' },
  { key: 'ming-gua-1', name: '坎命', direction: '北', jiXiong: '平', illustId: 'mg-kan' },
  { key: 'ming-gua-2', name: '离命', direction: '南', jiXiong: '大吉', illustId: 'mg-li' },
  { key: 'ming-gua-3', name: '震命', direction: '东', jiXiong: '吉', illustId: 'mg-zhen' },
  { key: 'ming-gua-4', name: '巽命', direction: '东南', jiXiong: '吉', illustId: 'mg-xun' },
]

export const FENGLUI_SUMMARIES: Record<string, string> = {
  'ba-fang-1': '生气方 · 主财丁 · 宜开门安床',
  'ba-fang-2': '延年方 · 主婚寿 · 宜安神位',
  'ba-fang-3': '天医方 · 主健康 · 宜设厨灶',
  'ba-fang-4': '伏位方 · 主平安 · 宜安书房',
  'ba-fang-5': '祸害方 · 主是非 · 忌动土',
  'ba-fang-6': '六煞方 · 主桃花 · 宜安卧室',
  'ba-fang-7': '五鬼方 · 主口舌 · 忌开门',
  'ba-fang-8': '绝命方 · 主官非 · 大凶',
  'ming-gua-1': '坎命属水 · 喜南方火 · 忌北方水',
  'ming-gua-2': '离命属火 · 喜北方水 · 忌南方火',
  'ming-gua-3': '震命属木 · 喜西方金 · 忌东方木',
  'ming-gua-4': '巽命属木 · 喜西北金 · 忌东南方',
}

export const FENGLUI_DETAILS: Record<string, string> = {
  'ba-fang-1': '东南为生气方，是八宅派第一吉位。主财丁两旺，宜设大门入口或安床于此，能催旺家运。',
  'ba-fang-2': '南方为延年方，主婚姻和寿元。宜安神位、祖宗牌位，能保家庭和睦、长寿健康。',
  'ba-fang-3': '西南为天医方，主健康祛病。宜设厨房灶台于此，能保家人健康无病。',
  'ba-fang-4': '东方为伏位方，主平安稳定。宜安书房或学习桌，能保事业稳定、学业有成。',
  'ba-fang-5': '西方为祸害方，主口舌是非。忌在此方位动土装修，否则易招小人、惹官非。',
  'ba-fang-6': '西北为六煞方，主桃花感情。宜安卧室于此，能催旺感情运，但亦主桃花纠纷。',
  'ba-fang-7': '北方为五鬼方，主口舌灾病。忌在此开门或设主要功能区，否则易招口舌、血光。',
  'ba-fang-8': '东北为绝命方，主官非破财。八宅派第一凶位，大凶之方，忌动土、忌开门、忌安床。',
  'ming-gua-1': '坎命人五行属水，喜南方火（克金生水）通关，忌北方水（比劫过旺）助纣为虐。',
  'ming-gua-2': '离命人五行属火，喜北方水（既济卦）调候，忌南方火（比劫）助火势过旺。',
  'ming-gua-3': '震命人五行属木，喜西方金（官杀）制身，忌东方木（比劫）帮身太过。',
  'ming-gua-4': '巽命人五行属木，喜西北金（金舆贵人）助身，忌东南方木（比劫）助势。',
}
