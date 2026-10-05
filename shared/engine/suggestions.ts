/**
 * Moteur « Que faire maintenant ? »
 * Entrée : données du jeu + état de la partie. Sortie : statut de chaque objectif, ce qui manque,
 * et une liste de suggestions triées par pertinence, chacune avec des raisons lisibles.
 * Logique pure, sans dépendance à Nuxt.
 */
import {
  GODDESS_SPRITES,
  isSpriteObjectiveId,
  prerequisiteObjectiveId,
  spriteObjectiveId,
  TOTAL_SPRITES,
  type GameData,
} from '../data/game'
import { SEASON_LABELS, type GameDate, type Objective, type Prerequisite } from '../schemas'
import { daysLeftInSeason, daysUntil, formatIn } from './calendar'

export interface PlayerState {
  date: GameDate
  /** Ids des objectifs accomplis (un lutin trouvé = « sprite-<id> »). */
  completed: ReadonlySet<string>
  /** Objectifs dont au moins une étape a été cochée. */
  started?: ReadonlySet<string>
  pinnedId?: string | null
}

export type ObjectiveStatus = 'completed' | 'available' | 'out-of-season' | 'locked'

export interface MissingRequirement {
  prerequisite: Prerequisite
  /** Libellé lisible : « Restaurer la Déesse », « Encore 12 lutins à trouver », « À partir de l'an 2 ». */
  label: string
  /** Objectif à accomplir pour lever ce manque (lien), si applicable. */
  objectiveId?: string
}

export interface Evaluation {
  objective: Objective
  status: ObjectiveStatus
  missing: MissingRequirement[]
  /** Conditions non vérifiables automatiquement : affichées, non bloquantes. */
  manual: string[]
  /** Pour un objectif daté : jours avant la prochaine date possible. */
  nextDateInDays?: number
}

export interface Reason {
  code:
    | 'pinned'
    | 'started'
    | 'today'
    | 'soon'
    | 'season-only'
    | 'season-ending'
    | 'unlocks'
    | 'goddess'
    | 'all-sprites'
    | 'quick'
    | 'milestone'
  text: string
  weight: number
}

export interface Suggestion {
  objective: Objective
  score: number
  reasons: Reason[]
}

export function countFoundSprites(game: GameData, completed: ReadonlySet<string>): number {
  let count = 0
  for (const sprite of game.sprites) if (completed.has(spriteObjectiveId(sprite.id))) count++
  return count
}

/** Index des objectifs et des dépendances inverses (qui requiert quoi). */
export class ObjectiveIndex {
  readonly byId = new Map<string, Objective>()
  readonly dependents = new Map<string, string[]>()

  constructor(readonly game: GameData) {
    for (const objective of game.objectives) this.byId.set(objective.id, objective)
    for (const objective of game.objectives) {
      for (const prerequisite of objective.prerequisites) {
        const target = prerequisiteObjectiveId(prerequisite)
        if (!target) continue
        const list = this.dependents.get(target) ?? []
        list.push(objective.id)
        this.dependents.set(target, list)
      }
    }
  }

  /** Objectifs qui requièrent directement celui-ci. */
  unlocks(objectiveId: string): Objective[] {
    return (this.dependents.get(objectiveId) ?? []).map((id) => this.byId.get(id)!).filter(Boolean)
  }

  /** Nombre d'objectifs débloqués, directement ou indirectement. */
  transitiveUnlockCount(objectiveId: string): number {
    const seen = new Set<string>()
    const stack = [...(this.dependents.get(objectiveId) ?? [])]
    while (stack.length > 0) {
      const id = stack.pop()!
      if (seen.has(id)) continue
      seen.add(id)
      stack.push(...(this.dependents.get(id) ?? []))
    }
    return seen.size
  }
}

function missingFor(
  index: ObjectiveIndex,
  state: PlayerState,
  prerequisite: Prerequisite,
  spritesFound: number,
): MissingRequirement | null {
  switch (prerequisite.type) {
    case 'objective':
    case 'sprite': {
      const id = prerequisiteObjectiveId(prerequisite)!
      if (state.completed.has(id)) return null
      return { prerequisite, label: index.byId.get(id)?.title ?? id, objectiveId: id }
    }
    case 'spriteCount': {
      const left = prerequisite.min - spritesFound
      if (left <= 0) return null
      return {
        prerequisite,
        label: `Encore ${left} lutin${left > 1 ? 's' : ''} à trouver (${prerequisite.min} requis)`,
      }
    }
    case 'year':
      if (state.date.year >= prerequisite.min) return null
      return { prerequisite, label: `À partir de l'an ${prerequisite.min}` }
    case 'manual':
      return null
  }
}

export function evaluateObjective(
  index: ObjectiveIndex,
  state: PlayerState,
  objective: Objective,
  spritesFound = countFoundSprites(index.game, state.completed),
): Evaluation {
  const manual = objective.prerequisites.flatMap((p) => (p.type === 'manual' ? [p.label] : []))
  if (state.completed.has(objective.id)) return { objective, status: 'completed', missing: [], manual }

  const missing = objective.prerequisites
    .map((p) => missingFor(index, state, p, spritesFound))
    .filter((m): m is MissingRequirement => m !== null)

  let nextDateInDays: number | undefined
  let inSeason = !objective.availableSeasons || objective.availableSeasons.includes(state.date.season)
  if (objective.dates) {
    nextDateInDays = Math.min(...objective.dates.map((d) => daysUntil(state.date, d)))
    // Un objectif daté n'est « disponible » que si sa prochaine date tombe dans la saison en cours.
    inSeason = inSeason && nextDateInDays <= daysLeftInSeason(state.date)
  }

  const status: ObjectiveStatus = missing.length > 0 ? 'locked' : inSeason ? 'available' : 'out-of-season'
  return { objective, status, missing, manual, ...(nextDateInDays !== undefined ? { nextDateInDays } : {}) }
}

