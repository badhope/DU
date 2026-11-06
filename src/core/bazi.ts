import type { ChartFact } from '@/contract/reading'
import { toTrueSolarTime } from './solarTime'

export interface BaziInput {
  date: string
  time: string
  /**
   * 性别只影响大运顺逆，不影响四柱。
   * 缺省按男命：旧调用方（含既有测试与导入的旧台账）没有这个字段，
   * 静默改变它们的排盘结果比明确默认更糟。
   */
  gender?: 'male' | 'female' | 'unknown'
  /**
   * 出生地经度（东经为正）。给了就先把钟表时间校正成真太阳时再排盘 ——
   * 中国横跨五个时区却统一用东经 120° 的标准时，乌鲁木齐差 129 分钟，
   * 不校正会把时辰排错两个。
   */
  longitude?: number
}

/** 一步大运；index 0 是起运前的小运段，没有干支 */
export interface BaziLuckPillar {
  index: number
  ganZhi: string
  startYear: number
  endYear: number
  startAge: number
  endAge: number
}

/** 起运信息：顺逆行、起运年月日、当前所处大运 */
export interface BaziLuck {
  forward: boolean
  startYear: number
  startMonth: number
  startDay: number
  /** 当前年份落在哪一步；null 表示尚未起运 */
  current: BaziLuckPillar | null
  pillars: BaziLuckPillar[]
}

/** 当前流年 */
export interface BaziYear {
  year: number
  age: number
  ganZhi: string
}

export interface BaziPillar {
  label: string
  value: string
  gan: string
  zhi: string
  wuxing: string
  nayin: string
  hideGan: string[]
  shiShenGan: string
  shiShenZhi: string[]
}

export interface BaziChart {
  date: string
  time: string
  dayMaster: string
  dayMasterWuxing: string
  pillars: BaziPillar[]
  wuxing: Record<string, number>
  luck?: BaziLuck
  year?: BaziYear
  fact: ChartFact
}

export type BaziResult = BaziChart | { error: string }

const WUXING = ['金', '木', '水', '火', '土'] as const
const WUXING_BY_GAN: Record<string, string> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
}

function validInput(input: BaziInput): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) return false
  const [year, month, day] = input.date.split('-').map(Number)
  const [hour, minute] = input.time.split(':').map(Number)
  if (![year, month, day, hour, minute].every(Number.isInteger) || month! < 1 || month! > 12 || hour! > 23 || minute! > 59) return false
  const date = new Date(year!, month! - 1, day!, hour!, minute!, 0, 0)
  return date.getFullYear() === year && date.getMonth() === month! - 1 && date.getDate() === day && date.getHours() === hour && date.getMinutes() === minute
}

function pillar(
  label: string,
  value: string,
  gan: string,
  zhi: string,
  wuxing: string,
  nayin: string,
  hideGan: string[],
  shiShenGan: string,
  shiShenZhi: string[],
): BaziPillar {
  return { label, value, gan, zhi, wuxing, nayin, hideGan, shiShenGan, shiShenZhi }
}

/** 大运默认取 9 步（约 90 年），足够覆盖任何在世年龄 */
const LUCK_STEPS = 9

/**
 * 大运与流年。
 *
 * 为什么会在这里出现：同类排盘工具都把大运当标配——用户问"三个月内换工作"时，
 * 只看四柱无法回应。
 *
 * 依赖两件容易搞错的事：性别决定顺逆、节气决定起运岁数。两者都由
 * lunar-typescript 算，本文件不自己推。
 */
function buildLuck(eight: EightCharLike, gender: 'male' | 'female' | 'unknown', nowYear: number): BaziLuck | undefined {
  try {
    // 1 = 男（阳男阴女顺行），0 = 女
    const yun = eight.getYun(gender === 'female' ? 0 : 1)
    const all: BaziLuckPillar[] = yun.getDaYun(LUCK_STEPS + 1).map((item) => ({
      index: item.getIndex(),
      ganZhi: item.getGanZhi(),
      startYear: item.getStartYear(),
      endYear: item.getEndYear(),
      startAge: item.getStartAge(),
      endAge: item.getEndAge(),
    }))
    // index 0 是起运前的小运段，没有干支，单独剔出去
    const pillars = all.filter((item) => item.index > 0 && item.ganZhi !== '')
    const current = pillars.find((item) => nowYear >= item.startYear && nowYear <= item.endYear) ?? null
    return {
      forward: yun.isForward(),
      startYear: yun.getStartYear(),
      startMonth: yun.getStartMonth(),
      startDay: yun.getStartDay(),
      current,
      pillars,
    }
  } catch {
    // 大运是增量信息：算不出来不影响四柱这条主线
    return undefined
  }
}

/** 当前流年干支。直接用同一套历法库算，不自己推六十甲子。 */
function buildYear(luck: BaziLuck | undefined, nowYear: number, yearInGanZhi: string): BaziYear | undefined {
  if (!luck) return undefined
  const step = luck.pillars.find((item) => nowYear >= item.startYear && nowYear <= item.endYear)
  if (!step || !yearInGanZhi) return undefined
  // 年龄按虚岁，与排盘软件一致
  return { year: nowYear, age: nowYear - step.startYear + step.startAge, ganZhi: yearInGanZhi }
}

