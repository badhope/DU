import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    rollupOptions: {
      output: { manualChunks: { core: ['./src/core/index.ts'] } },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.spec.ts'],
    server: {
      deps: {
        // Node 内置模块（node:sqlite / node:sea）必须交给 Node 解析，
        // 否则 Vite 会尝试把它们打进 happy-dom 环境并报 "Cannot bundle built-in module"。
        external: [/^node:/],
      },
    },
  },
})
