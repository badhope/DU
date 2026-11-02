<script setup lang="ts">
import { computed } from 'vue'
import { listMatches } from '@/arena/store'
import { masterById } from '@/masters/registry'

const matches = computed(() => listMatches())
const name = (id: string) => masterById(id)?.name ?? id
</script>

<template>
  <section class="arena-page"><header class="page-head"><p class="kicker">ARENA / LOCAL MATCHES</p><h1>擂台</h1><p>每场盲测都只记在本机。没有对局时不生成假战绩，去问天开启第一场。</p></header><RouterLink class="du-btn primary arena-cta" to="/ask">开启一场盲测</RouterLink><section class="history"><h2>本机对局 {{ matches.length }} 场</h2><p v-if="!matches.length" class="empty">还没有对局。先让两位大师回答同一个问题，再由你投票。</p><article v-for="item in matches" :key="item.id" class="match-row"><div><b>{{ new Date(item.createdAt).toLocaleString() }}</b><span>{{ item.request.question }}</span></div><div class="match-result">{{ item.vote ? (item.vote === 'draw' ? '平局' : item.vote === 'a' ? `${name(item.masterIds[0])} 胜` : `${name(item.masterIds[1])} 胜`) : '待投票' }}</div></article></section></section>
</template>

<style scoped>
.arena-page { padding:28px 0; }
.page-head { border-bottom:1px solid var(--line); padding-bottom:16px; }
.kicker { margin:0 0 6px; color:var(--accent-2); font-size:10px; letter-spacing:.2em; }
h1 { margin:0; font-size:30px; letter-spacing:.12em; }
.page-head p:not(.kicker) { margin:8px 0 0; color:var(--ink-2); font-size:13px; line-height:1.8; }
.arena-cta { display:inline-block; margin-top:18px; text-decoration:none; }
.history { margin-top:28px; }
.history h2 { margin:0 0 12px; font-size:18px; }
.empty { padding:14px; border:1px dashed var(--line); color:var(--ink-3); font-size:12px; }
.match-row { display:flex; justify-content:space-between; gap:12px; padding:12px 0; border-top:1px solid var(--line); }
.match-row div:first-child { display:grid; gap:4px; min-width:0; }
.match-row b { color:var(--ink-3); font-size:10px; font-weight:400; }
.match-row span { overflow:hidden; color:var(--ink-2); font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
.match-result { flex:none; align-self:center; color:var(--accent); font-size:12px; }
</style>
