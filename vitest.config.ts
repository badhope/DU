import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

const src = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  plugins: [vue()],
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
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/modules/**/logic/**', 'src/shared/utils/**', 'src/config/**'],
    },
  },
})
