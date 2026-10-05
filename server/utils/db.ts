import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

export type Database = PostgresJsDatabase<typeof schema>

let client: ReturnType<typeof postgres> | null = null
let database: Database | null = null

/** Connexion Drizzle partagée (créée à la première utilisation). */
export function useDb(): Database {
  if (database) return database
  const url = useRuntimeConfig().databaseUrl
  if (!url) throw new Error('NUXT_DATABASE_URL manquante : voir .env.example')
  client = postgres(url, { max: 10, idle_timeout: 30, onnotice: () => {} })
  database = drizzle(client, { schema })
  return database
}

export async function closeDb() {
  await client?.end({ timeout: 5 })
  client = null
  database = null
}

export { schema }
