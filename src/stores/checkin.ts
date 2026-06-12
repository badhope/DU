/** 签到系统 store */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CheckinInfo } from './types'
import { todayStr as _todayStr } from '@/utils/daily-cooldown'

function todayStr(d: Date = new Date()): string {
  return _todayStr(d)
}

export const useCheckinStore = defineStore('checkin', () => {
  const checkin = ref<CheckinInfo>({ lastDate: '', streak: 0, totalDays: 0, points: 0 })

  const todayCheckedIn = computed(() => checkin.value.lastDate === todayStr())

  function doCheckin(
    onStreakMilestone?: (streak: number) => void,
  ): { ok: boolean; streak: number; pointsGained: number; message: string } {
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
    if (onStreakMilestone) {
      if (newStreak >= 7) onStreakMilestone(7)
      if (newStreak >= 30) onStreakMilestone(30)
      if (newStreak >= 100) onStreakMilestone(100)
    }
    return { ok: true, streak: newStreak, pointsGained, message: '签到成功' }
  }

  function reset() {
    checkin.value = { lastDate: '', streak: 0, totalDays: 0, points: 0 }
  }

  return {
    checkin,
    todayCheckedIn,
    doCheckin,
    reset,
  }
})
