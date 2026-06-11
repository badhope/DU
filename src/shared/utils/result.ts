/**
 * 玄枢 MISTVERSE · Result 类型
 *
 * 安全返回值：Ok<T> 或 Err<E>，避免 throw。
 * 用于 5 大算法 safe wrapper 的返回类型。
 */

export type Result<T, E = Error> = Ok<T> | Err<E>

export interface Ok<T> {
  ok: true
  value: T
}

export interface Err<E> {
  ok: false
  error: E
}

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value }
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error }
}

/** 类型守卫 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true
}

/** 类型守卫 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.ok === false
}
