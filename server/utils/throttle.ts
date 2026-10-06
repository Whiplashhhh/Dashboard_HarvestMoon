import { eq, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'

/**
 * Limitation de débit des tentatives d'authentification, stockée en base (survit aux redémarrages).
 * Au-delà de `free` échecs dans la fenêtre, un délai progressif s'applique : 2 s, 4 s, 8 s… plafonné à `maxDelayMs`.
 * Mode `hardLimit` (inscriptions) : au-delà de `free` tentatives, blocage jusqu'à la fin de la fenêtre.
 */
export interface ThrottlePolicy {
  free: number
  windowMs: number
  maxDelayMs: number
  hardLimit?: boolean
}

const HOUR = 60 * 60 * 1000

export function throttlePolicies() {
  const config = useRuntimeConfig()
  return {
    loginUser: { free: 5, windowMs: HOUR, maxDelayMs: 15 * 60 * 1000 },
    loginIp: { free: Number(config.authIpFreeAttempts) || 20, windowMs: HOUR, maxDelayMs: 15 * 60 * 1000 },
    registerIp: {
      free: Number(config.authRegistrationsPerHour) || 5,
      windowMs: HOUR,
      maxDelayMs: HOUR,
      hardLimit: true,
    },
  } satisfies Record<string, ThrottlePolicy>
}

export function clientIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: securityConfig().trustProxy }) ?? 'inconnue'
}

/** Secondes à attendre avant une nouvelle tentative (0 si autorisée). */
export async function throttleWait(key: string): Promise<number> {
  const [row] = await useDb()
    .select({ lockedUntil: schema.authThrottle.lockedUntil })
    .from(schema.authThrottle)
    .where(eq(schema.authThrottle.key, key))
  if (!row?.lockedUntil) return 0
  return Math.max(0, Math.ceil((row.lockedUntil.getTime() - Date.now()) / 1000))
}

export function lockDelayMs(attempts: number, policy: ThrottlePolicy, windowStart: Date): number {
  if (attempts <= policy.free) return 0
  if (policy.hardLimit) return Math.max(0, windowStart.getTime() + policy.windowMs - Date.now())
  return Math.min(policy.maxDelayMs, 1000 * 2 ** (attempts - policy.free))
}

/** Enregistre une tentative (échec de connexion, ou inscription) et calcule le blocage éventuel. */
export async function recordAttempt(key: string, policy: ThrottlePolicy): Promise<void> {
  const db = useDb()
  const windowStartLimit = sql`${new Date(Date.now() - policy.windowMs).toISOString()}::timestamptz`
  const [row] = await db
    .insert(schema.authThrottle)
    .values({ key, attempts: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: schema.authThrottle.key,
      set: {
        attempts: sql`case when ${schema.authThrottle.windowStart} < ${windowStartLimit} then 1 else ${schema.authThrottle.attempts} + 1 end`,
        windowStart: sql`case when ${schema.authThrottle.windowStart} < ${windowStartLimit} then now() else ${schema.authThrottle.windowStart} end`,
      },
    })
    .returning()
  if (!row) return
  const delay = lockDelayMs(row.attempts, policy, row.windowStart)
  if (delay > 0)
    await db
      .update(schema.authThrottle)
      .set({ lockedUntil: new Date(Date.now() + delay) })
      .where(eq(schema.authThrottle.key, key))
}

/** Retire une tentative réussie du compteur (sans lever un éventuel blocage en cours). */
export async function forgiveAttempt(key: string): Promise<void> {
  await useDb()
    .update(schema.authThrottle)
    .set({ attempts: sql`greatest(${schema.authThrottle.attempts} - 1, 0)` })
    .where(eq(schema.authThrottle.key, key))
}

export async function clearThrottle(key: string): Promise<void> {
  await useDb().delete(schema.authThrottle).where(eq(schema.authThrottle.key, key))
}

/** Lève une 429 (message générique + Retry-After) si l'une des clés est bloquée. */
export async function assertNotThrottled(event: H3Event, keys: string[]): Promise<void> {
  const waits = await Promise.all(keys.map(throttleWait))
  const wait = Math.max(0, ...waits)
  if (wait > 0) {
    setHeader(event, 'Retry-After', wait)
    throw createError({
      statusCode: 429,
      statusMessage: 'Trop de tentatives',
      data: { message: `Trop de tentatives. Réessaie dans ${formatWait(wait)}.`, retryAfter: wait },
    })
  }
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} seconde${seconds > 1 ? 's' : ''}`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes > 1 ? 's' : ''}`
}
