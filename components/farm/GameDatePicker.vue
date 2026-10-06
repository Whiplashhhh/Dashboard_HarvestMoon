<script setup lang="ts">
import { SEASON_LABELS, SEASONS, WEEKDAY_LABELS, type GameDate } from '#shared/schemas'
import { addDays, weekdayOf } from '#shared/engine'

/** Sélecteur de date du jeu : saison en gros boutons, jour et année avec + / −, raccourcis « +1 jour ». */
const model = defineModel<GameDate>({ required: true })
const props = withDefaults(defineProps<{ showShortcuts?: boolean; idPrefix?: string }>(), {
  showShortcuts: true,
  idPrefix: 'date',
})
const { game } = useGame()

const weekday = computed(() =>
  game.value ? WEEKDAY_LABELS[weekdayOf(model.value, game.value.calendar.firstWeekday)] : null,
)

function setDay(day: number) {
  model.value = { ...model.value, day: Math.min(30, Math.max(1, Math.round(day) || 1)) }
}
function setYear(year: number) {
  model.value = { ...model.value, year: Math.min(999, Math.max(1, Math.round(year) || 1)) }
}
function shift(days: number) {
  model.value = addDays(model.value, days)
}
</script>

<template>
  <fieldset class="date-picker">
    <legend class="visually-hidden">Date dans le jeu</legend>
    <div class="date-picker__seasons" role="radiogroup" :aria-label="'Saison'">
      <label v-for="s in SEASONS" :key="s" class="season-choice" :class="`season-choice--${s}`">
        <input
          type="radio"
          :name="`${props.idPrefix}-season`"
          :value="s"
          :checked="model.season === s"
          @change="model = { ...model, season: s }"
        />
        <span>{{ SEASON_LABELS[s] }}</span>
      </label>
    </div>
    <div class="date-picker__row">
      <div class="stepper">
        <label :for="`${idPrefix}-day`">Jour</label>
        <div class="stepper__control">
          <button type="button" aria-label="Jour précédent" @click="shift(-1)">−</button>
          <input
            :id="`${idPrefix}-day`"
            type="number"
            inputmode="numeric"
            min="1"
            max="30"
            :value="model.day"
            class="pixel"
            @change="setDay(Number(($event.target as HTMLInputElement).value))"
          />
          <button type="button" aria-label="Jour suivant" @click="shift(1)">+</button>
        </div>
      </div>
      <div class="stepper">
        <label :for="`${idPrefix}-year`">Année</label>
        <div class="stepper__control">
          <button type="button" aria-label="Année précédente" @click="setYear(model.year - 1)">−</button>
          <input
            :id="`${idPrefix}-year`"
            type="number"
            inputmode="numeric"
            min="1"
            max="999"
            :value="model.year"
            class="pixel"
            @change="setYear(Number(($event.target as HTMLInputElement).value))"
          />
          <button type="button" aria-label="Année suivante" @click="setYear(model.year + 1)">+</button>
        </div>
      </div>
      <p v-if="weekday" class="date-picker__weekday">
        <PixelIcon name="calendar" :size="18" /> {{ weekday }}
      </p>
    </div>
    <div v-if="showShortcuts" class="date-picker__shortcuts">
      <GameButton variant="paper" size="sm" @click="shift(1)">+1 jour</GameButton>
      <GameButton variant="paper" size="sm" @click="shift(3)">+3 jours</GameButton>
      <GameButton variant="paper" size="sm" @click="shift(7)">+1 semaine</GameButton>
    </div>
  </fieldset>
</template>

<style scoped>
.date-picker {
  margin: 0;
  padding: 0;
  border: 0;
  display: grid;
  gap: var(--space-3);
  min-width: 0;
}
.date-picker__seasons {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}
.season-choice {
  position: relative;
}
.season-choice input {
  position: absolute;
  opacity: 0;
  inset: 0;
}
.season-choice span {
  display: grid;
  place-items: center;
  min-height: var(--tap);
  padding: 0.3rem 0.2rem;
  border: 3px solid var(--wood-900);
  border-radius: var(--radius-sm);
  background: var(--paper-50);
  font-weight: 800;
  font-size: var(--text-sm);
  text-align: center;
  cursor: pointer;
  box-shadow: 0 3px 0 var(--wood-900);
}
.season-choice input:checked + span {
  color: #fff;
  text-shadow: 0 1px 0 rgb(0 0 0 / 0.4);
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--wood-900);
}
.season-choice--spring input:checked + span {
  background: #a8345e;
}
.season-choice--summer input:checked + span {
  background: #915c00;
}
.season-choice--autumn input:checked + span {
  background: #c4501d;
}
.season-choice--winter input:checked + span {
  background: #5b55b0;
}
.season-choice input:focus-visible + span {
  outline: 3px solid var(--wood-900);
  outline-offset: 3px;
  box-shadow: 0 0 0 6px var(--sun);
}
.date-picker__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-4);
}
.stepper label {
  display: block;
  margin-bottom: 4px;
  font-weight: 800;
  font-size: var(--text-sm);
}
.stepper__control {
  display: flex;
  align-items: stretch;
  border: 3px solid var(--wood-900);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--paper-50);
}
.stepper__control:focus-within {
  outline: 3px solid var(--wood-900);
  outline-offset: 3px;
}
.stepper__control :focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 3px var(--sun);
}
.stepper__control button {
  width: var(--tap);
  min-height: var(--tap);
  border: 0;
  background: var(--wood-200);
  font-size: 1.4rem;
  font-weight: 800;
  cursor: pointer;
}
.stepper__control button:hover {
  background: var(--wood-300);
}
.stepper__control input {
  width: 3.6rem;
  border: 0;
  border-inline: 3px solid var(--wood-900);
  background: transparent;
  text-align: center;
  font-size: 1.3rem;
  -moz-appearance: textfield;
}
.stepper__control input::-webkit-inner-spin-button {
  display: none;
}
.date-picker__weekday {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-weight: 800;
  color: var(--ink-soft);
}
.date-picker__shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
