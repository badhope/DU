/**
 * 玄枢 MISTVERSE · 一日同人同工具不重测 核心逻辑
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

export type CooldownType = 'once-per-day' | 'free'

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
  'ai-gua': 'free',
  'ai-ming': 'free',
  'ai-feng': 'free',
  'ai-name': 'free',
  'ai-jiankang': 'free',
  'ai-xiuxin': 'free',
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

export const COOLDOWN_LABEL: Record<CooldownType, string> = {
  'once-per-day': '一 日 一 占',
  free: '随 时 可 测',
}

/** 重事类工具白名单（UI 提示用） */
export const ONCE_PER_DAY_TOOLS: ToolKey[] = Object.entries(COOLDOWN_TYPE)
  .filter(([_, t]) => t === 'once-per-day')
  .map(([k]) => k as ToolKey)

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

/** N 天前的日期 */
export function daysAgoStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return todayStr(d)
}

// ============ 冷却检查 ============

export interface CooldownCheckResult {
  /** 工具类型 */
  type: CooldownType
  /** 是否允许 */
  allowed: boolean
  /** 现有记录（如有） */
  record?: DivinationRecord
  /** 提示语（阻止时） */
  message?: string
  /** 友好提示标题 */
  title?: string
  /** 重测解锁日期（默认 +1 天） */
  unlockDate?: string
}

/**
 * 检查同人同日同工具是否可以再次占卜
 * @param records  所有历史记录
 * @param userKey  当前用户 key
 * @param tool     当前工具 key
 * @param date     当前日期（默认今天）
 */
export function checkCooldown(
  records: DivinationRecord[],
  userKey: string,
  tool: ToolKey,
  date: string = todayStr(),
): CooldownCheckResult {
  const t = COOLDOWN_TYPE[tool] || 'free'
  if (t === 'free') return { type: 'free', allowed: true }
  // 查找同人同日同工具记录
  const hit = records.find((r) => r.date === date && r.userKey === userKey && r.tool === tool)
  if (!hit) return { type: t, allowed: true }
  // 已存在记录
  return {
    type: t,
    allowed: false,
    record: hit,
    title: '今 日 已 测',
    message: `「${hit.userName}」今日（${friendlyDate(hit.date)}）已测 [${hit.toolName}]，结果：${hit.brief}。按古法，一日同人同工具不宜二占，恐心念不诚，反失灵验。`,
    unlockDate: nextDayStr(hit.date),
  }
}

/** 明日日期 */
function nextDayStr(s: string): string {
  const d = new Date(s)
  d.setDate(d.getDate() + 1)
  return todayStr(d)
}

// ============ 记录提交 ============

/**
 * 提交一条占卜记录（同时更新用户的 toolCooldown）
 *  - id: 工具 page 调用生成（如 uuid 或 timestamp+random）
 *  - 调用时机：占卜完成时
 */
export function buildRecord(input: {
  id: string
  userKey: string
  userName: string
  tool: ToolKey
  toolName: string
  brief: string
  timestamp?: number
  date?: string
}): DivinationRecord {
  const ts = input.timestamp || Date.now()
  return {
    id: input.id,
    date: input.date || todayStr(new Date(ts)),
    userKey: input.userKey,
    userName: input.userName,
    tool: input.tool,
    toolName: input.toolName,
    brief: input.brief,
    timestamp: ts,
  }
}

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
export function makeUserKey(name: string): string {
  return name.trim() || '玄友'
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

/** 检查用户是否存在 */
export function findDivinator(
  profiles: Record<string, DivinatorProfile>,
  key: string,
): DivinatorProfile | undefined {
  return profiles[key]
}

/** 用户某工具是否已冷却到期 */
export function isToolUnlocked(
  profile: DivinatorProfile,
  tool: ToolKey,
  today: string = todayStr(),
): boolean {
  const cooldown = profile.toolCooldown[tool]
  if (!cooldown) return true
  return today >= cooldown
}

// ============ 统计 ============

/** 计算用户今日已测数量（所有工具） */
export function countTodayByUser(
  records: DivinationRecord[],
  userKey: string,
  today: string = todayStr(),
): number {
  return records.filter((r) => r.date === today && r.userKey === userKey).length
}

/** 计算用户今日某工具是否已测 */
export function hasTodayRecord(
  records: DivinationRecord[],
  userKey: string,
  tool: ToolKey,
  today: string = todayStr(),
): DivinationRecord | undefined {
  return records.find((r) => r.date === today && r.userKey === userKey && r.tool === tool)
}

/** 列出用户最近 N 天占卜 */
export function listRecent(
  records: DivinationRecord[],
  userKey: string,
  days = 7,
): DivinationRecord[] {
  return records
    .filter((r) => r.userKey === userKey)
    .filter((r) => r.date >= daysAgoStr(days))
    .sort((a, b) => b.timestamp - a.timestamp)
}

/** 按日聚合（用于日历视图） */
export function groupByDate(
  records: DivinationRecord[],
  userKey: string,
): Record<string, DivinationRecord[]> {
  const map: Record<string, DivinationRecord[]> = {}
  records
    .filter((r) => r.userKey === userKey)
    .forEach((r) => {
      if (!map[r.date]) map[r.date] = []
      map[r.date].push(r)
    })
  return map
}

// ============ 弹窗文案工具 ============

/** 工具页 cooldown 弹窗默认标题 */
export const COOLDOWN_DIALOG_TITLE = '今 日 已 测'

/** 工具页 cooldown 弹窗默认提示 */
export const COOLDOWN_DIALOG_TIP = '一 日 同 人 同 工 具 不 宜 二 占 · 恐 心 念 不 诚 · 反 失 灵 验'
