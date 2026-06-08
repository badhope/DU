<template>
  <view
    class="page"
    :class="[app.fontSizeClass, app.themeClass, app.fontClass, app.modeClass, 'container']"
  >
    <view class="taiji-bg"><TaijiBg /></view>
    <StarField :count="30" :density="'low'" :colors="'mixed'" :shooting="false" />
    <TopBar :title="master.name" :subtitle="`AI MASTER · ${props.masterKey.toUpperCase()}`" />

    <view class="header card-mystic anim-fade-up">
      <view
        class="h-glyph"
        :style="{ color: master.color, textShadow: `0 0 30rpx ${master.color}` }"
        >
{{ master.glyph }}
</view
      >
      <view class="h-info">
        <text class="h-name" :style="{ color: master.color }">{{ master.name }}</text>
        <text class="h-style">{{ master.style }}</text>
        <text class="h-desc">{{ master.desc }}</text>
        <view class="h-dom">
          <text v-for="(d, i) in master.domain" :key="i" class="h-dom-item">{{ d }}</text>
        </view>
        <view v-if="turnCount > 0" class="h-stats">
          <text class="stat">已 论 {{ turnCount }} 轮</text>
          <text class="stat-clear" @click="clearChat">清 空 对 话</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="chat" :scroll-top="scrollTop" :scroll-with-animation="true">
      <view
        v-for="(m, i) in messages"
        :key="i"
        class="msg"
        :class="[m.role, i === lastMsgIndex ? 'msg-new' : '']"
      >
        <view class="msg-avatar" :class="m.role">
{{
          m.role === 'user' ? '你' : master.glyph
        }}
</view>
        <view class="msg-body">
          <view class="msg-bubble" :class="m.role === 'master' ? 'text-shimmer' : ''">
            <Typewriter
              v-if="i === typingIndex && m.role === 'master'"
              :text="m.text"
              :speed="40"
              :theme="'bai'"
            />
            <text v-else>{{ m.text }}</text>
          </view>
          <text v-if="m.cite" class="msg-cite">📜 {{ m.cite }}</text>
          <text class="msg-time">{{ formatTime(m.time) }}</text>
        </view>
      </view>
      <view v-if="thinking" class="msg master msg-new">
        <view class="msg-avatar">{{ master.glyph }}</view>
        <view class="msg-body">
          <view class="msg-bubble thinking anim-pulse-soft">
            <text class="dot"></text>
            <text class="dot"></text>
            <text class="dot"></text>
            <text class="th-text">{{ master.name }} 思 索 中 …</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="input-bar">
      <textarea
        v-model="input"
        class="input"
        :placeholder="placeholder"
        :maxlength="200"
        :auto-height="true"
        :disabled="thinking"
      />
      <RipplePress class="send-btn-wrap">
        <view class="send-btn" :class="{ disabled: !input.trim() || thinking }" @click="send">
          <text>{{ thinking ? '◌' : '问' }}</text>
        </view>
      </RipplePress>
    </view>

    <view class="quick card-mystic">
      <text class="q-title">快 速 问 养</text>
      <view class="q-grid">
        <view
          v-for="(q, i) in quickQuestions"
          :key="i"
          class="q-item card-hoverable lift"
          :style="{ animationDelay: i * 0.04 + 's' }"
          @click="askQ(q)"
          >
{{ q }}
</view
        >
      </view>
    </view>

    <!-- 仪式化扫描动画（点'问'后全屏覆盖） -->
    <MysticScan
      :visible="scanning"
      :glyph="master.glyph"
      :color="master.color"
      :steps="['望 诊', '脉 感', '调 养']"
      :hint-subs="[
        '请保持脸在屏幕前 · 望诊气色',
        '请保持手在屏幕前 · 感应脉象',
        '正在调和五脏 · 即将揭晓',
      ]"
      @done="onScanDone"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import TopBar from '@/components/ui/TopBar.vue'
import TaijiBg from '@/components/effects/TaijiBg.vue'
import StarField from '@/components/effects/StarField.vue'
import RipplePress from '@/components/ui/RipplePress.vue'
import Typewriter from '@/components/ui/Typewriter.vue'
import MysticScan from '@/components/ui/MysticScan.vue'
import { useAppStore } from '@/stores'
import { MASTERS, askMaster, type MasterKey, type ChatMessage } from '@/utils/ai'

