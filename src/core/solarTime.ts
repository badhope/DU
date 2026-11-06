/**
 * 真太阳时校正
 *
 * 为什么需要：排盘用的是"当地平太阳时"，而用户填的是北京时间（东经 120°）。
 * 出生地每偏离 120° 一度，真太阳时就差 4 分钟。乌鲁木齐（东经 87.6°）差 129 分钟 ——
 * 整整两个时辰。不校正，同一份出生信息在成都能排对一个盘，在新疆会排成另一个。
 *
 * 两步校正：
 *   1. 经度时差 = (当地经度 − 120) × 4 分钟（中国统一用东八区标准时）
 *   2. 均时差 equation of time —— 地球公转轨道是椭圆、地轴倾斜，真太阳日并不均匀，
 *      全年在 −14 分到 +16 分之间摆动。用标准近似公式，误差 < 30 秒。
 *
 * 只做"钟表时间 → 真太阳时"这一个方向，不涉及历法库；输出仍是同一套
 * YYYY-MM-DD / HH:mm，交给内核照常处理。
 */

/** 均时差，单位分钟。dayOfYear 从 1 开始。 */
export function equationOfTime(dayOfYear: number): number {
  // 标准近似（Spencer 1971），误差在 30 秒内，足够判断时辰
  const B = (2 * Math.PI * (dayOfYear - 81)) / 364
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

/** 一年中的第几天（1–366），按公历 */
export function dayOfYear(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 1)
  const target = Date.UTC(year, month - 1, day)
  return Math.floor((target - start) / 86_400_000) + 1
}

export interface SolarTimeResult {
  /** 校正后的本地真太阳时 */
  date: string
  time: string
  /** 总共校正了多少分钟（正数=比钟表时间晚） */
  offsetMinutes: number
  /** 分项，便于核对与显示 */
  longitudeMinutes: number
  eotMinutes: number
}

/**
 * 把钟表时间校正为真太阳时。
 *
 * @param date YYYY-MM-DD
 * @param time HH:mm
 * @param longitude 出生地经度，东经为正（中国范围约 73–135）
 * @param standardMeridian 时区中央经线，中国为 120
 */
export function toTrueSolarTime(
  date: string,
  time: string,
  longitude: number,
  standardMeridian = 120,
): SolarTimeResult | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const tm = /^(\d{2}):(\d{2})$/.exec(time)
  if (!dm || !tm) return null
  const [year, month, day] = [Number(dm[1]), Number(dm[2]), Number(dm[3])]
  const [hour, minute] = [Number(tm[1]), Number(tm[2])]
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null

  const longitudeMinutes = (longitude - standardMeridian) * 4
  const eotMinutes = equationOfTime(dayOfYear(year, month, day))
  const offsetMinutes = longitudeMinutes + eotMinutes

  // 用 UTC 做纯算术，避开本地时区与夏令时；这里处理的是"墙上时间"
  const base = Date.UTC(year, month - 1, day, hour, minute)
  const shifted = new Date(base + Math.round(offsetMinutes * 60_000))

  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    time: `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`,
    offsetMinutes,
    longitudeMinutes,
    eotMinutes,
  }
}
