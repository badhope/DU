/**
 * DU · 门派读象层
 *
 * 为什么需要它：三个门派此前共用同一个断语池，靠哈希决定谁抽到哪句。
 * 结果就是用户读到的两份回答可以互换 —— 盲评的"盲"是真的，"评"是假的，
 * 因为没有可评的差异。
 *
 * 这一层让每个门派只说自己体系里真实存在的东西：
 *  - 子平：四柱结构、日主强弱、十神分布 → 谈"你手里有什么牌"
 *  - 梅花：本互变三卦、体用生克、动爻位置 → 谈"事情在往哪边动"
 *  - 紫微：命宫、身宫、宫位主题、四化 → 谈"这件事落在人生哪一格"
 *
 * 硬约束：
 *  1. 只陈述盘面上真有的东西。没有生辰就不编四柱，没有动爻就不谈变化。
 *  2. 不做吉凶判定。说的是结构、方向、位置，不是"你会发财"。
 *  3. 每句话必须能对回一个具体字段，用户可以自己去盘面核对。
 */

import type { BaziChart } from '@/core/bazi'
import type { Cast } from '@/core/meihua'
import type { ZiweiChart } from '@/core/ziwei'
import type { QuestionReading, Concern } from './understand'

export interface ReadingLine {
  /** 这一句在说什么（供"为什么这么说"展开） */
  basis: string
  text: string
}

/* ══════════════════════════════════════════
 * 子平：谈结构
 * ══════════════════════════════════════════ */

/** 十神 → 它管的是哪一类事（不是吉凶） */
const SHISHEN_DOMAIN: Record<string, string> = {
  正官: '规则、职位与外部评价',
  七杀: '压力、竞争与不得不应对的事',
  正印: '资源、庇护与学习的入口',
  偏印: '偏门的方法与独自消化的东西',
  比肩: '同辈、伙伴与你自己的立场',
  劫财: '分摊、争夺与不便明说的成本',
  食神: '表达、享受与自然的产出',
  伤官: '锋芒、不满与想改规则的冲动',
  正财: '稳定的收入与实际积累',
  偏财: '流动的钱、机会与不确定的收益',
}

/** 日主五行 → 它的行为倾向（传统描述，非命运判定） */
const DAY_MASTER_TRAIT: Record<string, string> = {
  木: '向上生长型：先要空间，再谈条件',
  火: '外显型：先动起来，边做边校准',
  土: '承载型：先稳住底盘，再图变化',
  金: '结构型：先定规则，再投入感情',
  水: '流动型：先摸清地形，再决定方向',
}

/** 从四柱里数出十神出现次数（含藏干），取最突出的两个 */
function topShiShen(chart: BaziChart): Array<{ name: string; count: number }> {
  const tally = new Map<string, number>()
  for (const p of chart.pillars) {
    if (p.shiShenGan) tally.set(p.shiShenGan, (tally.get(p.shiShenGan) ?? 0) + 1)
    for (const s of p.shiShenZhi) if (s) tally.set(s, (tally.get(s) ?? 0) + 1)
  }
  return [...tally.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 2)
}

