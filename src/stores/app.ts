/**
 * 玄枢 v1.0.0 · 业务 store (SP-3 拆分)
 *
 * 范围: history / profile / favorites / notes / achievements / checkin / divination
 * （settings 字段仍保留以兼容 vue 文件，但持久化独立写 mistverse-settings-v1）
 *
 * 持久化拆分:
 *   - mistverse-app-v1      ← app 部分（除 settings 外）
 *   - mistverse-settings-v1 ← settings 部分（独立 store，完整 API）
 *
 * 旧 v3 key (mistverse-state-v3) 启动时拆分: app 写 v1, settings 写 v1
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { TOOLS } from '@/config/tools'
import { newDivinator, getUnlockDateForTool, hasTodayRecord } from '@shared/utils/daily-cooldown'
import { todayStr as _todayStr } from '@shared/utils/daily-cooldown'
import type { DivinatorProfile } from '@shared/utils/daily-cooldown'
import { DEFAULT_SETTINGS, type SettingsState } from './settings'

/** 本地日 YYYY-MM-DD（与 daily-cooldown.todayStr 同步） */
function todayStr(d: Date = new Date()): string {
  return _todayStr(d)
}

// ============ 占卜用户与记录（与 daily-cooldown 同步） ============
export interface DivinationRecord {
  id: string
  date: string // 'YYYY-MM-DD' 本地日
  userKey: string
  userName: string
  tool: ToolKey
  toolName: string
  brief: string
  timestamp: number
}

// ============ 工具 key 集合（与 config/tools.ts 保持一致） ============
export type ToolKey =
  | 'wuxing'
  | 'bazi'
  | 'hehun'
  | 'liunian'
  | 'mingmen'
  | 'liuren'
  | 'gua'
  | 'tarot'
  | 'meihua'
  | 'lingqian'
  | 'shuzhi'
  | 'jiaobei'
  | 'liuyao'
  | 'mianxiang'
  | 'shouxiang'
  | 'guyi'
  | 'fenglui'
  | 'mingji'
  | 'qijing'
  | 'ziwu'
  | 'wufu'
  | 'yangsheng'
  | 'zhan'
  | 'fangqi'
  | 'shijian'
  | 'dayun'
  | 'huangli'
  | 'jiri'
  | 'yunshi'
  | 'jiazu'
  | 'ziwei'
  | 'xuankong'
  | 'tieban'
  | 'xiaoliuren'
  | 'zhuge'
  | 'life'
  | 'astro'
  | 'maya'
  | 'profile'
  | 'dashboard'
  | 'checkin'
  | 'poster'
  | 'users'

export type ThemeKey = 'xuanhuang' | 'xuanzi' | 'xuanqing'
export type FontKey = 'kaiti' | 'songti' | 'zhuanshu' | 'heiti'
export type ModeKey = 'dark' | 'light'

// ============ 个人档案 ============
export interface UserProfile {
  nickname: string
  gender: 'male' | 'female' | 'other'
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  longitude: number
  birthplace: string
  createdAt: number
}

export interface HistoryItem {
  id: string
  tool: ToolKey
  toolName: string
  category: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output: any
  brief: string
  time: number
  starred?: boolean
}

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  toolKey?: ToolKey
  toolName?: string
  time: number
  updateTime: number
}

export interface Achievement {
  id: string
  name: string
  desc: string
  icon: string
  unlocked: boolean
  unlockTime?: number
  progress: number
  target: number
  current: number
}

export interface CheckinInfo {
  lastDate: string
  streak: number
  totalDays: number
  points: number
}

interface AppPersistState {
  history: HistoryItem[]
  profile: UserProfile | null
  favorites: string[]
  notes: Note[]
  achievements: Achievement[]
  checkin: CheckinInfo
  divinationRecords: DivinationRecord[]
  divinatorProfiles: Record<string, DivinatorProfile>
  activeDivinatorKey: string
}

