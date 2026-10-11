<script setup lang="ts">
/** 兜底页：hash 路由下最常见的错法是手敲工具 id */
import { TOOLS } from '@/tools/registry'
</script>

<template>
  <div class="nf">
    <h1>这里没有东西</h1>
    <p>地址可能写错了。现有 {{ TOOLS.length }} 个工具：</p>
    <RouterLink v-for="t in TOOLS" :key="t.id" :to="`/t/${t.id}`" class="nf-a">{{ t.name }}</RouterLink>
    <RouterLink to="/" class="du-btn">回首页</RouterLink>
  </div>
</template>

<style scoped>
.nf {
  display: grid;
  gap: 10px;
  justify-items: start;
  padding: 40px 0;
}
.nf h1 {
  margin: 0;
  font-size: 22px;
}
.nf p {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
}
.nf-a {
  font-size: 14px;
  color: var(--accent);
}
</style>