export function readBazi(chart: BaziChart, q: QuestionReading): ReadingLine[] {
  const lines: ReadingLine[] = []

  // 先回指问题：让用户第一眼确认"这段是在说我的事"
  const echo = echoQuestion(q)
  if (echo) lines.push(echo)

  const dm = chart.dayMaster
  const wx = chart.dayMasterWuxing

  // 1. 日主：先说"你是什么类型的人"，这是子平看盘的起点
  const trait = DAY_MASTER_TRAIT[wx]
  if (trait) {
    lines.push({
      basis: `日主${dm}${wx}`,
      text: `你的日主是${dm}${wx}，${trait}。这不是评价，是你处理问题的默认姿势。`,
    })
  }

  // 2. 十神：把"你手里有什么牌"落成具体的事
  const tops = topShiShen(chart)
  if (tops.length) {
    const parts = tops.map((t) => `「${t.name}」${t.count} 见（管${SHISHEN_DOMAIN[t.name] ?? '这一类事'}）`)
    lines.push({
      basis: `十神 ${tops.map((t) => `${t.name}×${t.count}`).join('、')}`,
      text: `你盘里最重的是${parts.join('，还有')}。这两组东西会同时拉扯你。`,
    })
  }

  // 3. 落到具体选项
  if (q.kind === 'either-or' && q.options) {
    lines.push({
      basis: '十神与两个选项',
      text: `这两条路要动用的东西不一样：你盘里「${tops[0]?.name ?? '日主'}」最重，它管${SHISHEN_DOMAIN[tops[0]?.name ?? ''] ?? '这一类事'}——先看哪条路更依赖这个。`,
    })
  }

  // 4. 大运：把"现在"放进时间轴
  if (chart.luck?.current) {
    const c = chart.luck.current
    lines.push({
      basis: `当前大运 ${c.ganZhi}（${c.startYear}–${c.endYear}）`,
      text: `你现在走的是${c.ganZhi}运（${c.startYear}–${c.endYear}，${chart.luck.forward ? '顺行' : '逆行'}）。这一步决定的是环境给你什么题，不是你自己想做什么题。`,
    })
  }

  // 5. 时间窗：用户说了期限就接住，没说就不编
  if (q.horizon !== 'none') {
    const H: Record<string, string> = {
      week: '这周',
      month: '这个月',
      quarter: '这三个月',
      year: '这一年',
    }
    lines.push({
      basis: `时间窗：${H[q.horizon]}`,
      text: `你给的时间是${H[q.horizon]}。四柱看的是长结构，短期里的可行判断只有一条：在${H[q.horizon]}内，哪一步做错了还能退回来。`,
    })
  }

  return lines.slice(0, 5)
}

/* ══════════════════════════════════════════
 * 梅花：谈变化
 * ══════════════════════════════════════════ */

/** 体用关系 → 事情的力量方向（不是吉凶） */
const TIYONG_MEANING: Record<string, string> = {
  bihe: '体用比和：你与这件事同频，推进靠的是持续，不是爆发',
  yongShengTi: '用生体：外部条件在推你，接住比争取更重要',
  tiShengYong: '体生用：你在往外给，注意别把自己耗在里面',
  tiKeYong: '体克用：你能压住局面，但压住不等于解决',
  yongKeTi: '用克体：局面在压你，这时候硬顶不如换位',
}

/** 动爻位置 → 变化发生在哪一层 */
const MOVING_MEANING: Record<number, string> = {
  1: '初爻动：变化在最底下，是基础条件还没坐实',
  2: '二爻动：变化在内部，是你自己的态度先变',
  3: '三爻动：变化在交界处，处在"上不去下不来"的位置',
  4: '四爻动：变化开始外显，别人能看见了',
  5: '五爻动：变化在主位，是决策层的事',
  6: '上爻动：变化到头了，再往前走就是另一端',
}

export function readMeihua(cast: Cast, q: QuestionReading): ReadingLine[] {
  const lines: ReadingLine[] = []

  /*
   * 先回指问题。放在最前面是因为后面按条数截断 —— 方在最后会被裁掉，
   * 而"你问的是 X"恰恰是让用户觉得"这段话是说我的事"的关键。
   */
  const echo = echoQuestion(q)
  if (echo) lines.push(echo)

  // 1. 卦象本身：本卦 → 变卦，讲的是"从什么状态走到什么状态"
  lines.push({
    basis: `本卦${cast.ben.name} → 变卦${cast.bian.name}`,
    text: `本卦${cast.ben.name}，变卦${cast.bian.name}。${cast.ben.name}说的是你现在的处境，${cast.bian.name}说的是它正在变成的样子。`,
  })

  // 2. 动爻：变化发生在哪一层
  const moving = MOVING_MEANING[cast.moving]
  if (moving) {
    lines.push({
      basis: `第 ${cast.moving} 爻动`,
      text: `${moving}。你问的这件事，真正的变量就在这一层，不是别的。`,
    })
  }

  // 3. 体用：力量和主客关系
  const tiyong = TIYONG_MEANING[cast.relation]
  if (tiyong) {
    lines.push({
      basis: `体${cast.ti.name} · 用${cast.yong.name}`,
      text: `${tiyong}。体是${cast.ti.name}（你自己这一边），用是${cast.yong.name}（事情那一边）。`,
    })
  }

  // 4. 互卦：过程中的中间态 —— 这是梅花独有的，子平紫微都没有
  lines.push({
    basis: `互卦${cast.hu.name}`,
    text: `中间的互卦是${cast.hu.name}。事情不会从${cast.ben.name}直接跳到${cast.bian.name}，中间要经过这一段。`,
  })

  // 5. 再用体用指认走向
  if (q.kind === 'either-or' && q.options) {
    const [a, b] = q.options
    // 用生体/比和偏"顺"，体生用/用克体偏"逆"
    const favorable = cast.relation === 'yongShengTi' || cast.relation === 'bihe'
    lines.push({
      basis: '体用与选项',
      text: `按这一卦的体用，先顺的是「${favorable ? a : b}」这一边；另一边要额外使劲。这只是走向，不是结论。`,
    })
  }

  return lines.slice(0, 5)
}

