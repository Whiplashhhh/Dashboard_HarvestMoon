import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

/**
 * Applique automatiquement les migrations SQL versionnées au démarrage du serveur.
 * Dossier : MIGRATIONS_DIR, sinon server/database/migrations (copié dans l'image Docker).
 */
export default defineNitroPlugin(async () => {
  // Pas de base pendant le pré-rendu (build) des données du jeu.
  if (import.meta.prerender) return
  const folder = resolve(process.env.MIGRATIONS_DIR ?? 'server/database/migrations')
  if (!existsSync(folder)) {
    console.warn(`[migrations] dossier introuvable (${folder}) : migrations non appliquées`)
    return
  }
  await migrate(useDb(), { migrationsFolder: folder })
  console.info('[migrations] base de données à jour')
})
