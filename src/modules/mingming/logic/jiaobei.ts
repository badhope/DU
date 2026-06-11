/**
 * 玄枢 MISTVERSE · 杯筊问事
 *
 *  - 圣筊：一阴一阳（〇●）
 *  - 笑筊：两阳（●●）— 笑而不答
 *  - 阴筊：两阴（〇〇）— 不允
 *  - 三次连掷：以多数定
 */

export type JiaoType = 'sheng' | 'xiao' | 'yin'

export interface JiaoResult {
  type: JiaoType
  icon: string
  meaning: string
  advice: string
}

export const JIAO_MAP: Record<JiaoType, JiaoResult> = {
  sheng: {
    type: 'sheng',
    icon: '〇●',
    meaning: '圣 筊',
    advice: '神明允诺 · 所求可成 · 心意已遂',
  },
  xiao: {
    type: 'xiao',
    icon: '●●',
    meaning: '笑 筊',
    advice: '神明笑而不答 · 意味难明 · 宜重新整理问题再问',
  },
  yin: {
    type: 'yin',
    icon: '〇〇',
    meaning: '阴 筊',
    advice: '神明不允 · 此事宜止 · 不可强求',
  },
}

/**
 * 基于问题的哈希稳定生成一个结果
 */
export function castJiao(
  question: string,
  times: number = 3,
): {
  results: JiaoResult[]
  final: JiaoType
  finalResult: JiaoResult
  summary: string
} {
  const results: JiaoResult[] = []
  for (let i = 0; i < times; i++) {
    const seed = question + i + Date.now() + Math.random()
    let h = 0
    for (let j = 0; j < seed.length; j++) h = (h * 31 + seed.charCodeAt(j)) | 0
    const types: JiaoType[] = ['sheng', 'sheng', 'sheng', 'xiao', 'xiao', 'yin']
    results.push(JIAO_MAP[types[Math.abs(h) % types.length]])
  }
  const counts: Record<JiaoType, number> = { sheng: 0, xiao: 0, yin: 0 }
  results.forEach((r) => counts[r.type]++)
  const final = Object.entries(counts).sort((a, b) => b[1]! - a[1]!)[0][0] as JiaoType

  const summaryMap: Record<string, string> = {
    sheng: '三次连掷 · 圣筊为主 · 神明显允 · 放心去做',
    xiao: '三次连掷 · 笑筊为主 · 神明示意未明 · 再问一次',
    yin: '三次连掷 · 阴筊为主 · 神明示意不可 · 应当止步',
  }

  return { results, final, finalResult: JIAO_MAP[final], summary: summaryMap[final] }
}
