import type { GameDate, SessionUpdateInput } from '#shared/schemas'
import { stepKey, type FarmDTO, type NoteDTO } from '#shared/types/api'

/**
 * Ferme active : chargée au rendu serveur, puis mise à jour de façon optimiste
 * (l'interface réagit tout de suite ; en cas d'échec, on revient en arrière et on prévient).
 */
export function useFarm() {
  const user = useCurrentUser()
  const api = useApi()
  const toast = useToast()
  const { play } = useSound()
  const farm = useState<FarmDTO | null>('active-farm', () => null)
  const gameSeason = useState<GameDate['season'] | null>('game-season', () => null)

  async function load(force = false) {
    const id = user.value?.activeFarmId
    if (!id) {
      farm.value = null
      return
    }
    if (!force && farm.value?.id === id) return
    // Typage simplifié : l'inférence des routes typées de Nitro est trop coûteuse ici.
    type Fetcher = <T>(url: string) => Promise<T>
    const fetcher: Fetcher = import.meta.server
      ? (useRequestFetch() as unknown as Fetcher)
      : ($fetch as unknown as Fetcher)
    farm.value = await fetcher<FarmDTO>(`/api/farms/${id}`)
  }

  watch(
    () => farm.value?.date.season,
    (season) => (gameSeason.value = season ?? null),
    { immediate: true },
  )

  const completed = computed(() => new Set(farm.value?.completed ?? []))
  const steps = computed(() => new Set(farm.value?.steps ?? []))

  async function optimistic(change: (f: FarmDTO) => FarmDTO, request: (id: string) => Promise<unknown>) {
    const before = farm.value
    if (!before) return false
    farm.value = change(structuredClone(toRaw(before)))
    try {
      await request(before.id)
      return true
    } catch (error) {
      farm.value = before
      toast.show(apiErrorMessage(error), 'error')
      return false
    }
  }

  function setObjective(objectiveId: string, done: boolean) {
    if (done) play('ding')
    return optimistic(
      (f) => ({
        ...f,
        completed: done
          ? [...new Set([...f.completed, objectiveId])]
          : f.completed.filter((id) => id !== objectiveId),
      }),
      (id) =>
        api(`/api/farms/${id}/objectives`, {
          method: 'PUT',
          body: done ? { complete: [objectiveId] } : { uncomplete: [objectiveId] },
        }),
    )
  }

  function setStep(objectiveId: string, methodIndex: number, stepIndex: number, checked: boolean) {
    const key = stepKey(objectiveId, methodIndex, stepIndex)
    if (checked) play('pop')
    return optimistic(
      (f) => ({ ...f, steps: checked ? [...f.steps, key] : f.steps.filter((s) => s !== key) }),
      (id) =>
        api(`/api/farms/${id}/steps`, {
          method: 'PUT',
          body: { objectiveId, methodIndex, stepIndex, checked },
        }),
    )
  }

  function pin(objectiveId: string | null) {
    return optimistic(
      (f) => ({ ...f, pinnedObjectiveId: objectiveId }),
      (id) => api(`/api/farms/${id}`, { method: 'PATCH', body: { pinnedObjectiveId: objectiveId } }),
    )
  }

  function setDate(date: GameDate) {
    return optimistic(
      (f) => ({ ...f, date }),
      (id) => api(`/api/farms/${id}`, { method: 'PATCH', body: { date } }),
    )
  }

  async function endSession(input: SessionUpdateInput) {
    if (!farm.value) return false
    try {
      farm.value = await api<FarmDTO>(`/api/farms/${farm.value.id}/session`, { method: 'POST', body: input })
      play('fanfare')
      return true
    } catch (error) {
      toast.show(apiErrorMessage(error), 'error')
      return false
    }
  }

  async function addNote(body: string, date?: GameDate) {
    if (!farm.value) return null
    const note = await api<NoteDTO>(`/api/farms/${farm.value.id}/notes`, {
      method: 'POST',
      body: { body, date },
    })
    farm.value = { ...farm.value, lastNote: note, ...(date ? { date } : {}) }
    return note
  }

  return { farm, completed, steps, load, setObjective, setStep, pin, setDate, endSession, addNote }
}
