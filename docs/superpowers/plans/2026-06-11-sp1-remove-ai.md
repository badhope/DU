# SP-1 Implementation Plan: 删除 AI 智能助手 6 个页面

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除 6 个 AI 智能助手页面（`ai-gua/ai-ming/ai-feng/ai-name/ai-jiankang/ai-xiuxin`）+ `src/utils/ai.ts`（如果空壳）+ 相关路由 + `ToolKey` 类型 + 成就 `ai-master`，项目仍能 `pnpm type-check && pnpm test && pnpm build:h5` 三项全绿。

**Architecture:** 纯删除任务。不新增文件，只删除文件和从已存在文件中删除代码段。所有"AI 玄谈"成就、ChatSession 状态、相关 ToolKey 全部下线。

**Tech Stack:** uni-app x 3.0 + Vue 3.4 + TypeScript 6 + Pinia 3

---

### Task 1: 探查 AI 代码实际内容

**Files:**

- Read: `src/utils/ai.ts`
- Read: 6 个 `src/pages/ai/ai-*.vue`
- Read: `src/stores/index.ts` 第 77-83, 145-156, 183, 581-622, 754-764, 933 行附近
- Grep: `ai-master|ai-gua|ai-ming|ai-feng|ai-name|ai-jiankang|ai-xiuxin` 在所有 .vue/.ts 文件

- [ ] **Step 1: 跑 grep 摸清 AI 代码引用面**

```bash
grep -rn "ai-master\|ai-gua\|ai-ming\|ai-feng\|ai-name\|ai-jiankang\|ai-xiuxin" \
  --include="*.vue" --include="*.ts" src/ tests/ \
  | head -80
```

预期：~30-50 个引用点，主要分布在 stores/index.ts / config/tools.ts / pages.json / daily-cooldown.ts / src/utils/ai.ts / 6 个 AI .vue

- [ ] **Step 2: 读 src/utils/ai.ts 看是不是空壳**

读全文。**实测是 840 行完整 mock LLM**（MASTERS + KUA 64 卦字典 + FENG_DIR 风水八方 + NAME_CHARS 起名常用字 + HEALTH_TIPS 节气 + ZEN_QUOTES 禅语十则 + 6 个 ai\*Reply() + askMaster 路由 + summarizeContext + calcWuGe 完整五格起名 + 81 数理 WUGE_GOOD + wugeLevel）。**所有内容都是 AI 装饰品，没有任何外部业务引用**（除 6 个 AI 页面），整文件删除。

- [ ] **Step 3: 读 daily-cooldown.ts 确认 AI 6 行**

行 64-69 注册了 6 个 AI 工具为 'free' 类型。**这 6 行可删**（cooldown 表是个 Record<string, CooldownType>，缺失的 key 会被 `t === 'once-per-day'` 判定为 undefined，自然走 free 路径，无需补注册）。

- [ ] **Step 4: 读 6 个 AI .vue 文件**

确认每个 .vue 都在 import `@/utils/ai`（用 `askMaster`/`MASTERS`/`MasterKey`）。每个文件 ~500 行，纯 chat UI（master 头像 + 消息流 + Typewriter 打字机 + MysticScan 仪式扫描 + RipplePress + 快速问卦按钮）。**整文件可删**。

---

### Task 2: 从 stores/index.ts 删除 AI 相关代码

**Files:**

- Modify: `src/stores/index.ts:77-83`（ToolKey AI 6 个分支）
- Modify: `src/stores/index.ts:145-156`（ChatSession interface）
- Modify: `src/stores/index.ts:183`（PersistState.chatSessions 字段）
- Modify: `src/stores/index.ts:374-396`（DEFAULT_STATE.chatSessions）
- Modify: `src/stores/index.ts:425-430`（saveState 无需改）
- Modify: `src/stores/index.ts:441, 460-461, 472`（ref chatSessions / saveState payload）
- Modify: `src/stores/index.ts:582-622`（MAX_CHAT_MESSAGES, getChatSession, appendChatMessage, setChatPersona, clearChatSession, clearAllChatSessions 整段）
- Modify: `src/stores/index.ts:754-764`（totalChatTurns, chattedMasters 整段）
- Modify: `src/stores/index.ts:864, 918-922`（resetAll 字段、return chat 相关方法）

- [ ] **Step 1: 删除 ToolKey 中 6 个 AI 分支（行 77-83）**

old_string:

```typescript
  // AI 助手
  | 'ai-gua'
  | 'ai-ming'
  | 'ai-feng'
  | 'ai-name'
  | 'ai-jiankang'
  | 'ai-xiuxin'
```

new_string: （完全删除这 7 行）

- [ ] **Step 2: 删除 ChatSession interface（行 145-156）**

old_string:

```typescript
/** AI 六师聊天会话 */
export interface ChatSession {
  masterKey: string // 'ai-gua' | 'ai-ming' | ...
  messages: Array<{
    role: 'user' | 'master'
    text: string
    cite?: string
  }>
  persona?: string // 用户设置的 persona（可选）
  lastActiveTime: number
}
```

