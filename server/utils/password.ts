import { hash, verify } from '@node-rs/argon2'
import { COMMON_PASSWORDS } from './common-passwords'

/**
 * Argon2id, paramètres recommandés par l'OWASP (Password Storage Cheat Sheet) :
 * m = 19 MiB, t = 2, p = 1.
 */
const ARGON2ID = 2 // Algorithm.Argon2id (const enum non importable avec isolatedModules)
const OPTIONS = { algorithm: ARGON2ID, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const

export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 200

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS)
}

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  try {
    return await verify(storedHash, password)
  } catch {
    return false
  }
}

/** Hash factice pour garder un temps de réponse constant quand l'utilisateur n'existe pas. */
let dummyHash: Promise<string> | null = null
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword('mot-de-passe-factice-pour-temps-constant')
  await verifyPassword(await dummyHash, password)
}

/** Politique de mot de passe : renvoie un message d'erreur en français, ou null si le mot de passe est acceptable. */
export function passwordProblem(password: string, username?: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH)
    return `Ton mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`
  if (password.length > PASSWORD_MAX_LENGTH)
    return `Ton mot de passe est trop long (${PASSWORD_MAX_LENGTH} max).`
  const lowered = password.toLowerCase()
  if (COMMON_PASSWORDS.has(lowered)) return 'Ce mot de passe est trop courant : choisis-en un plus original.'
  if (username && lowered.includes(username.toLowerCase()))
    return "Ton mot de passe ne doit pas contenir ton nom d'utilisateur."
  if (/^(.)\1+$/.test(password)) return 'Ce mot de passe est trop simple.'
  return null
}
