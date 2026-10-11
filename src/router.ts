/**
 * DU v2 · 路由
 *
 * 用 hash 模式：GitHub Pages 免费版不能配 rewrite，
 * 而本站要做到"两个平台同一份产物"，hash 是唯一零配置的解。
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import { TOOLS } from '@/tools/registry'

/** 路由表导出，测试用同一份表跑 memory history —— 导航漂移会当场暴露 */
export const routes = [
  { path: '/', name: 'home', component: () => import('@/pages/Home.vue') },
  { path: '/about', name: 'about', component: () => import('@/pages/About.vue') },
  { path: '/reading', name: 'reading', component: () => import('@/pages/Reading.vue') },
  {
    path: '/reading/:book',
    name: 'reading-book',
    component: () => import('@/pages/Reading.vue'),
    props: true,
  },
  {
    path: '/t/:id',
    name: 'tool',
    component: () => import('@/pages/ToolPage.vue'),
    props: true,
  },
  // 工具页直达：注册表是唯一来源，写错 id 由组件自己提示
  ...TOOLS.map((t) => ({ path: `/${t.id}`, redirect: `/t/${t.id}` })),
  { path: '/:catchAll(.*)', name: 'notfound', component: () => import('@/pages/NotFound.vue') },
]

export const makeRouter = (history = createWebHashHistory()) =>
  createRouter({ history, routes, scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 } })

export const router = makeRouter()
