import type { GameDate } from '../schemas'

export interface UserSettingsDTO {
  sounds: boolean
  reducedMotion: boolean
  forcedSeason: GameDate['season'] | null
}

export interface MeDTO {
  id: string
  username: string
  email: string | null
  settings: UserSettingsDTO
  activeFarmId: string | null
  createdAt: string
}

export interface NoteDTO {
  id: string
  body: string
  date: GameDate
  createdAt: string
}

export interface FarmSummaryDTO {
  id: string
  farmerName: string
  farmName: string
  date: GameDate
  lastPlayedAt: string
  completedCount: number
}

export interface FarmDTO {
  id: string
  farmerName: string
  farmName: string
  date: GameDate
  pinnedObjectiveId: string | null
  createdAt: string
  lastPlayedAt: string
  /** Objectifs accomplis (lutins compris : « sprite-<id> »). */
  completed: string[]
  /** Étapes cochées, au format « objectifId:méthode:étape ». */
  steps: string[]
  lastNote: NoteDTO | null
}

export const stepKey = (objectiveId: string, methodIndex: number, stepIndex: number) =>
  `${objectiveId}:${methodIndex}:${stepIndex}`
