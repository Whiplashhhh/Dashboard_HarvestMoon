import type { GameData } from '#shared/data/game'
import { ObjectiveIndex } from '#shared/engine'

let pending: Promise<GameData> | null = null

/**
 * Données du jeu (lutins, objectifs, personnages…). Chargées une seule fois côté navigateur depuis un fichier
 * statique compressé, puis gardées en mémoire. Non incluses dans le rendu serveur pour garder des pages légères.
 */
export function useGame() {
  const game = useState<GameData | null>('game-data', () => null)
  const error = useState<string | null>('game-data-error', () => null)

  async function load() {
    if (game.value || !import.meta.client) return
    try {
      pending ??= $fetch<GameData>('/api/game.json')
      game.value = markRaw(await pending)
      error.value = null
    } catch {
      pending = null
      error.value = 'Impossible de charger les données du jeu. Vérifie ta connexion puis recharge la page.'
    }
  }

  if (import.meta.client && !game.value) onMounted(load)

  const lookups = computed(() => {
    const data = game.value
    if (!data) return null
    return {
      index: markRaw(new ObjectiveIndex(data)),
      objectives: new Map(data.objectives.map((o) => [o.id, o])),
      sprites: new Map(data.sprites.map((s) => [s.id, s])),
      teams: new Map(data.teams.map((t) => [t.id, t])),
      festivalByObjective: new Map(
        data.festivals.flatMap((f) => (f.objectiveId ? [[f.objectiveId, f]] : [])),
      ),
    }
  })

  return { game, error, lookups, load }
}
