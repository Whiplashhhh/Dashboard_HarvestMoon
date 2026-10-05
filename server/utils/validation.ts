import type { H3Event } from 'h3'
import type { z } from 'zod'

/** Lit et valide le corps JSON avec Zod ; 400 avec un message en français sinon. */
export async function readValidated<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.infer<T>> {
  const result = await readValidatedBody(event, (body) => schema.safeParse(body))
  if (!result.success) {
    const issue = result.error.issues[0]
    throw createError({
      statusCode: 400,
      statusMessage: 'Données invalides',
      data: { message: issue?.message ?? 'Données invalides.', path: issue?.path.join('.') },
    })
  }
  return result.data
}

export function validateParam<T extends z.ZodType>(value: unknown, schema: T): z.infer<T> {
  const result = schema.safeParse(value)
  if (!result.success) throw createError({ statusCode: 404, statusMessage: 'Introuvable' })
  return result.data
}

/** Erreur 4xx avec un message affichable dans l'interface. */
export function userError(statusCode: number, message: string) {
  return createError({ statusCode, statusMessage: message, data: { message } })
}
