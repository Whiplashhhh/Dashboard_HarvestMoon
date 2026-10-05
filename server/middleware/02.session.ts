/** Charge la session (si cookie) et garantit la présence du cookie CSRF. */
export default defineEventHandler(async (event) => {
  const path = event.path
  // Fichiers statiques et assets du build : pas de session.
  if (
    path.startsWith('/_nuxt/') ||
    path.startsWith('/fonts/') ||
    /\.(?:ico|png|svg|webmanifest|txt|woff2?)$/.test(path)
  )
    return
  event.context.auth = await loadSession(event)
  ensureCsrfCookie(event)
})
