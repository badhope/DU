<script setup lang="ts">
/**
 * 应用外壳：页眉导航、路由容器、页脚。
 *
 * 可访问性要点（不是装饰）：
 *  - 首个可聚焦元素是"跳到主内容"，键盘用户不必逐条 Tab 过七个导航项；
 *  - 导航有 aria-label；
 *  - 主内容区有 id 与 tabindex，路由切换后焦点回到这里。
 *
 * 关于路由过渡：这里**不用** <Transition mode="out-in">。
 * out-in 会等旧页面离场动画结束才挂载新页面；一旦离场动画的 transitionend
 * 因任何原因不触发，主内容区就永久停留在空注释节点。这个缺陷曾让
 * "首页 → 任意子页"直接白屏。现在用 key 强制重建 + CSS 入场动画，
 * 导航永远不会被动画阻塞。
 */
import { nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { prefs, toggleSkin } from '@/composables/prefs'
import { session, resetSession } from '@/composables/session'
import { TOOL_COUNT } from '@/tools/registry'
import { ACTIVE_MASTERS, MASTER_COUNT } from '@/masters/registry'

const route = useRoute()

const NAV = [
  { to: '/ask', label: '问天' },
  { to: '/arena', label: '擂台' },
  { to: '/leaderboard', label: '大师榜' },
  { to: '/reading', label: '典籍' },
  { to: '/about', label: '机制' },
  { to: '/settings', label: '设置' },
]

// 路由切换后把焦点交回主内容，读屏用户不会停在旧位置的导航上
watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    const main = document.getElementById('main')
    if (main && document.activeElement !== main) main.focus({ preventScroll: true })
  },
)
</script>

<template>
  <a class="skip" href="#main">跳到主内容 / Skip to content</a>

  <header class="du-top">
    <RouterLink to="/" class="du-brand" aria-label="天机台首页">DU</RouterLink><small class="du-brand-sub" aria-hidden="true">天机台</small>
    <nav class="tp-nav" aria-label="主导航">
      <RouterLink v-for="item in NAV" :key="item.to" :to="item.to">{{ item.label }}</RouterLink>
      <button
        class="du-btn tp-btn"
        type="button"
        :aria-pressed="prefs.skin === 'paper'"
        :title="prefs.skin === 'ink' ? '切换到宣纸（浅色）主题' : '切换到夜墨（深色）主题'"
        @click="toggleSkin"
      >
        {{ prefs.skin === 'ink' ? '夜墨' : '宣纸' }}
      </button>
    </nav>
  </header>

  <main id="main" class="du-shell" tabindex="-1">
    <RouterView v-slot="{ Component, route: current }">
      <div :key="current.fullPath" class="route-view"><component :is="Component" /></div>
    </RouterView>
  </main>

  <footer class="ft">
    <p>
      天机台 · {{ ACTIVE_MASTERS.length }}/{{ MASTER_COUNT }} 位大师可测评 · 旧工具 {{ TOOL_COUNT }} 个 · 本机提问
      {{ session.visits }} 次（<button class="ft-btn" type="button" @click="resetSession">清空</button>）
    </p>
    <p>纯前端本地文化研究与自省工具。问题、生辰、盘面、回答和反馈不上传。不作医疗、法律、投资建议。</p>
  </footer>
</template>

<style scoped>
.skip { position:absolute; left:-9999px; top:0; z-index:100; padding:10px 14px; background:var(--accent); color:#fff; text-decoration:none; }
.skip:focus { left:8px; top:8px; }
.du-brand { font-size:18px; letter-spacing:.28em; text-decoration:none; }
.du-brand-sub { margin-left:-5px; color:var(--accent-2); font-size:10px; letter-spacing:.12em; }
.tp-nav { display:flex; align-items:center; flex-wrap:wrap; justify-content:flex-end; gap:10px; font-size:12px; }
.tp-nav a { text-decoration:none; color:var(--ink-2); }
.tp-nav a.router-link-active { color:var(--accent); }
.tp-btn { font-size:11px; padding:5px 9px; }
.du-shell:focus { outline:none; }
/* 入场动画只作用一次，不依赖任何离场完成事件 */
.route-view { animation: route-in .18s ease both; }
@keyframes route-in { from { opacity:0; } to { opacity:1; } }
@media (prefers-reduced-motion: reduce) { .route-view { animation:none; } }
.ft { max-width:var(--maxw); margin:40px auto 0; padding:18px 16px 40px; border-top:1px solid var(--line); font-size:11px; line-height:1.7; color:var(--ink-3); }
.ft p { margin:0 0 4px; }
.ft-btn { font:inherit; border:0; background:none; color:var(--accent); cursor:pointer; text-decoration:underline; padding:0; }
@media (max-width:650px) { .tp-nav { gap:7px; } .du-top { align-items:flex-start; } }
</style>
