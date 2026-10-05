import { z } from 'zod'
import { difficultySchema, durationSchema, methodSchema, prerequisiteSchema } from './objective'
import { nameFrSchema, provenanceShape, seasonDaySchema, seasonSchema, slugSchema } from './common'

export const TEAM_COLORS = [
  'brown',
  'black',
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'purple',
  'indigo',
  'white',
  'pink',
  'aqua',
] as const

export const teamSchema = z.object({
  id: slugSchema,
  name: z.string().min(2),
  nameFr: nameFrSchema,
  /** Couleur de l'équipe dans le jeu (la teinte affichée est définie par les design tokens). */
  color: z.enum(TEAM_COLORS),
  /** Libellé français de la couleur, ex. « Marron ». */
  colorLabel: z.string().min(2),
  leaderSpriteId: slugSchema,
  /** Une phrase en français : thème / rôle de l'équipe. */
  description: z.string().min(5),
  ...provenanceShape,
})
export type Team = z.infer<typeof teamSchema>
export const teamListSchema = z.array(teamSchema).length(10)

export const spriteSchema = z.object({
  /** Slug du nom anglais, ex. « venus ». L'objectif associé a l'id « sprite-<id> ». */
  id: slugSchema,
  name: z.string().min(1),
  nameFr: nameFrSchema,
  teamId: slugSchema,
  isLeader: z.boolean(),
  /** Disponible dès le début du jeu (aucune action requise). */
  fromStart: z.boolean(),
  /** Condition de déblocage, en français, en une phrase. */
  unlock: z.string().min(5),
  methods: z.array(methodSchema).min(1),
  prerequisites: z.array(prerequisiteSchema),
  availableSeasons: z.array(seasonSchema).min(1).max(3).optional(),
  dates: z.array(seasonDaySchema).min(1).optional(),
  difficulty: difficultySchema,
  estimatedDuration: durationSchema,
  /** Non disponible en version européenne (ex. dépend de la connexion GBA). */
  euUnavailable: z.boolean().optional(),
  ...provenanceShape,
})
export type Sprite = z.infer<typeof spriteSchema>
export const spriteListSchema = z.array(spriteSchema)
