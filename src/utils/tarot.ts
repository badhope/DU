/**
 * 78 张塔罗牌数据
 * 22 大阿卡那 + 56 小阿卡那
 */

export type Suit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles'

export interface TarotCard {
  id: number             // 0-77
  name: string           // 中文名
  nameEn: string         // 英文名
  suit: Suit
  number: number | string // 大阿卡那 0-21, 小阿卡那 1-14 或侍从/骑士/王后/国王
  symbol: string         // 简笔符号
  upKeywords: string[]   // 正位关键词
  revKeywords: string[]  // 逆位关键词
  desc: string           // 牌面描述
  color: string          // 牌面主色
}

const majorData: Omit<TarotCard, 'suit' | 'number'>[] = [
  { id: 0,  name: '愚者', nameEn: 'The Fool', symbol: '🃏', upKeywords: ['新开始', '自由', '纯真', '冒险'], revKeywords: ['鲁莽', '盲目', '风险', '犹豫'], desc: '悬崖边的旅人，脚下是未知。小狗在旁，星辰在上。', color: '#E8E4D8' },
  { id: 1,  name: '魔术师', nameEn: 'The Magician', symbol: 'Ⅰ', upKeywords: ['创造', '意志', '技能', '行动'], revKeywords: ['欺骗', '操纵', '才华浪费'], desc: '桌上四元素，指向天与地。万物皆备于我。', color: '#C8302A' },
  { id: 2,  name: '女祭司', nameEn: 'The High Priestess', symbol: 'Ⅱ', upKeywords: ['直觉', '神秘', '潜意识', '智慧'], revKeywords: ['秘密', '疏离', '忽略直觉'], desc: '帷幕之后的静默，月光下石榴与棕榈。', color: '#1B3A5C' },
  { id: 3,  name: '皇后', nameEn: 'The Empress', symbol: 'Ⅲ', upKeywords: ['丰饶', '母性', '自然', '创造'], revKeywords: ['依赖', '过度', '忽视'], desc: '麦田中的女神，丰收的象征。', color: '#2F7D4F' },
  { id: 4,  name: '皇帝', nameEn: 'The Emperor', symbol: 'Ⅳ', upKeywords: ['权威', '秩序', '稳定', '父性'], revKeywords: ['专制', '僵硬', '暴政'], desc: '石座上的统治者，山羊与雄鹰。', color: '#A87C4F' },
  { id: 5,  name: '教皇', nameEn: 'The Hierophant', symbol: 'Ⅴ', upKeywords: ['传统', '信仰', '教导', '体制'], revKeywords: ['反叛', '教条', '虚伪'], desc: '双钥之徒，连接天地的桥梁。', color: '#D4AF37' },
  { id: 6,  name: '恋人', nameEn: 'The Lovers', symbol: 'Ⅵ', upKeywords: ['爱情', '选择', '和谐', '结合'], revKeywords: ['失衡', '错误选择', '冲突'], desc: '天使拉斐尔之下，亚当与夏娃。', color: '#E04A3A' },
  { id: 7,  name: '战车', nameEn: 'The Chariot', symbol: 'Ⅶ', upKeywords: ['胜利', '意志', '控制', '前进'], revKeywords: ['失控', '方向错误', '冲突'], desc: '黑白人狮拉动的战车，星座为冠。', color: '#5B3A8E' },
  { id: 8,  name: '力量', nameEn: 'Strength', symbol: 'Ⅷ', upKeywords: ['勇气', '柔克刚', '耐心', '内在力量'], revKeywords: ['软弱', '自我怀疑', '失控'], desc: '少女驯狮，无限符号在头顶。', color: '#D4AF37' },
  { id: 9,  name: '隐者', nameEn: 'The Hermit', symbol: 'Ⅸ', upKeywords: ['内省', '智慧', '独处', '指引'], revKeywords: ['孤立', '固执', '拒绝'], desc: '提灯老者，攀登山巅之孤独。', color: '#1F4E4A' },
  { id: 10, name: '命运之轮', nameEn: 'Wheel of Fortune', symbol: 'Ⅹ', upKeywords: ['转变', '循环', '机遇', '命运'], revKeywords: ['厄运', '抗拒变化', '失控'], desc: '转轮之上，何露斯之蛇与狮蛇。', color: '#5B3A8E' },
  { id: 11, name: '正义', nameEn: 'Justice', symbol: 'Ⅺ', upKeywords: ['公正', '真理', '因果', '平衡'], revKeywords: ['不公', '逃避', '偏见'], desc: '天秤与剑，正义之眼。', color: '#E8E4D8' },
  { id: 12, name: '倒吊人', nameEn: 'The Hanged Man', symbol: 'Ⅻ', upKeywords: ['牺牲', '顿悟', '换位', '等待'], revKeywords: ['抗拒', '无谓牺牲', '拖延'], desc: '倒悬之圣者，世界树之倒影。', color: '#1B3A5C' },
  { id: 13, name: '死神', nameEn: 'Death', symbol: 'ⅩⅢ', upKeywords: ['终结', '转化', '新生', '放下'], revKeywords: ['抗拒改变', '停滞', '恐惧'], desc: '黑甲骑士，白马与黎明。', color: '#0A0A12' },
  { id: 14, name: '节制', nameEn: 'Temperance', symbol: 'ⅩⅣ', upKeywords: ['平衡', '调和', '耐心', '中庸'], revKeywords: ['失衡', '极端', '不耐'], desc: '天使双杯倒水，脚踏双岸。', color: '#E8E4D8' },
  { id: 15, name: '恶魔', nameEn: 'The Devil', symbol: 'ⅩⅤ', upKeywords: ['束缚', '欲望', '诱惑', '执着'], revKeywords: ['解脱', '觉醒', '打破枷锁'], desc: '锁链与枷锁，却可自解。', color: '#C8302A' },
  { id: 16, name: '塔', nameEn: 'The Tower', symbol: 'ⅩⅥ', upKeywords: ['突变', '崩塌', '启示', '解放'], revKeywords: ['逃避灾难', '苟延残喘', '抗拒'], desc: '雷击之塔，人坠落。', color: '#C8302A' },
  { id: 17, name: '星星', nameEn: 'The Star', symbol: 'ⅩⅦ', upKeywords: ['希望', '灵感', '宁静', '指引'], revKeywords: ['绝望', '迷失', '倦怠'], desc: '裸女倾水入池，星辰在上。', color: '#1F4E4A' },
  { id: 18, name: '月亮', nameEn: 'The Moon', symbol: 'ⅩⅧ', upKeywords: ['幻象', '潜意识', '不安', '直觉'], revKeywords: ['释放恐惧', '真相浮现', '平静'], desc: '双犬望月，虾蟆出水。', color: '#1B3A5C' },
  { id: 19, name: '太阳', nameEn: 'The Sun', symbol: 'ⅩⅨ', upKeywords: ['成功', '快乐', '活力', '光明'], revKeywords: ['短暂快乐', '延迟', '过度乐观'], desc: '向日葵下赤子骑马，葵花盛放。', color: '#D4AF37' },
  { id: 20, name: '审判', nameEn: 'Judgement', symbol: 'ⅩⅩ', upKeywords: ['觉醒', '重生', '召唤', '救赎'], revKeywords: ['自我怀疑', '悔恨', '错失'], desc: '天使号角，亡者从棺中起。', color: '#D4AF37' },
  { id: 21, name: '世界', nameEn: 'The World', symbol: 'ⅩⅪ', upKeywords: ['完成', '圆满', '成就', '整合'], revKeywords: ['未完成', '停滞', '缺憾'], desc: '舞者于桂冠中，四角之兽。', color: '#D4AF37' },
]