const props = defineProps<{ masterKey: MasterKey }>()
const master = MASTERS[props.masterKey]
const app = useAppStore()
const input = ref('')
const thinking = ref(false)
const scanning = ref(false)
const pendingQ = ref('')
const scrollTop = ref(0)
const messages = ref<ChatMessage[]>([])
const typingIndex = ref(-1)

onMounted(() => {
  const session = app.getChatSession(props.masterKey)
  if (session.messages.length === 0) {
    messages.value.push({
      role: 'master',
      text: master.greeting + '\n\n' + master.desc,
      time: Date.now() - 5000,
    })
  } else {
    messages.value = [...session.messages]
  }
  nextTick(() => {
    scrollToBottom()
  })
})

const turnCount = computed(() => messages.value.filter((m) => m.role === 'user').length)
const lastMsgIndex = computed(() => messages.value.length - 1)

const placeholder = '请输入 · 如：失眠 / 脾胃 / 节气…'
const quickQuestions = ['最近总失眠', '脾胃不好', '换季咳嗽', '湿气重']

function askQ(q: string) {
  input.value = q
  send()
}

async function send() {
  if (!input.value.trim() || thinking.value) return
  const userMsg: ChatMessage = { role: 'user', text: input.value, time: Date.now() }
  messages.value.push(userMsg)
  app.appendChatMessage(props.masterKey, userMsg)
  pendingQ.value = input.value
  input.value = ''
  scanning.value = true
  thinking.value = true
  await nextTick()
  scrollToBottom()
}

function onScanDone() {
  const q = pendingQ.value
  scanning.value = false
  const ctx = {
    question: q,
    profile: app.profile
      ? { ...app.profile, gender: app.profile.gender === 'female' ? '女' : '男' }
      : null,
    prevMessages: messages.value.slice(0, -1),
  }
  const reply = askMaster(props.masterKey, ctx)
  messages.value.push(reply)
  app.appendChatMessage(props.masterKey, reply)
  app.addHistory({
    tool: props.masterKey,
    toolName: master.name,
    category: 'AI 助手',
    input: { q },
    output: { reply: reply.text.slice(0, 50) },
    brief: `问：${q.slice(0, 20)}`,
  })
  thinking.value = false
  pendingQ.value = ''
  nextTick(() => {
    scrollToBottom()
  })
}

function clearChat() {
  uni.showModal({
    title: '清空对话',
    content: '此 master 的所有历史将一并清除，确认？',
    success: (res) => {
      if (res.confirm) {
        app.clearChatSession(props.masterKey)
        messages.value = [
          { role: 'master', text: master.greeting + '\n\n' + master.desc, time: Date.now() - 5000 },
        ]
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    },
  })
}

function scrollToBottom() {
  scrollTop.value = 99999
}

function formatTime(t: number) {
  const d = new Date(t)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.page {
  position: relative;
  min-height: 100vh;
  padding: 0 var(--sp-3) var(--sp-8);
  overflow: hidden;
}
.taiji-bg {
  position: fixed;
  inset: 0;
  z-index: var(--z-bg);
}
.header {
  position: relative;
  z-index: var(--z-content);
  display: flex;
  gap: var(--sp-3);
  padding: var(--sp-3);
  margin: var(--sp-3) var(--sp-2) 0;
}
.h-glyph {
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  flex-shrink: 0;
}
.h-info {
  flex: 1;
  min-width: 0;
}
.h-name {
  display: block;
  font-size: var(--fs-xl);
  font-family: 'KaiTi', serif;
  font-weight: 700;
}
.h-style {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-bai-3);
  margin: 2rpx 0;
}
.h-desc {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  font-family: 'KaiTi', serif;
  line-height: 1.5;
  margin-bottom: var(--sp-1);
}
.h-dom {
  display: flex;
  flex-wrap: wrap;
  gap: 4rpx;
  margin-bottom: 4rpx;
}
.h-dom-item {
  font-size: 18rpx;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  background: rgba(212, 175, 55, 0.15);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
}
.h-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4rpx;
}
.stat {
  font-size: var(--fs-xs);
  color: var(--color-bai-2);
}
.stat-clear {
  font-size: var(--fs-xs);
  color: #c8302a;
  padding: 2rpx 8rpx;
  border-radius: 4rpx;
  background: rgba(200, 48, 42, 0.1);
}

