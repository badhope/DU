import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  // 静默 uni-app <picker mode="number"> 的 Vue 验证警告：
  // H5 端 Picker 验证器只接受 'selector' | 'multiSelector' | 'time' | 'date' | 'region'，
  // 但 mode="number" 在 H5 build 中仍能正常工作，故过滤此噪音以保持 console 干净。
  app.config.warnHandler = (msg: string) => {
    if (
      msg.includes('Invalid prop: custom validator check failed for prop "mode"') ||
      (msg.includes('custom validator check failed') && msg.includes('mode'))
    ) {
      return
    }
    // 其他警告仍打印到控制台
    // eslint-disable-next-line no-console
    console.warn(msg)
  }
  return { app }
}
