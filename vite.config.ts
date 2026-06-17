import { defineConfig } from 'vite'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const require = createRequire(import.meta.url)
const uni = require('@dcloudio/vite-plugin-uni')

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'),
)

export default defineConfig({
  base: '/DU/',
  plugins: [uni.default()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
