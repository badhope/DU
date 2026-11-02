import { createRouter, createWebHashHistory } from 'vue-router'
import { TOOLS } from '@/tools/registry'

/**
 * 路由表。
 *
 * 页面标题在这里统一设置：单页应用的标题不会随导航自动变化，
 * 读屏用户和浏览器历史都依赖它区分页面。每个路由带一个 title，
 * 由 afterEach 写进 document.title。
 */
export const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/Home.vue'), meta: { title: '天机台 · 玄学大师测评' } },
  { path: '/ask', name: 'ask', component: () => import('@/pages/Ask.vue'), meta: { title: '问天 · 天机台' } },
  { path: '/arena', name: 'arena', component: () => import('@/pages/Arena.vue'), meta: { title: '擂台 · 天机台' } },
  { path: '/leaderboard', name: 'leaderboard', component: () => import('@/pages/Leaderboard.vue'), meta: { title: '大师榜 · 天机台' } },
  { path: '/masters/:id', name: 'master', component: () => import('@/pages/MasterPage.vue'), props: true, meta: { title: '方法卡 · 天机台' } },
  { path: '/ledger', name: 'ledger', component: () => import('@/pages/Ledger.vue'), meta: { title: '应验簿 · 天机台' } },
  { path: '/settings', name: 'settings', component: () => import('@/pages/Settings.vue'), meta: { title: '设置 · 天机台' } },
  { path: '/about', name: 'about', component: () => import('@/pages/About.vue'), meta: { title: '机制 · 天机台' } },
  { path: '/reading', name: 'reading', component: () => import('@/pages/Reading.vue'), meta: { title: '典籍阅览室 · 天机台' } },
  { path: '/reading/:book', name: 'reading-book', component: () => import('@/pages/Reading.vue'), props: true, meta: { title: '典籍阅览室 · 天机台' } },
  { path: '/t/:id', name: 'tool', component: () => import('@/pages/ToolPage.vue'), props: true, meta: { title: '工具 · 天机台' } },
  ...TOOLS.map((tool) => ({ path: `/${tool.id}`, redirect: `/t/${tool.id}` })),
  { path: '/:catchAll(.*)', name: 'notfound', component: () => import('@/pages/NotFound.vue'), meta: { title: '页面不存在 · 天机台' } },
]

const BASE_TITLE = '天机台 · 玄学大师测评'

export const makeRouter = (history = createWebHashHistory()) => {
  const router = createRouter({
    history,
    routes,
    scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  })

  router.afterEach((to) => {
    if (typeof document === 'undefined') return
    const title = (to.meta.title as string | undefined) ?? BASE_TITLE
    document.title = title
  })

  // 懒加载 chunk 拉取失败时（离线、部署换版本后旧缓存指向已删除文件），
  // 不白屏：整页重载一次通常就能拿到新版本。
  router.onError((error, to) => {
    const message = String(error?.message ?? error)
    if (/Failed to fetch dynamically imported module|Importing a module script failed/i.test(message)) {
      window.location.assign(`#${to.fullPath}`)
      window.location.reload()
    }
  })

  return router
}

export const router = makeRouter()
