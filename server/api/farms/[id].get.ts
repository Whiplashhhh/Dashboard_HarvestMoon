export default defineEventHandler(async (event) =>
  farmDTO(await requireFarm(event, getRouterParam(event, 'id'))),
)
