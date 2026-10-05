import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

/**
 * Protection CSRF : « double-submit cookie » signé (HMAC) + vérification de l'en-tête Origin.
 * Le cookie (lisible par le JavaScript du site, SameSite=Lax) doit être recopié dans l'en-tête `x-csrf-token`.
 * Un site tiers ne peut ni lire le cookie ni forger une signature valide.
 */
export const CSRF_HEADER = 'x-csrf-token'

function sign(value: string): string {
  return createHmac('sha256', securityConfig().secret).update(value).digest('base64url')
}

export function issueCsrfToken(): string {
  const value = randomBytes(18).toString('base64url')
  return `${value}.${sign(value)}`
}

export function isValidCsrfToken(token: string | undefined): boolean {
  if (!token || token.length > 200) return false
  const [value, signature] = token.split('.')
  if (!value || !signature) return false
  const expected = Buffer.from(sign(value))
  const given = Buffer.from(signature)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

/** Garantit la présence d'un cookie CSRF valide et renvoie sa valeur. */
export function ensureCsrfCookie(event: H3Event): string {
  const { csrfCookie, secure } = securityConfig()
  const current = getCookie(event, csrfCookie)
  if (isValidCsrfToken(current)) return current!
  const token = issueCsrfToken()
  setCookie(event, csrfCookie, token, { httpOnly: false, secure, sameSite: 'lax', path: '/' })
  return token
}

/** Vérifie Origin (ou Sec-Fetch-Site) et le jeton double-submit. Lève une 403 sinon. */
export function assertCsrf(event: H3Event): void {
  const { csrfCookie, siteOrigin } = securityConfig()
  const origin = getHeader(event, 'origin')
  if (origin) {
    if (origin !== siteOrigin) throw createError({ statusCode: 403, statusMessage: 'Origine refusée.' })
  } else {
    const site = getHeader(event, 'sec-fetch-site')
    if (site && site !== 'same-origin' && site !== 'none')
      throw createError({ statusCode: 403, statusMessage: 'Origine refusée.' })
  }
  const cookie = getCookie(event, csrfCookie)
  const header = getHeader(event, CSRF_HEADER)
  if (!cookie || !header || cookie !== header || !isValidCsrfToken(header))
    throw createError({ statusCode: 403, statusMessage: 'Jeton de sécurité invalide. Recharge la page.' })
}
