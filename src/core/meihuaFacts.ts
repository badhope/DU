import type { ChartFact } from '@/contract/reading'
import { castByTime, type Cast } from './meihua'
import { TIYONG_LABEL, ZHI } from './gua'

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
        /*
         * ChartFact.fields 是给人看的盘面事实，值也必须是人的语言。
         * 这里原来直接写 cast.relation（'yongShengTi' 这样的枚举），
         * 界面于是出现「体用关系：yongShengTi」。TIYONG_LABEL 早就有，
         * 只是没在这个出口用上 —— 枚举值属于代码，不属于盘面。
         */
        relation: TIYONG_LABEL[cast.relation],
      },
    }
    return { cast, fact }
  } catch (error) {
    return { error: error instanceof Error ? `起卦失败：${error.message}` : '起卦失败。' }
  }
}
