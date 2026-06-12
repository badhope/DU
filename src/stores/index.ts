/**
 * 全局状态管理 — 组合门面
 *
 * 将原 950 行单体 store 拆分为模块化子 store，
 * 本文件作为薄组合层，保持对外 API 不变（53 个消费文件无需修改），
 * 同时处理跨 store 协调（如 addHistory → 成就检查）。
 */
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
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
import type { ToolKey, HistoryItem, UserProfile, Note, ChatSession, DivinationRecord, DivinatorProfile } from './types'

export const useAppStore = defineStore('app', () => {
  // ── 初始化子 store ──
  const settings = useSettingsStore()
  const history = useHistoryStore()
  const profile = useProfileStore()
  const favorites = useFavoritesStore()
  const notes = useNotesStore()
  const achievements = useAchievementsStore()
  const checkin = useCheckinStore()
  const chat = useChatStore()
  const divination = useDivinationStore()

  // ── 从 localStorage 恢复初始状态 ──
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

  // ── 统一持久化（监听所有子 store 的响应式数据） ──
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

  // ── 跨 store 协调：历史记录 + 成就 ──
  function addHistory(item: Omit<HistoryItem, 'id' | 'time'>) {
    const it = history.addHistory(item)
    // 触发成就检查
    achievements.checkToolAchievements(item.tool, new Set(history.history.map((h) => h.tool)))
    const h = new Date().getHours()
    if (h >= 23 || h < 1) achievements._ach('night-owl')
    if (h >= 3 && h < 5) achievements._ach('dawn-quest')
    return it
  }

  function removeHistory(id: string) {
    history.removeHistory(id)
    favorites.favorites = favorites.favorites.filter((f) => f !== id)
  }

  // ── 跨 store 协调：个人档案 + 占卜用户 ──
  function setProfile(p: UserProfile) {
    profile.setProfile(
      p,
      () => achievements._ach('profile-set'),
      (name: string) => divination.addDivinator(name, '自己'),
    )
  }

  // ── 跨 store 协调：收藏 + 成就 ──
  function toggleFavorite(id: string) {
    favorites.toggleFavorite(
      id,
      () => achievements._ach('fav-1'),
      (count: number) => {
        if (count >= 20) achievements._ach('fav-20')
      },
    )
  }

  // ── 跨 store 协调：笔记 + 成就 ──
  function addNote(n: Omit<Note, 'id' | 'time' | 'updateTime'>) {
    const it = notes.addNote(
      n,
      (count: number) => {
        if (count >= 1) achievements._ach('note-1')
        if (count >= 10) achievements._ach('note-10')
      },
    )
    return it
  }

  // ── 跨 store 协调：签到 + 成就 ──
  function doCheckin() {
    return checkin.doCheckin((streak: number) => {
      if (streak >= 7) achievements._ach('checkin-7')
      if (streak >= 30) achievements._ach('checkin-30')
      if (streak >= 100) achievements._ach('checkin-100')
    })
  }

  // ── 统一重置 ──
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

  // ── 衍生状态 ──
  const totalChatTurns = computed(() => chat.totalChatTurns)
  const chattedMasters = computed(() => chat.chattedMasters)
  const activeDivinator = computed(() => divination.activeDivinator)
  const allDivinators = computed(() => divination.allDivinators)
  const unlockedAchievements = computed(() => achievements.unlockedAchievements)
  const todayCheckedIn = computed(() => checkin.todayCheckedIn)

  return {
    // ── state（直接暴露子 store 的响应式数据） ──
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

    // ── derived ──
    fontSizeClass: settings.fontSizeClass,
    fontClass: settings.fontClass,
    modeClass: settings.modeClass,
    themeClass: settings.themeClass,
    unlockedAchievements,
    todayCheckedIn,
    totalChatTurns,
    chattedMasters,
    activeDivinator,
    allDivinators,

    // ── history ──
    addHistory,
    clearHistory: history.clearHistory,
    removeHistory,
    historyByTool: history.historyByTool,

    // ── profile ──
    setProfile,
    clearProfile: profile.clearProfile,

    // ── favorites ──
    toggleFavorite,
    isFavorite: favorites.isFavorite,

    // ── notes ──
    addNote,
    updateNote: notes.updateNote,
    removeNote: notes.removeNote,

    // ── chat ──
    getChatSession: chat.getChatSession,
    appendChatMessage: chat.appendChatMessage,
    setChatPersona: chat.setChatPersona,
    clearChatSession: chat.clearChatSession,
    clearAllChatSessions: chat.clearAllChatSessions,

    // ── divination users & records ──
    setActiveDivinator: divination.setActiveDivinator,
    addDivinator: divination.addDivinator,
    removeDivinator: divination.removeDivinator,
    updateDivinatorRemark: divination.updateDivinatorRemark,
    addDivinationRecord: divination.addDivinationRecord,
    checkTodayDivination: divination.checkTodayDivination,
    getRecentRecords: divination.getRecentRecords,
    removeDivinationRecord: divination.removeDivinationRecord,

    // ── achievements ──
    _ach: achievements._ach,
    _updateAch: achievements._updateAch,
    _checkAchievements: achievements.checkToolAchievements,

    // ── checkin ──
    doCheckin,

    // ── settings ──
    setFontSize: settings.setFontSize,
    setReducedMotion: settings.setReducedMotion,
    setSoundEnabled: settings.setSoundEnabled,
    setHapticsEnabled: settings.setHapticsEnabled,
    setShowGuide: settings.setShowGuide,
    setTheme: settings.setTheme,
    setFont: settings.setFont,
    setMode: settings.setMode,
    setI18n: settings.setI18n,

    resetAll,
  }
})

// ── 导出所有类型 ──
export * from './types'

// ── 导出子 store（供新代码直接使用） ──
export { useSettingsStore } from './settings'
export { useHistoryStore } from './history'
export { useProfileStore } from './profile'
export { useFavoritesStore } from './favorites'
export { useNotesStore } from './notes'
export { useAchievementsStore } from './achievements'
export { useCheckinStore } from './checkin'
export { useChatStore } from './chat'
export { useDivinationStore } from './divination'

// ── 导出持久化工具 ──
export { loadState, saveState, DEFAULT_STATE, DEFAULT_ACHIEVEMENTS } from './persist'
export type { PersistState } from './persist'
