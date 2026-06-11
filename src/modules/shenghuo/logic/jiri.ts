/**
 * 玄枢 MISTVERSE · 吉日择时
 *
 *  - 找指定事件（嫁娶/开市/动土/入殓/出行）的吉日
 *  - 范围：未来 30 天
 *  - 评分：黄道日 + 宜事匹配 + 无冲煞
 */

import { getHuangliDay, type HuangliDay } from '@/modules/shenghuo/logic/huangli'

const YI_TO_HLANG: Record<string, string[]> = {
  jiaqin: ['嫁娶', '订婚', '纳采', '问名'], // 嫁娶
  kaishi: ['开市', '交易', '立券', '挂匾', '开光', '入宅'], // 开市
  dongtu: ['动土', '修造', '上梁', '安门', '破土', '入殓', '安葬'], // 动土
  chuxing: ['出行', '会友', '移徙', '入宅'], // 出行
  qiuxue: ['祭祀', '祈福', '求嗣', '开光'], // 祈福
  qiusu: ['牧养', '纳财', '求财', '开市'], // 求财
}

const EVENTS: Array<{ key: string; name: string; glyph: string; desc: string }> = [
  { key: 'jiaqin', name: '嫁娶', glyph: '娶', desc: '订婚、结婚、纳采' },
  { key: 'kaishi', name: '开市', glyph: '市', desc: '开业、签约、交易' },
  { key: 'dongtu', name: '动土', glyph: '土', desc: '建筑、装修、上梁' },
  { key: 'chuxing', name: '出行', glyph: '行', desc: '远行、移居、探亲' },
  { key: 'qiuxue', name: '祈福', glyph: '福', desc: '祭祀、祈愿、许愿' },
  { key: 'qiusu', name: '求财', glyph: '财', desc: '投资、理财、置产' },
]

export interface JiriResult {
  event: string
  bestDays: Array<{ day: HuangliDay; score: number; reason: string }>
  period: { start: string; end: string }
}

export function findJiri(event: string, days: number = 30, baseDate?: Date): JiriResult {
  const yi = YI_TO_HLANG[event] || []
  const start = baseDate || new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + days)

  const candidates: Array<{ day: HuangliDay; score: number; reason: string }> = []
  const d = new Date(start)
  while (d < end) {
    const hl = getHuangliDay(d)
    // 评分
    let score = 50
    const reason: string[] = []

    if (hl.zhiShenType === '黄道') {
      score += 18
      reason.push('黄道日')
    }
    if (hl.zhiShenType === '黑道') {
      score -= 12
    }

    if (hl.fortune === '吉') {
      score += 10
      reason.push('日值吉')
    }
    if (hl.fortune === '凶') {
      score -= 15
    }

    // 宜事匹配
    const matchCount = hl.yi.filter((y) => yi.includes(y)).length
    if (matchCount > 0) {
      score += matchCount * 6
      reason.push(`宜事匹配 ${matchCount} 项`)
    }

    // 凶日忌事惩罚
    if (hl.ji.some((j) => yi.includes(j))) {
      score -= 8
    }

    // xiu fortune
    if (hl.xiuFortune === '大吉') {
      score += 8
      reason.push('星宿大吉')
    }
    if (hl.xiuFortune === '凶') {
      score -= 8
    }

    candidates.push({
      day: hl,
      score: Math.max(20, Math.min(100, score)),
      reason: reason.join(' · ') || '平日',
    })
    d.setDate(d.getDate() + 1)
  }

  candidates.sort((a, b) => b.score - a.score)
  return {
    event: EVENTS.find((e) => e.key === event)?.name || event,
    bestDays: candidates.slice(0, 10),
    period: {
      start: candidates[0]?.day.date || '',
      end: candidates[candidates.length - 1]?.day.date || '',
    },
  }
}

export const JIRI_EVENTS = EVENTS
