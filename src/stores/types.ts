/** 全局状态类型定义 */

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
  // 高阶命理
  | 'ziwei'
  | 'xuankong'
  | 'tieban'
  | 'xiaoliuren'
  | 'zhuge'
  | 'life'
  | 'astro'
  | 'maya'
  // AI 助手
  | 'ai-gua'
  | 'ai-ming'
  | 'ai-feng'
  | 'ai-name'
  | 'ai-jiankang'
  | 'ai-xiuxin'
  // 个人中心
  | 'profile'
  | 'dashboard'
  | 'checkin'
  | 'poster'
  | 'users'

export type ThemeKey = 'xuanhuang' | 'xuanzi' | 'xuanqing'
export type FontKey = 'kaiti' | 'songti' | 'zhuanshu' | 'heiti'
export type ModeKey = 'dark' | 'light'

// ============ 占卜用户与记录 ============
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

export interface DivinatorProfile {
  key: string
  name: string
  remark?: string
  createdAt: number
  totalCount: number
  lastDate?: string
  toolCooldown: Partial<Record<ToolKey, string>> // toolKey -> 'YYYY-MM-DD' 可以再次占卜
}

// ============ 个人档案 ============
export interface UserProfile {
  nickname: string
  gender: 'male' | 'female' | 'other'
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number
  longitude: number // 经度 (东经正，西经负)
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
  progress: number // 0-100
  target: number
  current: number
}

/** AI 六师聊天会话 */
export interface ChatSession {
  masterKey: string // 'ai-gua' | 'ai-ming' | ...
  messages: Array<{
    role: 'user' | 'master'
    text: string
    time: number
    cite?: string
  }>
  persona?: string // 用户设置的 persona（可选）
  lastActiveTime: number
}

export interface CheckinInfo {
  lastDate: string // YYYY-MM-DD
  streak: number
  totalDays: number
  points: number
}

export interface AppSettings {
  fontSize: 'sm' | 'md' | 'lg'
  reducedMotion: boolean
  soundEnabled: boolean
  hapticsEnabled: boolean
  showGuide: boolean
  theme: ThemeKey
  font: FontKey
  mode: ModeKey
  i18n: 'zh-CN' | 'zh-TW' | 'en' | 'ja'
}
