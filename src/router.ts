import { createRouter, createWebHashHistory } from 'vue-router'
import { TOOLS } from '@/tools/registry'

export const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/Home.vue') },
  { path: '/ask', name: 'ask', component: () => import('@/pages/Ask.vue') },
  { path: '/arena', name: 'arena', component: () => import('@/pages/Arena.vue') },
  { path: '/leaderboard', name: 'leaderboard', component: () => import('@/pages/Leaderboard.vue') },
  { path: '/masters/:id', name: 'master', component: () => import('@/pages/MasterPage.vue'), props: true },
  { path: '/ledger', name: 'ledger', component: () => import('@/pages/Ledger.vue') },
  { path: '/settings', name: 'settings', component: () => import('@/pages/Settings.vue') },
  { path: '/about', name: 'about', component: () => import('@/pages/About.vue') },
  { path: '/reading', name: 'reading', component: () => import('@/pages/Reading.vue') },
  { path: '/reading/:book', name: 'reading-book', component: () => import('@/pages/Reading.vue'), props: true },
  { path: '/t/:id', name: 'tool', component: () => import('@/pages/ToolPage.vue'), props: true },
  ...TOOLS.map((tool) => ({ path: `/${tool.id}`, redirect: `/t/${tool.id}` })),
  { path: '/:catchAll(.*)', name: 'notfound', component: () => import('@/pages/NotFound.vue') },
]

export const makeRouter = (history = createWebHashHistory()) => createRouter({ history, routes, scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 } })
export const router = makeRouter()
