import { z } from 'zod'
import { nameFrSchema, provenanceShape, seasonDaySchema, seasonSchema, slugSchema } from './common'

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const
export const weekdaySchema = z.enum(WEEKDAYS)
export type Weekday = z.infer<typeof weekdaySchema>

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
}

/** Personnage du village. */
export const characterSchema = z.object({
  id: slugSchema,
  name: z.string().min(1),
  nameFr: nameFrSchema,
  /** Rôle en français : « Forgeron », « Prétendante »… */
  role: z.string().min(2),
  location: z.string().min(2).optional(),
  birthday: seasonDaySchema.nullable(),
  bachelorette: z.boolean(),
  /** Totalement absent de la version européenne (connexion GBA avec Friends of Mineral Town retirée). */
  euUnavailable: z.boolean().optional(),
  /** Présent en version EU mais pas épousable (le mariage dépendait de la connexion GBA). */
  marriageUnavailableEu: z.boolean().optional(),
  lovedGifts: z.array(z.string().min(2)).optional(),
  likedGifts: z.array(z.string().min(2)).optional(),
  dislikedGifts: z.array(z.string().min(2)).optional(),
  /** Une ou deux phrases utiles en français. */
  description: z.string().min(5).optional(),
  ...provenanceShape,
})
export type Character = z.infer<typeof characterSchema>
export const characterListSchema = z.array(characterSchema)

/** Festival annuel. */
export const festivalSchema = z.object({
  id: slugSchema,
  name: z.string().min(2),
  nameFr: nameFrSchema,
  season: seasonSchema,
  day: z.int().min(1).max(30),
  location: z.string().min(2).optional(),
  time: z.string().min(2).optional(),
  /** Ce qui se passe, en français. */
  description: z.string().min(5),
  /** Comment participer activement / préparer le festival. */
  participation: z.string().min(5).optional(),
  /** Objectif associé (s'il existe). */
  objectiveId: slugSchema.optional(),
  euUnavailable: z.boolean().optional(),
  ...provenanceShape,
})
export type Festival = z.infer<typeof festivalSchema>
export const festivalListSchema = z.array(festivalSchema)

/** Horaires d'un commerce ou d'un lieu. */
export const scheduleSchema = z.object({
  id: slugSchema,
  place: z.string().min(2),
  hours: z.string().min(2),
  closedOn: z.array(weekdaySchema).optional(),
  /** Précisions en français (jours fériés, festivals, météo…). */
  details: z.string().min(2).optional(),
  ...provenanceShape,
})
export type Schedule = z.infer<typeof scheduleSchema>

/** Règles du calendrier du jeu. */
export const calendarSchema = z.object({
  daysPerSeason: z.literal(30),
  /** Jour de la semaine du 1er printemps de l'année 1. */
  firstWeekday: weekdaySchema,
  schedules: z.array(scheduleSchema),
  ...provenanceShape,
})
export type Calendar = z.infer<typeof calendarSchema>

/** Bâtiment, agrandissement ou extension de maison. */
export const buildingSchema = z.object({
  id: slugSchema,
  name: z.string().min(2),
  nameFr: nameFrSchema,
  kind: z.enum(['batiment', 'agrandissement', 'maison', 'autre']),
  costGold: z.int().min(0).optional(),
  lumber: z.int().min(0).optional(),
  material: z.int().min(0).optional(),
  /** Autres matériaux / remarques de coût, en français. */
  otherCost: z.string().min(2).optional(),
  buildDays: z.int().min(0).optional(),
  description: z.string().min(5),
  objectiveId: slugSchema.optional(),
  ...provenanceShape,
})
export type Building = z.infer<typeof buildingSchema>
export const buildingListSchema = z.array(buildingSchema)

export const toolLevelSchema = z.object({
  /** 0 = outil de base. */
  level: z.int().min(0).max(10),
  name: z.string().min(2),
  /** Matériau requis pour l'amélioration (anglais si pas de nom fr fiable). */
  material: z.string().min(2).optional(),
  costGold: z.int().min(0).optional(),
  effect: z.string().min(2).optional(),
  objectiveId: slugSchema.optional(),
})

export const toolSchema = z.object({
  id: slugSchema,
  name: z.string().min(2),
  nameFr: nameFrSchema,
  /** Comment l'obtenir, en français. */
  obtain: z.string().min(5),
  upgradable: z.boolean(),
  levels: z.array(toolLevelSchema),
  ...provenanceShape,
})
export type Tool = z.infer<typeof toolSchema>
export const toolListSchema = z.array(toolSchema)

export const recipeSchema = z.object({
  id: slugSchema,
  name: z.string().min(2),
  nameFr: nameFrSchema,
  ingredients: z.array(z.string().min(2)).min(1),
  utensils: z.array(z.string().min(2)),
  /** Comment apprendre la recette (en français), si connu. */
  howToLearn: z.string().min(3).optional(),
  /** Stamina / fatigue récupérées, ou effet, si connu. */
  effect: z.string().min(2).optional(),
  sellPrice: z.int().min(0).optional(),
  ...provenanceShape,
})
export type Recipe = z.infer<typeof recipeSchema>
export const recipeListSchema = z.array(recipeSchema)

/** Niveau ou palier d'une mine. */
export const mineSchema = z.object({
  id: slugSchema,
  name: z.string().min(2),
  nameFr: nameFrSchema,
  /** Comment y accéder, en français. */
  access: z.string().min(5),
  floors: z.string().min(1).optional(),
  /** Ressources notables (anglais si pas de nom fr fiable). */
  items: z.array(z.string().min(2)),
  description: z.string().min(5),
  ...provenanceShape,
})
export type Mine = z.infer<typeof mineSchema>
export const mineListSchema = z.array(mineSchema)
