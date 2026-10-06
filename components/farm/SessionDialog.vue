<script setup lang="ts">
import { formatGameDate } from '#shared/engine'
import type { GameDate } from '#shared/schemas'

/**
 * « Fin de session » : le geste de fin de partie, en moins de 30 secondes.
 * 1) avancer la date, 2) cocher ce qui a été fait, 3) un mot pour son « moi du futur ».
 */
const { open, hide } = useSessionDialog()
const { farm, completed, endSession } = useFarm()
const { suggestions } = usePlayer()
const { game, lookups } = useGame()
const toast = useToast()

const dialog = ref<HTMLDialogElement | null>(null)
const date = ref<GameDate>({ year: 1, season: 'spring', day: 1 })
const checked = ref(new Set<string>())
const note = ref('')
const search = ref('')
const saving = ref(false)

/** Objectifs proposés : épinglé + meilleures suggestions + ce qui vient d'être coché. */
const proposals = computed(() => {
  const ids = new Set<string>()
  if (farm.value?.pinnedObjectiveId && !completed.value.has(farm.value.pinnedObjectiveId))
    ids.add(farm.value.pinnedObjectiveId)
  for (const s of suggestions.value.slice(0, 6)) ids.add(s.objective.id)
  for (const id of checked.value) ids.add(id)
  return [...ids].map((id) => lookups.value?.objectives.get(id)).filter((o) => o !== undefined)
})

const searchResults = computed(() => {
  const term = normalizeSearch(search.value)
  if (term.length < 2 || !game.value) return []
  return game.value.objectives
    .filter(
      (o) =>
        !completed.value.has(o.id) && !proposals.value.includes(o) && normalizeSearch(o.title).includes(term),
    )
    .slice(0, 8)
})

function toggle(id: string) {
  const next = new Set(checked.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  checked.value = next
}

watch(open, (value) => {
  if (value && farm.value) {
    date.value = { ...farm.value.date }
    checked.value = new Set()
    note.value = ''
    search.value = ''
    nextTick(() => dialog.value?.showModal())
  } else dialog.value?.close()
})

async function save() {
  saving.value = true
  const ok = await endSession({
    date: date.value,
    complete: [...checked.value],
    ...(note.value.trim() ? { note: note.value.trim() } : {}),
  })
  saving.value = false
  if (ok) {
    hide()
    toast.show('Partie enregistrée. À la prochaine !', 'success')
  }
}
</script>

<template>
  <dialog ref="dialog" class="session" aria-labelledby="session-title" @close="hide" @cancel="hide">
    <form v-if="farm" class="session__inner" method="dialog" @submit.prevent="save">
      <header class="session__head">
        <h2 id="session-title">Fin de session</h2>
        <button type="button" class="session__close" aria-label="Fermer sans enregistrer" @click="hide">
          <PixelIcon name="close" :size="24" />
        </button>
      </header>

      <section class="session__step">
        <h3><span class="session__num pixel">1</span> Quelle date affiche ton jeu ?</h3>
        <GameDatePicker v-model="date" id-prefix="session-date" />
        <p class="session__hint">
          Avant : {{ formatGameDate(farm.date) }} → maintenant : <strong>{{ formatGameDate(date) }}</strong>
        </p>
      </section>

      <section class="session__step">
        <h3><span class="session__num pixel">2</span> Qu'as-tu accompli ?</h3>
        <EmptyState v-if="!game" kind="seed" title="Le carnet se prépare…" />
        <ul v-else class="session__list">
          <li v-for="objective in proposals" :key="objective.id">
            <label class="check-row check-row--strike">
              <input type="checkbox" :checked="checked.has(objective.id)" @change="toggle(objective.id)" />
              <span class="check-row__box" aria-hidden="true"><PixelIcon name="check" :size="18" /></span>
              <span>{{ objective.title }}</span>
            </label>
          </li>
        </ul>
        <label class="session__search">
          <span class="visually-hidden">Chercher un autre objectif ou lutin</span>
          <PixelIcon name="search" :size="20" />
          <input v-model="search" type="search" placeholder="Autre chose ? Cherche un objectif, un lutin…" />
        </label>
        <ul v-if="searchResults.length" class="session__list">
          <li v-for="objective in searchResults" :key="objective.id">
            <label class="check-row check-row--strike">
              <input type="checkbox" :checked="checked.has(objective.id)" @change="toggle(objective.id)" />
              <span class="check-row__box" aria-hidden="true"><PixelIcon name="check" :size="18" /></span>
              <span>{{ objective.title }}</span>
            </label>
          </li>
        </ul>
      </section>

      <section class="session__step">
        <h3>
          <label for="session-note"
            ><span class="session__num pixel">3</span> Un mot pour ton « moi du futur »</label
          >
        </h3>
        <textarea
          id="session-note"
          v-model="note"
          rows="3"
          maxlength="4000"
          placeholder="Ex. : J'ai planté des tomates, penser à les arroser. Prochain objectif : le poulailler."
        />
      </section>

      <footer class="session__foot">
        <GameButton variant="paper" @click="hide">Annuler</GameButton>
        <GameButton type="submit" icon="check" :loading="saving">Enregistrer ma partie</GameButton>
      </footer>
    </form>
  </dialog>
</template>

<style scoped>
.session {
  width: min(640px, calc(100vw - 24px));
  max-height: calc(100dvh - 24px);
  padding: 0;
  border: var(--border-chunky) solid var(--wood-900);
  border-radius: var(--radius-xl);
  background: var(--paper-100);
  color: var(--ink);
  box-shadow: var(--shadow-lift);
}
.session[open] {
  animation: rise 260ms var(--ease-bounce);
}
.session::backdrop {
  background: rgb(46 27 14 / 0.45);
  backdrop-filter: blur(2px);
}
.session__inner {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
}
.session__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.session__head h2 {
  margin: 0;
}
.session__close {
  display: grid;
  place-items: center;
  width: var(--tap);
  height: var(--tap);
  border: 3px solid var(--wood-900);
  border-radius: 50%;
  background: var(--paper-50);
  cursor: pointer;
}
.session__step {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 3px dashed var(--paper-400);
  border-radius: var(--radius-md);
  background: var(--paper-50);
}
.session__step h3 {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-lg);
}
.session__num {
  display: inline-grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  border: 3px solid var(--wood-900);
  border-radius: 50%;
  background: var(--season-accent);
  color: #fff;
  font-size: 1rem;
  margin-right: 0.3rem;
}
.session__hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-soft);
}
.session__list {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}
.session__search {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  border: 3px solid var(--wood-900);
  border-radius: var(--radius-sm);
  background: #fff;
}
.session__search input {
  flex: 1;
  min-width: 0;
  min-height: var(--tap);
  border: 0;
  background: transparent;
}
.session__search input:focus {
  outline: none;
}
.session__search:focus-within {
  box-shadow: 0 0 0 4px var(--sun);
}
textarea {
  width: 100%;
  padding: var(--space-3);
  border: 3px solid var(--wood-900);
  border-radius: var(--radius-sm);
  background:
    repeating-linear-gradient(180deg, transparent 0 1.6rem, rgb(122 74 38 / 0.18) 1.6rem calc(1.6rem + 1px)),
    #fff;
  line-height: 1.6rem;
  resize: vertical;
}
.session__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97);
  }
}
</style>
