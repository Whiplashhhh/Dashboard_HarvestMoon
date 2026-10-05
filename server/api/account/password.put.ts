import { eq } from 'drizzle-orm'
import { changePasswordSchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  const auth = requireUser(event)
  const userKey = `login-user:${auth.user.username.toLowerCase()}`
  await assertNotThrottled(event, [userKey])
  const input = await readValidated(event, changePasswordSchema)
  const db = useDb()
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, auth.user.id))
  if (!user || !(await verifyPassword(user.passwordHash, input.currentPassword))) {
    await recordAttempt(userKey, throttlePolicies().loginUser)
    throw userError(400, 'Mot de passe actuel incorrect.')
  }
  const problem = passwordProblem(input.newPassword, user.username)
  if (problem) throw userError(400, problem)

  await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(input.newPassword), passwordChangedAt: new Date() })
    .where(eq(schema.users.id, user.id))
  // Les autres appareils sont déconnectés ; celui-ci reçoit une nouvelle session.
  await destroyOtherSessions(user.id, auth.sessionId)
  await createSession(event, user.id)
  return { ok: true }
})
