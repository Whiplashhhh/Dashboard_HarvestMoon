/** Base de test vierge avant les parcours (lancé juste avant le serveur, qui rejoue les migrations). */
import postgres from 'postgres'

const url = process.env.NUXT_DATABASE_URL ?? 'postgres://carnet:carnet@localhost:5433/carnet_test'
const sql = postgres(url, { max: 1, onnotice: () => {} })
await sql.unsafe(
  'drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;',
)
await sql.end()
