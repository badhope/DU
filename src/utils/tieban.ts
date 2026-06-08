/**
 * 铁板神数 · 高阶推算
 *
 * 铁板神数传统算法由"铁算子"邵雍（康节）所创，其核心为：
 *  1. 取先天数（生辰八字）
 *  2. 查数表得"母数"
 *  3. 母数 × 6 推算六亲
 *  4. 大运流年由母数加时间参数
 *
 * 本简化算法：
 *  - 母数 = 年 × 12 + 月 × 8 + 日 × 6 + 时 × 4
 *  - 父母数 = 母数 × 1
 *  - 兄弟数 = 母数 × 2
 *  - 妻子数 = 母数 × 3
 *  - 子女数 = 母数 × 4
 *  - 财位数 = 母数 × 5
 *  - 官位数 = 母数 × 6
 *
 * 推算：
 *  - 铁板神数断卦 → 由"数"取卦象 → 由卦象得断语
 *  - 大运 / 流年 → 由母数加时间参数
 */

import { calcBazi } from './bazi'

export interface TiebanShenGong {
  /** 先天八卦数 → 卦名 */
  key: string
  name: string // 卦名
  trigram: string // 上下卦
  poem: string // 断语诗
  career: string // 事业
  wealth: string // 财运
  relationship: string // 六亲
  health: string // 健康
  score: number // 0-100 总评
}

