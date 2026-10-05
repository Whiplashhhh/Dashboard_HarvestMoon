import { eq } from 'drizzle-orm'
import { loginSchema } from '#shared/schemas'

const GENERIC = "Nom d'utilisateur ou mot de passe incorrect."

export default defineEventHandler(async (event) => {
  const input = await readValidated(event, loginSchema)
  const policies = throttlePolicies()
  const ipKey = `login-ip:${clientIp(event)}`
  const userKey = `login-user:${input.username.toLowerCase()}`
  await assertNotThrottled(event, [ipKey, userKey])

  const [user] = await useDb()
    .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.usernameKey, input.username.toLowerCase()))

  const valid = user
    ? await verifyPassword(user.passwordHash, input.password)
    : (await burnPasswordCheck(input.password), false)
  if (!user || !valid) {
    await Promise.all([recordAttempt(ipKey, policies.loginIp), recordAttempt(userKey, policies.loginUser)])
    throw userError(401, GENERIC)
  }

  await clearThrottle(userKey)
  await createSession(event, user.id)
  return { ok: true }
})
