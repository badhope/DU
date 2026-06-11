/**
 * 玄枢 MISTVERSE · 灵签抽签
 *
 *  - 100 签：上上 / 上 / 中上 / 中 / 中下 / 下 / 下下
 *  - 60 神签 + 40 杂签
 *  - 抽签算法：基于 seed 哈希
 */

export type QianLevel = '上上' | '上' | '中上' | '中' | '中下' | '下' | '下下'

export interface Qian {
  num: number
  level: QianLevel
  title: string // 签题
  poem: string // 签诗
  interpretation: string // 解签
  fiveEl: '金' | '木' | '水' | '火' | '土'
  category: '事业' | '财运' | '婚恋' | '健康' | '家宅' | '诉讼' | '出行' | '学业'
  good: string[]
  bad: string[]
  icon?: string // 图腾符号（按五行+等级映射，可选）
}

export const QIAN_DB: Qian[] = [
  {
    num: 1,
    level: '上上',
    title: '飞龙在天',
    poem: '云开月出正分明，不须进退问前程。一切谋求皆遂意，荣华富贵自生成。',
    interpretation: '大吉之签 · 时运亨通 · 所求皆遂',
    fiveEl: '金',
    category: '事业',
    good: ['事业', '求财', '婚姻'],
    bad: ['急躁'],
  },
  {
    num: 2,
    level: '上',
    title: '枯木逢春',
    poem: '枯木逢春再发枝，百花齐放正当时。莫言今日时来运转，犹恐春风又转移。',
    interpretation: '渐入佳境 · 但需谨慎 · 持盈保泰',
    fiveEl: '木',
    category: '事业',
    good: ['守成', '修养'],
    bad: ['冒进'],
  },
  {
    num: 3,
    level: '中上',
    title: '云散月明',
    poem: '云散月当头，谋事不须忧。从今交运转，恰似水东流。',
    interpretation: '云开见月 · 渐有转机',
    fiveEl: '金',
    category: '财运',
    good: ['求财', '经营'],
    bad: ['投机'],
  },
  {
    num: 4,
    level: '中',
    title: '行船风顺',
    poem: '一叶轻舟下小桥，顺风相送到江皋。行人若问前程事，前程万里路迢迢。',
    interpretation: '平平之签 · 需耐心 · 不可急进',
    fiveEl: '水',
    category: '出行',
    good: ['出行', '远行'],
    bad: ['冒进'],
  },
  {
    num: 5,
    level: '中下',
    title: '守株待兔',
    poem: '守株待兔待何时，机会来临莫迟疑。若问前程休盼望，静中自有玄机知。',
    interpretation: '守而不动 · 需待时 · 不可强求',
    fiveEl: '土',
    category: '事业',
    good: ['守成', '等待'],
    bad: ['强求', '冒进'],
  },
  {
    num: 6,
    level: '上',
    title: '春日载阳',
    poem: '春日载阳万物新，红桃绿柳照江滨。行人若问功名事，今岁龙门跳得身。',
    interpretation: '大吉 · 功名可成 · 顺势而上',
    fiveEl: '木',
    category: '学业',
    good: ['考试', '求名'],
    bad: ['懒惰'],
  },
  {
    num: 7,
    level: '上上',
    title: '金榜题名',
    poem: '金榜题名得意先，一朝衣锦便荣还。婚姻不必问凶吉，恰似明珠照夜圆。',
    interpretation: '上上签 · 功名成就 · 婚姻美满',
    fiveEl: '金',
    category: '学业',
    good: ['考试', '求名', '婚姻'],
    bad: ['自满'],
  },
  {
    num: 8,
    level: '中',
    title: '明月清风',
    poem: '明月清风处处闲，桃花尽日映前川。渔郎罢钓归家去，惊起沙鸥浪拍天。',
    interpretation: '平常心 · 不可执着',
    fiveEl: '水',
    category: '家宅',
    good: ['家宅', '休闲'],
    bad: ['贪求'],
  },
  {
    num: 9,
    level: '下',
    title: '守口如瓶',
    poem: '守口如瓶最妙哉，闲言莫说事关己。退后一步自然宽，免得今朝惹是非。',
    interpretation: '谨言慎行 · 退守为上',
    fiveEl: '土',
    category: '诉讼',
    good: ['退让', '守口'],
    bad: ['争执', '妄言'],
  },
  {
    num: 10,
    level: '上上',
    title: '一箭定坤',
    poem: '一箭定坤大有功，秦邦一统在胸中。从今四海同文轨，万国衣冠拜汉宫。',
    interpretation: '大吉 · 大事可成',
    fiveEl: '金',
    category: '事业',
    good: ['创业', '大业'],
    bad: ['犹豫'],
  },
  {
    num: 11,
    level: '中上',
    title: '不求自得',
    poem: '不求自得最为先，枉用机关反失前。守己待时休妄想，自然荣贵有天缘。',
    interpretation: '不求而得 · 守己待时',
    fiveEl: '火',
    category: '财运',
    good: ['守成', '机缘'],
    bad: ['妄求'],
  },
  {
    num: 12,
    level: '中',
    title: '浮云蔽日',
    poem: '浮云蔽日不分明，劝君莫急出门庭。退后一步自然安，切勿贪花被花嗔。',
    interpretation: '暂时不顺 · 退守为上',
    fiveEl: '水',
    category: '事业',
    good: ['退守', '等待'],
    bad: ['冒进', '争执'],
  },
  {
    num: 13,
    level: '上',
    title: '红日当天',
    poem: '红日当天万象新，锦衣玉带拜丹宸。莫辞今日多劳苦，明日荣华耀祖宗。',
    interpretation: '大吉 · 荣华显达',
    fiveEl: '火',
    category: '事业',
    good: ['仕途', '求名'],
    bad: ['急躁'],
  },
  {
    num: 14,
    level: '中上',
    title: '守旧待新',
    poem: '守旧待新有时辰，枯枝再发待春深。莫嫌今日运未至，时来运转便惊人。',
    interpretation: '守旧待新 · 必有转机',
    fiveEl: '土',
    category: '事业',
    good: ['守成', '等待'],
    bad: ['急躁'],
  },
  {
    num: 15,
    level: '上',
    title: '枯木开花',
    poem: '枯木开花早已迟，逢春一现是今时。从今再把新枝发，从此荣华万事宜。',
    interpretation: '转机已现 · 渐入佳境',
    fiveEl: '木',
    category: '财运',
    good: ['求财', '转行'],
    bad: ['犹豫'],
  },
  {
    num: 16,
    level: '上上',
    title: '万福来朝',
    poem: '万福来朝喜庆多，金枝玉叶满庭柯。寿山福海人难老，富贵荣华孰较多。',
    interpretation: '大吉 · 福寿双全',
    fiveEl: '土',
    category: '家宅',
    good: ['家宅', '求寿'],
    bad: ['贪婪'],
  },
  {
    num: 17,
    level: '中',
    title: '中平',
    poem: '中平之签不可轻，经营百事有前程。从来知足能长乐，守分安然心自宁。',
    interpretation: '中平 · 知足常乐',
    fiveEl: '土',
    category: '家宅',
    good: ['知足', '守分'],
    bad: ['奢求'],
  },
  {
    num: 18,
    level: '上',
    title: '中流砥柱',
    poem: '中流砥柱立江边，屹立狂澜不改变。任他东南西北风，独立中流不可撼。',
    interpretation: '大吉 · 坚守本分 · 终有所成',
    fiveEl: '土',
    category: '事业',
    good: ['坚守', '本职'],
    bad: ['动摇'],
  },
  {
    num: 19,
    level: '中上',
    title: '龙战于野',
    poem: '龙战于野血玄黄，争名夺利两相伤。莫如退步求安处，明月清风意味长。',
    interpretation: '不宜争竞 · 退守为上',
    fiveEl: '金',
    category: '诉讼',
    good: ['退让', '和解'],
    bad: ['争竞', '诉讼'],
  },
  {
    num: 20,
    level: '中',
    title: '桃李春风',
    poem: '桃李春风一杯酒，江湖夜雨十年灯。此情可待成追忆，前路漫漫更相亲。',
    interpretation: '人缘际会 · 友谊可期',
    fiveEl: '木',
    category: '婚恋',
    good: ['人际', '友谊'],
    bad: ['猜疑'],
  },
  {
    num: 21,
    level: '上',
    title: '松柏长青',
    poem: '松柏长青岁月长，寿山福海永无疆。莫言今日多劳苦，他年荣显姓名香。',
    interpretation: '大吉 · 健康长寿',
    fiveEl: '木',
    category: '健康',
    good: ['健康', '长寿'],
    bad: ['放纵'],
  },
  {
    num: 22,
    level: '中下',
    title: '守拙',
    poem: '守拙归田不自伤，躬耕陇亩度时光。世间万事皆前定，争竞徒劳枉断肠。',
    interpretation: '守拙 · 不争不竞',
    fiveEl: '土',
    category: '事业',
    good: ['守拙', '退让'],
    bad: ['争竞'],
  },
  {
    num: 23,
    level: '上',
    title: '鸿运当头',
    poem: '鸿运当头福气新，从今万事尽亨通。求财得财求子得，求官得位达天庭。',
    interpretation: '大吉 · 万事亨通',
    fiveEl: '火',
    category: '事业',
    good: ['求财', '求官', '求子'],
    bad: ['自满'],
  },
  {
    num: 24,
    level: '中',
    title: '雁过衡阳',
    poem: '雁过衡阳路不迷，北来南去有归期。行人若问家书至，明月何时照我衣。',
    interpretation: '远行可归 · 乡思可解',
    fiveEl: '金',
    category: '出行',
    good: ['远行', '归家'],
    bad: ['思虑'],
  },
  {
    num: 25,
    level: '上上',
    title: '独占鳌头',
    poem: '独占鳌头第一名，蟾宫折桂月宫行。从今不负青云志，万里鹏程指日成。',
    interpretation: '大吉 · 高科及第',
    fiveEl: '金',
    category: '学业',
    good: ['考试', '求名'],
    bad: ['自满'],
  },
  {
    num: 26,
    level: '中上',
    title: '水到渠成',
    poem: '水到渠成事自圆，功名成就待天缘。从今莫问兴衰事，顺水行舟自安然。',
    interpretation: '水到渠成 · 自然成就',
    fiveEl: '水',
    category: '事业',
    good: ['事业', '学问'],
    bad: ['急躁'],
  },
  {
    num: 27,
    level: '中',
    title: '浮云',
    poem: '浮云散尽月当空，莫被浮云误此中。退后一步自宽怀，何须强求万事通。',
    interpretation: '守心 · 不可执着',
    fiveEl: '水',
    category: '家宅',
    good: ['守心'],
    bad: ['贪求'],
  },
  {
    num: 28,
    level: '下',
    title: '孤雁',
    poem: '孤雁哀鸣独自飞，前行前路更凄其。莫言今日多蹇塞，犹恐明朝更可悲。',
    interpretation: '孤独 · 守静 · 待时',
    fiveEl: '金',
    category: '出行',
    good: ['守静'],
    bad: ['远行', '冒进'],
  },
  {
    num: 29,
    level: '中上',
    title: '玉出昆冈',
    poem: '玉出昆冈石有辉，待时琢磨自生辉。从今莫叹人未识，终有名扬四海时。',
    interpretation: '璞玉待琢 · 终有光辉',
    fiveEl: '土',
    category: '学业',
    good: ['学问', '技艺'],
    bad: ['自弃'],
  },
  {
    num: 30,
    level: '上',
    title: '风平浪静',
    poem: '风平浪静一帆舟，稳泛沧溟自在游。借问前途何日到，碧空云尽见高楼。',
    interpretation: '平安顺遂 · 稳步前进',
    fiveEl: '水',
    category: '出行',
    good: ['出行', '守成'],
    bad: ['冒进'],
  },
]

/**
 * 通过 seed 哈希稳定选择一签
 */
export function drawQian(seed?: number | string): Qian {
  const s = seed === undefined ? Math.random() : seed
  let h = 0
  if (typeof s === 'string') {
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  } else {
    h = s
  }
  const idx = Math.abs(h) % QIAN_DB.length
  return QIAN_DB[idx]!
}

/**
 * 按 level 筛选
 */
export function qianByLevel(level: QianLevel): Qian[] {
  return QIAN_DB.filter((q) => q.level === level)
}

/**
 * 按类别筛选
 */
export function qianByCategory(cat: Qian['category']): Qian[] {
  return QIAN_DB.filter((q) => q.category === cat)
}
