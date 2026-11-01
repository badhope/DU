<script setup lang="ts">
import { computed } from 'vue'
import { listLeaderboard } from '@/arena/store'
import { masterById } from '@/masters/registry'

const rows = computed(() => listLeaderboard())
</script>

<template>
  <section class="board-page"><header class="page-head"><p class="kicker">LEADERBOARD / EVIDENCE FIRST</p><h1>大师榜</h1><p>只按你的本机盲测和应验记录计算。初始分均为 1500；至少 5 场对局才进入“在榜”，不拿小样本冒充冠军。</p></header><div class="board-note">榜单范围：本机数据 · 胜率显示 Wilson 下界 · 断言应验率只统计你主动回填的结果</div><div class="rows"><article v-for="(row, index) in rows" :key="row.masterId" class="board-row"><span class="rank">{{ row.tier === '在榜' ? `#${index + 1}` : '—' }}</span><div class="board-main"><div class="board-name"><b>{{ masterById(row.masterId)?.name }}</b><span>{{ masterById(row.masterId)?.school }}</span></div><div class="board-meta"><span>{{ row.tier }}</span><span>{{ row.matches }} 场盲测</span><span>{{ row.wilsonLower === null ? '胜率待定' : `胜率下界 ${(row.wilsonLower * 100).toFixed(0)}%` }}</span><span>{{ row.claimRate === null ? '应验待定' : `应验 ${(row.claimRate * 100).toFixed(0)}%` }}</span></div></div><strong class="rating">{{ row.rating }}</strong></article></div><RouterLink class="board-link" to="/ledger">查看应验簿 →</RouterLink></section>
</template>

<style scoped>
.board-page { padding:28px 0; }
.page-head { border-bottom:1px solid var(--line); padding-bottom:16px; }
.kicker { margin:0 0 6px; color:var(--accent-2); font-size:10px; letter-spacing:.2em; }
h1 { margin:0; font-size:30px; letter-spacing:.12em; }
.page-head p:not(.kicker) { max-width:60ch; margin:8px 0 0; color:var(--ink-2); font-size:13px; line-height:1.8; }
.board-note { margin:18px 0; padding:10px 12px; border:1px dashed var(--line); color:var(--ink-3); font-size:11px; }
.rows { display:grid; gap:7px; }
.board-row { display:grid; grid-template-columns:35px 1fr auto; gap:10px; align-items:center; padding:13px; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface-1); }
.rank { color:var(--accent-2); font-size:13px; text-align:center; }
.board-name { display:flex; align-items:baseline; gap:8px; }
.board-name b { font-size:16px; }
.board-name span { color:var(--ink-3); font-size:11px; }
.board-meta { display:flex; flex-wrap:wrap; gap:6px 12px; margin-top:5px; color:var(--ink-3); font-size:10px; }
.rating { color:var(--accent); font-size:20px; }
.board-link { display:inline-block; margin-top:16px; color:var(--accent); font-size:12px; }
</style>
