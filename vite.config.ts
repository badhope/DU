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
    // 注入语料读取器：否则测试里所有检索都会失败，与生产行为不一致
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.spec.ts'],
    /*
     * SQLite 的 reset() 要 VACUUM（重写整库）再截断 WAL。单跑约 460ms，
     * 但在全量并行时磁盘抖一下就会超过 vitest 默认的 5s —— 实测一次远程克隆
     * 全套跑挂在这个用例上，单独重跑立刻过。那是资源竞争，不是功能缺陷，
     * 但一条会随机变红的测试会让人不再相信整条流水线。
     * 默认放宽到 15s：仍能抓住真正的死锁，又不因磁盘抖动误报。
     */
    testTimeout: 15_000,
    server: {
      deps: {
        // Node 内置模块（node:sqlite / node:sea）必须交给 Node 解析，
        // 否则 Vite 会尝试把它们打进 happy-dom 环境并报 "Cannot bundle built-in module"。
        external: [/^node:/],
      },
    },
  },
})
