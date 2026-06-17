/**
 * 渡 DU · 一日同人同工具不重测 核心逻辑
 *
 * 业务规则：
 *  - 重事类工具（liuyao/gua/ziwei/bazi/hehun/xuankong/tieban/mingji/mingmen/xiaoliuren）
 *    同人 + 同日 + 同工具 不可重测
 *  - 同人同日不同工具：允许（不卡日）
 *  - 同日不同人：允许（家父与家子各自独立）
 *  - 同人隔日同工具：允许（明日可重测）
 *  - 自由类工具：永不限制
 *
 * 设计：
 *  - 工具页 onLoad 时主动调用 checkAndAct()
 *  - 占卜完成时调用 commitRecord()
 *  - 用户可"换人" / "换工具" / "不听劝继续"
 */

import type { ToolKey } from '../stores'

// ============ 类型 ============

export interface DivinationRecord {
  id: string
  date: string // 'YYYY-MM-DD' 本地日
  userKey: string // 用户标识
  userName: string // 用户显示名
  tool: ToolKey
  toolName: string
  brief: string // 一句话结果摘要
  timestamp: number
}

export interface DivinatorProfile {
  key: string // 唯一键（默认 = name）
  name: string
  remark?: string // 备注（家父/母亲/自己/孩子等）
  createdAt: number
  totalCount: number
  lastDate?: string // 最后占卜日
  // 工具到期日
  toolCooldown: Partial<Record<ToolKey, string>> // toolKey -> 'YYYY-MM-DD' 可以再次占卜
}

type CooldownType = 'once-per-day' | 'free'

export const COOLDOWN_TYPE: Record<string, CooldownType> = {
  // 重事类：同人同工具一日一次
  liuyao: 'once-per-day',
  gua: 'once-per-day',
  ziwei: 'once-per-day',
  bazi: 'once-per-day',
  hehun: 'once-per-day',
  xuankong: 'once-per-day',
  tieban: 'once-per-day',
  mingji: 'once-per-day',
  mingmen: 'once-per-day',
  xiaoliuren: 'once-per-day',
  // 自由类
  tarot: 'free',
  meihua: 'free',
  lingqian: 'free',
  shuzhi: 'free',
  jiaobei: 'free',
  poster: 'free',
  note: 'free',
  checkin: 'free',
  calendar: 'free',
  huangli: 'free',
  history: 'free',
  dashboard: 'free',
  profile: 'free',
  users: 'free',
}

// ============ 日期工具 ============

/** 本地日期 'YYYY-MM-DD' */
export function todayStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 友好日期显示 */
export function friendlyDate(s: string): string {
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

/** 明日日期 */
function nextDayStr(s: string): string {
  const d = new Date(s)
  d.setDate(d.getDate() + 1)
  return todayStr(d)
}

// ============ 记录提交 ============

/** 用户在提交后是否需要更新 toolCooldown */
export function getUnlockDateForTool(
  tool: ToolKey,
  fromDate: string = todayStr(),
): string | undefined {
  const t = COOLDOWN_TYPE[tool]
  if (t === 'once-per-day') return nextDayStr(fromDate)
  return undefined
}

// ============ 用户档案辅助 ============

/** 生成 userKey（默认用 name，但需去重/转码） */
function makeUserKey(name: string): string {
  return name.trim() || '渡友'
}

/** 创建新用户 */
export function newDivinator(name: string, remark?: string): DivinatorProfile {
  return {
    key: makeUserKey(name),
    name: name.trim(),
    remark,
    createdAt: Date.now(),
    totalCount: 0,
    toolCooldown: {},
  }
}

// ============ 统计 ============

/** 计算用户今日某工具是否已测 */
export function hasTodayRecord(
  records: DivinationRecord[],
  userKey: string,
  tool: ToolKey,
  today: string = todayStr(),
): DivinationRecord | undefined {
  return records.find((r) => r.date === today && r.userKey === userKey && r.tool === tool)
}
