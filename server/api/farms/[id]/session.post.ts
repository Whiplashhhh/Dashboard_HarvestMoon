import { sessionUpdateSchema } from '#shared/schemas'

/** « Fin de session » : date du jeu, objectifs/lutins cochés et note, en une seule requête. */
export default defineEventHandler(async (event) => {
  const farm = await requireFarm(event, getRouterParam(event, 'id'))
  const input = await readValidated(event, sessionUpdateSchema)
  await applyObjectiveChanges(farm.id, input.complete, input.uncomplete)
  const date = input.date ?? farmDate(farm)
  if (input.note)
    await useDb().insert(schema.notes).values({
      farmId: farm.id,
      body: input.note,
      gameYear: date.year,
      gameSeason: date.season,
      gameDay: date.day,
    })
  await touchFarm(farm.id, input.date)
  return farmDTO({ ...farm, gameYear: date.year, gameSeason: date.season, gameDay: date.day })
})