/* ══════════════════════════════════════════
 * 紫微：谈位置
 * ══════════════════════════════════════════ */

/** 宫位 → 它管人生的哪一块 */
const PALACE_DOMAIN: Record<string, string> = {
  命宫: '你是谁、别人第一眼看到什么',
  兄弟: '同辈、合作与平级关系',
  夫妻: '亲密关系与长期搭档',
  子女: '后代、作品与你创造出来的东西',
  财帛: '你怎么赚钱、怎么花钱',
  疾厄: '身体与情绪的承载方式',
  迁移: '出门、换环境、外部机会',
  仆役: '下属、朋友与可用的人',
  官禄: '事业位置与社会角色',
  田宅: '住所、资产与安身之处',
  福德: '精神状态与你怎么对待自己',
  父母: '长辈、上级与支持来源',
}

/** 四化 → 它把注意力拉到哪 */
const MUTAGEN_MEANING: Record<string, string> = {
  禄: '化禄：这里有资源，也容易待着不走',
  权: '化权：这里要争，也有主导的可能',
  科: '化科：这里讲究说法与体面',
  忌: '化忌：这里最容易卡住，也最需要直面',
}

export function readZiwei(chart: ZiweiChart, q: QuestionReading): ReadingLine[] {
  const lines: ReadingLine[] = []

  /*
   * 先回指问题，再讲盘。
   *
   * 紫微只依赖出生盘，同一时辰问什么都是同一张盘 —— 如果只是罗列宫位，
   * 问"股权怎么分"和问"考研还是工作"会拿到一模一样的四条。
   * 把回指放在最前面，保证它不会被条数上限裁掉。
   */
  const echo = echoQuestion(q)
  if (echo) lines.push(echo)

  const soul = chart.palaces.find((p) => p.name === '命宫')
  const body = chart.palaces.find((p) => p.isBodyPalace)

  // 1. 命宫：位置决定视角
  if (soul) {
    const major = soul.majorStars.map((s) => s.name).join('、') || '空宫（借对宫）'
    lines.push({
      basis: `命宫在${soul.earthlyBranch}`,
      text: `命宫在${soul.earthlyBranch}，主星${major}。命宫讲的是你看世界的方式，不是世界本身的样子。`,
    })
  }

  // 2. 身宫：后天用力的地方
  if (body) {
    lines.push({
      basis: `身宫在${body.name}`,
      text: `身宫落在${body.name}（管${PALACE_DOMAIN[body.name] ?? '这一块'}）。这是你后天会真正使力的地方，往往和命宫不是同一件事。`,
    })
  }

  // 3. 四化：注意力被拉到哪里
  const mutagens = chart.palaces
    .flatMap((p) => [...p.majorStars, ...p.minorStars].filter((s) => s.mutagen).map((s) => ({ star: s.name, mutagen: s.mutagen!, palace: p.name })))
    .slice(0, 3)
  if (mutagens.length) {
    const parts = mutagens.map((m) => `${m.palace}${m.star}${MUTAGEN_MEANING[m.mutagen] ? `（${MUTAGEN_MEANING[m.mutagen]}）` : ''}`)
    lines.push({
      basis: `四化 ${mutagens.map((m) => `${m.star}化${m.mutagen}`).join('、')}`,
      text: `这盘的化星落在：${parts.join('；')}。化星是注意力的去向，不是好坏。`,
    })
  }

  // 4. 当前大限：把"现在"放进十二宫
  if (chart.currentDecadal) {
    const d = chart.currentDecadal
    lines.push({
      basis: `当前大限 ${d.palace}宫 ${d.range[0]}–${d.range[1]} 岁`,
      text: `你现在的大限在${d.palace}宫（${d.range[0]}–${d.range[1]} 岁），这一宫管的是${PALACE_DOMAIN[d.palace] ?? '这一块'}。这十年你被推到这一格来学东西。`,
    })
  }

  // 5. 用户的顾虑 → 对应到宫位
  if (q.concerns.length) {
    const map: Partial<Record<Concern, string>> = {
      money: '财帛',
      relationship: '夫妻',
      family: '父母',
      health: '疾厄',
      identity: '命宫',
      risk: '迁移',
    }
    const hit = q.concerns.map((c) => map[c]).filter(Boolean) as string[]
    if (hit.length) {
      lines.push({
        basis: `顾虑对应宫位：${hit.join('、')}`,
        text: `你担心的${q.concerns.map((c) => ({ money: '钱', time: '时间', relationship: '关系', identity: '身份', health: '身体', risk: '风险', family: '家人' })[c]).join('、')}，在盘上分别落在${hit.join('、')}——它们不在一处，所以不能用一个答案解决。`,
      })
    }
  }

  return lines.slice(0, 5)
}