new_string: （完全删除）

- [ ] **Step 3: 删除 PersistState.chatSessions 字段（行 183）**

old_string:

```typescript
chatSessions: Record<string, ChatSession> // AI 六师聊天记录（按 masterKey 分组）
```

new_string: （完全删除）

- [ ] **Step 4: 删除 DEFAULT_STATE.chatSessions: {}（行 392）**

old_string:

```typescript
  chatSessions: {},
  divinationRecords: [],
```

new_string:

```typescript
  divinationRecords: [],
```

- [ ] **Step 5: 删除 DEFAULT_STATE 加载逻辑（行 415）**

old_string:

```typescript
      chatSessions: parsed.chatSessions || {},
      divinationRecords: Array.isArray(parsed.divinationRecords) ? parsed.divinationRecords : [],
```

new_string:

```typescript
      divinationRecords: Array.isArray(parsed.divinationRecords) ? parsed.divinationRecords : [],
```

- [ ] **Step 6: 删除 ref chatSessions 和 watch 列表（行 441, 458）**

- 删除 `const chatSessions = ref<Record<string, ChatSession>>(initial.chatSessions)`
- 在 watch 数组里删除 `chatSessions,`

- [ ] **Step 7: 删除 watch saveState payload 中的 chatSessions（行 470）**

- 删除 `chatSessions: chatSessions.value,`

- [ ] **Step 8: 删除整个 chat sessions 业务段（行 582-622）**

old_string:

```typescript
// ============ AI 六师聊天会话 ============
const MAX_CHAT_MESSAGES = 40 // 单 master 最多保留 20 轮（user+master）

function getChatSession(masterKey: string): ChatSession {
  if (!chatSessions.value[masterKey]) {
    chatSessions.value[masterKey] = {
      masterKey,
      messages: [],
      lastActiveTime: Date.now(),
    }
  }
  return chatSessions.value[masterKey]
}

function appendChatMessage(
  masterKey: string,
  msg: { role: 'user' | 'master'; text: string; cite?: string },
) {
  const session = getChatSession(masterKey)
  session.messages.push({ ...msg, time: Date.now() })
  session.lastActiveTime = Date.now()
  // 限制最大消息数（FIFO 截断）
  if (session.messages.length > MAX_CHAT_MESSAGES) {
    session.messages.splice(0, session.messages.length - MAX_CHAT_MESSAGES)
  }
}

function setChatPersona(masterKey: string, persona: string) {
  const session = getChatSession(masterKey)
  session.persona = persona
}

function clearChatSession(masterKey: string) {
  if (chatSessions.value[masterKey]) {
    chatSessions.value[masterKey].messages = []
    chatSessions.value[masterKey].lastActiveTime = Date.now()
  }
}

function clearAllChatSessions() {
  chatSessions.value = {}
}
```

new_string: （完全删除）

- [ ] **Step 9: 删除 totalChatTurns / chattedMasters 衍生（行 754-764）**

old_string:

```typescript
const totalChatTurns = computed(() => {
  let total = 0
  Object.values(chatSessions.value).forEach((s) => {
    total += s.messages.filter((m) => m.role === 'user').length
  })
  return total
})

const chattedMasters = computed(() => {
  return Object.keys(chatSessions.value).filter((k) => chatSessions.value[k].messages.length > 0)
})
```

new_string: （完全删除）

- [ ] **Step 10: 删除 resetAll 中的 chatSessions: {}（行 864）**

old_string:

```typescript
chatSessions.value = {}
divinationRecords.value = []
```

new_string:

```typescript
divinationRecords.value = []
```

- [ ] **Step 11: 删除 return 中 chat 相关 state 与方法（行 887, 898-899, 918-922）**

- 删除 `chatSessions,`（state 列表）
- 删除 `totalChatTurns,` 和 `chattedMasters,`（derived）
- 删除整个 chat 方法块：

  ```typescript
      // chat
      getChatSession,
      appendChatMessage,
      setChatPersona,
      clearChatSession,
      clearAllChatSessions,
  ```

- [ ] **Step 12: 删除 ai-master 成就（行 353-361）**

old_string:

```typescript
  {
    id: 'ai-master',
    name: 'AI 玄谈',
    desc: '与 6 位 AI 师均交流',
    icon: '智',
    unlocked: false,
    progress: 0,
    target: 6,
    current: 0,
  },
```

new_string: （完全删除）

---

### Task 3: 从 config/tools.ts 删除 6 个 AI 工具

**Files:**

- Modify: `src/config/tools.ts:570-642`（AI 6 个工具对象）

- [ ] **Step 1: 删除 "AI 智能助手" 段**

old_string:

```typescript
  // ============ AI 智能助手 (新增 6) ============
  {
    key: 'ai-gua',
    ...
  },
  ... (6 个 AI 工具对象)
```

new_string: （完全删除整段约 73 行）

---

### Task 4: 从 pages.json 删除 6 个 AI 路径

