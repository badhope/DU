/** 应用设置 store */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppSettings, ThemeKey, FontKey, ModeKey } from './types'
import { DEFAULT_STATE } from './persist'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>({ ...DEFAULT_STATE.settings })

  function setFontSize(v: 'sm' | 'md' | 'lg') { settings.value.fontSize = v }
  function setReducedMotion(v: boolean) { settings.value.reducedMotion = v }
  function setSoundEnabled(v: boolean) { settings.value.soundEnabled = v }
  function setHapticsEnabled(v: boolean) { settings.value.hapticsEnabled = v }
  function setShowGuide(v: boolean) { settings.value.showGuide = v }
  function setTheme(v: ThemeKey) { settings.value.theme = v }
  function setFont(v: FontKey) { settings.value.font = v }
  function setMode(v: ModeKey) { settings.value.mode = v }
  function setI18n(v: 'zh-CN' | 'zh-TW' | 'en' | 'ja') { settings.value.i18n = v }

  function reset() {
    settings.value = JSON.parse(JSON.stringify(DEFAULT_STATE.settings))
  }

  // 衍生
  const fontSizeClass = computed(() => 'fs-' + settings.value.fontSize)
  const fontClass = computed(() => 'font-' + settings.value.font)
  const modeClass = computed(() => 'mode-' + settings.value.mode)
  const themeClass = computed(() => 'theme-' + settings.value.theme)

  return {
    settings,
    fontSizeClass,
    fontClass,
    modeClass,
    themeClass,
    setFontSize,
    setReducedMotion,
    setSoundEnabled,
    setHapticsEnabled,
    setShowGuide,
    setTheme,
    setFont,
    setMode,
    setI18n,
    reset,
  }
})
