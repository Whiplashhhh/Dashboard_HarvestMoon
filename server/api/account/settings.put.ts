import { eq } from 'drizzle-orm'
import { settingsSchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  const { user } = requireUser(event)
  const settings = await readValidated(event, settingsSchema)
  await useDb().update(schema.users).set({ settings }).where(eq(schema.users.id, user.id))
  return settings
})
