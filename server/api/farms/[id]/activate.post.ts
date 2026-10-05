import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const farm = await requireFarm(event, getRouterParam(event, 'id'))
  await useDb().update(schema.users).set({ activeFarmId: farm.id }).where(eq(schema.users.id, farm.userId))
  return { ok: true }
})
