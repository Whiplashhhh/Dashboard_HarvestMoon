import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { loadGameData } from '#shared/data/sources'
import type { GameDate } from '#shared/schemas'
import { stepKey, type FarmDTO, type FarmSummaryDTO, type NoteDTO } from '#shared/types/api'

type FarmRow = typeof schema.farms.$inferSelect
type NoteRow = typeof schema.notes.$inferSelect

export const farmDate = (farm: Pick<FarmRow, 'gameYear' | 'gameSeason' | 'gameDay'>): GameDate => ({
  year: farm.gameYear,
  season: farm.gameSeason,
  day: farm.gameDay,
})

export const toNoteDTO = (note: NoteRow): NoteDTO => ({
  id: note.id,
  body: note.body,
  date: { year: note.gameYear, season: note.gameSeason, day: note.gameDay },
  createdAt: note.createdAt.toISOString(),
})

/**
 * Charge une ferme EN VÉRIFIANT qu'elle appartient à l'utilisatrice connectée.
 * Une ferme d'une autre personne répond 404 (comme si elle n'existait pas).
 */
export async function requireFarm(event: H3Event, farmId: unknown): Promise<FarmRow> {
  const { user } = requireUser(event)
  if (typeof farmId !== 'string' || !/^[0-9a-f-]{36}$/i.test(farmId))
    throw createError({ statusCode: 404, statusMessage: 'Ferme introuvable' })
  const [farm] = await useDb()
    .select()
    .from(schema.farms)
    .where(and(eq(schema.farms.id, farmId), eq(schema.farms.userId, user.id)))
  if (!farm) throw createError({ statusCode: 404, statusMessage: 'Ferme introuvable' })
  return farm
}

/** Refuse les ids d'objectifs qui n'existent pas dans les données du jeu. */
export function assertKnownObjectives(ids: string[]): void {
  const known = new Set(loadGameData().objectives.map((o) => o.id))
  const unknown = ids.filter((id) => !known.has(id))
  if (unknown.length > 0) throw userError(400, `Objectif inconnu : ${unknown.slice(0, 3).join(', ')}`)
}

export async function farmDTO(farm: FarmRow): Promise<FarmDTO> {
  const db = useDb()
  const [completed, steps, [lastNote]] = await Promise.all([
    db
      .select({ id: schema.farmObjectives.objectiveId })
      .from(schema.farmObjectives)
      .where(eq(schema.farmObjectives.farmId, farm.id)),
    db.select().from(schema.farmSteps).where(eq(schema.farmSteps.farmId, farm.id)),
    db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.farmId, farm.id))
      .orderBy(desc(schema.notes.createdAt))
      .limit(1),
  ])
  return {
    id: farm.id,
    farmerName: farm.farmerName,
    farmName: farm.farmName,
    date: farmDate(farm),
    pinnedObjectiveId: farm.pinnedObjectiveId,
    createdAt: farm.createdAt.toISOString(),
    lastPlayedAt: farm.lastPlayedAt.toISOString(),
    completed: completed.map((c) => c.id),
    steps: steps.map((s) => stepKey(s.objectiveId, s.methodIndex, s.stepIndex)),
    lastNote: lastNote ? toNoteDTO(lastNote) : null,
  }
}

export async function listFarms(userId: string): Promise<FarmSummaryDTO[]> {
  const rows = await useDb()
    .select({
      farm: schema.farms,
      completedCount: sql<number>`(select count(*)::int from ${schema.farmObjectives} where ${schema.farmObjectives.farmId} = ${schema.farms.id})`,
    })
    .from(schema.farms)
    .where(eq(schema.farms.userId, userId))
    .orderBy(desc(schema.farms.lastPlayedAt))
  return rows.map(({ farm, completedCount }) => ({
    id: farm.id,
    farmerName: farm.farmerName,
    farmName: farm.farmName,
    date: farmDate(farm),
    lastPlayedAt: farm.lastPlayedAt.toISOString(),
    completedCount,
  }))
}

/** Marque des objectifs accomplis / non accomplis. */
export async function applyObjectiveChanges(farmId: string, complete: string[], uncomplete: string[]) {
  assertKnownObjectives([...complete, ...uncomplete])
  const db = useDb()
  if (complete.length > 0)
    await db
      .insert(schema.farmObjectives)
      .values([...new Set(complete)].map((objectiveId) => ({ farmId, objectiveId })))
      .onConflictDoNothing()
  if (uncomplete.length > 0)
    await db
      .delete(schema.farmObjectives)
      .where(
        and(eq(schema.farmObjectives.farmId, farmId), inArray(schema.farmObjectives.objectiveId, uncomplete)),
      )
}

export async function touchFarm(farmId: string, date?: GameDate) {
  await useDb()
    .update(schema.farms)
    .set({
      lastPlayedAt: new Date(),
      ...(date ? { gameYear: date.year, gameSeason: date.season, gameDay: date.day } : {}),
    })
    .where(eq(schema.farms.id, farmId))
}
