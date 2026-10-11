/**
 * DU · 共鸣引擎 · 命题库
 *
 * 一条命 = 一句断语 + 它的适用条件 + 元数据。
 *
 * 与江湖话术的区别（设计约束，不是口号）：
 *  1. 每条必须挂 source（典籍出处或"心理观察"），界面可点开看原文；
 *  2. 每条必须声明 baseRate（这句话在人群中天然适用的比例），界面明示，
 *     高基率的泛泛之谈不会被伪装成精准判断；
 *  3. polarity 只用于措辞平衡，不做恐吓；负面条目必须给出路（action）。
 */

export type SourceKind = 'canon' | 'psych' | 'observation'

export interface StatementSource {
  kind: SourceKind
  /** 书名，用于跳转典籍阅览室 */
  book?: string
  /** 篇章定位 */
  loc?: string
  /** 原文，可空（psych 类无原文） */
  quote?: string
  /** 白话释义 */
  gloss?: string
}

export interface Statement {
  id: string
  text: string
  /** 归属领域 */
  domain: string[]
  /** 命中条件：特征键 → 需要的最小权重 */
  require?: Record<string, number>
  /** 加权条件：命中则加分 */
  boost?: Record<string, number>
  /** 排除条件：命中则直接淘汰（防止自相矛盾） */
  ban?: string[]
  /** 人群天然适用比例 0–1，用于透明展示与去泛化 */
  baseRate: number
  polarity: 'positive' | 'neutral' | 'tough'
  /** 建议动作，负面条目必填 */
  action?: string
  source?: StatementSource
  tags?: string[]
}

/**
 * 命库种子。真实产品由 `data/statements/*.json` 载入，
 * 这里给出结构与少量校样条目，供引擎与测试使用。
 */
