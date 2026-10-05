import type { MeDTO } from '#shared/types/api'

export default defineEventHandler((event): MeDTO | null => {
  const auth = event.context.auth
  if (!auth) return null
  const { user } = auth
  return { ...user, createdAt: user.createdAt.toISOString() }
})
