import { GODDESS_SPRITES, spriteObjectiveId, TOTAL_SPRITES } from '#shared/data/game'
import {
  countFoundSprites,
  evaluateAll,
  suggest,
  upcomingEvents,
  type Evaluation,
  type PlayerState,
} from '#shared/engine'

/** Vue « moteur » de la partie : statut de chaque objectif, suggestions, lutins, événements à venir. */
export function usePlayer() {
  const { game, lookups } = useGame()
  const { farm, completed, steps } = useFarm()

  const state = computed<PlayerState | null>(() => {
    if (!farm.value) return null
    const started = new Set([...steps.value].map((key) => key.split(':')[0]!))
    return {
      date: farm.value.date,
      completed: completed.value,
      started,
      pinnedId: farm.value.pinnedObjectiveId,
    }
  })

  const evaluations = computed(() => {
    if (!game.value || !state.value || !lookups.value) return new Map<string, Evaluation>()
    return new Map(evaluateAll(game.value, state.value, lookups.value.index).map((e) => [e.objective.id, e]))
  })

  const suggestions = computed(() =>
    game.value && state.value && lookups.value
      ? suggest(game.value, state.value, { index: lookups.value.index })
      : [],
  )

  const spritesFound = computed(() => (game.value ? countFoundSprites(game.value, completed.value) : 0))

  const upcoming = computed(() =>
    game.value && farm.value ? upcomingEvents(game.value, farm.value.date, 7) : [],
  )

  const pinned = computed(() =>
    farm.value?.pinnedObjectiveId
      ? (lookups.value?.objectives.get(farm.value.pinnedObjectiveId) ?? null)
      : null,
  )

  const foundTeamColors = computed(() => {
    if (!game.value || !lookups.value) return []
    return game.value.sprites
      .filter((s) => completed.value.has(spriteObjectiveId(s.id)))
      .map((s) => lookups.value!.teams.get(s.teamId)?.color ?? 'brown')
  })

  const completedObjectivesCount = computed(
    () => [...completed.value].filter((id) => !id.startsWith('sprite-')).length,
  )

  return {
    state,
    evaluations,
    suggestions,
    spritesFound,
    upcoming,
    pinned,
    foundTeamColors,
    completedObjectivesCount,
    TOTAL_SPRITES,
    GODDESS_SPRITES,
  }
}
