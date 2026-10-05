import { eq, inArray } from 'drizzle-orm'

/** Export de toutes les données de l'utilisatrice en JSON (portabilité). */
export default defineEventHandler(async (event) => {
  const { user } = requireUser(event)
  const db = useDb()
  const farms = await db.select().from(schema.farms).where(eq(schema.farms.userId, user.id))
  const ids = farms.map((f) => f.id)
  const [objectives, steps, notes] = ids.length
    ? await Promise.all([
        db.select().from(schema.farmObjectives).where(inArray(schema.farmObjectives.farmId, ids)),
        db.select().from(schema.farmSteps).where(inArray(schema.farmSteps.farmId, ids)),
        db.select().from(schema.notes).where(inArray(schema.notes.farmId, ids)),
      ])
    : [[], [], []]

  const date = new Date().toISOString().slice(0, 10)
  setHeader(event, 'Content-Disposition', `attachment; filename="carnet-de-la-ferme-${date}.json"`)
  return {
    format: 'carnet-de-la-ferme/1',
    exportedAt: new Date().toISOString(),
    account: {
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      settings: user.settings,
    },
    farms: farms.map((farm) => ({
      farmerName: farm.farmerName,
      farmName: farm.farmName,
      date: farmDate(farm),
      pinnedObjectiveId: farm.pinnedObjectiveId,
      createdAt: farm.createdAt.toISOString(),
      lastPlayedAt: farm.lastPlayedAt.toISOString(),
      completedObjectives: objectives
        .filter((o) => o.farmId === farm.id)
        .map((o) => ({ id: o.objectiveId, completedAt: o.completedAt.toISOString() })),
      checkedSteps: steps
        .filter((s) => s.farmId === farm.id)
        .map((s) => ({ objectiveId: s.objectiveId, methodIndex: s.methodIndex, stepIndex: s.stepIndex })),
      notes: notes.filter((n) => n.farmId === farm.id).map(toNoteDTO),
    })),
  }
})
