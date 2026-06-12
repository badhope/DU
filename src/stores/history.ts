/** 历史记录 store */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HistoryItem, ToolKey } from './types'

export const useHistoryStore = defineStore('history', () => {
  const MAX_HISTORY = 50
  const history = ref<HistoryItem[]>([])

  function addHistory(item: Omit<HistoryItem, 'id' | 'time'>, onToolUsed?: (tool: ToolKey, usedTools: Set<ToolKey>) => void) {
    const it: HistoryItem = {
      ...item,
      id: `${item.tool}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: Date.now(),
    }
    history.value.unshift(it)
    if (history.value.length > MAX_HISTORY) history.value.length = MAX_HISTORY
    if (onToolUsed) {
      const used = new Set(history.value.map((h) => h.tool))
      onToolUsed(item.tool, used)
    }
    return it
  }

  function clearHistory() {
    history.value = []
  }

  function removeHistory(id: string) {
    history.value = history.value.filter((h) => h.id !== id)
  }

  function historyByTool(tool: ToolKey) {
    return computed(() => history.value.filter((h) => h.tool === tool))
  }

  function reset() {
    history.value = []
  }

  return {
    history,
    addHistory,
    clearHistory,
    removeHistory,
    historyByTool,
    reset,
  }
})