.chat {
  position: relative;
  z-index: var(--z-content);
  padding: var(--sp-3);
  margin: var(--sp-3) var(--sp-2) 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  height: 50vh;
}
.msg {
  display: flex;
  gap: var(--sp-2);
}
.msg.user {
  flex-direction: row-reverse;
}
.msg-avatar {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 20, 28, 0.6);
  border-radius: 50%;
  font-size: var(--fs-md);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  font-weight: 700;
  border: 1rpx solid rgba(212, 175, 55, 0.3);
  flex-shrink: 0;
}
.msg.user .msg-avatar {
  background: var(--color-zhu);
  color: var(--color-bai);
  border-color: var(--color-zhu);
}
.msg-body {
  max-width: 75%;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.msg.user .msg-body {
  align-items: flex-end;
}
.msg-bubble {
  padding: var(--sp-2) var(--sp-3);
  background: rgba(10, 10, 18, 0.5);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  font-size: var(--fs-sm);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg.user .msg-bubble {
  background: var(--color-zhu);
  color: var(--color-bai);
  border-color: var(--color-zhu);
}
.msg-cite {
  display: block;
  font-size: var(--fs-xs);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  padding: 4rpx var(--sp-2);
  background: rgba(212, 175, 55, 0.08);
  border-radius: var(--r-sm);
}
.msg-time {
  display: block;
  font-size: 18rpx;
  color: var(--color-bai-3);
}
.thinking {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.th-text {
  font-size: var(--fs-sm);
  color: var(--color-bai-2);
  margin-left: var(--sp-1);
}
.dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--color-liu);
  display: inline-block;
  animation: dot-pulse 1.4s infinite;
}
.dot:nth-child(2) {
  animation-delay: 0.2s;
}
.dot:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes dot-pulse {
  0%,
  60%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  30% {
    transform: scale(1);
    opacity: 1;
  }
}

.input-bar {
  position: sticky;
  bottom: 0;
  z-index: var(--z-content);
  display: flex;
  gap: var(--sp-2);
  padding: var(--sp-2);
  background: rgba(20, 20, 28, 0.95);
  border: 1rpx solid rgba(212, 175, 55, 0.2);
  border-radius: var(--r-md);
  margin: var(--sp-2);
}
.input {
  flex: 1;
  min-height: 60rpx;
  max-height: 200rpx;
  padding: var(--sp-1) var(--sp-2);
  background: rgba(10, 10, 18, 0.5);
  color: var(--color-bai);
  font-family: 'KaiTi', serif;
  font-size: var(--fs-sm);
  border: 1rpx solid rgba(212, 175, 55, 0.1);
  border-radius: var(--r-sm);
}
.send-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-zhu);
  color: var(--color-bai);
  border-radius: 50%;
  font-family: 'KaiTi', serif;
  font-weight: 700;
  font-size: var(--fs-md);
  box-shadow: var(--sh-glow-zhu);
}
.send-btn.disabled {
  background: rgba(100, 100, 120, 0.5);
  box-shadow: none;
}
.quick {
  position: relative;
  z-index: var(--z-content);
  padding: var(--sp-3);
  margin: 0 var(--sp-2) var(--sp-3);
}
.q-title {
  display: block;
  font-size: var(--fs-sm);
  color: var(--color-liu);
  font-family: 'KaiTi', serif;
  letter-spacing: 0.2em;
  margin-bottom: var(--sp-2);
}
.q-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-1);
}
.q-item {
  padding: var(--sp-2);
  background: rgba(20, 20, 28, 0.4);
  border: 1rpx solid rgba(212, 175, 55, 0.15);
  border-radius: var(--r-sm);
  font-size: var(--fs-xs);
  color: var(--color-bai);
  text-align: center;
  font-family: 'KaiTi', serif;
}
</style>
