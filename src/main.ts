import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { initLedger } from './composables/ledger'
import './styles/theme.css'

createApp(App).use(router).mount('#app')

// 探测同源后端并锁定台账模式。失败不会影响任何功能，只是保持纯本地模式。
// 挂在 window 上是为了让 E2E 能等到探测完成再断言，避免和首屏渲染抢时序。
declare global {
  interface Window { __tianjiReady?: Promise<string> }
}
window.__tianjiReady = initLedger()
