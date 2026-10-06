<script setup lang="ts">
import { formatGameDate } from '#shared/engine'
import type { GameDate } from '#shared/schemas'
import type { NoteDTO } from '#shared/types/api'

useHead({ title: 'Carnet — Le Carnet de la Ferme' })

const { farm, addNote } = useFarm()
const api = useApi()
const toast = useToast()

const { data: notes, refresh } = await useAsyncData(
  'notes',
  () => (farm.value ? api<NoteDTO[]>(`/api/farms/${farm.value.id}/notes`) : Promise.resolve([])),
  { server: false, default: () => [] as NoteDTO[] },
)

const body = ref('')
const updateDate = ref(false)
const date = ref<GameDate>({ ...(farm.value?.date ?? { year: 1, season: 'spring', day: 1 }) })
const saving = ref(false)
watch(updateDate, (on) => {
  if (on && farm.value) date.value = { ...farm.value.date }
})

async function save() {
  if (!body.value.trim()) return
  saving.value = true
  try {
    await addNote(body.value.trim(), updateDate.value ? date.value : undefined)
    body.value = ''
    updateDate.value = false
    await refresh()
    toast.show('Note rangée dans ton carnet.', 'success')
  } catch (e) {
    toast.show(apiErrorMessage(e), 'error')
  } finally {
    saving.value = false
  }
}

async function remove(note: NoteDTO) {
  if (!farm.value || !window.confirm('Supprimer cette note ?')) return
  try {
    await api(`/api/farms/${farm.value.id}/notes/${note.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e) {
    toast.show(apiErrorMessage(e), 'error')
  }
}

const realDate = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>Mon carnet</h1>
        <p>Tes notes de session, pour te souvenir de tout quand tu reviens.</p>
      </div>
    </header>

    <PaperCard as="section" aria-labelledby="new-note">
      <form class="new-note" @submit.prevent="save">
        <h2 id="new-note" class="section-title"><PixelIcon name="pencil" :size="24" /> Nouvelle note</h2>
        <label class="visually-hidden" for="note-body">Ta note</label>
        <textarea
          id="note-body"
          v-model="body"
          class="lined"
          rows="4"
          maxlength="4000"
          placeholder="Ce que tu as fait, ce que tu veux faire la prochaine fois…"
          required
        />
        <label class="check-row">
          <input v-model="updateDate" type="checkbox" />
          <span class="check-row__box" aria-hidden="true"><PixelIcon name="check" :size="18" /></span>
          <span
            >Mettre aussi à jour la date de mon jeu{{
              farm ? ` (actuellement ${formatGameDate(farm.date)})` : ''
            }}</span
          >
        </label>
        <GameDatePicker v-if="updateDate" v-model="date" id-prefix="note-date" />
        <div>
          <GameButton type="submit" icon="check" :loading="saving" :disabled="!body.trim()"
            >Ranger dans le carnet</GameButton
          >
        </div>
      </form>
    </PaperCard>

    <section aria-labelledby="notes-title">
      <h2 id="notes-title" class="section-title">
        <PixelIcon name="notebook" :size="28" /> Pages précédentes
      </h2>
      <ol v-if="notes.length" class="notes">
        <li v-for="note in notes" :key="note.id" class="note">
          <header class="note__head">
            <p class="note__date pixel">{{ formatGameDate(note.date) }}</p>
            <p class="note__real">{{ realDate(note.createdAt) }}</p>
          </header>
          <p class="note__body">{{ note.body }}</p>
          <button type="button" class="note__delete" @click="remove(note)">
            <PixelIcon name="close" :size="16" /> Supprimer
          </button>
        </li>
      </ol>
      <PaperCard v-else tone="white">
        <EmptyState title="Ton carnet est encore vierge">Écris ta première note ci-dessus.</EmptyState>
      </PaperCard>
    </section>
  </div>
</template>

<style scoped>
.new-note {
  display: grid;
  gap: var(--space-3);
}
.new-note h2 {
  margin: 0;
}
.lined {
  width: 100%;
  padding: var(--space-3);
  border: 3px solid var(--wood-900);
  border-radius: var(--radius-sm);
  background:
    repeating-linear-gradient(180deg, transparent 0 1.6rem, rgb(47 120 184 / 0.18) 1.6rem calc(1.6rem + 1px)),
    #fff;
  line-height: 1.6rem;
  resize: vertical;
}
.notes {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.note {
  position: relative;
  padding: var(--space-4) var(--space-4) var(--space-3) var(--space-6);
  border: 3px solid var(--wood-900);
  border-radius: 4px var(--radius-md) var(--radius-md) 4px;
  background:
    linear-gradient(
      90deg,
      transparent 1.6rem,
      rgb(216 67 59 / 0.3) 1.6rem calc(1.6rem + 2px),
      transparent calc(1.6rem + 2px)
    ),
    var(--paper-50);
  box-shadow: var(--shadow-card);
}
.note:nth-child(even) {
  transform: rotate(0.4deg);
}
.note:nth-child(odd) {
  transform: rotate(-0.3deg);
}
.note__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-2);
}
.note__head p {
  margin: 0;
}
.note__date {
  color: var(--season-accent-strong);
  font-size: 1.05rem;
}
.note__real {
  font-size: var(--text-xs);
  color: var(--ink-soft);
}
.note__body {
  margin: var(--space-2) 0;
  white-space: pre-line;
}
.note__delete {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 0 var(--space-2);
  border: 0;
  background: none;
  color: var(--berry-ink);
  font-weight: 700;
  font-size: var(--text-sm);
  cursor: pointer;
}
</style>
