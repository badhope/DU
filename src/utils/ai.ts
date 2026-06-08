/** 6 位 AI 师：共享关键词匹配 + 模板拼接的本地对话引擎 */

export type MasterKey = 'ai-gua' | 'ai-ming' | 'ai-feng' | 'ai-name' | 'ai-jiankang' | 'ai-xiuxin'

import { kangxiStrokes } from './kangxi-strokes'

export interface MasterMeta {
  key: MasterKey
  name: string       // 师名
  glyph: string      // 图腾
  color: string
  greeting: string   // 见面礼
  farewell: string   // 告别语
  domain: string[]   // 专业领域
  style: string      // 表达风格
  desc: string       // 介绍
}

export const MASTERS: Record<MasterKey, MasterMeta> = {
  'ai-gua': {
    key: 'ai-gua', name: '解卦师', glyph: '卦', color: '#5B3A8E',
    greeting: '卦象无形 · 大道有名',
    farewell: '卦终万象 · 愿君明心',
    domain: ['周易', '六爻', '梅花易数', '签诗', '占卜'],
    style: '深沉 · 玄远 · 善引经据典',
    desc: '专研周易五十之卦 · 善用易理解读人事 · 凡问必答。',
  },
  'ai-ming': {
    key: 'ai-ming', name: '命理师', glyph: '命', color: '#8B1F1A',
    greeting: '一命二运三风水',
    farewell: '命由天定 · 运由己造',
    domain: ['八字', '紫微', '星盘', '流年', '大运'],
    style: '严谨 · 细腻 · 长于分析',
    desc: '通晓八字紫微星盘三大体系 · 擅看命理结构。',
  },
  'ai-feng': {
    key: 'ai-feng', name: '风水师', glyph: '风', color: '#1F4E4A',
    greeting: '藏风聚气 · 山水有情',
    farewell: '气顺人和 · 家宅安宁',
    domain: ['阳宅', '玄空飞星', '八宅', '罗盘'],
    style: '务实 · 直白 · 善布局',
    desc: '精研阳宅八宅玄空三大派 · 注重实际布局调整。',
  },
  'ai-name': {
    key: 'ai-name', name: '起名师', glyph: '名', color: '#D4AF37',
    greeting: '名以载道 · 字以传神',
    farewell: '好名相伴 · 一生顺遂',
    domain: ['生辰八字', '三才五格', '汉字音形义'],
    style: '文雅 · 严谨 · 重音律',
    desc: '深谙姓名学三才五格 · 注重字音字形字义。',
  },
  'ai-jiankang': {
    key: 'ai-jiankang', name: '健康师', glyph: '健', color: '#4FAE6F',
    greeting: '上工治未病',
    farewell: '饮食有节 · 起居有常',
    domain: ['节气养生', '体质', '经络', '食疗'],
    style: '温和 · 实用 · 重养护',
    desc: '通晓中医节气体质 · 提倡未病先防。',
  },
  'ai-xiuxin': {
    key: 'ai-xiuxin', name: '修心师', glyph: '心', color: '#5B3A8E',
    greeting: '心安即是归处',
    farewell: '静观其变 · 心如止水',
    domain: ['禅修', '坐禅', '冥想', '内观', '调息'],
    style: '慈柔 · 智慧 · 善引导',
    desc: '专研禅修与内观 · 善以话术引人入静。',
  },
}

export interface ChatMessage {
  role: 'user' | 'master'
  text: string
  time: number
  /** 可选引用 */
  cite?: string
}

// ============ 知识库 ============

const KUA: Record<string, string> = {
  乾: '乾为天 · 刚健中正 · 象征龙腾虎跃 · 大业可成',
  坤: '坤为地 · 厚德载物 · 象征包容与母仪',
  屯: '屯者难生 · 起步维艰 · 待机而动',
  蒙: '蒙者稚也 · 求学问道 · 待师指点',
  需: '需者待也 · 守正待时 · 必有亨通',
  讼: '讼者争也 · 争讼之象 · 退让为上',
  比: '比者亲也 · 亲比之象 · 朋友得力',
  师: '师者众也 · 军旅之象 · 统众之力',
  履: '履者礼也 · 如履薄冰 · 礼仪之职',
  泰: '泰者通也 · 天地交泰 · 万事亨通',
  否: '否者闭也 · 天地不交 · 静守待变',
  同人: '同人于野 · 同志相济 · 大业可成',
  大有: '大有元亨 · 大有所得 · 名利双收',
  谦: '谦谦君子 · 满招损谦受益',
  豫: '豫者乐也 · 雷出地奋 · 奋发有为',
  随: '随者从也 · 随机应变 · 随遇而安',
  蛊: '蛊者事也 · 革故鼎新 · 整治旧业',
  临: '临者大也 · 日渐上升',
  观: '观者望也 · 观察时势 · 旁观者清',
  噬嗑: '噬嗑亨 · 决断是非 · 雷厉风行',
  贲: '贲者饰也 · 文饰之象 · 文采斐然',
  剥: '剥者落也 · 顺而止之 · 不可妄动',
  复: '复者反也 · 一阳来复 · 转机在望',
  无妄: '无妄 · 不妄动 · 顺天而行',
  大畜: '大畜 · 刚健笃实 · 厚积薄发',
  颐: '颐者养也 · 自养养人',
  大过: '大过 · 栋桡 · 非常之时',
  坎: '习坎 · 重险 · 诚信通神',
  离: '离者丽也 · 光明之象',
  咸: '咸者感也 · 二气感应',
  恒: '恒者久也 · 雷风相与',
  遁: '遁者退也 · 避世之象',
  大壮: '大壮 · 阳气壮盛 · 慎用其壮',
  晋: '晋者进也 · 明出地上',
  明夷: '明夷 · 韬光 · 自昭明德',
  家人: '家人 · 利贞 · 治家之象',
  睽: '睽者乖也 · 二女同居',
  蹇: '蹇者难也 · 外难内止',
  解: '解者缓也 · 赦过宥罪',
  损: '损者益也 · 损下益上',
  益: '益 · 损上益下',
  夬: '夬者决也 · 刚决柔',
  姤: '姤者遇也 · 阴气初生',
  萃: '萃者聚也 · 聚集之象',
  升: '升者进也 · 上升之象',
  困: '困者穷也 · 泽无水',
  井: '井者养也 · 劳而不穷',
  革: '革 · 革故鼎新',
  鼎: '鼎者器也 · 三足鼎立',
  震: '震者动也 · 震惊百里',
  艮: '艮者止也 · 时止则止',
  渐: '渐者进也 · 循序渐进',
  归妹: '归妹 · 宜守不宜进',
  丰: '丰者大也 · 盛大之象',
  旅: '旅者客也 · 羁旅之象',
  巽: '巽者入也 · 谦逊之象',
  兑: '兑者悦也 · 喜悦之象',
  涣: '涣者散也 · 风行水上',
  节: '节 · 苦节不可贞',
  中孚: '中孚 · 信及豚鱼',
  小过: '小过 · 飞鸟遗音',
  既济: '既济 · 亨小 · 初吉终乱',
  未济: '未济 · 亨 · 小狐汔济',
}

