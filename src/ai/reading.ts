import type { Master } from '@/contract/master'
import type { AskRequest, ChartFact, MasterAnswer } from '@/contract/reading'
import { retrievePassages } from '@/knowledge/retrieve'
import { termsOf } from '@/engine/voices'
import { readBazi, readMeihua, readZiwei } from '@/engine/voices'
import { readQuestion } from '@/engine/understand'
import { localAnswer, type ComposeOptions } from './offline'

/**
 * 本地回答组装：先尝试同源语料检索，失败不影响主流程。
 * 语料不可用（离线预览、部署路径错）时仍返回完整回答，只是"依据"退回断语库静态引文。
 */
export async function generateLocalAnswer(
  master: Master,
  request: AskRequest,
  facts: ChartFact[],
  matchId?: string,
  options: ComposeOptions = {},
): Promise<MasterAnswer> {
  let passages: Awaited<ReturnType<typeof retrievePassages>> = []

  /*
   * 检索词来自读象层，而不是整段问题。
   *
   * 把「我应该接受北京的工作还是留在成都」整句丢进检索，古籍里当然找不到 ——
   * 用户自己的措辞不会出现在十七世纪的书里。真正该检索的是读象用到的术语：
   * 「十神」「大运」「体用」「命宫」——那些才是典籍的原词。
   *
   * 术语检索不到时退回整句检索（覆盖用户直接引原文的情况）。
   */
  try {
    const q = readQuestion(request.question)
    const charts = options.charts
    const lines =
      master.kernel === 'bazi' && charts?.bazi
        ? readBazi(charts.bazi, q)
        : master.kernel === 'meihua' && charts?.meihua
          ? readMeihua(charts.meihua, q)
          : master.kernel === 'ziwei' && charts?.ziwei
            ? readZiwei(charts.ziwei, q)
            : []
    const terms = termsOf(lines)

    for (const term of terms) {
      const got = await retrievePassages(term, master.books, 2)
      if (got.length) {
        passages.push(...got)
        if (passages.length >= 2) break
      }
    }
    if (!passages.length) {
      passages = await retrievePassages(request.question, master.books)
    }
  } catch {
    passages = []
  }
  return localAnswer(master, request, facts, Date.now(), matchId, passages, options)
}
