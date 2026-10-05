import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, lt, ne } from 'drizzle-orm'
import type { H3Event } from 'h3'
import type { StoredSettings } from '../database/schema'

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
/** On ne prolonge la session en base qu'une fois par heure au plus (expiration glissante). */
const TOUCH_INTERVAL_MS = 60 * 60 * 1000

export interface AuthUser {
  id: string
  username: string
  email: string | null
  settings: StoredSettings
  activeFarmId: string | null
  createdAt: Date
}

export interface AuthContext {
  user: AuthUser
  sessionId: string
}

declare module 'h3' {
  interface H3EventContext {
    auth?: AuthContext | null
  }
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

function setSessionCookie(event: H3Event, token: string) {
  const { sessionCookie, secure } = securityConfig()
  setCookie(event, sessionCookie, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

/** Crée une nouvelle session (nouvel identifiant à chaque connexion : pas de fixation de session). */
export async function createSession(event: H3Event, userId: string): Promise<void> {
  const db = useDb()
  // Rotation : l'éventuelle session précédente de ce navigateur est invalidée.
  const previous = getCookie(event, securityConfig().sessionCookie)
  if (previous) await db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(previous)))

  const token = randomBytes(32).toString('base64url')
  await db.insert(schema.sessions).values({
    id: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    userAgent: getHeader(event, 'user-agent')?.slice(0, 255) ?? null,
  })
  setSessionCookie(event, token)
}

/** Lit la session du cookie, la prolonge (glissement) et renvoie l'utilisatrice, ou null. */
export async function loadSession(event: H3Event): Promise<AuthContext | null> {
  const token = getCookie(event, securityConfig().sessionCookie)
  if (!token || token.length > 100) return null
  const db = useDb()
  const id = hashToken(token)
  const [row] = await db
    .select({ session: schema.sessions, user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, new Date())))
    .limit(1)
  if (!row) {
    deleteCookie(event, securityConfig().sessionCookie, { path: '/' })
    return null
  }

  if (Date.now() - row.session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db
      .update(schema.sessions)
      .set({ lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
      .where(eq(schema.sessions.id, id))
    setSessionCookie(event, token)
  }

  const { user } = row
  return {
    sessionId: id,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      settings: user.settings,
      activeFarmId: user.activeFarmId,
      createdAt: user.createdAt,
    },
  }
}

/** Déconnexion : la session est supprimée en base, le cookie effacé. */
export async function destroySession(event: H3Event): Promise<void> {
  const auth = event.context.auth
  if (auth) await useDb().delete(schema.sessions).where(eq(schema.sessions.id, auth.sessionId))
  deleteCookie(event, securityConfig().sessionCookie, { path: '/', secure: securityConfig().secure })
  event.context.auth = null
}

/** Invalide toutes les autres sessions d'une utilisatrice (après un changement de mot de passe). */
export async function destroyOtherSessions(userId: string, keepSessionId: string): Promise<void> {
  await useDb()
    .delete(schema.sessions)
    .where(and(eq(schema.sessions.userId, userId), ne(schema.sessions.id, keepSessionId)))
}

export async function purgeExpiredSessions(): Promise<void> {
  await useDb().delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()))
}

/** Exige une utilisatrice connectée (401 sinon). */
export function requireUser(event: H3Event): AuthContext {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'Connexion requise.' })
  return auth
}
