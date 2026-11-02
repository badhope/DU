<script setup lang="ts">
/**
 * 兜底页：hash 路由下最常见的错法是手敲工具 id 或复制了过期的深链。
 *
 * 这里不只说"没有"，还给出三条真实出路：回到核心流程、去工具入口、去阅览室。
 * 页脚统一报当前可用数量，避免写死数字后漂移。
 */
import { TOOLS } from '@/tools/registry'
import { ACTIVE_MASTERS, MASTER_COUNT } from '@/masters/registry'
</script>

<template>
  <section class="nf">
    <p class="nf-kicker">404 / NOT FOUND</p>
    <h1>这里没有东西</h1>
    <p class="nf-lead">地址可能写错了，或者这个入口已经被合并进主流程。</p>

    <div class="nf-actions">
      <RouterLink class="du-btn primary" to="/ask">去问天</RouterLink>
      <RouterLink class="du-btn" to="/">回首页</RouterLink>
      <RouterLink class="du-btn" to="/reading">典籍阅览室</RouterLink>
    </div>

    <h2>可用的工具入口（{{ TOOLS.length }}）</h2>
    <ul class="nf-list">
      <li v-for="t in TOOLS" :key="t.id"><RouterLink :to="`/t/${t.id}`">{{ t.name }}</RouterLink></li>
    </ul>

    <p class="nf-meta">当前 {{ ACTIVE_MASTERS.length }}/{{ MASTER_COUNT }} 位大师可测评。</p>
  </section>
</template>

<style scoped>
.nf { display: grid; gap: 14px; justify-items: start; padding: 40px 0; max-width: 60ch; }
.nf-kicker { margin: 0; color: var(--accent-2); font-size: 10px; letter-spacing: .2em; }
.nf h1 { margin: 0; font-size: 24px; letter-spacing: .1em; }
.nf-lead { margin: 0; color: var(--ink-2); font-size: 13px; line-height: 1.8; }
.nf-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.nf-actions a { text-decoration: none; }
.nf h2 { margin: 8px 0 0; color: var(--ink-3); font-size: 12px; font-weight: 500; letter-spacing: .1em; }
.nf-list { margin: 0; padding-left: 1.2em; font-size: 13px; line-height: 2; }
.nf-list a { color: var(--accent); }
.nf-meta { margin: 0; color: var(--ink-3); font-size: 11px; }
</style>