const APP_STORAGE_KEY = 'mistverse-app-v1'
const SETTINGS_STORAGE_KEY = 'mistverse-settings-v1'
const LEGACY_V3_KEY = 'mistverse-state-v3'
const LEGACY_V2_KEY = 'mistverse-state-v2'

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-use',
    name: '初窥玄门',
    desc: '首次使用任意工具',
    icon: '☯',
    unlocked: false,
    progress: 0,
    target: 1,
    current: 0,
  },
  {
    id: 'use-3-tools',
    name: '触类旁通',
    desc: '使用 3 个不同工具',
    icon: '三',
    unlocked: false,
    progress: 0,
    target: 3,
    current: 0,
  },
  {
    id: 'use-10-tools',
    name: '玄学十全',
    desc: '使用 10 个不同工具',
    icon: '十',
    unlocked: false,
    progress: 0,
    target: 10,
    current: 0,
  },
  {
    id: 'use-30-tools',
    name: '玄枢全览',
    desc: '使用全部 49 工具',
    icon: '卐',
    unlocked: false,
    progress: 0,
    target: 49,
    current: 0,
  },
  {
    id: 'checkin-7',
    name: '七日一复',
    desc: '连续签到 7 天',
    icon: '七',
    unlocked: false,
    progress: 0,
    target: 7,
    current: 0,
  },
  {
    id: 'checkin-30',
    name: '月圆玄明',
    desc: '连续签到 30 天',
    icon: '月',
    unlocked: false,
    progress: 0,
    target: 30,
    current: 0,
  },
  {
    id: 'checkin-100',
    name: '百日筑基',
    desc: '连续签到 100 天',
    icon: '百',
    unlocked: false,
    progress: 0,
    target: 100,
    current: 0,
  },
  {
    id: 'night-owl',
    name: '子夜推演',
    desc: '在 23 点后使用工具',
    icon: '夜',
    unlocked: false,
    progress: 0,
    target: 1,
    current: 0,
  },
  {
    id: 'dawn-quest',
    name: '寅时问卜',
    desc: '在 3-5 点使用工具',
    icon: '寅',
    unlocked: false,
    progress: 0,
    target: 1,
    current: 0,
  },
  {
    id: 'profile-set',
    name: '命盘初定',
    desc: '设置个人档案',
    icon: '盘',
    unlocked: false,
    progress: 0,
    target: 1,
    current: 0,
  },
  {
    id: 'note-1',
    name: '心有所记',
    desc: '写下第一篇笔记',
    icon: '笔',
    unlocked: false,
    progress: 0,
    target: 1,
    current: 0,
  },
  {
    id: 'note-10',
    name: '十篇成册',
    desc: '写满 10 篇笔记',
    icon: '册',
    unlocked: false,
    progress: 0,
    target: 10,
    current: 0,
  },
  {
    id: 'fav-1',
    name: '藏之名山',
    desc: '收藏第一个结果',
    icon: '藏',
    unlocked: false,
    progress: 0,
    target: 1,
    current: 0,
  },
  {
    id: 'fav-20',
    name: '典藏二十',
    desc: '收藏 20 个结果',
    icon: '典',
    unlocked: false,
    progress: 0,
    target: 20,
    current: 0,
  },
  {
    id: 'category-all',
    name: '六艺皆通',
    desc: '6 大分类全部用遍',
    icon: '六',
    unlocked: false,
    progress: 0,
    target: 6,
    current: 0,
  },
  {
    id: 'high-level',
    name: '探赜索隐',
    desc: '使用全部 8 大高阶命理',
    icon: '奥',
    unlocked: false,
    progress: 0,
    target: 8,
    current: 0,
  },
  {
    id: 'share-1',
    name: '广结善缘',
    desc: '生成首张海报',
    icon: '缘',
    unlocked: false,
    progress: 0,
    target: 1,
    current: 0,
  },
]

const DEFAULT_STATE: AppPersistState = {
  history: [],
  profile: null,
  favorites: [],
  notes: [],
  achievements: DEFAULT_ACHIEVEMENTS,
  checkin: { lastDate: '', streak: 0, totalDays: 0, points: 0 },
  divinationRecords: [],
  divinatorProfiles: {},
  activeDivinatorKey: '',
}

