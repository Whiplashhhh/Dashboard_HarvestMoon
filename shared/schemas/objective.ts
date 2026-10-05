import { z } from 'zod'
import { provenanceShape, seasonDaySchema, seasonSchema, slugSchema } from './common'

export const OBJECTIVE_CATEGORIES = [
  'lutins',
  'deesse',
  'mariage',
  'ferme',
  'batiments',
  'outils',
  'animaux',
  'cultures',
  'mine',
  'festivals',
  'recettes',
  'amitie',
  'argent',
] as const
export const objectiveCategorySchema = z.enum(OBJECTIVE_CATEGORIES)
export type ObjectiveCategory = z.infer<typeof objectiveCategorySchema>

export const CATEGORY_LABELS: Record<ObjectiveCategory, string> = {
  lutins: 'Lutins',
  deesse: 'Déesse',
  mariage: 'Mariage',
  ferme: 'Ferme',
  batiments: 'Bâtiments',
  outils: 'Outils',
  animaux: 'Animaux',
  cultures: 'Cultures',
  mine: 'Mine',
  festivals: 'Festivals',
  recettes: 'Recettes',
  amitie: 'Amitié',
  argent: 'Argent',
}

/**
 * Prérequis d'un objectif.
 * - objective / sprite / spriteCount / year : vérifiés automatiquement par le moteur ;
 * - manual : condition non vérifiable automatiquement (affichée, mais ne bloque pas).
 */
export const prerequisiteSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('objective'), id: slugSchema }),
  z.object({ type: z.literal('sprite'), id: slugSchema }),
  z.object({ type: z.literal('spriteCount'), min: z.int().min(1).max(101) }),
  z.object({ type: z.literal('year'), min: z.int().min(2).max(99) }),
  z.object({ type: z.literal('manual'), label: z.string().min(3) }),
])
export type Prerequisite = z.infer<typeof prerequisiteSchema>

export const methodSchema = z.object({
  title: z.string().min(3),
  steps: z.array(z.string().min(3)).min(1),
  tips: z.array(z.string().min(3)).optional(),
  constraints: z.array(z.string().min(2)).optional(),
  cost: z.string().min(1).optional(),
})
export type Method = z.infer<typeof methodSchema>

export const difficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
export const durationSchema = z.enum(['une session', 'quelques jours de jeu', 'une saison', 'long terme'])
export type EstimatedDuration = z.infer<typeof durationSchema>

export const objectiveSchema = z.object({
  id: slugSchema,
  category: objectiveCategorySchema,
  title: z.string().min(5),
  summary: z.string().min(10),
  prerequisites: z.array(prerequisiteSchema),
  methods: z.array(methodSchema).min(1),
  rewards: z.array(z.string().min(2)).optional(),
  availableSeasons: z.array(seasonSchema).min(1).max(3).optional(),
  /** Jours précis où l'objectif est réalisable (festival, événement daté…). */
  dates: z.array(seasonDaySchema).min(1).optional(),
  difficulty: difficultySchema,
  estimatedDuration: durationSchema,
  relatedSpriteIds: z.array(slugSchema).optional(),
  /** Objectif « jalon » mis en avant (ex. restaurer la Déesse). */
  milestone: z.boolean().optional(),
  /** Case à cocher proposée pendant l'onboarding « Qu'as-tu déjà fait ? ». */
  onboarding: z.boolean().optional(),
  ...provenanceShape,
})
export type Objective = z.infer<typeof objectiveSchema>

export const objectiveListSchema = z.array(objectiveSchema)
