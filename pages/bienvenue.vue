<script setup lang="ts">
import { CATEGORY_LABELS, type GameDate, type ObjectiveCategory } from '#shared/schemas'
import { spriteObjectiveId } from '#shared/data/game'
import type { FarmDTO } from '#shared/types/api'
import { CATEGORY_ICONS } from '~/utils/categories'

/** Onboarding : créer sa ferme, puis déclarer en quelques clics ce qui est déjà fait. */
definePageMeta({ layout: 'portal' })
useHead({ title: 'Bienvenue — Le Carnet de la Ferme' })

const { user, refresh } = useAuth()
const { game } = useGame()
const api = useApi()
const toast = useToast()
const { farm } = useFarm()

const step = ref<1 | 2>(1)
const farmerName = ref('')
const farmName = ref('')
const date = ref<GameDate>({ year: 1, season: 'spring', day: 1 })
const done = ref(new Set<string>())
const error = ref<string | null>(null)
const saving = ref(false)
const firstFarm = computed(() => !user.value?.activeFarmId)

const teams = computed(() =>
  (game.value?.teams ?? []).map((team) => ({
    team,
    sprites: game.value!.sprites.filter((s) => s.teamId === team.id),
  })),
)

const onboardingGroups = computed(() => {
  const groups = new Map<ObjectiveCategory, { id: string; title: string }[]>()
  for (const objective of game.value?.objectives ?? []) {
    if (!objective.onboarding || objective.category === 'lutins') continue
    const list = groups.get(objective.category) ?? []
    list.push({ id: objective.id, title: objective.title })
    groups.set(objective.category, list)
  }
  return [...groups.entries()]
})

// Les lutins présents dès le début sont cochés d'office.
watch(
  game,
  (data) => {
    if (!data) return
    for (const sprite of data.sprites) if (sprite.fromStart) done.value.add(spriteObjectiveId(sprite.id))
  },
  { immediate: true },
)