/* ══════════════════════════════════════════
 * 体系依据
 *
 * 读象层一度只输出解释、不带出处，导致"依据"一栏退化成
 * 「经验推断：本地语料中没有与本次问题直接匹配的引文」——
 * 项目最核心的"可核引文"能力反而被这次改进削弱了。
 *
 * 这里给每个门派配一条与其方法论直接对应的原文，由 verify-quotes 门禁
 * 逐字校验（读的是真正分发的语料），不是编的。
 * ══════════════════════════════════════════ */

export interface VoiceCitation {
  book: string
  loc: string
  quote: string
  gloss: string
}

const CITATIONS: Record<string, VoiceCitation> = {
  bazi: {
    book: '滴天髓',
    loc: '通神论',
    quote: '剛柔之道，可順而不可逆也',
    gloss: '刚柔之道顺势而行；看结构是为了知道哪里该顺、哪里不能硬撑。',
  },
  meihua: {
    book: '梅花易数',
    loc: '卷二 · 心易占卜玄机',
    quote: '占卜之道，要變通。得變通之道者，在乎心易之妙耳',
    gloss: '卦是定则，用是活法；本互变看的是它怎么变。',
  },
  ziwei: {
    book: '紫微斗数全书',
    loc: '太微赋',
    quote: '祿逢沖破，吉處藏凶',
    gloss: '宫位讲的是位置与结构，不是吉凶判词。',
  },
}

/** 取本门依据；未知门派返回 null，由调用方决定是否退回通用引文 */
export function citationFor(kernel: string): VoiceCitation | null {
  return CITATIONS[kernel] ?? null
}

/* ══════════════════════════════════════════
 * 问题回指
 *
 * 三个门派各说各的系统语言，但都必须落到**用户问的那件事**上。
 * 没有这一句，用户读完会觉得"说得挺玄，跟我有什么关系"。
 * ══════════════════════════════════════════ */

export function echoQuestion(q: QuestionReading): ReadingLine | null {
  // 二选一：直接把两个选项拎出来
  if (q.kind === 'either-or' && q.options) {
    return {
      basis: '你给的是二选一',
      text: `你问的是「${q.options[0]}」还是「${q.options[1]}」。这两条路要走的是不同的能力，不是一个好坏问题。`,
    }
  }
  // 要不要：点明这是取舍
  if (q.kind === 'whether') {
    const what = q.named.length ? q.named.join('、') : '这件事'
    return {
      basis: '你给的是取舍',
      text: `你问的是要不要动「${what}」。取舍的本质不是选对的，是选你能承担后果的那个。`,
    }
  }
  // 怎么做：给方法而非判断
  if (q.kind === 'how') {
    // 把用户提到的对象原样带回来，避免"你问的是这件事该怎么做"这种空话
    const what = q.named.length ? q.named.join('、') : '这件事'
    return {
      basis: '你问的是方法',
      text: `你问的是「${what}」该怎么处理。这类问题的答案在步骤里，不在吉凶里。`,
    }
  }
  // 判断他人
  if (q.kind === 'assess-other') {
    return {
      basis: '你问的是别人',
      text: '你问的是别人的可靠程度。盘面能说的只有你自己的应对方式，说不了别人的心思。',
    }
  }
  // 预测
  if (q.kind === 'predict') {
    return {
      basis: '你问的是结果',
      text: '你问的是结果会不会成。这类问题最容易被"给个准话"的冲动带偏，先看清楚你能控制的部分。',
    }
  }
  // 自我评估
  if (q.kind === 'self-eval') {
    return {
      basis: '你问的是自己',
      text: '你问的是自己适不适合。适不适合不是天赋问题，是你愿不愿意付那个代价。',
    }
  }

  /*
   * 开放式问题（"男朋友不回消息""这个月适合买房吗"）。
   *
   * 原来这里返回 null，于是这类问题完全没有回指 —— 用户读到的是
   * "你的日主是辛金"，跟他的问题毫无关系。
   * 开放式问题也该点名对象：这就是用户确认"这段在说我"的唯一依据。
   */
  if (q.named.length) {
    return {
      basis: '你问的对象',
      text: `你问的是「${q.named.join('、')}」这件事。先说清楚你最在意的到底是其中哪一点，答案会具体很多。`,
    }
  }
  // 连对象都没抽出来时，至少复述问题本身（截断到 20 字，避免整段搬运）
  const brief = q.raw.length > 20 ? `${q.raw.slice(0, 20)}…` : q.raw
  if (brief) {
    return {
      basis: '你问的问题',
      text: `你问的是「${brief}」。这类问题没有标准答案，但可以从你现在能控制的那一步开始。`,
    }
  }
  return null
}

