/**
 * DU · 问题理解层
 *
 * 这一层回答一个此前没有回答的问题：**用户到底在问什么类型的决定**。
 *
 * 为什么需要它：在加这层之前，引擎只看到 domain（前程/感情/…）和几个情境标签。
 * 结果「北京还是成都」和「股权怎么分」拿到同一批断语 —— 它们同属 career，
 * 而断语库对 career 的处理是「你在等一个不用负责的理由」这种通用句。
 * 那句话对两个问题都不错，但对哪一个都不准。
 *
 * 这里做的是**结构化识别**，不是语义理解：
 *  - 决策形态：二选一 / 要不要 / 怎么做 / 判断他人 / 预测结果 / 自我评估
 *  - 对象与选项：从问句里抽出被比较的两项（"北京" vs "成都"）
 *  - 时间窗：本周 / 本月 / 三个月 / 一年 / 没有明确期限
 *  - 代价与顾虑：钱、时间、关系、身份、健康
 *
 * 全部是确定性的字符串规则，可测试、可复现，不引入任何模型调用 ——
 * 这与项目「不上传、可复核」的前提一致。
 */

/** 决策形态 */
export type DecisionKind =
  | 'either-or' // 二选一：A 还是 B
  | 'whether' // 要不要做某事
  | 'how' // 怎么做 / 如何
  | 'assess-other' // 判断别人（他/她/对方 是否…）
  | 'predict' // 预测结果（会不会 / 能不能 / 什么时候）
  | 'self-eval' // 自我评估（我适合…吗）
  | 'unknown'

/** 时间窗 */
export type TimeHorizon = 'week' | 'month' | 'quarter' | 'year' | 'none'

/** 顾虑维度 */
export type Concern = 'money' | 'time' | 'relationship' | 'identity' | 'health' | 'risk' | 'family'

export interface QuestionReading {
  kind: DecisionKind
  /** 二选一时的两个选项（尽量从原文摘取，保留用户自己的词） */
  options: [string, string] | null
  /** 用户在问的对象：自己 / 某人 / 一段关系 / 一件事 */
  subject: 'self' | 'other' | 'relationship' | 'situation'
  horizon: TimeHorizon
  /** 从问句里识别出的顾虑维度，按出现顺序 */
  concerns: Concern[]
  /** 问句里提到的具体事物（城市、公司、考试、金额…），供断语引用 */
  named: string[]
  /** 原问题（已 trim），用于断语里回指 */
  raw: string
}

/** 二选一的连接词，按优先级排列 */
const EITHER_OR = /\s*(?:还是|或者|or|vs\.?|对比)\s*/

/** 从 "A 还是 B" 里抽两项；A 取连接词前最后一个短语，B 取其后到标点 */
function parseOptions(q: string): [string, string] | null {
  const m = EITHER_OR.exec(q)
  if (!m) return null
  const leftRaw = q.slice(0, m.index)
  const rightRaw = q.slice(m.index + m[0].length)
  // 左侧取最后一个分句（"我应该接受北京的工作" → "北京的工作"）
  const leftSeg = leftRaw.split(/[，,。？?；;：:]/).filter((s) => s.trim()).pop() ?? ''
  // 去掉引导词
  /*
   * 清洗选项：去掉引导词、时间状语与标点。
   * 不去时间词的话，「下个月考研还是直接工作」会切出"下个月考研"——
   * 选项里带时间会让后面的断语读起来别扭（"你问的是「下个月考研」"）。
   */
  const clean = (s: string) =>
    s
      .replace(/^(?:我|我们|你|他|她|那|那么)?\s*(?:是|该|应该|要|想|打算|准备|需不需要|是不是)?\s*/u, '')
      .replace(/^(?:这个月|下个月|本月|今年|明年|这周|本周|下周|三个月内|半年内)\s*/u, '')
      .replace(/[，,。？?；;：:！!]+$/u, '')
      .trim()
  // 右侧取第一个分句
  const rightSeg = rightRaw.split(/[，,。？?；;：:！!]/)[0] ?? ''
  const a = clean(leftSeg)
  const b = clean(rightSeg)
  // 两项都必须有实质内容，且不能过长（过长说明切错了）
  if (!a || !b || a.length > 24 || b.length > 24) return null
  return [a, b]
}

const KIND_RULES: Array<[DecisionKind, RegExp]> = [
  // 二选一优先：有"还是/或者"就是二选一，哪怕同时含"要不要"
  ['either-or', /还是|或者|哪个|哪一个|选哪/],
  ['how', /怎么|如何|怎样|咋办|咋整/],
  ['assess-other', /(?:他|她|对方|合伙人|老板|领导|父母)[^。？]{0,12}(?:是不是|会不会|有没有|可靠|值不值得|能不能)/],
  ['predict', /会不会|能不能成|什么时候|多久|能否|结果如何|有希望/],
  ['self-eval', /我(?:适合|是不是适合|行不行|能不能胜任|有这个命)/],
  ['whether', /要不要|该不该|需不需要|是否有必要|值不值得|应不应该/],
]

