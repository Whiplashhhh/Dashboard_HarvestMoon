import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const farm = await requireFarm(event, getRouterParam(event, 'id'))
  await useDb().delete(schema.farms).where(eq(schema.farms.id, farm.id))
  return { ok: true }
})
