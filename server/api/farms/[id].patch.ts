import { eq } from 'drizzle-orm'
import { updateFarmSchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  const farm = await requireFarm(event, getRouterParam(event, 'id'))
  const input = await readValidated(event, updateFarmSchema)
  if (input.pinnedObjectiveId) assertKnownObjectives([input.pinnedObjectiveId])
  const [updated] = await useDb()
    .update(schema.farms)
    .set({
      ...(input.farmerName !== undefined ? { farmerName: input.farmerName } : {}),
      ...(input.farmName !== undefined ? { farmName: input.farmName } : {}),
      ...(input.pinnedObjectiveId !== undefined ? { pinnedObjectiveId: input.pinnedObjectiveId } : {}),
      ...(input.date
        ? {
            gameYear: input.date.year,
            gameSeason: input.date.season,
            gameDay: input.date.day,
            lastPlayedAt: new Date(),
          }
        : {}),
    })
    .where(eq(schema.farms.id, farm.id))
    .returning()
  return farmDTO(updated!)
})