const SEX: Record<string, string> = {
  甲: '甲木参天 · 大树之木 · 栋梁之才',
  乙: '乙木花草 · 柔韧之木 · 才艺出众',
  丙: '丙火太阳 · 光明磊落 · 照耀万物',
  丁: '丁火灯烛 · 温暖明亮 · 文雅之火',
  戊: '戊土高山 · 厚重如山 · 包容万物',
  己: '己土田园 · 滋养万物 · 母仪之德',
  庚: '庚金刀剑 · 刚毅果断 · 改革之力',
  辛: '辛金珠玉 · 温润精致 · 审美之金',
  壬: '壬水江河 · 浩瀚奔流 · 大度之水',
  癸: '癸水雨露 · 细腻滋润 · 灵性之水',
}

const ZHI_DESC: Record<string, string> = {
  子: '子水 · 智慧灵动 · 喜神秘',
  丑: '丑土 · 勤恳踏实 · 重实务',
  寅: '寅木 · 勇猛精进 · 主开创',
  卯: '卯木 · 柔和仁慈 · 主文雅',
  辰: '辰土 · 充满变数 · 多才多艺',
  巳: '巳火 · 聪明敏锐 · 多变幻',
  午: '午火 · 热情奔放 · 主礼仪',
  未: '未土 · 温顺多情 · 主艺术',
  申: '申金 · 灵活机变 · 主进取',
  酉: '酉金 · 收敛内聚 · 主精致',
  戌: '戌土 · 忠诚守义 · 主守护',
  亥: '亥水 · 智慧深沉 · 主哲学',
}

const WUXING_DESC: Record<string, string> = {
  金: '金主义 · 主肺 · 应西方 · 秋季',
  木: '木主仁 · 主肝 · 应东方 · 春季',
  水: '水主智 · 主肾 · 应北方 · 冬季',
  火: '火主礼 · 主心 · 应南方 · 夏季',
  土: '土主信 · 主脾 · 应中央 · 长夏',
}

// 风水方位吉凶
const FENG_DIR: Record<string, string> = {
  '东': '东方属木 · 主生发 · 宜动',
  '南': '南方属火 · 主文明 · 宜文',
  '西': '西方属金 · 主收获 · 宜静',
  '北': '北方属水 · 主智慧 · 宜藏',
  '东南': '东南属木 · 主文昌 · 宜学',
  '东北': '东北属土 · 主稳定 · 宜守',
  '西南': '西南属土 · 主坤德 · 宜柔',
  '西北': '西北属金 · 主天门 · 宜动',
  '中': '中央属土 · 主中正 · 宜平衡',
}

const FENG_5ELE: Record<string, string> = {
  '1': '一白贪狼星 · 主导官运文昌',
  '2': '二黑巨门星 · 主病符 · 需化解',
  '3': '三碧禄存星 · 主口舌是非',
  '4': '四绿文曲星 · 主文昌 · 利读书',
  '5': '五黄廉贞星 · 大煞 · 不可动土',
  '6': '六白武曲星 · 主偏财 · 利经营',
  '7': '七赤破军星 · 主盗贼 · 需防',
  '8': '八白左辅星 · 主正财 · 旺丁',
  '9': '九紫右弼星 · 主喜庆 · 利婚恋',
}

// 起名常用字
const NAME_CHARS = {
  male: ['梓', '宇', '浩', '轩', '瑞', '博', '俊', '昊', '子', '一', '泽', '思', '文', '鸿', '志', '国', '建', '嘉', '明', '俊', '林', '天', '德', '弘', '奕', '景', '睿', '哲', '宇', '霖'],
  female: ['梓', '欣', '怡', '雨', '彤', '悦', '诗', '涵', '雅', '梦', '思', '语', '柔', '清', '颖', '雯', '瑶', '蕊', '玥', '琪', '昕', '若', '茜', '彤', '心', '晨', '月', '可', '若', '宁'],
}

