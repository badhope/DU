<script setup lang="ts">
import type { Master } from '@/contract/master'
import type { LeaderboardRow } from '@/arena/rating'
const props = defineProps<{ master: Master; stats?: LeaderboardRow }>()
</script>

<template>
  <article class="mc" :style="{ '--mc-accent': master.accent }">
    <div class="mc-mark">{{ master.glyph }}</div>
    <div class="mc-main">
      <div class="mc-head">
        <div>
          <p class="mc-kicker">{{ master.school }} · {{ master.status === 'active' ? '可测评' : '筹备中' }}</p>
          <h3>{{ master.name }}</h3>
        </div>
        <span v-if="stats" class="mc-rating">{{ stats.rating }}</span>
      </div>
      <p class="mc-title">{{ master.title }}</p>
      <p class="mc-bio">{{ master.method }}</p>
      <div class="mc-tags"><span v-for="tag in master.style" :key="tag">{{ tag }}</span></div>
      <p v-if="stats" class="mc-meta">
        {{ stats.tier }} · {{ stats.matches ? `${stats.matches} 场盲测` : '尚无样本' }} ·
        {{ stats.winRate === null ? '胜率待定' : `胜率 ${(stats.winRate * 100).toFixed(0)}%` }}
      </p>
      <p v-else class="mc-meta">典籍：{{ master.books.join('、') }}</p>
      <RouterLink class="du-btn mc-link" :to="`/masters/${master.id}`">查看方法卡</RouterLink>
    </div>
  </article>
</template>

<style scoped>
.mc { display:grid; grid-template-columns:52px 1fr; gap:14px; padding:16px; border:1px solid var(--line); border-left:3px solid var(--mc-accent); border-radius:var(--radius); background:var(--surface-1); }
.mc-mark { display:grid; place-items:center; width:44px; height:44px; border:1px solid var(--mc-accent); border-radius:50%; color:var(--mc-accent); font-size:20px; }
.mc-main { min-width:0; }
.mc-head { display:flex; justify-content:space-between; gap:12px; align-items:start; }
.mc-kicker { margin:0 0 3px; color:var(--ink-3); font-size:10px; letter-spacing:.12em; }
.mc h3 { margin:0; font-size:18px; }
.mc-rating { color:var(--accent-2); font-weight:700; }
.mc-title { margin:7px 0 0; color:var(--ink-2); font-size:13px; }
.mc-bio { margin:8px 0 0; color:var(--ink-3); font-size:12px; line-height:1.7; }
.mc-tags { display:flex; flex-wrap:wrap; gap:5px; margin-top:9px; }
.mc-tags span { padding:2px 7px; border:1px solid var(--line); border-radius:999px; color:var(--ink-3); font-size:10px; }
.mc-meta { margin:9px 0 0; color:var(--ink-3); font-size:11px; }
.mc-link { display:inline-block; margin-top:11px; padding:6px 10px; font-size:11px; text-decoration:none; }
</style>
