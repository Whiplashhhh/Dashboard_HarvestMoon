import { randomBytes } from 'node:crypto'

let ephemeralSecret: string | null = null

/**
 * Secret de signature CSRF. S'il n'est pas fourni, un secret aléatoire est généré au démarrage (le site
 * fonctionne « du premier coup » ; les jetons CSRF sont simplement renouvelés à chaque redémarrage).
 */
function resolveSecret(configured: string): string {
  const placeholder = configured.startsWith('remplace-moi')
  if (configured && configured.length >= 32 && !placeholder) return configured
  if (!ephemeralSecret) {
    ephemeralSecret = randomBytes(48).toString('base64url')
    console.warn('[sécurité] NUXT_SESSION_SECRET absent ou trop court : secret aléatoire temporaire utilisé.')
  }
  return ephemeralSecret
}

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
    secret: resolveSecret(config.sessionSecret),
    trustProxy: String(config.trustProxy) === 'true',
  }
}