export function evaluateAll(
  game: GameData,
  state: PlayerState,
  index = new ObjectiveIndex(game),
): Evaluation[] {
  const spritesFound = countFoundSprites(game, state.completed)
  return game.objectives.map((o) => evaluateObjective(index, state, o, spritesFound))
}

function reasonsFor(
  index: ObjectiveIndex,
  state: PlayerState,
  evaluation: Evaluation,
  spritesFound: number,
): Reason[] {
  const { objective } = evaluation
  const reasons: Reason[] = []
  const festival = index.game.festivals.find((f) => f.objectiveId === objective.id)

  if (state.pinnedId === objective.id)
    reasons.push({ code: 'pinned', text: 'Ton objectif épinglé', weight: 1000 })
  if (state.started?.has(objective.id)) reasons.push({ code: 'started', text: 'Déjà commencé', weight: 40 })

  if (evaluation.nextDateInDays !== undefined) {
    const days = evaluation.nextDateInDays
    const what = festival ? `Le festival ${festival.nameFr ?? festival.name} a lieu` : "C'est possible"
    if (days === 0) reasons.push({ code: 'today', text: `${what} aujourd'hui !`, weight: 90 })
    else if (days <= 3) reasons.push({ code: 'soon', text: `${what} ${formatIn(days)}`, weight: 60 })
    else if (days <= 10) reasons.push({ code: 'soon', text: `${what} ${formatIn(days)}`, weight: 25 })
  } else if (objective.availableSeasons && objective.availableSeasons.length < 4) {
    const left = daysLeftInSeason(state.date)
    const only =
      objective.availableSeasons.length === 1
        ? `Faisable seulement en ${SEASON_LABELS[state.date.season].toLowerCase()}`
        : 'Faisable cette saison seulement'
    reasons.push({ code: 'season-only', text: only, weight: 30 })
    if (left <= 7)
      reasons.push({
        code: 'season-ending',
        text:
          left === 0
            ? 'Dernier jour de la saison !'
            : `Plus que ${left} jour${left > 1 ? 's' : ''} dans la saison`,
        weight: 25,
      })
  }

  const unlocks = index.transitiveUnlockCount(objective.id)
  if (unlocks > 0)
    reasons.push({
      code: 'unlocks',
      text: `Débloque ${unlocks} autre${unlocks > 1 ? 's' : ''} objectif${unlocks > 1 ? 's' : ''}`,
      weight: Math.min(30, 6 * unlocks),
    })

  if (isSpriteObjectiveId(objective.id)) {
    if (spritesFound < GODDESS_SPRITES) {
      const left = GODDESS_SPRITES - spritesFound
      reasons.push({
        code: 'goddess',
        text:
          left <= 5
            ? `Plus que ${left} lutin${left > 1 ? 's' : ''} avant la Déesse !`
            : 'Te rapproche des 60 lutins',
        weight: left <= 5 ? 35 : 14,
      })
    } else if (spritesFound < TOTAL_SPRITES) {
      reasons.push({ code: 'all-sprites', text: `Te rapproche des ${TOTAL_SPRITES} lutins`, weight: 8 })
    }
  }

  if (objective.milestone)
    reasons.push({ code: 'milestone', text: 'Un grand jalon de ta partie', weight: 25 })
  if (objective.estimatedDuration === 'une session')
    reasons.push({ code: 'quick', text: 'Rapide : faisable en une session', weight: 15 })

  return reasons.sort((a, b) => b.weight - a.weight)
}

/** Ajustements qui ne méritent pas une raison affichée (facilité, longueur). */
function baseScore(objective: Objective): number {
  const ease = { 1: 8, 2: 3, 3: 0 }[objective.difficulty]
  const length = { 'une session': 6, 'quelques jours de jeu': 3, 'une saison': 0, 'long terme': -6 }[
    objective.estimatedDuration
  ]
  return ease + length
}

/** Suggestions « Que faire maintenant ? » : objectifs disponibles, triés par pertinence. */
export function suggest(
  game: GameData,
  state: PlayerState,
  options: { limit?: number; index?: ObjectiveIndex } = {},
): Suggestion[] {
  const index = options.index ?? new ObjectiveIndex(game)
  const spritesFound = countFoundSprites(game, state.completed)
  const suggestions: Suggestion[] = []
  for (const objective of game.objectives) {
    const evaluation = evaluateObjective(index, state, objective, spritesFound)
    if (evaluation.status !== 'available') continue
    const reasons = reasonsFor(index, state, evaluation, spritesFound)
    const score = baseScore(objective) + reasons.reduce((sum, r) => sum + r.weight, 0)
    suggestions.push({ objective, score, reasons })
  }
  suggestions.sort((a, b) => b.score - a.score || a.objective.title.localeCompare(b.objective.title, 'fr'))
  return options.limit ? suggestions.slice(0, options.limit) : suggestions
}
