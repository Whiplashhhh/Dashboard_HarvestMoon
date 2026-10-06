import { defineConfig, devices } from '@playwright/test'

/**
 * Parcours principaux de bout en bout, sur le serveur construit (`npm run build`) et une base de test.
 * Base : TEST_DATABASE_URL (par défaut la base de dev Docker, carnet_test), remise à zéro au démarrage.
 */
const PORT = Number(process.env.E2E_PORT ?? 3210)
const baseURL = `http://127.0.0.1:${PORT}`
const databaseUrl = process.env.TEST_DATABASE_URL ?? 'postgres://carnet:carnet@localhost:5433/carnet_test'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npx tsx tests/e2e/reset-db.ts && node .output/server/index.mjs',
    url: `${baseURL}/connexion`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      NODE_ENV: 'production',
      PORT: String(PORT),
      HOST: '127.0.0.1',
      NUXT_DATABASE_URL: databaseUrl,
      NUXT_SESSION_SECRET: 'secret-e2e-uniquement-0123456789-abcdefghijkl',
      NUXT_PUBLIC_SITE_URL: baseURL,
      NUXT_AUTH_IP_FREE_ATTEMPTS: '1000',
      NUXT_AUTH_REGISTRATIONS_PER_HOUR: '1000',
    },
  },
})
