import { z } from 'zod'

/** Identifiant stable en kebab-case ASCII, ex. « sprite-venus ». */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'identifiant attendu en kebab-case ASCII (a-z, 0-9, -)')

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const
export const seasonSchema = z.enum(SEASONS)
export type Season = z.infer<typeof seasonSchema>

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Printemps',
  summer: 'Été',
  autumn: 'Automne',
  winter: 'Hiver',
}

export const DAYS_PER_SEASON = 30

export const confidenceSchema = z.enum(['high', 'medium', 'low'])
export type Confidence = z.infer<typeof confidenceSchema>

/** Liste d'URL sources, au moins une. */
export const sourcesSchema = z.array(z.url()).min(1)

/** Nom français : uniquement si une source fiable existe, sinon null (jamais inventé). */
export const nameFrSchema = z.string().min(1).nullable()

/** Jour précis du calendrier du jeu (sans année). */
export const seasonDaySchema = z.object({
  season: seasonSchema,
  day: z.int().min(1).max(DAYS_PER_SEASON),
})
export type SeasonDay = z.infer<typeof seasonDaySchema>

/** Date complète dans le jeu. */
export const gameDateSchema = seasonDaySchema.extend({
  year: z.int().min(1).max(999),
})
export type GameDate = z.infer<typeof gameDateSchema>

/** Champs communs à toutes les entrées de données issues de la recherche. */
export const provenanceShape = {
  confidence: confidenceSchema,
  sources: sourcesSchema,
  /** Désaccords entre sources, précisions, mises en garde. */
  notes: z.string().min(1).optional(),
}