const GUA_64: Array<{
  name: string
  trigram: string
  poem: string
  career: string
  wealth: string
  relationship: string
  health: string
}> = [
  {
    name: '乾为天',
    trigram: '☰☰',
    poem: '乾刚健 · 纯阳之象 · 大通大达',
    career: '得领导之位 · 权威显达',
    wealth: '正财大旺 · 守成有道',
    relationship: '夫妻和顺 · 子女成器',
    health: '阳气过盛 · 防火伤',
  },
  {
    name: '坤为地',
    trigram: '☷☷',
    poem: '坤柔顺 · 厚德载物 · 母仪之象',
    career: '辅佐之功 · 教育文化',
    wealth: '积蓄有方 · 偏财不谋',
    relationship: '婚姻稳合 · 多子多福',
    health: '脾胃需养 · 忌寒湿',
  },
  {
    name: '屯',
    trigram: '☵☳',
    poem: '屯者 · 难也 · 始生之艰',
    career: '起步维艰 · 待机而动',
    wealth: '财来迟缓 · 守为上',
    relationship: '婚宜晚 · 不宜早',
    health: '少年多病 · 需谨慎',
  },
  {
    name: '蒙',
    trigram: '☶☵',
    poem: '蒙者 · 稚也 · 待学之象',
    career: '学以立身 · 师道重要',
    wealth: '靠学识取财',
    relationship: '童蒙之爱 · 纯真',
    health: '肾水需养',
  },
  {
    name: '需',
    trigram: '☵☰',
    poem: '需者 · 待也 · 饮食宴乐',
    career: '待时而动 · 自然亨通',
    wealth: '食禄有源 · 正财',
    relationship: '佳人可待',
    health: '饮食有节',
  },
  {
    name: '讼',
    trigram: '☰☵',
    poem: '讼者 · 争也 · 慎始慎终',
    career: '诉讼纷争 · 退让为上',
    wealth: '财因口舌散',
    relationship: '夫妻多争',
    health: '心气郁结',
  },
  {
    name: '师',
    trigram: '☵☷',
    poem: '师者 · 众也 · 军旅之象',
    career: '将帅之才 · 统领众人',
    wealth: '俸禄有源',
    relationship: '部属拥戴',
    health: '劳心费力',
  },
  {
    name: '比',
    trigram: '☷☵',
    poem: '比者 · 辅也 · 亲比之象',
    career: '贵人相扶 · 朋友得力',
    wealth: '合伙生财',
    relationship: '兄弟情深',
    health: '肾水需养',
  },
  {
    name: '小畜',
    trigram: '☴☰',
    poem: '小畜 · 密云不雨 · 蓄以待时',
    career: '小成大可期',
    wealth: '小积蓄财',
    relationship: '妻贤内助',
    health: '平顺',
  },
  {
    name: '履',
    trigram: '☰☱',
    poem: '履者 · 礼也 · 如履薄冰',
    career: '礼仪之职 · 外交',
    wealth: '财因礼尚',
    relationship: '亲而有礼',
    health: '注意足疾',
  },
  {
    name: '泰',
    trigram: '☷☰',
    poem: '泰者 · 通也 · 天地交泰',
    career: '大通大达 · 国泰民安',
    wealth: '财源滚滚',
    relationship: '家和万事兴',
    health: '身心舒畅',
  },
  {
    name: '否',
    trigram: '☰☷',
    poem: '否者 · 闭也 · 天地不交',
    career: '阻塞不通 · 静守',
    wealth: '财路塞滞',
    relationship: '夫妻隔阂',
    health: '气血郁滞',
  },
  {
    name: '同人',
    trigram: '☰☲',
    poem: '同人于野 · 同志相济',
    career: '合伙共事 · 大业可成',
    wealth: '合作生财',
    relationship: '同志之爱',
    health: '心火需平',
  },
  {
    name: '大有',
    trigram: '☲☰',
    poem: '大有 · 元亨 · 柔得尊位',
    career: '大有所得 · 名利双收',
    wealth: '大财可期',
    relationship: '贤妻良母',
    health: '心明眼亮',
  },
  {
    name: '谦',
    trigram: '☷☶',
    poem: '谦者 · 益也 · 满招损谦受益',
    career: '谦下可成大业',
    wealth: '不争而财自至',
    relationship: '谦和致祥',
    health: '脾胃健',
  },
  {
    name: '豫',
    trigram: '☳☷',
    poem: '豫者 · 乐也 · 雷出地奋',
    career: '奋发有为 · 自得其乐',
    wealth: '财因乐进',
    relationship: '安乐之家',
    health: '肝木舒达',
  },
  {
    name: '随',
    trigram: '☱☳',
    poem: '随者 · 从也 · 元亨利贞',
    career: '随机应变 · 随遇而安',
    wealth: '随财而至',
    relationship: '夫唱妇随',
    health: '肺金需润',
  },
  {
    name: '蛊',
    trigram: '☶☴',
    poem: '蛊者 · 事也 · 整治之象',
    career: '革故鼎新 · 整治旧业',
    wealth: '继承家业',
    relationship: '整顿家风',
    health: '脾胃虚',
  },
  {
    name: '临',
    trigram: '☷☱',
    poem: '临者 · 大也 · 渐进之势',
    career: '日渐上升',
    wealth: '财渐聚',
    relationship: '亲临之爱',
    health: '需养肺',
  },
  {
    name: '观',
    trigram: '☴☷',
    poem: '观者 · 望也 · 风行地上',
    career: '观察时势 · 旁观者清',
    wealth: '可观望之财',
    relationship: '观摩之爱',
    health: '风木需疏',
  },
  {
    name: '噬嗑',
    trigram: '☲☳',
    poem: '噬嗑 · 亨 · 利用狱',
    career: '决断是非 · 法律之业',
    wealth: '断狱之财',
    relationship: '决断情感',
    health: '火木需调',
  },
  {
    name: '贲',
    trigram: '☶☲',
    poem: '贲者 · 饰也 · 文饰之象',
    career: '文采斐然 · 装饰艺术',
    wealth: '文化生财',
    relationship: '文雅之爱',
    health: '心宁气和',
  },
  {
    name: '剥',
    trigram: '☶☷',
    poem: '剥者 · 落也 · 顺而止之',
    career: '小人不利 · 顺势而止',
    wealth: '防财散',
    relationship: '分离之象',
    health: '脾胃需养',
  },
  {
    name: '复',
    trigram: '☷☳',
    poem: '复者 · 反也 · 一阳来复',
    career: '重整旗鼓 · 转机在望',
    wealth: '失而复得',
    relationship: '破镜重圆',
    health: '生机初现',
  },
  {
    name: '无妄',
    trigram: '☰☳',
    poem: '无妄 · 大畜 · 天命不祐',
    career: '不妄动 · 顺天而行',
    wealth: '不谋之财',
    relationship: '不期而至',
    health: '天年所系',
  },
  {
    name: '大畜',
    trigram: '☶☰',
    poem: '大畜 · 刚健笃实 · 辉光日新',
    career: '大有积蓄 · 厚积薄发',
    wealth: '大积蓄财',
    relationship: '深恩厚爱',
    health: '肾精需固',
  },
  {
    name: '颐',
    trigram: '☶☳',
    poem: '颐者 · 养也 · 自养养人',
    career: '颐养之业 · 食禄',
    wealth: '因食得财',
    relationship: '颐养天年',
    health: '养身之本',
  },
  {
    name: '大过',
    trigram: '☱☴',
    poem: '大过 · 栋桡 · 非常之时',
    career: '非常之举 · 栋梁之材',
    wealth: '非常之财',
    relationship: '非常之爱',
    health: '脊柱需养',
  },
  {
    name: '坎',
    trigram: '☵☵',
    poem: '习坎 · 重险 · 诚信通神',
    career: '历险而成 · 险中求胜',
    wealth: '险中得财',
    relationship: '情深似海',
    health: '肾水需养 · 防险',
  },
  {
    name: '离',
    trigram: '☲☲',
    poem: '离者 · 丽也 · 光明之象',
    career: '依附明主 · 文化事业',
    wealth: '因名得财',
    relationship: '光明之爱',
    health: '心火需平',
  },
  {
    name: '咸',
    trigram: '☱☶',
    poem: '咸者 · 感也 · 二气感应',
    career: '感应而动 · 心灵之业',
    wealth: '感应财机',
    relationship: '感应而婚',
    health: '心肾相交',
  },
  {
    name: '恒',
    trigram: '☳☴',
    poem: '恒者 · 久也 · 雷风相与',
    career: '持之以恒 · 久而成业',
    wealth: '恒久之财',
    relationship: '白头偕老',
    health: '肝木需疏',
  },
  {
    name: '遁',
    trigram: '☰☶',
    poem: '遁者 · 退也 · 避世之象',
    career: '退避三舍 · 隐居',
    wealth: '退财保身',
    relationship: '避世出家',
    health: '清心寡欲',
  },
  {
    name: '大壮',
    trigram: '☳☰',
    poem: '大壮 · 利贞 · 阳气壮盛',
    career: '壮盛有为 · 大展宏图',
    wealth: '壮年大财',
    relationship: '壮盛之爱',
    health: '阳气过旺',
  },
  {
    name: '晋',
    trigram: '☲☷',
    poem: '晋者 · 进也 · 明出地上',
    career: '晋升之象 · 蒸蒸日上',
    wealth: '财进有路',
    relationship: '阳光之爱',
    health: '身心俱进',
  },
  {
    name: '明夷',
    trigram: '☷☲',
    poem: '明夷 · 韬光 · 自昭明德',
    career: '韬光养晦 · 待时',
    wealth: '暗蓄之财',
    relationship: '暗中之爱',
    health: '晦而求明',
  },
  {
    name: '家人',
    trigram: '☴☲',
    poem: '家人 · 利贞 · 治家之象',
    career: '治家有方 · 内助之功',
    wealth: '家财有道',
    relationship: '家和万事兴',
    health: '饮食有节',
  },
  {
    name: '睽',
    trigram: '☲☱',
    poem: '睽者 · 乖也 · 二女同居',
    career: '意见相左 · 另辟蹊径',
    wealth: '财分两端',
    relationship: '夫妻反目',
    health: '肺心需调',
  },
  {
    name: '蹇',
    trigram: '☵☶',
    poem: '蹇者 · 难也 · 外难内止',
    career: '艰难险阻 · 反身修德',
    wealth: '难中有财',
    relationship: '遇难呈祥',
    health: '肾水需养',
  },
  {
    name: '解',
    trigram: '☳☵',
    poem: '解者 · 缓也 · 赦过宥罪',
    career: '解困之机 · 赦免',
    wealth: '财厄解除',
    relationship: '误会冰消',
    health: '身心解放',
  },
  {
    name: '损',
    trigram: '☶☱',
    poem: '损者 · 益也 · 损下益上',
    career: '减损之道 · 反得其益',
    wealth: '损之反益',
    relationship: '损己利人',
    health: '肺气需养',
  },
  {
    name: '益',
    trigram: '☴☳',
    poem: '益 · 利有攸往 · 损上益下',
    career: '增益之象 · 大有作为',
    wealth: '增益之财',
    relationship: '有情人终成眷属',
    health: '身心增益',
  },
  {
    name: '夬',
    trigram: '☱☰',
    poem: '夬者 · 决也 · 刚决柔',
    career: '决断大事 · 一锤定音',
    wealth: '财因决断',
    relationship: '快刀斩乱麻',
    health: '肺金需润',
  },
  {
    name: '姤',
    trigram: '☰☴',
    poem: '姤者 · 遇也 · 阴气初生',
    career: '不期而遇',
    wealth: '偶得之财',
    relationship: '邂逅之爱',
    health: '风木需疏',
  },
  {
    name: '萃',
    trigram: '☱☷',
    poem: '萃者 · 聚也 · 聚集之象',
    career: '人才汇聚 · 百川归海',
    wealth: '财聚八方',
    relationship: '众人聚合',
    health: '肺气宜养',
  },
  {
    name: '升',
    trigram: '☷☴',
    poem: '升者 · 进也 · 上升之象',
    career: '步步高升',
    wealth: '财日进斗金',
    relationship: '婚姻上升',
    health: '肝木舒达',
  },
  {
    name: '困',
    trigram: '☱☵',
    poem: '困者 · 穷也 · 泽无水',
    career: '困顿之极 · 必有后福',
    wealth: '财困待时',
    relationship: '困境相依',
    health: '肾水需养',
  },
  {
    name: '井',
    trigram: '☵☴',
    poem: '井者 · 养也 · 劳而不穷',
    career: '井养之德 · 滋养众人',
    wealth: '井水长流',
    relationship: '井市之爱',
    health: '肾水充沛',
  },
  {
    name: '革',
    trigram: '☱☲',
    poem: '革 · 巳日乃孚 · 革故鼎新',
    career: '革新之机 · 革命之业',
    wealth: '革旧取财',
    relationship: '革心洗面',
    health: '心肺需调',
  },
  {
    name: '鼎',
    trigram: '☲☴',
    poem: '鼎者 · 器也 · 三足鼎立',
    career: '鼎足之业 · 三权分立',
    wealth: '鼎食之富',
    relationship: '婚姻鼎盛',
    health: '脾胃需养',
  },
  {
    name: '震',
    trigram: '☳☳',
    poem: '震者 · 动也 · 震惊百里',
    career: '雷厉风行 · 警世之业',
    wealth: '动中取财',
    relationship: '震动之爱',
    health: '肝木需疏',
  },
  {
    name: '艮',
    trigram: '☶☶',
    poem: '艮者 · 止也 · 时止则止',
    career: '止于至善',
    wealth: '止财不散',
    relationship: '止于礼义',
    health: '脾胃养',
  },
  {
    name: '渐',
    trigram: '☴☶',
    poem: '渐者 · 进也 · 循序渐进',
    career: '循序而进 · 渐入佳境',
    wealth: '渐聚之财',
    relationship: '渐进之爱',
    health: '风木渐长',
  },
  {
    name: '归妹',
    trigram: '☳☱',
    poem: '归妹 · 凶 · 终以大过',
    career: '宜守不宜进',
    wealth: '偏财慎取',
    relationship: '婚姻宜慎',
    health: '肝肺需调',
  },
  {
    name: '丰',
    trigram: '☲☳',
    poem: '丰者 · 大也 · 盛大之象',
    career: '丰盛有为 · 大展宏图',
    wealth: '丰财足用',
    relationship: '丰盈之爱',
    health: '心明眼亮',
  },
  {
    name: '旅',
    trigram: '☶☲',
    poem: '旅者 · 客也 · 羁旅之象',
    career: '漂泊之旅 · 商旅之业',
    wealth: '客中之财',
    relationship: '旅中之爱',
    health: '火明无依',
  },
  {
    name: '巽',
    trigram: '☴☴',
    poem: '巽者 · 入也 · 谦逊之象',
    career: '谦下而入 · 文教',
    wealth: '随风而聚',
    relationship: '随风入怀',
    health: '风木需疏',
  },
  {
    name: '兑',
    trigram: '☱☱',
    poem: '兑者 · 悦也 · 喜悦之象',
    career: '口才之业 · 喜悦之事',
    wealth: '口福之财',
    relationship: '悦情之爱',
    health: '肺金需润',
  },
  {
    name: '涣',
    trigram: '☴☵',
    poem: '涣者 · 散也 · 风行水上',
    career: '散而有章 · 流动之业',
    wealth: '财来财去',
    relationship: '离散之爱',
    health: '肾水需养',
  },
  {
    name: '节',
    trigram: '☱☵',
    poem: '节 · 亨 · 苦节不可贞',
    career: '节制之道 · 量入为出',
    wealth: '节财有道',
    relationship: '节制有度',
    health: '肺肾需调',
  },
  {
    name: '中孚',
    trigram: '☴☱',
    poem: '中孚 · 豚鱼吉 · 信及豚鱼',
    career: '诚信立业 · 中正之业',
    wealth: '信中之财',
    relationship: '诚信相爱',
    health: '心肾相交',
  },
  {
    name: '小过',
    trigram: '☳☶',
    poem: '小过 · 亨 · 飞鸟遗音',
    career: '小有过度 · 慎行',
    wealth: '小过之财',
    relationship: '小事不忍',
    health: '肝脾需调',
  },
  {
    name: '既济',
    trigram: '☵☲',
    poem: '既济 · 亨小 · 初吉终乱',
    career: '已成之业 · 守成',
    wealth: '财已收',
    relationship: '已成之爱',
    health: '心肾需调',
  },
  {
    name: '未济',
    trigram: '☲☵',
    poem: '未济 · 亨 · 小狐汔济',
    career: '未成之业 · 待机',
    wealth: '财在未来',
    relationship: '未成之爱',
    health: '终有成就',
  },
]