function toggle(id: string) {
  const next = new Set(done.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  done.value = next
}

function toggleTeam(ids: string[]) {
  const allDone = ids.every((id) => done.value.has(id))
  const next = new Set(done.value)
  for (const id of ids) {
    if (allDone) next.delete(id)
    else next.add(id)
  }
  done.value = next
}

function next() {
  error.value = null
  if (!farmerName.value.trim() || !farmName.value.trim()) {
    error.value = 'Donne un nom à ton fermier et à ta ferme (comme dans ton jeu).'
    return
  }
  step.value = 2
  nextTick(() => document.getElementById('step-2-title')?.focus())
}

async function finish() {
  saving.value = true
  error.value = null
  try {
    farm.value = await api<FarmDTO>('/api/farms', {
      method: 'POST',
      body: {
        farmerName: farmerName.value,
        farmName: farmName.value,
        date: date.value,
        completed: [...done.value],
      },
    })
    await refresh()
    toast.show('Ta ferme est prête !', 'success')
    await navigateTo('/')
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="onboarding">
    <DialogBox
      v-if="step === 1"
      speaker="Le maire"
      :pages="
        firstFarm
          ? ['Bienvenue dans la vallée ! Commençons par ta ferme : comment s’appelle-t-elle dans ton jeu ?']
          : ['Une nouvelle ferme ? Excellente idée ! Comment s’appelle-t-elle ?']
      "
    />
    <DialogBox
      v-else
      speaker="Le maire"
      :pages="[
        'Parfait ! Coche maintenant ce que tu as déjà fait. Pas besoin d’être exhaustive : tu pourras compléter plus tard.',
      ]"
    />

    <p v-if="error" class="form-error" role="alert"><PixelIcon name="close" :size="20" />{{ error }}</p>

    <LetterCard v-if="step === 1" stamp="ÉTAPE 1">
      <form class="onboarding__form" @submit.prevent="next">
        <h1 class="auth__title">Ma ferme</h1>
        <div class="onboarding__names">
          <div class="field">
            <label for="farmer-name">Nom du fermier</label>
            <input
              id="farmer-name"
              v-model="farmerName"
              class="input"
              maxlength="40"
              autocomplete="nickname"
              required
            />
          </div>
          <div class="field">
            <label for="farm-name">Nom de la ferme</label>
            <input id="farm-name" v-model="farmName" class="input" maxlength="40" required />
          </div>
        </div>
        <div class="field">
          <span class="field__label">Date affichée dans ton jeu</span>
          <GameDatePicker v-model="date" id-prefix="onboarding-date" :show-shortcuts="false" />
        </div>
        <GameButton type="submit" size="lg" block icon="sparkle">Continuer</GameButton>
      </form>
    </LetterCard>

    <PaperCard v-else as="section" aria-labelledby="step-2-title">
      <h1 id="step-2-title" class="auth__title" tabindex="-1">Qu'as-tu déjà fait ?</h1>
      <GameGate>
        <h2 class="section-title"><PixelIcon name="sprite" :size="28" /> Lutins déjà trouvés</h2>
        <p class="field__hint">
          Touche un lutin pour le cocher, ou le nom d'une équipe pour la cocher en entier.
        </p>
        <div class="teams">
          <fieldset v-for="{ team, sprites } in teams" :key="team.id" class="team">
            <legend>
              <button
                type="button"
                class="team__name"
                @click="toggleTeam(sprites.map((s) => spriteObjectiveId(s.id)))"
              >
                <span class="team__dot" :style="{ background: `var(--team-${team.color})` }" />
                {{ team.colorLabel }}
              </button>
            </legend>
            <div class="team__sprites">
              <button
                v-for="sprite in sprites"
                :key="sprite.id"
                type="button"
                class="tile"
                :aria-pressed="done.has(spriteObjectiveId(sprite.id))"
                @click="toggle(spriteObjectiveId(sprite.id))"
              >
                <SpriteFigure
                  :color="team.color"
                  :size="26"
                  :found="done.has(spriteObjectiveId(sprite.id))"
                />
                <span>{{ sprite.name }}</span>
              </button>
            </div>
          </fieldset>
        </div>

        <h2 class="section-title onboarding__sub">
          <PixelIcon name="house" :size="28" /> Bâtiments, outils, animaux…
        </h2>
        <div class="groups">
          <fieldset v-for="[category, items] in onboardingGroups" :key="category" class="group">
            <legend class="group__title">
              <PixelIcon :name="CATEGORY_ICONS[category]" :size="22" /> {{ CATEGORY_LABELS[category] }}
            </legend>
            <button
              v-for="item in items"
              :key="item.id"
              type="button"
              class="tile tile--wide"
              :aria-pressed="done.has(item.id)"
              @click="toggle(item.id)"
            >
              <span class="tile__check" aria-hidden="true"><PixelIcon name="check" :size="18" /></span>
              <span>{{ item.title }}</span>
            </button>
          </fieldset>
        </div>

        <div class="onboarding__actions">
          <GameButton variant="paper" @click="step = 1">Retour</GameButton>
          <GameButton size="lg" icon="check" :loading="saving" @click="finish">
            C'est parti ! ({{ done.size }} coché{{ done.size > 1 ? 's' : '' }})
          </GameButton>
        </div>
      </GameGate>
    </PaperCard>
  </div>
</template>

<style scoped>
.onboarding {
  display: grid;
  gap: var(--space-5);
}
.onboarding__form {
  display: grid;
  gap: var(--space-4);
}
.onboarding__names {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: var(--space-4);
}
.onboarding__sub {
  margin-top: var(--space-6);
}
.teams {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
.team,
.group {
  min-width: 0;
  margin: 0;
  padding: var(--space-3);
  border: 3px dashed var(--paper-400);
  border-radius: var(--radius-md);
}
.team legend,
.group legend {
  padding: 0 var(--space-2);
}
.team__name {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--tap);
  border: 0;
  background: none;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-lg);
  color: var(--wood-900);
  cursor: pointer;
}
.team__dot {
  width: 18px;
  height: 18px;
  border: 3px solid var(--wood-950);
  border-radius: 50%;
}
.team__sprites {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
  gap: var(--space-2);
}
.tile {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 52px;
  padding: var(--space-2) var(--space-3);
  border: 3px solid var(--wood-900);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--ink);
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 3px 0 var(--paper-400);
  transition:
    transform 120ms ease,
    background-color 160ms ease;
}
.tile:hover {
  transform: translateY(-1px);
}
.tile[aria-pressed='true'] {
  background: #e4f6da;
  box-shadow: 0 3px 0 var(--meadow-600);
}
.tile--wide {
  width: 100%;
}
.tile__check {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border: 3px solid var(--wood-900);
  border-radius: 6px;
  background: #fff;
}
.tile__check svg {
  opacity: 0;
}
.tile[aria-pressed='true'] .tile__check svg {
  opacity: 1;
}
.groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-3);
}
.group {
  display: grid;
  gap: var(--space-2);
  align-content: start;
}
.group__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-lg);
}
.onboarding__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-5);
}
</style>
