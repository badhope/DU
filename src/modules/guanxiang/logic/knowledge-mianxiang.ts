/**
 * 玄枢 MISTVERSE · 面相知识库（12 条）
 *
 * 每条: 名称 / 部位 / 元素 / 配图 ID
 * 简述 + 详述由 SUMMARIES / DETAILS 字典提供
 */

export interface FaceKnowledge {
  key: string
  name: string
  pos: string
  element?: '金' | '木' | '水' | '火' | '土'
  /** 对应 illustration-specs.ts 的 id；不填则不显示配图 */
  illustId?: string
}

export const MIANXIANG_KNOWLEDGE: FaceKnowledge[] = [
  { key: 'san-ting-1', name: '上停', pos: '发际至眉', element: '木', illustId: 'st-shang' },
  { key: 'san-ting-2', name: '中停', pos: '眉至鼻准', element: '土', illustId: 'st-zhong' },
  { key: 'san-ting-3', name: '下停', pos: '鼻准至地阁', element: '水', illustId: 'st-xia' },
  { key: 'wu-guan-1', name: '眉', pos: '双眉', element: '木', illustId: 'wg-mei' },
  { key: 'wu-guan-2', name: '眼', pos: '双眼', element: '火', illustId: 'wg-yan' },
  { key: 'wu-guan-3', name: '鼻', pos: '鼻准', element: '土', illustId: 'wg-bi' },
  { key: 'wu-guan-4', name: '口', pos: '嘴', element: '金', illustId: 'wg-kou' },
  { key: 'wu-guan-5', name: '耳', pos: '双耳', element: '水', illustId: 'wg-er' },
  { key: 'shi-er-1', name: '命宫', pos: '两眉之间' },
  { key: 'shi-er-2', name: '财帛宫', pos: '鼻准' },
  { key: 'shi-er-3', name: '夫妻宫', pos: '鱼尾' },
  { key: 'shi-er-4', name: '疾厄宫', pos: '山根' },
]

export const MIANXIANG_SUMMARIES: Record<string, string> = {
  'san-ting-1': '15-30 岁 · 早年运势 · 智慧根基',
  'san-ting-2': '31-50 岁 · 中年运势 · 事业财禄',
  'san-ting-3': '51 岁后 · 晚年运势 · 归宿之境',
  'wu-guan-1': '为罗计星 · 主兄弟 · 居官辅贤',
  'wu-guan-2': '为太阳 · 主体性 · 心性智慧',
  'wu-guan-3': '为财星 · 主财富 · 端直丰隆',
  'wu-guan-4': '为水星 · 主信用 · 言辞辩才',
  'wu-guan-5': '为金星 · 主根基 · 智慧寿元',
  'shi-er-1': '主命运根基 · 宜光润无痕',
  'shi-er-2': '主财富收入 · 宜丰隆有气',
  'shi-er-3': '主婚姻感情 · 宜平满光润',
  'shi-er-4': '主健康安危 · 宜平满无破',
}

export const MIANXIANG_DETAILS: Record<string, string> = {
  'san-ting-1':
    '上停为额，主早年 15-30 岁运势。额相光润广阔者，祖业丰厚，智慧早开；额有缺陷则早年劳碌。',
  'san-ting-2':
    '中停为眉至鼻准，主 31-50 岁中年运势。鼻梁端直、颧相有情者，中年事业有成、财禄丰盈。',
  'san-ting-3': '下停为鼻准至地阁，主 51 岁后晚年。下停饱满有肉、地阁朝天者，晚年安康、子女孝顺。',
  'wu-guan-1': '眉为罗计星，主兄弟姐妹。眉宜清秀有神，忌散乱逆生；眉长过目者多贤，眉短则性急。',
  'wu-guan-2': '眼为太阳星，主体性心性。眼宜黑白分明、神光内敛；红赤怒目者性暴，混浊者多病。',
  'wu-guan-3': '鼻为财星，主财富一生。鼻宜端直丰隆、年寿有肉；尖削偏斜者财散，鹰嘴鼻主刻薄。',
  'wu-guan-4': '口为水星，主信用言辞。口宜大而端正、唇色红润；小薄反掀者言多不信，唇黑主病。',
  'wu-guan-5': '耳为金星，主根基寿元。耳宜轮廓分明、垂珠朝口；轮飞廓反者根基浅薄，难享高寿。',
  'shi-er-1': '命宫在两眉之间，主命运根基。宜光润无痕，忌沉陷痣破；光明如镜者一世顺遂。',
  'shi-er-2': '财帛宫在鼻准，主财富收入。宜丰隆有气，忌尖削无肉；鼻头圆厚者积财，鼻孔仰露者财散。',
  'shi-er-3':
    '夫妻宫在鱼尾（眼尾），主婚姻感情。宜平满光润，忌鱼尾纹乱；光润者婚姻和美，纹乱者多纷争。',
  'shi-er-4':
    '疾厄宫在山根（两眼之间），主健康安危。宜平满无破，忌青筋横缠；平满者体健，纹破者多病。',
}
