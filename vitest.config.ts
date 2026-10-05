import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    // Les tests d'API démarrent le serveur construit et une base PostgreSQL : voir tests/api/setup.ts
    globalSetup: ['tests/api/global-setup.ts'],
    testTimeout: 20_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
})
