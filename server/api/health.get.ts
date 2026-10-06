import { sql } from 'drizzle-orm'

/** Sonde de santé (Docker / reverse proxy) : l'application répond et la base est joignable. */
export default defineEventHandler(async (event) => {
  try {
    await useDb().execute(sql`select 1`)
    return { status: 'ok' }
  } catch {
    setResponseStatus(event, 503)
    return { status: 'indisponible' }
  }
})
