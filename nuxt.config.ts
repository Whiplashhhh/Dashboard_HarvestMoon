// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  telemetry: false,

  modules: ['@nuxt/eslint'],

  typescript: {
    strict: true,
    typeCheck: false,
  },

  alias: {
    '#shared': './shared',
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Le Carnet de la Ferme',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
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
    public: {
      siteUrl: 'http://localhost:3000',
    },
  },

  nitro: {
    compressPublicAssets: true,
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },
})
