import { eq } from 'drizzle-orm'
import { deleteAccountSchema } from '#shared/schemas'

/** Suppression définitive du compte (confirmée par le mot de passe). Les fermes, notes et sessions suivent (cascade). */
export default defineEventHandler(async (event) => {
  const auth = requireUser(event)
  const userKey = `login-user:${auth.user.username.toLowerCase()}`
  await assertNotThrottled(event, [userKey])
  const { password } = await readValidated(event, deleteAccountSchema)
  await recordAttempt(userKey, throttlePolicies().loginUser)
  const db = useDb()
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, auth.user.id))
  if (!user || !(await verifyPassword(user.passwordHash, password)))
    throw userError(400, 'Mot de passe incorrect.')
  await db.delete(schema.users).where(eq(schema.users.id, user.id))
  await clearThrottle(userKey)
  deleteCookie(event, securityConfig().sessionCookie, { path: '/', secure: securityConfig().secure })
  event.context.auth = null
  return { ok: true }
})
