<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AskRequest, BlindMatch, ReadingDomain, VoteChoice } from '@/contract/reading'
import { ACTIVE_MASTERS } from '@/masters/registry'
import { pickPair } from '@/runtime'
import { getPersistStatus, type PersistStatus } from '@/arena/store'
import * as ledger from '@/composables/ledger'
import AnswerCard from '@/ui/AnswerCard.vue'
import { downloadHtml, renderMatchReport } from '@/arena/report'

const question = ref('')
const domain = ref<ReadingDomain>('general')
const birthDate = ref('')
const birthTime = ref('')
const match = ref<BlindMatch | null>(null)
const busy = ref(false)
const error = ref('')
const voted = ref<VoteChoice | null>(null)
/** 本机存储写不进去时如实告诉用户，而不是让他以为已经记下了 */
const persistIssue = ref<PersistStatus>(getPersistStatus())

function syncPersistStatus(status: PersistStatus) {
  persistIssue.value = status
}
const domains: Array<{ value: ReadingDomain; label: string }> = [
  { value: 'general', label: '整体' },
  { value: 'career', label: '前程 / 工作' },
  { value: 'love', label: '感情 / 关系' },
  { value: 'study', label: '学业 / 考试' },
  { value: 'wealth', label: '钱财 / 交易' },
  { value: 'family', label: '家人 / 居所' },
  { value: 'health', label: '身心状态（非医疗）' },
]
const canAsk = computed(() => question.value.trim().length >= 4 && (!birthDate.value || Boolean(birthTime.value)))
const revealed = computed(() => Boolean(voted.value))

function titleFor(index: number): string {
  if (!match.value || !revealed.value) return index === 0 ? '甲' : '乙'
  const id = match.value.masterIds[index]
  return ACTIVE_MASTERS.find((master) => master.id === id)?.name ?? id
}

async function ask() {
  if (!canAsk.value || busy.value) return
  busy.value = true
  error.value = ''
  match.value = null
  voted.value = null
  const request: AskRequest = {
    question: question.value.trim(),
    domain: domain.value,
    askedAt: Date.now(),
    ...(birthDate.value ? { birth: { date: birthDate.value, time: birthTime.value } } : {}),
  }
  try {
    // 三位已启用大师里随机配对：固定前两位会让第三位永远没数据
    const ids = pickPair()
    // 走台账门面：本地模式写 localStorage，服务端模式写 SQLite，页面无需知道区别
    match.value = await ledger.ask({ request, masterIds: ids })
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '本次问天没有完成。'
  } finally {
    busy.value = false
  }
}

const voting = ref(false)
async function vote(choice: VoteChoice) {
  // 服务端模式下这是一次网络往返：不锁住的话快速双击会发两次请求，
  // 第二次必然拿到 409，用户会在已成功的情况下看到"已经投过票"。
  if (!match.value || voted.value || voting.value) return
  voting.value = true
  try {
    const ok = await ledger.vote(match.value.id, choice)
    if (!ok) {
      error.value = '这场对局已经投过票，未重复计分。'
      voted.value = choice
      return
    }
    voted.value = choice
    match.value.vote = choice
    syncPersistStatus(getPersistStatus())
  } finally {
    voting.value = false
  }
}

function exportReport() {
  if (!match.value) return
  const html = renderMatchReport(match.value)
  downloadHtml(`tianji-reading-${match.value.id.slice(6, 14)}.html`, html)
}

function reset() {
  match.value = null
  voted.value = null
  error.value = ''
}
</script>

