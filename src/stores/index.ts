/**
 * 玄枢 v1.0.0 · Store 入口（re-export）
 *
 * SP-3 拆分后（保持向后兼容）:
 *   - useAppStore: 业务数据（history / profile / favorites / notes /
 *                   achievements / checkin / divination / settings 兼容字段）
 *   - useSettingsStore: 全局设置（独立 API，主题/字号/字体/动效/声音/触感/引导/语言）
 *
 * 持久化拆分:
 *   - mistverse-app-v1        ← 业务数据（独立 key）
 *   - mistverse-settings-v1   ← 全局设置（独立 key）
 *   - mistverse-state-v3 / v2 ← 旧 key 启动时拆分到 v1，旧 key 保留不动
 */
export { useAppStore } from './app'
export { useSettingsStore, DEFAULT_SETTINGS } from './settings'
export type { SettingsState, ThemeKey, FontKey, ModeKey, FontSizeKey, I18nKey } from './settings'
export type {
  DivinationRecord,
  ToolKey,
  UserProfile,
  HistoryItem,
  Note,
  Achievement,
  CheckinInfo,
} from './app'