/**
 * 计算母数
 * 母数 = 年 × 12 + 月 × 8 + 日 × 6 + 时 × 4
 */
export function calcMuShu(year: number, month: number, day: number, hour: number): number {
  return (year * 12 + month * 8 + day * 6 + hour * 4) % 64
}

/**
 * 推算六亲数
 */
export function calcLiuQin(muShu: number): {
  fuMu: number
  xiongDi: number
  qiZi: number
  ziNu: number
  caiWei: number
  guanWei: number
} {
  return {
    fuMu: (muShu * 1) % 64,
    xiongDi: (muShu * 2) % 64,
    qiZi: (muShu * 3) % 64,
    ziNu: (muShu * 4) % 64,
    caiWei: (muShu * 5) % 64,
    guanWei: (muShu * 6) % 64,
  }
}

export interface TiebanResult {
  year: number
  month: number
  day: number
  hour: number
  muShu: number
  benGua: TiebanShenGong
  liuQin: {
    label: string
    num: number
    gua: TiebanShenGong
  }[]
  score: number
  summary: string
  yearly: Array<{
    age: number
    year: number
    gua: TiebanShenGong
    level: '大吉' | '吉' | '平' | '凶' | '大凶'
  }>
}

const LIUQIN_LABELS: Array<[keyof ReturnType<typeof calcLiuQin>, string]> = [
  ['fuMu', '父母'],
  ['xiongDi', '兄弟'],
  ['qiZi', '妻子'],
  ['ziNu', '子女'],
  ['caiWei', '财位'],
  ['guanWei', '官位'],
]

