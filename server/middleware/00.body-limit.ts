/** Refuse les corps de requête trop gros avant toute lecture (protection mémoire). */
const MAX_BODY_BYTES = 64 * 1024

export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/') || event.method === 'GET' || event.method === 'HEAD') return
  const length = Number(getHeader(event, 'content-length') ?? 0)
  const chunked = getHeader(event, 'transfer-encoding')?.includes('chunked')
  if (length > MAX_BODY_BYTES || (chunked && !length))
    throw createError({ statusCode: 413, statusMessage: 'Requête trop volumineuse' })
})
