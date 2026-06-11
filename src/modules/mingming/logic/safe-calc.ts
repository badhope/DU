/**
 * 玄枢 MISTVERSE · 命名算法安全包装
 *
 * 用 Result<T,E> 包裹 analyzeMingji，
 * 输入校验失败时返回 Err 而非 throw。
 */

import { analyzeMingji, type MingjiResult } from './mingji'
import { type Result, ok, err } from '@shared/utils/result'

export function safeAnalyzeMingji(
  name: string,
  year?: number,
  month?: number,
  day?: number,
  hour?: number,
): Result<MingjiResult, string> {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return err('姓名不能为空')
  }
  if (name.length > 20) {
    return err(`姓名过长（最多 20 字），当前: ${name.length} 字`)
  }
  if (year !== undefined && (!Number.isFinite(year) || year < 1900 || year > 2100)) {
    return err(`年份超出范围（1900-2100），当前: ${year}`)
  }
  if (month !== undefined && (!Number.isFinite(month) || month < 1 || month > 12)) {
    return err(`月份无效（1-12），当前: ${month}`)
  }
  if (day !== undefined && (!Number.isFinite(day) || day < 1 || day > 31)) {
    return err(`日期无效（1-31），当前: ${day}`)
  }
  if (hour !== undefined && (!Number.isFinite(hour) || hour < 0 || hour > 23)) {
    return err(`时辰无效（0-23），当前: ${hour}`)
  }
  // 如果提供了生辰，必须四项齐全
  const hasPartial =
    year !== undefined || month !== undefined || day !== undefined || hour !== undefined
  const hasAll =
    year !== undefined && month !== undefined && day !== undefined && hour !== undefined
  if (hasPartial && !hasAll) {
    return err('生辰信息不完整，需同时提供年/月/日/时')
  }
  try {
    const result = analyzeMingji(name, year, month, day, hour)
    return ok(result)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}
