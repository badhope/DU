import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { probeBackend } from './composables/backend'
import './styles/theme.css'

createApp(App).use(router).mount('#app')

// 被动探测同源后端：探测失败不会影响任何功能，只是保持纯本地模式。
// 用 microtask 延后，避免和首屏渲染抢资源。
void probeBackend()
