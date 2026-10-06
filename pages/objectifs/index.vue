<script setup lang="ts">
import {
  CATEGORY_LABELS,
  OBJECTIVE_CATEGORIES,
  SEASON_LABELS,
  SEASONS,
  type ObjectiveCategory,
  type Season,
} from '#shared/schemas'
import type { ObjectiveStatus } from '#shared/engine'
import { CATEGORY_ICONS, STATUS_LABELS } from '~/utils/categories'
import { normalizeSearch } from '~/utils/text'

useHead({ title: 'Objectifs — Le Carnet de la Ferme' })

const route = useRoute()
const router = useRouter()
const { game } = useGame()
const { evaluations, suggestions } = usePlayer()
const { farm, pin } = useFarm()

type StatusFilter = ObjectiveStatus | 'all'
const STATUS_ORDER: StatusFilter[] = ['available', 'out-of-season', 'locked', 'completed', 'all']

const query = (key: string) => (typeof route.query[key] === 'string' ? (route.query[key] as string) : '')
const category = computed<ObjectiveCategory | ''>(() => {
  const value = query('categorie')
  return (OBJECTIVE_CATEGORIES as readonly string[]).includes(value) ? (value as ObjectiveCategory) : ''
})
const status = computed<StatusFilter>(() => {
  const value = query('statut')
  return (STATUS_ORDER as string[]).includes(value) ? (value as StatusFilter) : 'available'
})
const season = computed<Season | ''>(() => {
  const value = query('saison')
  return (SEASONS as readonly string[]).includes(value) ? (value as Season) : ''
})
const search = ref(query('q'))

function setQuery(patch: Record<string, string>) {
  const merged = { ...route.query, ...patch }
  router.replace({ query: Object.fromEntries(Object.entries(merged).filter(([, value]) => Boolean(value))) })
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => setQuery({ q: value }), 200)
})

const scores = computed(() => new Map(suggestions.value.map((s) => [s.objective.id, s])))

const results = computed(() => {
  if (!game.value) return []
  const term = normalizeSearch(search.value)
  return game.value.objectives
    .map((objective) => ({ objective, evaluation: evaluations.value.get(objective.id) }))
    .filter(({ objective, evaluation }) => {
      if (category.value && objective.category !== category.value) return false
      if (status.value !== 'all' && evaluation?.status !== status.value) return false
      if (season.value && objective.availableSeasons && !objective.availableSeasons.includes(season.value))
        return false
      if (season.value && objective.dates && !objective.dates.some((d) => d.season === season.value))
        return false
      if (term && !normalizeSearch(`${objective.title} ${objective.summary}`).includes(term)) return false
      return true
    })
    .sort((a, b) => {
      const scoreA = scores.value.get(a.objective.id)?.score ?? -Infinity
      const scoreB = scores.value.get(b.objective.id)?.score ?? -Infinity
      return scoreB - scoreA || a.objective.title.localeCompare(b.objective.title, 'fr')
    })
})

const counts = computed(() => {
  const map = { available: 0, 'out-of-season': 0, locked: 0, completed: 0, all: 0 } as Record<
    StatusFilter,
    number
  >
  for (const evaluation of evaluations.value.values()) {
    if (category.value && evaluation.objective.category !== category.value) continue
    map[evaluation.status]++
    map.all++
  }
  return map
})

