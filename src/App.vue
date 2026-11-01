<script setup lang="ts">
import { prefs, toggleSkin } from '@/composables/prefs'
import { session, resetSession } from '@/composables/session'
import { TOOL_COUNT } from '@/tools/registry'
import { ACTIVE_MASTERS, MASTER_COUNT } from '@/masters/registry'
</script>

<template>
  <header class="du-top">
    <RouterLink to="/" class="du-brand">DU</RouterLink><small class="du-brand-sub">天机台</small>
    <nav class="tp-nav">
      <RouterLink to="/ask">问天</RouterLink>
      <RouterLink to="/arena">擂台</RouterLink>
      <RouterLink to="/leaderboard">大师榜</RouterLink>
      <RouterLink to="/reading">典籍</RouterLink>
      <RouterLink to="/about">机制</RouterLink>
      <RouterLink to="/settings">设置</RouterLink>
      <button class="du-btn tp-btn" @click="toggleSkin">{{ prefs.skin === 'ink' ? '夜墨' : '宣纸' }}</button>
    </nav>
  </header>

  <main class="du-shell">
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in"><component :is="Component" /></Transition>
    </RouterView>
  </main>

  <footer class="ft">
    <p>天机台 · {{ ACTIVE_MASTERS.length }}/{{ MASTER_COUNT }} 位大师可测评 · 旧工具 {{ TOOL_COUNT }} 个 · 本机提问 {{ session.visits }} 次（<button class="ft-btn" @click="resetSession">清空</button>）</p>
    <p>纯前端本地文化研究与自省工具。问题、生辰、盘面、回答和反馈不上传。不作医疗、法律、投资建议。</p>
  </footer>
</template>

<style scoped>
.du-brand { font-size:18px; letter-spacing:.28em; text-decoration:none; }
.du-brand-sub { margin-left:-5px; color:var(--accent-2); font-size:10px; letter-spacing:.12em; }
.tp-nav { display:flex; align-items:center; flex-wrap:wrap; justify-content:flex-end; gap:10px; font-size:12px; }
.tp-nav a { text-decoration:none; color:var(--ink-2); }
.tp-nav a.router-link-active { color:var(--accent); }
.tp-btn { font-size:11px; padding:5px 9px; }
.ft { max-width:var(--maxw); margin:40px auto 0; padding:18px 16px 40px; border-top:1px solid var(--line); font-size:11px; line-height:1.7; color:var(--ink-3); }
.ft p { margin:0 0 4px; }
.ft-btn { font:inherit; border:0; background:none; color:var(--accent); cursor:pointer; text-decoration:underline; padding:0; }
.fade-enter-active,.fade-leave-active { transition:opacity .18s ease; }
.fade-enter-from,.fade-leave-to { opacity:0; }
@media (max-width:650px) { .tp-nav { gap:7px; } .du-top { align-items:flex-start; } }
</style>
