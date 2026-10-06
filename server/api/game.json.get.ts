import { createHash } from 'node:crypto'
import { loadGameData } from '#shared/data/sources'

let payload: { body: string; etag: string } | null = null

/** Données du jeu (publiques, identiques pour toutes) : servies avec un ETag pour le cache navigateur. */
export default defineEventHandler((event) => {
  if (!payload) {
    const body = JSON.stringify(loadGameData())
    payload = { body, etag: `"${createHash('sha1').update(body).digest('base64url')}"` }
  }
  setHeader(event, 'Cache-Control', 'public, max-age=0, must-revalidate')
  setHeader(event, 'ETag', payload.etag)
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  if (getHeader(event, 'if-none-match') === payload.etag) {
    setResponseStatus(event, 304)
    return ''
  }
  return payload.body
})
