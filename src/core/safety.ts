/**
 * 安全网关 · 在任何内容生成之前运行
 *
 * 这个模块存在的原因很直白：如果用户输入「我想自杀」，系统必须停止算命，
 * 给出求助信息。之前没有任何拦截，实测会回一句「你不是在做决定，
 * 是在等一个不用负责的理由」—— 对一个有自杀念头的人是极其危险的话。
 *
 * 设计原则：
 *  1. **短路优先**：命中即返回，不排盘、不生成断语、不写断言、不留存问题原文。
 *  2. **所有宿主共用**：Web / CLI / HTTP / MCP 都走同一个 gate，不存在"网页拦了命令行没拦"。
 *  3. **不猜测**：宁可多拦（误报只是少算一卦），不可漏拦。
 *  4. **不评判**：回复必须是求助导向，不说教、不分析性格。
 */

export type SafetyLevel = 'crisis' | 'medical' | 'financial' | 'legal' | 'minor' | 'ok'

export interface SafetyVerdict {
  level: SafetyLevel
  /** 命中时给用户的固定回复；ok 时为 null */
  message: string | null
  /** 触发词，便于日志与测试断言；不存原文 */
  matched: string[]
}

/**
 * 危机词表。
 *
 * 覆盖三类：自伤、他伤、急性医疗。故意写得宽一些 —— 把「不想活了」当成
 * 修辞而放过，代价远大于多拦一次。
 */
const CRISIS = [
  '自杀', '轻生', '不想活', '活不下去', '结束生命', '了断自己', '想死', '去死', '要死了', '死了算了',
  '自残', '割腕', '跳楼', '安眠药', '烧炭', '上吊',
  '杀了', '捅死', '报复社会',
]

/** 医疗：涉及诊断、用药、停药、剂量 */
const MEDICAL = ['停药', '断药', '加量', '减量', '剂量', '换药', '诊断', '确诊', '化疗', '手术要不要', '偏方', '治愈']

/** 财务决策：借贷、杠杆、押注 */
const FINANCIAL = ['借钱炒股', '杠杆', '梭哈', 'all in', '全部身家', '抵押', '网贷', '赌', '加杠杆']

/** 法律：诉讼、离婚协议、刑事 */
const LEGAL = ['起诉', '打官司', '离婚协议', '判刑', '坐牢', '报警抓']

/** 未成年相关 */
const MINOR = ['未成年', '高中生', '初中生', '小学生', '中专生', '技校生']

/**
 * 未成年正则。
 *
 * 为什么不能只靠词表：词表里原来只有「我14岁」这种紧贴写法，而真实表达
 * 几乎都不会这么写 —— 实测「我 14 岁」「我十四岁」「17周岁」全部漏检。
 * 未成年人保护是写进文档的承诺，靠枚举字面值做不到。
 *
 * 为什么不能"见到年龄就拦"：那会把「我 60 岁，孩子高三」也拦掉。
 * 要区分的是**说话人本人**是否未成年，不是句子里有没有出现年龄或学段。
 * 所以数字年龄要求前面有第一人称或"今年"，单独出现的「14 岁」不算。
 */