function loadAppState(): AppPersistState {
  if (typeof window === 'undefined') return JSON.parse(JSON.stringify(DEFAULT_STATE))
  // 1) 优先 app v1
  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppPersistState>
      return normalize(parsed)
    }
  } catch (_e) {
    // ignore
  }
  // 2) 回退 v3，剥离 settings 字段写 v1
  try {
    const raw = window.localStorage.getItem(LEGACY_V3_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppPersistState> & {
        settings?: SettingsState
        chatSessions?: unknown
      }
      // 剥离 settings (独立写 v1)
      if (parsed.settings) {
        try {
          window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed.settings))
        } catch (_e) {
          // ignore
        }
      }
      delete parsed.settings
      delete parsed.chatSessions
      const next = normalize(parsed)
      saveAppState(next)
      return next
    }
  } catch (_e) {
    // ignore
  }
  // 3) 回退 v2
  try {
    const raw = window.localStorage.getItem(LEGACY_V2_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppPersistState> & { chatSessions?: unknown }
      delete parsed.chatSessions
      const next = normalize(parsed)
      saveAppState(next)
      return next
    }
  } catch (_e) {
    // ignore
  }
  return JSON.parse(JSON.stringify(DEFAULT_STATE))
}

function normalize(parsed: Partial<AppPersistState>): AppPersistState {
  return {
    history: Array.isArray(parsed.history) ? parsed.history : [],
    profile: parsed.profile || null,
    favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    achievements:
      Array.isArray(parsed.achievements) && parsed.achievements.length
        ? parsed.achievements
        : JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS)),
    checkin: parsed.checkin || { lastDate: '', streak: 0, totalDays: 0, points: 0 },
    divinationRecords: Array.isArray(parsed.divinationRecords) ? parsed.divinationRecords : [],
    divinatorProfiles: parsed.divinatorProfiles || {},
    activeDivinatorKey: parsed.activeDivinatorKey || '',
  }
}

function saveAppState(s: AppPersistState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(s))
  } catch (_e) {
    // ignore
  }
}

function loadAppSettings(): SettingsState {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<SettingsState>) }
    }
  } catch (_e) {
    // ignore
  }
  return { ...DEFAULT_SETTINGS }
}

