/**
 * Crée (ou recrée) le compte de démonstration avec une partie déjà bien avancée.
 * Désactivé en production, sauf si ALLOW_DEMO_SEED=true est explicitement défini.
 *
 * Usage : npm run db:seed-demo
 * Identifiants : demo / Tournesol-Lumineux-42 (surchargeables : DEMO_USERNAME, DEMO_PASSWORD)
 */
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '../server/database/schema'
import { hashPassword } from '../server/utils/password'
import { loadGameData } from '../shared/data/sources'
import { spriteObjectiveId } from '../shared/data/game'

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  console.error('Seed de démonstration refusé en production (définir ALLOW_DEMO_SEED=true pour forcer).')
  process.exit(1)
}

const url = process.env.NUXT_DATABASE_URL
if (!url) throw new Error('NUXT_DATABASE_URL manquante (voir .env.example)')
const username = process.env.DEMO_USERNAME ?? 'demo'
const password = process.env.DEMO_PASSWORD ?? 'Tournesol-Lumineux-42'

const client = postgres(url, { max: 1, onnotice: () => {} })
const db = drizzle(client, { schema })
await migrate(db, { migrationsFolder: 'server/database/migrations' })

const game = loadGameData()
const has = (id: string) => game.objectives.some((o) => o.id === id)

// Une partie au début de l'été de l'an 1 : 34 lutins faciles trouvés, premiers bâtiments et outils.
const sprites = game.sprites
  .filter(
    (s) =>
      s.id !== 'venus' &&
      (s.fromStart ||
        (s.difficulty <= 2 &&
          s.prerequisites.every((p) => p.type === 'sprite' || (p.type === 'spriteCount' && p.min <= 20)))),
  )
  .slice(0, 34)
  .map((s) => spriteObjectiveId(s.id))
const progress = [
  'batiments-house-upgrade-1',
  'batiments-poultry-barn',
  'animaux-buy-first-chicken',
  'outils-hoe-copper',
  'outils-watering-can-copper',
  'outils-get-fishing-rod',
  'deesse-find-20-sprites',
  'mine-access-1',
  'ferme-buy-kitchen',
].filter(has)
const pinned = ['sprite-venus', ...game.objectives.map((o) => o.id)].find(
  (id) => has(id) && !sprites.includes(id) && !progress.includes(id),
)!

await db.delete(schema.users).where(eq(schema.users.usernameKey, username.toLowerCase()))
const [user] = await db
  .insert(schema.users)
  .values({ username, usernameKey: username.toLowerCase(), passwordHash: await hashPassword(password) })
  .returning()
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)
const [farm] = await db
  .insert(schema.farms)
  .values({
    userId: user!.id,
    farmerName: 'Lili',
    farmName: 'Les Tournesols',
    gameYear: 1,
    gameSeason: 'summer',
    gameDay: 12,
    pinnedObjectiveId: pinned,
    lastPlayedAt: daysAgo(12),
  })
  .returning()
await db.update(schema.users).set({ activeFarmId: farm!.id }).where(eq(schema.users.id, user!.id))
await db
  .insert(schema.farmObjectives)
  .values([...sprites, ...progress].map((objectiveId) => ({ farmId: farm!.id, objectiveId })))
await db.insert(schema.farmSteps).values([
  { farmId: farm!.id, objectiveId: pinned, methodIndex: 0, stepIndex: 0 },
  { farmId: farm!.id, objectiveId: pinned, methodIndex: 0, stepIndex: 1 },
])
await db.insert(schema.notes).values([
  {
    farmId: farm!.id,
    body: 'Premier poulailler construit ! Penser à ramasser les œufs chaque matin.',
    gameYear: 1,
    gameSeason: 'spring',
    gameDay: 24,
    createdAt: daysAgo(30),
  },
  {
    farmId: farm!.id,
    body: 'Je commande chez Karen tous les jours pour Venus : déjà 4 jours sur 10. Ne pas oublier le Fireworks Festival !',
    gameYear: 1,
    gameSeason: 'summer',
    gameDay: 12,
    createdAt: daysAgo(12),
  },
])

console.log(
  `Compte de démonstration prêt : ${username} / ${password} (${sprites.length} lutins, objectif épinglé : ${pinned})`,
)
await client.end()