const MINOR_PATTERNS: RegExp[] = [
  // 我 14 岁 / 今年14 / 俺十五周岁 / 本人 16 岁
  /(?:我|本人|俺|自己|今年|岁数)\s*[:：]?\s*(?:[0-9]|1[0-7])\s*(?:周)?\s*岁/,
  // 我十四岁 / 今年十七周岁
  /(?:我|本人|俺|自己|今年)\s*[:：]?\s*[一二三四五六七八九十]{1,3}\s*(?:周)?\s*岁/,
  // 14 岁可以算吗 —— 句首直接给年龄（说明是在说自己）
  /^\s*(?:[0-9]|1[0-7])\s*(?:周)?\s*岁/,
  // 读初三 / 初二学生 / 我是高三的 —— 学段词带第一人称或"读/上"
  /(?:我|本人|俺|自己|读|上|在)\s*[^\s，。]{0,3}(?:初[一二三]|高[一二三])(?:年级)?/,
  /*
   * 句首直接给学段：初二学生适合算吗 / 高一了 / 高三党。
   * 但「孩子高三」「他高三」是在说别人 —— 紧邻第三人称时不拦。
   */
  /(?:^|[。！？；\s])\s*(?:初[一二三]|高[一二三])(?:年级)?(?!的?(?:时候|那年|毕业))/,
  /*
   * 今年 14 —— 口语里常省略"岁"。
   * 必须限定 0–17，且后面紧跟分隔符：否则「我今年 34 岁」也会被吞进来。
   */
  /(?:我|今年|本人)\s*[:：]?\s*(?:[0-9]|1[0-7])\s*(?=[，。、\s]|$)/,
  // 未成年 / 未满 18 / 不满十八
  /未\s*满\s*(?:18|十八)/,
  /不\s*满\s*(?:18|十八)/,
]

/**
 * 家暴与人身安全。
 *
 * 这一组原来叫 ABUSE、被误标成「财务决策」，注释与实际内容已经对不上。
 * 它必须排在医疗之后、未成年之前：被打的人要先看到报警与庇护指引。
 */
const ABUSE = ['家暴', '打我', '殴打', '虐待', '赶出家门', '不让我回家']

const CRISIS_MESSAGE = `这类问题不适合用术数回答，我也不会给你排盘。

如果你现在有伤害自己的念头，请立刻联系：
· 心理援助热线 12356（全国，24 小时）
· 北京心理危机研究与干预中心 010-82951332
· 紧急情况直接拨 120 或 110，或去最近的急诊

如果身边有人，请告诉对方你现在的状态。你不需要先想清楚该说什么。`

const ABUSE_MESSAGE = `这属于人身安全问题，不是运势问题，我不做排盘。

· 报警 110；全国妇女维权热线 12338
· 未成年人可拨 12355 青少年服务台
· 如果现在不安全，先离开现场，去人多的地方或就近派出所

保留证据（照片、聊天记录、就医记录）对后续维权很重要。`

const MEDICAL_MESSAGE = `用药与诊断必须由执业医师判断，任何术数工具都不该参与这个决定。

请把你的疑问直接带给你的主治医生，或拨 12320 卫生热线咨询。不要自行停药、减量或换药。`

const FINANCIAL_MESSAGE = `这类涉及借贷与杠杆的决定，术数给不了可靠答案，也不该给。

我能做的只是帮你把决策拆开：先说清楚这笔钱的最坏情况你能承受多少，再决定要不要做。涉及借贷、抵押或杠杆时，请咨询持牌金融机构。`

const LEGAL_MESSAGE = `法律问题需要执业律师，不是排盘能回答的。

可以先把事实按时间顺序写下来，再带着材料去咨询律师或当地法律援助中心（12348）。`

const MINOR_MESSAGE = `如果你未满 18 岁，这个工具不适合单独使用。

请让监护人陪你一起看，或者先和信任的成年人聊聊。遇到困难可以拨 12355 青少年服务台。`

/**
 * 命中即返回的消息，按优先级排列：危机 > 家暴 > 医疗 > 未成年 > 财务 > 法律
 *
 * `patterns` 与 `words` 同时生效：词表抓固定说法，正则抓结构（年龄、学制）。
 * 两条任一命中即算该级别。
 */
const RULES: Array<{ level: SafetyLevel; words: string[]; patterns?: RegExp[]; message: string }> = [
  { level: 'crisis', words: CRISIS, message: CRISIS_MESSAGE },
  { level: 'crisis', words: ABUSE, message: ABUSE_MESSAGE },
  { level: 'medical', words: MEDICAL, message: MEDICAL_MESSAGE },
  { level: 'minor', words: MINOR, patterns: MINOR_PATTERNS, message: MINOR_MESSAGE },
  { level: 'financial', words: FINANCIAL, message: FINANCIAL_MESSAGE },
  { level: 'legal', words: LEGAL, message: LEGAL_MESSAGE },
]