const PAGE = 24
const shown = ref(PAGE)
watch([category, status, season, () => route.query.q], () => (shown.value = PAGE))
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>Objectifs</h1>
        <p>Tout ce que tu peux accomplir dans la vallée, trié par ce qui compte maintenant.</p>
      </div>
    </header>

    <PaperCard as="section" role="search" aria-label="Filtrer les objectifs" class="filters">
      <div class="filters__row">
        <label class="filters__search">
          <span class="visually-hidden">Rechercher un objectif</span>
          <PixelIcon name="search" :size="22" />
          <input v-model="search" type="search" placeholder="Rechercher : Venus, poulailler, Celia…" />
        </label>
        <label class="filters__season">
          <span class="field__label">Saison</span>
          <select
            class="input"
            :value="season"
            @change="setQuery({ saison: ($event.target as HTMLSelectElement).value })"
          >
            <option value="">Toutes</option>
            <option v-for="s in SEASONS" :key="s" :value="s">{{ SEASON_LABELS[s] }}</option>
          </select>
        </label>
      </div>

      <div class="segmented" role="group" aria-label="Disponibilité">
        <button
          v-for="s in STATUS_ORDER"
          :key="s"
          type="button"
          :aria-pressed="status === s"
          @click="setQuery({ statut: s === 'available' ? '' : s })"
        >
          {{ s === 'all' ? 'Tous' : STATUS_LABELS[s] }} <span class="pixel">{{ counts[s] }}</span>
        </button>
      </div>

      <div class="chips" role="group" aria-label="Catégorie">
        <button type="button" class="chip-btn" :aria-pressed="!category" @click="setQuery({ categorie: '' })">
          Toutes
        </button>
        <button
          v-for="c in OBJECTIVE_CATEGORIES"
          :key="c"
          type="button"
          class="chip-btn"
          :aria-pressed="category === c"
          @click="setQuery({ categorie: category === c ? '' : c })"
        >
          <PixelIcon :name="CATEGORY_ICONS[c]" :size="18" />{{ CATEGORY_LABELS[c] }}
        </button>
      </div>
    </PaperCard>

    <GameGate>
      <h2 class="visually-hidden">Résultats</h2>
      <p class="results-count" role="status">
        {{ results.length }} objectif{{ results.length > 1 ? 's' : '' }}
      </p>
      <div v-if="results.length" class="grid">
        <div
          v-for="{ objective, evaluation } in results.slice(0, shown)"
          :key="objective.id"
          class="grid__item"
        >
          <ObjectiveCard
            :objective="objective"
            :evaluation="evaluation"
            :reasons="scores.get(objective.id)?.reasons"
          />
          <button
            v-if="evaluation?.status !== 'completed'"
            type="button"
            class="pin-btn"
            :aria-pressed="farm?.pinnedObjectiveId === objective.id"
            :aria-label="`Épingler ${objective.title}`"
            @click="pin(farm?.pinnedObjectiveId === objective.id ? null : objective.id)"
          >
            <PixelIcon name="pin" :size="20" />
          </button>
        </div>
      </div>
      <PaperCard v-else tone="white">
        <EmptyState title="Aucun objectif ne correspond"
          >Essaie un autre filtre ou une autre recherche.</EmptyState
        >
      </PaperCard>
      <div v-if="results.length > shown" class="more">
        <GameButton variant="wood" @click="shown += PAGE"
          >Afficher plus ({{ results.length - shown }} restants)</GameButton
        >
      </div>
    </GameGate>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  gap: var(--space-4);
}
.filters__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: flex-end;
}
.filters__search {
  flex: 1 1 18rem;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border: 3px solid var(--wood-900);
  border-radius: var(--radius-sm);
  background: #fff;
}
.filters__search:focus-within {
  outline: 3px solid var(--wood-900);
  outline-offset: 2px;
  box-shadow: 0 0 0 7px var(--sun);
}
.filters__search input {
  flex: 1;
  min-width: 0;
  min-height: var(--tap);
  border: 0;
  background: transparent;
  outline: none;
}
.filters__season {
  display: grid;
  gap: 4px;
  min-width: 10rem;
}
.segmented {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border: 3px solid var(--wood-900);
  border-radius: var(--radius-sm);
  overflow: hidden;
  width: fit-content;
  max-width: 100%;
}
.segmented button {
  flex: 1 1 auto;
  min-height: var(--tap);
  padding: 0.3rem 0.8rem;
  border: 0;
  border-right: 2px solid var(--wood-900);
  background: var(--paper-50);
  font-weight: 800;
  cursor: pointer;
}
.segmented button:last-child {
  border-right: 0;
}
.segmented button:focus-visible {
  outline-offset: -6px;
  box-shadow: none;
}
.segmented button[aria-pressed='true'] {
  background: var(--season-accent-strong);
  color: #fff;
  text-shadow: 0 1px 0 rgb(0 0 0 / 0.35);
}
.segmented .pixel {
  margin-left: 4px;
  opacity: 0.85;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: var(--tap);
  padding: 0.2rem 0.75rem;
  border: 2px solid var(--wood-900);
  border-radius: 999px;
  background: var(--paper-50);
  font-weight: 700;
  font-size: var(--text-sm);
  cursor: pointer;
}
.chip-btn[aria-pressed='true'] {
  background: var(--wood-700);
  color: var(--paper-50);
}
.results-count {
  margin: 0 0 var(--space-3);
  font-weight: 800;
  color: var(--ink-soft);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 270px), 1fr));
  gap: var(--space-5) var(--space-4);
}
.grid__item {
  position: relative;
  display: grid;
}
.pin-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: var(--tap);
  height: var(--tap);
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  filter: grayscale(1) opacity(0.65);
  transition:
    filter 160ms ease,
    transform 160ms var(--ease-bounce);
}
.pin-btn:hover {
  filter: none;
  transform: scale(1.1);
}
.pin-btn[aria-pressed='true'] {
  filter: none;
}
.more {
  display: flex;
  justify-content: center;
  margin-top: var(--space-5);
}
</style>
