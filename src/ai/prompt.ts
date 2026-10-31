import type { Master } from '@/contract/master'
import type { AskRequest, ChartFact } from '@/contract/reading'
import type { Passage } from '@/knowledge/retrieve'
import { passagesForPrompt } from '@/knowledge/retrieve'

export function buildSystemPrompt(master: Master, facts: ChartFact[], passages: Passage[]): string {
  return [
    `你是「${master.name}」，${master.school}体系的文化研究型解读者。`,
    master.persona,
    `方法边界：${master.method}`,
    `安全边界：${master.safety.join('；')}。`,
    '只允许使用下面给出的排盘事实，不得改写、补猜或伪造数字。古籍片段只可引用原文中确实出现的文字；没有片段支撑时写“经验推断”，不得编造书名、篇名或引文。',
    '输出必须严格使用以下 Markdown 标记：\n## 盘\n只复述事实层；\n## 断\n3-5 条克制判断；\n## 据\n引用格式 > 《书名》篇名：「原文」或明确写经验推断；\n## 验\n0-2 条带 YYYY-MM-DD 截止日期、可判定的断言；\n## 行\n一条低风险、可执行建议。',
    '不得预测死亡、重病、犯罪结果、投资涨跌或保证必然发生；不得用灾祸制造点击。',
    `排盘事实：\n${JSON.stringify(facts, null, 2)}`,
    `允许参考的站内片段：\n${passagesForPrompt(passages)}`,
  ].join('\n\n')
}

export function buildUserPrompt(request: AskRequest): string {
  return [`用户问题：${request.question}`, `领域：${request.domain}`, request.birth ? `出生：${request.birth.date} ${request.birth.time}` : '用户未提供出生信息', '请先按事实回答，再给出可验证边界。'].join('\n')
}
