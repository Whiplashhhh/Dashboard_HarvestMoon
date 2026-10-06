<script setup lang="ts">
import { SEASON_LABELS, SEASONS, type Season } from '#shared/schemas'

useHead({ title: 'Réglages — Le Carnet de la Ferme' })

const settings = useSettings()
const api = useApi()
const toast = useToast()
const user = useCurrentUser()

async function persist() {
  if (!user.value) return
  try {
    await api('/api/account/settings', { method: 'PUT', body: settings.value })
  } catch (e) {
    toast.show(apiErrorMessage(e), 'error')
  }
}

function update<K extends keyof typeof settings.value>(key: K, value: (typeof settings.value)[K]) {
  settings.value = { ...settings.value, [key]: value }
  if (key === 'sounds' && value) playSound('ding')
  void persist()
}

function setSeason(value: string) {
  update('forcedSeason', value ? (value as Season) : null)
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>Réglages</h1>
        <p>Enregistrés sur ton compte : tu les retrouves sur tous tes appareils.</p>
      </div>
    </header>

    <PaperCard as="section" class="settings" aria-label="Réglages">
      <div class="setting">
        <div>
          <p id="sounds-label" class="setting__title">Sons</p>
          <p class="setting__desc">Petits « pop » et « ding » synthétisés quand tu coches quelque chose.</p>
        </div>
        <button
          type="button"
          role="switch"
          class="switch"
          aria-labelledby="sounds-label"
          :aria-checked="settings.sounds"
          @click="update('sounds', !settings.sounds)"
        >
          <span class="switch__knob" />
          <span class="switch__text">{{ settings.sounds ? 'Activés' : 'Coupés' }}</span>
        </button>
      </div>

      <div class="setting">
        <div>
          <p id="motion-label" class="setting__title">Animations réduites</p>
          <p class="setting__desc">
            Coupe les particules, le parallax et la machine à écrire. Ton réglage système « réduire les
            animations » est aussi respecté.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          class="switch"
          aria-labelledby="motion-label"
          :aria-checked="settings.reducedMotion"
          @click="update('reducedMotion', !settings.reducedMotion)"
        >
          <span class="switch__knob" />
          <span class="switch__text">{{ settings.reducedMotion ? 'Réduites' : 'Normales' }}</span>
        </button>
      </div>

      <div class="setting">
        <div>
          <label class="setting__title" for="season-select">Saison du thème</label>
          <p class="setting__desc">Par défaut, le site prend les couleurs de la saison de ta partie.</p>
        </div>
        <select
          id="season-select"
          class="input select"
          :value="settings.forcedSeason ?? ''"
          @change="setSeason(($event.target as HTMLSelectElement).value)"
        >
          <option value="">Celle de ma partie</option>
          <option v-for="s in SEASONS" :key="s" :value="s">{{ SEASON_LABELS[s] }}</option>
        </select>
      </div>
    </PaperCard>
  </div>
</template>

<style scoped>
.settings {
  display: grid;
  gap: 0;
  padding: 0;
}
.setting {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-bottom: 2px dashed var(--paper-300);
}
.setting:last-child {
  border-bottom: 0;
}
.setting > div {
  flex: 1 1 18rem;
}
.setting__title {
  display: block;
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-lg);
}
.setting__desc {
  margin: 4px 0 0;
  color: var(--ink-soft);
  font-size: var(--text-sm);
}
.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--tap);
  padding: 4px 12px 4px 4px;
  border: 3px solid var(--wood-900);
  border-radius: 999px;
  background: var(--paper-200);
  font-weight: 800;
  cursor: pointer;
}
.switch__knob {
  width: 30px;
  height: 30px;
  border: 3px solid var(--wood-900);
  border-radius: 50%;
  background: #fff;
  transition: transform 200ms var(--ease-bounce);
}
.switch[aria-checked='true'] {
  background: var(--meadow-300);
}
.switch[aria-checked='true'] .switch__knob {
  background: var(--meadow-500);
}
.select {
  width: auto;
  min-width: 13rem;
}
</style>
