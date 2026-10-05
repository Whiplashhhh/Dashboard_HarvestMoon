/** Applique les migrations en ligne de commande (le serveur le fait aussi automatiquement au démarrage). */
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const url = process.env.NUXT_DATABASE_URL
if (!url) throw new Error('NUXT_DATABASE_URL manquante (voir .env.example)')
const client = postgres(url, { max: 1, onnotice: () => {} })
await migrate(drizzle(client), { migrationsFolder: 'server/database/migrations' })
await client.end()
console.log('Migrations appliquées.')
