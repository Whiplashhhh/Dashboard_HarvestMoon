<script setup lang="ts">
import { normalizeSearch } from '~/utils/text'

useHead({ title: 'Recettes — Le Carnet de la Ferme' })

const { game } = useGame()
const search = ref('')
const utensil = ref('')

const utensils = computed(() => {
  const set = new Set<string>()
  for (const r of game.value?.recipes ?? []) for (const u of r.utensils) set.add(u)
  return [...set].sort()
})

const recipes = computed(() => {
  const term = normalizeSearch(search.value)
  return (game.value?.recipes ?? []).filter((r) => {
    if (utensil.value === '—' ? r.utensils.length > 0 : utensil.value && !r.utensils.includes(utensil.value))
      return false
    if (term && !normalizeSearch(`${r.name} ${r.ingredients.join(' ')}`).includes(term)) return false
    return true
  })
})
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>Recettes</h1>
        <p>
          Les {{ game?.recipes.length ?? '' }} recettes de la cuisine de ta ferme. Cherche par nom ou par
          ingrédient.
        </p>
      </div>
    </header>
    <GameGate>
      <PaperCard as="section" role="search" aria-label="Rechercher une recette" class="filters">
        <label class="search">
          <span class="visually-hidden">Rechercher une recette ou un ingrédient</span>
          <PixelIcon name="search" :size="22" />
          <input v-model="search" type="search" placeholder="Ex. : Egg, Milk, Curry…" />
        </label>
        <label class="field">
          <span class="field__label">Ustensile</span>
          <select v-model="utensil" class="input">
            <option value="">Tous</option>
            <option v-for="u in utensils" :key="u" :value="u">{{ u }}</option>
            <option value="—">Sans ustensile</option>
          </select>
        </label>
      </PaperCard>

      <p class="count" role="status">{{ recipes.length }} recette{{ recipes.length > 1 ? 's' : '' }}</p>
      <div class="table-wrap" tabindex="0" role="region" aria-label="Tableau des recettes">
        <table class="recipes">
          <thead>
            <tr>
              <th scope="col">Recette</th>
              <th scope="col">Ingrédients</th>
              <th scope="col">Ustensiles</th>
              <th scope="col">Effet</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in recipes" :key="r.id">
              <th scope="row">
                {{ r.nameFr ?? r.name }}
                <ConfidenceNote :confidence="r.confidence" :notes="r.notes" />
              </th>
              <td data-label="Ingrédients">{{ r.ingredients.join(', ') }}</td>
              <td data-label="Ustensiles">
                <span v-if="r.utensils.length" class="tags">
                  <TagChip v-for="u in r.utensils" :key="u" tone="wood">{{ u }}</TagChip>
                </span>
                <span v-else class="muted">aucun</span>
              </td>
              <td data-label="Effet">{{ r.effect ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-if="!recipes.length" title="Aucune recette ne correspond" />
    </GameGate>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: flex-end;
}
.search {
  flex: 1 1 16rem;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border: 3px solid var(--wood-900);
  border-radius: var(--radius-sm);
  background: #fff;
}
.search:focus-within {
  outline: 3px solid var(--wood-900);
  outline-offset: 2px;
  box-shadow: 0 0 0 7px var(--sun);
}
.search input {
  flex: 1;
  min-width: 0;
  min-height: var(--tap);
  border: 0;
  outline: none;
  background: transparent;
}
.count {
  margin: var(--space-4) 0 var(--space-2);
  font-weight: 800;
  color: var(--ink-soft);
}
.table-wrap {
  overflow-x: auto;
  border: var(--border-thick) solid var(--wood-900);
  border-radius: var(--radius-md);
  background: var(--paper-50);
}
.recipes {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.recipes th,
.recipes td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 2px dashed var(--paper-300);
  text-align: left;
  vertical-align: top;
}
.recipes thead th {
  position: sticky;
  top: 0;
  background: var(--wood-700);
  color: var(--paper-50);
  font-family: var(--font-display);
  font-weight: 600;
  text-shadow: 0 1px 0 var(--wood-950);
}
.recipes tbody th {
  font-weight: 800;
  min-width: 9rem;
}
.recipes tbody tr:nth-child(even) {
  background: var(--paper-100);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.muted {
  color: var(--ink-soft);
}
@media (max-width: 640px) {
  .recipes thead {
    display: none;
  }
  .recipes tr {
    display: grid;
    gap: 2px;
    padding: var(--space-2) 0;
    border-bottom: 2px dashed var(--paper-300);
  }
  .recipes th,
  .recipes td {
    border: 0;
    padding: 2px var(--space-3);
  }
  .recipes td::before {
    content: attr(data-label) ' : ';
    font-weight: 800;
    color: var(--ink-soft);
  }
}
</style>
