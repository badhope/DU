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
  '客户', '甲方', '供应商', '女朋', '男朋', '对象', '伴侣', '老婆', '老公',
  '父母', '爸妈', '孩子', '兄弟', '姐妹', '朋友',
  '股权', '股份', '分红', '合同', 'offer', '薪资', '工资', '奖金',
]

function parseNamed(q: string): string[] {
  const out: string[] = []
  for (const c of KNOWN_CITIES) if (q.includes(c)) out.push(c)
  for (const e of KNOWN_EXAMS) if (q.includes(e)) out.push(e)
  for (const l of KNOWN_LIFE) if (q.includes(l)) out.push(l)
  for (const o of KNOWN_OBJECTS) if (q.includes(o)) out.push(o)
  return [...new Set(out)].slice(0, 4)
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
