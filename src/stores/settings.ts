/**
 * 玄枢 v1.0.0 · 全局设置 store
 *
 * 主题/字号/字体/动效/声音/触感/引导/语言
 * 持久化 key: mistverse-settings-v1
 * 迁移: 旧 v3 key (mistverse-state-v3) 的 settings 字段 → 剥离后写 v1
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type ThemeKey = 'xuanhuang' | 'xuanzi' | 'xuanqing'
export type FontKey = 'kaiti' | 'songti' | 'zhuanshu' | 'heiti'
export type ModeKey = 'dark' | 'light'
export type FontSizeKey = 'sm' | 'md' | 'lg'
export type I18nKey = 'zh-CN' | 'zh-TW' | 'en' | 'ja'

export interface SettingsState {
  fontSize: FontSizeKey
  reducedMotion: boolean
  soundEnabled: boolean
  hapticsEnabled: boolean
  showGuide: boolean
  theme: ThemeKey
  font: FontKey
  mode: ModeKey
  i18n: I18nKey
}

const STORAGE_KEY = 'mistverse-settings-v1'
const LEGACY_KEY = 'mistverse-state-v3'

export const DEFAULT_SETTINGS: SettingsState = {
  fontSize: 'md',
  reducedMotion: false,
  soundEnabled: true,
  hapticsEnabled: true,
  showGuide: true,
  theme: 'xuanhuang',
  font: 'kaiti',
  mode: 'dark',
  i18n: 'zh-CN',
}

function loadSettings(): SettingsState {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
  // 1) 优先 v1
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SettingsState>
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (_e) {
    // ignore
  }
  // 2) 回退 v3 旧 key，剥离 settings 字段写 v1
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { settings?: Partial<SettingsState> }
      if (parsed.settings) {
        const next = { ...DEFAULT_SETTINGS, ...parsed.settings }
        saveSettings(next)
        return next
      }
    }
  } catch (_e) {
    // ignore
  }
  return { ...DEFAULT_SETTINGS }
}

function saveSettings(s: SettingsState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch (_e) {
    // ignore
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = loadSettings()
  const fontSize = ref<FontSizeKey>(initial.fontSize)
  const reducedMotion = ref<boolean>(initial.reducedMotion)
  const soundEnabled = ref<boolean>(initial.soundEnabled)
  const hapticsEnabled = ref<boolean>(initial.hapticsEnabled)
  const showGuide = ref<boolean>(initial.showGuide)
  const theme = ref<ThemeKey>(initial.theme)
  const font = ref<FontKey>(initial.font)
  const mode = ref<ModeKey>(initial.mode)
  const i18n = ref<I18nKey>(initial.i18n)

  watch(
    [fontSize, reducedMotion, soundEnabled, hapticsEnabled, showGuide, theme, font, mode, i18n],
    () =>
      saveSettings({
        fontSize: fontSize.value,
        reducedMotion: reducedMotion.value,
        soundEnabled: soundEnabled.value,
        hapticsEnabled: hapticsEnabled.value,
        showGuide: showGuide.value,
        theme: theme.value,
        font: font.value,
        mode: mode.value,
        i18n: i18n.value,
      }),
    { deep: true },
  )

  function setFontSize(v: FontSizeKey): void {
    fontSize.value = v
  }
  function setReducedMotion(v: boolean): void {
    reducedMotion.value = v
  }
  function setSoundEnabled(v: boolean): void {
    soundEnabled.value = v
  }
  function setHapticsEnabled(v: boolean): void {
    hapticsEnabled.value = v
  }
  function setShowGuide(v: boolean): void {
    showGuide.value = v
  }
  function setTheme(v: ThemeKey): void {
    theme.value = v
  }
  function setFont(v: FontKey): void {
    font.value = v
  }
  function setMode(v: ModeKey): void {
    mode.value = v
  }
  function setI18n(v: I18nKey): void {
    i18n.value = v
  }

  function resetAll(): void {
    fontSize.value = DEFAULT_SETTINGS.fontSize
    reducedMotion.value = DEFAULT_SETTINGS.reducedMotion
    soundEnabled.value = DEFAULT_SETTINGS.soundEnabled
    hapticsEnabled.value = DEFAULT_SETTINGS.hapticsEnabled
    showGuide.value = DEFAULT_SETTINGS.showGuide
    theme.value = DEFAULT_SETTINGS.theme
    font.value = DEFAULT_SETTINGS.font
    mode.value = DEFAULT_SETTINGS.mode
    i18n.value = DEFAULT_SETTINGS.i18n
  }

  // 衍生 computed
  const fontSizeClass = computed(() => 'fs-' + fontSize.value)
  const fontClass = computed(() => 'font-' + font.value)
  const modeClass = computed(() => 'mode-' + mode.value)
  const themeClass = computed(() => 'theme-' + theme.value)

  return {
    fontSize,
    reducedMotion,
    soundEnabled,
    hapticsEnabled,
    showGuide,
    theme,
    font,
    mode,
    i18n,
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
    resetAll,
  }
})
