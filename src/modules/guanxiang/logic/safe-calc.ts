/**
 * 玄枢 MISTVERSE · 面相算法安全包装
 *
 * 用 Result<T,E> 包裹 calcMianxiang，
 * 输入校验失败时返回 Err 而非 throw。
 */

import { calcMianxiang, type MianxiangResult } from './mianxiang'
import { type Result, ok, err } from '@shared/utils/result'

export function safeCalcMianxiang(
  year: number,
  focusArea?: string,
  currentAge?: number,
): Result<MianxiangResult, string> {
  if (!Number.isFinite(year) || year < 1900 || year > 2100) {
    return err(`年份超出范围（1900-2100），当前: ${year}`)
  }
  if (currentAge !== undefined && (!Number.isFinite(currentAge) || currentAge < 0 || currentAge > 150)) {
    return err(`年龄无效（0-150），当前: ${currentAge}`)
  }
  try {
    const result = calcMianxiang(year, focusArea, currentAge)
    return ok(result)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}