/**
 * 完整铁板神数排盘
 */
export function calcTieban(year: number, month: number, day: number, hour: number): TiebanResult {
  const muShu = calcMuShu(year, month, day, hour)
  const liuQinNums = calcLiuQin(muShu)

  const benGua = _gua(muShu)
  const liuQin = LIUQIN_LABELS.map(([key, label]) => {
    const num = liuQinNums[key]
    return { label, num, gua: _gua(num) }
  })

  // 6 宫总评
  const avgScore = Math.round(
    (benGua.score + liuQin.reduce((s, q) => s + q.gua.score, 0) / liuQin.length) / 2,
  )

  // 流年（10 年）
  const currentYear = new Date().getFullYear()
  const ageStart = currentYear - year
  const yearly: TiebanResult['yearly'] = []
  for (let i = 0; i < 10; i++) {
    const yr = currentYear + i
    const age = ageStart + i
    const num = (muShu + i * 7) % 64
    const g = _gua(num)
    yearly.push({
      age,
      year: yr,
      gua: g,
      level: _level(g.score),
    })
  }

  return {
    year,
    month,
    day,
    hour,
    muShu,
    benGua,
    liuQin,
    score: avgScore,
    summary: `母数 ${muShu} · 本卦 ${benGua.name}（${benGua.trigram}）· ${benGua.poem}。六亲皆有所主，五维总评 ${avgScore} 分。`,
    yearly,
  }
}

function _gua(num: number): TiebanShenGong {
  const g = GUA_64[num % 64]
  return {
    key: g.name,
    name: g.name,
    trigram: g.trigram,
    poem: g.poem,
    career: g.career,
    wealth: g.wealth,
    relationship: g.relationship,
    health: g.health,
    score: _guaScore(num),
  }
}

function _guaScore(num: number): number {
  // 大致按卦序排分，64 卦分数递增，最高 100
  return 50 + ((num * 51) % 51)
}

function _level(score: number): '大吉' | '吉' | '平' | '凶' | '大凶' {
  if (score >= 90) return '大吉'
  if (score >= 75) return '吉'
  if (score >= 55) return '平'
  if (score >= 35) return '凶'
  return '大凶'
}
