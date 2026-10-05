const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Toutes les requêtes API qui modifient des données doivent passer la vérification CSRF + Origin. */
export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/') || SAFE_METHODS.has(event.method)) return
  assertCsrf(event)
})
