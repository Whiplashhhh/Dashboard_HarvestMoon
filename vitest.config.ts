import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const alias = {
  '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
  '~~': fileURLToPath(new URL('.', import.meta.url)),
  '~': fileURLToPath(new URL('.', import.meta.url)),
}

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts', 'tests/data/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          // Démarre le serveur construit (.output) sur une base PostgreSQL de test : voir tests/api/global-setup.ts
          name: 'api',
          environment: 'node',
          include: ['tests/api/**/*.test.ts'],
          globalSetup: ['tests/api/global-setup.ts'],
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
})