const HEALTH_TIPS: Record<string, string> = {
  '春': '春属木 · 主肝 · 宜疏肝理气 · 少酸多甘',
  '夏': '夏属火 · 主心 · 宜清热养心 · 静心安神',
  '秋': '秋属金 · 主肺 · 宜润肺生津 · 白色食物',
  '冬': '冬属水 · 主肾 · 宜补肾藏精 · 黑色食物',
  '长夏': '长夏属土 · 主脾 · 宜健脾化湿 · 黄色食物',
}

const ZEN_QUOTES: string[] = [
  '心如止水 · 鉴常明',
  '万法皆空 · 因果不空',
  '一花一世界 · 一叶一菩提',
  '行到水穷处 · 坐看云起时',
  '本来无一物 · 何处惹尘埃',
  '风来疏竹 · 风过而竹不留声',
  '雁过长空 · 影沉寒水 · 雁无遗踪之意',
  '即心即佛 · 非心非佛',
  '了即业障本来空 · 未了应须还宿债',
  '心若清净 · 何处惹尘埃',
]

// ============ 6 师对话生成 ============

interface BuildContext {
  question: string
  /** 个人档案（接受多种形态：year/month/day/hour 或 birthYear/birthMonth/birthDay/birthHour） */
  profile?: {
    year?: number
    month?: number
    day?: number
    hour?: number
    birthYear?: number
    birthMonth?: number
    birthDay?: number
    birthHour?: number
    gender?: string
    nickname?: string
    [key: string]: any
  } | null
  prevMessages?: ChatMessage[]
  /** 上下文摘要（askMaster 自动注入） */
  _context?: ContextSummary
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

// AI 解卦师
export function aiGuaReply(ctx: BuildContext): ChatMessage {
  const q = ctx.question
  // 多轮衔接
  const isFollowUp = (ctx._context?.turnCount || 0) > 0
  const theme = ctx._context?.themes?.[0] || ''
  // 尝试匹配卦名
  let cite = ''
  for (const k of Object.keys(KUA)) {
    if (q.includes(k)) { cite = `【${k}】${KUA[k]}`; break }
  }
  // 关键词
  if (!cite) {
    if (q.match(/财|钱|财富/)) cite = '【坎为水】财者水也 · 流动方能聚 · 坎中求'
    else if (q.match(/事业|工作|官|学业/)) cite = '【乾为天】天行健 · 君子以自强不息'
    else if (q.match(/感情|婚|恋|桃花/)) cite = '【咸卦】二气感应 · 感应而动'
    else if (q.match(/健康|病|身/)) cite = '【颐卦】颐养天年 · 自养养人'
    else if (q.match(/家|宅|迁|住/)) cite = '【家人】治家有方 · 内外分明'
  }
  const prefix = isFollowUp ? `承 君 前 问 · 续 解 如 下\n\n（已与君论 ${ctx._context?.turnCount || 0} 轮 · 主题「${theme}」）\n\n` : ''
  const templates: string[] = [
    `${prefix}吾观此问 · 卦象已现 · ${cite || '万事皆有其时'}\n\n请君细思：所问之事，最在意者何？若为眼前，则观眼下之象；若为长久，则察时机之变。`,
    `${prefix}解卦之要 · 不在卦象本身 · 在于时位之辨。\n\n${cite || '卦不可拘 · 变在其中'}\n\n君此问 · 应在 ${pick(['春', '夏', '秋', '冬'])} 之季见分晓。`,
    `${prefix}卦者 · 时也 · 位也 · 应也。\n\n${cite || '卦象初明'}\n\n吾为君参详：当下宜 ${pick(['守正待时', '主动出击', '退一步海阔天空', '借力使力'])}，勿 ${pick(['急躁冒进', '犹豫不决', '听信谣言', '贪小失大'])}。`,
  ]
  return { role: 'master', text: pick(templates), time: Date.now(), cite }
}

// AI 命理师
export function aiMingReply(ctx: BuildContext): ChatMessage {
  const q = ctx.question
  const isFollowUp = (ctx._context?.turnCount || 0) > 0
  const theme = ctx._context?.themes?.[0] || ''
  // 提取八字要素
  const ya = ctx.profile?.birthYear || ctx.profile?.year
  const mo = ctx.profile?.birthMonth || ctx.profile?.month
  const da = ctx.profile?.birthDay || ctx.profile?.day
  const hu = ctx.profile?.birthHour || ctx.profile?.hour
  let profileStr = ''
  if (ya && mo && da) {
    profileStr = `（${ya}年${mo}月${da}日${hu ?? '?'}时）`
  }
  let cite = ''
  if (q.match(/事业|官|工作|升|考/)) cite = '《滴天髓》官星者 · 荣身之物 · 身旺任之'
  else if (q.match(/财|钱|富/)) cite = '《穷通宝鉴》财为我克 · 身旺财旺方为真'
  else if (q.match(/婚|恋|对象|桃花/)) cite = '《子平真诠》男命财星 · 女命官星 · 配合有情'
  else if (q.match(/健康|病|寿/)) cite = '《滴天髓》调候者 · 调济寒暖燥湿 · 是为用神'
  else if (q.match(/学|考试|读书/)) cite = '《子平真诠》印星者 · 生我之神 · 学术之象'
  else cite = '《滴天髓》 · 一命二运三风水 · 四积阴德五读书'
  const prefix = isFollowUp ? `承 君 前 问 · 续 论 命 理 如 下\n\n（已与君论 ${ctx._context?.turnCount || 0} 轮 · 主题「${theme}」）\n\n` : ''
  const text = `${prefix}${profileStr ? `观君${profileStr}之造 · ` : ''}${cite}。\n\n${pick([
    '命由天定 · 运由己造 · 但行好事 · 莫问前程。',
    '格局高低 · 看用神之有情无情。',
    '行运十年一转 · 顺之者昌 · 逆之者困。',
    '一命二运三风水 · 命者先天 · 运者后天 · 风水者居处之变。',
  ])}\n\n${pick([
    '吾为君参详：',
    '细论如下：',
    '为君一解：',
  ])}${pick([
    '宜东方木运 · 可补命中所缺。',
    '此季当稳 · 待时而动方为上策。',
    '身旺用财 · 财运可期。',
    '伤官见官 · 谨言慎行。',
  ])}`
  return { role: 'master', text, time: Date.now(), cite }
}

// AI 风水师
export function aiFengReply(ctx: BuildContext): ChatMessage {
  const q = ctx.question
  const isFollowUp = (ctx._context?.turnCount || 0) > 0
  const theme = ctx._context?.themes?.[0] || ''
  const prefix = isFollowUp ? `承 君 前 问 · 续 论 风 水 如 下\n\n（已与君论 ${ctx._context?.turnCount || 0} 轮 · 主题「${theme}」）\n\n` : ''
  let cite = ''
  for (const d of Object.keys(FENG_DIR)) {
    if (q.includes(d)) { cite = FENG_DIR[d]; break }
  }
  for (const s of Object.keys(FENG_5ELE)) {
    if (q.includes(`${s}运`) || q.includes(FENG_5ELE[s].split('·')[0].trim())) {
      cite = FENG_5ELE[s]; break
    }
  }
  if (!cite) {
    if (q.match(/客厅|沙发|坐|主位/)) cite = '【客厅主位】宜背有靠 · 视野开阔 · 不宜背窗'
    else if (q.match(/卧|床|睡/)) cite = '【卧室】床宜南北向 · 头有靠 · 不宜对门'
    else if (q.match(/书|办公|学习/)) cite = '【书房】宜文昌位 · 东南最佳 · 案头整洁'
    else if (q.match(/厨|灶|火/)) cite = '【厨房】灶位宜藏风聚气 · 不宜对门对窗'
    else if (q.match(/门|大|玄关/)) cite = '【大门】宜向生气方 · 不宜对楼梯电梯'
  }
  const templates: string[] = [
    `${prefix}风水之要 · 在于藏风聚气。\n\n${cite || '请君描述宅之坐向'}\n\n吾观君所问 · 应 ${pick(['调整主卧', '调整客厅', '调整书房', '调整大门'])} 方位布局。具体：${pick(['东墙宜放木', '南墙宜简洁', '西墙不宜动', '北墙宜安'])}。`,
    `${prefix}阳宅之学 · 三要点：门 · 主 · 灶。\n\n${cite || '阳宅三要'}\n\n君之问 · 应注意：1. 大门宜开在 ${pick(['东南', '正南', '正北'])}；2. 主卧宜在 ${pick(['西北', '西南', '正南'])}；3. 灶位不宜对门。`,
    `${prefix}玄空飞星 · 注重时运。\n\n${cite || '运星轮转'}\n\n${pick([
    '2024 后入下元 9 运 · 喜事主导',
    '2024-2043 离卦当运 · 火气旺盛',
    '八白财星刚退 · 九紫喜庆正来',
    '当下飞星 1 旺 · 文昌可催',
  ])}\n\n君可据此调整布局。`,
  ]
  return { role: 'master', text: pick(templates), time: Date.now(), cite }
}

// AI 起名师
export function aiNameReply(ctx: BuildContext): ChatMessage {
  const q = ctx.question
  const isFollowUp = (ctx._context?.turnCount || 0) > 0
  const theme = ctx._context?.themes?.[0] || ''
  const prefix = isFollowUp ? `承 君 前 问 · 续 起 名 如 下\n\n（已与君论 ${ctx._context?.turnCount || 0} 轮 · 主题「${theme}」）\n\n` : ''
  let name = ''
  // 提取姓氏（首字）
  const surname = q.match(/姓([\u4e00-\u9fa5])/)?.[1] || '王'
  const gender = q.match(/男|公子|少侠/) ? 'male' : q.match(/女|姑娘|小姐/) ? 'female' : (ctx.profile?.gender === '女' ? 'female' : 'male')
  const chars = NAME_CHARS[gender]
  // 循环生成至找到一个五格大吉的候选名
  let nameCandidate = ''
  let wuge = { tian: 0, ren: 0, di: 0, wai: 0, zong: 0 }
  let bestGood = 0
  let bestCandidate = ''
  for (let attempt = 0; attempt < 18; attempt++) {
    const c1 = chars[Math.floor(Math.random() * chars.length)]
    const c2 = chars[Math.floor(Math.random() * chars.length)]
    const cand = `${surname}${c1}${c2}`
    const w = calcWuGe(cand)
    const goodCount = ([w.tian, w.ren, w.di, w.wai, w.zong] as number[])
      .map(n => (wugeLevel(n).level === '吉' ? 1 : 0) as number)
      .reduce((a, b) => a + b, 0)
    if (goodCount > bestGood) {
      bestGood = goodCount
      bestCandidate = cand
      wuge = w
      if (goodCount >= 3) {
        nameCandidate = cand
        break
      }
    }
  }
  if (!nameCandidate) nameCandidate = bestCandidate || `${surname}${chars[0]}${chars[1]}`
  if (!bestCandidate) wuge = calcWuGe(nameCandidate)
  // 五格吉凶（用真函数）
  const renGe = wugeLevel(wuge.ren)
  const diGe = wugeLevel(wuge.di)
  const zongGe = wugeLevel(wuge.zong)
  const tianGe = wugeLevel(wuge.tian)
  const waiGe = wugeLevel(wuge.wai)
  const totalGood = [tianGe, renGe, diGe, waiGe, zongGe].filter(g => g.level === '吉').length
  const judgement = totalGood >= 3 ? '大吉之数 · 可取' : totalGood >= 2 ? '中吉之数 · 可用' : '平淡之数 · 仅供参考'
  const cite = `【${nameCandidate}】天格${wuge.tian}(${tianGe.level})· 人格${wuge.ren}(${renGe.level})· 地格${wuge.di}(${diGe.level})· 外格${wuge.wai}(${waiGe.level})· 总格${wuge.zong}(${zongGe.level})`
  const templates: string[] = [
    `${prefix}名以载道 · 字以传神。\n\n${cite}\n\n五格判词 · ${judgement}\n· 人格 ${wuge.ren} → ${renGe.desc}\n· 地格 ${wuge.di} → ${diGe.desc}\n· 总格 ${wuge.zong} → ${zongGe.desc}\n\n三才配置 · ${pick(['木火通明 · 主文昌', '土金相生 · 利事业', '水木清华 · 利学业', '金水相涵 · 利财官'])}\n\n君可参考。`,
    `${prefix}起名之学 · 重三才五格。\n\n${cite}\n\n${judgement}。\n\n五行方面 · 此名${pick(['喜用木 · 名中已含', '喜用火 · 名中已含', '喜用土 · 名中已含', '喜用金 · 名中已含', '喜用水 · 名中已含'])}。\n\n起名时 · 必避 ${pick(['生僻字', '谐音不佳', '笔画过重', '字形不美'])}。`,
    `${prefix}名之好坏 · 关系一生。\n\n${cite}\n\n吾参详此名 · ${judgement}\n\n音形义 · ${pick(['音韵铿锵 · 朗朗上口', '字形端庄 · 笔画有致', '字义深远 · 内蕴丰厚', '形神兼备 · 寓意吉祥'])}\n\n${pick(['利事业 · 可大展宏图', '利学业 · 主文昌显达', '利姻缘 · 主家室和合', '利财运 · 主进财有道'])}。`,
  ]
  return { role: 'master', text: pick(templates), time: Date.now(), cite }
}

function calcWuGe(name: string): { tian: number; ren: number; di: number; wai: number; zong: number } {
  // 完整康熙字典五格计算（用 kangxi-strokes 查表）
  // 复姓识别：欧阳、司马、诸葛、上官、东方、皇甫、尉迟、司徒、公孙、令狐
  const complexSurnames = ['欧阳', '司马', '诸葛', '上官', '东方', '皇甫', '尉迟', '司徒', '公孙', '令狐', '慕容', '长孙']
  const chars = name.split('')
  if (chars.length < 2) {
    return { tian: 1, ren: 1, di: 1, wai: 1, zong: 1 }
  }
  // 查找复姓
  let surnameLen = 1
  for (const cs of complexSurnames) {
    if (name.startsWith(cs)) {
      surnameLen = cs.length
      break
    }
  }
  const surnameChars = chars.slice(0, surnameLen)
  const givenChars = chars.slice(surnameLen)
  if (givenChars.length === 0) {
    return { tian: 1, ren: 1, di: 1, wai: 1, zong: 1 }
  }
  const strokes = [...surnameChars, ...givenChars].map(c => kangxiStrokes(c))
  const surnameStrokes = strokes.slice(0, surnameLen).reduce((a, b) => a + b, 0)
  const givenStrokes = strokes.slice(surnameLen).reduce((a, b) => a + b, 0)
  const totalStrokes = surnameStrokes + givenStrokes
  // 单姓：天格 = 姓笔画 + 1
  // 复姓：天格 = 复姓所有字笔画之和
  const tian = surnameLen === 1 ? surnameStrokes + 1 : surnameStrokes
  // 人格 = 姓最后一字 + 名第一字
  const ren = surnameStrokes + (givenChars.length > 0 ? kangxiStrokes(givenChars[0]) : 0)
  // 地格 = 名所有字笔画之和（单名 + 1）
  const di = givenChars.length === 1 ? kangxiStrokes(givenChars[0]) + 1 : givenStrokes
  // 外格 = 总 - 人 + 1
  const wai = Math.max(1, totalStrokes - ren + 1)
  // 总格 = 全部笔画之和
  const zong = totalStrokes
  return { tian, ren, di, wai, zong }
}

/**
 * 81 数理吉凶（依据《五格剖象法》传统）
 * 1-81 数对应的吉凶含义
 */
const WUGE_GOOD: Record<number, { level: '吉' | '半吉' | '凶'; desc: string }> = {
  1: { level: '吉', desc: '首领之数 · 旭日东升 · 大业可成' },
  3: { level: '吉', desc: '三才之数 · 进取如意 · 立志奋发' },
  5: { level: '吉', desc: '五福临门 · 阴阳和合 · 事事亨通' },
  6: { level: '吉', desc: '六爻之数 · 安稳余庆 · 温和雅量' },
  7: { level: '吉', desc: '七政之数 · 精悍刚毅 · 意志坚定' },
  8: { level: '吉', desc: '坚刚之数 · 意志坚定 · 克己助人' },
  11: { level: '吉', desc: '旱苗逢雨 · 阴阳和合 · 大业可成' },
  13: { level: '吉', desc: '智略超群 · 首领之数 · 大业可成' },
  15: { level: '吉', desc: '福寿之数 · 温和雅量 · 圆满子孙' },
  16: { level: '吉', desc: '厚重之数 · 贵人多助 · 能成大业' },
  21: { level: '吉', desc: '明月光照 · 独立权威 · 权威有余' },
  23: { level: '吉', desc: '旭日东升 · 首领之数 · 质柔刚毅' },
  24: { level: '吉', desc: '掘藏得金 · 金钱丰足 · 大业可成' },
  25: { level: '吉', desc: '英姿勃发 · 智略超群 · 才略奏功' },
  29: { level: '吉', desc: '智谋之数 · 财力归集 · 名闻天下' },
  31: { level: '吉', desc: '智勇俱备 · 温和雅量 · 大名显达' },
  32: { level: '吉', desc: '侥幸之数 · 池中之龙 · 风云际会' },
  35: { level: '吉', desc: '温和之数 · 文艺美数 · 贵人相助' },
  37: { level: '吉', desc: '独立之数 · 权威显达 · 大名显扬' },
  39: { level: '吉', desc: '富贵之数 · 富贵荣华 · 财官双美' },
  41: { level: '吉', desc: '纯阳之数 · 德泽长流 · 大业可成' },
  45: { level: '吉', desc: '顺风之数 · 万事如意 · 大成之业' },
  47: { level: '吉', desc: '点石成金 · 开花结果 · 权威显达' },
  48: { level: '吉', desc: '青松翠柏 · 智谋兼备 · 德泽长流' },
  52: { level: '吉', desc: '先见之明 · 推陈出新 · 成就大业' },
  57: { level: '吉', desc: '寒雪之数 · 努力经营 · 逢凶化吉' },
  63: { level: '吉', desc: '舟归大海 · 富贵繁荣 · 富贵双全' },
  65: { level: '吉', desc: '高楼望月 · 大成之数 · 富贵繁荣' },
  67: { level: '吉', desc: '顺风扬帆 · 逢凶化吉 · 进取如意' },
  68: { level: '吉', desc: '顺风扬帆 · 创业发达 · 大名显扬' },
  81: { level: '吉', desc: '万物回春 · 圆满结局 · 事业有成' },
  // 半吉
  2: { level: '半吉', desc: '混沌之数 · 混沌未定 · 分离破败' },
  4: { level: '半吉', desc: '凶变之数 · 多端不和 · 风波不息' },
  9: { level: '半吉', desc: '穷尽之数 · 终成不幸 · 难免贫困' },
  10: { level: '半吉', desc: '终结之数 · 万事终局 · 暗淡无光' },
  12: { level: '半吉', desc: '掘井无水 · 意志薄弱 · 谋事难成' },
  14: { level: '半吉', desc: '破兆之数 · 家庭缘薄 · 孤独遭难' },
  18: { level: '半吉', desc: '铁石之数 · 铁石心肠 · 铁面无情' },
  19: { level: '半吉', desc: '多难之数 · 风云蔽日 · 重重困难' },
  20: { level: '半吉', desc: '屋下藏身 · 命运困顿 · 谋事难成' },
  22: { level: '半吉', desc: '秋草逢霜 · 障碍重重 · 失意忧烦' },
  26: { level: '半吉', desc: '变怪之数 · 多变之象 · 波澜起伏' },
  27: { level: '半吉', desc: '欲望之数 · 欲望太盛 · 猜疑多端' },
  28: { level: '半吉', desc: '阔水浮萍 · 遭难之数 · 分离破败' },
  30: { level: '半吉', desc: '浮沉不定 · 死期转新 · 绝处逢生' },
  33: { level: '半吉', desc: '旭日升天 · 必逢厄运 · 难望成功' },
  34: { level: '半吉', desc: '破之数 · 破家亡身 · 难逃厄运' },
  36: { level: '半吉', desc: '波澜之数 · 风波不息 · 劳而无功' },
  38: { level: '半吉', desc: '薄弱之数 · 意志薄弱 · 难成大业' },
  40: { level: '半吉', desc: '退守之数 · 谨慎守身 · 进则失败' },
  42: { level: '半吉', desc: '寒蝉枯叶 · 难图大业 · 虽劳无功' },
  43: { level: '半吉', desc: '散财之数 · 散财破产 · 难免贫困' },
  44: { level: '半吉', desc: '烦闷之数 · 愁眉难展 · 妨害重配' },
  46: { level: '半吉', desc: '坎坷之数 · 载宝沉舟 · 难免贫困' },
  49: { level: '半吉', desc: '变转之数 · 吉凶难分 · 难以捉摸' },
  50: { level: '半吉', desc: '小舟入海 · 一成一败 · 难守成功' },
  51: { level: '半吉', desc: '浮沉之数 · 盛衰参半 · 难以安宁' },
  53: { level: '半吉', desc: '曲卷之数 · 忧愁困苦 · 难望成功' },
  54: { level: '半吉', desc: '石上栽花 · 多谋少成 · 难以安宁' },
  55: { level: '半吉', desc: '善恶之数 · 善恶参半 · 难以安宁' },
  56: { level: '半吉', desc: '浪里行舟 · 历尽艰难 · 难以成功' },
  58: { level: '半吉', desc: '晚行遇月 · 先苦后甜 · 难逃失败' },
  59: { level: '半吉', desc: '寒蝉悲风 · 难望成功 · 难免贫困' },
  60: { level: '半吉', desc: '无定之数 · 智谋难展 · 难免贫困' },
  61: { level: '半吉', desc: '多欲之数 · 难免贫困 · 难成大业' },
  62: { level: '半吉', desc: '根基薄弱 · 基础不稳 · 难成大业' },
  64: { level: '半吉', desc: '骨肉分离 · 孤独之数 · 难免贫困' },
  66: { level: '半吉', desc: '岩松之数 · 内外不和 · 难成大业' },
  69: { level: '半吉', desc: '不得志之数 · 难成大业 · 进退两难' },
  70: { level: '半吉', desc: '残春之数 · 残花落叶 · 难免贫困' },
  71: { level: '半吉', desc: '石上金花 · 难免贫困 · 难成大业' },
  72: { level: '半吉', desc: '劳苦之数 · 劳而无功 · 难免贫困' },
  73: { level: '半吉', desc: '无望之数 · 才智不及 · 难成大业' },
  74: { level: '半吉', desc: '残花之数 · 难望成功 · 进退两难' },
  75: { level: '半吉', desc: '退守之数 · 谨慎守身 · 难成大业' },
  76: { level: '半吉', desc: '离散之数 · 倾覆离散 · 难免贫困' },
  77: { level: '半吉', desc: '半吉之数 · 进退两难 · 难成大业' },
  78: { level: '半吉', desc: '晚苦之数 · 难望成功 · 难免贫困' },
  79: { level: '半吉', desc: '云头之数 · 难望成功 · 难免贫困' },
  80: { level: '半吉', desc: '辛苦之数 · 难免贫困 · 难成大业' },
}

const WUGE_DEFAULT_GOOD: { level: '吉' | '半吉' | '凶'; desc: string } = {
  level: '半吉', desc: '需参考具体格局',
}

function wugeLevel(num: number) {
  if (num < 1) return WUGE_DEFAULT_GOOD
  // 81 数理传统：超过 81 取余 80
  const n = ((num - 1) % 81) + 1
  return WUGE_GOOD[n] || WUGE_DEFAULT_GOOD
}

// AI 健康师
export function aiJiankangReply(ctx: BuildContext): ChatMessage {
  const q = ctx.question
  const isFollowUp = (ctx._context?.turnCount || 0) > 0
  const theme = ctx._context?.themes?.[0] || ''
  const prefix = isFollowUp ? `承 君 前 问 · 续 论 养 生 如 下\n\n（已与君论 ${ctx._context?.turnCount || 0} 轮 · 主题「${theme}」）\n\n` : ''
  const month = new Date().getMonth() + 1
  const season = month >= 3 && month <= 5 ? '春' : month >= 6 && month <= 8 ? '夏' : month >= 9 && month <= 11 ? '秋' : '冬'
  let cite = HEALTH_TIPS[season]
  for (const s of Object.keys(HEALTH_TIPS)) {
    if (q.includes(s)) { cite = HEALTH_TIPS[s]; break }
  }
  if (!cite) {
    if (q.match(/失眠|睡|多梦/)) cite = '【睡眠】心肾不交 · 宜温胆 · 泡脚 · 安神'
    else if (q.match(/脾|胃|消化/)) cite = '【脾胃】脾主运化 · 宜黄色食物 · 少冷饮'
    else if (q.match(/肝|眼|怒/)) cite = '【肝】肝开窍于目 · 宜青色 · 疏肝理气'
    else if (q.match(/心|血|神/)) cite = '【心】心主神明 · 宜红色 · 静心安神'
    else if (q.match(/肺|呼吸|皮/)) cite = '【肺】肺主皮毛 · 宜白色 · 润肺生津'
    else if (q.match(/肾|腰|精力/)) cite = '【肾】肾藏精 · 宜黑色 · 节欲保精'
  }
  const templates: string[] = [
    `${prefix}上工治未病 · 中工治欲病 · 下工治已病。\n\n${cite}\n\n君当下季节 · ${season} · 应注意：${pick(['疏肝理气 · 少酸多甘', '清热养心 · 多食苦味', '润肺生津 · 多食白色', '补肾藏精 · 节欲保精'])}。`,
    `${prefix}健康之道 · 顺四时 · 调五味 · 安情志。\n\n${cite}\n\n吾为君建议：\n1. 食：${pick(['多食山药', '多食红枣', '多食黑芝麻', '多食莲子', '多食百合'])}\n2. 居：${pick(['早起早睡', '午时小憩', '子时前入睡', '顺应天时'])}\n3. 动：${pick(['散步', '太极', '八段锦', '站桩', '五禽戏'])}\n4. 情：${pick(['少怒', '少虑', '少忧', '少悲'])}`,
    `${prefix}节气养生 · 应时而变。\n\n${cite}\n\n${season}季 · 主 ${pick(['肝', '心', '肺', '肾'])} · 应 ${pick(['青色', '红色', '白色', '黑色'])} · 食 ${pick(['酸', '苦', '辛', '咸'])} 减之 · 食 ${pick(['甘', '酸', '苦', '辛'])} 益之。`,
  ]
  return { role: 'master', text: pick(templates), time: Date.now(), cite }
}

// AI 修心师
export function aiXiuxinReply(ctx: BuildContext): ChatMessage {
  const q = ctx.question
  const isFollowUp = (ctx._context?.turnCount || 0) > 0
  const theme = ctx._context?.themes?.[0] || ''
  const prefix = isFollowUp ? `承 君 前 问 · 续 修 心 如 下\n\n（已与君论 ${ctx._context?.turnCount || 0} 轮 · 主题「${theme}」）\n\n` : ''
  const quote = pick(ZEN_QUOTES)
  let cite = ''
  if (q.match(/心烦|焦虑|急躁/)) cite = '【安心之法】心若清净 · 何处惹尘埃'
  else if (q.match(/失眠|睡/)) cite = '【入睡法】观呼吸 · 数息 · 入静'
  else if (q.match(/烦|怒|气/)) cite = '【降火法】觉知当下 · 念起即觉'
  else if (q.match(/坐|禅|冥/)) cite = '【坐禅要】调身 · 调息 · 调心'
  else cite = `【禅语】${quote}`
  const templates: string[] = [
    `${prefix}心安即是归处。\n\n${cite}\n\n君可尝试：\n1. ${pick(['闭目静坐 5 分钟', '深呼吸 10 次', '观想蓝色海洋', '听雨声', '闻香'])}\n2. ${pick(['默念 "放下"', '默念 "接受"', '默念 "无为"', '默念 "随缘"'])}\n3. ${pick(['将烦恼写在纸上烧掉', '将烦恼说给水冲走', '将烦恼吹进气球放飞', '将烦恼埋入土中'])}`,
    `${prefix}静观其变 · 心如止水。\n\n${cite}\n\n修心三要：\n- 觉：觉知当下\n- 舍：放下执着\n- 慈：慈悲喜舍\n\n君当下 · 可先从觉知呼吸开始 · 观入出息 · 1 分钟即可。`,
    `${prefix}本来无一物 · 何处惹尘埃。\n\n${cite}\n\n${quote}\n\n万法皆空 · 因果不空。君所忧虑 · 多因心念未净。试着把 "我" 字放下 · 看世界 · 一切皆安。`,
  ]
  return { role: 'master', text: pick(templates), time: Date.now(), cite }
}

// ============ 对话路由 ============

/** 多轮上下文（自动从前文提炼"主题关键词"以增强回复） */
function summarizeContext(msgs: ChatMessage[]): { themes: string[]; turnCount: number; recent: string } {
  if (!msgs || msgs.length === 0) return { themes: [], turnCount: 0, recent: '' }
  const userMsgs = msgs.filter(m => m.role === 'user')
  const themes: string[] = []
  const text = userMsgs.map(m => m.text).join(' ').slice(0, 200)
  // 提取关键词
  const kws = ['事业', '工作', '官运', '升迁', '求财', '财运', '钱', '婚', '姻缘', '对象',
               '感情', '桃花', '健康', '身体', '病', '学业', '考试', '子女', '家宅',
               '出行', '诉讼', '官司', '父母', '孩子']
  kws.forEach(k => { if (text.includes(k)) themes.push(k) })
  return {
    themes: Array.from(new Set(themes)).slice(0, 3),
    turnCount: userMsgs.length,
    recent: userMsgs.slice(-2).map(m => m.text.slice(0, 30)).join(' | '),
  }
}

export function askMaster(master: MasterKey, ctx: BuildContext): ChatMessage {
  // 多轮上下文提示
  const summary = ctx.prevMessages ? summarizeContext(ctx.prevMessages) : { themes: [], turnCount: 0, recent: '' }
  const enrichedCtx: BuildContext = { ...ctx, _context: summary }
  try {
    switch (master) {
      case 'ai-gua': return aiGuaReply(enrichedCtx)
      case 'ai-ming': return aiMingReply(enrichedCtx)
      case 'ai-feng': return aiFengReply(enrichedCtx)
      case 'ai-name': return aiNameReply(enrichedCtx)
      case 'ai-jiankang': return aiJiankangReply(enrichedCtx)
      case 'ai-xiuxin': return aiXiuxinReply(enrichedCtx)
      default: return fallbackMsg(master)
    }
  } catch (e) {
    if (typeof console !== 'undefined') console.error('[ai.ts] askMaster 异常', master, e)
    return {
      role: 'master',
      text: `${MASTERS[master].name} 感应中断，烦请重新发问以续缘。`,
      time: Date.now(),
    }
  }
}

/** 兜底消息（未知 master 或异常时） */
function fallbackMsg(master: MasterKey): ChatMessage {
  return {
    role: 'master',
    text: `${MASTERS[master].name} 暂未苏醒，敬请期待。`,
    time: Date.now(),
  }
}

export const ALL_MASTERS: MasterKey[] = ['ai-gua', 'ai-ming', 'ai-feng', 'ai-name', 'ai-jiankang', 'ai-xiuxin']

/** 上下文摘要类型（内部用） */
export interface ContextSummary {
  themes: string[]
  turnCount: number
  recent: string
}
