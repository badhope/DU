<script setup lang="ts">
import { computed } from 'vue'
import { masterById } from '@/masters/registry'
import { listLeaderboard } from '@/arena/store'

const props = defineProps<{ id: string }>()
const master = computed(() => masterById(props.id))
const stats = computed(() => listLeaderboard().find((row) => row.masterId === props.id))
</script>

<template>
  <section v-if="master" class="master-page"><header class="master-hero" :style="{ '--master-accent': master.accent }"><span class="master-glyph">{{ master.glyph }}</span><div><p class="kicker">{{ master.school }} · {{ master.status === 'active' ? '已启用' : '筹备中' }}</p><h1>{{ master.name }}</h1><p>{{ master.title }}</p></div></header><section class="master-grid"><article class="master-panel"><h2>方法卡</h2><p>{{ master.method }}</p><h3>典籍来源</h3><div class="chips"><span v-for="book in master.books" :key="book">《{{ book }}》</span></div><h3>语言风格</h3><div class="chips"><span v-for="style in master.style" :key="style">{{ style }}</span></div></article><article class="master-panel"><h2>测评状态</h2><div v-if="stats" class="master-score"><strong>{{ stats.rating }}</strong><span>{{ stats.tier }}</span></div><dl v-if="stats" class="stats"><dt>盲测场次</dt><dd>{{ stats.matches }}</dd><dt>胜 / 负 / 平</dt><dd>{{ stats.wins }} / {{ stats.losses }} / {{ stats.draws }}</dd><dt>可验断言</dt><dd>{{ stats.claimsResolved ? `${stats.claimsHit}/${stats.claimsResolved}` : '暂无样本' }}</dd></dl><p v-else class="empty">尚无本机样本。首场盲测需先在问天页启用两位 active 大师。</p><p class="safety">安全边界：{{ master.safety.join('；') }}。</p></article></section><RouterLink v-if="master.status === 'active'" class="du-btn primary" to="/ask">请这位大师入场</RouterLink><p v-else class="planned">该方法卡尚未进入生产排盘：先补齐节气/排盘算法、外部例题与回归测试。</p></section><section v-else class="missing"><h1>没有这位大师</h1><RouterLink class="du-btn" to="/">回天机台</RouterLink></section>
</template>

<style scoped>
.master-page { padding:28px 0; }
.master-hero { display:flex; align-items:center; gap:16px; padding:18px; border:1px solid var(--master-accent); border-radius:var(--radius); background:var(--surface-1); }
.master-glyph { display:grid; place-items:center; width:58px; height:58px; border:1px solid var(--master-accent); border-radius:50%; color:var(--master-accent); font-size:26px; }
.kicker { margin:0 0 5px; color:var(--master-accent); font-size:10px; letter-spacing:.16em; }
h1 { margin:0; font-size:30px; letter-spacing:.1em; }
.master-hero p:last-child { margin:8px 0 0; color:var(--ink-2); font-size:13px; }
.master-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:16px; }
.master-panel { padding:15px; border:1px solid var(--line); border-radius:var(--radius); background:var(--surface-1); }
.master-panel h2 { margin:0 0 9px; font-size:17px; }
.master-panel h3 { margin:18px 0 7px; color:var(--ink-3); font-size:11px; letter-spacing:.1em; }
.master-panel p { color:var(--ink-2); font-size:13px; line-height:1.8; }
.chips { display:flex; flex-wrap:wrap; gap:6px; }
.chips span { padding:4px 8px; border:1px solid var(--line); border-radius:999px; color:var(--ink-3); font-size:11px; }
.master-score { display:flex; align-items:baseline; gap:9px; }
.master-score strong { color:var(--accent); font-size:34px; }
.master-score span { color:var(--ink-3); font-size:12px; }
.stats { display:grid; grid-template-columns:1fr auto; gap:7px 12px; margin:15px 0; font-size:12px; }
.stats dt { color:var(--ink-3); }
.stats dd { margin:0; color:var(--ink-1); }
.empty,.planned { color:var(--ink-3); font-size:12px; line-height:1.8; }
.safety { padding-top:12px; border-top:1px dashed var(--line); font-size:11px !important; }
.master-page > .du-btn { display:inline-block; margin-top:16px; text-decoration:none; }
.missing { padding:40px 0; }
@media (max-width:650px) { .master-grid { grid-template-columns:1fr; } }
</style>
