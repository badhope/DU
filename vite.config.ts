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
  build: {
    // esbuild >=0.28 不再向下转译解构到 es2020，提升到 es2021 以兼容 uni-app 生成的代码
    target: 'es2021',
  },
})
