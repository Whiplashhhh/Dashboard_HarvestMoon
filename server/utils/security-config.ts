/** Paramètres de sécurité dérivés de l'environnement. */
export function securityConfig() {
  const config = useRuntimeConfig()
  const production = process.env.NODE_ENV === 'production'
  // Cookies « Secure » en production, sauf désactivation explicite (démo locale en HTTP sur une IP du réseau).
  const secure = production && String(config.cookieSecure) !== 'false'
  return {
    production,
    secure,
    sessionCookie: secure ? '__Host-carnet_session' : 'carnet_session',
    csrfCookie: secure ? '__Host-carnet_csrf' : 'carnet_csrf',
    siteOrigin: new URL(config.public.siteUrl).origin,
    secret: config.sessionSecret,
    trustProxy: String(config.trustProxy) === 'true',
  }
}
