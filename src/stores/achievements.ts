/** 成就系统 store */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TOOLS } from '@/config/tools'
import type { Achievement, ToolKey } from './types'
import { DEFAULT_ACHIEVEMENTS } from './persist'

export const useAchievementsStore = defineStore('achievements', () => {
  const achievements = ref<Achievement[]>(JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS)))

  const unlockedAchievements = computed(() => achievements.value.filter((a) => a.unlocked))

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

  function checkToolAchievements(tool: ToolKey, usedTools: Set<ToolKey>) {
    usedTools.add(tool)
    _updateAch('first-use', usedTools.size)
    if (usedTools.size >= 3) _ach('use-3-tools')
    if (usedTools.size >= 10) _ach('use-10-tools')
    if (usedTools.size >= 30) _ach('use-30-tools')
    const cats = new Set<string>()
    usedTools.forEach((k) => {
      const t = TOOLS.find((x) => x.key === k)
      if (t) cats.add(t.category)
    })
    _updateAch('category-all', cats.size)
  }

  function reset() {
    achievements.value = JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS))
  }

  return {
    achievements,
    unlockedAchievements,
    _ach,
    _updateAch,
    checkToolAchievements,
    reset,
  }
})
