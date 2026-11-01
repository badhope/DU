<script setup lang="ts">
import { computed, ref } from 'vue'
import { listClaims, resolveClaim } from '@/arena/store'
import { masterById } from '@/masters/registry'

const refresh = ref(0)
const claims = computed(() => { refresh.value; return listClaims().sort((a, b) => a.dueAt - b.dueAt) })
function mark(id: string, status: 'hit' | 'miss' | 'unknown') { resolveClaim(id, status); refresh.value += 1 }
</script>

<template>
  <section class="ledger-page"><header class="page-head"><p class="kicker">LEDGER / RESOLUTION</p><h1>应验簿</h1><p>只有带日期、可判定的断言才进这里。到期后由你回填，不把“感觉像”算成命中。</p></header><p v-if="!claims.length" class="empty">目前没有待回填断言。问天时，大师回答里的 `## 验` 条目会自动放入本机应验簿。</p><div class="claims"><article v-for="claim in claims" :key="claim.id" class="claim" :class="{ overdue: claim.status === 'pending' && claim.dueAt < Date.now() }"><div class="claim-head"><span>{{ masterById(claim.masterId)?.name ?? claim.masterId }}</span><b>{{ claim.status === 'pending' ? '待回填' : claim.status === 'hit' ? '应验' : claim.status === 'miss' ? '未验' : '无法判断' }}</b></div><p>{{ claim.text }}</p><small>截止 {{ new Date(claim.dueAt).toLocaleDateString() }} · 建立于 {{ new Date(claim.createdAt).toLocaleDateString() }}</small><div v-if="claim.status === 'pending'" class="claim-actions"><button class="du-btn" @click="mark(claim.id, 'hit')">应验</button><button class="du-btn" @click="mark(claim.id, 'miss')">未验</button><button class="du-btn" @click="mark(claim.id, 'unknown')">无法判断</button></div></article></div></section>
</template>

<style scoped>
.ledger-page { padding:28px 0; }
.page-head { border-bottom:1px solid var(--line); padding-bottom:16px; }
.kicker { margin:0 0 6px; color:var(--accent-2); font-size:10px; letter-spacing:.2em; }
h1 { margin:0; font-size:30px; letter-spacing:.12em; }
.page-head p:not(.kicker) { margin:8px 0 0; color:var(--ink-2); font-size:13px; line-height:1.8; }
.empty { margin-top:20px; padding:15px; border:1px dashed var(--line); color:var(--ink-3); font-size:12px; line-height:1.8; }
.claims { display:grid; gap:9px; margin-top:20px; }
.claim { padding:14px; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface-1); }
.claim.overdue { border-color:var(--tone-warn); }
.claim-head { display:flex; justify-content:space-between; color:var(--accent); font-size:12px; }
.claim-head b { color:var(--ink-3); font-weight:400; }
.claim p { margin:8px 0; font-size:13px; line-height:1.7; }
.claim small { color:var(--ink-3); font-size:10px; }
.claim-actions { display:flex; flex-wrap:wrap; gap:7px; margin-top:11px; }
.claim-actions button { padding:6px 9px; font-size:11px; }
</style>