function parseKind(q: string): DecisionKind {
  // 二选一必须先判：它常与"要不要"同时出现（"要不要去北京还是留成都"）
  if (EITHER_OR.test(q)) return 'either-or'
  for (const [kind, re] of KIND_RULES) {
    if (kind === 'either-or') continue
    if (re.test(q)) return kind
  }
  return 'unknown'
}

const HORIZON_RULES: Array<[TimeHorizon, RegExp]> = [
  ['week', /这周|本周|下周|礼拜|几天内|这两天/],
  ['month', /这个月|下个月|本月|一个月|30 ?天/],
  ['quarter', /三个月|一个季度|季度|半年内/],
  ['year', /今年|明年|一年|这两年|长期/],
]

function parseHorizon(q: string): TimeHorizon {
  for (const [h, re] of HORIZON_RULES) if (re.test(q)) return h
  return 'none'
}

const CONCERN_RULES: Array<[Concern, RegExp]> = [
  ['money', /钱|薪|收入|存款|房租|房贷|成本|价格|涨|亏|利润|股权|分红|投资|借钱|预算|工资/],
  ['time', /时间|来不及|拖|等太久|期限|deadline|加班|忙/],
  ['relationship', /关系|感情|对象|女朋|男朋|老婆|老公|伴侣|分手|结婚|同事|合伙人|团队|客户/],
  ['identity', /身份|面子|体面|别人怎么看|年纪|年龄|三十|四十|转行|重新开始|资格/],
  ['health', /身体|健康|睡|累|焦虑|抑郁|病|体检|精力|熬夜/],
  ['risk', /风险|万一|失败|后悔|稳妥|保险|兜底|退路|赌/],
  ['family', /父母|爸妈|家人|孩子|家庭|老人|长辈|家里/],
]

function parseConcerns(q: string): Concern[] {
  const out: Concern[] = []
  for (const [c, re] of CONCERN_RULES) if (re.test(q)) out.push(c)
  return out
}

function parseSubject(q: string, kind: DecisionKind): QuestionReading['subject'] {
  if (kind === 'assess-other' || /(?:他|她|对方|合伙人|老板|领导)/.test(q)) return 'other'
  if (/我们|我俩|这段关系|我们的关系/.test(q)) return 'relationship'
  if (/这件事|这个项目|这个机会|这份工作/.test(q)) return 'situation'
  return 'self'
}

/**
 * 具名实体：城市、公司、考试、学历等。
 * 只用来在断语里回指用户自己的词，不做外部查询。
 */
const KNOWN_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '武汉', '西安', '南京',
  '苏州', '天津', '长沙', '郑州', '青岛', '厦门', '合肥', '昆明', '乌鲁木齐', '拉萨',
  '哈尔滨', '沈阳', '大连', '济南', '福州', '南昌', '贵阳', '兰州', '海口', '银川',
  '香港', '澳门', '台北', '新加坡', '东京', '纽约', '伦敦',
]
const KNOWN_EXAMS = ['考研', '考公', '考编', '公务员', '国考', '省考', '高考', '雅思', '托福', 'GRE', 'CPA', '法考', '教资']
const KNOWN_LIFE = ['买房', '卖房', '结婚', '离婚', '生孩子', '生娃', '出国', '留学', '移民', '创业', '读博', '辞职', '转行', '跳槽']

/**
 * 常见"关系/事务对象"词：出现在"我和 X 怎么…"里的 X。
 * 这些词本身不是地名也不是考试名，但决定了用户在问什么。
 */
const KNOWN_OBJECTS = [
  '合伙人', '股东', '投资人', '老板', '领导', '上司', '同事', '下属', '团队',
  '客户', '甲方', '供应商', '女朋友', '男朋友', '对象', '伴侣', '老婆', '老公',
  '父母', '爸妈', '孩子', '兄弟', '姐妹', '朋友',
  '股权', '股份', '分红', '合同', 'offer', '薪资', '工资', '奖金',
]

/**
 * 抽具名实体。
 *
 * 关键点：命中后要把那段文字"吃掉"，再继续匹配。
 * 否则「男朋友」会同时命中「男朋」和「朋友」两个词条，
 * 输出成「男朋、朋友」——读者一眼就看出这是机器乱切的。
 * 按词条长度降序匹配，并把已匹配的片段标记掉。
 */
function parseNamed(q: string): string[] {
  const found: string[] = []
  let rest = q

  const dictionaries = [KNOWN_CITIES, KNOWN_EXAMS, KNOWN_LIFE, KNOWN_OBJECTS]
  const all = dictionaries.flat().sort((a, b) => b.length - a.length)

  for (const word of all) {
    if (rest.includes(word)) {
      found.push(word)
      // 用等长占位符替换，避免短词再匹配到同一段
      rest = rest.split(word).join('□'.repeat(word.length))
      if (found.length >= 4) break
    }
  }
  return [...new Set(found)].slice(0, 4)
}

