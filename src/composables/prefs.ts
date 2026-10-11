/**
 * DU v2 · 外观设置
 *
 * 皮肤（夜墨 / 宣纸）与节气强调色写在 <html> 的 data-* 上，
 * 组件只消费 var(--*)，符合"颜色只出现在 theme.css"的约定。
 */
import { ref, watchEffect } from 'vue'

const KEY = 'du.prefs.v1'

export type Skin = 'ink' | 'paper'

interface Prefs {
  skin: Skin
  /** 关闭节气换色，尊重用户偏好 */
  followSeason: boolean
}

const fallback: Prefs = { skin: 'ink', followSeason: true }

function load(): Prefs {
  try {
    return { ...fallback, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Prefs) }
  } catch {
    return fallback
  }
}

export const prefs = ref<Prefs>(load())

/** 立春起春、立夏起夏、立秋起秋、立冬起冬（按月近似，精确节气由 core/jieqi 提供） */
export function seasonOf(d = new Date()): 'spring' | 'summer' | 'autumn' | 'winter' {
  const m = d.getMonth() + 1
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 7) return 'summer'
  if (m >= 8 && m <= 10) return 'autumn'
  return 'winter'
}

watchEffect(() => {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs.value))
  } catch {
    /* 隐私模式：设置不持久，界面照常 */
  }
  const el = document.documentElement
  el.dataset.skin = prefs.value.skin
  if (prefs.value.followSeason) el.dataset.season = seasonOf()
  else delete el.dataset.season
})

export const toggleSkin = () =>
  (prefs.value = { ...prefs.value, skin: prefs.value.skin === 'ink' ? 'paper' : 'ink' })