<template>
  <section class="ask">
    <header class="page-head"><p class="kicker">ASK / LOCAL READING</p><h1>问天</h1><p>先把问题写具体，再让两位已验证事实层的大师匿名回答。问题、生辰、盘面和反馈只在本机处理，不上传。</p></header>
    <form v-if="!match" class="ask-form" @submit.prevent="ask">
      <label class="du-field"><span class="du-label">你要问什么 <b>必填</b></span><textarea v-model="question" class="du-input ask-q" rows="4" placeholder="例：我准备在三个月内换工作，应该先等机会还是主动出击？" /></label>
      <label class="du-field"><span class="du-label">问题领域</span><select v-model="domain" class="du-input"><option v-for="item in domains" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
      <div class="ask-grid"><label class="du-field"><span class="du-label">出生日期（可选）</span><input v-model="birthDate" class="du-input" type="date" /></label><label class="du-field"><span class="du-label">出生时间（填写日期后必填）</span><input v-model="birthTime" class="du-input" type="time" /></label></div>
      <p class="ask-hint">生辰只用于本机生成八字事实；问题、生辰、盘面和反馈只在本机处理，不上传。</p>
      <button class="du-btn primary" type="submit" :disabled="!canAsk || busy">{{ busy ? '两位大师落笔中…' : '开始匿名盲测' }}</button>
      <p v-if="!canAsk && question.length > 0" class="ask-error">问题至少写 4 个字；填写出生日期后还需要出生时间。</p>
    </form>

    <p v-if="error" class="ask-error">{{ error }}</p>

    <p v-if="persistIssue === 'quota'" class="ask-warn">
      本机存储空间已满，这次记录<strong>没有写进浏览器</strong>。请先到
      <RouterLink to="/settings">设置</RouterLink> 导出备份，再清空旧数据。
    </p>
    <p v-else-if="persistIssue === 'blocked'" class="ask-warn">
      浏览器禁止了本机存储（常见于隐私模式），这次记录<strong>没有保存</strong>。本次阅读仍然有效，关闭页面后不会保留。
    </p>

    <section v-if="match" class="match">
      <div class="match-head"><div><p class="kicker">MATCH {{ match.id }}</p><h2>同一问题，两份回答</h2><p class="ask-question">{{ match.request.question }}</p></div><button class="du-btn" @click="reset">再问一题</button></div>
      <div class="blind-note" :class="{ revealed }">{{ revealed ? '已揭晓：下面的姓名来自本机方法注册表。' : '先读内容再投票；姓名、门派和评分暂时隐藏。' }}</div>
      <div class="answers">
        <AnswerCard v-for="(answer, index) in match.answers" :key="answer.id" :answer="answer" :label="titleFor(index)" :revealed="revealed" />
      </div>
      <div v-if="!revealed" class="vote"><h3>哪一份更贴近问题？</h3><p>你的投票只更新本机榜单；它不是科学准确率，也不会把未验证的大师列为冠军。</p><div class="vote-buttons"><button class="du-btn primary" :disabled="voting" @click="vote('a')">甲更贴</button><button class="du-btn" :disabled="voting" @click="vote('draw')">都不确定</button><button class="du-btn primary" :disabled="voting" @click="vote('b')">乙更贴</button></div></div>
      <div v-else class="revealed-box"><b>本局已记分。</b><span>选择：{{ voted === 'a' ? '甲更贴' : voted === 'b' ? '乙更贴' : '都不确定' }}。结果只保存在本机。</span><button class="du-btn ft-export" type="button" @click="exportReport">导出本次报告</button><RouterLink to="/leaderboard">看大师榜 →</RouterLink></div>
    </section>
  </section>
</template>

<style scoped>
.ask { padding:28px 0 10px; }
.page-head { border-bottom:1px solid var(--line); padding-bottom:16px; }
.page-head h1 { margin:0; font-size:30px; letter-spacing:.12em; }
.page-head p:not(.kicker) { max-width:60ch; margin:8px 0 0; color:var(--ink-2); line-height:1.8; font-size:13px; }
.kicker { margin:0 0 6px; color:var(--accent-2); font-size:10px; letter-spacing:.2em; overflow-wrap:anywhere; }
.ask-form { display:grid; gap:15px; margin-top:20px; padding:18px; border:1px solid var(--line); border-radius:var(--radius); background:var(--bg-1); }
.ask-q { resize:vertical; line-height:1.7; }
.ask-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.ask-hint,.ask-error { margin:0; color:var(--ink-3); font-size:11px; line-height:1.7; }
.ask-error { color:var(--tone-bad); }
.ask-warn { margin:0; padding:10px 12px; border:1px solid var(--tone-warn); border-radius:var(--radius); color:var(--ink-1); font-size:12px; line-height:1.75; background:var(--bg-1); }
.ask-warn a { color:var(--accent); }
.ft-export { padding:4px 9px; font-size:11px; }
.match { display:grid; gap:15px; margin-top:22px; }
.match-head { display:flex; align-items:start; justify-content:space-between; gap:14px; }
.match-head h2 { margin:0; font-size:21px; }
.ask-question { margin:7px 0 0; color:var(--ink-2); font-size:13px; }
.blind-note,.revealed-box { padding:11px 13px; border:1px dashed var(--line); border-radius:var(--radius); color:var(--ink-3); font-size:12px; background:var(--surface-1); }
.blind-note.revealed { color:var(--tone-good); }
.answers { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.vote { padding:16px; border:1px solid var(--accent-2); border-radius:var(--radius); background:var(--bg-1); }
.vote h3 { margin:0 0 6px; color:var(--ink-2); font-size:12px; letter-spacing:.08em; }
.vote p { margin:0 0 12px; color:var(--ink-3); font-size:11px; }
.vote-buttons { display:flex; gap:8px; flex-wrap:wrap; }
.revealed-box { display:flex; flex-wrap:wrap; gap:8px 14px; align-items:baseline; }
.revealed-box a { color:var(--accent); }
@media (max-width:650px) { .answers,.ask-grid { grid-template-columns:1fr; } .match-head { align-items:flex-start; flex-direction:column; } }
</style>