export function readQuestion(question: string): QuestionReading {
  const raw = question.trim()
  const kind = parseKind(raw)
  return {
    kind,
    options: kind === 'either-or' ? parseOptions(raw) : null,
    subject: parseSubject(raw, kind),
    horizon: parseHorizon(raw),
    concerns: parseConcerns(raw),
    named: parseNamed(raw),
    raw,
  }
}

/** 决策形态的中文名，给界面与断言用 */
export const KIND_LABEL: Record<DecisionKind, string> = {
  'either-or': '二选一',
  whether: '要不要做',
  how: '怎么做',
  'assess-other': '判断他人',
  predict: '预测结果',
  'self-eval': '自我评估',
  unknown: '开放式',
}

export const HORIZON_LABEL: Record<TimeHorizon, string> = {
  week: '这几天',
  month: '这个月',
  quarter: '这三个月',
  year: '这一年',
  none: '没有明确期限',
}

export const CONCERN_LABEL: Record<Concern, string> = {
  money: '钱',
  time: '时间',
  relationship: '关系',
  identity: '身份与体面',
  health: '身体与精力',
  risk: '风险与退路',
  family: '家人',
}


/* ══════════════════════════════════════════
 * 领域推断
 *
 * 用户在下拉框里选的领域常常与问题本身不符 —— 实测「我男朋友最近总是不回消息」
 * 被标成 career，系统就按前程去排盘。领域决定行动建议、也影响读象侧重，
 * 选错等于答非所问。
 *
 * 这里从问句推断领域，用于：
 *  1. 界面上提示"你选的是前程，但这个问题更像感情"；
 *  2. 运行时以推断结果为准（用户明确选择的除外，见调用方）。
 * 只做明显信号的判断，不确定时返回 general，不硬猜。
 * ══════════════════════════════════════════ */

export type InferredDomain = 'career' | 'love' | 'study' | 'health' | 'wealth' | 'family' | 'general'

const DOMAIN_RULES: Array<[InferredDomain, RegExp]> = [
  // 感情：优先级高，「男朋友/女朋友」出现基本就是这个领域
  ['love', /男朋友|女朋友|男友|女友|对象|伴侣|老公|老婆|前任|喜欢的人|暗恋|分手|复合|结婚|求婚|恋爱|相亲|回消息|暧昧|出轨/],
  // 家人
  ['family', /我爸|我妈|父母|爸妈|家人|家里|孩子|儿子|女儿|老人|长辈|婆婆|岳父|岳母|兄弟|姐妹|亲戚/],
  // 学业
  ['study', /考研|考公|考编|考试|高考|复习|备考|留学|申请学校|论文|答辩|成绩|保研|读博|升学|雅思|托福/],
  // 身心
  ['health', /身体|健康|焦虑|失眠|睡不好|抑郁|情绪|精力|疲惫|体检|生病/],
  // 钱财
  ['wealth', /钱|收入|工资|薪|存款|投资|理财|买房|房贷|股票|基金|亏|赚|负债|贷款|预算|房租/],
  // 前程
  ['career', /工作|职场|辞职|跳槽|换工作|offer|面试|老板|领导|同事|升职|加薪|裁员|创业|合伙|公司|项目|事业|客户|甲方/],
]

/*
 * 核心动作词：这些决定"用户到底在问什么"。
 * 「我妈让我换工作」问的是工作，不是家人关系；
 * 「跟老板提加薪」问的是职场，不是钱。
 * 所以动作词命中时优先级高于"提到的人"。
 */
const CORE_ACTION: Array<[InferredDomain, RegExp]> = [
  ['career', /辞职|跳槽|换工作|找工作|面试|offer|升职|加薪|裁员|创业|合伙|入职|离职|转行|职场|老板|领导|同事|公司/],
  ['study', /考研|考公|考编|高考|复习|备考|留学|申请学校|论文|答辩|保研|读博|升学|雅思|托福|考试/],
  ['love', /分手|复合|结婚|求婚|恋爱|相亲|暗恋|表白|出轨|在一起|回消息|暧昧/],
  ['wealth', /买房|卖房|投资|理财|股票|基金|贷款|负债|存款|预算|房租|房贷/],
  ['health', /生病|手术|失眠|抑郁|焦虑|体检|治疗/],
]

export function inferDomain(question: string): InferredDomain {
  const q = question.trim()
  if (!q) return 'general'

  /*
   * 先看核心动作：用户真正在问的那件事。
   * 找不到再看泛化词（提到的人、泛化的钱等）。
   */
  for (const [domain, re] of CORE_ACTION) {
    if (re.test(q)) return domain
  }
  for (const [domain, re] of DOMAIN_RULES) {
    if (re.test(q)) return domain
  }
  return 'general'
}

export const DOMAIN_LABEL_CN: Record<InferredDomain, string> = {
  career: '前程',
  love: '感情',
  study: '学业',
  health: '身心',
  wealth: '钱财',
  family: '家人',
  general: '整体',
}
