import { defineConfig } from 'vite'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const uni = require('@dcloudio/vite-plugin-uni')

export default defineConfig({
  base: '/mistverse/',
  plugins: [uni.default()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
