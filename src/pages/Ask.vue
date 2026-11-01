<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AskRequest, BlindMatch, ReadingDomain, VoteChoice } from '@/contract/reading'
import { ACTIVE_MASTERS } from '@/masters/registry'
import { runBlindMatch } from '@/arena/readingFlow'
import { recordVote } from '@/arena/store'

const question = ref('')
const domain = ref<ReadingDomain>('general')
const birthDate = ref('')
const birthTime = ref('')
const match = ref<BlindMatch | null>(null)
const busy = ref(false)
const error = ref('')
const voted = ref<VoteChoice | null>(null)
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
    const ids = ACTIVE_MASTERS.slice(0, 2).map((master) => master.id) as [typeof ACTIVE_MASTERS[0]['id'], typeof ACTIVE_MASTERS[0]['id']]
    match.value = await runBlindMatch(request, ids)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '本次问天没有完成。'
  } finally {
    busy.value = false
  }
}

function vote(choice: VoteChoice) {
  if (!match.value || voted.value) return
  if (!recordVote(match.value.id, choice)) {
    error.value = '这场对局已经投过票，未重复计分。'
    voted.value = choice
    return
  }
  voted.value = choice
  match.value.vote = choice
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

    <section v-if="match" class="match">
      <div class="match-head"><div><p class="kicker">MATCH {{ match.id }}</p><h2>同一问题，两份回答</h2><p class="ask-question">{{ match.request.question }}</p></div><button class="du-btn" @click="reset">再问一题</button></div>
      <div class="blind-note" :class="{ revealed }">{{ revealed ? '已揭晓：下面的姓名来自本机方法注册表。' : '先读内容再投票；姓名、门派和评分暂时隐藏。' }}</div>
      <div class="answers">
        <article v-for="(answer, index) in match.answers" :key="answer.id" class="answer">
          <div class="answer-head"><span class="answer-label">{{ titleFor(index) }}</span><span class="answer-mode">本地规则模式 · 同源语料</span></div>
          <p v-if="answer.fallbackReason" class="answer-fallback">{{ answer.fallbackReason }}</p>
          <section v-for="section in answer.sections" :key="section.key" class="answer-section"><h3>{{ section.title }}</h3><p v-for="(line, lineIndex) in section.lines" :key="lineIndex">{{ line }}</p></section>
          <div v-if="answer.citations.length" class="answer-citations"><h3>引用状态</h3><p v-for="citation in answer.citations" :key="`${citation.book}-${citation.text}`">《{{ citation.book }}》{{ citation.loc ?? '' }}：{{ citation.text }} <b :class="citation.verification === 'verified' ? 'ok' : 'warn'">{{ citation.verification === 'verified' ? '已核' : '未核' }}</b></p></div>
          <div v-if="answer.claims.length" class="answer-claims"><h3>可验断言已放入应验簿</h3><p v-for="claim in answer.claims" :key="claim.id">{{ claim.text }} · 截止 {{ new Date(claim.dueAt).toLocaleDateString() }}</p></div>
        </article>
      </div>
      <div v-if="!revealed" class="vote"><h3>哪一份更贴近问题？</h3><p>你的投票只更新本机榜单；它不是科学准确率，也不会把未验证的大师列为冠军。</p><div class="vote-buttons"><button class="du-btn primary" @click="vote('a')">甲更贴</button><button class="du-btn" @click="vote('draw')">都不确定</button><button class="du-btn primary" @click="vote('b')">乙更贴</button></div></div>
      <div v-else class="revealed-box"><b>本局已记分。</b><span>选择：{{ voted === 'a' ? '甲更贴' : voted === 'b' ? '乙更贴' : '都不确定' }}。结果只保存在本机。</span><RouterLink to="/leaderboard">看大师榜 →</RouterLink></div>
    </section>
  </section>
</template>

<style scoped>
.ask { padding:28px 0 10px; }
.page-head { border-bottom:1px solid var(--line); padding-bottom:16px; }
.page-head h1 { margin:0; font-size:30px; letter-spacing:.12em; }
.page-head p:not(.kicker) { max-width:60ch; margin:8px 0 0; color:var(--ink-2); line-height:1.8; font-size:13px; }
.kicker { margin:0 0 6px; color:var(--accent-2); font-size:10px; letter-spacing:.2em; }
.ask-form { display:grid; gap:15px; margin-top:20px; padding:18px; border:1px solid var(--line); border-radius:var(--radius); background:var(--bg-1); }
.ask-q { resize:vertical; line-height:1.7; }
.ask-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.ask-hint,.ask-error { margin:0; color:var(--ink-3); font-size:11px; line-height:1.7; }
.ask-error { color:var(--tone-bad); }
.match { display:grid; gap:15px; margin-top:22px; }
.match-head { display:flex; align-items:start; justify-content:space-between; gap:14px; }
.match-head h2 { margin:0; font-size:21px; }
.ask-question { margin:7px 0 0; color:var(--ink-2); font-size:13px; }
.blind-note,.revealed-box { padding:11px 13px; border:1px dashed var(--line); border-radius:var(--radius); color:var(--ink-3); font-size:12px; background:var(--surface-1); }
.blind-note.revealed { color:var(--tone-good); }
.answers { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.answer { min-width:0; padding:15px; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface-1); }
.answer-head { display:flex; justify-content:space-between; gap:7px; border-bottom:1px solid var(--line); padding-bottom:9px; }
.answer-label { color:var(--accent); font-weight:700; }
.answer-mode { color:var(--ink-3); font-size:10px; text-align:right; }
.answer-fallback { color:var(--tone-warn); font-size:11px; line-height:1.6; }
.answer-section,.answer-citations,.answer-claims { margin-top:14px; }
.answer-section h3,.answer-citations h3,.answer-claims h3,.vote h3 { margin:0 0 6px; color:var(--ink-2); font-size:12px; letter-spacing:.08em; }
.answer-section p,.answer-citations p,.answer-claims p { margin:4px 0; color:var(--ink-1); font-size:13px; line-height:1.75; white-space:pre-wrap; }
.answer-citations p,.answer-claims p { color:var(--ink-3); font-size:11px; }
.ok { color:var(--tone-good); }
.warn { color:var(--tone-warn); }
.vote { padding:16px; border:1px solid var(--accent-2); border-radius:var(--radius); background:var(--bg-1); }
.vote p { margin:0 0 12px; color:var(--ink-3); font-size:11px; }
.vote-buttons { display:flex; gap:8px; flex-wrap:wrap; }
.revealed-box { display:flex; flex-wrap:wrap; gap:8px 14px; align-items:baseline; }
.revealed-box a { color:var(--accent); }
@media (max-width:650px) { .answers,.ask-grid { grid-template-columns:1fr; } .match-head { align-items:flex-start; flex-direction:column; } }
</style>
