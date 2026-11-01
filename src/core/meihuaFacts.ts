import type { ChartFact } from '@/contract/reading'
import { castByTime, type Cast } from './meihua'
import { ZHI } from './gua'

export interface MeihuaFact {
  cast: Cast
  fact: ChartFact
}

export async function calculateMeihua(at: Date): Promise<MeihuaFact | { error: string }> {
  if (Number.isNaN(at.getTime())) return { error: '起卦时间不合法。' }
  try {
    const { Solar } = await import('lunar-typescript')
    const lunar = Solar.fromDate(at).getLunar()
    const yearZhi = lunar.getYearZhiIndex() + 1
    const hourZhi = lunar.getTimeZhiIndex() + 1
    const month = Math.abs(lunar.getMonth())
    const day = lunar.getDay()
    const cast = castByTime(yearZhi, month, day, hourZhi)
    const fact: ChartFact = {
      kind: 'meihua',
      title: '梅花易数起例事实层',
      summary: `本卦${cast.ben.name}，互卦${cast.hu.name}，变卦${cast.bian.name}，${ZHI[hourZhi - 1]}时第${cast.moving}爻动`,
      fields: {
        lunar: lunar.toString(),
        numbers: cast.numbers.map(String),
        ben: cast.ben.name,
        hu: cast.hu.name,
        bian: cast.bian.name,
        moving: cast.moving,
        ti: cast.ti.name,
        yong: cast.yong.name,
        relation: cast.relation,
      },
    }
    return { cast, fact }
  } catch (error) {
    return { error: error instanceof Error ? `起卦失败：${error.message}` : '起卦失败。' }
  }
}
