/**
 * 玄枢 MISTVERSE · 冷却/用户切换 Composable
 *
 * 统一封装"一日同人同工具不重测"业务逻辑，
 * 让 9 个重事类工具页面共享同一套代码。
 *
 * 使用：
 *   const cd = useCooldown({ tool: 'liuyao', toolName: '玄枢易盘' })
 *   if (!cd.guard()) return        // 守门，未通过则弹窗
 *   // ... 业务逻辑 ...
 *   cd.commit(`${gua.name}·变${bian.name}`, input, output)
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { useAppStore, type DivinationRecord, type ToolKey } from '@/stores'
import { COOLDOWN_TYPE } from '@shared/utils/daily-cooldown'

export interface UseCooldownOptions {
  /** 工具标识 */
  tool: ToolKey
  /** 工具显示名 */
  toolName: string
  /** 类别（用于 history 记录） */
  category?: string
}

export interface CooldownController {
  // 状态
  showCooldown: Ref<boolean>
  cooldownRecord: Ref<DivinationRecord | null>
  showAddUser: Ref<boolean>
  newUserName: Ref<string>
  newUserRemark: Ref<string>
  forceBypass: Ref<boolean>
  // 计算
  currentUserLocked: ComputedRef<boolean>
  isFree: ComputedRef<boolean>
  isActive: ComputedRef<boolean> // 是否重事类
  profiles: ComputedRef<NonNullable<ReturnType<typeof useAppStore>['divinatorProfiles']>>
  activeUser: ComputedRef<NonNullable<ReturnType<typeof useAppStore>['activeDivinator']> | null>
  // 方法
  /** 在起卦前调用。未激活用户 → 弹添加；冷却中 → 弹阻止；通过 → true */
  guard(): boolean
  /** 强行起卦，绕过冷却 */
  bypass(): void
  /** 重置绕过标记 */
  resetBypass(): void
  /** 起卦成功提交记录 */
  commit(
    brief: string,
    fullInput?: Record<string, unknown>,
    fullOutput?: Record<string, unknown>,
  ): void
  /** 弹窗关闭 */
  onCooldownClose(): void
  /** 弹窗 → 换人 */
  onCooldownSwitchUser(): void
  /** 弹窗 → 换工具 */
  onCooldownSwitchTool(): void
  /** 弹窗 → 不听劝继续 */
  onCooldownIgnore(): void
  /** 添加用户 */
  onAddUser(): void
  /** 确认添加用户 */
  confirmAddUser(): void
  /** 切换用户 */
  switchUser(key: string): void
}

export function useCooldown(opts: UseCooldownOptions): CooldownController {
  const app = useAppStore()
  const tool = opts.tool
  const isFree = computed(() => COOLDOWN_TYPE[tool] === 'free')
  const isActive = computed(() => COOLDOWN_TYPE[tool] === 'once-per-day')

  const showCooldown = ref(false)
  const cooldownRecord = ref<DivinationRecord | null>(null)
  const showAddUser = ref(false)
  const newUserName = ref('')
  const newUserRemark = ref('')
  const forceBypass = ref(false)

  const currentUserLocked = computed(() => {
    if (!isActive.value) return false
    if (!app.activeDivinatorKey) return false
    return !!app.checkTodayDivination(app.activeDivinatorKey, tool)
  })

  /** 用户列表（来自 store） */
  const profiles = computed(() => app.divinatorProfiles || {})
  const activeUser = computed(() => app.activeDivinator || null)

  const guard = (): boolean => {
    if (isFree.value) return true
    if (!app.activeDivinatorKey) {
      showAddUser.value = true
      return false
    }
    if (currentUserLocked.value && !forceBypass.value) {
      cooldownRecord.value = app.checkTodayDivination(app.activeDivinatorKey, tool) || null
      showCooldown.value = true
      return false
    }
    return true
  }

  const bypass = (): void => {
    forceBypass.value = true
  }
  const resetBypass = (): void => {
    forceBypass.value = false
  }

  const commit = (
    brief: string,
    fullInput: Record<string, unknown> = {},
    fullOutput: Record<string, unknown> = {},
  ) => {
    if (isFree.value) return
    if (!app.activeDivinatorKey) return
    // 加 6 位随机后缀避免同毫秒 ID 冲突
    const rand = Math.random().toString(36).slice(2, 8)
    app.addDivinationRecord({
      id: `${tool}-${Date.now()}-${rand}`,
      userKey: app.activeDivinatorKey,
      userName: app.activeDivinator?.name || '玄友',
      tool,
      toolName: opts.toolName || tool,
      brief,
    })
    app.addHistory({
      tool,
      toolName: opts.toolName || tool,
      category: opts.category || '占卜',
      input: fullInput,
      output: fullOutput,
      brief,
    })
    forceBypass.value = false
  }

  const onCooldownClose = () => {
    showCooldown.value = false
  }
  const onCooldownSwitchUser = () => {
    showCooldown.value = false
    showAddUser.value = true
  }
  const onCooldownSwitchTool = () => {
    showCooldown.value = false
    // 改为返回上一页（如占卜类页面间切换），不强制重启销毁栈
    const pages = getCurrentPages() || []
    if (pages.length > 1) {
      try {
        uni.navigateBack({ delta: 1 })
      } catch {
        uni.reLaunch({ url: '/pages/index/index' })
      }
    } else {
      try {
        uni.reLaunch({ url: '/pages/index/index' })
      } catch (e) {
        // eslint-disable-next-line no-console
        if (typeof console !== 'undefined') console.warn('[use-cooldown] reLaunch 失败', e)
      }
    }
  }
  const onCooldownIgnore = () => {
    showCooldown.value = false
    forceBypass.value = true
  }

  const onAddUser = () => {
    showAddUser.value = true
  }
  const confirmAddUser = () => {
    const n = newUserName.value.trim()
    if (!n) return
    const p = app.addDivinator(n, newUserRemark.value.trim() || undefined)
    app.setActiveDivinator(p.key)
    showAddUser.value = false
    newUserName.value = ''
    newUserRemark.value = ''
  }

  const switchUser = (key: string) => {
    app.setActiveDivinator(key)
    // 切换用户后，重置强制绕过
    forceBypass.value = false
  }

  return {
    showCooldown,
    cooldownRecord,
    showAddUser,
    newUserName,
    newUserRemark,
    forceBypass,
    currentUserLocked,
    isFree,
    isActive,
    profiles,
    activeUser,
    guard,
    bypass,
    resetBypass,
    commit,
    onCooldownClose,
    onCooldownSwitchUser,
    onCooldownSwitchTool,
    onCooldownIgnore,
    onAddUser,
    confirmAddUser,
    switchUser,
  }
}