**Files:**

- Modify: `src/pages.json:340-386`（6 个 AI pages 段）

- [ ] **Step 1: 删除 6 个 pages 条目**

old_string:

```json
    {
      "path": "pages/ai/ai-gua",
      ...
    },
    ... (6 个 AI 路径)
```

new_string: （完全删除 6 个对象）

---

### Task 5: 删除 6 个 AI .vue 文件 + ai.ts

**Files:**

- Delete: `src/pages/ai/ai-feng.vue`
- Delete: `src/pages/ai/ai-gua.vue`
- Delete: `src/pages/ai/ai-jiankang.vue`
- Delete: `src/pages/ai/ai-ming.vue`
- Delete: `src/pages/ai/ai-name.vue`
- Delete: `src/pages/ai/ai-xiuxin.vue`
- Delete (如果空壳): `src/utils/ai.ts`
- Delete (如果空): `src/pages/ai/` 目录

- [ ] **Step 1: 删 6 个 AI 页面**

```bash
rm src/pages/ai/ai-feng.vue \
   src/pages/ai/ai-gua.vue \
   src/pages/ai/ai-jiankang.vue \
   src/pages/ai/ai-ming.vue \
   src/pages/ai/ai-name.vue \
   src/pages/ai/ai-xiuxin.vue
```

- [ ] **Step 2: 删 ai.ts（如果 Task 1 确认是空壳）**

```bash
rm src/utils/ai.ts
```

- [ ] **Step 3: 删空目录**

```bash
rmdir src/pages/ai 2>/dev/null || true
```

---

### Task 6: 修复其他文件中对 AI 的引用

- [ ] **Step 1: 跑 grep 找剩余 AI 引用**

```bash
grep -rn "ai-master\|ai-gua\|ai-ming\|ai-feng\|ai-name\|ai-jiankang\|ai-xiuxin\|ChatSession\|getChatSession\|appendChatMessage" \
  --include="*.vue" --include="*.ts" src/ tests/ \
  | head -40
```

预期：现在应该 0 引用。如果还有，按引用点上下文修改。

- [ ] **Step 2: 检查 README 工具列表**

读 `README.md`，把"49 工具"改为"43 工具"，删除 AI 大师 6 行的描述。

- [ ] **Step 3: 检查 CHANGELOG**

读 `CHANGELOG.md`，Unreleased 段加一条：

```markdown
### Removed

- **AI 智能助手 6 个工具下线**: 玄枢是纯本地工具，AI 六师（解卦/命理/风水/起名/健康/修心）依赖 LLM，本地无可用实现，UI 一直是空壳。从 v1.1.0 起删除：6 个页面 / 6 个 ToolKey / `ChatSession` store / `ai-master` 成就 / `src/utils/ai.ts`。工具总数：49 → 43
```

- [ ] **Step 4: 检查 package.json description**

`description: "MISTVERSE (玄枢) — A client-side Chinese metaphysics toolkit: 49 tools across fate, divination, ancient arts, wellness, cultivation, life, and AI assistance."`
改为：`"...43 tools across fate, divination, ancient arts, wellness, cultivation, and life."`

---

### Task 7: 验证

- [ ] **Step 1: 跑 type-check**

```bash
pnpm type-check
```

预期：0 错误

- [ ] **Step 2: 跑 test**

```bash
pnpm test
```

预期：20/20 仍通过

- [ ] **Step 3: 跑 build**

```bash
pnpm build:h5
```

预期：DONE Build complete，无错误

- [ ] **Step 5: grep 确认 0 引用**

```bash
grep -rn "ai-\|ChatSession" --include="*.vue" --include="*.ts" src/ tests/ | head -20
```

预期：0 行（除 ai.ts 自身、ai/ 目录 .vue 自身外）

---

### Task 9: Commit

- [ ] **Step 1: stage 所有改动**

```bash
git add -A
git status
```

预期：约 10-12 个文件改动（stores/tools.ts/pages.json/6 个 .vue 删除/ai.ts 删除/README/CHANGELOG/package.json）

- [ ] **Step 2: commit**

```bash
git commit -m "$(cat <<'EOF'
SP-1: 移除 AI 智能助手 6 个空壳工具

- 删除 pages/ai/{ai-feng,ai-gua,ai-jiankang,ai-ming,ai-name,ai-xiuxin}.vue
- 删除 src/utils/ai.ts（mock-only）
- stores/index.ts: 移除 6 个 AI ToolKey、ChatSession 接口、6 个 chat 方法、totalChatTurns/chattedMasters 衍生、ai-master 成就
- config/tools.ts: 移除 6 个 AI 工具对象
- pages.json: 移除 6 个 AI 路由
- README / CHANGELOG / package.json description: 49 → 43 工具

动机：玄枢是纯本地工具，AI 六师无 LLM 后端，UI 一直空壳。删除以减负。
EOF
)"
```

预期：1 个 commit，git log 显示 `SP-1: 移除 AI 智能助手 6 个空壳工具`
