import { and, eq } from 'drizzle-orm'
import { stepUpdateSchema } from '#shared/schemas'
import { loadGameData } from '#shared/data/sources'

export default defineEventHandler(async (event) => {
  const farm = await requireFarm(event, getRouterParam(event, 'id'))
  const input = await readValidated(event, stepUpdateSchema)
  const objective = loadGameData().objectives.find((o) => o.id === input.objectiveId)
  if (!objective?.methods[input.methodIndex]?.steps[input.stepIndex]) throw userError(400, 'Étape inconnue.')

  const db = useDb()
  const key = {
    farmId: farm.id,
    objectiveId: input.objectiveId,
    methodIndex: input.methodIndex,
    stepIndex: input.stepIndex,
  }
  if (input.checked) await db.insert(schema.farmSteps).values(key).onConflictDoNothing()
  else
    await db
      .delete(schema.farmSteps)
      .where(
        and(
          eq(schema.farmSteps.farmId, key.farmId),
          eq(schema.farmSteps.objectiveId, key.objectiveId),
          eq(schema.farmSteps.methodIndex, key.methodIndex),
          eq(schema.farmSteps.stepIndex, key.stepIndex),
        ),
      )
  await touchFarm(farm.id)
  return { ok: true }
})
