/** 全局状态管理 - 主入口（协调各子 store 的持久化） */
import { defineStore } from 'pinia'
import { watch } from 'vue'
import { useSettingsStore } from './settings'
import { useHistoryStore } from './history'
import { useProfileStore } from './profile'
import { useFavoritesStore } from './favorites'
import { useNotesStore } from './notes'
import { useAchievementsStore } from './achievements'
import { useCheckinStore } from './checkin'
import { useChatStore } from './chat'
import { useDivinationStore } from './divination'
import { loadState, saveState } from './persist'

export const useAppStore = defineStore('app', () => {
  // 初始化所有子 store
  const settings = useSettingsStore()
  const history = useHistoryStore()
  const profile = useProfileStore()
  const favorites = useFavoritesStore()
  const notes = useNotesStore()
  const achievements = useAchievementsStore()
  const checkin = useCheckinStore()
  const chat = useChatStore()
  const divination = useDivinationStore()

  // 从 localStorage 加载初始状态并分发到各子 store
  const initial = loadState()
  Object.assign(settings.settings, initial.settings)
  history.history = initial.history
  profile.profile = initial.profile
  favorites.favorites = initial.favorites
  notes.notes = initial.notes
  achievements.achievements = initial.achievements
  Object.assign(checkin.checkin, initial.checkin)
  chat.chatSessions = initial.chatSessions
  divination.divinationRecords = initial.divinationRecords
  divination.divinatorProfiles = initial.divinatorProfiles
  divination.activeDivinatorKey = initial.activeDivinatorKey

  // 监听所有子 store 的响应式数据，统一持久化
  watch(
    [
      history.history,
      settings.settings,
      profile.profile,
      favorites.favorites,
      notes.notes,
      achievements.achievements,
      checkin.checkin,
      chat.chatSessions,
      divination.divinationRecords,
      divination.divinatorProfiles,
      divination.activeDivinatorKey,
    ],
    () =>
      saveState({
        history: history.history,
        settings: settings.settings,
        profile: profile.profile,
        favorites: favorites.favorites,
        notes: notes.notes,
        achievements: achievements.achievements,
        checkin: checkin.checkin,
        chatSessions: chat.chatSessions,
        divinationRecords: divination.divinationRecords,
        divinatorProfiles: divination.divinatorProfiles,
        activeDivinatorKey: divination.activeDivinatorKey,
      }),
    { deep: true },
  )

  // 统一重置
  function resetAll() {
    settings.reset()
    history.reset()
    profile.reset()
    favorites.reset()
    notes.reset()
    achievements.reset()
    checkin.reset()
    chat.reset()
    divination.reset()
  }

  return {
    settings,
    history,
    profile,
    favorites,
    notes,
    achievements,
    checkin,
    chat,
    divination,
    resetAll,
  }
})

// 导出所有类型
export * from './types'

// 导出所有子 store
export { useSettingsStore } from './settings'
export { useHistoryStore } from './history'
export { useProfileStore } from './profile'
export { useFavoritesStore } from './favorites'
export { useNotesStore } from './notes'
export { useAchievementsStore } from './achievements'
export { useCheckinStore } from './checkin'
export { useChatStore } from './chat'
export { useDivinationStore } from './divination'

// 导出持久化工具
export { loadState, saveState, DEFAULT_STATE, DEFAULT_ACHIEVEMENTS } from './persist'
export type { PersistState } from './persist'