/**
 * 检查用户输入。
 *
 * 注意：这里只做关键词与结构匹配，不做语义理解。它必然会误报（"我快笑死了"
 * 不会命中，但 "这比赛太刺激我要死了" 会）。这是刻意的取舍：误报只损失一次
 * 排盘，漏报可能造成真实伤害。
 */
export function checkSafety(question: string): SafetyVerdict {
  const text = question.toLowerCase()
  /*
   * 第三人称上下文：提到「孩子 / 儿子 / 女儿 / 他 / 她」在学段词附近时，
   * 说的是别人，不是用户本人。这条排除只对 minor 生效 —— 危机、医疗、
   * 家暴绝不能因为"提到别人"就放过。
   */
  const thirdPartyNearSchool = /(?:孩子|儿子|女儿|娃|他|她)[^。！？]{0,6}(?:初[一二三]|高[一二三])/.test(text)
  for (const rule of RULES) {
    const hits = rule.words.filter((word) => text.includes(word.toLowerCase()))
    for (const pattern of rule.patterns ?? []) {
      if (rule.level === 'minor' && thirdPartyNearSchool) {
        // 只跳过学段类正则；年龄自述（我 14 岁）仍然要拦
        if (pattern.source.includes('初[一二三]')) continue
      }
      const match = pattern.exec(text)
      if (match) hits.push(match[0])
    }
    if (hits.length) return { level: rule.level, message: rule.message, matched: hits }
  }
  return { level: 'ok', message: null, matched: [] }
}

/**
 * 是否需要完全停止生成。
 *
 * 原实现只有 crisis 阻断，minor 只在 Web 的 Ask.vue 里被手动拦下 ——
 * 于是「我16岁」在网页上看到监护提示，在 CLI / HTTP / MCP 上照常出断语。
 * 同一条安全规则不该因为换了入口就失效。minor 现在也在所有宿主一致阻断。
 *
 * 医疗 / 财务 / 法律仍然放行：用户可能真的只是在问"该不该换个作息"，
 * 用提示（domainNotice）而不是拒绝。
 */
export function isBlocking(verdict: SafetyVerdict): boolean {
  return verdict.level === 'crisis' || verdict.level === 'minor'
}

/**
 * 给回答追加的领域性提醒。
 *
 * 医疗、财务、法律、未成年问题不阻断（用户确实可能只是在问"该不该换个作息"），
 * 但回答末尾必须带上边界说明，而不是只写在页脚免责声明里。
 *
 * 之前这里只处理 medical 与 financial，legal 与 minor 返回 null —— 意味着
 * 「我未成年」在 Web 上会弹卡片，在 CLI/API/MCP 上却什么提示都没有。
 * 四种宿主共用这个函数，所以覆盖必须完整。
 */
export function domainNotice(level: SafetyLevel): string | null {
  if (level === 'medical') return '以上只是行为层面的复盘，不构成任何医疗判断。身体不适请就医。'
  if (level === 'financial') return '以上不构成投资建议。涉及借贷、杠杆或大额决策，请咨询持牌机构。'
  if (level === 'legal') return '以上不构成法律意见。涉及诉讼、协议或刑事问题，请咨询执业律师或拨 12348 法律援助。'
  if (level === 'minor') return '以上内容不适合未成年人单独参考，请在监护人陪同下阅读。'
  return null
}

/** 所有危机类回复，供 UI 与测试引用 */
export const SAFETY_MESSAGES = {
  crisis: CRISIS_MESSAGE,
  abuse: ABUSE_MESSAGE,
  medical: MEDICAL_MESSAGE,
  financial: FINANCIAL_MESSAGE,
  legal: LEGAL_MESSAGE,
  minor: MINOR_MESSAGE,
} as const
