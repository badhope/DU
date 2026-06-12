/** 持久化存储工具函数 */
import type { AppSettings, UserProfile, HistoryItem, Note, Achievement, CheckinInfo, ChatSession, DivinationRecord, DivinatorProfile } from './types'

const STORAGE_KEY = 'mistverse-state-v2'

export interface PersistState {
  history: HistoryItem[]
  settings: AppSettings
  profile: UserProfile | null
  favorites: string[]
  notes: Note[]
  achievements: Achievement[]
  checkin: CheckinInfo
  chatSessions: Record<string, ChatSession>
  divinationRecords: DivinationRecord[]
  divinatorProfiles: Record<string, DivinatorProfile>
  activeDivinatorKey: string
}

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
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
    id: 'ai-master',
    name: 'AI 玄谈',
    desc: '与 6 位 AI 师均交流',
    icon: '智',
    unlocked: false,
    progress: 0,
    target: 6,
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

export const DEFAULT_STATE: PersistState = {
  history: [],
  settings: {
    fontSize: 'md',
    reducedMotion: false,
    soundEnabled: true,
    hapticsEnabled: true,
    showGuide: true,
    theme: 'xuanhuang',
    font: 'kaiti',
    mode: 'dark',
    i18n: 'zh-CN',
  },
  profile: null,
  favorites: [],
  notes: [],
  achievements: DEFAULT_ACHIEVEMENTS,
  checkin: { lastDate: '', streak: 0, totalDays: 0, points: 0 },
  chatSessions: {},
  divinationRecords: [],
  divinatorProfiles: {},
  activeDivinatorKey: '',
}

export function loadState(): PersistState {
  if (typeof window === 'undefined') return JSON.parse(JSON.stringify(DEFAULT_STATE))
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE))
    const parsed = JSON.parse(raw) as Partial<PersistState>
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      profile: parsed.profile || null,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      achievements:
        Array.isArray(parsed.achievements) && parsed.achievements.length
          ? parsed.achievements
          : JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS)),
      checkin: parsed.checkin || { lastDate: '', streak: 0, totalDays: 0, points: 0 },
      chatSessions: parsed.chatSessions || {},
      divinationRecords: Array.isArray(parsed.divinationRecords) ? parsed.divinationRecords : [],
      divinatorProfiles: parsed.divinatorProfiles || {},
      activeDivinatorKey: parsed.activeDivinatorKey || '',
    }
  } catch (_e) {
    return JSON.parse(JSON.stringify(DEFAULT_STATE))
  }
}

export function saveState(s: PersistState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch (_e) {}
}
