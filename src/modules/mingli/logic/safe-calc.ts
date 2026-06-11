/**
 * 玄枢 MISTVERSE · 命理算法安全包装
 *
 * 用 Result<T,E> 包裹 calcBazi / calcZiwei，
 * 输入校验失败时返回 Err 而非 throw。
 */

import { calcBazi, type TianGan, type DiZhi } from './bazi'
import { calcZiwei, type ZiweiResult } from './ziwei'
import { type Result, ok, err } from '@shared/utils/result'

// ============ calcBazi safe wrapper ============

export interface BaziResult {
  year: { gan: TianGan; zhi: DiZhi }
  month: { gan: TianGan; zhi: DiZhi }
  day: { gan: TianGan; zhi: DiZhi }
  hour: { gan: TianGan; zhi: DiZhi }
  trueSolarHour: number
}

export function safeCalcBazi(
  year: number,
  month: number,
  day: number,
  hour: number,
  longitude?: number,
): Result<BaziResult, string> {
  if (!Number.isFinite(year) || year < 1900 || year > 2100) {
    return err(`年份超出范围（1900-2100），当前: ${year}`)
  }
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return err(`月份无效（1-12），当前: ${month}`)
  }
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    return err(`日期无效（1-31），当前: ${day}`)
  }
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    return err(`时辰无效（0-23），当前: ${hour}`)
  }
  if (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    return err(`经度无效（-180~180），当前: ${longitude}`)
  }
  try {
    const result = calcBazi(year, month, day, hour, longitude)
    return ok(result)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}

// ============ calcZiwei safe wrapper ============

export function safeCalcZiwei(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender?: '男' | '女',
  longitude?: number,
): Result<ZiweiResult, string> {
  if (!Number.isFinite(year) || year < 1900 || year > 2100) {
    return err(`年份超出范围（1900-2100），当前: ${year}`)
  }
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return err(`月份无效（1-12），当前: ${month}`)
  }
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    return err(`日期无效（1-31），当前: ${day}`)
  }
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    return err(`时辰无效（0-23），当前: ${hour}`)
  }
  if (gender !== undefined && gender !== '男' && gender !== '女') {
    return err(`性别无效（男/女），当前: ${gender}`)
  }
  try {
    const result = calcZiwei(year, month, day, hour, gender, longitude)
    return ok(result)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}
