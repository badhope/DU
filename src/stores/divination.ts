/** 占卜用户与记录 store */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DivinationRecord, DivinatorProfile, ToolKey } from './types'
import { newDivinator, getUnlockDateForTool, hasTodayRecord, todayStr as _todayStr } from '@/utils/daily-cooldown'

function todayStr(d: Date = new Date()): string {
  return _todayStr(d)
}

export const useDivinationStore = defineStore('divination', () => {
  const divinationRecords = ref<DivinationRecord[]>([])
  const divinatorProfiles = ref<Record<string, DivinatorProfile>>({})
  const activeDivinatorKey = ref<string>('')

  /** 当前激活用户档案 */
  const activeDivinator = computed<DivinatorProfile | null>(() => {
    if (!activeDivinatorKey.value) return null
    return divinatorProfiles.value[activeDivinatorKey.value] || null
  })

  /** 所有用户列表（按 createdAt 升序） */
  const allDivinators = computed<DivinatorProfile[]>(() => {
    return Object.values(divinatorProfiles.value).sort((a, b) => a.createdAt - b.createdAt)
  })

  /** 设置当前激活用户 */
  function setActiveDivinator(key: string) {
    if (divinatorProfiles.value[key]) {
      activeDivinatorKey.value = key
    }
  }

  /** 添加新用户 */
  function addDivinator(name: string, remark?: string): DivinatorProfile {
    const k = (name || '玄友').trim()
    if (divinatorProfiles.value[k]) {
      return divinatorProfiles.value[k]
    }
    const p = newDivinator(k, remark)
    divinatorProfiles.value = { ...divinatorProfiles.value, [k]: p }
    if (!activeDivinatorKey.value) activeDivinatorKey.value = k
    return p
  }

  /** 删除用户 */
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

  /** 更新用户备注 */
  function updateDivinatorRemark(key: string, remark: string) {
    if (divinatorProfiles.value[key]) {
      divinatorProfiles.value = {
        ...divinatorProfiles.value,
        [key]: { ...divinatorProfiles.value[key], remark },
      }
    }
  }

  /** 提交一条占卜记录 */
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
    const profile = divinatorProfiles.value[input.userKey]
    if (profile) {
      const next = { ...profile }
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

  /** 检查同人同日同工具是否已测 */
  function checkTodayDivination(userKey: string, tool: ToolKey) {
    return hasTodayRecord(divinationRecords.value, userKey, tool)
  }

  /** 获取某用户最近 N 天记录 */
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

  /** 删除一条占卜记录（解除冷却） */
  function removeDivinationRecord(id: string) {
    const rec = divinationRecords.value.find((r) => r.id === id)
    divinationRecords.value = divinationRecords.value.filter((r) => r.id !== id)
    if (rec) {
      const profile = divinatorProfiles.value[rec.userKey]
      if (profile?.toolCooldown?.[rec.tool]) {
        const next = { ...profile }
        const tc = { ...(next.toolCooldown || {}) }
        delete tc[rec.tool]
        next.toolCooldown = tc
        divinatorProfiles.value = { ...divinatorProfiles.value, [rec.userKey]: next }
      }
    }
  }

  function reset() {
    divinationRecords.value = []
    divinatorProfiles.value = {}
    activeDivinatorKey.value = ''
  }

  return {
    divinationRecords,
    divinatorProfiles,
    activeDivinatorKey,
    activeDivinator,
    allDivinators,
    setActiveDivinator,
    addDivinator,
    removeDivinator,
    updateDivinatorRemark,
    addDivinationRecord,
    checkTodayDivination,
    getRecentRecords,
    removeDivinationRecord,
    reset,
  }
})
