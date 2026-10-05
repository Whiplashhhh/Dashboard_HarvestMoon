/**
 * En-têtes de sécurité sur toutes les réponses. La CSP des pages HTML (avec nonce pour les scripts) est
 * posée par le plugin `security-csp` ; ici, une CSP minimale couvre les réponses non HTML.
 */
export default defineEventHandler((event) => {
  const { production } = securityConfig()
  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
  })
  if (production) setHeader(event, 'Strict-Transport-Security', 'max-age=63072000; includeSubDomains')
  if (event.path.startsWith('/api/')) {
    setHeaders(event, {
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Cache-Control': 'no-store',
    })
  }
})