export const SEED: Statement[] = [
  // ---- 高基率：通用心理观察（必须标注，让用户看得见"这是人人都有的"）
  {
    id: 'psy-001',
    text: '你把体面留给别人，把反复推演的念头留给自己。',
    domain: ['general', 'career'],
    baseRate: 0.72,
    polarity: 'neutral',
    source: { kind: 'psych', gloss: '外在自我与内在自我的落差，几乎人人如此。' },
    tags: ['introspective'],
  },
  {
    id: 'psy-002',
    text: '你对亲近的人反而更没耐心，事后又会自责。',
    domain: ['love', 'general'],
    baseRate: 0.68,
    polarity: 'tough',
    action: '把要紧的话挑一个不赶时间的时刻说。',
    source: { kind: 'psych', gloss: '安全关系里的情绪卸载，是普遍现象而非道德缺陷。' },
    tags: ['intimacy'],
  },
  // ---- 年龄/阶段绑定：真信号，命中率来自真实的人生节奏
  {
    id: 'stage-early-01',
    text: '你手上可选的路并不少，真正难的是给其中一条押上时间。',
    domain: ['career', 'general'],
    require: { 'stage:early': 0.5 },
    boost: { 'life:possible-graduation-or-early-career': 1.5 },
    baseRate: 0.44,
    polarity: 'neutral',
    action: '定一个三个月的试错期限，到期再判。',
    source: {
      kind: 'observation',
      gloss: '职业早期的核心成本是机会选择，而非能力不足。',
    },
    tags: ['choice'],
  },
  {
    id: 'stage-mid-01',
    text: '你现在的位置别人看得见，你自己却只看见还没解决的那几件。',
    domain: ['career', 'general'],
    require: { 'stage:mid': 0.5 },
    boost: { 'life:possible-career-plateau': 1.2 },
    baseRate: 0.38,
    polarity: 'tough',
    action: '把"已完成的"列成一页，和"待办的"分开存。',
    source: { kind: 'observation', gloss: '参照系随层级上移，满足感滞后于成就。' },
    tags: ['plateau'],
  },
  {
    id: 'age-45-01',
    text: '你开始把体检报告和家人的状态，看得比一次机会更重。',
    domain: ['health', 'family', 'general'],
    require: { 'life:possible-health-awareness': 0.5 },
    baseRate: 0.41,
    polarity: 'neutral',
    action: '把被拖延的那一项检查排进本月。',
    source: { kind: 'observation', gloss: '中年健康与家庭责任的风险权重换位。' },
    tags: ['health-priority'],
  },
  // ---- 领域绑定：提问本身即信息
  {
    id: 'career-ask-01',
    text: '你来问前程，其实心里已经有倾向，只差一个人替你确认代价。',
    domain: ['career'],
    require: { 'domain:career': 0.5 },
    baseRate: 0.55,
    polarity: 'neutral',
    action: '先写下你倾向的那一条，再看下面所有字。',
    source: {
      kind: 'psych',
      gloss: '决策后寻求确认（post-decisional confirmation）是问卜行为的主导动机。',
    },
    tags: ['meta'],
  },
  {
    id: 'love-ask-01',
    text: '你介意的不是他做了什么，是你已经不知道该不该信自己感觉到的。',
    domain: ['love'],
    require: { 'domain:love': 0.5 },
    baseRate: 0.47,
    polarity: 'tough',
    action: '一次只核对一件具体的事，别整体验人。',
    source: { kind: 'psych', gloss: '亲密关系动摇期典型表现是自我感知失信。' },
    tags: ['trust'],
  },
  {
    id: 'study-ask-01',
    text: '你缺的不是聪明，是把同一件事重复到烦的那段耐性。',
    domain: ['study'],
    require: { 'domain:study': 0.5, 'stage:student': 0.5 },
    baseRate: 0.43,
    polarity: 'tough',
    action: '把目标改成每天固定的十分钟，而不是周末的五小时。',
    source: { kind: 'observation', gloss: '应试瓶颈多为重复耐受度而非理解力。' },
    tags: ['persistence'],
  },
  {
    id: 'wealth-ask-01',
    text: '你对钱的焦虑，一半来自拿它衡量自己过得算不算数。',
    domain: ['wealth', 'general'],
    require: { 'domain:wealth': 0.5 },
    baseRate: 0.4,
    polarity: 'tough',
    action: '把"多少才算够"写成一个具体数字和一个日期。',
    source: { kind: 'psych', gloss: '金钱焦虑常与自我评价代理指标耦合。' },
    tags: ['money-self'],
  },
  // ---- 时段线索
  {
    id: 'late-night-01',
    text: '这个时辰还没睡的事，多半不是今天发生的。',
    domain: ['general', 'love'],
    require: { 'time:late-night': 0.5 },
    baseRate: 0.36,
    polarity: 'neutral',
    action: '今晚不决定任何事，明早再读一遍你想说的结论。',
    source: { kind: 'observation', gloss: '深夜反刍多为旧事，而非新事件。' },
    tags: ['ruminating'],
  },
  // ---- 典籍类（示例结构，实际由语料库注入原文与出处）
  {
    id: 'canon-mei-01',
    text: '事未发时容易看清，事已发时容易看深，你此刻在中间。',
    domain: ['general'],
    require: { 'resonated:timing': 0.1 },
    boost: { 'domain:career': 0.4 },
    baseRate: 0.33,
    polarity: 'neutral',
    source: {
      kind: 'canon',
      book: '梅花易数',
      loc: '卷二 · 心易占卜玄机',
      quote: '占卜之道，要變通。得變通之道者，在乎心易之妙耳！',
      gloss: '卦象是定则，用是活法；拘于成例则失其机。',
    },
    tags: ['timing'],
  },
  {
    id: 'canon-liu-01',
    text: '你看重的这段关系里，说话更小心的一方是你。',
    domain: ['love', 'career'],
    require: { 'domain:love': 0.5 },
    boost: { 'sit:conflict': 1.0 },
    baseRate: 0.42,
    polarity: 'tough',
    action: '把一句"你怎么又"换成"我有点担心"。',
    source: {
      kind: 'canon',
      book: '梅花易数',
      loc: '卷二 · 体用总诀',
      quote: '體為己身之兆，用為應事之端。',
      gloss: '体为己、用为事；占者分主客，居体者承其果。',
    },
    tags: ['intimacy', 'power'],
  },
]