/* ══════════════════════════════════════════
 * 读象 → 检索词
 *
 * 读象层说的每个论断都基于一个具体术语（十神、卦名、宫位、四化）。
 * 这些术语正是典籍里的原词 —— 拿它去检索本门典籍，就能为具体论断
 * 找到原文，而不是只在"依据"栏挂一句泛泛的门派总纲。
 * ══════════════════════════════════════════ */

/** 从一行的 basis 里抽出可用于检索的术语（去掉数字、箭头、括号注释） */
/** 典籍里高频出现、适合当检索词的术语 */
const KNOWN_TERMS = new Set([
  '日主', '十神', '伤官', '食神', '正官', '七杀', '正印', '偏印', '比肩', '劫财', '正财', '偏财',
  '大运', '流年', '本卦', '互卦', '变卦', '动爻', '体用', '体卦', '用卦', '爻动',
  '命宫', '身宫', '大限', '化禄', '化权', '化科', '化忌', '四化',
  '旺衰', '调候', '格局', '用神', '空亡', '纳音',
])

export function searchTermOf(line: ReadingLine): string | null {
  /*
   * 做法：先看这一行的 basis 里出现了哪个已知术语，直接取它。
   *
   * 之前是先按空格切词再排序，结果「日主辛金」「当前大运」这种组合词
   * 被当成检索词 —— 典籍里没有这种写法，搜不到东西。
   * 术语匹配优先，切词是兜底。
   */
  /*
   * 优先取集合性术语（四化、体用、十神），再取具体项（化权、体卦）。
   * 集合词在典籍里的条目更完整；具体项常常只是其中一例。
   */
  const hits = [...KNOWN_TERMS].filter((t) => line.basis.includes(t))
  if (hits.length) {
    const COLLECTIVE = ['体用', '五行', '大运', '大限']
    const collective = hits.filter((h) => COLLECTIVE.includes(h)).sort((a, b) => b.length - a.length)
    if (collective.length) return collective[0]!
    return hits.sort((a, b) => b.length - a.length)[0]!
  }

  // 兜底：去掉修饰词后取一个 2–4 字的片段
  const cleaned = line.basis
    .replace(/×\d+/g, '')
    .replace(/→/g, ' ')
    .replace(/（[^）]*）/g, '')
    .replace(/\d+[–-]?\d*/g, ' ')
    .replace(/[：:·、，,。]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^(在|于|的|与|和|第|当前|本|变)/, '').trim())
    .filter((w) => w.length >= 2 && w.length <= 6)

  return cleaned[0] ?? null
}



/**
 * 一行读象对应的检索词，供调用方向典籍检索。
 *
 * 跳过"问题回指"那几行：它们说的是用户的话（"你给的是取舍"），
 * 不是盘面术语，拿去做检索只会得到空结果，还挤占前三个名额。
 * 只从真正基于盘面的行里取词。
 */
const ECHO_BASIS = /^你给的是|^你问的是/

export function termsOf(lines: ReadingLine[]): string[] {
  const out: string[] = []
  for (const line of lines) {
    if (ECHO_BASIS.test(line.basis)) continue
    const term = searchTermOf(line)
    if (term && !out.includes(term)) out.push(term)
  }
  return out.slice(0, 3)
}
