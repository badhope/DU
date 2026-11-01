import type { ChartFact } from '@/contract/reading'

export interface BaziInput {
  date: string
  time: string
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

export async function calculateBazi(input: BaziInput): Promise<BaziResult> {
  if (!validInput(input)) return { error: '出生日期或时间格式不合法。' }
  const [year, month, day] = input.date.split('-').map(Number)
  const [hour, minute] = input.time.split(':').map(Number)
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
    const fact: ChartFact = {
      kind: 'bazi',
      title: '子平四柱事实层',
      summary: `${pillars.map((p) => p.value).join(' · ')}，日主${dayMaster}${dayMasterWuxing}`,
      fields: {
        date: input.date,
        time: input.time,
        dayMaster,
        dayMasterWuxing,
        pillars: pillars.map((p) => `${p.label}${p.value}`),
        wuxing: WUXING.map((name) => `${name}${wuxing[name]}`),
      },
    }
    return { date: input.date, time: input.time, dayMaster, dayMasterWuxing, pillars, wuxing, fact }
  } catch (error) {
    return { error: error instanceof Error ? `排盘失败：${error.message}` : '排盘失败。' }
  }
}
