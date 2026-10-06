import { noteSchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  const farm = await requireFarm(event, getRouterParam(event, 'id'))
  const input = await readValidated(event, noteSchema)
  await assertNoteQuota(farm.id)
  const date = input.date ?? farmDate(farm)
  const [note] = await useDb()
    .insert(schema.notes)
    .values({
      farmId: farm.id,
      body: input.body,
      gameYear: date.year,
      gameSeason: date.season,
      gameDay: date.day,
    })
    .returning()
  // Proposer de mettre à jour la date du jeu en même temps que la note.
  await touchFarm(farm.id, input.date)
  setResponseStatus(event, 201)
  return toNoteDTO(note!)
})
