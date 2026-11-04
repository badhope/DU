/**
 * 紫微斗数 · 事实层
 *
 * 排盘用 `iztro`（MIT，业界成熟的紫微斗数库），不自己实现星曜安放。
 * 理由和四柱用 lunar-typescript 一样：安星规则有大量边界（闰月、子时换日、
 * 五行局起大限、四化随年干变化），手写一份很可能在边缘情况下悄悄算错，
 * 而"悄悄算错"是这个项目最不能接受的事。
 *
 * 这一层只做一件事：把 iztro 的输出压成可核对的 ChartFact。
 * 不做任何解释、不给吉凶判断 —— 那是演绎层的事。
 */
import type { ChartFact } from '@/contract/reading'

export interface ZiweiStar {
  name: string
  /** 主星 / 辅星 / 杂曜 */
  type: string
  /** 庙旺利陷 */
  brightness?: string
  /** 四化：禄 / 权 / 科 / 忌 */
  mutagen?: string
}

export interface ZiweiPalace {
  name: string
  heavenlyStem: string
  earthlyBranch: string
  isBodyPalace: boolean
  majorStars: ZiweiStar[]
  minorStars: ZiweiStar[]
  decadal?: { range: [number, number] }
}

export interface ZiweiChart {
  solarDate: string
  lunarDate: string
  chineseDate: string
  timeName: string
  timeRange: string
  fiveElementsClass: string
  soul: string
  body: string
  palaces: ZiweiPalace[]
  fact: ChartFact
}

export interface ZiweiInput {
  date: string
  time: string
  gender?: 'male' | 'female' | 'unknown'
}

/** 公历时间 → iztro 的时辰序号（0 = 早子时 00:00-00:59，12 = 晚子时 23:00-23:59） */
export function hourToIndex(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) return null
  // iztro 的时辰索引：0 早子(23-1)、1 丑(1-3)…11 亥(21-23)、12 晚子(23-24)
  if (hour === 23) return 12
  if (hour === 0) return 0
  return Math.floor((hour + 1) / 2)
}

/**
 * iztro 的星曜对象带方法（FunctionalStar），且可选字段可能是显式 undefined。
 * 这里只挑出纯数据，并把 undefined 归一成"字段不存在"，
 * 以符合 tsconfig 的 exactOptionalPropertyTypes。
 */
function toStar(star: { name: string; type: string; brightness?: string | undefined; mutagen?: string | undefined }): ZiweiStar {
  const result: ZiweiStar = { name: star.name, type: star.type }
  if (star.brightness !== undefined && star.brightness !== '') result.brightness = star.brightness
  if (star.mutagen !== undefined && star.mutagen !== '') result.mutagen = star.mutagen
  return result
}

function validInput(input: ZiweiInput): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return false
  if (hourToIndex(input.time) === null) return false
  const [year, month, day] = input.date.split('-').map(Number)
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) return false
  // 用 Date 回环验证日期真实存在（1 月 32 日会被规范化，必须拒绝）
  const probe = new Date(Date.UTC(year, month - 1, day))
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day
}

export async function calculateZiwei(input: ZiweiInput): Promise<ZiweiChart | { error: string }> {
  if (!validInput(input)) return { error: '出生日期或时间格式不合法。' }
  const timeIndex = hourToIndex(input.time)
  if (timeIndex === null) return { error: '出生时间不合法。' }

  try {
    const { astro } = await import('iztro')
    const gender = input.gender === 'female' ? '女' : '男'
    const [year, month, day] = input.date.split('-').map(Number)
    const chart = astro.bySolar(`${year}-${month}-${day}`, timeIndex, gender, true, 'zh-CN')

    const palaces: ZiweiPalace[] = chart.palaces.map((palace) => {
      const entry: ZiweiPalace = {
        name: palace.name,
        heavenlyStem: palace.heavenlyStem,
        earthlyBranch: palace.earthlyBranch,
        isBodyPalace: palace.isBodyPalace === true,
        majorStars: (palace.majorStars ?? []).map(toStar),
        minorStars: (palace.minorStars ?? []).map(toStar),
      }
      const decadal = palace.decadal as { range?: [number, number] } | undefined
      if (decadal?.range) entry.decadal = { range: decadal.range }
      return entry
    })

    // 四化落在哪颗星上，是这个体系里最常被引用的一组事实
    const mutagens = palaces
      .flatMap((palace) => [...palace.majorStars, ...palace.minorStars].filter((star) => star.mutagen))
      .map((star) => `${star.name}化${star.mutagen}`)

    const soulPalace = palaces.find((palace) => palace.name === '命宫')
    const fact: ChartFact = {
      kind: 'ziwei',
      title: '紫微斗数事实层',
      summary: `${chart.fiveElementsClass}，命宫在${soulPalace?.earthlyBranch ?? '—'}，${palaces.length} 宫`,
      fields: {
        solarDate: chart.solarDate,
        lunarDate: chart.lunarDate,
        fourPillars: chart.chineseDate,
        timeName: chart.time ?? '',
        fiveElementsClass: chart.fiveElementsClass,
        soul: chart.soul ?? '',
        body: chart.body ?? '',
        mutagen: mutagens,
        palaces: palaces.map((palace) => `${palace.name}(${palace.earthlyBranch})`),
        majorStars: palaces.flatMap((palace) => palace.majorStars.map((star) => `${palace.name}:${star.name}`)),
      },
    }

    return {
      solarDate: chart.solarDate,
      lunarDate: chart.lunarDate,
      chineseDate: chart.chineseDate,
      timeName: chart.time ?? '',
      timeRange: chart.timeRange ?? '',
      fiveElementsClass: chart.fiveElementsClass,
      soul: chart.soul ?? '',
      body: chart.body ?? '',
      palaces,
      fact,
    }
  } catch (error) {
    return { error: error instanceof Error ? `排盘失败：${error.message}` : '排盘失败。' }
  }
}
