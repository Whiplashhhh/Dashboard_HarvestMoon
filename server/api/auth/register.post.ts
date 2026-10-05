import { eq } from 'drizzle-orm'
import { registerSchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  const ipKey = `register-ip:${clientIp(event)}`
  await assertNotThrottled(event, [ipKey])
  const input = await readValidated(event, registerSchema)
  await recordAttempt(ipKey, throttlePolicies().registerIp)

  const problem = passwordProblem(input.password, input.username)
  if (problem) throw userError(400, problem)

  const db = useDb()
  const usernameKey = input.username.toLowerCase()
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.usernameKey, usernameKey))
  if (existing) throw userError(409, "Ce nom d'utilisateur n'est pas disponible.")

  const [user] = await db
    .insert(schema.users)
    .values({
      username: input.username,
      usernameKey,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    })
    .onConflictDoNothing()
    .returning({ id: schema.users.id })
  if (!user) throw userError(409, "Ce nom d'utilisateur n'est pas disponible.")

  await createSession(event, user.id)
  setResponseStatus(event, 201)
  return { ok: true }
})
