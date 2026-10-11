<script setup lang="ts">
/**
 * DU v2 · 应用外壳
 *
 * 只有导航、页脚、外观开关。任何"结果怎么摆"都不在这里——
 * 那是 ResultView 的职责，工具不参与布局，v1 的 46 个巨型页面由此消失。
 */
import { prefs, toggleSkin } from '@/composables/prefs'
import { session, resetSession } from '@/composables/session'
import { TOOL_COUNT } from '@/tools/registry'
</script>

<template>
  <header class="du-top">
    <RouterLink to="/" class="du-brand">DU</RouterLink>
    <nav class="tp-nav">
      <RouterLink to="/reading">典籍</RouterLink>
      <RouterLink to="/about">机制</RouterLink>
      <button class="du-btn tp-btn" @click="toggleSkin">
        {{ prefs.skin === 'ink' ? '夜墨' : '宣纸' }}
      </button>
    </nav>
  </header>

  <main class="du-shell">
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>

  <footer class="ft">
    <p>
      工具 {{ TOOL_COUNT }} 个 · 断语全部标出处 · 本机记录 {{ session.visits }} 次提问（
      <button class="ft-btn" @click="resetSession">清空</button>）
    </p>
    <p>本站为纯前端娱乐项目，原文来自维基文库公版书。不作医疗、法律、投资建议。</p>
  </footer>
</template>

<style scoped>
.tp-nav {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
}
.tp-nav a {
  text-decoration: none;
  color: var(--ink-2);
}
.tp-nav a.router-link-active {
  color: var(--accent);
}
.tp-btn {
  font-size: 12px;
  padding: 5px 10px;
}
.ft {
  max-width: var(--maxw);
  margin: 40px auto 0;
  padding: 18px 16px 40px;
  border-top: 1px solid var(--line);
  font-size: 11px;
  line-height: 1.7;
  color: var(--ink-3);
}
.ft p {
  margin: 0 0 4px;
}
.ft-btn {
  font: inherit;
  border: none;
  background: none;
  color: var(--accent);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
