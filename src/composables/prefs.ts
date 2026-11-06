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

/**
 * 默认外观。
 *
 * 默认亮色（宣纸）而不是夜墨：这是一个阅读与写作类的工具，用户在明亮环境里
 * 读一段回答的时间远多于深夜；深色作为可选皮肤保留，一个按钮就能切回去。
 * 旧版本把 ink 当默认，导致第一次打开是全黑页面——这是体验问题，不是风格问题。
 */
const fallback: Prefs = { skin: 'paper', followSeason: true }

function load(): Prefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Prefs>
    return {
      skin: parsed.skin === 'ink' ? 'ink' : parsed.skin === 'paper' ? 'paper' : fallback.skin,
      followSeason: parsed.followSeason !== false,
    }
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
