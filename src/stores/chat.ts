/** AI 六师聊天会话 store */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatSession } from './types'

export const useChatStore = defineStore('chat', () => {
  const MAX_CHAT_MESSAGES = 40
  const chatSessions = ref<Record<string, ChatSession>>({})

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

  function reset() {
    chatSessions.value = {}
  }

  return {
    chatSessions,
    totalChatTurns,
    chattedMasters,
    getChatSession,
    appendChatMessage,
    setChatPersona,
    clearChatSession,
    clearAllChatSessions,
    reset,
  }
})