// 56 张小阿卡那：每个花色 14 张
const minorSuits: Array<{ suit: Suit, name: string, nameEn: string, color: string, element: string }> = [
  { suit: 'wands',      name: '权杖', nameEn: 'Wands',      color: '#C8302A', element: '火' },
  { suit: 'cups',       name: '圣杯', nameEn: 'Cups',       color: '#1B3A5C', element: '水' },
  { suit: 'swords',     name: '宝剑', nameEn: 'Swords',     color: '#E8E4D8', element: '风' },
  { suit: 'pentacles',  name: '星币', nameEn: 'Pentacles',  color: '#A87C4F', element: '土' },
]

const minorRanks: Array<{ n: number | string, name: string, up: string[], rev: string[], desc: string }> = [
  { n: 1,    name: 'Ace',   up: ['新起点', '潜力', '纯真', '机会'], rev: ['错失', '延迟', '缺乏方向'], desc: '手从天降，元素所赐。' },
  { n: 2,    name: 'Two',   up: ['平衡', '选择', '伙伴'],        rev: ['失衡', '犹豫', '孤立'],         desc: '两股力量相持。' },
  { n: 3,    name: 'Three', up: ['扩展', '成长', '合作'],        rev: ['过度', '分歧', '拖延'],         desc: '三人行必有我师。' },
  { n: 4,    name: 'Four',  up: ['稳定', '节庆', '休整'],        rev: ['封闭', '僵化', '倦怠'],         desc: '一方安定的世界。' },
  { n: 5,    name: 'Five',  up: ['冲突', '竞争', '挑战'],        rev: ['和解', '妥协', '转机'],         desc: '黑云压城之时。' },
  { n: 6,    name: 'Six',   up: ['胜利', '凯旋', '分享'],        rev: ['骄傲', '失败', '孤立'],         desc: '荣归之路。' },
  { n: 7,    name: 'Seven', up: ['坚持', '评估', '考验'],        rev: ['放弃', '困惑', '屈服'],         desc: '勇者的坚守。' },
  { n: 8,    name: 'Eight', up: ['行动', '速度', '决心'],        rev: ['混乱', '停滞', '仓促'],         desc: '风驰电掣。' },
  { n: 9,    name: 'Nine',  up: ['圆满', '警觉', '实现'],        rev: ['焦虑', '悔恨', '疑虑'],         desc: '丰收却忧。' },
  { n: 10,   name: 'Ten',   up: ['完成', '责任', '巅峰'],        rev: ['过载', '崩溃', '逃避'],         desc: '重负之极。' },
  { n: 11,   name: '侍从',   up: ['学习', '热情', '新消息'],      rev: ['不成熟', '拖延', '鲁莽'],       desc: '手持权杖的少年。' },
  { n: 12,   name: '骑士',   up: ['行动', '冒险', '冲动'],        rev: ['鲁莽', '不负责', '急躁'],       desc: '策马奔腾。' },
  { n: 13,   name: '王后',   up: ['成熟', '滋养', '包容'],        rev: ['依赖', '控制', '情绪化'],       desc: '温柔而坚定。' },
  { n: 14,   name: '国王',   up: ['权威', '稳重', '成就'],        rev: ['专制', '固执', '滥用'],         desc: '王座之上的王者。' },
]

