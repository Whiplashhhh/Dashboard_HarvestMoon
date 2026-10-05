/** Schémas Zod des entrées de l'API (partagés client/serveur pour des messages d'erreur identiques). */
import { z } from 'zod'
import { gameDateSchema, slugSchema } from './common'

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Ton nom d'utilisateur doit faire au moins 3 caractères.")
  .max(32, "Ton nom d'utilisateur doit faire au plus 32 caractères.")
  .regex(/^[\p{L}\p{N}_.-]+$/u, 'Utilise seulement des lettres, chiffres, points, tirets ou soulignés.')

export const passwordInputSchema = z.string().min(1, 'Mot de passe requis.').max(200)

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordInputSchema,
  email: z
    .union([z.literal(''), z.email('Adresse e-mail invalide.').max(254)])
    .optional()
    .transform((value) => value || null),
})

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Nom d'utilisateur requis.").max(64),
  password: passwordInputSchema,
})

export const changePasswordSchema = z.object({
  currentPassword: passwordInputSchema,
  newPassword: passwordInputSchema,
})

export const deleteAccountSchema = z.object({ password: passwordInputSchema })

export const settingsSchema = z.object({
  sounds: z.boolean(),
  reducedMotion: z.boolean(),
  forcedSeason: z.enum(['spring', 'summer', 'autumn', 'winter']).nullable(),
})

const nameField = (label: string) =>
  z.string().trim().min(1, `${label} est requis.`).max(40, `${label} doit faire au plus 40 caractères.`)

export const createFarmSchema = z.object({
  farmerName: nameField('Le nom du fermier'),
  farmName: nameField('Le nom de la ferme'),
  date: gameDateSchema,
  /** Objectifs déjà accomplis (onboarding « Qu'as-tu déjà fait ? »). */
  completed: z.array(slugSchema).max(500).default([]),
})

export const updateFarmSchema = z.object({
  farmerName: nameField('Le nom du fermier').optional(),
  farmName: nameField('Le nom de la ferme').optional(),
  date: gameDateSchema.optional(),
  pinnedObjectiveId: slugSchema.nullable().optional(),
})

export const objectivesUpdateSchema = z.object({
  complete: z.array(slugSchema).max(500).default([]),
  uncomplete: z.array(slugSchema).max(500).default([]),
})

export const stepUpdateSchema = z.object({
  objectiveId: slugSchema,
  methodIndex: z.int().min(0).max(20),
  stepIndex: z.int().min(0).max(100),
  checked: z.boolean(),
})

export const noteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Ta note est vide.')
    .max(4000, 'Ta note est trop longue (4 000 caractères max).'),
  /** Date du jeu au moment de la note (par défaut : date de la ferme). */
  date: gameDateSchema.optional(),
})

/** « Fin de session » : tout mettre à jour d'un coup. */
export const sessionUpdateSchema = z.object({
  date: gameDateSchema.optional(),
  complete: z.array(slugSchema).max(500).default([]),
  uncomplete: z.array(slugSchema).max(500).default([]),
  note: z.string().trim().max(4000).optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type CreateFarmInput = z.input<typeof createFarmSchema>
export type SessionUpdateInput = z.input<typeof sessionUpdateSchema>
