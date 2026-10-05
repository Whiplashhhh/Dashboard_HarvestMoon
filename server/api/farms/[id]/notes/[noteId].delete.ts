import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const farm = await requireFarm(event, getRouterParam(event, 'id'))
  const noteId = getRouterParam(event, 'noteId') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(noteId))
    throw createError({ statusCode: 404, statusMessage: 'Note introuvable' })
  const deleted = await useDb()
    .delete(schema.notes)
    .where(and(eq(schema.notes.id, noteId), eq(schema.notes.farmId, farm.id)))
    .returning({ id: schema.notes.id })
  if (deleted.length === 0) throw createError({ statusCode: 404, statusMessage: 'Note introuvable' })
  return { ok: true }
})