type EightCharLike = {
  getYun: (gender: number, sect?: number) => {
    getStartYear: () => number
    getStartMonth: () => number
    getStartDay: () => number
    isForward: () => boolean
    getDaYun: (n?: number) => Array<{
      getIndex: () => number
      getGanZhi: () => string
      getStartYear: () => number
      getEndYear: () => number
      getStartAge: () => number
      getEndAge: () => number
    }>
  }
}

export async function calculateBazi(input: BaziInput): Promise<BaziResult> {
  if (!validInput(input)) return { error: '出生日期或时间格式不合法。' }

  /*
   * 先校正真太阳时，再排盘。
   * 只影响"几点"（时柱与日界），不影响年月；校正后的日期可能跨天，
   * 所以 year/month/day 必须在校正之后重新取。
   */
  const solar = input.longitude === undefined ? null : toTrueSolarTime(input.date, input.time, input.longitude)
  if (input.longitude !== undefined && !solar) return { error: '经度不合法，应在 -180 到 180 之间。' }
  const effectiveDate = solar?.date ?? input.date
  const effectiveTime = solar?.time ?? input.time

  const [year, month, day] = effectiveDate.split('-').map(Number)
  const [hour, minute] = effectiveTime.split(':').map(Number)
  try {
    const { Solar } = await import('lunar-typescript')
    const eight = Solar.fromYmdHms(year!, month!, day!, hour!, minute!, 0).getLunar().getEightChar()
    const pillars = [
      pillar('年柱', eight.getYear(), eight.getYearGan(), eight.getYearZhi(), eight.getYearWuXing(), eight.getYearNaYin(), eight.getYearHideGan(), eight.getYearShiShenGan(), eight.getYearShiShenZhi()),
      pillar('月柱', eight.getMonth(), eight.getMonthGan(), eight.getMonthZhi(), eight.getMonthWuXing(), eight.getMonthNaYin(), eight.getMonthHideGan(), eight.getMonthShiShenGan(), eight.getMonthShiShenZhi()),
      pillar('日柱', eight.getDay(), eight.getDayGan(), eight.getDayZhi(), eight.getDayWuXing(), eight.getDayNaYin(), eight.getDayHideGan(), eight.getDayShiShenGan(), eight.getDayShiShenZhi()),
      pillar('时柱', eight.getTime(), eight.getTimeGan(), eight.getTimeZhi(), eight.getTimeWuXing(), eight.getTimeNaYin(), eight.getTimeHideGan(), eight.getTimeShiShenGan(), eight.getTimeShiShenZhi()),
    ]
    const wuxing = Object.fromEntries(WUXING.map((name) => [name, 0])) as Record<string, number>
    for (const p of pillars) {
      for (const char of p.wuxing) if (char in wuxing) wuxing[char]! += 1
    }
    const dayMaster = eight.getDayGan()
    const dayMasterWuxing = WUXING_BY_GAN[dayMaster] ?? '未知'

    // 大运需要"现在"才知道走到哪一步；传 nowAge 反而不如传年份直接
    const nowYear = new Date().getFullYear()
    const luck = buildLuck(eight as unknown as EightCharLike, input.gender ?? 'unknown', nowYear)
    // 流年干支：同一年出生的人流年相同，直接问历法库
    const { LunarYear } = await import('lunar-typescript')
    const yearGanZhi = LunarYear.fromYear(nowYear).getGanZhi()
    const yearInfo = buildYear(luck, nowYear, yearGanZhi)

    const fact: ChartFact = {
      kind: 'bazi',
      title: '子平四柱事实层',
      summary: `${pillars.map((p) => p.value).join(' · ')}，日主${dayMaster}${dayMasterWuxing}`,
      fields: {
        date: input.date,
        time: input.time,
        // 校正过就写明校正后是几点：用户填了 08:30 却排出辰时的盘，
        // 不给这一行会以为算错了。
        ...(solar
          ? {
              trueSolarTime: `${solar.date} ${solar.time}（${solar.offsetMinutes >= 0 ? '+' : ''}${solar.offsetMinutes.toFixed(0)} 分钟）`,
            }
          : {}),
        dayMaster,
        dayMasterWuxing,
        pillars: pillars.map((p) => `${p.label}${p.value}`),
        wuxing: WUXING.map((name) => `${name}${wuxing[name]}`),
        ...(luck
          ? {
              luckDirection: luck.forward ? '顺行' : '逆行',
              luckStart: `出生后 ${luck.startYear} 年 ${luck.startMonth} 个月起运`,
              luckCurrent: luck.current ? `${luck.current.ganZhi}（${luck.current.startYear}–${luck.current.endYear}）` : '尚未起运',
            }
          : {}),
        ...(yearInfo ? { liuNian: `${yearInfo.year} ${yearInfo.ganZhi}（虚岁 ${yearInfo.age}）` } : {}),
      },
    }
    return {
      date: input.date,
      time: input.time,
      dayMaster,
      dayMasterWuxing,
      pillars,
      wuxing,
      ...(luck ? { luck } : {}),
      ...(yearInfo ? { year: yearInfo } : {}),
      fact,
    }
  } catch (error) {
    return { error: error instanceof Error ? `排盘失败：${error.message}` : '排盘失败。' }
  }
}