export const useAppStore = defineStore('app', () => {
  const initial = loadAppState()
  const history = ref<HistoryItem[]>(initial.history)
  // 兼容字段: settings 仍保留在 useAppStore state，
  // 初始化从独立 key 读取（如果 app v1 没有），否则用默认值
  const settings = ref<SettingsState>(loadAppSettings())
  const profile = ref<UserProfile | null>(initial.profile)
  const favorites = ref<string[]>(initial.favorites)
  const notes = ref<Note[]>(initial.notes)
  const achievements = ref<Achievement[]>(initial.achievements)
  const checkin = ref<CheckinInfo>(initial.checkin)
  const divinationRecords = ref<DivinationRecord[]>(initial.divinationRecords)
  const divinatorProfiles = ref<Record<string, DivinatorProfile>>(initial.divinatorProfiles)
  const activeDivinatorKey = ref<string>(initial.activeDivinatorKey)

  watch(
    [
      history,
      profile,
      favorites,
      notes,
      achievements,
      checkin,
      divinationRecords,
      divinatorProfiles,
      activeDivinatorKey,
    ],
    () =>
      saveAppState({
        history: history.value,
        profile: profile.value,
        favorites: favorites.value,
        notes: notes.value,
        achievements: achievements.value,
        checkin: checkin.value,
        divinationRecords: divinationRecords.value,
        divinatorProfiles: divinatorProfiles.value,
        activeDivinatorKey: activeDivinatorKey.value,
      }),
    { deep: true },
  )

  // 兼容: settings 写入独立 key
  watch(
    settings,
    (v) => {
      if (typeof window === 'undefined') return
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(v))
      } catch (_e) {
        // ignore
      }
    },
    { deep: true },
  )

  // ============ 历史记录 ============
  const MAX_HISTORY = 50
  function addHistory(item: Omit<HistoryItem, 'id' | 'time'>) {
    const it: HistoryItem = {
      ...item,
      id: `${item.tool}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: Date.now(),
    }
    history.value.unshift(it)
    if (history.value.length > MAX_HISTORY) history.value.length = MAX_HISTORY
    _checkAchievements(item.tool)
    const h = new Date().getHours()
    if (h >= 23 || h < 1) _ach('night-owl')
    if (h >= 3 && h < 5) _ach('dawn-quest')
    return it
  }

  function clearHistory() {
    history.value = []
  }

  function removeHistory(id: string) {
    history.value = history.value.filter((h) => h.id !== id)
    favorites.value = favorites.value.filter((f) => f !== id)
  }

  function historyByTool(tool: ToolKey) {
    return computed(() => history.value.filter((h) => h.tool === tool))
  }

  // ============ 个人档案 ============
  function _sanitizeProfile(p: UserProfile): UserProfile {
    const year = new Date().getFullYear()
    return {
      ...p,
      nickname: (p.nickname || '').trim() || '玄友',
      gender: (['male', 'female', 'other'] as const).includes(p.gender) ? p.gender : 'other',
      birthYear: Math.max(1900, Math.min(year, Number(p.birthYear) || year)),
      birthMonth: Math.max(1, Math.min(12, Number(p.birthMonth) || 1)),
      birthDay: Math.max(1, Math.min(31, Number(p.birthDay) || 1)),
      birthHour: Math.max(0, Math.min(23, Number(p.birthHour) || 0)),
      longitude: Math.max(-180, Math.min(180, Number(p.longitude) || 120)),
      birthplace: (p.birthplace || '').trim(),
    }
  }

  function setProfile(p: UserProfile) {
    profile.value = { ..._sanitizeProfile(p), createdAt: profile.value?.createdAt || Date.now() }
    _ach('profile-set')
    if (profile.value.nickname) {
      addDivinator(profile.value.nickname, '自己')
    }
  }

  function clearProfile() {
    profile.value = null
  }

  // ============ 收藏 ============
  function toggleFavorite(id: string) {
    const idx = favorites.value.indexOf(id)
    if (idx === -1) {
      favorites.value.unshift(id)
      _ach('fav-1')
      const fcount = favorites.value.length
      if (fcount >= 20) _ach('fav-20')
    } else {
      favorites.value.splice(idx, 1)
    }
  }

  function isFavorite(id: string) {
    return computed(() => favorites.value.includes(id))
  }

  // ============ 笔记 ============
  function addNote(n: Omit<Note, 'id' | 'time' | 'updateTime'>) {
    const it: Note = {
      ...n,
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: Date.now(),
      updateTime: Date.now(),
    }
    notes.value.unshift(it)
    _ach('note-1')
    if (notes.value.length >= 10) _ach('note-10')
    return it
  }

  function updateNote(id: string, patch: Partial<Note>) {
    const n = notes.value.find((x) => x.id === id)
    if (n) {
      Object.assign(n, patch, { updateTime: Date.now() })
    }
  }

  function removeNote(id: string) {
    notes.value = notes.value.filter((n) => n.id !== id)
  }

  // ============ 占卜用户与记录 ============
  const activeDivinator = computed<DivinatorProfile | null>(() => {
    if (!activeDivinatorKey.value) return null
    return divinatorProfiles.value[activeDivinatorKey.value] || null
  })

  const allDivinators = computed<DivinatorProfile[]>(() => {
    return Object.values(divinatorProfiles.value).sort((a, b) => a.createdAt - b.createdAt)
  })

  function setActiveDivinator(key: string) {
    if (divinatorProfiles.value[key]) {
      activeDivinatorKey.value = key
    }
  }

  function addDivinator(name: string, remark?: string): DivinatorProfile {
    const k = (name || '玄友').trim()
    if (divinatorProfiles.value[k]) {
      return divinatorProfiles.value[k]!
    }
    const p = newDivinator(k, remark)
    divinatorProfiles.value = { ...divinatorProfiles.value, [k]: p } as Record<
      string,
      DivinatorProfile
    >
    if (!activeDivinatorKey.value) activeDivinatorKey.value = k
    return p
  }

  function removeDivinator(key: string) {
    if (!divinatorProfiles.value[key]) return
    const newProfiles = { ...divinatorProfiles.value }
    delete newProfiles[key]
    divinatorProfiles.value = newProfiles
    divinationRecords.value = divinationRecords.value.filter((r) => r.userKey !== key)
    if (activeDivinatorKey.value === key) {
      const first = Object.keys(newProfiles)[0] || ''
      activeDivinatorKey.value = first
    }
  }

  function updateDivinatorRemark(key: string, remark: string) {
    if (divinatorProfiles.value[key]) {
      divinatorProfiles.value = {
        ...divinatorProfiles.value,
        [key]: { ...divinatorProfiles.value[key], remark },
      }
    }
  }

  function addDivinationRecord(input: {
    id: string
    userKey: string
    userName: string
    tool: ToolKey
    toolName: string
    brief: string
    date?: string
    timestamp?: number
  }): DivinationRecord {
    const ts = input.timestamp || Date.now()
    const date = input.date || todayStr(new Date(ts))
    const rec: DivinationRecord = {
      id: input.id,
      date,
      userKey: input.userKey,
      userName: input.userName,
      tool: input.tool,
      toolName: input.toolName,
      brief: input.brief,
      timestamp: ts,
    }
    divinationRecords.value = [rec, ...divinationRecords.value].slice(0, 1000)
    const profileEntry = divinatorProfiles.value[input.userKey]
    if (profileEntry) {
      const next = { ...profileEntry }
      next.totalCount = (next.totalCount || 0) + 1
      next.lastDate = date
      const unlockDate = getUnlockDateForTool(input.tool, date)
      if (unlockDate) {
        next.toolCooldown = { ...(next.toolCooldown || {}), [input.tool]: unlockDate }
      }
      divinatorProfiles.value = { ...divinatorProfiles.value, [input.userKey]: next }
    }
    return rec
  }

  function checkTodayDivination(userKey: string, tool: ToolKey) {
    return hasTodayRecord(divinationRecords.value, userKey, tool)
  }

  function getRecentRecords(userKey: string, days = 7) {
    const fromDate = (() => {
      const d = new Date()
      d.setDate(d.getDate() - days)
      return todayStr(d)
    })()
    return divinationRecords.value
      .filter((r) => r.userKey === userKey && r.date >= fromDate)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  function removeDivinationRecord(id: string) {
    const rec = divinationRecords.value.find((r) => r.id === id)
    divinationRecords.value = divinationRecords.value.filter((r) => r.id !== id)
    if (rec) {
      const profileEntry = divinatorProfiles.value[rec.userKey]
      if (profileEntry?.toolCooldown?.[rec.tool]) {
        const next = { ...profileEntry }
        const tc = { ...(next.toolCooldown || {}) }
        delete tc[rec.tool]
        next.toolCooldown = tc
        divinatorProfiles.value = { ...divinatorProfiles.value, [rec.userKey]: next }
      }
    }
  }

  // ============ 成就 ============
  function _ach(id: string) {
    const a = achievements.value.find((x) => x.id === id)
    if (a && !a.unlocked) {
      a.unlocked = true
      a.unlockTime = Date.now()
      a.current = a.target
      a.progress = 100
    }
  }

  function _updateAch(id: string, current: number) {
    const a = achievements.value.find((x) => x.id === id)
    if (a && !a.unlocked) {
      a.current = Math.min(current, a.target)
      a.progress = Math.floor((a.current / a.target) * 100)
      if (a.current >= a.target) {
        a.unlocked = true
        a.unlockTime = Date.now()
      }
    }
  }

  function _checkAchievements(tool: ToolKey) {
    const used = new Set(history.value.map((h) => h.tool))
    used.add(tool)
    _updateAch('first-use', used.size)
    if (used.size >= 3) _ach('use-3-tools')
    if (used.size >= 10) _ach('use-10-tools')
    if (used.size >= 30) _ach('use-30-tools')
    const cats = new Set<string>()
    used.forEach((k) => {
      const t = TOOLS.find((x) => x.key === k)
      if (t) cats.add(t.category)
    })
    _updateAch('category-all', cats.size)
  }

  // ============ 签到 ============
  function doCheckin(): { ok: boolean; streak: number; pointsGained: number; message: string } {
    const today = todayStr()
    if (checkin.value.lastDate === today) {
      return { ok: false, streak: checkin.value.streak, pointsGained: 0, message: '今日已签到' }
    }
    const yesterday = new Date(Date.now() - 86400000)
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    const newStreak = checkin.value.lastDate === yStr ? checkin.value.streak + 1 : 1
    const pointsGained = 10 + Math.min(newStreak, 30)
    checkin.value = {
      lastDate: today,
      streak: newStreak,
      totalDays: checkin.value.totalDays + 1,
      points: checkin.value.points + pointsGained,
    }
    if (newStreak >= 7) _ach('checkin-7')
    if (newStreak >= 30) _ach('checkin-30')
    if (newStreak >= 100) _ach('checkin-100')
    return { ok: true, streak: newStreak, pointsGained, message: '签到成功' }
  }

  // ============ 设置（兼容旧 API：内部写 settings，写入时自动同步到独立 key） ============
  function setFontSize(v: SettingsState['fontSize']) {
    settings.value.fontSize = v
  }
  function setReducedMotion(v: boolean) {
    settings.value.reducedMotion = v
  }
  function setSoundEnabled(v: boolean) {
    settings.value.soundEnabled = v
  }
  function setHapticsEnabled(v: boolean) {
    settings.value.hapticsEnabled = v
  }
  function setShowGuide(v: boolean) {
    settings.value.showGuide = v
  }
  function setTheme(v: ThemeKey) {
    settings.value.theme = v
  }
  function setFont(v: FontKey) {
    settings.value.font = v
  }
  function setMode(v: ModeKey) {
    settings.value.mode = v
  }
  function setI18n(v: SettingsState['i18n']) {
    settings.value.i18n = v
  }

  function resetAll() {
    history.value = []
    settings.value = { ...DEFAULT_SETTINGS }
    profile.value = null
    favorites.value = []
    notes.value = []
    achievements.value = JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS))
    checkin.value = { lastDate: '', streak: 0, totalDays: 0, points: 0 }
    divinationRecords.value = []
    divinatorProfiles.value = {}
    activeDivinatorKey.value = ''
  }

  // ============ 衍生 ============
  const fontSizeClass = computed(() => 'fs-' + settings.value.fontSize)
  const fontClass = computed(() => 'font-' + settings.value.font)
  const modeClass = computed(() => 'mode-' + settings.value.mode)
  const themeClass = computed(() => 'theme-' + settings.value.theme)
  const unlockedAchievements = computed(() => achievements.value.filter((a) => a.unlocked))
  const todayCheckedIn = computed(() => checkin.value.lastDate === todayStr())

  return {
    // state
    history,
    settings,
    profile,
    favorites,
    notes,
    achievements,
    checkin,
    divinationRecords,
    divinatorProfiles,
    activeDivinatorKey,
    // derived
    fontSizeClass,
    fontClass,
    modeClass,
    themeClass,
    unlockedAchievements,
    todayCheckedIn,
    activeDivinator,
    allDivinators,
    // history
    addHistory,
    clearHistory,
    removeHistory,
    historyByTool,
    // profile
    setProfile,
    clearProfile,
    // favorites
    toggleFavorite,
    isFavorite,
    // notes
    addNote,
    updateNote,
    removeNote,
    // divination users & records
    setActiveDivinator,
    addDivinator,
    removeDivinator,
    updateDivinatorRemark,
    addDivinationRecord,
    checkTodayDivination,
    getRecentRecords,
    removeDivinationRecord,
    // achievements
    _ach,
    _updateAch,
    _checkAchievements,
    // checkin
    doCheckin,
    // settings
    setFontSize,
    setReducedMotion,
    setSoundEnabled,
    setHapticsEnabled,
    setShowGuide,
    setTheme,
    setFont,
    setMode,
    setI18n,
    resetAll,
  }
})
