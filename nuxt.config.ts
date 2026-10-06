// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  // Pas de manifeste d'application : aucune règle de route n'est utile côté client.
  experimental: { appManifest: false },
  telemetry: false,

  modules: ['@nuxt/eslint'],

  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Composants rangés par dossier mais référencés sans préfixe (<GameButton>, <FarmScene>…)
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Le Carnet de la Ferme',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/icon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#a8703c' },
        { name: 'color-scheme', content: 'light' },
        {
          name: 'description',
          content:
            'Le carnet de ta ferme pour Harvest Moon DS : reprends ta partie là où tu l’avais laissée. Site de fan non officiel.',
        },
      ],
    },
  },

  runtimeConfig: {
    // Surchargées par les variables d'environnement NUXT_* (voir .env.example)
    databaseUrl: '',
    sessionSecret: '',
    trustProxy: false,
    cookieSecure: true,
    authIpFreeAttempts: 20,
    authRegistrationsPerHour: 5,
    public: {
      siteUrl: 'http://localhost:3000',
    },
  },

  nitro: {
    compressPublicAssets: true,
    // Les données du jeu sont figées au build : servies comme fichier statique compressé (gzip/brotli).
    prerender: { routes: ['/api/game.json'] },
  },

  routeRules: {
    '/api/game.json': { headers: { 'cache-control': 'public, max-age=3600, stale-while-revalidate=86400' } },
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },
})
