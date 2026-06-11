import { defineConfig } from 'vite'
import { createRequire } from 'module'
import { fileURLToPath, URL } from 'url'

const require = createRequire(import.meta.url)
const uni = require('@dcloudio/vite-plugin-uni')

const src = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  base: '/mistverse/',
  plugins: [uni.default()],
  resolve: {
    alias: {
      '@/': src + '/',
      '@app/': src + '/app/',
      '@shared/': src + '/shared/',
      '@modules/': src + '/modules/',
      '@stores/': src + '/stores/',
      '@config/': src + '/config/',
    },
  },
})
