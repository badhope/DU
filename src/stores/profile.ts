/** 个人档案 store */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserProfile } from './types'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | null>(null)

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

  function setProfile(p: UserProfile, onProfileSet?: () => void, onAddDivinator?: (name: string) => void) {
    profile.value = { ..._sanitizeProfile(p), createdAt: profile.value?.createdAt || Date.now() }
    if (onProfileSet) onProfileSet()
    if (profile.value.nickname && onAddDivinator) {
      onAddDivinator(profile.value.nickname)
    }
  }

  function clearProfile() {
    profile.value = null
  }

  function reset() {
    profile.value = null
  }

  return {
    profile,
    setProfile,
    clearProfile,
    reset,
  }
})
