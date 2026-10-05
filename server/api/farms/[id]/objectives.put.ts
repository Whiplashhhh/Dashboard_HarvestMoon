import { objectivesUpdateSchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  const farm = await requireFarm(event, getRouterParam(event, 'id'))
  const input = await readValidated(event, objectivesUpdateSchema)
  await applyObjectiveChanges(farm.id, input.complete, input.uncomplete)
  await touchFarm(farm.id)
  return farmDTO(farm)
})
