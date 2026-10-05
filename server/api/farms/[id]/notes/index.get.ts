import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const farm = await requireFarm(event, getRouterParam(event, 'id'))
  const rows = await useDb()
    .select()
    .from(schema.notes)
    .where(eq(schema.notes.farmId, farm.id))
    .orderBy(desc(schema.notes.createdAt))
    .limit(500)
  return rows.map(toNoteDTO)
})
