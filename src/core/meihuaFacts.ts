import type { ChartFact } from '@/contract/reading'
import { castByNumbers, castByTime, type Cast } from './meihua'
import { TIYONG_LABEL, ZHI } from './gua'

export interface MeihuaFact {
  cast: Cast
  fact: ChartFact
}

export interface MeihuaOptions {
  /**
   * 参起的问题。
   *
   * 梅花易数本来就有「因事起卦」一法：以事之数起卦，而非只取时刻。
   * 这里把问题文本折成两个数参与起卦，同一个时辰问不同的事会得到不同的卦 ——
   * 否则同一时刻的所有问题必然同卦，读起来就是同一段话。
   *
   * 折数方式必须确定可复现：按字符码累加，不是随机。
   */
  question?: string
}

/** 问题 → 两个正整数（用于因事起卦）。确定性，同文同数。 */
export function questionNumbers(question: string): [number, number] {
  let a = 0
  let b = 0
  for (let i = 0; i < question.length; i++) {
    const c = question.charCodeAt(i)
    if (i % 2 === 0) a += c
    else b += c
  }
  // 保证为正整数且在合理范围（梅花起卦常用小数值）
  return [Math.max(1, (a % 97) + 1), Math.max(1, (b % 89) + 1)]
}

export async function calculateMeihua(at: Date, options: MeihuaOptions = {}): Promise<MeihuaFact | { error: string }> {
  if (Number.isNaN(at.getTime())) return { error: '起卦时间不合法。' }
  try {
    const { Solar } = await import('lunar-typescript')
    const lunar = Solar.fromDate(at).getLunar()
    const yearZhi = lunar.getYearZhiIndex() + 1
    const hourZhi = lunar.getTimeZhiIndex() + 1
    const month = Math.abs(lunar.getMonth())
    const day = lunar.getDay()
    /*
     * 有具体问题时走「因事起卦」，把问题折成两个数；
     * 没有问题时退回纯时辰起卦（保持旧行为，也保证测试可复现）。
     */
    const cast =
      options.question && options.question.trim()
        ? castByNumbers(...questionNumbers(options.question.trim()))
        : castByTime(yearZhi, month, day, hourZhi)
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