const minorCards: TarotCard[] = []
minorSuits.forEach(s => {
  minorRanks.forEach((r, i) => {
    minorCards.push({
      id: 22 + minorCards.length,
      name: `${s.name}${r.name}`,
      nameEn: `${r.name} of ${s.nameEn}`,
      suit: s.suit,
      number: r.n,
      symbol: s.element,
      upKeywords: r.up,
      revKeywords: r.rev,
      desc: r.desc,
      color: s.color,
    })
  })
})

export const TAROT_DECK: TarotCard[] = [
  ...majorData.map(m => ({ ...m, suit: 'major' as Suit, number: m.id })),
  ...minorCards,
]

/** 随机抽 N 张不重复的牌 */
export function drawCards(n: number): TarotCard[] {
  const copy = [...TAROT_DECK]
  const drawn: TarotCard[] = []
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    drawn.push(copy.splice(idx, 1)[0])
  }
  return drawn
}

/** 78 张的卦象 (周文王后天八卦对应 22 张大阿卡那 + 4 个花色 = 26) */
export const TAROT_HEXAGRAM: Array<{ cardId: number, gua: number }> = [
  { cardId: 0, gua: 64 },   // 愚者 - 未济
  { cardId: 1, gua: 1 },    // 魔术师 - 乾
  { cardId: 2, gua: 2 },    // 女祭司 - 坤
  { cardId: 3, gua: 11 },   // 皇后 - 泰
  { cardId: 4, gua: 16 },   // 皇帝 - 豫
  { cardId: 5, gua: 15 },   // 教皇 - 谦
  { cardId: 6, gua: 31 },   // 恋人 - 咸
  { cardId: 7, gua: 34 },   // 战车 - 大壮
  { cardId: 8, gua: 44 },   // 力量 - 姤
  { cardId: 9, gua: 33 },   // 隐者 - 遁
  { cardId: 10, gua: 10 },  // 命运之轮 - 履
  { cardId: 11, gua: 5 },   // 正义 - 需
  { cardId: 12, gua: 12 },  // 倒吊人 - 否
  { cardId: 13, gua: 23 },  // 死神 - 剥
  { cardId: 14, gua: 60 },  // 节制 - 节
  { cardId: 15, gua: 47 },  // 恶魔 - 困
  { cardId: 16, gua: 21 },  // 塔 - 噬嗑
  { cardId: 17, gua: 17 },  // 星星 - 随
  { cardId: 18, gua: 29 },  // 月亮 - 坎
  { cardId: 19, gua: 30 },  // 太阳 - 离
  { cardId: 20, gua: 49 },  // 审判 - 革
  { cardId: 21, gua: 63 },  // 世界 - 既济
]
