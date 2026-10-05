import { randomBytes } from 'node:crypto'

/**
 * CSP stricte pour les pages HTML : scripts limités au site + nonce aléatoire par réponse
 * (pas de 'unsafe-inline' pour les scripts). Le nonce est ajouté à chaque <script> généré par Nuxt.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    const nonce = randomBytes(16).toString('base64')
    const addNonce = (chunk: string) =>
      chunk.replace(/<script\b(?![^>]*\bnonce=)/g, `<script nonce="${nonce}"`)
    html.head = html.head.map(addNonce)
    html.bodyPrepend = html.bodyPrepend.map(addNonce)
    html.body = html.body.map(addNonce)
    html.bodyAppend = html.bodyAppend.map(addNonce)

    const { production } = securityConfig()
    const directives = [
      "default-src 'self'",
      production ? `script-src 'self' 'nonce-${nonce}'` : `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`,
      // Styles : les attributs style="" dynamiques de Vue exigent 'unsafe-inline' (styles seulement, pas les scripts).
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      production ? "connect-src 'self'" : "connect-src 'self' ws: wss:",
      "manifest-src 'self'",
      "worker-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(production ? ['upgrade-insecure-requests'] : []),
    ]
    setHeader(event, 'Content-Security-Policy', directives.join('; '))
  })
})
