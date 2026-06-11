/**
 * 玄枢 MISTVERSE · 六爻算法安全包装
 *
 * 用 Result<T,E> 包裹 liuyaoDivinate，
 * 输入校验失败时返回 Err 而非 throw。
 */

import { liuyaoDivinate, type LiuyaoResult, type Topic } from './liuyao'
import { type Result, ok, err } from '@shared/utils/result'

const VALID_TOPICS: Topic[] = [
  '事业',
  '求财',
  '姻缘',
  '官运',
  '学业',
  '健康',
  '家宅',
  '出行',
  '谋望',
  '求子',
  '失物',
  '诉讼',
  '求官',
  '通用',
]

export function safeLiuyaoDivinate(
  topic?: Topic,
  date?: Date,
  seed?: number,
): Result<LiuyaoResult, string> {
  if (topic !== undefined && !VALID_TOPICS.includes(topic)) {
    return err(`占卜主题无效，可选: ${VALID_TOPICS.join('、')}`)
  }
  if (date !== undefined && !(date instanceof Date)) {
    return err('日期参数无效，需为 Date 实例')
  }
  if (seed !== undefined && (!Number.isFinite(seed) || seed < 0)) {
    return err(`种子值无效（非负整数），当前: ${seed}`)
  }
  try {
    const result = liuyaoDivinate(topic, date, seed)
    return ok(result)
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}
