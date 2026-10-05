import { count, eq } from 'drizzle-orm'
import { createFarmSchema } from '#shared/schemas'

const MAX_FARMS = 10

export default defineEventHandler(async (event) => {
  const { user } = requireUser(event)
  const input = await readValidated(event, createFarmSchema)
  assertKnownObjectives(input.completed)
  const db = useDb()
  const [{ total } = { total: 0 }] = await db
    .select({ total: count() })
    .from(schema.farms)
    .where(eq(schema.farms.userId, user.id))
  if (total >= MAX_FARMS) throw userError(400, `Tu ne peux pas avoir plus de ${MAX_FARMS} fermes.`)

  const [farm] = await db
    .insert(schema.farms)
    .values({
      userId: user.id,
      farmerName: input.farmerName,
      farmName: input.farmName,
      gameYear: input.date.year,
      gameSeason: input.date.season,
      gameDay: input.date.day,
    })
    .returning()
  await applyObjectiveChanges(farm!.id, input.completed, [])
  await db.update(schema.users).set({ activeFarmId: farm!.id }).where(eq(schema.users.id, user.id))
  setResponseStatus(event, 201)
  return farmDTO(farm!)
})
